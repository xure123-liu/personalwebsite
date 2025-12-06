import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import { getImageUrl } from '../utils/config';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [works, setWorks] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [messageForm, setMessageForm] = useState({ name: '', email: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 根据语言设置分类
  const categories = language === 'zh' 
    ? ['All', '交易类', '直播类', '游戏类', '工具类', '系统类']
    : ['All', 'Trading', 'Live Streaming', 'Game', 'Tool', 'System'];

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
      setSubmitStatus({ type: 'error', message: t('home.fillAllFields') });
      return;
    }

    if (!messageForm.email.includes('@') || !messageForm.email.includes('.')) {
      setSubmitStatus({ type: 'error', message: t('home.invalidEmail') });
      return;
    }

    try {
      await api.createMessage(messageForm);
      setSubmitStatus({ type: 'success', message: t('home.submitSuccess') });
      setMessageForm({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: error.response?.data?.error || t('home.submitFailed')
      });
    }
  };

  const scrollToWorks = () => {
    const element = document.getElementById('works');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-avatar">
            {profile?.avatar ? (
              <img src={getImageUrl(profile.avatar)} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder"></div>
            )}
          </div>
          <h1 className="hero-greeting">{t('home.greeting')} {profile?.name || 'Xure'}</h1>
          <h2 className="hero-title">{profile?.main_title || 'Building digital photos, brands and memories'}</h2>
          <p className="hero-description">
            {profile?.hero_description || ''}
          </p>
          <button className="hero-button" onClick={scrollToWorks}>
            {t('home.moreDetails')}
          </button>
          <button className="hero-arrow" onClick={scrollToWorks}>
            ↓
          </button>
        </div>
      </section>

      {/* About Me Section */}
      <section id="about" className="about">
        <div className="container">
          <h2 className="section-title">{t('home.aboutMe')}</h2>
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
                          src={getImageUrl(currentImage)} 
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
                  <h4>{t('home.skills')}</h4>
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
          <h2 className="section-title">{t('home.myLatestWorks')}</h2>
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
                <h3>{work.name}</h3>
                {work.description && <p>{work.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog/Thoughts Section */}
      <section id="thoughts" className="blog">
        <div className="container">
          <h2 className="section-title">{t('home.blog')}</h2>
          <div className="blog-grid">
            {thoughts.map((thought, index) => (
              <div 
                key={thought.id} 
                className={`blog-card ${index === 0 ? 'featured' : ''}`}
                onClick={() => navigate(`/thoughts/${thought.id}`)}
                style={{ cursor: 'pointer' }}
              >
              {thought.image && (
                <img src={getImageUrl(thought.image)} alt={thought.title} />
              )}
                <div className="blog-content">
                  <h3>{thought.title} →</h3>
                  <p>{thought.content}</p>
                  <div className="blog-meta">
                    <span>{thought.views || 0}{t('home.views')}</span>
                    <span>{new Date(thought.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
              <h2 className="section-title">{t('home.contactMe')}</h2>
            </div>
            <div className="contact-form-container">
              <h3>{t('home.letsTalk')}</h3>
              <p className="form-subtitle">{t('home.tellMeAboutIdea')}</p>
              <form onSubmit={handleSubmitMessage} className="contact-form">
                <div className="form-group">
                  <label>{t('home.name')}</label>
                  <input
                    type="text"
                    placeholder={t('home.namePlaceholder')}
                    value={messageForm.name}
                    onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('home.email')}</label>
                  <input
                    type="email"
                    placeholder={t('home.emailPlaceholder')}
                    value={messageForm.email}
                    onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('home.message')}</label>
                  <textarea
                    placeholder={t('home.messagePlaceholder')}
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
                <button type="submit" className="submit-button">{t('home.sendMessages')}</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


