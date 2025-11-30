import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Login from './admin/Login';
import Dashboard from './admin/Dashboard';
import ProfileManage from './admin/ProfileManage';
import WorksManage from './admin/WorksManage';
import ThoughtsManage from './admin/ThoughtsManage';
import GalleryManage from './admin/GalleryManage';
import MessagesManage from './admin/MessagesManage';
import LinksManage from './admin/LinksManage';
import './Admin.css';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  };

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/admin');
  };

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin">
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <ProfileManage onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/works"
          element={
            isAuthenticated ? (
              <WorksManage onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/thoughts"
          element={
            isAuthenticated ? (
              <ThoughtsManage onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/gallery"
          element={
            isAuthenticated ? (
              <GalleryManage onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/messages"
          element={
            isAuthenticated ? (
              <MessagesManage onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/links"
          element={
            isAuthenticated ? (
              <LinksManage onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default Admin;


