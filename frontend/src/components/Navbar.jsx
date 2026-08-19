import React from 'react';
import { Warehouse, LogOut } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  return (
    <header className="navbar-header">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Warehouse size={22} />
          </div>
          <div>
            <span>OmniWarehouse</span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
              Multi-Branch Inventory & Transfer System
            </div>
          </div>
        </div>

        {currentUser && (
          <div className="user-profile">
            <div className="user-info">
              <div className="user-name">
                {currentUser.first_name} {currentUser.last_name} ({currentUser.username})
              </div>
              <div className="user-branch">
                {currentUser.branch_detail ? (
                  <span>📍 {currentUser.branch_detail.name} ({currentUser.branch_detail.code})</span>
                ) : (
                  <span>🌐 System-Wide Scope</span>
                )}
              </div>
            </div>

            <span className={`role-badge role-${currentUser.role}`}>
              {currentUser.role.replace('_', ' ')}
            </span>

            <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Log Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
