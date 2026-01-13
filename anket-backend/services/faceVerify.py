import sys
import json
import os
import hashlib
import numpy as np

try:
    import face_recognition
    import cv2
except ImportError as e:
    print(json.dumps({
        "match": False,
        "score": 0,
        "error": f"Gerekli kutuphane yuklu degil: {str(e)}. 'pip install face_recognition opencv-python' komutunu calistirin."
    }))
    sys.exit(1)


def calculate_file_hash(file_path: str) -> str:
    """Dosyanın MD5 hash'ini hesapla"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def load_image_as_rgb(image_path: str):
    """
    OpenCV ile resmi yukle ve RGB formatina cevir.
    Bu yontem dlib/face_recognition ile en uyumlu yontemdir.
    """
    try:
        # OpenCV ile oku (BGR formatinda okur)
        img = cv2.imread(image_path)
        
        if img is None:
            raise Exception(f"Resim yuklenemedi: {image_path}")
        
        # BGR -> RGB donusumu (face_recognition RGB bekler)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # uint8 ve contiguous array oldugundan emin ol
        img_rgb = np.ascontiguousarray(img_rgb, dtype=np.uint8)
        
        return img_rgb
    except Exception as e:
        raise Exception(f"Resim yuklenemedi: {str(e)}")


def get_face_ratio(image_path: str) -> dict:
    """
    Görüntüdeki yüzün boyut oranını hesapla.
    Kimlik kartlarında yüz küçük (~%10-35), selfie'lerde büyük (~%25-80)
    
    Returns:
        dict: face_found, face_ratio, image_dimensions
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"face_found": False, "error": "Resim yüklenemedi"}
        
        img_height, img_width = img.shape[:2]
        img_area = img_height * img_width
        
        # Yüz tespiti için RGB'ye çevir
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(img_rgb)
        
        if len(face_locations) == 0:
            return {"face_found": False, "error": "Yüz tespit edilemedi"}
        
        # İlk yüzü al
        top, right, bottom, left = face_locations[0]
        face_width = right - left
        face_height = bottom - top
        face_area = face_width * face_height
        
        face_ratio = face_area / img_area
        
        return {
            "face_found": True,
            "face_ratio": round(face_ratio, 4),
            "image_width": img_width,
            "image_height": img_height,
            "face_width": face_width,
            "face_height": face_height
        }
    except Exception as e:
        return {"face_found": False, "error": str(e)}


def is_likely_id_card(face_ratio_result: dict, aspect_ratio: float) -> dict:
    """
    Görüntünün kimlik kartı olup olmadığını analiz et.
    
    Kriterler:
    1. Yüz oranı: Küçük olmalı (kimlik kartında yüz küçük, selfie'de büyük)
    2. Aspect ratio: Yatay dikdörtgen tercih edilir (1.2 - 2.0)
    
    Returns:
        dict: is_id_card, confidence, reason
    """
    if not face_ratio_result.get("face_found"):
        return {"is_id_card": False, "confidence": 0, "reason": face_ratio_result.get("error", "Yüz bulunamadı")}
    
    face_ratio = face_ratio_result.get("face_ratio", 0)
    
    # Kimlik kartı kriterleri - daha toleranslı
    # Yüz görüntünün %0.5-%50'sini kaplayabilir (kimlik kartlarında yüz küçük olabilir)
    min_ratio = 0.005  # %0.5 - çok küçük yüzleri de kabul et
    max_ratio = 0.50   # %50 - bundan büyükse selfie
    
    if face_ratio < min_ratio:
        return {"is_id_card": False, "confidence": 0.3, "reason": "Yüz tespit edilemedi veya çok küçük"}
    
    if face_ratio > max_ratio:
        return {"is_id_card": False, "confidence": 0.9, "reason": "Bu görüntü kimlik kartı değil, selfie gibi görünüyor. Lütfen kimlik kartınızın ön yüzünü yükleyin."}
    
    # Aspect ratio kontrolü (opsiyonel)
    confidence = 0.85
    if 1.2 <= aspect_ratio <= 1.9:
        confidence = 0.95  # Yatay dikdörtgen - kimlik kartı formatına uygun
    
    return {"is_id_card": True, "confidence": confidence, "reason": "Kimlik kartı formatına uygun", "face_ratio": face_ratio}


def is_likely_selfie(face_ratio_result: dict) -> dict:
    """
    Görüntünün selfie olup olmadığını analiz et.
    
    Kriterler:
    1. Yüz oranı: %15-%80 arası (selfie'de yüz büyük)
    """
    if not face_ratio_result.get("face_found"):
        return {"is_selfie": False, "confidence": 0, "reason": face_ratio_result.get("error", "Yüz bulunamadı")}
    
    face_ratio = face_ratio_result.get("face_ratio", 0)
    
    # Selfie kriterleri - yüz görüntünün %15-%80'ini kaplamalı
    min_ratio = 0.10  # %10
    max_ratio = 0.85  # %85
    
    if face_ratio < min_ratio:
        return {"is_selfie": False, "confidence": 0.7, "reason": "Yüz çok küçük - yakın çekilmiş bir selfie olmalı"}
    
    if face_ratio > max_ratio:
        return {"is_selfie": False, "confidence": 0.5, "reason": "Yüz çok büyük - görüntü bozuk olabilir"}
    
    return {"is_selfie": True, "confidence": 0.9, "reason": "Selfie formatına uygun", "face_ratio": face_ratio}


