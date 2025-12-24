#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Face Verification Microservice
Kimlik fotoğrafı ve selfie karşılaştırma servisi
"""

import sys
import json
import os
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


def verify_faces(id_card_path: str, selfie_path: str) -> dict:
    """
    İki resim arasındaki yüzleri karşılaştır.
    
    Args:
        id_card_path: Kimlik kartı fotoğrafının dosya yolu
        selfie_path: Selfie fotoğrafının dosya yolu
    
    Returns:
        dict: match, score ve error bilgilerini içeren sonuç
    """
    result = {
        "match": False,
        "score": 0.0,
        "error": None
    }
    
    # Dosya varlık kontrolü
    if not os.path.exists(id_card_path):
        result["error"] = f"Kimlik fotoğrafı bulunamadı: {id_card_path}"
        return result
    
    if not os.path.exists(selfie_path):
        result["error"] = f"Selfie fotoğrafı bulunamadı: {selfie_path}"
        return result
    
    try:
        # Kimlik fotoğrafını yükle ve yüz encoding'ini al (RGB'ye dönüştür)
        id_card_image = load_image_as_rgb(id_card_path)
        id_card_encodings = face_recognition.face_encodings(id_card_image)
        
        if len(id_card_encodings) == 0:
            result["error"] = "Kimlik fotoğrafında yüz tespit edilemedi"
            return result
        
        if len(id_card_encodings) > 1:
            result["error"] = "Kimlik fotoğrafında birden fazla yüz tespit edildi"
            return result
        
        id_card_encoding = id_card_encodings[0]
        
        # Selfie fotoğrafını yükle ve yüz encoding'ini al (RGB'ye dönüştür)
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
        # face_distance: 0'a yakın = benzer, büyük = farklı
        face_distance = face_recognition.face_distance([id_card_encoding], selfie_encoding)[0]
        
        # Benzerlik skoru hesapla (1 - distance, 0-1 arasında)
        similarity_score = max(0, 1 - face_distance)
        result["score"] = round(float(similarity_score), 4)
        
        # Eşleşme kontrolü (threshold: 0.6 - tolerance 0.4 ile uyumlu)
        # Tolerance 0.4 = distance < 0.6 ise eşleşme
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
