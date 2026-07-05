import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
import api from '../../services/api';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiBell, 
  FiGlobe, 
  FiMoon, 
  FiSun, 
  FiCheckCircle
} from 'react-icons/fi';
import './Settings.css';

const Settings = () => {
  const { 
    theme, 
    toggleTheme, 
    language, 
    setLanguage 
  } = useDashboard();

  const roleVal = localStorage.getItem('user_role');
  
  // Administrative User State
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMgrName, setNewMgrName] = useState('');
  const [newMgrEmail, setNewMgrEmail] = useState('');
  const [newMgrPhone, setNewMgrPhone] = useState('');
  const [newMgrPass, setNewMgrPass] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin-portal/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load user records:", err);
    }
  };

  useEffect(() => {
    if (roleVal === 'Admin') {
      fetchUsers();
    }
  }, [roleVal]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      await api.delete(`/admin-portal/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete operation failed.");
    }
  };

  const handleAddManagerSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    
    // Front-end password check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newMgrPass)) {
      setModalError("Password must be 8+ chars and contain uppercase, lowercase, numeric, and special characters.");
      return;
    }

    try {
      await api.post('/admin-portal/managers', {
        email: newMgrEmail,
        password: newMgrPass,
        full_name: newMgrName,
        phone: newMgrPhone,
        role_name: 'Manager'
      });
      setShowAddModal(false);
      setNewMgrName('');
      setNewMgrEmail('');
      setNewMgrPhone('');
      setNewMgrPass('');
      fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to create manager account.");
    }
  };

  // Local State for Profile
  const [profile, setProfile] = useState({
    name: 'Mir Furqaan',
    email: 'mirfurkaan106@gmail.com',
    role: 'Admin Manager',
    phone: '+91 94190 55555'
  });

  // Local State for Notification toggles
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    newBookings: true,
    cancellations: true,
    systemUpdates: false
  });

  // Local Save Feedback state
  const [isSaved, setIsSaved] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="settings-page page-container animate-fade-in">
      <Header title="System Settings" subtitle="Configure manager profiles, notifications, language choices, and user themes" />

      {isSaved && (
        <div className="toast-success animate-fade-in">
          <FiCheckCircle size={16} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveChanges} className="settings-layout">
        
        {/* Left: Profile Card Details */}
        <div className="settings-panel card">
          <div className="panel-header">
            <FiUser size={18} className="text-primary" />
            <h3>Profile Settings</h3>
          </div>
          
          <div className="profile-edit-avatar-section">
            <div className="profile-large-avatar-settings">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="avatar-meta">
              <h4>{profile.name}</h4>
              <p>{profile.role}</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" size={14} />
                <input 
                  type="text" 
                  name="name"
                  value={profile.name} 
                  onChange={handleProfileChange}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" size={14} />
                <input 
                  type="email" 
                  name="email"
                  value={profile.email} 
                  onChange={handleProfileChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" size={14} />
                <input 
                  type="text" 
                  name="phone"
                  value={profile.phone} 
                  onChange={handleProfileChange} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Account Role</label>
              <div className="input-wrapper disabled">
                <FiLock className="input-icon" size={14} />
                <input 
                  type="text" 
                  value={profile.role} 
                  disabled 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preference panel */}
        <div className="settings-right-col">
          
          {/* Theme & Language Configuration */}
          <div className="settings-panel card">
            <div className="panel-header">
              <FiGlobe size={18} className="text-info" />
              <h3>App Preferences</h3>
            </div>

            <div className="pref-item">
              <div className="pref-meta">
                <h4>System Theme</h4>
                <p>Select light or dark mode styling</p>
              </div>
              <div className="theme-toggle-options">
                <button 
                  type="button"
                  className={`theme-btn-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => { if(theme === 'dark') toggleTheme(); }}
                >
                  <FiSun size={14} />
                  <span>Light</span>
                </button>
                <button 
                  type="button"
                  className={`theme-btn-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => { if(theme === 'light') toggleTheme(); }}
                >
                  <FiMoon size={14} />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="pref-item">
              <div className="pref-meta">
                <h4>Language Selector</h4>
                <p>Choose localized interface text translation</p>
              </div>
              <select 
                className="lang-select-box"
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </div>
          </div>

          {/* Notifications config */}
          <div className="settings-panel card">
            <div className="panel-header">
              <FiBell size={18} className="text-warning" />
              <h3>Notification Triggers</h3>
            </div>

            <div className="notifications-toggle-list">
              <label className="toggle-container">
                <input 
                  type="checkbox" 
                  checked={notifications.emailAlerts}
                  onChange={() => handleNotificationToggle('emailAlerts')}
                />
                <span className="checkmark"></span>
                <div className="toggle-lbl">
                  <span className="t-title">Email Summaries</span>
                  <span className="t-desc">Receive weekly revenue reports in inbox</span>
                </div>
              </label>

              <label className="toggle-container">
                <input 
                  type="checkbox" 
                  checked={notifications.smsAlerts}
                  onChange={() => handleNotificationToggle('smsAlerts')}
                />
                <span className="checkmark"></span>
                <div className="toggle-lbl">
                  <span className="t-title">SMS Notifications</span>
                  <span className="t-desc">Alert room cleaning upon checkout checkout logs</span>
                </div>
              </label>

              <label className="toggle-container">
                <input 
                  type="checkbox" 
                  checked={notifications.newBookings}
                  onChange={() => handleNotificationToggle('newBookings')}
                />
                <span className="checkmark"></span>
                <div className="toggle-lbl">
                  <span className="t-title">New Bookings Alerts</span>
                  <span className="t-desc">Real-time alerts for incoming guests</span>
                </div>
              </label>

              <label className="toggle-container">
                <input 
                  type="checkbox" 
                  checked={notifications.cancellations}
                  onChange={() => handleNotificationToggle('cancellations')}
                />
                <span className="checkmark"></span>
                <div className="toggle-lbl">
                  <span className="t-title">Cancellation Alerts</span>
                  <span className="t-desc">Notify booking cancellations immediately</span>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="settings-actions">
            <button type="submit" className="save-settings-btn">
              Save All Changes
            </button>
          </div>
        </div>

      </form>

      {/* Admin User Management Controls */}
      {roleVal === 'Admin' && (
        <div className="admin-portal-settings-card card glass-panel" style={{ marginTop: '2rem' }}>
          <div className="admin-portal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Admin User & Manager Controls</h3>
            <button 
              type="button"
              className="add-manager-trigger-btn" 
              onClick={() => setShowAddModal(true)}
              style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer' }}
            >
              Add Pre-Verified Manager
            </button>
          </div>

          <div className="admin-users-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="admin-users-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Full Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Verified</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.75rem' }}>{u.full_name}</td>
                    <td style={{ padding: '0.75rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`status-badge-val ${u.role_name.toLowerCase() === 'manager' ? 'pending' : 'confirmed'}`}>
                        {u.role_name}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{u.is_verified ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="delete-user-btn" 
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ padding: '0.35rem 0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Manager Dialog Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="checkout-modal card glass-panel animate-fade-in" style={{ width: '400px', padding: '1.5rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontWeight: 800 }}>Create Manager Account</h3>
              <button 
                type="button"
                className="close-modal-btn" 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddManagerSubmit} className="checkout-form" style={{ display: 'flex', flexStack: 'column', gap: '1rem', flexDirection: 'column' }}>
              {modalError && (
                <div className="error-alert-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.65rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grp" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={newMgrName} 
                  onChange={e => setNewMgrName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
              </div>

              <div className="grp" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
                <input 
                  type="email" 
                  value={newMgrEmail} 
                  onChange={e => setNewMgrEmail(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
              </div>

              <div className="grp" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Contact</label>
                <input 
                  type="text" 
                  value={newMgrPhone} 
                  onChange={e => setNewMgrPhone(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
              </div>

              <div className="grp" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password (Min 8 characters)</label>
                <input 
                  type="password" 
                  value={newMgrPass} 
                  onChange={e => setNewMgrPass(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
              </div>

              <button 
                type="submit" 
                className="confirm-booking-btn"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              >
                Create Verified Manager
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
export { Settings };