def verify_faces(id_card_path: str, selfie_path: str) -> dict:
    """
    İki resim arasındaki yüzleri karşılaştır.
    
    Güvenlik kontrolleri:
    1. Aynı dosya kontrolü (hash)
    2. Kimlik kartı formatı kontrolü
    3. Selfie formatı kontrolü
    4. Yüz eşleştirme
    """
    result = {
        "match": False,
        "score": 0.0,
        "error": None,
        "security_checks": {}
    }
    
    # Dosya varlık kontrolü
    if not os.path.exists(id_card_path):
        result["error"] = f"Kimlik fotoğrafı bulunamadı: {id_card_path}"
        return result
    
    if not os.path.exists(selfie_path):
        result["error"] = f"Selfie fotoğrafı bulunamadı: {selfie_path}"
        return result
    
    try:
        # GÜVENLİK KONTROLÜ 1: Aynı dosya mı?
        id_hash = calculate_file_hash(id_card_path)
        selfie_hash = calculate_file_hash(selfie_path)
        
        if id_hash == selfie_hash:
            result["error"] = "Kimlik kartı ve selfie aynı dosya olamaz! Lütfen farklı görüntüler yükleyin."
            result["security_checks"]["same_file"] = True
            return result
        
        result["security_checks"]["same_file"] = False
        
        # GÜVENLİK KONTROLÜ 2: Kimlik kartı formatı kontrolü
        id_card_img = cv2.imread(id_card_path)
        id_height, id_width = id_card_img.shape[:2]
        id_aspect_ratio = id_width / id_height
        
        id_face_ratio = get_face_ratio(id_card_path)
        id_card_check = is_likely_id_card(id_face_ratio, id_aspect_ratio)
        
        result["security_checks"]["id_card_analysis"] = id_card_check
        
        if not id_card_check["is_id_card"]:
            result["error"] = f"Kimlik kartı tespit edilemedi: {id_card_check['reason']}"
            return result
        
        # GÜVENLİK KONTROLÜ 3: Selfie formatı kontrolü
        selfie_face_ratio = get_face_ratio(selfie_path)
        selfie_check = is_likely_selfie(selfie_face_ratio)
        
        result["security_checks"]["selfie_analysis"] = selfie_check
        
        if not selfie_check["is_selfie"]:
            result["error"] = f"Selfie formatı uygun değil: {selfie_check['reason']}"
            return result
        
        # Kimlik fotoğrafını yükle ve yüz encoding'ini al
        id_card_image = load_image_as_rgb(id_card_path)
        id_card_encodings = face_recognition.face_encodings(id_card_image)
        
        if len(id_card_encodings) == 0:
            result["error"] = "Kimlik fotoğrafında yüz tespit edilemedi"
            return result
        
        if len(id_card_encodings) > 1:
            result["error"] = "Kimlik fotoğrafında birden fazla yüz tespit edildi"
            return result
        
        id_card_encoding = id_card_encodings[0]
        
        # Selfie fotoğrafını yükle ve yüz encoding'ini al
        selfie_image = load_image_as_rgb(selfie_path)
        selfie_encodings = face_recognition.face_encodings(selfie_image)
        
        if len(selfie_encodings) == 0:
            result["error"] = "Selfie fotoğrafında yüz tespit edilemedi"
            return result
        
        if len(selfie_encodings) > 1:
            result["error"] = "Selfie fotoğrafında birden fazla yüz tespit edildi"
            return result
        
        selfie_encoding = selfie_encodings[0]
        
        # Yüzleri karşılaştır
        face_distance = face_recognition.face_distance([id_card_encoding], selfie_encoding)[0]
        
        # Benzerlik skoru hesapla (1 - distance, 0-1 arasında)
        similarity_score = max(0, 1 - face_distance)
        result["score"] = round(float(similarity_score), 4)
        
        # Eşleşme kontrolü (tolerance 0.5)
        matches = face_recognition.compare_faces([id_card_encoding], selfie_encoding, tolerance=0.5)
        result["match"] = bool(matches[0])
        
        return result
        
    except Exception as e:
        result["error"] = f"Yüz karşılaştırma hatası: {str(e)}"
        return result


def main():
    """Ana fonksiyon - komut satırı argümanlarını işle"""
    
    if len(sys.argv) != 3:
        print(json.dumps({
            "match": False,
            "score": 0,
            "error": "Kullanım: python faceVerify.py <kimlik_foto_yolu> <selfie_yolu>"
        }))
        sys.exit(1)
    
    id_card_path = sys.argv[1]
    selfie_path = sys.argv[2]
    
    result = verify_faces(id_card_path, selfie_path)
    
    # JSON olarak stdout'a yaz
    print(json.dumps(result, ensure_ascii=False))
    
    # Eşleşme durumuna göre exit code
    sys.exit(0 if result["match"] else 1)


if __name__ == "__main__":
    main()


