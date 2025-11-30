import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Footer.css';

const Footer = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getProfile();
      setProfile(res.data);
    } catch (error) {
      console.error('加载个人信息失败:', error);
    }
  };

  const scrollToSection = (sectionId) => {
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
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
          <h3 className="footer-title">Quick links</h3>
          <ul className="footer-links">
            <li>
              <Link to="/" onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>Home</Link>
            </li>
            <li>
              <a href="#about" onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}>About me</a>
            </li>
            <li>
              <a href="#works" onClick={(e) => {
                e.preventDefault();
                scrollToSection('works');
              }}>Work</a>
            </li>
            <li>
              <a href="#contact" onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}>Contact me</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">SCAN to ADD</h3>
          <div className="footer-qr-codes">
            {profile?.wechat_qr && (
              <div className="qr-code-item">
                <img src={`http://localhost:3002${profile.wechat_qr}`} alt="WeChat QR" />
                <span>WeChat</span>
              </div>
            )}
            {profile?.qq_qr && (
              <div className="qr-code-item">
                <img src={`http://localhost:3002${profile.qq_qr}`} alt="QQ QR" />
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
          <h3 className="footer-title">FOLLOW ME</h3>
          <div className="social-links">
            <a href="#" className="social-icon">Twitter</a>
            <a href="#" className="social-icon">Instagram</a>
            <a href="#" className="social-icon">Dribbble</a>
            <a href="#" className="social-icon">Facebook</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright © 2025. All Right Reserved by Xure</p>
      </div>
    </footer>
  );
};

export default Footer;


