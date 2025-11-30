import { useState, useEffect } from 'react';
import AdminNav from './AdminNav';
import api from '../../services/api';
import './Manage.css';

const ProfileManage = ({ onLogout }) => {
  const [profile, setProfile] = useState({
    avatar: null,
    name: '',
    main_title: '',
    sub_title: '',
    hero_description: '',
    about_description: '',
    about_images: [],
    skills: '',
    wechat_qr: null,
    qq_qr: null,
    email: '',
    address: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [wechatPreview, setWechatPreview] = useState('');
  const [qqPreview, setQqPreview] = useState('');
  const [aboutImagesPreview, setAboutImagesPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getProfile();
      const data = res.data || {};
      
      // 解析about_images
      let aboutImages = [];
      if (data.about_images) {
        try {
          aboutImages = typeof data.about_images === 'string' 
            ? JSON.parse(data.about_images) 
            : data.about_images;
        } catch (e) {
          aboutImages = [];
        }
      }
      
      setProfile({
        avatar: null,
        name: data.name || '',
        main_title: data.main_title || '',
        sub_title: data.sub_title || '',
        hero_description: data.hero_description || data.description || '',
        about_description: data.about_description || data.description || '',
        about_images: aboutImages, // 保存现有图片路径到state中
        skills: data.skills || '',
        wechat_qr: null,
        qq_qr: null,
        email: data.email || '',
        address: data.address || ''
      });
      
      if (data.avatar) setAvatarPreview(`http://localhost:3002${data.avatar}`);
      if (data.wechat_qr) setWechatPreview(`http://localhost:3002${data.wechat_qr}`);
      if (data.qq_qr) setQqPreview(`http://localhost:3002${data.qq_qr}`);
      
      // 设置about_images预览
      if (aboutImages && aboutImages.length > 0) {
        setAboutImagesPreview(aboutImages.map(img => `http://localhost:3002${img}`));
      }
    } catch (error) {
      console.error('加载失败:', error);
    }
  };

  const handleFileChange = (field, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'avatar') setAvatarPreview(reader.result);
        if (field === 'wechat_qr') setWechatPreview(reader.result);
        if (field === 'qq_qr') setQqPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setProfile({ ...profile, [field]: file });
    }
  };

  const handleAboutImagesChange = (files) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // 获取已存在的图片（字符串路径）
      const existingImages = profile.about_images.filter(img => typeof img === 'string');
      
      // 计算当前总数量（现有图片 + 新选择的文件）
      const totalCount = existingImages.length + fileArray.length;
      
      // 限制最多5张
      if (totalCount > 5) {
        const allowedCount = 5 - existingImages.length;
        if (allowedCount > 0) {
          fileArray.splice(allowedCount); // 只保留允许的数量
          setMessage(`最多只能上传5张图片，已选择${allowedCount}张新图片`);
          setTimeout(() => setMessage(''), 3000);
        } else {
          setMessage('最多只能上传5张图片，请先删除一些现有图片');
          setTimeout(() => setMessage(''), 3000);
          return;
        }
      }
      
      // 合并新文件和已存在的图片
      const newImages = [...existingImages, ...fileArray];
      setProfile({ ...profile, about_images: newImages });
      
      // 预览所有图片（包括已存在的和新上传的）
      const existingPreviews = aboutImagesPreview.filter(preview => !preview.startsWith('data:'));
      const newPreviews = [];
      
      fileArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews[index] = reader.result;
          if (newPreviews.length === fileArray.length) {
            setAboutImagesPreview([...existingPreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      // 如果只有已存在的图片，直接设置
      if (fileArray.length === 0 && existingPreviews.length > 0) {
        setAboutImagesPreview(existingPreviews);
      }
    }
  };

  const removeAboutImage = (index) => {
    const newImages = [...profile.about_images];
    newImages.splice(index, 1);
    setProfile({ ...profile, about_images: newImages });
    
    const newPreviews = [...aboutImagesPreview];
    newPreviews.splice(index, 1);
    setAboutImagesPreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 准备提交数据
      const submitData = { ...profile };
      
      // 确保所有文本字段都被发送（包括空字符串）
      // 移除文件对象，它们会单独处理
      const textFields = {
        name: submitData.name || '',
        main_title: submitData.main_title || '',
        sub_title: submitData.sub_title || '',
        hero_description: submitData.hero_description || '',
        about_description: submitData.about_description || '',
        skills: submitData.skills || '',
        email: submitData.email || '',
        address: submitData.address || ''
      };
      
      // 合并文本字段
      Object.assign(submitData, textFields);
      
      // about_images处理：分离文件对象和字符串路径
      // 先删除原始的about_images，避免混淆
      const originalAboutImages = submitData.about_images;
      delete submitData.about_images;
      
      if (Array.isArray(originalAboutImages)) {
        const fileObjects = originalAboutImages.filter(item => item instanceof File);
        const stringPaths = originalAboutImages.filter(item => typeof item === 'string');
        
        // 新文件通过about_images字段发送
        if (fileObjects.length > 0) {
          submitData.about_images = fileObjects; // 新文件数组
        }
        
        // 现有图片路径通过单独的字段传递（即使为空也要传递，以便后端知道要清空）
        submitData.about_images_paths = JSON.stringify(stringPaths);
      } else {
        // 如果不是数组，确保也传递空数组
        submitData.about_images_paths = JSON.stringify([]);
      }
      
      console.log('提交的数据:', {
        ...submitData,
        about_images: submitData.about_images ? `${submitData.about_images.length} files` : 'no files',
        avatar: submitData.avatar ? 'has file' : 'no file',
        wechat_qr: submitData.wechat_qr ? 'has file' : 'no file',
        qq_qr: submitData.qq_qr ? 'has file' : 'no file'
      });
      
      await api.updateProfile(submitData);
      setMessage('保存成功！');
      setTimeout(() => {
        setMessage('');
        loadProfile(); // 重新加载以获取服务器返回的图片路径
      }, 1500);
    } catch (error) {
      console.error('保存失败:', error);
      setMessage(error.response?.data?.error || error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-page">
      <AdminNav onLogout={onLogout} />
      <div className="manage-content">
        <h1>个人信息管理</h1>
        <form onSubmit={handleSubmit} className="manage-form">
          <div className="form-section">
            <h2>头像</h2>
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('avatar', e.target.files[0])}
              />
              {avatarPreview && (
                <img src={avatarPreview} alt="Avatar preview" className="preview-image" />
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>基本信息</h2>
            <div className="form-group">
              <label>个人名称（Hi, I'm 后面的名称）</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="例如：Xure"
              />
            </div>
            <div className="form-group">
              <label>主标题（大标题）</label>
              <input
                type="text"
                value={profile.main_title}
                onChange={(e) => setProfile({ ...profile, main_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>副标题</label>
              <input
                type="text"
                value={profile.sub_title}
                onChange={(e) => setProfile({ ...profile, sub_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>首页描述（Hero区域描述）</label>
              <textarea
                value={profile.hero_description}
                onChange={(e) => setProfile({ ...profile, hero_description: e.target.value })}
                rows="5"
              />
            </div>
            <div className="form-group">
              <label>About Me描述</label>
              <textarea
                value={profile.about_description}
                onChange={(e) => setProfile({ ...profile, about_description: e.target.value })}
                rows="5"
              />
            </div>
            <div className="form-group">
              <label>技能</label>
              <textarea
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                rows="3"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>About Me 图片（支持多张，5秒轮播，最多5张）</h2>
            <div className="form-group">
              <label>上传图片（可多选，最多5张）</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleAboutImagesChange(e.target.files)}
              />
              {aboutImagesPreview.length > 0 && (
                <p className="image-count-hint">
                  当前已选择 {aboutImagesPreview.length} / 5 张图片
                </p>
              )}
              {aboutImagesPreview.length > 0 && (
                <div className="about-images-preview">
                  {aboutImagesPreview.map((preview, index) => (
                    <div key={index} className="about-image-item">
                      <img src={preview} alt={`About ${index + 1}`} className="preview-image" />
                      <button
                        type="button"
                        onClick={() => removeAboutImage(index)}
                        className="remove-image-button"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>联系方式</h2>
            <div className="form-group">
              <label>邮箱</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>地址</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Yongchuan District, Chongqing Municipality, P.R. China"
              />
            </div>
            <div className="form-group">
              <label>微信二维码（显示在底部SCAN to ADD）</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('wechat_qr', e.target.files[0])}
              />
              {wechatPreview && (
                <img src={wechatPreview} alt="WeChat QR preview" className="preview-image" />
              )}
            </div>
            <div className="form-group">
              <label>QQ二维码（显示在底部SCAN to ADD）</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('qq_qr', e.target.files[0])}
              />
              {qqPreview && (
                <img src={qqPreview} alt="QQ QR preview" className="preview-image" />
              )}
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileManage;


