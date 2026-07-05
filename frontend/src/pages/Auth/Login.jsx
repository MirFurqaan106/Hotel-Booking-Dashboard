import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiLogIn } from 'react-icons/fi';
import api from '../../services/api';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // FastAPI OAuth2PasswordRequestForm expects url-encoded form values
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const res = await api.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Simple JWT payload decode to check user role
      const payloadBase64 = access_token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      localStorage.setItem('user_role', payload.role || 'User');
      localStorage.setItem('user_email', payload.sub || email);
      localStorage.setItem('user_name', payload.name || 'Resort Guest');

      // Redirect based on role permissions
      if (payload.role === 'Admin' || payload.role === 'Manager') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Invalid email, password, or unverified account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container page-container animate-fade-in">
      <div className="auth-card card glass-panel">
        <div className="auth-header">
          <span className="auth-logo-icon">P</span>
          <h2>Sign In to Panun Ghar</h2>
          <p>Access your guest reservations or manager dashboard panel.</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="auth-form">
          {errorMsg && (
            <div className="error-alert-box">
              <FiAlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="auth-group">
            <label>Email Address</label>
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

          <div className="auth-group">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-icon" size={14} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            <FiLogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="auth-footer-links">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
export { Login };
