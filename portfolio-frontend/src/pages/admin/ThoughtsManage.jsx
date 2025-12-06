import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import api from '../../services/api';
import { getImageUrl } from '../../utils/config';
import './Manage.css';

const ThoughtsManage = ({ onLogout }) => {
  const [thoughts, setThoughts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_detail: '',
    image: null,
    images: [],
    images_paths: [],
    sort_order: 0
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imagesPreview, setImagesPreview] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      const res = await api.getThoughts();
      // 按sort_order排序
      const sortedThoughts = [...res.data].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setThoughts(sortedThoughts);
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

  const handleEdit = (thought) => {
    setEditing(thought.id);
    const images = thought.images ? (typeof thought.images === 'string' ? JSON.parse(thought.images) : thought.images) : [];
    setFormData({
      title: thought.title || '',
      content: thought.content || '',
      content_detail: thought.content_detail || '',
      image: null,
      images: images.map(img => String(img)), // 现有图片路径作为字符串，用于预览和提交
      sort_order: thought.sort_order || 0
    });
    if (thought.image) {
      setImagePreview(getImageUrl(thought.image));
    } else {
      setImagePreview('');
    }
    setImagesPreview(images.map(img => getImageUrl(img)));
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      title: '',
      content: '',
      content_detail: '',
      image: null,
      images: [],
      images_paths: [],
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
      submitData.title = submitData.title || '';
      submitData.content = submitData.content || '';
      submitData.content_detail = submitData.content_detail || '';
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
        title: submitData.title,
        content: submitData.content,
        content_detail: submitData.content_detail,
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
        await api.updateThought(editing, cleanSubmitData);
        setMessage('更新成功！');
        // 立即重新加载列表以同步排序值
        await loadThoughts();
        setTimeout(() => {
          setMessage('');
          handleCancel();
        }, 1500);
      } else {
        await api.createThought(cleanSubmitData);
        setMessage('创建成功！');
        setTimeout(() => {
          setMessage('');
          handleCancel();
          loadThoughts();
        }, 1500);
      }
    } catch (error) {
      console.error('提交失败:', error);
      setMessage(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个思考吗？')) return;

    try {
      await api.deleteThought(id);
      setMessage('删除成功！');
      setTimeout(() => {
        setMessage('');
        loadThoughts();
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.error || '删除失败');
    }
  };


  return (
    <div className="manage-page">
      <AdminNav onLogout={onLogout} />
      <div className="manage-content">
        <h1>思考管理</h1>
        {message && (
          <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="manage-form">
          <div className="form-group">
            <label>标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>简介</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows="5"
            />
          </div>
          <div className="form-group">
            <label>内容详情</label>
            <textarea
              value={formData.content_detail}
              onChange={(e) => setFormData({ ...formData, content_detail: e.target.value })}
              rows="10"
              style={{ minHeight: '200px' }}
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
          <h2>思考列表</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>排序</th>
                  <th>ID</th>
                  <th>标题</th>
                  <th>图片</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {thoughts.map((thought, index) => (
                  <tr key={thought.id}>
                    <td>{thought.sort_order !== undefined && thought.sort_order !== null ? thought.sort_order : 0}</td>
                    <td>{thought.id}</td>
                    <td>{thought.title}</td>
                    <td>
                      {thought.image && (
                        <img src={getImageUrl(thought.image)} alt={thought.title} className="table-image" />
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleEdit(thought)} className="edit-button">编辑</button>
                      <button onClick={() => handleDelete(thought.id)} className="delete-button">删除</button>
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

export default ThoughtsManage;
