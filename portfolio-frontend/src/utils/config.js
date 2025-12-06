// 获取图片完整 URL
export const getImageUrl = (path) => {
  if (!path) return '';
  
  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 生产环境使用环境变量，开发环境使用 localhost
  if (import.meta.env.PROD) {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    return apiUrl ? `${apiUrl}${path}` : path;
  }
  
  return `http://localhost:3002${path}`;
};

