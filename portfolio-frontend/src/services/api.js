import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理401错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

export default {
  // 认证
  login: (username, password) => api.post('/login', { username, password }),

  // 个人信息
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'avatar' || key === 'wechat_qr' || key === 'qq_qr') {
        if (data[key] instanceof File) {
          formData.append(key, data[key]);
        }
      } else if (key === 'about_images') {
        // about_images是文件数组
        if (Array.isArray(data[key])) {
          data[key].forEach((file) => {
            if (file instanceof File) {
              formData.append('about_images', file);
            }
          });
        }
      } else if (key === 'about_images_paths') {
        // about_images_paths是现有图片路径的JSON字符串，作为独立字段发送
        // 即使为空字符串也要发送（可能是 "[]"）
        if (data[key] !== undefined && data[key] !== null) {
          formData.append('about_images_paths', data[key]);
        }
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.put('/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 作品
  getWorks: (category) => api.get('/works', { params: { category } }),
  getWork: (id) => api.get(`/works/${id}`),
  createWork: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'image' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key === 'images') {
        // images是文件数组
        if (Array.isArray(data[key])) {
          data[key].forEach((file) => {
            if (file instanceof File) {
              formData.append('images', file);
            }
          });
        }
      } else if (key === 'images_paths') {
        // images_paths是现有图片路径的JSON字符串
        if (data[key] !== undefined && data[key] !== null) {
          formData.append('images_paths', data[key]);
        }
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/works', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateWork: (id, data) => {
    const formData = new FormData();
    
    // 只发送需要的字段
    if (data.name !== undefined && data.name !== null) {
      formData.append('name', String(data.name));
    }
    if (data.description !== undefined && data.description !== null) {
      formData.append('description', String(data.description));
    }
    if (data.category !== undefined && data.category !== null) {
      formData.append('category', String(data.category));
    }
    if (data.sort_order !== undefined && data.sort_order !== null) {
      formData.append('sort_order', String(data.sort_order));
    }
    
    // 处理封面图片
    if (data.image && data.image instanceof File) {
      formData.append('image', data.image);
    }
    
    // 处理多图文件
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((file) => {
        if (file instanceof File) {
          formData.append('images', file);
        }
      });
    }
    
    // 处理现有图片路径
    if (data.images_paths !== undefined && data.images_paths !== null) {
      formData.append('images_paths', String(data.images_paths));
    }
    
    return api.put(`/works/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteWork: (id) => api.delete(`/works/${id}`),
  updateWorksSort: (items) => api.put('/works/sort', { items }),
  getWork: (id) => api.get(`/works/${id}`),

  // 思考沉淀
  getThoughts: () => api.get('/thoughts'),
  getThought: (id) => api.get(`/thoughts/${id}`),
  createThought: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'image' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key === 'images') {
        // images是文件数组
        if (Array.isArray(data[key])) {
          data[key].forEach((file) => {
            if (file instanceof File) {
              formData.append('images', file);
            }
          });
        }
      } else if (key === 'images_paths') {
        // images_paths是现有图片路径的JSON字符串
        if (data[key] !== undefined && data[key] !== null) {
          formData.append('images_paths', data[key]);
        }
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/thoughts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateThought: (id, data) => {
    const formData = new FormData();
    
    // 只发送需要的字段
    if (data.title !== undefined && data.title !== null) {
      formData.append('title', String(data.title));
    }
    if (data.content !== undefined && data.content !== null) {
      formData.append('content', String(data.content));
    }
    if (data.sort_order !== undefined && data.sort_order !== null) {
      formData.append('sort_order', String(data.sort_order));
    }
    
    // 处理封面图片
    if (data.image && data.image instanceof File) {
      formData.append('image', data.image);
    }
    
    // 处理多图文件
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((file) => {
        if (file instanceof File) {
          formData.append('images', file);
        }
      });
    }
    
    // 处理现有图片路径
    if (data.images_paths !== undefined && data.images_paths !== null) {
      formData.append('images_paths', String(data.images_paths));
    }
    
    return api.put(`/thoughts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteThought: (id) => api.delete(`/thoughts/${id}`),
  updateThoughtsSort: (items) => api.put('/thoughts/sort', { items }),
  getThought: (id) => api.get(`/thoughts/${id}`),
  updateThoughtsSort: (items) => api.put('/thoughts/sort', { items }),

  // 图册
  getGallery: () => api.get('/gallery'),
  createGalleryItem: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'image' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateGalleryItem: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'image' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/gallery/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteGalleryItem: (id) => api.delete(`/gallery/${id}`),

  // 留言
  createMessage: (data) => api.post('/messages', data),
  getMessages: () => api.get('/messages'),
  updateMessage: (id, data) => api.put(`/messages/${id}`, data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),

  // 友情链接
  getLinks: () => api.get('/links'),
  createLink: (data) => api.post('/links', data),
  updateLink: (id, data) => api.put(`/links/${id}`, data),
  deleteLink: (id) => api.delete(`/links/${id}`),
};


