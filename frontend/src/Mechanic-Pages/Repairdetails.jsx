import API_BASE_URL from '../api.js';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Repairdetails.css';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';

const BASE = API_BASE_URL;

const MAX_PARTS = 20;

const RepairDetails = () => {
    const { t } = useTranslation();
    const { jobId } = useParams();
    const navigate = useNavigate();

    // State
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // --- Multi-Part Request State ---
    const [availableParts, setAvailableParts] = useState([]);
    const [submittingPart, setSubmittingPart] = useState(false);

    // Each row: { id (unique key), selectedPart, qty, search, showDropdown }
    const emptyRow = () => ({ _key: Date.now() + Math.random(), selectedPart: null, qty: 1, search: '', showDropdown: false });
    const [partRows, setPartRows] = useState([emptyRow()]);

    // Toast
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
    };

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('ACCESS_TOKEN');
                if (!token) { navigate('/login'); return; }
                const headers = { Authorization: `Bearer ${token}` };
                const [jobResponse, userResponse, partsResponse] = await Promise.all([
                    axios.get(`${BASE}/mechanic/jobs/${jobId}`, { headers }),
                    axios.get(`${BASE}/user`, { headers }),
                    axios.get(`${BASE}/mechanic/parts`, { headers })
                ]);
                setJob(jobResponse.data.data || jobResponse.data);
                setUser(userResponse.data);
                setAvailableParts(partsResponse.data || []);
            } catch (error) {
                console.error('Failed to fetch details:', error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    navigate('/login');
                } else {
                    showMessage(t('mechanic.messages.load_job_failed', 'Failed to load job details'), 'error');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [jobId, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('ACCESS_TOKEN');
        localStorage.removeItem('USER_ROLE');
        navigate('/login');
    };

    const getClientName = () => {
        if (!job) return '';
        if (job.vehicle?.owner_name) return job.vehicle.owner_name;
        if (job.vehicle?.client?.name) return job.vehicle.client.name;
        if (job.vehicle?.user?.name) return job.vehicle.user.name;
        if (job.client?.name) return job.client.name;
        return t('mechanic.unknown_client', 'Unknown Client');
    };

    // ─────────────────────────────────────────
    // PART ROW HELPERS
    // ─────────────────────────────────────────
    const updateRow = (index, patch) => {
        setPartRows(prev => prev.map((row, i) => i === index ? { ...row, ...patch } : row));
    };

    const addRow = () => {
        if (partRows.length >= MAX_PARTS) return;
        setPartRows(prev => [...prev, emptyRow()]);
    };

    const removeRow = (index) => {
        setPartRows(prev => prev.filter((_, i) => i !== index));
    };

    const getFilteredParts = (search, currentRowIndex) => {
        const selectedPartIds = partRows
            .filter((r, idx) => idx !== currentRowIndex && r.selectedPart)
            .map(r => r.selectedPart.id);

        let filtered = availableParts.filter(p => !selectedPartIds.includes(p.id));

        if (!search) return filtered;
        const s = search.toLowerCase();
        return filtered.filter(p =>
            p.name.toLowerCase().includes(s) ||
            p.reference_number?.toLowerCase().includes(s) ||
            p.category?.toLowerCase().includes(s)
        );
    };

    // ─────────────────────────────────────────
    // SUBMIT — send all rows in sequence
    // ─────────────────────────────────────────
    const handleSubmitPartRequests = async () => {
        const validRows = partRows.filter(r => r.selectedPart);
        if (validRows.length === 0) { showMessage(t('mechanic.messages.select_one_part', 'Please select at least one part.'), 'error'); return; }

        setSubmittingPart(true);
        const token = localStorage.getItem('ACCESS_TOKEN');
        const headers = { Authorization: `Bearer ${token}` };

        let successCount = 0;
        let errorMessages = [];

        for (const row of validRows) {
            try {
                const res = await axios.post(
                    `${BASE}/mechanic/jobs/${jobId}/parts`,
                    { part_id: row.selectedPart.id, quantity: row.qty },
                    { headers }
                );
                successCount++;
            } catch (err) {
                const errMsg = err.response?.data?.message || t('mechanic.messages.part_request_failed_single', 'Failed for {{name}}', { name: row.selectedPart.name });
                errorMessages.push(errMsg);
            }
        }

        setSubmittingPart(false);

        if (successCount > 0) {
            showMessage(t('mechanic.messages.parts_requested_success', '{{count}} part request(s) sent successfully!', { count: successCount }), 'success');
            setPartRows([emptyRow()]);
        }
        if (errorMessages.length > 0) {
            showMessage(errorMessages[0], 'error');
        }
    };

    if (loading) return (
        <div className="dashboard-container">
            <DashboardNavbar user={user || { name: 'Mechanic', role: 'Mechanic' }} />
            <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 20px' }}>
                <SkeletonLoader type="cards" count={3} />
            </div>
        </div>
    );

    if (!job) return (
        <div className="repair-details-container">
            <DashboardNavbar user={user} onLogout={handleLogout} />
            <div className="error-state" style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>{t('mechanic.details.job_not_found', 'Job not found')}</h2>
                <button className="btn-error-action" onClick={() => navigate('/mechanic/dashboard')}>
                    {t('mechanic.details.return_dashboard', 'Return to Dashboard')}
                </button>
            </div>
        </div>
    );

    const isJobCompleted = job.status?.toLowerCase().includes('completed');
    const filledRows = partRows.filter(r => r.selectedPart).length;

    return (
        <div className="repair-details-container">
            <header className="dashboard-header">
                <DashboardNavbar user={user} onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} />
            </header>

            {/* Toast Message */}
            {message && (
                <div className={`mech-toast ${messageType}`}>
                    <i className={`fa-solid ${messageType === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <span>{message}</span>
                </div>
            )}

            <div className="repair-content-wrapper">
                <div className="back-link-container">
                    <Link to="/mechanic/dashboard" className="back-link">
                        <i className="fa-solid fa-arrow-left"></i> {t('mechanic.details.back_to_dashboard', 'Back to Dashboard')}
                    </Link>
                </div>

                <div className="repair-content">
                    {/* --- VEHICLE INFORMATION SECTION --- */}
                    <section className="vehicle-info-section">
                        <h2><i className="fa-solid fa-car"></i> {t('mechanic.details.repair_information', 'Repair Information')}</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>{t('mechanic.details.client_name', 'Client Name')}</label>
                                <input type="text" value={getClientName()} readOnly />
                            </div>
                            <div className="info-item">
                                <label>{t('dashboard.make', 'Make')}</label>
                                <input type="text" value={job.vehicle?.make || 'N/A'} readOnly />
                            </div>
                            <div className="info-item">
                                <label>{t('dashboard.model', 'Model')}</label>
                                <input type="text" value={job.vehicle?.model || 'N/A'} readOnly />
                            </div>
                            <div className="info-item">
                                <label>{t('dashboard.plate_number', 'License Plate')}</label>
                                <input type="text" value={job.vehicle?.plate_number || job.vehicle?.license_plate || 'N/A'} readOnly />
                            </div>
                            <div className="info-item full-width">
                                <label>{t('mechanic.details.service_requested', 'Service Requested')}</label>
                                <div className="service-badges-container">
                                    {job.services && job.services.length > 0 ? (
                                        job.services.map((s, i) => <span key={i} className="service-badge">{s.name}</span>)
                                    ) : job.service ? (
                                        <span className="service-badge">{job.service.name}</span>
                                    ) : (
                                        <span className="service-badge">{t('dashboard.general_service', 'General Repair')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="info-item full-width">
                                <label>{t('dashboard.description', 'Description')}</label>
                                <textarea value={job.description || t('mechanic.no_description', 'No description provided')} readOnly></textarea>
                            </div>
                        </div>
                    </section>

                    {/* --- REQUEST PARTS SECTION --- */}
                    {!isJobCompleted && (
                        <section className="services-section">
                            <div className="services-header">
                                <h2><i className="fa-solid fa-screwdriver-wrench"></i> {t('mechanic.details.request_parts', 'Request Parts from Inventory')}</h2>
                                <p className="parts-section-subtitle">
                                    {t('mechanic.details.add_up_to', 'Add up to {{max}} parts per request — all will be sent to the Parts Manager at once.', { max: MAX_PARTS })}
                                </p>
                            </div>

                            {/* Part Rows */}
                            <div className="multi-part-list">
                                {partRows.map((row, index) => (
                                    <div key={row._key} className="part-row">
                                        {/* Row number */}
                                        <div className="part-row-num">{index + 1}</div>

                                        {/* Search / Selected */}
                                        <div className="part-row-search">
                                            {row.selectedPart ? (
                                                <div className="part-row-selected">
                                                    <div className="part-row-selected-info">
                                                        <strong>{row.selectedPart.name}</strong>
                                                        <span className="part-row-ref">{t('mechanic.details.ref', 'Ref')}: {row.selectedPart.reference_number || 'N/A'}</span>
                                                    </div>
                                                    <div className="part-row-selected-meta">
                                                        <span className="part-row-price">{Number(row.selectedPart.price).toFixed(2)} MAD</span>
                                                        <span className={`part-row-stock ${row.selectedPart.stock_quantity <= 30 ? 'low' : 'ok'}`}>
                                                            {t('mechanic.details.stock', 'Stock')}: {row.selectedPart.stock_quantity}
                                                        </span>
                                                    </div>
                                                    <button className="part-row-clear" title={t('common.clear', 'Clear')} onClick={() => updateRow(index, { selectedPart: null, search: '' })}>
                                                        <i className="fa-solid fa-xmark"></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="part-row-input-wrap">
                                                    <i className="fa-solid fa-search part-row-search-icon"></i>
                                                    <input
                                                        type="text"
                                                        className="part-row-input"
                                                        placeholder={t('mechanic.details.search_part_placeholder', 'Search part by name, ref, category...')}
                                                        value={row.search}
                                                        onChange={e => updateRow(index, { search: e.target.value, showDropdown: true })}
                                                        onFocus={() => updateRow(index, { showDropdown: true })}
                                                        onBlur={() => setTimeout(() => updateRow(index, { showDropdown: false }), 200)}
                                                    />
                                                    {row.showDropdown && row.search && (
                                                        <div className="part-row-dropdown">
                                                            {getFilteredParts(row.search, index).slice(0, 12).map(part => (
                                                                <div
                                                                    key={part.id}
                                                                    className="part-row-dropdown-item"
                                                                    onMouseDown={() => updateRow(index, { selectedPart: part, search: '', showDropdown: false })}
                                                                >
                                                                    <div className="pdd-left">
                                                                        <strong>{part.name}</strong>
                                                                        <span>{part.reference_number} — {part.category || t('dashboard.general_service', 'General')}</span>
                                                                    </div>
                                                                    <div className="pdd-right">
                                                                        <span className="pdd-price">{Number(part.price).toFixed(2)} MAD</span>
                                                                        <span className={`pdd-stock ${part.stock_quantity <= 30 ? 'low' : ''}`}>
                                                                            {t('mechanic.details.stock', 'Stock')}: {part.stock_quantity}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {getFilteredParts(row.search, index).length === 0 && (
                                                                <div className="pdd-empty">{t('mechanic.details.no_parts_found', 'No parts found.')}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Quantity */}
                                        <div className="part-row-qty">
                                            <label>{t('mechanic.details.qty', 'Qty')}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={row.qty}
                                                onChange={e => updateRow(index, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                                                className="part-qty-input"
                                            />
                                        </div>

                                        {/* Remove row */}
                                        {partRows.length > 1 && (
                                            <button className="part-row-remove" title={t('mechanic.details.remove_row', 'Remove row')} onClick={() => removeRow(index)}>
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add row + Submit */}
                            <div className="multi-part-actions">
                                {partRows.length < MAX_PARTS && (
                                    <button className="btn-add-part-row" onClick={addRow}>
                                        <i className="fa-solid fa-plus"></i> {t('mechanic.details.add_another_part', 'Add Another Part')}
                                        <span className="row-counter">{partRows.length}/{MAX_PARTS}</span>
                                    </button>
                                )}
                                <button
                                    className="btn-submit"
                                    onClick={handleSubmitPartRequests}
                                    disabled={submittingPart || filledRows === 0}
                                >
                                    {submittingPart
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('mechanic.details.sending_requests', 'Sending {{count}} request(s)...', { count: filledRows })}</>
                                        : <><i className="fa-solid fa-paper-plane"></i> {t('mechanic.details.send_part_request', 'Send {{count}} Part Request(s)', { count: filledRows })}</>
                                    }
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepairDetails;