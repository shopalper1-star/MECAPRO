import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import { patterns, validationMessages, sanitizeInput } from '../utils/validation';
import './MechanicDashboard.css';

const BASE = 'http://127.0.0.1:8000/api';
const PAGE_SIZE = 15;

const MechanicDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [user, setUser] = useState({
        name: localStorage.getItem('USER_NAME') || 'Mechanic',
        role: localStorage.getItem('USER_ROLE') || 'Mechanic'
    });

    const [repairs, setRepairs] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // --- Estimate Modal State ---
    const [showEstimateModal, setShowEstimateModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [mechanicNotes, setMechanicNotes] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [submittingEstimate, setSubmittingEstimate] = useState(false);

    // --- Part Request State ---
    const [myPartRequests, setMyPartRequests] = useState([]);
    const [showPartRequests, setShowPartRequests] = useState(false);

    // --- KPI filter & Pagination ---
    const [kpiFilter, setKpiFilter] = useState(''); // '' | 'active' | 'completed' | 'pending'
    const [jobsPage, setJobsPage] = useState(1);

    const token = localStorage.getItem('ACCESS_TOKEN');
    const headers = { Authorization: `Bearer ${token}` };

    // --- Helpers ---
    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'ASAP';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // --- Data Fetching ---
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const loadingTimeout = setTimeout(() => setLoading(false), 3000);
        try {
            const [userRes, jobsRes, servicesRes, partReqRes] = await Promise.all([
                axios.get(`${BASE}/user`, { headers }),
                axios.get(`${BASE}/mechanic/jobs`, { headers }),
                axios.get(`${BASE}/services`, { headers }),
                axios.get(`${BASE}/mechanic/part-requests`, { headers }),
            ]);

            const userData = {
                name: userRes.data.name || userRes.data.user?.name,
                role: userRes.data.role || userRes.data.user?.role
            };
            setUser(userData);
            localStorage.setItem('USER_NAME', userData.name);
            localStorage.setItem('USER_ROLE', userData.role);

            setRepairs(jobsRes.data.data || []);
            setServices(servicesRes.data || []);
            setMyPartRequests(partReqRes.data || []);

        } catch (err) {
            console.error("Dashboard Error:", err);
            if (err.response && err.response.status === 401) {
                showMessage(t('common.messages.session_expired', 'Session expired. Please log in again.'), 'error');
                localStorage.removeItem('ACCESS_TOKEN');
                localStorage.removeItem('USER_NAME');
                localStorage.removeItem('USER_ROLE');
                navigate('/login');
            } else {
                showMessage(t('dashboard.failed_load', 'Failed to load dashboard data.'), 'error');
            }
        } finally {
            clearTimeout(loadingTimeout);
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
    useEffect(() => { setJobsPage(1); }, [kpiFilter]);

    // --- Check if job is diagnostic ---
    const isDiagnosticJob = (job) => {
        if (job.is_diagnostic) return true;
        if (job.services && job.services.length > 0) {
            return job.services.some(service =>
                service.name.toLowerCase().includes('diagnostic')
            );
        }
        return false;
    };

    // --- Actions ---
    const handleStatusUpdate = async (repairId, newStatus) => {
        const previousRepairs = [...repairs];
        setRepairs(prevRepairs =>
            prevRepairs.map(r => r.id === repairId ? { ...r, status: newStatus } : r)
        );
        try {
            await axios.patch(`${BASE}/mechanic/jobs/${repairId}`, { status: newStatus }, { headers });
            showMessage(t('mechanic.messages.status_updated', 'Repair status updated successfully'), 'success');
        } catch (err) {
            console.error(err);
            setRepairs(previousRepairs);
            showMessage(t('mechanic.messages.status_update_failed', 'Failed to update status.'), 'error');
        }
    };

    const handleOpenEstimateModal = (job) => {
        setSelectedJob(job);
        setShowEstimateModal(true);
        setSelectedServices([]);
        setMechanicNotes('');
        setServiceSearch('');
    };

    const handleCloseEstimateModal = () => {
        setShowEstimateModal(false);
        setSelectedJob(null);
        setSelectedServices([]);
        setMechanicNotes('');
        setServiceSearch('');
    };

    const handleServiceSelect = (service) => {
        if (selectedServices.some(s => s.id === service.id)) {
            showMessage(t('mechanic.messages.service_already_added', 'Service already added'), 'error');
            return;
        }
        setSelectedServices(prev => [...prev, service]);
        setServiceSearch('');
    };

    const handleServiceRemove = (serviceId) => {
        setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
    };

    const handleSubmitEstimate = async () => {
        if (selectedServices.length === 0) { showMessage(t('mechanic.messages.select_one_service', 'Please select at least one service'), 'error'); return; }
        if (!mechanicNotes.trim()) { showMessage(t('mechanic.messages.add_mechanic_notes', 'Please add mechanic notes'), 'error'); return; }
        if (!patterns.description.test(mechanicNotes)) { showMessage(validationMessages.description, 'error'); return; }
        setSubmittingEstimate(true);
        try {
            const response = await axios.post(
                `${BASE}/mechanic/jobs/${selectedJob.id}/estimate`,
                { service_ids: selectedServices.map(s => s.id), mechanic_notes: mechanicNotes },
                { headers }
            );
            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === selectedJob.id ? { ...r, status: 'Estimate Sent', services: selectedServices } : r
                )
            );
            showMessage(response.data.message || t('mechanic.messages.estimate_sent_success', 'Estimate sent successfully!'), 'success');
            handleCloseEstimateModal();
        } catch (err) {
            showMessage(err.response?.data?.message || t('mechanic.messages.estimate_submit_failed', 'Failed to submit estimate'), 'error');
        } finally { setSubmittingEstimate(false); }
    };

    const handleLogout = async () => {
        try { await axios.post(`${BASE}/logout`, {}, { headers }); } catch { }
        localStorage.removeItem('ACCESS_TOKEN');
        localStorage.removeItem('USER_NAME');
        localStorage.removeItem('USER_ROLE');
        navigate('/login');
    };

    // --- KPI Calculation ---
    const kpiData = useMemo(() => {
        if (!Array.isArray(repairs)) return { ActiveJobs: 0, completed: 0, pending: 0 };
        const normalize = (s) => s?.toLowerCase() || '';
        return {
            ActiveJobs: repairs.filter(r => !normalize(r.status).includes('completed')).length,
            completed: repairs.filter(r => normalize(r.status).includes('completed')).length,
            pending: repairs.filter(r => normalize(r.status).includes('pending')).length
        };
    }, [repairs]);

    const getJobServices = (job) => {
        if (job.services && Array.isArray(job.services) && job.services.length > 0) return job.services;
        if (job.service) return [job.service];
        return [];
    };

    const filteredServices = useMemo(() => {
        if (!serviceSearch) return services;
        const searchLower = serviceSearch.toLowerCase();
        return services.filter(s =>
            s.name.toLowerCase().includes(searchLower) ||
            (s.zone && s.zone.toLowerCase().includes(searchLower))
        );
    }, [services, serviceSearch]);

    const totalEstimate = useMemo(() => {
        return selectedServices.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    }, [selectedServices]);

    const pendingPartReqs = myPartRequests.filter(r => r.status === 'Pending').length;

    // --- KPI Filtered repairs ---
    const normalize = (s) => s?.toLowerCase() || '';
    const kpiFilteredRepairs = useMemo(() => {
        if (kpiFilter === 'active') return repairs.filter(r => !normalize(r.status).includes('completed'));
        if (kpiFilter === 'completed') return repairs.filter(r => normalize(r.status).includes('completed'));
        if (kpiFilter === 'pending') return repairs.filter(r => normalize(r.status).includes('pending'));
        return repairs;
    }, [repairs, kpiFilter]);

    const totalJobPages = Math.max(1, Math.ceil(kpiFilteredRepairs.length / PAGE_SIZE));
    const pagedJobs = kpiFilteredRepairs.slice((jobsPage - 1) * PAGE_SIZE, jobsPage * PAGE_SIZE);

    // --- Custom Dropdown Component ---
    const StatusDropdown = ({ currentStatus, onStatusChange }) => {
        const [isOpen, setIsOpen] = useState(false);
        const statusConfig = {
            pending: { label: t('mechanic.status.pending', 'Pending'), colorClass: 'pending', apiValue: 'pending' },
            progress: { label: t('mechanic.status.in_progress', 'In Progress'), colorClass: 'progress', apiValue: 'in_progress' },
            completed: { label: t('mechanic.status.completed', 'Completed'), colorClass: 'completed', apiValue: 'completed' }
        };
        const getStatusKey = (status) => {
            if (!status) return 'pending';
            const s = status.toLowerCase();
            if (s.includes('progress')) return 'progress';
            if (s.includes('completed')) return 'completed';
            return 'pending';
        };
        const activeKey = getStatusKey(currentStatus);
        const currentConfig = statusConfig[activeKey];
        const handleSelect = (e, key) => {
            e.stopPropagation();
            onStatusChange(statusConfig[key].apiValue);
            setIsOpen(false);
        };
        return (
            <div className="custom-dropdown-wrapper" onMouseLeave={() => setIsOpen(false)} onClick={(e) => e.stopPropagation()}>
                <button className={`dropdown-trigger ${currentConfig.colorClass}`} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                    <span>{currentConfig.label}</span>
                </button>
                {isOpen && (
                    <div className="dropdown-menu">
                        {Object.keys(statusConfig).map((key) => (
                            <div key={key} className={`dropdown-item ${key === activeKey ? 'active' : ''}`} onClick={(e) => handleSelect(e, key)}>
                                <span>{statusConfig[key].label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // --- Part request status badge ---
    const partReqBadge = (status) => {
        const cls = { Pending: 'mpr-badge-pending', Approved: 'mpr-badge-approved', Declined: 'mpr-badge-declined' };
        const translatedStatus = t(`common.status.${status?.toLowerCase()}`, status);
        return <span className={`mpr-badge ${cls[status] || ''}`}>{translatedStatus}</span>;
    };

    // KPI filter label
    const kpiFilterLabel = kpiFilter === 'active'
        ? t('mechanic.active_repairs')
        : kpiFilter === 'completed'
            ? t('mechanic.completed_repairs')
            : kpiFilter === 'pending'
                ? t('mechanic.awaiting_tasks')
                : null;

    return (
        <div className="dashboard-container">
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

            <div className='main' style={{ padding: '20px' }}>
                <section className="dashboard-stats">
                    <div className="section-header"><h2>{t('mechanic.title', 'Mechanic Dashboard')}</h2></div>
                    <div className="stats-container">
                        <div
                            className={`stat-card ${kpiFilter === 'active' ? 'stat-card-active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setKpiFilter(kpiFilter === 'active' ? '' : 'active'); setJobsPage(1); }}
                        >
                            <div className="stat-info"><span>{t('mechanic.active_repairs', 'Active Repairs')}</span><h2>{kpiData.ActiveJobs}</h2></div>
                            <div className="stat-icon blue"><i className="fa-solid fa-wrench"></i></div>
                        </div>
                        <div
                            className={`stat-card ${kpiFilter === 'completed' ? 'stat-card-active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setKpiFilter(kpiFilter === 'completed' ? '' : 'completed'); setJobsPage(1); }}
                        >
                            <div className="stat-info"><span>{t('mechanic.completed_repairs', 'Completed')}</span><h2>{kpiData.completed}</h2></div>
                            <div className="stat-icon green"><i className="fa-solid fa-check"></i></div>
                        </div>
                        <div
                            className={`stat-card ${kpiFilter === 'pending' ? 'stat-card-active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setKpiFilter(kpiFilter === 'pending' ? '' : 'pending'); setJobsPage(1); }}
                        >
                            <div className="stat-info"><span>{t('mechanic.awaiting_tasks', 'Awaiting Tasks')}</span><h2>{kpiData.pending}</h2></div>
                            <div className="stat-icon orange"><i className="fa-solid fa-clock-rotate-left"></i></div>
                        </div>
                    </div>
                </section>

                <section className="tasks-section">
                    <div className="section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h2>{t('mechanic.job_list', 'My Job List')}</h2>
                            {kpiFilter && (
                                <span className="mech-filter-badge">
                                    <i className="fa-solid fa-filter"></i> {kpiFilterLabel}
                                    <button
                                        className="mech-filter-clear"
                                        onClick={() => { setKpiFilter(''); setJobsPage(1); }}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </span>
                            )}
                        </div>
                        <button className="mech-part-req-toggle" onClick={() => setShowPartRequests(!showPartRequests)}>
                            <i className="fa-solid fa-boxes-stacked"></i> {t('mechanic.my_part_requests', 'My Part Requests')}
                            {pendingPartReqs > 0 && <span className="mpr-count">{pendingPartReqs}</span>}
                        </button>
                    </div>

                    {/* Part Requests Panel (toggle) */}
                    {showPartRequests && (
                        <div className="mpr-panel">
                            <h3><i className="fa-solid fa-clipboard-list"></i> {t('mechanic.my_part_requests', 'My Part Requests')}</h3>
                            {myPartRequests.length === 0 ? (
                                <p className="mpr-empty">{t('mechanic.no_part_requests', 'You haven\'t requested any parts yet.')}</p>
                            ) : (
                                <div className="mpr-list">
                                    {myPartRequests.map(req => (
                                        <div key={req.id} className="mpr-card">
                                            <div className="mpr-card-left">
                                                <strong>{req.part?.name || t('mechanic.unknown_part', 'Unknown Part')}</strong>
                                                <span className="mpr-ref">{req.part?.reference_number || ''}</span>
                                                <span className="mpr-vehicle">
                                                    <i className="fa-solid fa-car"></i>
                                                    {req.repair?.vehicle?.make} {req.repair?.vehicle?.model} — {t('mechanic.repair_id', 'Repair')} #{req.repair?.id}
                                                </span>
                                            </div>
                                            <div className="mpr-card-right">
                                                <span className="mpr-qty">×{req.quantity}</span>
                                                {partReqBadge(req.status)}
                                                {req.notes && <span className="mpr-notes" title={req.notes}><i className="fa-solid fa-comment"></i> {req.notes}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="task-list">
                        {loading ? (
                            <SkeletonLoader type="cards" count={4} />
                        ) : kpiFilteredRepairs.length === 0 ? (
                            <div className="no-tasks"><p>{t('mechanic.no_jobs_assigned', '🎉 You have no assigned jobs at the moment.')}</p></div>
                        ) : (
                            pagedJobs.map(job => (
                                <div
                                    key={job.id}
                                    className={`task-card ${job.status?.toLowerCase().includes('completed') ? 'card-completed' : ''}`}
                                    onClick={() => { if (!job.status?.toLowerCase().includes('completed')) navigate(`/mechanic/repair/${job.id}`); }}
                                    style={{
                                        cursor: !job.status?.toLowerCase().includes('completed') ? 'pointer' : 'default',
                                        opacity: job.status?.toLowerCase().includes('completed') ? 0.7 : 1
                                    }}
                                >
                                    <div className="task-details">
                                        <div className="services-badges">
                                            {getJobServices(job).map((service, idx) => (
                                                <span key={idx} className="service-badge">{service.name}</span>
                                            ))}
                                            {isDiagnosticJob(job) && (
                                                <span className="diagnostic-badge">
                                                    <i className="fa-brands fa-sistrix"></i> {t('mechanic.diagnostic', 'DIAGNOSTIC')}
                                                </span>
                                            )}
                                        </div>
                                        <span className="client-name"><i className="fa-solid fa-user"></i>{job.vehicle?.owner_name || t('mechanic.unknown_client', 'Unknown Client')}</span>
                                        <span className="car-model"><i className="fa-solid fa-car"></i>{job.vehicle?.make} {job.vehicle?.model} ( {job.vehicle?.plate_number || 'N/A'} )</span>
                                        <span className="due-date"><i className="fa-solid fa-calendar"></i>{t('mechanic.due', 'Due')}: {formatDate(job.date_end)}</span>
                                        <span className='DESC' title={job.description}>
                                            <i className="fa-solid fa-circle-info"></i>
                                            {job.description ? (job.description.length > 50 ? job.description.substring(0, 50) + '...' : job.description) : t('mechanic.no_description', 'No description')}
                                        </span>
                                    </div>

                                    <div className="task-action" onClick={(e) => e.stopPropagation()}>
                                        {job.status === 'Pending' && (
                                            <button className="btn-estimate" onClick={(e) => { e.stopPropagation(); handleOpenEstimateModal(job); }}>
                                                <i className="fa-solid fa-file-invoice"></i> {t('mechanic.submit_estimate', 'Submit Estimate')}
                                            </button>
                                        )}

                                        <StatusDropdown
                                            currentStatus={job.status}
                                            onStatusChange={(newStatus) => handleStatusUpdate(job.id, newStatus)}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination for jobs */}
                    {kpiFilteredRepairs.length > PAGE_SIZE && (
                        <div className="mech-pagination">
                            <button
                                className="mech-page-btn"
                                onClick={() => setJobsPage(p => Math.max(1, p - 1))}
                                disabled={jobsPage <= 1}
                            >
                                <i className="fa-solid fa-chevron-left"></i> {t('pagination.prev')}
                            </button>
                            <span className="mech-page-info">
                                {t('pagination.page_of', { current: jobsPage, total: totalJobPages })}
                            </span>
                            <button
                                className="mech-page-btn"
                                onClick={() => setJobsPage(p => Math.min(totalJobPages, p + 1))}
                                disabled={jobsPage >= totalJobPages}
                            >
                                {t('pagination.next')} <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* Estimate Modal */}
            {showEstimateModal && selectedJob && (
                <div className="modal-overlay" onClick={handleCloseEstimateModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h2>{t('mechanic.estimate_modal.title', 'Submit Estimate')} - {selectedJob.vehicle?.make} {selectedJob.vehicle?.model}</h2>
                        {selectedServices.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>{t('mechanic.estimate_modal.selected_services', 'Selected Services:')}</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {selectedServices.map(service => (
                                        <span key={service.id} style={{ background: '#e3f2fd', color: '#005DFFFF', padding: '6px 10px', borderRadius: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #b3d7ff' }}>
                                            {service.name} - {service.zone} ({service.price} MAD)
                                            <i className="fa-solid fa-xmark" style={{ cursor: 'pointer', color: '#ff4d4d' }} onClick={() => handleServiceRemove(service.id)}></i>
                                        </span>
                                    ))}
                                </div>
                                <p style={{ marginTop: '8px', fontWeight: '700', color: '#005DFFFF' }}>{t('mechanic.estimate_modal.total_estimate', 'Total Estimate:')} {totalEstimate.toFixed(2)} MAD</p>
                            </div>
                        )}
                        <div className="form-group" style={{ position: 'relative', marginBottom: '15px' }}>
                            <label>{t('mechanic.estimate_modal.add_services', 'Add Services:')}</label>
                            <input type="text" className="form-control" placeholder={t('mechanic.estimate_modal.search_placeholder', 'Search services...')} value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} />
                            {serviceSearch && (
                                <div className="service-dropdown">
                                    {filteredServices.length > 0 ? filteredServices.map(service => (
                                        <div key={service.id} onClick={() => handleServiceSelect(service)} className="service-dropdown-item">
                                            <span>{service.name} - {service.zone}</span>
                                            <span style={{ fontWeight: '600', color: '#005DFFFF' }}>{service.price} MAD</span>
                                        </div>
                                    )) : <div className="service-dropdown-empty">{t('mechanic.estimate_modal.no_services_found', 'No services found')}</div>}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>{t('mechanic.estimate_modal.notes_label', 'Mechanic Notes:')}</label>
                            <textarea className="form-control" placeholder={t('mechanic.estimate_modal.notes_placeholder', 'Describe the issues found...')} value={mechanicNotes} onChange={(e) => setMechanicNotes(e.target.value)} rows="4" style={{ resize: 'vertical' }} />
                        </div>
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button type="button" className="save-btn" onClick={handleSubmitEstimate} disabled={submittingEstimate}>
                                {submittingEstimate ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('mechanic.estimate_modal.submitting', 'Submitting...')}</> : t('mechanic.submit_estimate', 'Submit Estimate')}
                            </button>
                            <button type="button" className="cancel-btn" onClick={handleCloseEstimateModal} disabled={submittingEstimate}>{t('mechanic.estimate_modal.cancel', 'Cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MechanicDashboard;
