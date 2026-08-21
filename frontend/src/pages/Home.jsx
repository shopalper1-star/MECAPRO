import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Home.css";
import AIDiagnostic from "../components/AIDiagnostic";
import '@fortawesome/fontawesome-free/css/all.min.css';
import PartnerCarousel from "../components/PartnerCarousel";

// TABS generated inside component to allow dynamic translation
const BADGE_STYLES = {
  done: { background: "#222", color: "#555" },
  blue: { background: "#3b82f6", color: "#fff", boxShadow: "0 0 10px rgba(59,130,246,0.3)" },
  warn: { background: "#f59e0b", color: "#000" },
  purple: { background: "#7c3aed", color: "#fff", boxShadow: "0 0 10px rgba(124,58,237,0.3)" },
};

const LINE_COLORS = {
  "": "#222",
  blue: "#3b82f6",
  orange: "#f59e0b",
  purple: "#7c3aed",
};

function Home({ onNavigate }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    {
      icon: "fa-solid fa-layer-group",
      label: "Dashboard",
      header: "Diagnostic Monitor",
      items: [
        { icon: "fa-solid fa-check", iconColor: "#10b981", badge: "DONE", badgeType: "done", lineShortColor: "", lineLong: true },
        { icon: "fa-solid fa-microchip", iconColor: "white", badge: "IN PROGRESS", badgeType: "blue", lineShortColor: "blue", lineLong: true },
      ],
      feed: [
        { text: "> CALIBRATING ENGINE SENSORS...", active: false },
        { text: "> SYSTEM CHECK: OPTIMAL", active: false },
        { text: "> UPDATING INVENTORY...", active: true },
      ],
    },
    {
      icon: "fa-solid fa-screwdriver-wrench",
      label: "Repairs",
      header: "Active Repairs",
      items: [
        { icon: "fa-solid fa-car", iconColor: "#f59e0b", badge: "PENDING", badgeType: "warn", lineShortColor: "orange", lineLong: true },
        { icon: "fa-solid fa-oil-can", iconColor: "#10b981", badge: "DONE", badgeType: "done", lineShortColor: "", lineLong: true },
        { icon: "fa-solid fa-car-burst", iconColor: "white", badge: "ASSIGNED", badgeType: "blue", lineShortColor: "blue", lineLong: true },
      ],
      feed: [
        { text: "> BRAKE PAD REPLACEMENT — BAY 3", active: false },
        { text: "> OIL CHANGE COMPLETE", active: false },
        { text: "> ASSIGNING MECHANIC...", active: true },
      ],
    },
    {
      icon: "fa-solid fa-microchip",
      label: t('home.tabs.ai.label', "AI Scan"),
      header: t('home.tabs.ai.header', "AI Scan Engine"),
      items: [
        { icon: "fa-solid fa-brain", iconColor: "#a78bfa", badge: "SCANNING", badgeType: "purple", lineShortColor: "purple", lineLong: true },
        { icon: "fa-solid fa-chart-bar", iconColor: "#3b82f6", badge: "READY", badgeType: "blue", lineShortColor: "blue", lineLong: true },
      ],
      feed: [
        { text: t('home.tabs.ai.feed1', "> LOADING XGBOOST MODEL..."), active: false },
        { text: t('home.tabs.ai.feed2', "> 20 REPAIR CLASSES ACTIVE"), active: false },
        { text: t('home.tabs.ai.feed3', "> ANALYZING SYMPTOMS..."), active: true },
      ],
    },
    {
      icon: "fa-solid fa-gear",
      label: "Settings",
      header: "System Settings",
      items: [
        { icon: "fa-solid fa-shield-halved", iconColor: "#10b981", badge: "SECURE", badgeType: "done", lineShortColor: "", lineLong: true },
        { icon: "fa-solid fa-database", iconColor: "#f59e0b", badge: "SYNC", badgeType: "warn", lineShortColor: "orange", lineLong: true },
      ],
      feed: [
        { text: "> FIREWALL: ACTIVE", active: false },
        { text: "> DB SYNC: 99.8% UPTIME", active: false },
        { text: "> APPLYING CONFIG...", active: true },
      ],
    },
  ];

  const tab = TABS[activeTab];

  return (
    <main className="page-content home-page">
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-text">
            <h1>{t("home.hero_title")}</h1>
            <p>{t("home.hero_subtitle")}</p>
            <div className="hero-actions">
              <button type="button" className="btn-primary">
                {' '}<Link to="/login">{t("home.get_started")}</Link>
              </button>
              <button type="button" className="btn-outline">
                {' '}<Link to="/contact">{t("home.call_us")}</Link>
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="mockup-bg-layer"></div>

            <div className="dashboard-mockup-v2">
              <div className="scanline"></div>

              <div className="mockup-header">
                <div className="dots"><span></span><span></span><span></span></div>
                <div className="mockup-title">MecaPro OS v2.0 _</div>
              </div>

              <div className="mockup-body">
                {/* Sidebar — now clickable */}
                <div className="mockup-sidebar">
                  {TABS.map((t, i) => (
                    <i
                      key={i}
                      className={`${t.icon} ${activeTab === i ? "active" : ""}`}
                      title={t.label}
                      onClick={() => setActiveTab(i)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>

                {/* Content — switches based on activeTab */}
                <div className="mockup-content">
                  <div className="status-header">
                    <span>{tab.header}</span>
                    <div className="pulse-dot-blue"></div>
                  </div>

                  {tab.items.map((item, i) => (
                    <div
                      key={i}
                      className={`mockup-list-item${item.badgeType === "blue" ? " active-item-blue" : ""}`}
                      style={
                        item.badgeType === "purple"
                          ? { background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }
                          : item.badgeType === "warn"
                            ? { background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }
                            : {}
                      }
                    >
                      <div className="item-icon">
                        <i className={item.icon} style={{ color: item.iconColor }}></i>
                      </div>
                      <div className="item-text">
                        <div className="skeleton-line short" style={{ background: LINE_COLORS[item.lineShortColor] }}></div>
                        <div className="skeleton-line long"></div>
                      </div>
                      <div
                        className="status-badge"
                        style={BADGE_STYLES[item.badgeType]}
                      >
                        {item.badge}
                      </div>
                    </div>
                  ))}

                  <div className="activity-feed">
                    {tab.feed.map((line, i) => (
                      <div key={i} className={`feed-line${line.active ? " active-line" : ""}`}>
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="floating-success-card">
                <i className="fa-solid fa-shield-halved" style={{ color: '#3b82f6' }}></i>
                <span>System Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="section-inner">
          <h2>{t("home.our_services")}</h2>
          <p className="section-subtitle">{t("home.services_subtitle")}</p>
          <div className="card-grid">
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-oil-can"></i></div>
              <h3>{t("home.oil_change")}</h3>
              <p>{t("home.oil_change_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-car-burst"></i></div>
              <h3>{t("home.brakes")}</h3>
              <p>{t("home.brakes_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-gauge-high"></i></div>
              <h3>{t("home.engine")}</h3>
              <p>{t("home.engine_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-car"></i></div>
              <h3>{t("home.tires")}</h3>
              <p>{t("home.tires_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-car-battery"></i></div>
              <h3>{t("home.battery")}</h3>
              <p>{t("home.battery_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-fan"></i></div>
              <h3>{t("home.ac")}</h3>
              <p>{t("home.ac_desc")}</p>
            </article>
          </div>
          <div className="section-cta">
            <button type="button" className="btn-primary">
              {' '}<Link to="/services">{t("home.view_all")}</Link>
            </button>
          </div>
        </div>
      </section>

      <PartnerCarousel />

      <div style={{ padding: '40px 0' }} />

      <section className="why-section">
        <div className="section-inner">
          <h2>{t("home.why_choose_us")}</h2>
          <p className="section-subtitle">{t("home.why_subtitle")}</p>
          <div className="card-grid">
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-screwdriver-wrench"></i></div>
              <h3>{t("home.expert_mechanics")}</h3>
              <p>{t("home.expert_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-hourglass-end"></i></div>
              <h3>{t("home.fast_turnaround")}</h3>
              <p>{t("home.fast_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-shield-halved"></i></div>
              <h3>{t("home.secure_warranty")}</h3>
              <p>{t("home.warranty_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon"><i className="fa-solid fa-dollar-sign"></i></div>
              <h3>{t("home.affordable_pricing")}</h3>
              <p>{t("home.pricing_desc")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="ai-section">
        <div className="section-inner ai-section-inner">
          <span className="ai-section-badge"><i class="fa-solid fa-robot"></i> {t('home.ai_badge', 'AI Powered')}</span>
          <h2>{t("home.ai_title", "Auto Repair Diagnostic")}</h2>
          <p className="section-subtitle">{t("home.ai_subtitle", "Describe your vehicle symptoms and get instant AI-powered repair predictions with cost estimates.")}</p>
          <AIDiagnostic />
        </div>
      </section>
    </main>
  );
}

export default Home;