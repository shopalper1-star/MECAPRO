import axios from 'axios';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Contact.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { patterns, validationMessages, sanitizeInput } from '../utils/validation';


const Contact = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Strict typing sanitization
    if (name === 'name') value = sanitizeInput('name', value);
    if (name === 'message') value = sanitizeInput('description', value);

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };


  const [phoneData, setPhoneData] = useState({ countryCode: '', number: '' });

  const handlePhoneChange = (e) => {
    let { name, value } = e.target;
    // Both countryCode and number must be digits only
    value = value.replace(/\D/g, '');

    const updated = { ...phoneData, [name]: value };
    setPhoneData(updated);
    setFormData(prev => ({ ...prev, phone: `+${updated.countryCode}${updated.number}` }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  };


  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('contact.errors.name_required');
    else if (!patterns.name.test(formData.name)) newErrors.name = validationMessages.name;

    if (!formData.email.trim()) newErrors.email = t('contact.errors.email_required');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('contact.errors.email_invalid');

    if (!formData.phone.trim()) {
      newErrors.phone = t('contact.errors.phone_required');
    } else {
      const fullPhone = formData.phone.replace(/\D/g, ''); // Extract digits
      if (!patterns.phone.test(fullPhone)) newErrors.phone = validationMessages.phone;
    }

    if (!formData.message.trim()) newErrors.message = t('contact.errors.message_required');
    else if (!patterns.description.test(formData.message)) newErrors.message = validationMessages.description;

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const res = await axios.post('http://127.0.0.1:8000/api/contact', formData);
        if (res.data.status === 200) {
          setSubmitted(true);
          setFormData({ name: '', email: '', phone: '', message: '' });
          setTimeout(() => setSubmitted(false), 3000);
        }
      } catch (err) {
        if (err.response?.data?.errors) setErrors(err.response.data.errors);
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <div className="contact-header-content">
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>
      </div>

      <div className="contact-form-section">
        <div className="contact-container">
          <h2>{t('contact.get_in_touch')}</h2>
          <p className="form-description">{t('contact.form_desc')}</p>

          {submitted && (
            <div className="success-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#10B981" />
              </svg>
              <span>{t('contact.success_message')}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">{t('contact.name_label')} <span className="required-star">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                placeholder={t('contact.name_placeholder')} className={errors.name ? 'error' : ''} />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('contact.email_label')} <span className="required-star">*</span></label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                placeholder={t('contact.email_placeholder')} className={errors.email ? 'error' : ''} />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('contact.phone_label')} <span className="required-star">*</span></label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: '6px', padding: '0 8px', flexShrink: 0, width: '90px' }} className={errors.phone ? 'error' : ''}>
                  <span style={{ color: '#8a8a8a', margin: '0px 3px' }}>+</span>
                  <input
                    type="tel"
                    name="countryCode"
                    value={phoneData.countryCode}
                    onChange={handlePhoneChange}
                    placeholder="212"
                    maxLength={3}
                    style={{ border: 'none', outline: 'none', width: '100%', padding: '13px 17px' }}
                  />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="number"
                  value={phoneData.number}
                  onChange={handlePhoneChange}
                  placeholder={t('contact.phone_placeholder')}
                  className={errors.phone ? 'error' : ''}
                />
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="message">{t('contact.message_label')} <span className="required-star">*</span></label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange}
                placeholder={t('contact.message_placeholder')} rows="6" className={errors.message ? 'error' : ''} />
              {errors.message && <span className="error-message">{errors.message}</span>}
            </div>

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? t('auth.sending') : t('contact.submit_button')}
            </button>
          </form>

          <div className="contact-info-grid">
            <div className="contact-info-item">
              <div className="info-icon"><i className="fa-solid fa-envelope"></i></div>
              <h3>{t('contact.email_info')}</h3>
              <p>mecapro.info@gmail.com</p>
            </div>
            <div className="contact-info-item">
              <div className="info-icon"><i className="fa-solid fa-phone"></i></div>
              <h3>{t('contact.phone_info')}</h3>
              <p>+212 6 66 66 66 66</p>
            </div>
            <div className="contact-info-item">
              <div className="info-icon"><i className="fa-solid fa-location-dot"></i></div>
              <h3>{t('contact.location_info')}</h3>
              <p>AV.rue 31, selouane, Nador, Morocco</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;