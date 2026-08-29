import API_BASE_URL from '../api.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import { patterns, validationMessages, sanitizeInput } from '../utils/validation';
import { isWeekend } from '../utils/dateUtils';
import "./ReceptionistDashboard.css";

const PAGE_SIZE = 15;

const ReceptionistDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: localStorage.getItem('USER_NAME') || 'Receptionist',
    role: localStorage.getItem('USER_ROLE') || 'Receptionist'
  });

  const [groupedClients, setGroupedClients] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({ todaysAppointments: 0, confirmedToday: 0 });
  const [pendingNegotiationsByClient, setPendingNegotiationsByClient] = useState({});
  const [activeTab, setActiveTab] = useState('clients');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientVehicles, setClientVehicles] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceList, setShowServiceList] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({ vehicle_id: '', mechanic_id: '', description: '', cost: '', date_end: '' });
  const [apptActionLoading, setApptActionLoading] = useState(null);
  const [apptNotes, setApptNotes] = useState({});
  const [mechanicsLoad, setMechanicsLoad] = useState([]);
  const [mechanicsLoadLoading, setMechanicsLoadLoading] = useState(false);
  const [mechanicSearch, setMechanicSearch] = useState('');
  const [showMechanicList, setShowMechanicList] = useState(false);
  const [modalError, setModalError] = useState(null);

  // KPI filter & pagination
  const [kpiFilter, setKpiFilter] = useState(''); // '' | 'today' | 'confirmed' | 'pending_appts'
  const [clientsPage, setClientsPage] = useState(1);
  const [apptsPage, setApptsPage] = useState(1);

  useEffect(() => {
    fetchDashboardData();
    fetchServices();
    fetchAppointments();
  }, []);

  // Refetch appointments when switching to appointments tab
  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab]);

  const fetchMechanicsLoad = async () => {
    setMechanicsLoadLoading(true);
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const res = await axios.get(`${API_BASE_URL}/receptionist/mechanics-load`,  {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMechanicsLoad(res.data || []);
    } catch (err) {
      console.error('Error fetching mechanics load', err);
    } finally {
      setMechanicsLoadLoading(false);
    }
  };

  // Reset pages when filter/search/tab changes
  useEffect(() => { setClientsPage(1); }, [dashboardSearch, kpiFilter]);
  useEffect(() => { setApptsPage(1); }, [kpiFilter, activeTab]);

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/services`);
      setServices(res.data);
    } catch (err) { console.error("Error fetching services", err); }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      if (!token) {
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/receptionist/appointments`,  {
        headers: { Authorization: `Bearer ${token}` }
      });
      const apptData = res.data.data || res.data || [];
      setAppointments(apptData);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const loadingTimeout = setTimeout(() => setLoading(false), 3000);
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const authConfig = { headers: { Authorization: `Bearer ${token}` } };
      const [clientRes, dashRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/receptionist/clients-summary`,  authConfig),
        axios.get(`${API_BASE_URL}/receptionist/dashboard`,  authConfig)
      ]);
      
      const repairsData = dashRes.data.repairs || [];
      const cMap = {};
      repairsData.forEach(r => {
        if (r.vehicle && r.vehicle.client_id) {
          const clientId = r.vehicle.client_id;
          if (!cMap[clientId]) {
             cMap[clientId] = {
               id: clientId,
               name: r.vehicle.owner_name || 'Unknown',
               email: '',
               vehiclesSet: new Set(),
               repairs_count: 0
             };
          }
          cMap[clientId].repairs_count += 1;
          cMap[clientId].vehiclesSet.add(r.vehicle.id);
        }
      });
      const derivedClients = Object.values(cMap).map(c => ({
        ...c,
        vehicles: Array.from(c.vehiclesSet)
      }));
      setGroupedClients(derivedClients);

      if (dashRes.data.user) {
        setUser(dashRes.data.user);
        localStorage.setItem('USER_NAME', dashRes.data.user.name);
        localStorage.setItem('USER_ROLE', dashRes.data.user.role);
      }
      setMechanics(dashRes.data.mechanics || []);
      setRepairs(dashRes.data.repairs || []);
      setDashboardStats(dashRes.data.stats || { todaysAppointments: 0, confirmedToday: 0 });
      setPendingNegotiationsByClient(dashRes.data.pending_negotiations_by_client || {});
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) handleLogout();
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  const handleClientClick = (client) => {
    const safeName = client.name ? client.name.replace(/\s+/g, '-') : 'Client';
    navigate(`/receptionist/client/${client.id}/${safeName}`);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      await axios.post(`${API_BASE_URL}/logout`,  {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { console.error("Logout failed", error); }
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('USER_NAME');
    localStorage.removeItem('USER_ROLE');
    navigate('/login');
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
  };

  const handleApptApprove = async (id) => {
    setApptActionLoading(id + '-approve');
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      await axios.post(`${API_BASE_URL}/receptionist/appointments/${id}/approve`,
        { notes: apptNotes[id] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage(t('receptionist.modal.success'), 'success');
      fetchAppointments();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to approve.', 'error');
    } finally { setApptActionLoading(null); }
  };

  const handleApptDecline = async (id) => {
    setApptActionLoading(id + '-decline');
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      await axios.post(`${API_BASE_URL}/receptionist/appointments/${id}/decline`,
        { notes: apptNotes[id] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage(t('receptionist.modal.success'), 'success');
      fetchAppointments();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to decline.', 'error');
    } finally { setApptActionLoading(null); }
  };

  const getKPIData = () => {
    if (
      typeof dashboardStats?.todaysAppointments === 'number' &&
      typeof dashboardStats?.confirmedToday === 'number'
    ) {
      return dashboardStats;
    }
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = repairs.filter(r => r.date_end && r.date_end.startsWith(today)).length;
    const confirmedToday = repairs.filter(r => r.date_end?.startsWith(today) && r.status?.toLowerCase().trim() === 'completed').length;
    return { todaysAppointments, confirmedToday };
  };

  const { todaysAppointments, confirmedToday } = getKPIData();
  const pendingAppts = appointments.filter(a => a.status === 'Pending').length;

  // ─── KPI click handlers ─────────────────────────────────────────────
  const handleKpiTodayAppts = () => {
    setActiveTab('clients');
    setKpiFilter('today');
    setDashboardSearch('');
    setClientsPage(1);
  };

  const handleKpiConfirmed = () => {
    setActiveTab('appointments');
    setKpiFilter('confirmed');
    setApptsPage(1);
  };

  const handleKpiPending = () => {
    setActiveTab('appointments');
    setKpiFilter('pending_appts');
    setApptsPage(1);
  };

  const clearKpiFilter = () => {
    setKpiFilter('');
    setClientsPage(1);
    setApptsPage(1);
  };

  // ─── Filtered data ──────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  const filteredClients = (() => {
    let list = groupedClients;
    if (dashboardSearch) {
      const lwr = dashboardSearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(lwr) || (c.email && c.email.toLowerCase().includes(lwr)));
    }
    if (kpiFilter === 'today') {
      // clients who have at least one repair with date_end today
      const todayClientIds = new Set(
        repairs.filter(r => r.date_end?.startsWith(today)).map(r => r.vehicle?.client_id)
      );
      list = list.filter(c => todayClientIds.has(c.id));
    }
    return list;
  })();

  const filteredAppointments = (() => {
    if (kpiFilter === 'confirmed') return appointments.filter(a => a.status === 'Approved');
    if (kpiFilter === 'pending_appts') return appointments.filter(a => a.status === 'Pending');
    return appointments;
  })();

  // Pagination slices
  const totalClientPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const pagedClients = filteredClients.slice((clientsPage - 1) * PAGE_SIZE, clientsPage * PAGE_SIZE);

  const totalApptPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const pagedAppointments = filteredAppointments.slice((apptsPage - 1) * PAGE_SIZE, apptsPage * PAGE_SIZE);

  // ─── Helpers ────────────────────────────────────────────────────────
  const handleClientSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 0) {
      try {
        const token = localStorage.getItem('ACCESS_TOKEN');
        const res = await axios.get(`${API_BASE_URL}/receptionist/clients/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
      } catch (err) { console.error(err); }
    } else { setSearchResults([]); }
  };

  const selectClient = async (client) => {
    setSelectedClient(client);
    setSearchQuery(client.name);
    setSearchResults([]);
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const res = await axios.get(`${API_BASE_URL}/receptionist/clients/${client.id}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientVehicles(res.data);
    } catch (err) { showMessage("Could not load vehicles", "error"); }
  };

  const filteredServices = services.filter(service => {
    if (!serviceSearch) return true;
    const searchLower = serviceSearch.toLowerCase();
    return service.name.toLowerCase().includes(searchLower) || (service.zone && service.zone.toLowerCase().includes(searchLower));
  });

  const calculateTotal = (servicesList) => {
    const total = servicesList.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    setFormData(prev => ({ ...prev, cost: total }));
  };

  const selectService = (service) => {
    if (selectedServices.some(s => s.id === service.id)) { setServiceSearch(''); setShowServiceList(false); return; }
    const updatedList = [...selectedServices, service];
    setSelectedServices(updatedList);
    calculateTotal(updatedList);
    setServiceSearch('');
    setShowServiceList(false);
  };

  const removeService = (serviceId) => {
    const updatedList = selectedServices.filter(s => s.id !== serviceId);
    setSelectedServices(updatedList);
    calculateTotal(updatedList);
  };

  const getDatePart = () => formData.date_end ? formData.date_end.split('T')[0] : '';
  const getTimePart = () => formData.date_end ? formData.date_end.split('T')[1] : '';

  const handleDatePartChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) { setFormData({ ...formData, date_end: '' }); return; }

    if (isWeekend(newDate)) {
      showMessage(t('receptionist.modal.weekend_not_allowed', 'Weekends (Saturday & Sunday) are not allowed.'), 'error');
      setFormData({ ...formData, date_end: '' });
      return;
    }

    const currentTime = getTimePart() || '08:00';
    setFormData({ ...formData, date_end: `${newDate}T${currentTime}` });
  };

  const handleTimePartChange = (e) => {
    const newTime = e.target.value;
    const currentDate = getDatePart();
    if (currentDate && newTime) setFormData({ ...formData, date_end: `${currentDate}T${newTime}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!formData.vehicle_id || !formData.mechanic_id || !formData.date_end) {
      setModalError(t('receptionist.modal.fill_required')); return;
    }
    if (selectedServices.length === 0) {
      setModalError(t('receptionist.modal.select_service_error')); return;
    }
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const payload = { ...formData, service_ids: selectedServices.map(s => s.id) };
      const response = await axios.post(`${API_BASE_URL}/receptionist/jobs`,  payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        setFormData({ vehicle_id: '', mechanic_id: '', description: '', cost: '', date_end: '' });
        setSelectedServices([]);
        setSearchQuery('');
        setServiceSearch('');
        setSelectedClient(null);
        setModalError(null);
        fetchDashboardData();
        showMessage(t('receptionist.modal.success'), "success");
      }
    } catch (err) {
      console.error("Error:", err);
      const msg = err.response?.data?.message || t('receptionist.modal.error');
      setModalError(msg);
      if (err.response?.status !== 422) {
        showMessage(msg, "error");
      }
      // Refresh mechanics load so the UI reflects current state
      fetchMechanicsLoad();
    }
  };

  const apptStatusBadge = (status) => {
    const cls = { Pending: 'appt-badge-pending', Approved: 'appt-badge-approved', Declined: 'appt-badge-declined' };
    return <span className={`appt-badge-r ${cls[status] || ''}`}>{status}</span>;
  };

  // Active KPI filter label
  const kpiFilterLabel = kpiFilter === 'today'
    ? t('receptionist.today_appointments')
    : kpiFilter === 'confirmed'
      ? t('receptionist.confirmed_appointments')
      : kpiFilter === 'pending_appts'
        ? t('receptionist.add_appointment')
        : null;

  // ─── Pagination component ────────────────────────────────────────────
  const Pagination = ({ page, totalPages, onPrev, onNext }) => (
    <div className="r-pagination">
      <button className="r-page-btn" onClick={onPrev} disabled={page <= 1}>
        <i className="fa-solid fa-chevron-left"></i> {t('pagination.prev')}
      </button>
      <span className="r-page-info">
        {t('pagination.page_of', { current: page, total: totalPages })}
      </span>
      <button className="r-page-btn" onClick={onNext} disabled={page >= totalPages}>
        {t('pagination.next')} <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );

  return (
    <div className="receptionist-container">
      <DashboardNavbar user={user} onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} />

      <div className="kpi-container">
        <div
          className={`kpi-card ${kpiFilter === 'today' ? 'kpi-card-active' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={handleKpiTodayAppts}
        >
          <div className="kpi-icon"><i className="fa-regular fa-calendar"></i></div>
          <div className="kpi-info"><h3>{t('receptionist.today_appointments')}</h3><p className="kpi-number">{todaysAppointments}</p></div>
        </div>
        <div
          className={`kpi-card ${kpiFilter === 'confirmed' ? 'kpi-card-active' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={handleKpiConfirmed}
        >
          <div className="kpi-icon success-icon"><i className="fa-regular fa-circle-check"></i></div>
          <div className="kpi-info"><h3>{t('receptionist.confirmed_appointments')}</h3><p className="kpi-number">{confirmedToday}</p></div>
        </div>
        <div
          className={`kpi-card ${kpiFilter === 'pending_appts' ? 'kpi-card-active' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={handleKpiPending}
        >
          <div className="kpi-icon" style={{ background: '#fffbeb' }}><i className="fa-solid fa-calendar-days" style={{ color: '#d97706' }}></i></div>
          <div className="kpi-info"><h3>{t('receptionist.add_appointment')}</h3><p className="kpi-number">{pendingAppts}</p></div>
        </div>
      </div>

      <div className="header-actions">
        <h1>{t('receptionist.title')}</h1>
        <button className="add-btn" onClick={() => { setShowModal(true); fetchMechanicsLoad(); setModalError(null); }}>+ {t('receptionist.add_appointment')}</button>
      </div>

      {/* Tabs */}
      <div className="r-tabs">
        <button className={`r-tab ${activeTab === 'clients' ? 'r-tab-active' : ''}`} onClick={() => setActiveTab('clients')}>
          <i className="fa-solid fa-users"></i> {t('receptionist.title')}
        </button>
        <button className={`r-tab ${activeTab === 'appointments' ? 'r-tab-active' : ''}`} onClick={() => setActiveTab('appointments')}>
          <i className="fa-solid fa-calendar-check"></i> {t('receptionist.add_appointment')}
          {pendingAppts > 0 && <span className="r-tab-badge">{pendingAppts}</span>}
        </button>
      </div>

      {/* Active KPI Filter indicator */}
      {kpiFilter && (
        <div className="r-filter-banner">
          <i className="fa-solid fa-filter"></i>
          <span>{t('receptionist.search_placeholder').split('...')[0]}: <strong>{kpiFilterLabel}</strong></span>
          <button className="r-filter-clear" onClick={clearKpiFilter}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {!showModal && message && (
        <div className={`alert-message ${messageType}`}><span>{message}</span></div>
      )}

      {activeTab === 'clients' ? (
        <>
          <div className="search-filter-bar">
            <input
              type="text"
              placeholder={t('receptionist.search_placeholder')}
              className="dashboard-search-input"
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
            />
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr><th>{t('receptionist.client_name')}</th><th>{t('receptionist.total_vehicles')}</th><th>{t('receptionist.repairs_history')}</th><th>{t('receptionist.action')}</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: 0 }}>
                      <SkeletonLoader type="table-rows" cols={4} count={5} />
                    </td>
                  </tr>
                ) : pagedClients.length > 0 ? (
                  pagedClients.map(client => {
                    const clientPendingNegs = pendingNegotiationsByClient[String(client.id)] ??
                      repairs.filter(r => r.vehicle?.client_id === client.id && r.status?.toLowerCase().trim() === 'negotiation requested').length;
                    return (
                      <tr key={client.id} className="clickable-row" onClick={() => handleClientClick(client)}>
                        <td><strong>{client.name}</strong><div className="sub-text">{client.email}</div></td>
                        <td>{client.vehicles?.length || 0} {t('receptionist.total_vehicles')}</td>
                        <td><span className="status-badge progress">{client.repairs_count} {t('receptionist.repairs_history')}</span></td>
                        <td>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button className="action-btn view-btn"><i className="fa-solid fa-eye"></i> {t('receptionist.view_history')}</button>
                            {clientPendingNegs > 0 && (
                              <span className="r-tab-badge" style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}>
                                {clientPendingNegs}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })) : (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>{t('receptionist.no_clients')}</td></tr>
                )}
              </tbody>
            </table>
            {filteredClients.length > PAGE_SIZE && (
              <Pagination
                page={clientsPage}
                totalPages={totalClientPages}
                onPrev={() => setClientsPage(p => Math.max(1, p - 1))}
                onNext={() => setClientsPage(p => Math.min(totalClientPages, p + 1))}
              />
            )}
          </div>
        </>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>{t('receptionist.client_name')}</th>
                <th>{t('receptionist.details.vehicle')}</th>
                <th>{t('receptionist.details.start_date')}</th>
                <th>{t('receptionist.details.description', 'Description')}</th>
                <th>{t('receptionist.details.status')}</th>
                <th>{t('receptionist.details.action')}</th>
              </tr>
            </thead>
            <tbody>
              {pagedAppointments.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>{t('receptionist.details.no_repairs')}</td></tr>
              ) : pagedAppointments.map(appt => (
                <tr key={appt.id}>
                  <td><strong>{appt.client?.name}</strong><div className="sub-text">{appt.client?.email}</div></td>
                  <td>{appt.vehicle ? `${appt.vehicle.make} ${appt.vehicle.model}` : '—'}</td>
                  <td>{new Date(appt.preferred_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td style={{ maxWidth: '180px', fontSize: '0.85rem', color: '#6b7280' }}>{appt.description || '—'}</td>
                  <td>{apptStatusBadge(appt.status)}</td>
                  <td>
                    {appt.status === 'Pending' ? (
                      <div className="appt-action-col">
                        <input
                          type="text"
                          className="appt-notes-input"
                          placeholder="Optional notes..."
                          value={apptNotes[appt.id] || ''}
                          onChange={(e) => setApptNotes(prev => ({ ...prev, [appt.id]: e.target.value }))}
                        />
                        <div className="appt-action-row">
                          <button className="appt-btn-approve" disabled={apptActionLoading === appt.id + '-approve'} onClick={() => handleApptApprove(appt.id)}>
                            {apptActionLoading === appt.id + '-approve' ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> {t('dashboard.approve')}</>}
                          </button>
                          <button className="appt-btn-decline" disabled={apptActionLoading === appt.id + '-decline'} onClick={() => handleApptDecline(appt.id)}>
                            {apptActionLoading === appt.id + '-decline' ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-xmark"></i> {t('receptionist.modal.cancel')}</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{appt.receptionist_notes || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAppointments.length > PAGE_SIZE && (
            <Pagination
              page={apptsPage}
              totalPages={totalApptPages}
              onPrev={() => setApptsPage(p => Math.max(1, p - 1))}
              onNext={() => setApptsPage(p => Math.min(totalApptPages, p + 1))}
            />
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t('receptionist.modal.title')}</h2>
            {modalError && (
              <div className="alert-message error" style={{ marginBottom: '12px' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
                {modalError}
              </div>
            )}
            {!modalError && message && <div className={`alert-message ${messageType}`}>{message}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('receptionist.modal.customer')}</label>
                <input type="text" className="form-control" placeholder={t('receptionist.modal.customer_placeholder')} value={searchQuery} onChange={handleClientSearch} />
                {searchResults.length > 0 && (
                  <ul className="suggestions-list">
                    {searchResults.map(c => <li key={c.id} onClick={() => selectClient(c)}>{c.name}</li>)}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.vehicle')}</label>
                <select className="form-control" value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} disabled={!selectedClient}>
                  <option value="">{t('receptionist.modal.select_vehicle')}</option>
                  {clientVehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
                </select>
              </div>

              {selectedServices.length > 0 && (
                <div className="selected-services-container" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('receptionist.modal.selected_services')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedServices.map(s => (
                      <span key={s.id} style={{ background: '#e3f2fd', color: '#005DFFFF', padding: '6px 10px', borderRadius: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #b3d7ff' }}>
                        {s.name} - {s.zone} ({s.price} MAD)
                        <i className="fa-solid fa-xmark" style={{ cursor: 'pointer', color: '#ff4d4d' }} onClick={() => removeService(s.id)}></i>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ position: 'relative' }}>
                <label>{t('receptionist.modal.add_service')}</label>
                <input
                  type="text" className="form-control" placeholder={t('receptionist.modal.service_placeholder')}
                  value={serviceSearch}
                  onChange={(e) => { setServiceSearch(e.target.value); setShowServiceList(true); }}
                  onFocus={() => setShowServiceList(true)}
                  onBlur={() => setTimeout(() => setShowServiceList(false), 200)}
                />
                {showServiceList && (
                  <ul className="suggestions-list service-list">
                    {filteredServices.length > 0 ? filteredServices.map(s => (
                      <li key={s.id} onMouseDown={() => selectService(s)}>
                        <div className="service-row"><span className="service-name">{s.name}</span><span className="service-zone">{s.zone || 'General'}</span></div>
                        <span className="service-price">{s.price} MAD</span>
                      </li>
                    )) : <li className="no-result">{t('receptionist.modal.no_services')}</li>}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.total_cost')}</label>
                <input type="number" className="form-control" value={formData.cost} readOnly />
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.notes')}</label>
                <input type="text" className="form-control" placeholder={t('receptionist.modal.notes_placeholder')} value={formData.description} onChange={e => setFormData({ ...formData, description: sanitizeInput('description', e.target.value) })} />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>{t('receptionist.modal.mechanic')}</label>
                {mechanicsLoadLoading ? (
                  <div style={{ padding: '10px', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                    {t('receptionist.modal.loading_mechanics', 'Loading mechanics...')}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('receptionist.modal.mechanic_placeholder', 'Select a mechanic...')}
                      value={mechanicSearch}
                      onChange={(e) => {
                        setMechanicSearch(e.target.value);
                        setShowMechanicList(true);
                        // Reset selection if typing starts matching nothing or something else
                        if (formData.mechanic_id) setFormData({ ...formData, mechanic_id: '' });
                      }}
                      onFocus={() => setShowMechanicList(true)}
                      onBlur={() => setTimeout(() => setShowMechanicList(false), 200)}
                    />
                    {showMechanicList && (
                      <ul className="suggestions-list service-list">
                        {mechanicsLoad.filter(m => m.name.toLowerCase().includes(mechanicSearch.toLowerCase())).map(m => {
                          const count = m.repairs_today || 0;
                          const isFull = count >= 5;
                          const badgeClass = count <= 2 ? 'ml-badge-green' : count <= 4 ? 'ml-badge-orange' : 'ml-badge-red';
                          return (
                            <li
                              key={m.id}
                              className={`mechanic-load-item ${isFull ? 'ml-disabled' : ''}`}
                              onMouseDown={() => {
                                if (!isFull) {
                                  setFormData({ ...formData, mechanic_id: m.id });
                                  setMechanicSearch(m.name);
                                  setShowMechanicList(false);
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <span className="ml-name">
                                  <i className="fa-solid fa-user-gear" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                                  {m.name}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '60px' }}>
                                <span className={`ml-badge ${badgeClass}`}>
                                  {count} / 5
                                </span>
                              </div>
                            </li>
                          );
                        })}
                        {mechanicsLoad.filter(m => m.name.toLowerCase().includes(mechanicSearch.toLowerCase())).length === 0 && (
                          <li className="no-result">{t('receptionist.modal.no_active_mechanics', 'No active mechanics found.')}</li>
                        )}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.end_date_time')}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="date" min={new Date().toISOString().split('T')[0]} max={new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0]} className="form-control" value={getDatePart()} onChange={handleDatePartChange} required />
                  <input type="time" className="form-control" value={getTimePart()} onChange={handleTimePartChange} min="08:00" max="20:30" required disabled={!getDatePart()} />
                </div>
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{t('receptionist.modal.working_hours')}</small>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">{t('receptionist.modal.save')}</button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>{t('receptionist.modal.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
