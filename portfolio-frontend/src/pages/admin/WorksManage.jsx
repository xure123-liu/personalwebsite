import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import api from '../../services/api';
import './Manage.css';

const WorksManage = ({ onLogout }) => {
  const [works, setWorks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    images: [],
    images_paths: [],
    category: '交易类',
    sort_order: 0
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imagesPreview, setImagesPreview] = useState([]);
  const [message, setMessage] = useState('');

  const categories = ['交易类', '直播类', '游戏类', '工具类', '系统类'];

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    try {
      const res = await api.getWorks('All');
      // 按sort_order排序
      const sortedWorks = [...res.data].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setWorks(sortedWorks);
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

  const handleImagesChange = (files) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const newFiles = fileArray.filter(file => file instanceof File);
      
      // 合并新文件和现有文件
      const allFiles = [...formData.images.filter(item => item instanceof File), ...newFiles];
      setFormData({ ...formData, images: allFiles });
      
      // 更新预览
      const previews = [];
      allFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === allFiles.length) {
            setImagesPreview([...formData.images.filter(item => typeof item === 'string'), ...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
    
    const newPreviews = [...imagesPreview];
    newPreviews.splice(index, 1);
    setImagesPreview(newPreviews);
  };

  const handleEdit = (work) => {
    setEditing(work.id);
    const images = work.images ? (typeof work.images === 'string' ? JSON.parse(work.images) : work.images) : [];
    setFormData({
      name: work.name || '',
      description: work.description || '',
      image: null,
      images: images.map(img => img), // 现有图片路径作为字符串
      images_paths: images,
      category: work.category || '交易类',
      sort_order: work.sort_order || 0
    });
    if (work.image) {
      setImagePreview(`http://localhost:3002${work.image}`);
    } else {
      setImagePreview('');
    }
    setImagesPreview(images.map(img => `http://localhost:3002${img}`));
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      name: '',
      description: '',
      image: null,
      images: [],
      images_paths: [],
      category: '交易类',
      sort_order: 0
    });
    setImagePreview('');
    setImagesPreview([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const submitData = { ...formData };
      
      // 确保所有文本字段都有值
      submitData.name = submitData.name || '';
      submitData.description = submitData.description || '';
      submitData.category = submitData.category || '交易类';
      submitData.sort_order = submitData.sort_order || 0;
      
      // 分离文件对象和字符串路径
      const imagesArray = Array.isArray(submitData.images) ? submitData.images : [];
      const fileObjects = imagesArray.filter(item => item instanceof File);
      const stringPaths = imagesArray.filter(item => typeof item === 'string');
      
      // 新文件通过images字段发送
      if (fileObjects.length > 0) {
        submitData.images = fileObjects;
      } else {
        delete submitData.images;
      }
      
      // 现有图片路径通过images_paths字段发送（即使为空也要发送）
      submitData.images_paths = JSON.stringify(stringPaths);
      
      // 清理submitData，移除不需要的字段
      const cleanSubmitData = {
        name: submitData.name,
        description: submitData.description,
        category: submitData.category,
        sort_order: submitData.sort_order,
        images_paths: submitData.images_paths
      };
      
      // 只添加文件字段（如果存在）
      if (submitData.image && submitData.image instanceof File) {
        cleanSubmitData.image = submitData.image;
      }
      if (submitData.images && Array.isArray(submitData.images) && submitData.images.length > 0) {
        cleanSubmitData.images = submitData.images.filter(item => item instanceof File);
      }
      
      console.log('提交的数据:', {
        ...cleanSubmitData,
        images: cleanSubmitData.images ? `${cleanSubmitData.images.length} files` : 'no files',
        image: cleanSubmitData.image ? 'has file' : 'no file'
      });
      
      if (editing) {
        await api.updateWork(editing, cleanSubmitData);
        setMessage('更新成功！');
        // 立即重新加载列表以同步排序值
        await loadWorks();
        setTimeout(() => {
          setMessage('');
          handleCancel();
        }, 1500);
      } else {
        await api.createWork(cleanSubmitData);
        setMessage('创建成功！');
        setTimeout(() => {
          setMessage('');
          handleCancel();
          loadWorks();
        }, 1500);
      }
    } catch (error) {
      console.error('提交失败:', error);
      setMessage(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个作品吗？')) return;

    try {
      await api.deleteWork(id);
      setMessage('删除成功！');
      setTimeout(() => {
        setMessage('');
        loadWorks();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '删除失败');
    }
  };


  return (
    <div className="manage-page">
      <AdminNav onLogout={onLogout} />
      <div className="manage-content">
        <h1>作品管理</h1>
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
            <label>封面图片</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="preview-image" />
            )}
          </div>
          <div className="form-group">
            <label>详情图片（多图）</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImagesChange(e.target.files)}
            />
            <div className="about-images-preview">
              {imagesPreview.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview} alt={`Preview ${index}`} />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>分类</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>排序（数字越小越靠前）</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
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
          <h2>作品列表</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>排序</th>
                  <th>ID</th>
                  <th>名称</th>
                  <th>分类</th>
                  <th>图片</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {works.map((work, index) => (
                  <tr key={work.id}>
                    <td>{work.sort_order !== undefined && work.sort_order !== null ? work.sort_order : 0}</td>
                    <td>{work.id}</td>
                    <td>{work.name}</td>
                    <td>{work.category}</td>
                    <td>
                      {work.image && (
                        <img src={`http://localhost:3002${work.image}`} alt={work.name} className="table-image" />
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleEdit(work)} className="edit-button">编辑</button>
                      <button onClick={() => handleDelete(work.id)} className="delete-button">删除</button>
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

export default WorksManage;
