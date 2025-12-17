import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import { getImageUrl } from '../utils/config';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    loadProfile();
    loadLinks();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getProfile();
      setProfile(res.data);
    } catch (error) {
      console.error('加载个人信息失败:', error);
    }
  };

  const loadLinks = async () => {
    try {
      const res = await api.getLinks();
      setLinks(res.data || []);
    } catch (error) {
      console.error('加载友情链接失败:', error);
    }
  };

  const scrollToSection = (sectionId) => {
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <img src="/logo.svg" alt="XR Logo" />
          </div>
          <div className="footer-contact">
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span>{profile?.address || 'Yongchuan District, Chongqing Municipality, P.R. China'}</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">✉️</span>
              <span>{profile?.email || 'EMAIL@PHOTO.COM'}</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">{t('footer.quickLinks')}</h3>
          <ul className="footer-links">
            <li>
              <Link to="/" onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>{t('footer.home')}</Link>
            </li>
            <li>
              <a href="#about" onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}>{t('footer.aboutMe')}</a>
            </li>
            <li>
              <a href="#works" onClick={(e) => {
                e.preventDefault();
                scrollToSection('works');
              }}>{t('footer.work')}</a>
            </li>
            <li>
              <a href="#thoughts" onClick={(e) => {
                e.preventDefault();
                scrollToSection('thoughts');
              }}>{t('footer.thoughts')}</a>
            </li>
            <li>
              <a href="#contact" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>{t('footer.contactMe')}</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">{t('footer.scanToAdd')}</h3>
          <div className="footer-qr-codes">
            {profile?.wechat_qr && (
              <div className="qr-code-item">
                <img src={getImageUrl(profile.wechat_qr)} alt="WeChat QR" />
                <span>WeChat</span>
              </div>
            )}
            {profile?.qq_qr && (
              <div className="qr-code-item">
                <img src={getImageUrl(profile.qq_qr)} alt="QQ QR" />
                <span>QQ</span>
              </div>
            )}
            {!profile?.wechat_qr && !profile?.qq_qr && (
              <div className="footer-gallery">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="gallery-placeholder"></div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">{t('footer.followMe')}</h3>
          <div className="social-links">
            {links.length > 0 ? (
              links.map(link => (
                <a 
                  key={link.id}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-icon"
                >
                  {link.name}
                </a>
              ))
            ) : (
              // 如果没有友情链接，显示占位符
              <>
            <a href="#" className="social-icon">Twitter</a>
            <a href="#" className="social-icon">Instagram</a>
            <a href="#" className="social-icon">Dribbble</a>
            <a href="#" className="social-icon">Facebook</a>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t('footer.copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer;


