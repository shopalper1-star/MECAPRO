import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import MECHANIC from "/images/MECHANIC.png";
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Public navbar supports all 3 languages including Arabic
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language?.split('-')[0]) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleScrollToTracking = (e) => {
    e.preventDefault();
    const sectionId = "checkstatus-btn";
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link className="navbar-left" to="/">
          <div className="navbar-logo-mark">
            <img src={MECHANIC} alt="MecaPro logo" className="logo" />
          </div>
          <span className="navbar-logo-text">MecaPro</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar-links">
          <NavLink className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} to="/" end>
            {t('navbar.home')}
          </NavLink>
          <NavLink className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} to="/about">
            {t('navbar.about')}
          </NavLink>
          <NavLink className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} to="/contact">
            {t('navbar.contact')}
          </NavLink>
        </nav>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link className="btn-outline" to="/login">{t('navbar.login')}</Link>
          <Link className="btn-primary" to="/signup">{t('navbar.signup')}</Link>
          <ThemeToggle />

          <div className="language-switcher">
            <button
              className="language-trigger"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
            >
              <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
              <svg
                className={`language-arrow ${isLangDropdownOpen ? 'open' : ''}`}
                width="12" height="8" viewBox="0 0 12 8" fill="none"
              >
                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {isLangDropdownOpen && (
              <div className="language-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${currentLanguage.code === lang.code ? 'active' : ''}`}
                    onMouseDown={() => { changeLanguage(lang.code); setIsLangDropdownOpen(false); }}
                  >
                    <span className="language-label">{lang.label}</span>
                    {currentLanguage.code === lang.code && (
                      <svg className="language-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hamburger — mobile/tablet only */}
          <button
            className={`hamburger-btn${isMobileMenuOpen ? ' open' : ''}`}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
          >
            <span className="ham-line" />
            <span className="ham-line" />
            <span className="ham-line" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <NavLink className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"} to="/" end onClick={closeMobileMenu}>
            {t('navbar.home')}
          </NavLink>
          <NavLink className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"} to="/about" onClick={closeMobileMenu}>
            {t('navbar.about')}
          </NavLink>
          <NavLink className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"} to="/contact" onClick={closeMobileMenu}>
            {t('navbar.contact')}
          </NavLink>
          <div className="mobile-nav-footer">
            <Link className="mobile-nav-action outline" to="/login" onClick={closeMobileMenu}>{t('navbar.login')}</Link>
            <Link className="mobile-nav-action primary" to="/signup" onClick={closeMobileMenu}>{t('navbar.signup')}</Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;