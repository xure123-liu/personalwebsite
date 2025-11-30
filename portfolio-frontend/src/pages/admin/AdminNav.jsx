import { Link, useLocation } from 'react-router-dom';
import './Manage.css';

const AdminNav = ({ onLogout }) => {
  const location = useLocation();

  // 判断导航项是否激活
  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-header">
      <div className="admin-nav">
        <Link to="/admin/dashboard" className="admin-logo">
          <img src="/logo.svg" alt="Logo" />
        </Link>
        <nav className="admin-menu">
          <Link 
            to="/admin/dashboard" 
            className={isActive('/admin/dashboard') ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/profile" 
            className={isActive('/admin/profile') ? 'active' : ''}
          >
            个人信息
          </Link>
          <Link 
            to="/admin/works" 
            className={isActive('/admin/works') ? 'active' : ''}
          >
            作品管理
          </Link>
          <Link 
            to="/admin/thoughts" 
            className={isActive('/admin/thoughts') ? 'active' : ''}
          >
            思考管理
          </Link>
          <Link 
            to="/admin/gallery" 
            className={isActive('/admin/gallery') ? 'active' : ''}
          >
            图册管理
          </Link>
          <Link 
            to="/admin/messages" 
            className={isActive('/admin/messages') ? 'active' : ''}
          >
            留言管理
          </Link>
          <Link 
            to="/admin/links" 
            className={isActive('/admin/links') ? 'active' : ''}
          >
            友情链接
          </Link>
        </nav>
        <button onClick={onLogout} className="logout-button">退出登录</button>
      </div>
    </div>
  );
};

export default AdminNav;

