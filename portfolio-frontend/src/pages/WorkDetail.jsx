import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import { getImageUrl } from '../utils/config';
import './WorkDetail.css';

const WorkDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 页面加载时滚动到顶部，确保标题不被导航栏遮挡
    window.scrollTo({ top: 0, behavior: 'instant' });
    loadWork();
  }, [id]);

  const loadWork = async () => {
    try {
      const res = await api.getWork(id);
      setWork(res.data);
    } catch (error) {
      console.error('加载作品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="work-detail-loading">{t('workDetail.loading')}</div>;
  }

  if (!work) {
    return <div className="work-detail-error">{t('workDetail.notFound')}</div>;
  }

  // 解析多图
  let images = [];
  if (work.images) {
    try {
      images = typeof work.images === 'string' ? JSON.parse(work.images) : work.images;
    } catch (e) {
      console.error('解析图片失败:', e);
    }
  }

  // 如果没有多图，使用封面图
  if (images.length === 0 && work.image) {
    images = [work.image];
  }

  return (
    <div className="work-detail">
      <div className="work-detail-container">
        <div className="work-detail-header">
          <h1>{work.name}</h1>
          {work.description && <p className="work-detail-description">{work.description}</p>}
        </div>
        <div className="work-detail-images">
          {images.length > 0 ? (
            images.map((image, index) => (
              <div key={index} className="work-detail-image-item">
                <img 
                  src={getImageUrl(image)} 
                  alt={`${work.name} - ${index + 1}`}
                />
              </div>
            ))
          ) : (
            <div className="work-detail-no-images">{t('workDetail.noImages')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;
