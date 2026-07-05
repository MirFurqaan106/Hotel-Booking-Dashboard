import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  
  // Registration form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('User');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        email: email,
        password: password,
        full_name: fullName,
        phone: phone,
        role_name: role
      });

      // Show OTP Verification dialog overlay
      setShowOtpModal(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Registration failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      await api.post('/auth/verify-otp', {
        email: email,
        code: otpCode
      });
      
      setShowOtpModal(false);
      navigate('/login');
    } catch (err) {
      setOtpError(err.response?.data?.detail || "Incorrect verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-page-container page-container animate-fade-in">
      <div className="auth-card card glass-panel">
        <div className="auth-header">
          <span className="auth-logo-icon">P</span>
          <h2>Register Account</h2>
          <p>Create an account to book hotel stays or request management access.</p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="auth-form">
          {errorMsg && (
            <div className="error-alert-box">
              <FiAlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="auth-group">
            <label>Full Name</label>
            <div className="auth-input-wrapper">
              <FiUser className="auth-icon" size={14} />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Suhail Rather"
                required
              />
            </div>
          </div>

          <div className="auth-group">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-icon" size={14} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. suhail@example.com"
                required
              />
            </div>
          </div>

          <div className="auth-group">
            <label>Password (Min 6 chars)</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-icon" size={14} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="auth-group">
            <label>Phone Contact</label>
            <div className="auth-input-wrapper">
              <FiPhone className="auth-icon" size={14} />
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 7889984798"
                required
              />
            </div>
          </div>

          <div className="auth-group">
            <label>Register As Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="auth-select">
              <option value="User">Guest Customer (Browse & Book)</option>
              <option value="Manager">Hotel Manager (Manage rooms & rates)</option>
            </select>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
          </button>
        </form>

        <div className="auth-footer-links">
          <p>Already have an account? <Link to="/login">Sign In here</Link></p>
        </div>
      </div>

      {/* OTP Verification Modal Dialog Overlay */}
      {showOtpModal && (
        <div className="modal-backdrop">
          <div className="otp-modal card glass-panel animate-fade-in">
            <div className="otp-header">
              <FiCheckCircle size={44} className="text-success" />
              <h3>Verification Code Dispatched</h3>
              <p>We have sent a 6-digit verification code to <strong>{email}</strong>. (Check backend logs for code if SMTP is offline).</p>
            </div>

            <form onSubmit={handleOtpSubmit} className="otp-form">
              {otpError && (
                <div className="error-alert-box">
                  <FiAlertCircle size={16} />
                  <span>{otpError}</span>
                </div>
              )}

              <div className="otp-input-box">
                <input 
                  type="text" 
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="otp-number-input"
                  required
                />
              </div>

              <button type="submit" className="otp-verify-btn" disabled={otpLoading}>
                <span>{otpLoading ? 'Verifying OTP...' : 'Verify & Activate'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
export { Register };
