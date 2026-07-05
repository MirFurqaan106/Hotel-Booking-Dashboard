import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Header from '../../components/Header/Header';
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
    </div>
  );
};

export default Settings;
export { Settings };
