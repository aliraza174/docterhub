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
  CheckSquare, 
  UserCheck, 
  Link2 
} from 'lucide-react';

export function AdminDashboard({ user, activeTab, setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Link Assistant form state
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignMsg, setAssignMsg] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
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

    if (!selectedAssistantId || !selectedDoctorId) {
      setAssignMsg('Please select both an Assistant and a Doctor.');
      return;
    }

    try {
      await api.assignAssistant(selectedAssistantId, selectedDoctorId);
      setAssignMsg('Assistant successfully linked to Doctor!');
      setSelectedAssistantId('');
      setSelectedDoctorId('');
      setTimeout(() => {
        setAssignMsg('');
        loadAdminData();
      }, 2000);
    } catch (err) {
      setAssignMsg(err.message || 'Assignment failed.');
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

  // Filter lists for the assistant linking tool
  const assistantsList = users.filter(u => u.role === 'assistant');
  const doctorsList = users.filter(u => u.role === 'doctor');

  // Chart data configuration
  const revenueChartData = stats?.monthlyRevenue?.map(d => ({ label: d.month, value: d.revenue })) || [];
  const appointmentChartData = [
    { label: 'Mon', value: 8 },
    { label: 'Tue', value: 14 },
    { label: 'Wed', value: 20 },
    { label: 'Thu', value: 12 },
    { label: 'Fri', value: 18 },
    { label: 'Sat', value: 5 }
  ];

  return (
    <div className="dashboard-layout fade-in">
      <div className="dashboard-content">

        {/* TAB 1: System Analytics */}
        {activeTab === 'dashboard' && (
          <div className="slide-up">
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Administrative Control Panel</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name}. View clinical metrics, revenue feeds, and link assistant records.</p>
            </div>

            {/* Stats Metrics Cards */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Revenue</span>
                  <div className="stat-card-value">${stats?.revenue || 0}</div>
                </div>
                <div className="stat-card-icon">
                  <DollarSign size={22} />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Consultations</span>
                  <div className="stat-card-value">{stats?.appointments || 0}</div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.08)', color: 'var(--color-info)' }}>
                  <Calendar size={22} />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Doctors</span>
                  <div className="stat-card-value">{stats?.doctors || 0}</div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)' }}>
                  <Activity size={22} />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Registered Patients</span>
                  <div className="stat-card-value">{stats?.patients || 0}</div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(157, 78, 221, 0.08)', color: 'var(--accent-purple)' }}>
                  <Users size={22} />
                </div>
              </div>
            </div>

            {/* Interactive Animated SVG Charts Row */}
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

        {/* TAB 2: User Database List */}
        {activeTab === 'users' && (
          <div className="slide-up">
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>User Database Profile Logs</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Audit credentials, registered roles, and timestamps</p>

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

      </div>
    </div>
  );
}
