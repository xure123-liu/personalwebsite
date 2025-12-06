import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import { getImageUrl } from '../utils/config';
import './Thoughts.css';

const Thoughts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [thoughts, setThoughts] = useState([]);

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      const res = await api.getThoughts();
      setThoughts(res.data);
    } catch (error) {
      console.error('加载思考失败:', error);
    }
  };

  return (
    <div className="thoughts-page">
      <div className="container">
        <h1 className="page-title">{t('thoughts.title')}</h1>
        <div className="thoughts-grid">
          {thoughts.map(thought => (
            <div 
              key={thought.id} 
              className="thought-card"
              onClick={() => navigate(`/thoughts/${thought.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {thought.image && (
                <img src={getImageUrl(thought.image)} alt={thought.title} />
              )}
              <div className="thought-content">
                <h3>{thought.title}</h3>
                <p>{thought.content}</p>
                <div className="thought-meta">
                  <span>{thought.views || 0}{t('home.views')}</span>
                  <span>{new Date(thought.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {thoughts.length === 0 && (
          <div className="empty-state">
            <p>{t('thoughts.noThoughts')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Thoughts;


