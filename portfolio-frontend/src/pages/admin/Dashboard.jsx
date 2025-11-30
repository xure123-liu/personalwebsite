import { Link } from 'react-router-dom';
import AdminNav from './AdminNav';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  return (
    <div className="dashboard">
      <AdminNav onLogout={onLogout} />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <div className="dashboard-grid">
          <Link to="/admin/profile" className="dashboard-card">
            <h3>个人信息管理</h3>
            <p>管理头像、简介、联系方式等</p>
          </Link>
          <Link to="/admin/works" className="dashboard-card">
            <h3>作品管理</h3>
            <p>添加、编辑、删除作品</p>
          </Link>
          <Link to="/admin/thoughts" className="dashboard-card">
            <h3>思考管理</h3>
            <p>管理思考沉淀内容</p>
          </Link>
          <Link to="/admin/gallery" className="dashboard-card">
            <h3>图册管理</h3>
            <p>管理个人图册</p>
          </Link>
          <Link to="/admin/messages" className="dashboard-card">
            <h3>留言管理</h3>
            <p>查看和管理用户留言</p>
          </Link>
          <Link to="/admin/links" className="dashboard-card">
            <h3>友情链接</h3>
            <p>管理友情链接</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


