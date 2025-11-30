import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [works, setWorks] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [messageForm, setMessageForm] = useState({ name: '', email: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const categories = ['All', '交易类', '直播类', '游戏类', '工具类', '系统类'];

  // About me图片轮播
  useEffect(() => {
    if (profile?.about_images) {
      try {
        const images = typeof profile.about_images === 'string' 
          ? JSON.parse(profile.about_images) 
          : profile.about_images;
        
        if (images && images.length > 1) {
          const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
          }, 5000); // 5秒轮播一次

          return () => clearInterval(interval);
        }
      } catch (e) {
        console.error('解析about_images失败:', e);
      }
    }
  }, [profile?.about_images]);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [profileRes, worksRes, thoughtsRes] = await Promise.all([
        api.getProfile(),
        api.getWorks(selectedCategory),
        api.getThoughts()
      ]);
      setProfile(profileRes.data);
      // 后端已经按sort_order排序，直接使用
      setWorks(worksRes.data.slice(0, 9)); /* 显示9个作品，符合3x3布局 */
      setThoughts(thoughtsRes.data.slice(0, 6));
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (!messageForm.name || !messageForm.email || !messageForm.message) {
      setSubmitStatus({ type: 'error', message: '请填写所有必填字段' });
      return;
    }

    if (!messageForm.email.includes('@') || !messageForm.email.includes('.')) {
      setSubmitStatus({ type: 'error', message: '邮箱格式不正确' });
      return;
    }

    try {
      await api.createMessage(messageForm);
      setSubmitStatus({ type: 'success', message: '留言提交成功！' });
      setMessageForm({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: error.response?.data?.error || '提交失败，请稍后重试' 
      });
    }
  };

  const scrollToWorks = () => {
    const element = document.getElementById('works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-avatar">
            {profile?.avatar ? (
              <img src={`http://localhost:3002${profile.avatar}`} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder"></div>
            )}
          </div>
          <h1 className="hero-greeting">Hi, I'm {profile?.name || 'Xure'}</h1>
          <h2 className="hero-title">{profile?.main_title || 'Building digital photos, brands and memories'}</h2>
          <p className="hero-description">
            {profile?.hero_description || ''}
          </p>
          <button className="hero-button" onClick={scrollToWorks}>
            MORE DETAILS
          </button>
          <button className="hero-arrow" onClick={scrollToWorks}>
            ↓
          </button>
        </div>
      </section>

      {/* About Me Section */}
      <section id="about" className="about">
        <div className="container">
          <h2 className="section-title">About Me</h2>
          <h3 className="section-subtitle">{profile?.sub_title || 'Nature itself inspires me'}</h3>
          <div className="about-content">
            <div className="about-image">
              {(() => {
                try {
                  const images = profile?.about_images 
                    ? (typeof profile.about_images === 'string' 
                        ? JSON.parse(profile.about_images) 
                        : profile.about_images)
                    : [];
                  
                  if (images && images.length > 0) {
                    const currentImage = images[currentImageIndex];
                    return (
                      <div className="image-carousel">
                        <img 
                          src={`http://localhost:3002${currentImage}`} 
                          alt="About" 
                          key={currentImageIndex}
                          className="carousel-image"
                        />
                        {images.length > 1 && (
                          <div className="carousel-indicators">
                            {images.map((_, index) => (
                              <span
                                key={index}
                                className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                                onClick={() => setCurrentImageIndex(index)}
                              ></span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return <div className="image-placeholder"></div>;
                  }
                } catch (e) {
                  return <div className="image-placeholder"></div>;
                }
              })()}
            </div>
            <div className="about-text">
              <p>{profile?.about_description || ''}</p>
              {profile?.skills && (
                <div className="skills">
                  <h4>Skills:</h4>
                  <p>{profile.skills}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* My Latest Works Section */}
      <section id="works" className="works">
        <div className="container">
          <h2 className="section-title">My latest works</h2>
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
                <h3>{work.name}</h3>
                {work.description && <p>{work.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog/Thoughts Section */}
      <section className="blog">
        <div className="container">
          <h2 className="section-title">Blog</h2>
          <div className="blog-grid">
            {thoughts.map((thought, index) => (
              <div 
                key={thought.id} 
                className={`blog-card ${index === 0 ? 'featured' : ''}`}
                onClick={() => navigate(`/thoughts/${thought.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {thought.image && (
                  <img src={`http://localhost:3002${thought.image}`} alt={thought.title} />
                )}
                <div className="blog-content">
                  <h3>{thought.title} →</h3>
                  <p>{thought.content}</p>
                  <div className="blog-meta">
                    <span>{thought.views || 0}K views</span>
                    <span>{new Date(thought.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Me Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="contact-content">
            <div className="contact-title-wrapper">
              <h2 className="section-title">Contact me</h2>
            </div>
            <div className="contact-form-container">
              <h3>Let's Talk!</h3>
              <p className="form-subtitle">Tell me about your idea here</p>
              <form onSubmit={handleSubmitMessage} className="contact-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={messageForm.name}
                    onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="contato@email.com"
                    value={messageForm.email}
                    onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    placeholder="Leave your contact details and message, and I'll get back to you ASAP."
                    rows="5"
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  ></textarea>
                </div>
                {submitStatus && (
                  <div className={`submit-status ${submitStatus.type}`}>
                    {submitStatus.message}
                  </div>
                )}
                <button type="submit" className="submit-button">Send Messages</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


