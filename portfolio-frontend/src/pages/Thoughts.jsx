import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Thoughts.css';

const Thoughts = () => {
  const navigate = useNavigate();
  const [thoughts, setThoughts] = useState([]);

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
        <h1 className="page-title">My Thoughts</h1>
        <div className="thoughts-grid">
          {thoughts.map(thought => (
            <div 
              key={thought.id} 
              className="thought-card"
              onClick={() => navigate(`/thoughts/${thought.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {thought.image && (
                <img src={`http://localhost:3002${thought.image}`} alt={thought.title} />
              )}
              <div className="thought-content">
                <h3>{thought.title}</h3>
                <p>{thought.content}</p>
                <div className="thought-meta">
                  <span>{thought.views || 0}K views</span>
                  <span>{new Date(thought.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {thoughts.length === 0 && (
          <div className="empty-state">
            <p>暂无思考内容</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Thoughts;


