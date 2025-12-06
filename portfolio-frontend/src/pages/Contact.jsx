import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';
import Toast from '../components/Toast';
import { getImageUrl } from '../utils/config';
import './Contact.css';

const Contact = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [messageForm, setMessageForm] = useState({ name: '', email: '', message: '' });
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

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

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    setToast({ message: '', type: 'success' });

    if (!messageForm.name || !messageForm.email || !messageForm.message) {
      setToast({ type: 'error', message: t('contact.fillAllFields') });
      return;
    }

    if (!messageForm.email.includes('@') || !messageForm.email.includes('.')) {
      setToast({ type: 'error', message: t('contact.invalidEmail') });
      return;
    }

    try {
      await api.createMessage(messageForm);
      setToast({ type: 'success', message: t('contact.submitSuccess') });
      setMessageForm({ name: '', email: '', message: '' });
    } catch (error) {
      setToast({ 
        type: 'error', 
        message: error.response?.data?.error || t('contact.submitFailed')
      });
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        <h1 className="page-title">{t('contact.title')}</h1>
        <div className="contact-content">
          <div className="contact-info">
            {profile?.email && (
              <div className="contact-item contact-item-email">
                <div className="email-row">
                  <h3>{t('contact.email')}</h3>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              </div>
            )}
            {profile?.wechat_qr && (
              <div className="contact-item contact-item-left">
                <h3>WeChat</h3>
                <img src={getImageUrl(profile.wechat_qr)} alt="WeChat QR" />
              </div>
            )}
            {profile?.qq_qr && (
              <div className="contact-item contact-item-left">
                <h3>QQ</h3>
                <img src={getImageUrl(profile.qq_qr)} alt="QQ QR" />
              </div>
            )}
          </div>
          <div className="contact-form-container">
            <h3>{t('contact.letsTalk')}</h3>
            <p className="form-subtitle">{t('contact.tellMeAboutIdea')}</p>
            <form onSubmit={handleSubmitMessage} className="contact-form">
              <div className="form-group">
                <label>{t('contact.name')}</label>
                <input
                  type="text"
                  placeholder={t('contact.namePlaceholder')}
                  value={messageForm.name}
                  onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('contact.email')}</label>
                <input
                  type="email"
                  placeholder={t('contact.emailPlaceholder')}
                  value={messageForm.email}
                  onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('contact.message')}</label>
                <textarea
                  placeholder={t('contact.messagePlaceholder')}
                  rows="5"
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" className="submit-button">{t('contact.sendMessages')}</button>
            </form>
          </div>
        </div>
      </div>
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default Contact;


