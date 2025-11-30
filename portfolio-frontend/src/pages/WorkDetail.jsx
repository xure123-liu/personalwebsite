import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import './WorkDetail.css';

const WorkDetail = () => {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return <div className="work-detail-loading">加载中...</div>;
  }

  if (!work) {
    return <div className="work-detail-error">作品不存在</div>;
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
                  src={`http://localhost:3002${image}`} 
                  alt={`${work.name} - ${index + 1}`}
                />
              </div>
            ))
          ) : (
            <div className="work-detail-no-images">暂无图片</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;
