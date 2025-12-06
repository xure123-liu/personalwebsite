import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import { getImageUrl } from '../utils/config';
import './Works.css';

const Works = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [works, setWorks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // 根据语言设置分类
  const categories = language === 'zh' 
    ? ['All', '交易类', '直播类', '游戏类', '工具类', '系统类']
    : ['All', 'Trading', 'Live Streaming', 'Game', 'Tool', 'System'];

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

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
        <h1 className="page-title">{t('works.title')}</h1>
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'All' ? t('home.all') : category}
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
                <img src={getImageUrl(work.image)} alt={work.name} />
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
            <p>{t('works.noWorks')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Works;


