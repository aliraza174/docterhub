import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { SVGLineChart, SVGBarChart } from '../components/SVGCharts';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  UserCheck, 
  Link2,
  Lock
} from 'lucide-react';

export function SuperAdminDashboard({ user, activeTab, setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Link Assistant state
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignMsg, setAssignMsg] = useState('');

  // Role Change state
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleMsg, setRoleMsg] = useState('');

  useEffect(() => {
    loadSuperAdminData();
  }, []);

  const loadSuperAdminData = async () => {
    setLoading(true);
    try {
      const statsData = await api.getAdminStats();
      setStats(statsData);

      const usersList = await api.getAdminUsers();
      setUsers(usersList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignMsg('');
    try {
      await api.assignAssistant(selectedAssistantId, selectedDoctorId);
      setAssignMsg('Assistant linked to Doctor successfully!');
      setSelectedAssistantId('');
      setSelectedDoctorId('');
      setTimeout(() => {
        setAssignMsg('');
        loadSuperAdminData();
      }, 2000);
    } catch (err) {
      setAssignMsg(err.message || 'Assignment failed.');
    }
  };

  const handleRoleChangeSubmit = async (userId) => {
    setRoleMsg('');
    try {
      await api.updateUserRole(userId, selectedRole);
      setRoleMsg(`Role successfully updated to ${selectedRole}!`);
      setUpdatingUserId(null);
      loadSuperAdminData();
      setTimeout(() => setRoleMsg(''), 2500);
    } catch (err) {
      setRoleMsg(err.message || 'Failed to update user role.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '80px', marginBottom: '20px' }}></div>
        <div className="skeleton" style={{ height: '350px' }}></div>
      </div>
    );
  }

  const assistantsList = users.filter(u => u.role === 'assistant');
  const doctorsList = users.filter(u => u.role === 'doctor');

  const revenueChartData = stats?.monthlyRevenue?.map(d => ({ label: d.month, value: d.revenue })) || [];
  const appointmentChartData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 18 },
    { label: 'Wed', value: 24 },
    { label: 'Thu', value: 15 },
    { label: 'Fri', value: 20 },
    { label: 'Sat', value: 8 }
  ];

  return (
    <div className="dashboard-layout fade-in">
      <div className="dashboard-content">

        {/* TAB 1: System Analytics */}
        {activeTab === 'dashboard' && (
          <div className="slide-up">
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Super Admin Core Control</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name}. Global systems audit, server analytics, and RBAC policy deployment.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>System Revenue</span>
                  <div className="stat-card-value">${stats?.revenue || 0}</div>
                </div>
                <div className="stat-card-icon">
                  <DollarSign size={22} />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Bookings</span>
                  <div className="stat-card-value">{stats?.appointments || 0}</div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.08)', color: 'var(--color-info)' }}>
                  <Calendar size={22} />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Specialists</span>
                  <div className="stat-card-value">{stats?.doctors || 0}</div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)' }}>
                  <Activity size={22} />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>System Users</span>
                  <div className="stat-card-value">{stats?.patients || 0}</div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(157, 78, 221, 0.08)', color: 'var(--accent-purple)' }}>
                  <Users size={22} />
                </div>
              </div>
            </div>

            {/* SVG Charts */}
            <div className="grid-2" style={{ marginBottom: '32px' }}>
              <div className="card glass-panel">
                <h4 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Monthly Revenue Growth Timeline ($)</h4>
                <SVGLineChart data={revenueChartData} height={200} />
              </div>
              
              <div className="card glass-panel">
                <h4 style={{ fontSize: '16px', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Appointments Volume (Weekly)</h4>
                <SVGBarChart data={appointmentChartData} height={200} />
              </div>
            </div>

            {/* Assistant Link Section */}
            <div className="card" style={{ maxWidth: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Link2 size={18} style={{ color: 'var(--accent-pink)' }} />
                <h3 style={{ fontSize: '17px' }}>Link Medical Assistant to Doctor</h3>
              </div>
              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Assistant</label>
                  <select 
                    className="form-control" 
                    value={selectedAssistantId} 
                    onChange={(e) => setSelectedAssistantId(e.target.value)}
                  >
                    <option value="">-- Choose Assistant --</option>
                    {assistantsList.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label">Doctor to Support</label>
                  <select 
                    className="form-control" 
                    value={selectedDoctorId} 
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctorsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '48px' }}>
                  Assign Link
                </button>
              </form>

              {assignMsg && (
                <div style={{
                  color: assignMsg.includes('success') ? 'var(--color-success)' : 'var(--color-danger)',
                  background: assignMsg.includes('success') ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginTop: '16px',
                  textAlign: 'center'
                }}>
                  {assignMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: User Accounts */}
        {activeTab === 'users' && (
          <div className="slide-up">
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Global User Directory</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Examine profiles, active roles, and timestamps</p>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Access Role Permissions</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>#{u.id}</strong></td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'patient' ? 'badge-info' :
                          u.role === 'doctor' ? 'badge-success' :
                          u.role === 'assistant' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Role Control Policy */}
        {activeTab === 'role-control' && (
          <div className="slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Lock size={24} style={{ color: 'var(--accent-pink)' }} />
              <h2 style={{ fontSize: '28px', fontWeight: '800' }}>RBAC Security Configuration</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Alter user access permissions and security configurations dynamically</p>

            {roleMsg && (
              <div style={{
                color: 'var(--color-success)',
                background: 'var(--color-success-bg)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '20px',
                textAlign: 'center'
              }} className="slide-up">
                {roleMsg}
              </div>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name & Email</th>
                    <th>Active Permission Role</th>
                    <th>Re-assign Security Level</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>#{u.id}</strong></td>
                      <td>
                        <strong>{u.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>{u.email}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          u.role === 'patient' ? 'badge-info' :
                          u.role === 'doctor' ? 'badge-success' :
                          u.role === 'assistant' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {updatingUserId === u.id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              className="form-control"
                              style={{ width: '150px', padding: '8px' }}
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                            >
                              <option value="patient">patient</option>
                              <option value="doctor">doctor</option>
                              <option value="assistant">assistant</option>
                              <option value="admin">admin</option>
                              <option value="super_admin">super_admin</option>
                            </select>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleRoleChangeSubmit(u.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => setUpdatingUserId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                            onClick={() => {
                              setUpdatingUserId(u.id);
                              setSelectedRole(u.role);
                            }}
                          >
                            <UserCheck size={12} /> Shift Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
