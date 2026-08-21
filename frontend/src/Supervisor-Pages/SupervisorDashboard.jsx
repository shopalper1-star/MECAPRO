import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import UserManagement from '../components/UserManagement';
import DashboardNavbar from '../components/DashboardNavbar';
import SupervisorSidebar from '../components/SupervisorSidebar';
import "./SupervisorDashboard.css";

/* ── Placeholder visualizations for sidebar sections ── */
const SectionPlaceholder = ({ icon, title, description, badge }) => (
  <div className="section-placeholder">
    <div className="placeholder-icon">
      <i className={icon}></i>
    </div>
    <h2 className="placeholder-title">{title}</h2>
    {badge && <span className="placeholder-badge">{badge}</span>}
    <p className="placeholder-desc">{description}</p>
  </div>
);

const VehiclesSection = ({ VEHICLES, t }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-bar-chart-2-line"></i> {t('supervisor.dashboard.analytics_title', 'hadak')}</h1>
      <p className="section-subtitle">{t('supervisor.dashboard.analytics_desc', 'Interactive Metabase analytics dashboard for full operational oversight.')}</p>
    </div>
    <div className="analytics-container">
      {VEHICLES ? (
        <iframe
          src={VEHICLES}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>{t('supervisor.dashboard.metabase_not_configured', 'Your Metabase dashboard URL is not configured yet.')}<br /></p>
        </div>
      )}
    </div>
  </div>
);


const PartsSection = ({ topparts, t }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-tools-line"></i> {t('supervisor.dashboard.parts_title', 'Parts Management')}</h1>
      <p className="section-subtitle">{t('supervisor.dashboard.parts_desc', 'Overview of parts inventory, usage, and low-stock alerts.')}</p>
    </div>
    <div className="analytics-container">
      {topparts ? (
        <iframe
          src={topparts}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>{t('supervisor.dashboard.metabase_not_configured', 'Your Metabase dashboard URL is not configured yet.')}<br /></p>
        </div>
      )}
    </div>
  </div>
);

const AppointmentsSection = ({ appointments, t }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-calendar-check-line"></i> {t('supervisor.dashboard.appointments_title', 'Appointments')}</h1>
      <p className="section-subtitle">{t('supervisor.dashboard.appointments_desc', 'Monitor scheduled appointments and daily workload distribution.')}</p>
    </div>
    <div className="analytics-container">
      {appointments ? (
        <iframe
          src={appointments}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>{t('supervisor.dashboard.metabase_not_configured', 'Your Metabase dashboard URL is not configured yet.')}<br /></p>
        </div>
      )}
    </div>
  </div>
);


const TopClientSection = ({ topclients, t }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-car-line"></i> {t('supervisor.dashboard.repairs_title', 'Repairs')}</h1>
      <p className="section-subtitle">{t('supervisor.dashboard.repairs_desc', 'Live repair pipeline status across all mechanics.')}</p>
    </div>
    <div className="analytics-container">
      {topclients ? (
        <iframe
          src={topclients}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>{t('supervisor.dashboard.metabase_not_configured', 'Your Metabase dashboard URL is not configured yet.')}<br /></p>
        </div>
      )}
    </div>
  </div>
);

const TopServicesSection = ({ topservices, t }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-file-chart-line"></i> {t('supervisor.dashboard.reports_title', 'Reports')}</h1>
      <p className="section-subtitle">{t('supervisor.dashboard.reports_desc', 'Generate and view performance, financial, and operational reports.')}</p>
    </div>
    <div className="analytics-container">
      {topservices ? (
        <iframe
          src={topservices}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>{t('supervisor.dashboard.metabase_not_configured', 'Your Metabase dashboard URL is not configured yet.')}<br /></p>
        </div>
      )}
    </div>
  </div>
);



/* ── Main Dashboard Component ── */
const SupervisorDashboard = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('analytics');

  const user = {
    name: localStorage.getItem('name') || t('common.supervisor', 'Supervisor'),
    role: localStorage.getItem('USER_ROLE') || 'supervisor',
  };

  const VEHICLES = "http://localhost:3000/public/dashboard/75bf10c1-b61c-4514-94be-236a8b3ba7ff#theme=night&background=false&bordered=false";
  const appointments = "http://localhost:3000/public/dashboard/c3419e01-1f80-4369-82bf-26e2f2fa019d#theme=night&background=false&bordered=false";
  const topclients = "http://localhost:3000/public/dashboard/f9ed40f8-b3e4-4d6d-b7fb-92b481d9cddc#theme=night&background=false&bordered=false";
  const topservices = "http://localhost:3000/public/dashboard/9d4d5022-b9d4-4ebd-9d93-40014641c770#theme=night&background=false&bordered=false";
  const topparts = "http://localhost:3000/public/dashboard/9e336cf7-fab9-4223-9bbb-81360f15c7a1#theme=night&background=false&bordered=false";


  const renderSection = () => {
    switch (activeSection) {
      case 'analytics': return <TopClientSection topclients={topclients} t={t} />;
      case 'user-management': return <UserManagement t={t} />;
      case 'parts': return <PartsSection topparts={topparts} t={t} />;
      case 'appointments': return <AppointmentsSection appointments={appointments} t={t} />;
      case 'repairs': return <TopServicesSection topservices={topservices} t={t}/>;
      case 'reports': return <VehiclesSection VEHICLES={VEHICLES} t={t}/>;
      default: return null;
    }
  };

  return (
    <div className="supervisor-dashboard-container">
      <DashboardNavbar user={user} />

      <div className="supervisor-app-body">
        {/* ── Left Sidebar ── */}
        <SupervisorSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* ── Main Content ── */}
        <main className="supervisor-main">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
