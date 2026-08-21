import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import './Auth.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { patterns, validationMessages } from '../utils/validation';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const verificationMessage = location.state?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");

    // Validate inputs
    if (!patterns.password.test(password)) {
      setError(validationMessages.password);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', { email, password });

      const token = response.data.token;
      const user = response.data.user;

      localStorage.removeItem('ACCESS_TOKEN');
      localStorage.removeItem('USER_NAME');
      localStorage.removeItem('USER_ROLE');
      localStorage.setItem('ACCESS_TOKEN', token);
      Object.keys(user).forEach(key => localStorage.setItem(key, user[key]));
      localStorage.setItem('USER_ROLE', user.role);

      const cleanRole = user.role ? user.role.trim().toLowerCase() : '';
      if (cleanRole === 'client') navigate('/client/dashboard');
      else if (cleanRole === 'supervisor') navigate('/supervisor/dashboard');
      else if (cleanRole === 'mechanic') navigate('/mechanic/dashboard');
      else if (cleanRole === 'receptionist') navigate('/receptionist/dashboard');
      else if (cleanRole === 'parts_manager') navigate('/partsmanager/dashboard');
      else navigate('/');

    } catch (err) {
      if (err.response?.data?.requires_verification) {
        navigate('/verifyemail', { state: { email: err.response.data.email } });
        return;
      }
      if (err.response) setError(err.response.data.message || t('auth.login_failed'));
      else setError(t('auth.network_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page-content auth-page">
      <div className="auth-inner">
        <section className="auth-hero">
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <h1>{t('auth.login_title')}</h1>
            <p>{t('auth.login_subtitle')}</p>
          </div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-avatar">
              <div className="auth-avatar-icon"><i className="fa-solid fa-user-check"></i></div>
            </div>
            <h2>{t('auth.login_title')}</h2>

            {verificationMessage && (
              <div style={{ color: '#27ae60', backgroundColor: '#d5f4e6', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                {verificationMessage}
              </div>
            )}

            {error && (
              <div style={{ color: '#e74c3c', backgroundColor: '#fadbd8', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleLogin}>
              <label className="auth-field">
                {t('auth.email_label')}
                <input type="email" placeholder={t('auth.email_placeholder')}
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>

              <label className="auth-field">
                {t('auth.password_label')}
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"}
                    placeholder={t('auth.password_placeholder')}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required style={{ paddingRight: '40px' }} />
                  <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)}>
                    <i className={showPassword ? "ri-eye-close-line" : "ri-eye-line"}></i>
                  </button>
                </div>
              </label>

              <div className="auth-extra-row">
                <button type="button" className="auth-link-button small">
                  <Link to="/forgot-password">{t('auth.forgot_password')}</Link>
                </button>
              </div>

              <button type="submit" className="btn-primary auth-submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.login_button')}
              </button>
            </form>

            <p className="auth-footer-text">
              {t('auth.no_account')}{" "}
              <Link to="/signup" className="auth-link-button">{t('auth.signup_link')}</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;