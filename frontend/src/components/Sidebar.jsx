import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Search, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  ShieldAlert, 
  Users, 
  LogOut, 
  Heart,
  User,
  Settings
} from 'lucide-react';
import { api } from '../utils/api';

export function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'patient':
        return [
          { id: 'dashboard', label: 'My Appointments', icon: Calendar },
          { id: 'search', label: 'Find a Doctor', icon: Search },
          { id: 'ai-predictor', label: 'AI Symptom Checker', icon: Sparkles },
          { id: 'history', label: 'My Medical History', icon: FileText }
        ];
      case 'doctor':
        return [
          { id: 'dashboard', label: 'Consultations', icon: Calendar },
          { id: 'schedule', label: 'Clinic Schedules', icon: Settings },
          { id: 'patients', label: 'Patient History Audit', icon: Users }
        ];
      case 'assistant':
        return [
          { id: 'dashboard', label: 'Verify Payments', icon: CheckSquare }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'System Analytics', icon: LayoutDashboard },
          { id: 'users', label: 'User Database', icon: Users }
        ];
      case 'super_admin':
        return [
          { id: 'dashboard', label: 'System Analytics', icon: LayoutDashboard },
          { id: 'users', label: 'User Accounts', icon: Users },
          { id: 'role-control', label: 'Role & RBAC Policies', icon: ShieldAlert }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div style={{
      width: '280px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 10005
    }} className="no-print">
      {/* Branding */}
      <div style={{
        padding: '30px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          background: 'var(--accent-gradient)',
          color: '#fff',
          padding: '6px',
          borderRadius: '8px',
          display: 'flex'
        }}>
          <Heart fill="#fff" size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>Doctor Hub</h2>
          <span style={{ fontSize: '11px', color: 'var(--accent-pink)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
                background: isActive ? 'rgba(255, 46, 147, 0.08)' : 'transparent',
                color: isActive ? 'var(--accent-pink)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(255, 46, 147, 0.2)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? '600' : '500'
              }}
            >
              <Icon size={18} />
              <span style={{ fontSize: '14px' }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div style={{
        padding: '24px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)'
          }}>
            <User size={18} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{user.email}</span>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onLogout}
          style={{ width: '100%', gap: '10px', padding: '10px 16px', fontSize: '14px' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
