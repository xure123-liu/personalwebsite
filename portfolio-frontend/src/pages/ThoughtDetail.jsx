import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import './ThoughtDetail.css';

const ThoughtDetail = () => {
  const { id } = useParams();
  const [thought, setThought] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return <div className="thought-detail-loading">加载中...</div>;
  }

  if (!thought) {
    return <div className="thought-detail-error">思考不存在</div>;
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
                  src={`http://localhost:3002${image}`} 
                  alt={`${thought.title} - ${index + 1}`}
                />
              </div>
            ))
          ) : (
            <div className="thought-detail-no-images">暂无图片</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThoughtDetail;
