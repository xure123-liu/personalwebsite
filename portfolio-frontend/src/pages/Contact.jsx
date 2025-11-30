import { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import './Contact.css';

const Contact = () => {
  const [profile, setProfile] = useState(null);
  const [messageForm, setMessageForm] = useState({ name: '', email: '', message: '' });
  const [toast, setToast] = useState({ message: '', type: 'success' });

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
      setToast({ type: 'error', message: '请填写所有必填字段' });
      return;
    }

    if (!messageForm.email.includes('@') || !messageForm.email.includes('.')) {
      setToast({ type: 'error', message: '邮箱格式不正确' });
      return;
    }

    try {
      await api.createMessage(messageForm);
      setToast({ type: 'success', message: '留言提交成功！' });
      setMessageForm({ name: '', email: '', message: '' });
    } catch (error) {
      setToast({ 
        type: 'error', 
        message: error.response?.data?.error || '提交失败，请稍后重试' 
      });
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        <h1 className="page-title">Contact Me</h1>
        <div className="contact-content">
          <div className="contact-info">
            {profile?.email && (
              <div className="contact-item contact-item-email">
                <div className="email-row">
                  <h3>Email</h3>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              </div>
            )}
            {profile?.wechat_qr && (
              <div className="contact-item contact-item-left">
                <h3>WeChat</h3>
                <img src={`http://localhost:3002${profile.wechat_qr}`} alt="WeChat QR" />
              </div>
            )}
            {profile?.qq_qr && (
              <div className="contact-item contact-item-left">
                <h3>QQ</h3>
                <img src={`http://localhost:3002${profile.qq_qr}`} alt="QQ QR" />
              </div>
            )}
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
              <button type="submit" className="submit-button">Send Messages</button>
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


