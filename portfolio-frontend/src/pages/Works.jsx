import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Works.css';

const Works = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', '交易类', '直播类', '游戏类', '工具类', '系统类'];

  useEffect(() => {
    loadWorks();
  }, [selectedCategory]);

  const loadWorks = async () => {
    try {
      const res = await api.getWorks(selectedCategory);
      setWorks(res.data);
    } catch (error) {
      console.error('加载作品失败:', error);
    }
  };

  return (
    <div className="works-page">
      <div className="container">
        <h1 className="page-title">My Works</h1>
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="works-grid">
          {works.map(work => (
            <div 
              key={work.id} 
              className="work-card"
              onClick={() => navigate(`/works/${work.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {work.image ? (
                <img src={`http://localhost:3002${work.image}`} alt={work.name} />
              ) : (
                <div className="work-placeholder"></div>
              )}
              <div className="work-info">
                <h3>{work.name}</h3>
                {work.description && <p>{work.description}</p>}
              </div>
            </div>
          ))}
        </div>
        {works.length === 0 && (
          <div className="empty-state">
            <p>暂无作品</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Works;


