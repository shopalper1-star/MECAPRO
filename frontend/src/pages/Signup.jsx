import API_BASE_URL from '../api.js';
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import './Auth.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { patterns, validationMessages, sanitizeInput } from '../utils/validation';

function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Apply strict sanitization while typing
    if (name === 'name') {
      value = sanitizeInput('name', value);
    }

    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // Validate inputs
    const newErrors = {};
    if (!patterns.name.test(formData.name)) {
      newErrors.name = [validationMessages.name];
    }
    if (!patterns.password.test(formData.password)) {
      newErrors.password = [validationMessages.password];
    }
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = [t('auth.passwords_no_match', 'Passwords do not match')];
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/register`,  formData);
      navigate('/verifyemail', { state: { email: formData.email, message: response.data.message } });
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 422) setErrors(err.response.data.errors);
      else if (err.response?.data?.message) setGeneralError(err.response.data.message);
      else setGeneralError(t('common.error_occurred'));
    }
  };

  return (
    <main className="page-content auth-page">
      <div className="auth-inner">
        <section className="auth-hero">
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <h1>{t('auth.signup_title')}</h1>
            <p>{t('auth.signup_subtitle')}</p>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-avatar">
              <div className="auth-avatar-icon"><i className="fa-regular fa-user"></i></div>
            </div>

            <h2>{t('auth.signup_title')}</h2>

            {generalError && (
              <div style={{ color: '#e74c3c', backgroundColor: '#fadbd8', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                {generalError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>

              {/* NAME */}
              <label className="auth-field">
                {t('auth.name_label')} <span>*</span>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder={t('auth.name_placeholder')} required />
                {errors.name && <small style={{ color: 'red' }}>{errors.name[0]}</small>}
              </label>

              {/* EMAIL */}
              <label className="auth-field">
                {t('auth.email_label')} <span>*</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder={t('auth.email_placeholder')} required />
                {errors.email && <small style={{ color: 'red' }}>{errors.email[0]}</small>}
              </label>

              {/* PASSWORD */}
              <label className="auth-field">
                {t('auth.password_label')} <span>*</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('auth.password_placeholder')}
                    required
                    style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#888',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {errors.password && <small style={{ color: 'red' }}>{errors.password[0]}</small>}
              </label>

              {/* CONFIRM PASSWORD */}
              <label className="auth-field">
                {t('auth.confirm_password_label')} <span>*</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder={t('auth.confirm_password_placeholder')}
                    required
                    style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#888',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {errors.password_confirmation && <small style={{ color: 'red' }}>{errors.password_confirmation[0]}</small>}
              </label>

              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? t('auth.creating_account') : t('auth.signup_button')}
              </button>
            </form>

            <p className="auth-footer-text">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="auth-link-button">{t('auth.login_link')}</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Signup;