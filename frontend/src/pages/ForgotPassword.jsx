import API_BASE_URL from '../api.js';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ForgotPassword.css';

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`,  { email });
      setMessage(response.data.message || t('auth.reset_link_sent'));
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError(t('auth.network_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="info-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1>{t('auth.forgot_pw_title')}</h1>
          <p>{t('auth.forgot_pw_subtitle')}</p>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.email_address')}</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder={t('auth.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? t('auth.sending') : t('auth.send_reset_link')}
          </button>

          <div className="divider">
            <p>{t('auth.or')}</p>
          </div>

          <Link to="/signup" className="auth-link-button small">
            {t('auth.create_new_account')}
          </Link>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;