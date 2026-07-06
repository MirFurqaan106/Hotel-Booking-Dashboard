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
  FiCheckCircle,
  FiAlertCircle,
  FiPhone,
  FiSave,
  FiKey
} from 'react-icons/fi';
import './Settings.css';

const Settings = () => {
  const { theme, toggleTheme, language, setLanguage } = useDashboard();
  const roleVal = localStorage.getItem('user_role') || '';

  // ─── Profile State (loaded from localStorage, saved to DB) ───────────────
  const [name, setName] = useState(localStorage.getItem('user_name') || '');
  const [email, setEmail] = useState(localStorage.getItem('user_email') || '');
  const [phone, setPhone] = useState(localStorage.getItem('user_phone') || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }

  // ─── Change Password State ────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  // ─── Notification Toggles (local only) ────────────────────────────────────
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    newBookings: true,
    cancellations: true,
    smsAlerts: false,
  });

  // ─── Admin user management ─────────────────────────────────────────────────
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
      console.error('Failed to load user records:', err);
    }
  };

  useEffect(() => {
    if (roleVal === 'Admin') fetchUsers();
  }, [roleVal]);

  // ─── Save Profile to DB ────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await api.put('/auth/update-profile', {
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim()
      });
      // Update localStorage so Navbar reflects immediately
      localStorage.setItem('user_name', res.data.full_name);
      localStorage.setItem('user_email', res.data.email);
      if (phone) localStorage.setItem('user_phone', res.data.phone || '');
      // Dispatch storage event so Navbar re-renders
      window.dispatchEvent(new Event('storage'));
      setProfileMsg({ type: 'success', text: 'Profile saved successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to save profile.' });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 4000);
    }
  };

  // ─── Change Password ───────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPwd,
        new_password: newPwd
      });
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to change password. Check your current password.' });
    } finally {
      setPwdSaving(false);
      setTimeout(() => setPwdMsg(null), 4000);
    }
  };

  // ─── Admin: Add Manager ────────────────────────────────────────────────────
  const handleAddManagerSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newMgrPass)) {
      setModalError('Password must be 8+ chars with uppercase, lowercase, number, and special character.');
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
      setNewMgrName(''); setNewMgrEmail(''); setNewMgrPhone(''); setNewMgrPass('');
      fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to create manager account.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api.delete(`/admin-portal/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete operation failed.');
    }
  };

  return (
    <div className="settings-page page-container animate-fade-in">
      <Header title="System Settings" subtitle="Update your profile, change your password, and configure app preferences" />

      <div className="settings-layout">

        {/* ─── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="settings-left-col">

          {/* Profile Settings */}
          <form onSubmit={handleSaveProfile}>
            <div className="settings-panel card">
              <div className="panel-header">
                <FiUser size={18} className="text-primary" />
                <h3>Profile Settings</h3>
              </div>

              <div className="profile-edit-avatar-section">
                <div className="profile-large-avatar-settings">
                  {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="avatar-meta">
                  <h4>{name || 'Your Name'}</h4>
                  <p>{roleVal || 'Manager'}</p>
                </div>
              </div>

              {profileMsg && (
                <div className={`settings-feedback-msg ${profileMsg.type === 'success' ? 'msg-success' : 'msg-error'}`}>
                  {profileMsg.type === 'success' ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" size={14} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <div className="input-wrapper">
                    <FiPhone className="input-icon" size={14} />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Account Role</label>
                  <div className="input-wrapper disabled">
                    <FiLock className="input-icon" size={14} />
                    <input type="text" value={roleVal || 'Manager'} disabled />
                  </div>
                </div>
              </div>

              <button type="submit" className="save-settings-btn" disabled={profileSaving} style={{ marginTop: '1rem' }}>
                <FiSave size={15} />
                <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} style={{ marginTop: '1.5rem' }}>
            <div className="settings-panel card">
              <div className="panel-header">
                <FiKey size={18} className="text-warning" />
                <h3>Change Password</h3>
              </div>

              {pwdMsg && (
                <div className={`settings-feedback-msg ${pwdMsg.type === 'success' ? 'msg-success' : 'msg-error'}`}>
                  {pwdMsg.type === 'success' ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
                  <span>{pwdMsg.text}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" size={14} />
                    <input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Enter your current password"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" size={14} />
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" size={14} />
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="save-settings-btn" disabled={pwdSaving} style={{ marginTop: '1rem', background: 'var(--warning)', color: '#000' }}>
                <FiKey size={15} />
                <span>{pwdSaving ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────────────────── */}
        <div className="settings-right-col">

          {/* Theme & Language */}
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
                  onClick={() => { if (theme === 'dark') toggleTheme(); }}
                >
                  <FiSun size={14} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  className={`theme-btn-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => { if (theme === 'light') toggleTheme(); }}
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

          {/* Notification Toggles */}
          <div className="settings-panel card" style={{ marginTop: '1.5rem' }}>
            <div className="panel-header">
              <FiBell size={18} className="text-warning" />
              <h3>Notification Triggers</h3>
            </div>

            <div className="notifications-toggle-list">
              {[
                { key: 'emailAlerts', title: 'Email Summaries', desc: 'Receive weekly revenue reports in inbox' },
                { key: 'newBookings', title: 'New Booking Alerts', desc: 'Real-time alerts for incoming guests' },
                { key: 'cancellations', title: 'Cancellation Alerts', desc: 'Notify on booking cancellations' },
                { key: 'smsAlerts', title: 'SMS Notifications', desc: 'Alert room cleaning upon checkout' },
              ].map(({ key, title, desc }) => (
                <label key={key} className="toggle-container">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                  />
                  <span className="checkmark"></span>
                  <div className="toggle-lbl">
                    <span className="t-title">{title}</span>
                    <span className="t-desc">{desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Admin User Management Controls (Admin-only) ──────────────── */}
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
              Add Manager
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Full Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Verified</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ padding: '0.35rem 0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
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

      {/* ─── Add Manager Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="checkout-modal card glass-panel animate-fade-in" style={{ width: '420px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: 800 }}>Create Manager Account</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleAddManagerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modalError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.65rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <FiAlertCircle size={14} />
                  <span>{modalError}</span>
                </div>
              )}
              {[
                { label: 'Full Name', value: newMgrName, onChange: setNewMgrName, type: 'text', placeholder: 'e.g. Suhail Rather' },
                { label: 'Email Address', value: newMgrEmail, onChange: setNewMgrEmail, type: 'email', placeholder: 'manager@panunghar.com' },
                { label: 'Phone Contact', value: newMgrPhone, onChange: setNewMgrPhone, type: 'text', placeholder: '+91 98765 43210' },
                { label: 'Password', value: newMgrPass, onChange: setNewMgrPass, type: 'password', placeholder: 'Min 8 chars...' },
              ].map(({ label, value, onChange, type, placeholder }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
                  <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button
                type="submit"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', marginTop: '0.5rem' }}
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
