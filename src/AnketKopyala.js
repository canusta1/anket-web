import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSpinner, FaClipboardList, FaPlus, FaEdit } from 'react-icons/fa';
import './AnketKopyala.css';

function AnketKopyala() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/giris');
        return;
      }

      const res = await fetch('/api/surveys', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Anketler yüklenemedi');

      const payload = await res.json();
      const items = payload?.data ?? [];
      setTemplates(items);
      console.log('✅ Şablonlar yüklendi:', items);
    } catch (err) {
      console.error('❌ Şablon yükleme hatası:', err);
      alert('Anketler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    const convertedTemplate = {
      ...template,
      sorular: (template.sorular || []).map((soru) => {
        // Seçenekleri düzgün çek
        let secenekler = [];
        
        if (soru.secenekler && Array.isArray(soru.secenekler)) {
          secenekler = soru.secenekler.map(sec => {
            if (typeof sec === 'string') {
              return sec;
            } else if (sec && typeof sec === 'object') {
              // Object ise metin/metni alanını al
              return sec.metin || sec.metni || sec.text || '';
            }
            return '';
          }).filter(s => s.length > 0);
        }

        return {
          id: Math.random(),
          metin: soru.soruMetni || soru.metin || soru.soru || '',
          tip: soru.soruTipi || soru.tip || 'acik-uclu',
          secenekler: secenekler,
          zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : false
        };
      })
    };

    console.log('✅ Dönüştürülen Template:', convertedTemplate);
    console.log('📋 Soruları ve seçenekleri:', convertedTemplate.sorular);
    navigate('/sifirdan-anket', { state: { template: convertedTemplate } });
  };

  return (
    <div className="anket-kopyala-container">
      {/* Header */}
      <div className="ak-header">
        <button 
          className="ak-btn-back" 
          onClick={() => navigate('/anket-olustur')}
        >
          <FaArrowLeft /> Geri Dön
        </button>
        <h1>📋 Önceki Anketleri Düzenle</h1>
        <p className="ak-subtitle">Daha önce oluşturduğunuz anketleri kopyalayıp düzenleyebilirsiniz</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="ak-loading">
          <FaSpinner className="spinner" />
          <p>Anketler yükleniyor...</p>
        </div>
      ) : templates.length === 0 ? (
        /* Empty State */
        <div className="ak-empty">
          <FaClipboardList className="empty-icon" />
          <h2>Henüz Anket Oluşturmadınız</h2>
          <p>Yeni bir anket oluşturmaya başlayın</p>
          <button 
            className="ak-btn-new"
            onClick={() => navigate('/sifirdan-anket')}
          >
            <FaPlus /> Yeni Anket Oluştur
          </button>
        </div>
      ) : (
        /* Template Grid */
        <div className="ak-grid">
          {templates.map((template) => (
            <div key={template._id} className="ak-card">
              <div className="ak-card-header">
                <FaClipboardList className="ak-card-icon" />
                <h3>{template.anketBaslik || 'Başlıksız Anket'}</h3>
              </div>

              <div className="ak-card-body">
                {template.anketAciklama && (
                  <p className="ak-description">{template.anketAciklama}</p>
                )}
                
                <div className="ak-stats">
                  <div className="ak-stat">
                    <span className="stat-label">Sorular</span>
                    <span className="stat-value">{template.sorular?.length || 0}</span>
                  </div>
                  {template.toplamKatilimci && (
                    <div className="ak-stat">
                      <span className="stat-label">Cevaplar</span>
                      <span className="stat-value">{template.toplamKatilimci}</span>
                    </div>
                  )}
                </div>

                {template.olusturulmaTarihi && (
                  <p className="ak-date">
                    Oluşturulma: {new Date(template.olusturulmaTarihi).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>

              <div className="ak-card-footer">
                <button
                  className="ak-btn-copy"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <FaEdit /> Kopyala ve Düzenle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnketKopyala;
