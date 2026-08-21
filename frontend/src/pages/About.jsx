import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WorkshopImage from '/images/workshop-car.jpg';
import './About.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


// --- Helper Component: Animated Counter ---
const AnimatedCounter = ({ target, suffix = "", duration = 2000, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const end = parseFloat(target);
          const totalFrames = (duration / 1000) * 60;
          const increment = end / totalFrames;
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 1000 / 60);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => { if (elementRef.current) observer.unobserve(elementRef.current); };
  }, [target, duration]);

  return (
    <span ref={elementRef} className="stat-number">
      {count.toFixed(decimals)}{suffix}
    </span>
  );
};

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="about-page">

      {/* 1. Header Section */}
      <div className="about-header">
        <div className="about-header-content">
          <h1>{t('about.title')}</h1>
          <p>{t('about.subtitle')}</p>
        </div>
      </div>

      {/* 2. Main Story Section */}
      <div className="about-container">
        <div className="story-section">
          <div className="story-text">
            <h2>{t('about.story_title')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('about.story_p1_html') }} />
            <p>{t('about.story_p2')}</p>
            <span>
              <Link to="/moreabout" className="more-link">{t('about.see_more')}</Link>
            </span>
          </div>

          <div className="story-image-placeholder">
            <img src={WorkshopImage} alt="Workshop Image" />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <AnimatedCounter target={3} suffix="+" decimals={0} />
            <span className="stat-label">{t('about.years')}</span>
          </div>
          <div className="stat-card">
            <AnimatedCounter target={4.7} suffix="★" decimals={1} />
            <span className="stat-label">{t('about.rating')}</span>
          </div>
          <div className="stat-card">
            <AnimatedCounter target={17} suffix="" decimals={0} />
            <span className="stat-label">{t('about.technicians')}</span>
          </div>
          <div className="stat-card">
            <AnimatedCounter target={1.3} suffix="K+" decimals={1} />
            <span className="stat-label">{t('about.serviced')}</span>
          </div>
        </div>

        {/* 3. Why Choose Us */}
        <div className="values-section">
          <div className="section-title">
            <h2>{t('about.why_title')}</h2>
            <div className="title-underline"></div>
          </div>

          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon"><i className="fa-regular fa-circle-check"></i></div>
              <h3>{t('about.certified')}</h3>
              <p>{t('about.certified_desc')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><i className="fa-regular fa-clock"></i></div>
              <h3>{t('about.fast')}</h3>
              <p>{t('about.fast_desc')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon"><i className="fa-regular fa-credit-card"></i></div>
              <h3>{t('about.transparent')}</h3>
              <p>{t('about.transparent_desc')}</p>
            </div>
          </div>
        </div>

        {/* 4. CTA Section */}
        <div className="cta-banner">
          <h2>{t('about.cta_title')}</h2>
          <p>{t('about.cta_subtitle')}</p>
          <Link to="/contact" className="cta-button">{t('about.cta_button')}</Link>
        </div>

      </div>
    </div>
  );
};

export default About;