import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import api from '../../services/api';
import { getImageUrl } from '../../utils/config';
import './Manage.css';

const GalleryManage = ({ onLogout }) => {
  const [gallery, setGallery] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const res = await api.getGallery();
      setGallery(res.data);
    } catch (error) {
      console.error('加载失败:', error);
    }
  };

  const handleFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setFormData({ ...formData, image: file });
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      image: null
    });
    if (item.image) {
      setImagePreview(getImageUrl(item.image));
    } else {
      setImagePreview('');
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      name: '',
      description: '',
      image: null
    });
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editing) {
        await api.updateGalleryItem(editing, formData);
        setMessage('更新成功！');
      } else {
        await api.createGalleryItem(formData);
        setMessage('创建成功！');
      }
      setTimeout(() => {
        setMessage('');
        handleCancel();
        loadGallery();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个图册吗？')) return;

    try {
      await api.deleteGalleryItem(id);
      setMessage('删除成功！');
      setTimeout(() => {
        setMessage('');
        loadGallery();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '删除失败');
    }
  };

  return (
    <div className="manage-page">
      <AdminNav onLogout={onLogout} />
      <div className="manage-content">
        <h1>图册管理</h1>
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
            <label>描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>图片</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="preview-image" />
            )}
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
          <h2>图册列表</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名称</th>
                  <th>图片</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {gallery.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>
                      {item.image && (
                        <img src={getImageUrl(item.image)} alt={item.name} className="table-image" />
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleEdit(item)} className="edit-button">编辑</button>
                      <button onClick={() => handleDelete(item.id)} className="delete-button">删除</button>
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

export default GalleryManage;


