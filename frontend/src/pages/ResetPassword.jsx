import API_BASE_URL from '../api.js';
import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ForgotPassword.css';
import { patterns, validationMessages } from '../utils/validation';

function ResetPassword() {
  const { t } = useTranslation();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError(t('auth.passwords_no_match'));
      return;
    }

    if (!patterns.password.test(password)) {
      setError(validationMessages.password);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/reset-password`,  {
        email,
        token,
        password,
        password_confirmation: confirmPassword
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          const firstError = Object.values(err.response.data.errors)[0][0];
          setError(firstError);
        } else {
          setError(err.response.data.message || t('auth.something_went_wrong'));
        }
      } else {
        setError(t('auth.network_error'));
      }
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="info-icon" style={{ width: '70px', height: '70px' }}>
            <i className="fa-solid fa-key icon-lock" style={{ fontSize: '45px' }}></i>
          </div>
          <h1>{t('auth.reset_pw_title')}</h1>
          <p>{t('auth.reset_pw_subtitle')}</p>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('auth.new_password_label')}</label>
            <input
              type="password"
              className="form-input"
              value={password}
              placeholder={t('auth.new_password_placeholder')}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('auth.confirm_password_label')}</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              placeholder={t('auth.confirm_password_placeholder')}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-button">{t('auth.reset_password_button')}</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;