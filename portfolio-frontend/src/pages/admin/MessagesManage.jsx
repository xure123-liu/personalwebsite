import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import api from '../../services/api';
import './Manage.css';

const MessagesManage = ({ onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await api.getMessages();
      setMessages(res.data);
    } catch (error) {
      console.error('加载失败:', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateMessage(id, { status });
      setMessage('状态更新成功！');
      setTimeout(() => {
        setMessage('');
        loadMessages();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '更新失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这条留言吗？')) return;

    try {
      await api.deleteMessage(id);
      setMessage('删除成功！');
      setTimeout(() => {
        setMessage('');
        loadMessages();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '删除失败');
    }
  };

  return (
    <div className="manage-page">
      <AdminNav onLogout={onLogout} />
      <div className="manage-content">
        <h1>留言管理</h1>
        {message && (
          <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        <div className="list-section">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>姓名</th>
                  <th>邮箱</th>
                  <th>留言内容</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(msg => (
                  <tr key={msg.id}>
                    <td>{msg.id}</td>
                    <td>{msg.name}</td>
                    <td>{msg.email}</td>
                    <td>{msg.message}</td>
                    <td>
                      <select
                        value={msg.status}
                        onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="unread">未读</option>
                        <option value="read">已读</option>
                        <option value="replied">已回复</option>
                      </select>
                    </td>
                    <td>{new Date(msg.created_at).toLocaleString()}</td>
                    <td>
                      <button onClick={() => handleDelete(msg.id)} className="delete-button">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesManage;


