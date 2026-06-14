import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AssistantDashboard } from './pages/AssistantDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('landing'); // 'landing', 'login', 'register', 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bootstrapping, setBootstrapping] = useState(true);

  // Check auth status on load
  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setPage('dashboard');
    }
    setBootstrapping(false);
  }, []);

  // Handle sidebar class on body to align grid overlay
  useEffect(() => {
    if (page === 'dashboard') {
      document.body.classList.add('has-sidebar');
    } else {
      document.body.classList.remove('has-sidebar');
    }

    if (page === 'dashboard' && activeTab === 'search') {
      document.body.classList.add('hide-grid');
    } else {
      document.body.classList.remove('hide-grid');
    }

    return () => {
      document.body.classList.remove('has-sidebar');
      document.body.classList.remove('hide-grid');
    };
  }, [page, activeTab]);

  // Handle grid scrolling by updating a CSS custom property on scroll capture
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      let scrollTop = 0;
      if (target === document) {
        scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      } else if (target && target.scrollTop !== undefined) {
        scrollTop = target.scrollTop;
      }
      document.body.style.setProperty('--scroll-y', `${scrollTop}px`);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);



  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setPage('dashboard');
    setActiveTab('dashboard'); // reset to default tab
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setPage('landing');
  };

  if (bootstrapping) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <div className="skeleton" style={{ width: '80px', height: '20px' }}></div>
      </div>
    );
  }

  // Render non-dashboard routes
  if (page === 'landing') {
    return <LandingPage onNavigate={setPage} />;
  }

  if (page === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigate={setPage} />;
  }

  if (page === 'register') {
    return <Register onNavigate={setPage} />;
  }

  // Render dashboard routes
  if (page === 'dashboard' && user) {
    return (
      <div className="dashboard-layout">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
        />

        {/* Dynamic Dashboards */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {user.role === 'patient' && (
            <PatientDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {user.role === 'doctor' && (
            <DoctorDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {user.role === 'assistant' && (
            <AssistantDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {user.role === 'admin' && (
            <AdminDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {user.role === 'super_admin' && (
            <SuperAdminDashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </div>

      </div>
    );
  }

  // Fallback
  return <LandingPage onNavigate={setPage} />;
}

export default App;
