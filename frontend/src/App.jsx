import React, { useState } from 'react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import { Toast } from './components/Modal';
import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import WarehouseDashboard from './views/WarehouseDashboard';
import BranchDashboard from './views/BranchDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: '' });
    }, 4000);
  };

  const handleLogin = async (username, password) => {
    setLoginError('');
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.first_name || res.user.username}!`, 'success');
    } catch (err) {
      setLoginError(err.message);
      showToast(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      showToast('Logged out successfully.', 'info');
    } catch (err) {
      setUser(null);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentUser={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {!user ? (
          <LoginView onLogin={handleLogin} error={loginError} />
        ) : user.role === 'SUPER_ADMIN' ? (
          <AdminDashboard user={user} showToast={showToast} />
        ) : user.role === 'WAREHOUSE_MANAGER' ? (
          <WarehouseDashboard user={user} showToast={showToast} />
        ) : user.role === 'BRANCH_MANAGER' ? (
          <BranchDashboard user={user} showToast={showToast} />
        ) : (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            Unknown or unauthorized system role.
          </div>
        )}
      </main>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
    </div>
  );
}
