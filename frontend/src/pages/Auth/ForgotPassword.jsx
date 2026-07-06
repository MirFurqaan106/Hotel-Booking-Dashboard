import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle, FiKey, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import logoImg from '../../assets/logo.jpg';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // States
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: request code, 2: reset password
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(res.data.message || "Reset verification code dispatched to your email address!");
      setStep(2);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Email address not found in our guest database.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMsg("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        new_password: newPassword
      });
      setSuccessMsg(res.data.message || "Password successfully reset!");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Invalid or expired verification reset token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container page-container animate-fade-in">
      <div className="auth-card card glass-panel">
        <div className="auth-header">
          <img src={logoImg} alt="Panun Ghar Logo" style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem auto', display: 'block' }} />
          <h2>Password Recovery</h2>
          <p>Reset your Panun Ghar guest account credentials securely.</p>
        </div>

        {errorMsg && (
          <div className="error-alert-box">
            <FiAlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-alert-box" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <FiCheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestReset} className="auth-form">
            <div className="auth-group">
              <label>Enter Registered Email</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-icon" size={14} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              <span>{loading ? 'Sending Request...' : 'Send Recovery Token'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="auth-form">
            <div className="auth-group">
              <label>Verification Token Code (OTP)</label>
              <div className="auth-input-wrapper">
                <FiKey className="auth-icon" size={14} />
                <input 
                  type="text" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste OTP token code"
                  required
                />
              </div>
              <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Check your email inbox or backend console logs for the recovery OTP.
              </small>
            </div>

            <div className="auth-group">
              <label>New Secure Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-icon" size={14} />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 symbol"
                  required
                />
              </div>
            </div>

            <div className="auth-group">
              <label>Confirm Password</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-icon" size={14} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              <span>{loading ? 'Resetting Password...' : 'Save New Password'}</span>
            </button>
          </form>
        )}

        <div className="auth-footer-links" style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
            <FiArrowLeft size={14} />
            <span>Return to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
export { ForgotPassword };
