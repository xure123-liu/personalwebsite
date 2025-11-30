import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import api from '../../services/api';
import './Manage.css';

const LinksManage = ({ onLogout }) => {
  const [links, setLinks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const res = await api.getLinks();
      setLinks(res.data);
    } catch (error) {
      console.error('加载失败:', error);
    }
  };

  const handleEdit = (link) => {
    setEditing(link.id);
    setFormData({
      name: link.name || '',
      url: link.url || ''
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      name: '',
      url: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editing) {
        await api.updateLink(editing, formData);
        setMessage('更新成功！');
      } else {
        await api.createLink(formData);
        setMessage('创建成功！');
      }
      setTimeout(() => {
        setMessage('');
        handleCancel();
        loadLinks();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个链接吗？')) return;

    try {
      await api.deleteLink(id);
      setMessage('删除成功！');
      setTimeout(() => {
        setMessage('');
        loadLinks();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '删除失败');
    }
  };

  return (
    <div className="manage-page">
      <AdminNav onLogout={onLogout} />
      <div className="manage-content">
        <h1>友情链接管理</h1>
        {message && (
          <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="manage-form">
          <div className="form-group">
            <label>名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>链接 *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              {editing ? '更新' : '创建'}
            </button>
            {editing && (
              <button type="button" onClick={handleCancel} className="cancel-button">
                取消
              </button>
            )}
          </div>
        </form>

        <div className="list-section">
          <h2>链接列表</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名称</th>
                  <th>链接</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id}>
                    <td>{link.id}</td>
                    <td>{link.name}</td>
                    <td><a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></td>
                    <td>
                      <button onClick={() => handleEdit(link)} className="edit-button">编辑</button>
                      <button onClick={() => handleDelete(link.id)} className="delete-button">删除</button>
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

export default LinksManage;


