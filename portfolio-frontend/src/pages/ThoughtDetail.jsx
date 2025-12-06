import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import { getImageUrl } from '../utils/config';
import './ThoughtDetail.css';

const ThoughtDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [thought, setThought] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 页面加载时滚动到顶部，确保标题不被导航栏遮挡
    window.scrollTo({ top: 0, behavior: 'instant' });
    loadThought();
  }, [id]);

  const loadThought = async () => {
    try {
      const res = await api.getThought(id);
      setThought(res.data);
    } catch (error) {
      console.error('加载思考失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="thought-detail-loading">{t('thoughtDetail.loading')}</div>;
  }

  if (!thought) {
    return <div className="thought-detail-error">{t('thoughtDetail.notFound')}</div>;
  }

  // 解析多图
  let images = [];
  if (thought.images) {
    try {
      images = typeof thought.images === 'string' ? JSON.parse(thought.images) : thought.images;
    } catch (e) {
      console.error('解析图片失败:', e);
    }
  }

  // 如果没有多图，使用封面图
  if (images.length === 0 && thought.image) {
    images = [thought.image];
  }

  return (
    <div className="thought-detail">
      <div className="thought-detail-container">
        <div className="thought-detail-header">
          <h1>{thought.title}</h1>
          {thought.content && <p className="thought-detail-content">{thought.content}</p>}
        </div>
        <div className="thought-detail-images">
          {images.length > 0 ? (
            images.map((image, index) => (
              <div key={index} className="thought-detail-image-item">
                <img 
                  src={getImageUrl(image)} 
                  alt={`${thought.title} - ${index + 1}`}
                />
              </div>
            ))
          ) : (
            <div className="thought-detail-no-images">{t('thoughtDetail.noImages')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThoughtDetail;
