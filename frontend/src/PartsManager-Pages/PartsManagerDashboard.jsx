import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import { patterns, validationMessages, sanitizeInput } from '../utils/validation';
import './PartsManagerDashboard.css';

const BASE = 'http://127.0.0.1:8000/api';
const PAGE_SIZE = 15;

const EMPTY_PART = { name: '', zone: '', category: '', cost: '', price: '', stock_quantity: '', reference_number: '' };
const EMPTY_SERVICE = { name: '', zone: '', price: '' };

const PartsManagerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: localStorage.getItem('USER_NAME') || 'Parts Manager',
    role: localStorage.getItem('USER_ROLE') || 'parts_manager'
  });

  // --- Data ---
  const [parts, setParts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [kpis, setKpis] = useState({ total_parts: 0, pending_count: 0, low_stock_count: 0 });

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'requests'
  const [search, setSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [declineModal, setDeclineModal] = useState({ show: false, id: null, notes: '' });

  // --- Pagination ---
  const [partsPage, setPartsPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);

  // --- Add Part Modal ---
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [partForm, setPartForm] = useState(EMPTY_PART);
  const [partFormErrors, setPartFormErrors] = useState({});
  const [submittingPart, setSubmittingPart] = useState(false);

  // --- Add Service Modal ---
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [serviceFormErrors, setServiceFormErrors] = useState({});
  const [submittingService, setSubmittingService] = useState(false);

  const token = localStorage.getItem('ACCESS_TOKEN');
  const headers = { Authorization: `Bearer ${token}` };

  const showMsg = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    const loadingTimeout = setTimeout(() => setLoading(false), 3000);
    try {
      const [dashRes, reqRes, userRes] = await Promise.all([
        axios.get(`${BASE}/parts-manager/dashboard`, { headers }),
        axios.get(`${BASE}/parts-manager/requests`, { headers }),
        axios.get(`${BASE}/user`, { headers }),
      ]);
      setParts(dashRes.data.parts || []);
      setKpis({
        total_parts: dashRes.data.total_parts,
        pending_count: dashRes.data.pending_count,
        low_stock_count: dashRes.data.low_stock_count,
      });
      setRequests(reqRes.data || []);

      const userData = {
        name: userRes.data.name || userRes.data.user?.name,
        role: userRes.data.role || userRes.data.user?.role
      };
      setUser(userData);
      localStorage.setItem('USER_NAME', userData.name);
      localStorage.setItem('USER_ROLE', userData.role);

    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('ACCESS_TOKEN'); localStorage.removeItem('USER_NAME'); localStorage.removeItem('USER_ROLE'); navigate('/login'); }
      showMsg(t('dashboard.failed_load', 'Failed to load data.'), 'error');
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Reset page when search changes
  useEffect(() => { setPartsPage(1); }, [search, activeTab]);
  useEffect(() => { setReqPage(1); }, [requestSearch, activeTab]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await axios.post(`${BASE}/parts-manager/requests/${id}/approve`, {}, { headers });
      showMsg(res.data.message || t('parts_manager.messages.approved', 'Approved!'), 'success');
      fetchData();
    } catch (err) {
      showMsg(err.response?.data?.message || t('parts_manager.messages.approve_failed', 'Failed to approve.'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    const { id, notes } = declineModal;
    setActionLoading(id);
    try {
      const res = await axios.post(`${BASE}/parts-manager/requests/${id}/decline`, { notes }, { headers });
      showMsg(res.data.message || t('parts_manager.messages.declined', 'Declined.'), 'success');
      setDeclineModal({ show: false, id: null, notes: '' });
      fetchData();
    } catch (err) {
      showMsg(err.response?.data?.message || t('parts_manager.messages.decline_failed', 'Failed to decline.'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try { await axios.post(`${BASE}/logout`, {}, { headers }); } catch { }
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('USER_NAME');
    localStorage.removeItem('USER_ROLE');
    navigate('/login');
  };

  // ─── ADD PART ────────────────────────────────────────────────────────
  const openAddPart = () => { setPartForm(EMPTY_PART); setPartFormErrors({}); setShowAddPartModal(true); };
  const closeAddPart = () => { setShowAddPartModal(false); };

  const handlePartChange = (e) => {
    const { name, value } = e.target;
    setPartForm(prev => ({ ...prev, [name]: value }));
    setPartFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePart = () => {
    const errs = {};
    if (!partForm.name.trim()) {
      errs.name = t('parts_manager.err_name_req');
    } else if (!patterns.name.test(partForm.name)) {
      errs.name = validationMessages.name;
    }
    if (!partForm.zone.trim()) errs.zone = t('parts_manager.err_zone_req');
    if (!partForm.category.trim()) errs.category = t('parts_manager.err_category_req');

    if (partForm.reference_number && !patterns.partReference.test(partForm.reference_number)) {
      errs.reference_number = validationMessages.partReference;
    }

    if (partForm.cost === '' || isNaN(Number(partForm.cost))) {
      errs.cost = t('parts_manager.err_cost_req');
    } else if (Number(partForm.cost) < 0) {
      errs.cost = t('parts_manager.err_cost_min');
    }

    if (partForm.price === '' || isNaN(Number(partForm.price))) {
      errs.price = t('parts_manager.err_price_req');
    } else {
      const costVal = Number(partForm.cost) || 0;
      const minPrice = costVal - (0.30 * costVal);
      if (Number(partForm.price) < minPrice) {
        errs.price = t('parts_manager.err_price_min', { min: minPrice.toFixed(2) });
      }
    }

    if (partForm.stock_quantity === '' || isNaN(Number(partForm.stock_quantity))) errs.stock_quantity = t('parts_manager.err_stock_req');
    return errs;
  };

  const handleSubmitPart = async (e) => {
    e.preventDefault();
    const errs = validatePart();
    if (Object.keys(errs).length > 0) { setPartFormErrors(errs); return; }
    setSubmittingPart(true);
    try {
      const res = await axios.post(`${BASE}/parts-manager/parts`, partForm, { headers });
      showMsg(res.data.message || t('parts_manager.messages.part_added', 'Part added!'), 'success');
      closeAddPart();
      fetchData();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) setPartFormErrors(serverErrors);
      else showMsg(err.response?.data?.message || t('parts_manager.messages.add_part_failed', 'Failed to add part.'), 'error');
    } finally {
      setSubmittingPart(false);
    }
  };

  // ─── ADD SERVICE ─────────────────────────────────────────────────────
  const openAddService = () => { setServiceForm(EMPTY_SERVICE); setServiceFormErrors({}); setShowAddServiceModal(true); };
  const closeAddService = () => { setShowAddServiceModal(false); };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({ ...prev, [name]: value }));
    setServiceFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateService = () => {
    const errs = {};
    if (!serviceForm.name.trim()) errs.name = t('parts_manager.err_name_req');
    if (!serviceForm.zone.trim()) errs.zone = t('parts_manager.err_zone_req');
    if (serviceForm.price === '' || isNaN(Number(serviceForm.price))) {
      errs.price = t('parts_manager.err_price_req');
    } else if (Number(serviceForm.price) < 0) {
      errs.price = t('parts_manager.err_price_min_0');
    }
    return errs;
  };

  const handleSubmitService = async (e) => {
    e.preventDefault();
    const errs = validateService();
    if (Object.keys(errs).length > 0) { setServiceFormErrors(errs); return; }
    setSubmittingService(true);
    try {
      const res = await axios.post(`${BASE}/parts-manager/services`, serviceForm, { headers });
      showMsg(res.data.message || t('parts_manager.messages.service_added', 'Service added!'), 'success');
      closeAddService();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) setServiceFormErrors(serverErrors);
      else showMsg(err.response?.data?.message || t('parts_manager.messages.add_service_failed', 'Failed to add service.'), 'error');
    } finally {
      setSubmittingService(false);
    }
  };

  // ─── Filters & Pagination ─────────────────────────────────────────────
  const filteredParts = parts.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.zone?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
    (search === 'LOW_STOCK' && p.stock_quantity <= 30)
  );

  const totalPartsPages = Math.max(1, Math.ceil(filteredParts.length / PAGE_SIZE));
  const pagedParts = filteredParts.slice((partsPage - 1) * PAGE_SIZE, partsPage * PAGE_SIZE);

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const pendingCount = pendingRequests.length;

  const filteredRequests = requests.filter(r =>
    !requestSearch || (requestSearch === 'PENDING' ? r.status === 'Pending' : true)
  );

  const totalReqPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const pagedRequests = filteredRequests.slice((reqPage - 1) * PAGE_SIZE, reqPage * PAGE_SIZE);

  // Status badge with translated labels
  const statusBadge = (status) => {
    const map = { Pending: 'badge-pending', Approved: 'badge-approved', Declined: 'badge-declined' };
    const labelMap = {
      Pending: t('parts_manager.status_pending'),
      Approved: t('parts_manager.status_approved'),
      Declined: t('parts_manager.status_declined'),
    };
    return <span className={`pm-badge ${map[status] || ''}`}>{labelMap[status] || status}</span>;
  };

  // ─── Pagination Controls ──────────────────────────────────────────────
  const Pagination = ({ page, totalPages, onPrev, onNext }) => (
    <div className="pm-pagination">
      <button
        className="pm-page-btn"
        onClick={onPrev}
        disabled={page <= 1}
      >
        <i className="fa-solid fa-chevron-left"></i> {t('pagination.prev')}
      </button>
      <span className="pm-page-info">
        {t('pagination.page_of', { current: page, total: totalPages })}
      </span>
      <button
        className="pm-page-btn"
        onClick={onNext}
        disabled={page >= totalPages}
      >
        {t('pagination.next')} <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );

  // ─── Reusable input field component ──────────────────────────────────
  const Field = ({ label, name, type = 'text', value, onChange, errors, placeholder = '', required = true, step }) => (
    <div className="pm-form-group">
      <label className="pm-form-label">{label}{required && <span className="pm-required">*</span>}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        className={`pm-form-input ${errors[name] ? 'pm-input-error' : ''}`}
      />
      {errors[name] && <span className="pm-field-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="pm-container">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="pm-main">
        {/* Header */}
        <div className="pm-header">
          <div>
            <h1>{t('parts_manager.title')}</h1>
            <p>{t('parts_manager.subtitle')}</p>
          </div>
          <div className="pm-header-actions">
            <button className="pm-btn-add-part" onClick={openAddPart}>
              <i className="fa-solid fa-plus"></i> {t('parts_manager.add_part')}
            </button>
            <button className="pm-btn-add-service" onClick={openAddService}>
              <i className="fa-solid fa-plus"></i> {t('parts_manager.add_service')}
            </button>
          </div>
        </div>

        {message && <div className={`pm-alert ${messageType}`}>{message}</div>}

        {/* KPI Cards */}
        <div className="pm-kpis">
          <div className="pm-kpi-card pm-kpi-blue" onClick={() => { setActiveTab('inventory'); setSearch(''); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-boxes-stacked"></i></div>
            <div className="pm-kpi-text"><p>{t('parts_manager.kpi_total_parts')}</p><h2>{kpis.total_parts}</h2></div>
          </div>
          <div className="pm-kpi-card pm-kpi-yellow" onClick={() => { setActiveTab('requests'); setRequestSearch('PENDING'); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-clock"></i></div>
            <div className="pm-kpi-text"><p>{t('parts_manager.kpi_pending')}</p><h2>{kpis.pending_count}</h2></div>
          </div>
          <div className="pm-kpi-card pm-kpi-red" onClick={() => { setActiveTab('inventory'); setSearch('LOW_STOCK'); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <div className="pm-kpi-text"><p>{t('parts_manager.kpi_low_stock')}</p><h2>{kpis.low_stock_count}</h2></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pm-tabs">
          <button className={`pm-tab ${activeTab === 'inventory' ? 'pm-tab-active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <i className="fa-solid fa-warehouse"></i> {t('parts_manager.tab_inventory')}
          </button>
          <button className={`pm-tab ${activeTab === 'requests' ? 'pm-tab-active' : ''}`} onClick={() => setActiveTab('requests')}>
            <i className="fa-solid fa-clipboard-list"></i> {t('parts_manager.tab_requests')}
            {pendingCount > 0 && <span className="pm-tab-badge">{pendingCount}</span>}
          </button>
        </div>

        {loading ? (
          <div className="pm-card" style={{ padding: '0 12px' }}>
            <SkeletonLoader type="table-rows" cols={6} count={6} />
          </div>
        ) : activeTab === 'inventory' ? (
          /* ===== INVENTORY TAB ===== */
          <div className="pm-card">
            <div className="pm-card-header">
              <h3>{t('parts_manager.tab_inventory')}</h3>
              <input
                type="text"
                className="pm-search"
                placeholder={t('parts_manager.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>{t('parts_manager.th_part_name')}</th>
                    <th>{t('parts_manager.th_reference')}</th>
                    <th>{t('parts_manager.th_zone')}</th>
                    <th>{t('parts_manager.th_category')}</th>
                    <th>{t('parts_manager.th_price')}</th>
                    <th>{t('parts_manager.th_stock')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedParts.length === 0 ? (
                    <tr><td colSpan="6" className="pm-empty-cell">{t('parts_manager.no_parts_found')}</td></tr>
                  ) : pagedParts.map(part => (
                    <tr key={part.id}>
                      <td><strong>{part.name}</strong></td>
                      <td><code>{part.reference_number || '—'}</code></td>
                      <td><span className="pm-zone-tag">{part.zone || '—'}</span></td>
                      <td>{part.category || '—'}</td>
                      <td>{Number(part.price).toFixed(2)} MAD</td>
                      <td>
                        <span className={`pm-stock ${part.stock_quantity <= 30 ? 'pm-stock-low' : 'pm-stock-ok'}`}>
                          {part.stock_quantity <= 30 && <i className="fa-solid fa-triangle-exclamation"></i>}
                          {part.stock_quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredParts.length > PAGE_SIZE && (
              <Pagination
                page={partsPage}
                totalPages={totalPartsPages}
                onPrev={() => setPartsPage(p => Math.max(1, p - 1))}
                onNext={() => setPartsPage(p => Math.min(totalPartsPages, p + 1))}
              />
            )}
          </div>
        ) : (
          /* ===== REQUESTS TAB ===== */
          <div className="pm-card">
            <div className="pm-card-header">
              <h3>{t('parts_manager.req_title')}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {requestSearch === 'PENDING' && (
                  <button onClick={() => setRequestSearch('')} style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-xmark"></i> {t('parts_manager.clear_filter')}
                  </button>
                )}
                <span className="pm-req-count">{requests.length} {t('parts_manager.total_requests')}</span>
              </div>
            </div>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>{t('parts_manager.th_mechanic')}</th>
                    <th>{t('parts_manager.th_part')}</th>
                    <th>{t('parts_manager.th_req_qty')}</th>
                    <th>{t('parts_manager.th_in_stock')}</th>
                    <th>{t('parts_manager.th_repair_vehicle')}</th>
                    <th>{t('parts_manager.th_status')}</th>
                    <th>{t('parts_manager.th_notes')}</th>
                    <th>{t('parts_manager.th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRequests.length === 0 ? (
                    <tr><td colSpan="8" className="pm-empty-cell">{t('parts_manager.no_requests')}</td></tr>
                  ) : pagedRequests.map(req => (
                    <tr key={req.id}>
                      <td><strong>{req.mechanic?.name || t('common.unknown', '—')}</strong></td>
                      <td>
                        <strong>{req.part?.name || t('common.unknown', '—')}</strong>
                        <div className="pm-sub">{req.part?.reference_number}</div>
                      </td>
                      <td><span className="pm-qty-badge">{req.quantity}</span></td>
                      <td>
                        <span className={`pm-stock ${req.part?.stock_quantity < req.quantity ? 'pm-stock-low' : 'pm-stock-ok'}`}>
                          {req.part?.stock_quantity < req.quantity && <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i>}
                          {req.part?.stock_quantity || 0}
                        </span>
                      </td>
                      <td>
                        <div>{t('parts_manager.repair')} #{req.repair?.id}</div>
                        <div className="pm-sub">{req.repair?.vehicle?.make} {req.repair?.vehicle?.model}</div>
                      </td>
                      <td>{statusBadge(req.status)}</td>
                      <td className="pm-sub">{req.notes || t('common.unknown', '—')}</td>
                      <td>
                        {req.status === 'Pending' && (
                          <div className="pm-action-btns">
                            <button className="pm-btn-approve" disabled={actionLoading === req.id} onClick={() => handleApprove(req.id)}>
                              {actionLoading === req.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> {t('parts_manager.approve')}</>}
                            </button>
                            <button className="pm-btn-decline" disabled={actionLoading === req.id} onClick={() => setDeclineModal({ show: true, id: req.id, notes: '' })}>
                              <i className="fa-solid fa-xmark"></i> {t('parts_manager.decline')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRequests.length > PAGE_SIZE && (
              <Pagination
                page={reqPage}
                totalPages={totalReqPages}
                onPrev={() => setReqPage(p => Math.max(1, p - 1))}
                onNext={() => setReqPage(p => Math.min(totalReqPages, p + 1))}
              />
            )}
          </div>
        )}
      </div>

      {/* ─── DECLINE MODAL ─────────────────────────────────────────────── */}
      {declineModal.show && (
        <div className="pm-modal-overlay" onClick={() => setDeclineModal({ show: false, id: null, notes: '' })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('parts_manager.modal_decline_title')}</h2>
            <p>{t('parts_manager.modal_decline_desc')}</p>
            <textarea
              className="pm-textarea"
              placeholder={t('parts_manager.modal_decline_placeholder')}
              value={declineModal.notes}
              onChange={(e) => setDeclineModal(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
            <div className="pm-modal-actions">
              <button className="pm-btn-cancel" onClick={() => setDeclineModal({ show: false, id: null, notes: '' })}>{t('parts_manager.modal_cancel')}</button>
              <button className="pm-btn-decline-confirm" onClick={handleDecline} disabled={actionLoading === declineModal.id}>
                {actionLoading === declineModal.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('parts_manager.modal_confirm_decline')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PART MODAL ────────────────────────────────────────────── */}
      {showAddPartModal && (
        <div className="pm-modal-overlay" onClick={closeAddPart}>
          <div className="pm-modal pm-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2><i className="fa-solid fa-boxes-stacked" style={{ marginRight: '8px', color: 'var(--red)' }}></i>{t('parts_manager.modal_add_part_title')}</h2>
            <p>{t('parts_manager.modal_add_part_desc')}</p>
            <form onSubmit={handleSubmitPart} noValidate>
              <div className="pm-form-grid">
                <Field label={t('parts_manager.label_part_name')} name="name" value={partForm.name} onChange={handlePartChange} errors={partFormErrors} placeholder="e.g. Brake Pad" />
                <div className="pm-form-group">
                  <label className="pm-form-label">{t('parts_manager.label_zone')}<span className="pm-required">*</span></label>
                  <select
                    name="zone"
                    value={partForm.zone}
                    onChange={handlePartChange}
                    className={`pm-form-input ${partFormErrors.zone ? 'pm-input-error' : ''}`}
                  >
                    <option value="">{t('parts_manager.select_zone')}</option>
                    <option value="engine">{t('parts_manager.zone_engine')}</option>
                    <option value="wheels">{t('parts_manager.zone_wheels')}</option>
                    <option value="exhaust">{t('parts_manager.zone_exhaust')}</option>
                    <option value="lights">{t('parts_manager.zone_lights')}</option>
                    <option value="body">{t('parts_manager.zone_body')}</option>
                    <option value="diagnostic">{t('parts_manager.zone_diagnostic')}</option>
                    <option value="general">{t('parts_manager.zone_general')}</option>
                  </select>
                  {partFormErrors.zone && <span className="pm-field-error">{partFormErrors.zone}</span>}
                </div>
                <Field label={t('parts_manager.label_category')} name="category" value={partForm.category} onChange={handlePartChange} errors={partFormErrors} placeholder="e.g. Pièces principales" />
                <Field label={t('parts_manager.label_reference')} name="reference_number" value={partForm.reference_number} onChange={handlePartChange} errors={partFormErrors} placeholder="e.g. REF-0042" required={false} />
                <Field label={t('parts_manager.label_cost')} name="cost" type="number" step="0.01" value={partForm.cost} onChange={handlePartChange} errors={partFormErrors} placeholder="0.00" />
                <Field label={t('parts_manager.label_price')} name="price" type="number" step="0.01" value={partForm.price} onChange={handlePartChange} errors={partFormErrors} placeholder="0.00" />
                <Field label={t('parts_manager.label_stock')} name="stock_quantity" type="number" step="1" value={partForm.stock_quantity} onChange={handlePartChange} errors={partFormErrors} placeholder="0" />
              </div>
              <div className="pm-modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="pm-btn-cancel" onClick={closeAddPart} disabled={submittingPart}>{t('parts_manager.modal_cancel')}</button>
                <button type="submit" className="pm-btn-submit" disabled={submittingPart}>
                  {submittingPart ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('parts_manager.saving')}</> : <><i className="fa-solid fa-floppy-disk"></i> {t('parts_manager.save_part')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SERVICE MODAL ─────────────────────────────────────────── */}
      {showAddServiceModal && (
        <div className="pm-modal-overlay" onClick={closeAddService}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h2><i className="fa-solid fa-screwdriver-wrench" style={{ marginRight: '8px', color: 'var(--red)' }}></i>{t('parts_manager.modal_add_service_title')}</h2>
            <p>{t('parts_manager.modal_add_service_desc')}</p>
            <form onSubmit={handleSubmitService} noValidate>
              <div className="pm-form-grid">
                <Field label={t('parts_manager.label_service_name')} name="name" value={serviceForm.name} onChange={handleServiceChange} errors={serviceFormErrors} placeholder="e.g. Oil Change" />
                <div className="pm-form-group">
                  <label className="pm-form-label">{t('parts_manager.label_zone')}<span className="pm-required">*</span></label>
                  <select
                    name="zone"
                    value={serviceForm.zone}
                    onChange={handleServiceChange}
                    className={`pm-form-input ${serviceFormErrors.zone ? 'pm-input-error' : ''}`}
                  >
                    <option value="">{t('parts_manager.select_zone')}</option>
                    <option value="engine">{t('parts_manager.zone_engine')}</option>
                    <option value="wheels">{t('parts_manager.zone_wheels')}</option>
                    <option value="exhaust">{t('parts_manager.zone_exhaust')}</option>
                    <option value="lights">{t('parts_manager.zone_lights')}</option>
                    <option value="body">{t('parts_manager.zone_body')}</option>
                    <option value="diagnostic">{t('parts_manager.zone_diagnostic')}</option>
                    <option value="general">{t('parts_manager.zone_general')}</option>
                  </select>
                  {serviceFormErrors.zone && <span className="pm-field-error">{serviceFormErrors.zone}</span>}
                </div>
                <Field label={t('parts_manager.label_price')} name="price" type="number" step="1" min="0" value={serviceForm.price} onChange={handleServiceChange} errors={serviceFormErrors} placeholder="0.00" />
              </div>
              <div className="pm-modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="pm-btn-cancel" onClick={closeAddService} disabled={submittingService}>{t('parts_manager.modal_cancel')}</button>
                <button type="submit" className="pm-btn-submit" disabled={submittingService}>
                  {submittingService ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('parts_manager.saving')}</> : <><i className="fa-solid fa-floppy-disk"></i> {t('parts_manager.save_service')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsManagerDashboard;
