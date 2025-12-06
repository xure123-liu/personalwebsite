import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import { getImageUrl } from '../utils/config';
import './Gallery.css';

const Gallery = () => {
  const { t } = useLanguage();
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const res = await api.getGallery();
      setGallery(res.data);
    } catch (error) {
      console.error('加载图册失败:', error);
    }
  };

  return (
    <div className="gallery-page">
      <div className="container">
        <h1 className="page-title">{t('gallery.title')}</h1>
        <div className="gallery-grid">
          {gallery.map(item => (
            <div key={item.id} className="gallery-item">
              {item.image ? (
                <img src={getImageUrl(item.image)} alt={item.name} />
              ) : (
                <div className="gallery-placeholder"></div>
              )}
              {item.name && <h3>{item.name}</h3>}
              {item.description && <p>{item.description}</p>}
            </div>
          ))}
        </div>
        {gallery.length === 0 && (
          <div className="empty-state">
            <p>{t('gallery.noGallery')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;


