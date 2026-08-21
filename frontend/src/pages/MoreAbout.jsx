import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './MoreAbout.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const MoreAbout = () => {
  const { t } = useTranslation();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="ma-v2-wrapper">

      {/* 1. Minimalist Hero */}
      <header className="ma-v2-hero">
        <div className="ma-v2-hero-content">
          <span className="ma-v2-subtitle">{t('more_about.hero.subtitle')}</span>
          <h1>{t('more_about.hero.title_part1')} <span className="text-blue">{t('more_about.hero.title_part2')}</span></h1>
          <p>{t('more_about.hero.desc')}</p>
        </div>
      </header>

      {/* 2. The "Old Way vs New Way" Comparison */}
      <section className="ma-v2-comparison">
        <div className="ma-v2-container">
          <div className="ma-v2-grid-2col">
            <div className="ma-v2-text-block">
              <h2>{t('more_about.comparison.title')}</h2>
              <p>{t('more_about.comparison.desc')}</p>

              <div className="comparison-list">
                <div className="comparison-item bad">
                  <i className="fa-solid fa-xmark"></i>
                  <span>{t('more_about.comparison.bad1')}</span>
                </div>
                <div className="comparison-item good">
                  <i className="fa-solid fa-check"></i>
                  <span>{t('more_about.comparison.good1')}</span>
                </div>

                <div className="comparison-item bad">
                  <i className="fa-solid fa-xmark"></i>
                  <span>{t('more_about.comparison.bad2')}</span>
                </div>
                <div className="comparison-item good">
                  <i className="fa-solid fa-check"></i>
                  <span>{t('more_about.comparison.good2')}</span>
                </div>

                <div className="comparison-item bad">
                  <i className="fa-solid fa-xmark"></i>
                  <span>{t('more_about.comparison.bad3')}</span>
                </div>
                <div className="comparison-item good">
                  <i className="fa-solid fa-check"></i>
                  <span>{t('more_about.comparison.good3')}</span>
                </div>
              </div>
            </div>

            <div className="ma-v2-image-block">
              <div className="image-placeholder-tech">
                <i className="fa-solid fa-laptop-medical"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Our Standards */}
      <section className="ma-v2-standards">
        <div className="ma-v2-container">
          <div className="standards-header">
            <h2>{t('more_about.standards.title')}</h2>
            <div className="blue-bar"></div>
          </div>

          <div className="standards-grid">
            <div className="standard-card">
              <div className="card-number">01</div>
              <h3>{t('more_about.standards.s1_title')}</h3>
              <p>{t('more_about.standards.s1_desc')}</p>
            </div>
            <div className="standard-card">
              <div className="card-number">02</div>
              <h3>{t('more_about.standards.s2_title')}</h3>
              <p>{t('more_about.standards.s2_desc')}</p>
            </div>
            <div className="standard-card">
              <div className="card-number">03</div>
              <h3>{t('more_about.standards.s3_title')}</h3>
              <p>{t('more_about.standards.s3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="ma-v2-cta">
        <div className="ma-v2-cta-content">
          <h2>{t('more_about.cta.title')}</h2>
          <div className="ma-v2-buttons">
            <Link to="/contact" className="btn-solid">{t('more_about.cta.book')}</Link>
            <Link to="/" className="btn-outline">{t('more_about.cta.home')}</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default MoreAbout;