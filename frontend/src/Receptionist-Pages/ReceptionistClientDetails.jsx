import API_BASE_URL from '../api.js';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { useTranslation } from 'react-i18next';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import "./ReceptionistClientDetails.css";

const ReceptionistClientDetails = () => {
    const { id, name } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // --- 1. STATE MANAGEMENT ---
    const clientNameDisplay = name ? decodeURIComponent(name).replace(/-/g, ' ') : t('common.client', 'Client');

    const [user, setUser] = useState({
        name: localStorage.getItem('USER_NAME') || t('common.receptionist', 'Receptionist'),
        role: localStorage.getItem('USER_ROLE') || t('common.receptionist', 'Receptionist')
    });

    const [client, setClient] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Loading states
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [negotiatingId, setNegotiatingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');

    // --- Confirmation Modal ---
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', body: '', job: null, isNegotiation: false, onConfirm: null });
    const [customPrices, setCustomPrices] = useState({ services: {}, parts: {} });

    // --- 2. EFFECT: FETCH DATA ---
    useEffect(() => {
        if (id) fetchClientDetails();
    }, [id]);

    const fetchClientDetails = async () => {
        setLoading(true);
        const loadingTimeout = setTimeout(() => setLoading(false), 3000);
        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            const res = await axios.get(`${API_BASE_URL}/receptionist/client/${id}/repairs`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClient(res.data.client);
            setRepairs(res.data.repairs);
        } catch (err) {
            console.error("Error fetching details:", err);
        } finally {
            clearTimeout(loadingTimeout);
            setLoading(false);
        }
    };
    const getBadgeClass = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase().trim();
        if (s === 'progress' || s === 'in_progress') return 'in_progress';
        if (s === 'completed') return 'completed';
        if (s === 'delivered') return 'delivered';
        if (s === 'cancelled') return 'cancelled';
        return 'pending';
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

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(null), 3000);
    };

    const today = new Date().toISOString().split('T')[0];
    const filteredRepairs = repairs.filter(job => {
        return (
            (job.vehicle?.plate_number || job.vehicle?.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.mechanic?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.service?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const todaysAppointments = repairs.filter(job => job.date_end && job.date_end.startsWith(today)).length;
    const deliveredCount = repairs.filter(job => job.status && job.status.toLowerCase().trim() === 'delivered').length;
    const completedToday = repairs.filter(job => job.date_end && job.date_end.startsWith(today) && job.status && job.status.toLowerCase().trim() === 'completed').length;
    const totalVisits = repairs.length;
    const totalSpent = repairs.reduce((acc, job) => acc + parseFloat(job.cost || 0), 0).toFixed(2);

    const handleUpdateStatus = async (jobId, newStatus) => {
        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            await axios.put(`${API_BASE_URL}/receptionist/repairs/${jobId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage(t('receptionist.modal.success', 'Status updated successfully.'), 'success');
            fetchClientDetails();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data?.message || 'Error updating status.', 'error');
        }
    };

    const handleDownloadInvoice = async (jobId) => {
        setDownloadingId(jobId);
        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            const res = await axios.get(`${API_BASE_URL}/receptionist/repairs/${jobId}/invoice`, { headers: { Authorization: `Bearer ${token}` } });
            const data = res.data.data || res.data;
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text("MecaPro Invoice", 105, 20, { align: "center" });
            doc.setFontSize(12);
            doc.text(`Invoice Number: ${data.invoice_number || 'N/A'}`, 14, 40);
            doc.text(`Date completed: ${new Date().toLocaleDateString()}`, 14, 50);
            doc.text(`Client: ${data.vehicle?.owner_name || 'N/A'}`, 14, 60);
            doc.text(`Total Cost: ${data.cost} MAD`, 14, 70);
            doc.save(`invoice_${jobId}.pdf`);
            showMessage("Invoice downloaded.", "success");
        } catch (err) {
            console.error('Invoice error:', err);
            showMessage("Failed to download invoice.", "error");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleNegotiation = async (job, decision) => {
        if (decision === 'reject') {
            try {
                setNegotiatingId(job.id);
                const token = localStorage.getItem('ACCESS_TOKEN');
                await axios.post(`${API_BASE_URL}/receptionist/jobs/${job.id}/negotiate`, { decision }, { headers: { Authorization: `Bearer ${token}` } });
                showMessage("Discount correctly rejected.", "success");
                fetchClientDetails();
            } catch (err) {
                showMessage("Failed to refuse discount.", "error");
            } finally { setNegotiatingId(null); }
        } else {
            setConfirmModal({
                show: true,
                title: 'Review Negotiation',
                body: 'Review the prices below and confirm the proposed reduction.',
                job,
                isNegotiation: true,
                onConfirm: async (prices) => {
                    try {
                        setConfirmModal(prev => ({ ...prev, show: false }));
                        setNegotiatingId(job.id);
                        const token = localStorage.getItem('ACCESS_TOKEN');
                        await axios.post(`${API_BASE_URL}/receptionist/jobs/${job.id}/negotiate`, { decision: 'approve', custom_prices: prices }, { headers: { Authorization: `Bearer ${token}` } });
                        showMessage("Negotiation approved successfully.", "success");
                        fetchClientDetails();
                    } catch (err) {
                       showMessage("Error saving negotiation.", "error");
                    } finally { setNegotiatingId(null); }
                }
            });
        }
    };

    // --- 6. RENDER ---
    return (
        <>
            <div className="receptionist-container">
                <DashboardNavbar user={user} onLogout={handleLogout} />

                <div className="header-actions">
                    <div>
                        <Link to="/receptionist/dashboard" className="back-link-container back-link">
                            ← {t('receptionist.details.back_dashboard', 'Back to Dashboard')}
                        </Link>
                        <h1>{t('receptionist.details.repair_history', '{{name}}\'s Repair History', { name: clientNameDisplay })}</h1>
                    </div>
                </div>

                {/* KPI SECTION */}
                <div className="kpi-container">
                    <div className="kpi-card">
                        <div className="kpi-icon"><i className="fa-regular fa-calendar"></i></div>
                        <div className="kpi-info"><h3>{t('receptionist.details.todays_appt', 'Today\'s Appt')}</h3><p className="kpi-number">{todaysAppointments}</p></div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon delivered-icon"><i className="fa-solid fa-handshake"></i></div>
                        <div className="kpi-info"><h3>{t('receptionist.details.delivered_count', 'Delivered')}</h3><p className="kpi-number">{deliveredCount}</p></div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon success-icon"><i className="fa-regular fa-circle-check"></i></div>
                        <div className="kpi-info"><h3>{t('receptionist.details.completed_today', 'Completed Today')}</h3><p className="kpi-number">{completedToday}</p></div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon"><i className="fa-solid fa-wrench"></i></div>
                        <div className="kpi-info"><h3>{t('receptionist.details.total_visits', 'Total Visits')}</h3><p className="kpi-number">{totalVisits}</p></div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon success-icon"><i className="fa-solid fa-wallet"></i></div>
                        <div className="kpi-info"><h3>{t('receptionist.details.total_spent', 'Total Spent')}</h3><p className="kpi-number">{totalSpent} MAD</p></div>
                    </div>
                </div>

                {/* Message Alert */}
                {message && (
                    <div className={`alert-message ${messageType}`} style={{
                        padding: '12px 20px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                        color: messageType === 'success' ? '#155724' : '#721c24',
                        border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                        textAlign: 'center'
                    }}>
                        <span>{message}</span>
                    </div>
                )}

                <div className="search-filter-bar">
                    <input
                        type="text"
                        placeholder={t('receptionist.details.search_placeholder', 'Search by License Plate, Mechanic, or Service...')}
                        className="dashboard-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-card">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('receptionist.details.vehicle', 'Vehicle')}</th>
                                <th>{t('dashboard.type', 'Type')}</th>
                                <th>{t('receptionist.details.service', 'Service')}</th>
                                <th>{t('receptionist.modal.mechanic', 'Mechanic')}</th>
                                <th>{t('receptionist.modal.total_cost', 'Cost')}</th>
                                <th>{t('receptionist.details.start_date', 'Start Date')}</th>
                                <th>{t('receptionist.details.predicted_end', 'Predicted End')}</th>
                                <th>{t('receptionist.details.status', 'Status')}</th>
                                <th>{t('receptionist.details.action', 'Action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" style={{ padding: 0 }}>
                                        <SkeletonLoader type="table-rows" cols={9} count={4} />
                                    </td>
                                </tr>
                            ) : filteredRepairs.length > 0 ? (
                                filteredRepairs.map(job => (
                                    <tr key={job.id}>
                                        <td>
                                            <strong>{job.vehicle?.make} {job.vehicle?.model}</strong>
                                            <div className="sub-text">{job.vehicle?.plate_number || job.vehicle?.plate}</div>
                                        </td>
                                        <td><span style={{ textTransform: 'capitalize' }}>{job.vehicle?.type}</span></td>

                                        {/* UPDATED SERVICE COLUMN WITH BADGES */}
                                        <td>
                                            <div className="service-badges-container">
                                                {job.services && job.services.length > 0 ? (
                                                    job.services.map((service, idx) => (
                                                        <span key={idx} className="service-badge">
                                                            {service.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="service-badge">
                                                        {job.service?.name || t('dashboard.general_service', 'General Service')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td>{job.mechanic ? <span className="mechanic-name">{job.mechanic.name}</span> : <span className="unassigned">{t('receptionist.details.unassigned', 'Unassigned')}</span>}</td>
                                        <td style={{ fontWeight: 'bold' }}>{job.cost} MAD</td>
                                        <td>{new Date(job.created_at).toLocaleDateString('en-GB')}</td>
                                        <td>{job.date_end ? new Date(job.date_end).toLocaleString('en-GB') : 'TBD'}</td>
                                        <td><span className={`status-badge ${getBadgeClass(job.status)}`}>
                                            {job.status ? job.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''}
                                        </span></td>
                                        <td>
                                            <button className="action-btn" onClick={() => navigate(`/track-repair/${job.id}`)}>
                                                <i className="fa-solid fa-eye"></i>
                                            </button>

                                            <button className="action-btn invoice-btn" disabled={downloadingId === job.id} onClick={() => handleDownloadInvoice(job.id)}>
                                                {downloadingId === job.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-arrow-down"></i>}
                                            </button>

                                            {/* Negotiation Buttons for Negotiation Requested Status */}
                                            {job.status && job.status.toLowerCase().trim() === 'negotiation requested' && (
                                                <>
                                                    <button
                                                        className="action-btn accept-reduction"
                                                        // style={{ backgroundColor: '#28a745', color: 'white' }}
                                                        title="Accept Discount Request"
                                                        disabled={negotiatingId === job.id}
                                                        onClick={() => handleNegotiation(job, 'approve')}
                                                    >
                                                        {negotiatingId === job.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-circle-check"></i>}
                                                    </button>
                                                    <button
                                                        className="action-btn decline-reduction"
                                                        // style={{ backgroundColor: '#dc3545', color: 'white' }}
                                                        title="Decline Discount Request"
                                                        disabled={negotiatingId === job.id}
                                                        onClick={() => handleNegotiation(job, 'reject')}
                                                    >
                                                        {negotiatingId === job.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-circle-xmark"></i>}
                                                    </button>
                                                </>
                                            )}

                                            {job.status && job.status.toLowerCase().trim() === 'completed' && (
                                                <button
                                                    className="action-btn deliver-btn"
                                                    title="Mark as Delivered"
                                                    onClick={() => handleUpdateStatus(job.id, 'Delivered')}
                                                >
                                                    <i className="fa-solid fa-car-side"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>{t('receptionist.details.no_repairs', 'No Repairs found.')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {confirmModal.show && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, backdropFilter: 'blur(3px)'
                    }}
                    onClick={() => setConfirmModal({ show: false, title: '', body: '', job: null, isNegotiation: false, onConfirm: null })}
                >
                    <div
                        style={{
                            background: 'var(--charcoal)', border: '1px solid var(--border-light)',
                            borderTop: '3px solid var(--red)', borderRadius: '8px',
                            padding: '28px 32px', maxWidth: confirmModal.isNegotiation ? 600 : 420, width: '90%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            maxHeight: '90vh', overflowY: 'auto'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 10px', color: 'var(--white)', fontSize: '1.1rem' }}>
                            {confirmModal.title}
                        </h3>
                        <p style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                            {confirmModal.body}
                        </p>

                        {/* Modal Body / Negotiation Logic */}
                        {confirmModal.isNegotiation && confirmModal.job && (
                            <div style={{ marginBottom: '20px', color: 'var(--white)' }}>
                                <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '10px' }}>Repair Services</h4>
                                <ul>
                                    {confirmModal.job.services && confirmModal.job.services.length > 0 ? (
                                        confirmModal.job.services.map((s, idx) => (
                                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.95rem' }}>{s.name}</span>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Original: {s.price} MAD</div>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--muted)' }}>No specific services listed.</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setConfirmModal({ show: false, title: '', body: '', job: null, isNegotiation: false, onConfirm: null })}
                                style={{
                                    padding: '9px 20px', border: '1px solid var(--border-light)',
                                    background: 'transparent', color: 'var(--muted)', borderRadius: 6,
                                    cursor: 'pointer', fontSize: '0.9rem'
                                }}
                            >
                                {t('receptionist.modal.cancel', 'Cancel')}
                            </button>
                            <button
                                onClick={() => confirmModal.onConfirm(confirmModal.isNegotiation ? customPrices : null)}
                                style={{
                                    padding: '9px 20px', border: 'none',
                                    background: 'var(--red)', color: '#fff', borderRadius: 6,
                                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700
                                }}
                            >
                                {t('receptionist.modal.confirm', 'Confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReceptionistClientDetails;
