import { useState, useEffect } from 'react';
import api from '../services/api';
import './Gallery.css';

const Gallery = () => {
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
        <h1 className="page-title">Gallery</h1>
        <div className="gallery-grid">
          {gallery.map(item => (
            <div key={item.id} className="gallery-item">
              {item.image ? (
                <img src={`http://localhost:3002${item.image}`} alt={item.name} />
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
            <p>暂无图册内容</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;


