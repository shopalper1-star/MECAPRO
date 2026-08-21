import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardNavbar from '../components/DashboardNavbar';
import { Link } from 'react-router-dom';
import './UserProfile.css';
import { patterns, validationMessages } from '../utils/validation';

const UserProfile = () => {
  const { t } = useTranslation();

  // 1. STATE: User Data
  const [user, setUser] = useState({ name: '', role: '' });

  // 2. STATE: Password Form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 3. STATE: UI Feedback
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // 4. EFFECT: Load User Data (Matching your Login Logic)
  useEffect(() => {
    // You save these keys individually in Login.jsx
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('USER_ROLE') || localStorage.getItem('role');

    if (name && role) {
      setUser({ name, role });
    }
  }, []);

  // 5. Handle Input Changes
  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    // Clear old messages when typing
    if (message.type === 'error') setMessage({ type: '', text: '' });
  };

  // 6. Handle Submit (Connect to Laravel)
  const handleSave = async (e) => {
    e.preventDefault();

    // --- Frontend Validation ---
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: t('profile.errors.password_mismatch', 'New passwords do not match!') });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: t('profile.errors.password_length', 'Password must be at least 6 characters.') });
      return;
    }
    if (!patterns.password.test(passwords.newPassword)) {
      setMessage({ type: 'error', text: validationMessages.password });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Get the token you saved during login
      const token = localStorage.getItem('ACCESS_TOKEN');

      if (!token) {
        throw new Error(t('profile.errors.not_logged_in', "You are not logged in."));
      }

      // --- FETCH REQUEST ---
      const response = await fetch('http://localhost:8000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send Token
          'Accept': 'application/json'        // Expect JSON response
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          // Laravel 'confirmed' rule looks for this exact key:
          newPassword_confirmation: passwords.confirmPassword
        })
      });

      const data = await response.json();

      // --- Handle Errors ---
      if (!response.ok) {
        // If Laravel sends validation errors (e.g. "Password incorrect"), show them
        const errorMsg = data.message || t('profile.errors.update_failed', 'Failed to update password');
        throw new Error(errorMsg);
      }

      // --- Success ---
      setMessage({ type: 'success', text: t('profile.success.password_updated', 'Password updated successfully!') });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="receptionist-container">
      <DashboardNavbar user={user} />

      <div className="dashboard-content">

        <div className="profile-wrapper">

          <div className="back-link-container">
            <Link
              to={`/${user.role ? user.role.toLowerCase().replace(/_/g, '') : 'client'}/dashboard`}
              className="back-link"
            >
              ← {t('profile.back_to_dashboard')}
            </Link>
          </div>

          <div className="header-actions">
            <h1>{t('profile.title')}</h1>
          </div>

          {/* CARD 1: User Info (Read Only) */}
          <div className="table-card profile-card">
            <div className="card-header">
              <h3>{t('profile.account_details')}</h3>
            </div>
            <div className="form-content">

              <div className="form-group">
                <label>{t('profile.full_name')}</label>
                <input
                  type="text"
                  className="form-control locked-input"
                  value={user.name || t('profile.loading')}
                  readOnly
                  disabled
                />
                <span className="lock-icon">
                  <i class="fa-solid fa-lock"></i>
                </span>
              </div>

              <div className="form-group">
                <label>{t('profile.role')}</label>
                <input
                  type="text"
                  className="form-control locked-input"
                  value={user.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  readOnly
                  disabled
                />
                <span className="lock-icon">
                  <i class="fa-solid fa-lock"></i>
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Change Password Form */}
          <div className="table-card profile-card">
            <div className="card-header">
              <h3>{t('profile.security_settings')}</h3>
            </div>
            <form className="form-content" onSubmit={handleSave}>

              <div className="form-group">
                <label>{t('profile.current_password')}</label>
                <input
                  type="password"
                  name="currentPassword"
                  className="form-control"
                  placeholder={t('profile.current_password_placeholder')}
                  value={passwords.currentPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row-split">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('profile.new_password')}</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="form-control"
                    placeholder={t('profile.new_password_placeholder')}
                    value={passwords.newPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('profile.confirm_password')}</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder={t('profile.confirm_password_placeholder')}
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Feedback Messages */}
              {message.text && (
                <div className={`message-box ${message.type}`}>
                  {message.type === 'error' ? '⚠️ ' : '✅ '}
                  {message.text}
                </div>
              )}

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button type="submit" className="update-btn" disabled={isLoading}>
                  {isLoading ? t('profile.updating') : t('profile.update_password')}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;