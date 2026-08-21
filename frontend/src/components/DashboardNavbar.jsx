import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import './DashboardNavbar.css';

const DashboardNavbar = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (i18n.language === 'ar') {
      i18n.changeLanguage('fr');
    }
  }, [i18n.language, i18n]);

  // Dashboard: EN + FR only (no Arabic)
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
  ];
  const currentLang = languages.find(l => l.code === i18n.language?.split('-')[0]) || languages[0];

  const handleLogout = () => {
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('USER_NAME');
    localStorage.removeItem('USER_ROLE');
    navigate('/login');
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '';

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-left">
        <span className="welcome-text">{t('dashboard.welcome_back')}</span>
        <h2 className="user-name">{user?.name} !!</h2>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <ThemeToggle />

        {/* EN / FR Language Switcher (dashboards only) */}
        <div className="language-switcher" style={{ position: 'relative' }}>
          <button
            className="language-trigger"
            onClick={() => setShowLangDropdown(v => !v)}
            onBlur={() => setTimeout(() => setShowLangDropdown(false), 200)}
          >
            <span className="language-code">{currentLang.code.toUpperCase()}</span>
            <svg className={`language-arrow ${showLangDropdown ? 'open' : ''}`} width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {showLangDropdown && (
            <div className="language-dropdown">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`language-option ${currentLang.code === lang.code ? 'active' : ''}`}
                  onMouseDown={() => {
                    i18n.changeLanguage(lang.code);
                    localStorage.setItem('language', lang.code);
                    setShowLangDropdown(false);
                  }}
                >
                  <span className="language-label">{lang.label}</span>
                  {currentLang.code === lang.code && (
                    <svg className="language-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="profile-container" onClick={toggleDropdown}>
          <div className="avatar-circle">{initial}</div>
          <div className="profile-info">
            <span className="p-name">{user?.name}</span>
            <span className="p-role">
              {user?.role?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          </div>
          <span className="dropdown-arrow">▼</span>

          {showDropdown && (
            <div className="dropdown-menu">
              <button
                onClick={() => navigate(`/${user?.role?.toLowerCase().replace(/_/g, '')}/profile`)}
                className="dropdown-item"
              >
                <i className="fa-regular fa-user"></i> {t('profile.title')}
              </button>
              <button onClick={handleLogout} className="dropdown-item logout">
                <i className="fa-solid fa-arrow-right-from-bracket"></i> {t('dashboard.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;