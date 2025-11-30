import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('');

  // 监听滚动，判断当前所在的区域
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const aboutSection = document.getElementById('about');
      
      if (aboutSection) {
        const aboutTop = aboutSection.offsetTop - 150; // 考虑header高度
        
        // 如果滚动位置在about区域上方，激活home；否则激活about
        if (scrollY < aboutTop) {
          setActiveSection('home');
        } else {
          setActiveSection('about');
        }
      } else {
        setActiveSection('home');
      }
    };

    // 检查hash - 如果URL中有#about，激活about
    if (location.hash === '#about') {
      setActiveSection('about');
      // 等待DOM加载后再滚动
      setTimeout(() => {
        const element = document.getElementById('about');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // 初始检查 - 根据滚动位置判断
      const checkInitial = () => {
        if (window.scrollY === 0) {
          setActiveSection('home');
        } else {
          handleScroll();
        }
      };
      setTimeout(checkInitial, 100);
    }
    
    // 监听滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 监听hash变化
    const handleHashChange = () => {
      if (location.hash === '#about') {
        setActiveSection('about');
      } else if (location.pathname === '/' && !location.hash) {
        // 清除hash时，根据滚动位置判断
        handleScroll();
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location.pathname, location.hash]);

  // 判断导航项是否激活
  const isActive = (path) => {
    if (path === '/') {
      // HOME: 在首页顶部时激活
      return location.pathname === '/' && activeSection === 'home';
    }
    return location.pathname.startsWith(path);
  };

  // 判断 ABOUT ME 是否激活
  const isAboutActive = () => {
    if (location.pathname === '/') {
      return activeSection === 'about' || location.hash === '#about';
    }
    return false;
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      // 立即设置激活状态
      setActiveSection(sectionId);
      // 更新hash
      window.history.pushState(null, '', `#${sectionId}`);
      // 滚动到目标区域
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 10);
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/logo.svg" alt="XR Logo" />
        </Link>
        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.history.pushState(null, '', '/');
                setActiveSection('home');
              }
            }}
          >
            HOME
          </Link>
          <Link 
            to="/" 
            className={`nav-link ${isAboutActive() ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('about');
            }}
          >
            ABOUT ME
          </Link>
          <Link 
            to="/works" 
            className={`nav-link ${isActive('/works') ? 'active' : ''}`}
          >
            Blog
          </Link>
          <Link 
            to="/thoughts" 
            className={`nav-link ${isActive('/thoughts') ? 'active' : ''}`}
          >
            REVIEWS
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
          >
            CONTACT
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;


