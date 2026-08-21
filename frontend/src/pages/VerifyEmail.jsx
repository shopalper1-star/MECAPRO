import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Auth.css';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function VerifyOtp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: emailFromState,
    otp: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!emailFromState) {
      navigate('/signup');
    }
  }, [emailFromState, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/verifyemail',
        formData
      );

      setSuccess(response.data.message);

      setTimeout(() => {
        navigate('/login', {
          state: { message: t('auth.verify_success_login') }
        });
      }, 2000);

    } catch (err) {
      console.error('OTP Verification Error:', err);
      setLoading(false);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t('auth.network_error'));
      }
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/resend-otp',
        { email: formData.email }
      );

      setSuccess(response.data.message);
      setTimer(60);

    } catch (err) {
      console.error('Resend OTP Error:', err);
      setError(err.response?.data?.message || t('auth.otp_resend_error'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="page-content auth-page">
        <div className="auth-inner">

          <section className="auth-hero">
            <div className="auth-hero-overlay" />
            <div className="auth-hero-content">
              <h1>{t('auth.otp_title')}</h1>
              <p>{t('auth.otp_subtitle', { email: formData.email })}</p>
            </div>
          </section>

          <section className="auth-form-panel">
            <div className="auth-form-card">

              <div className="auth-avatar">
                <div className="auth-avatar-icon">
                  <i className="fa-solid fa-envelope-circle-check"></i>
                </div>
              </div>

              <h2>{t('auth.enter_otp')}</h2>

              <p className="auth-email-info">
                {t('auth.otp_code_sent_to')}: <strong>{formData.email}</strong>
              </p>

              {error && (
                <div className="auth-alert auth-alert-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-alert auth-alert-success">
                  {success}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>{t('auth.otp_code_label')}</span>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder={t('auth.otp_placeholder')}
                    maxLength="6"
                    pattern="\d{6}"
                    required
                    autoFocus
                    className="otp-input"
                  />
                </label>

                <button
                  type="submit"
                  className="btn-primary auth-submit"
                  disabled={loading || formData.otp.length !== 6}
                >
                  {loading ? t('auth.verifying') : t('auth.verify_email_button')}
                </button>
              </form>

              <div className="auth-resend-wrapper">
                <p className="auth-resend-text">
                  {t('auth.otp_not_received')}
                </p>

                {timer > 0 ? (
                  <p className="auth-resend-timer">
                    {t('auth.resend_available', { timer })}
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="auth-resend-btn"
                  >
                    {resendLoading ? t('auth.sending') : t('auth.resend_otp')}
                  </button>
                )}
              </div>

              <p className="auth-footer-text auth-footer-spacing">
                {t('auth.wrong_email')}{' '}
                <Link to="/signup" className="auth-link-button">
                  {t('auth.signup_again')}
                </Link>
              </p>

            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default VerifyOtp;
