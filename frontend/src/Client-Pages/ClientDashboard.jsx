import API_BASE_URL from '../api.js';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import AIDiagnostic from "../components/AIDiagnostic";
import { useTranslation } from 'react-i18next';
import Joyride, { STATUS } from 'react-joyride';
import './ClientDashboard.css';
import { isWeekend } from '../utils/dateUtils';

const ClientDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [plate1, setPlate1] = useState("");
    const [plate2, setPlate2] = useState("");
    const [plate3, setPlate3] = useState("");


    // --- Joyride Tour State ---
    const [runTour, setRunTour] = useState(false);

    const [tourSteps] = useState([
        {
            target: '.btn-appt',
            content: t('tour.btn_appt', 'Click here to request a new appointment with our garage.'),
            disableBeacon: true,
        },
        {
            target: '.add-vehicle-btn',
            content: t('tour.add_vehicle', 'Easily add your vehicles here to keep track of their details and repair history.'),
        },
        {
            target: '.repairs-list',
            content: t('tour.repairs_list', 'Monitor the status of your ongoing repairs and track completed jobs.'),
        },
        {
            target: '.repair-actions .status-label',
            content: t('tour.status_label', 'Pay close attention to these labels to always know exactly what stage your vehicle is at!'),
        },
        {
            target: '.appointments-section',
            content: t('tour.appointments', 'View your upcoming appointments and past request history here.'),
        }
    ]);

    // Tour is triggered inside fetchData after we know the user ID

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            setRunTour(false);
        }
    };

    const [user, setUser] = useState({
        name: localStorage.getItem('USER_NAME') || 'Client',
        email: '',
        role: 'Client'
    });

    const [repairs, setRepairs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState({ vehicles: 0, appointments: 0, invoices: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');

    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ make: '', model: '', license_plate: '', year: '', type: 'car' });
    const [submittingVehicle, setSubmittingVehicle] = useState(false);

    // --- Appointment State ---
    const [appointments, setAppointments] = useState([]);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [availableDays, setAvailableDays] = useState([]); // Array of {date, available, slots: []}
    const [daysLoading, setDaysLoading] = useState(false);
    const [startIndex, setStartIndex] = useState(0); // For scrolling the 30-day window
    const [newAppointment, setNewAppointment] = useState({ vehicle_id: '', preferred_date: '', appointment_time: '', description: '' });
    const [submittingAppointment, setSubmittingAppointment] = useState(false);
    const [apptError, setApptError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    // --- AI Diagnostic Modal State ---
    const [showAIModal, setShowAIModal] = useState(false);

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage(null);
            setMessageType('');
        }, 4000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        const loadingTimeout = setTimeout(() => setLoading(false), 3000);
        const token = localStorage.getItem('ACCESS_TOKEN');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const [repairRes, vehicleRes, userRes, apptRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/client/repairs`,  { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/client/vehicles`,  { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/user`,  { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/client/appointments`,  { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            setRepairs(repairRes.data.data || []);
            setVehicles(vehicleRes.data || []);
            setAppointments(apptRes.data.data || []);

            const userData = {
                name: userRes.data.name,
                email: userRes.data.email,
                role: 'Client'
            };
            setUser(userData);

            // --- Per-user tour check ---
            const userId = userRes.data.id || userRes.data.email;
            const tourKey = `tour_done_${userId}`;
            if (!localStorage.getItem(tourKey)) {
                setRunTour(true);
                localStorage.setItem(tourKey, 'true');
            }

            localStorage.setItem('USER_NAME', userRes.data.name);

            setStats(prev => ({
                ...prev,
                vehicles: vehicleRes.data?.length || 0,
                appointments: (apptRes.data.data || []).filter(a => a.status === 'Pending').length,
                invoices: repairRes.data.data?.filter(r => r.status === 'Completed').length || 0
            }));

        } catch (err) {
            console.error("Fetch Error:", err);
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('ACCESS_TOKEN');
                localStorage.removeItem('USER_NAME');
                localStorage.removeItem('USER_ROLE');
                navigate('/login');
            }
            showMessage(t('dashboard.messages.fetch_error', 'Failed to load data. Please refresh.'), 'error');
        } finally {
            clearTimeout(loadingTimeout);
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Confirmation Helper ---
    const askConfirm = (title, message, onConfirm) => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };

    const closeConfirm = () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null });


    const handleApproveJob = async (repairId) => {
        if (actionLoading) return;
        setActionLoading(repairId);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `${API_BASE_URL}/jobs/${repairId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === repairId ? { ...r, status: 'In Progress' } : r
                )
            );
            showMessage(response.data.message || t('dashboard.messages.job_approved', 'Job approved! Work will start soon.'), 'success');
        } catch (err) {
            console.error("Approve Error:", err);
            showMessage(err.response?.data?.message || t('dashboard.messages.approve_failed', 'Failed to approve job.'), 'error');
        } finally {
            setActionLoading(null);
            closeConfirm();
        }
    };


    const handleAcceptEstimate = async (repairId) => {
        if (actionLoading) return;
        setActionLoading(repairId);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `${API_BASE_URL}/jobs/${repairId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === repairId ? { ...r, status: 'In Progress' } : r
                )
            );
            showMessage(response.data.message || t('dashboard.messages.estimate_accepted', 'Estimate accepted! Work will start soon.'), 'success');
        } catch (err) {
            console.error("Accept Error:", err);
            showMessage(err.response?.data?.message || t('dashboard.messages.accept_failed', 'Failed to accept estimate.'), 'error');
        } finally {
            setActionLoading(null);
            closeConfirm();
        }
    };

    const handleDeclineEstimate = async (repairId) => {
        if (actionLoading) return;
        setActionLoading(repairId);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `${API_BASE_URL}/jobs/${repairId}/decline`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === repairId ? { ...r, status: 'Cancelled' } : r
                )
            );
            showMessage(response.data.message || t('dashboard.messages.estimate_declined', 'Estimate declined successfully.'), 'success');
        } catch (err) {
            console.error("Decline Error:", err);
            showMessage(err.response?.data?.message || t('dashboard.messages.decline_failed', 'Failed to decline estimate.'), 'error');
        } finally {
            setActionLoading(null);
            closeConfirm();
        }
    };


    const handleNegotiateJob = async (repairId) => {
        if (actionLoading) return;
        setActionLoading(repairId);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `${API_BASE_URL}/jobs/${repairId}/negotiate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === repairId ? { ...r, status: 'Negotiation Requested' } : r
                )
            );
            showMessage(response.data.message || t('dashboard.messages.discount_sent', 'Discount request sent!'), 'success');
        } catch (err) {
            console.error("Negotiate Error:", err);
            showMessage(err.response?.data?.message || t('dashboard.messages.discount_failed', 'Failed to request discount.'), 'error');
        } finally {
            setActionLoading(null);
            closeConfirm();
        }
    };

    // --- Appointment Handlers ---

    // Fetch Days whenever modal opens
    useEffect(() => {
        if (!showAppointmentModal) return;
        const fetchDays = async () => {
            setDaysLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/appointments/available-days`);
                setAvailableDays(res.data.days || []);
                setStartIndex(0);
            } catch (err) {
                console.error('Failed to fetch days', err);
            } finally {
                setDaysLoading(false);
            }
        };
        fetchDays();
    }, [showAppointmentModal]);

    const handleScrollNext = () => {
        if (startIndex + 4 < availableDays.length) setStartIndex(s => s + 4);
    };
    const handleScrollPrev = () => {
        if (startIndex - 4 >= 0) setStartIndex(s => s - 4);
    };

    const isPastSlot = (dateStr, timeStr) => {
        const now = new Date();
        const slotDate = new Date(`${dateStr}T${timeStr}`);
        return slotDate < now;
    };

    const handleSubmitAppointment = async (e) => {
        e.preventDefault();
        setApptError(null);
        if (!newAppointment.preferred_date || !newAppointment.appointment_time) {
            setApptError(t('dashboard.messages.select_time_slot', 'Please select a time slot.'));
            return;
        }
        setSubmittingAppointment(true);
        const token = localStorage.getItem('ACCESS_TOKEN');
        try {
            await axios.post(
                `${API_BASE_URL}/client/appointments`,
                newAppointment,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage(t('dashboard.messages.appt_submitted', 'Appointment request submitted!'), 'success');
            setShowAppointmentModal(false);
            setNewAppointment({ vehicle_id: '', preferred_date: '', appointment_time: '', description: '' });
            fetchData();
        } catch (err) {
            const errMsg = err.response?.data?.message || t('dashboard.messages.appt_failed', 'Failed to request appointment.');
            setApptError(errMsg);
        } finally {
            setSubmittingAppointment(false);
        }
    };

    useEffect(() => {
        const fullPlate = `${plate1}-${plate2}-${plate3}`;
        setNewVehicle(prev => ({
            ...prev,
            license_plate: fullPlate
        }));
    }, [plate1, plate2, plate3]);

    const handleDownloadEstimate = async (repair) => {
        const doc = new jsPDF();

        // A. HELPER: Load Image
        const getBase64ImageFromUrl = (url) => {
            return new Promise((resolve, reject) => {
                var img = new Image();
                img.setAttribute("crossOrigin", "anonymous");
                img.onload = () => {
                    var canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    var dataURL = canvas.toDataURL("image/png");
                    resolve(dataURL);
                };
                img.onerror = error => reject(error);
                img.src = url;
            });
        };

        // B. LOAD LOGO
        let logoData = null;
        try {
            logoData = await getBase64ImageFromUrl("/images/MECHANIC.png");
        } catch (error) {
            console.warn("Logo not found");
        }

        // C. STYLES
        const brandColor = [0, 180, 216];
        const lightGray = [245, 247, 250];
        const darkText = [51, 51, 51];
        const grayText = [128, 128, 128];

        // D. HEADER
        doc.setFillColor(...brandColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("MECAPRO", 20, 28);

        if (logoData) doc.addImage(logoData, 'PNG', 160, 5, 30, 30);

        // E. INFO
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("ESTN Selouane", 20, 55);
        doc.text("Nador, Morocco", 20, 60);
        doc.text("mecapro.info@gmail.com", 20, 65);

        // F. ESTIMATE META
        const estimateNum = repair.estimate_number || `EST-${repair.id}`;
        const dateIn = repair.created_at ? new Date(repair.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        const dateDue = repair.date_end ? new Date(repair.date_end).toLocaleDateString('en-GB') : "TBD";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("ESTIMATE", 140, 55);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...grayText);
        doc.text(`No: ${estimateNum}`, 140, 62);
        doc.text(`Date In: ${dateIn}`, 140, 67);
        doc.text(`Due Date: ${dateDue}`, 140, 72);

        // G. BILL TO
        doc.setDrawColor(200);
        doc.line(20, 80, 190, 80);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandColor);
        doc.text("ESTIMATE FOR:", 20, 90);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(user.name || "Guest Client", 20, 97);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grayText);
        const carInfo = `${repair.vehicle?.type ? repair.vehicle.type.toUpperCase() + ' - ' : ''}${repair.vehicle?.make || ''} ${repair.vehicle?.model || ''} - ${repair.vehicle?.license_plate || ''}`;
        doc.text(carInfo, 20, 103);

        // H. TABLE HEADER
        let y = 120;
        doc.setFillColor(...brandColor);
        doc.rect(20, y - 6, 170, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("DESCRIPTION", 25, y);
        doc.text("QTY", 110, y);
        doc.text("PRICE", 140, y);
        doc.text("TOTAL", 185, y, { align: "right" });

        // I. TABLE ROWS & LOGIC
        y += 12;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        let grandTotal = 0;
        let rowIndex = 0;

        const addRow = (description, qty, price) => {
            const parsedQty = typeof qty === 'number' ? qty : 1;
            const lineTotal = parsedQty * price;
            grandTotal += lineTotal;
            if (rowIndex % 2 === 0) {
                doc.setFillColor(...lightGray);
                doc.rect(20, y - 5, 170, 8, 'F');
            }
            doc.text(description, 25, y);
            doc.text(qty.toString(), 110, y);
            doc.text(price.toFixed(2), 140, y);
            doc.text(lineTotal.toFixed(2), 185, y, { align: "right" });
            y += 10;
            rowIndex++;
            if (y > 270) { doc.addPage(); y = 20; rowIndex = 0; }
        };

        const hasServices = repair.services && Array.isArray(repair.services) && repair.services.length > 0;
        const hasParts = repair.parts && Array.isArray(repair.parts) && repair.parts.length > 0;

        if (hasServices || hasParts) {
            // 1. Add Services
            if (hasServices) {
                repair.services.forEach(service => {
                    const price = Number(service.price || 0);
                    const qty = '-';
                    if (price > 0) addRow(service.name, qty, price);
                });
            } else if (repair.service) { // Fallback for single attached service
                const labor = Number(repair.service.price || repair.cost || 0);
                if (labor > 0) addRow(repair.service.name || "Repair Service", '-', labor);
            }

            // 2. Add Parts
            if (hasParts) {
                repair.parts.forEach(part => {
                    const qty = Number(part.quantity || part.pivot?.quantity || 1);
                    const price = Number(part.price || part.pivot?.price || 0);
                    if (price > 0) addRow(`Part: ${part.name}`, qty, price);
                });
            }
        } else {
            // Fallback: No details found, use the Main Total Cost
            const labor = Number(repair.cost || 0);
            if (labor > 0) {
                addRow(repair.service?.name || "Repair Service (Total)", '-', labor);
            }
        }

        // J. TOTALS
        y += 5;
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(100, y, 190, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkText);
        doc.text("Estimated Total  : ", 100, y);

        doc.setFontSize(14);
        doc.setTextColor(...brandColor);
        doc.text(`${grandTotal.toFixed(2)} MAD`, 185, y, { align: "right" });

        // K. NOTES (if any)
        if (repair.mechanic_notes) {
            y += 15;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...darkText);
            doc.text("Notes:", 20, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...grayText);
            const splitNotes = doc.splitTextToSize(repair.mechanic_notes, 170);
            doc.text(splitNotes, 20, y);
        }

        // L. FOOTER
        y = doc.internal.pageSize.height - 20;
        doc.setFontSize(9);
        doc.setTextColor(...grayText);
        doc.setFont("helvetica", "italic");
        doc.text("Please review this estimate carefully before approving.", 105, y, { align: "center" });

        doc.save(`Estimate_${estimateNum}.pdf`);
        showMessage(t('dashboard.messages.estimate_downloaded', 'Estimate downloaded successfully!'), 'success');
    };

    const handleDownloadInvoice = async (repair) => {
        const doc = new jsPDF();

        // A. HELPER: Load Image
        const getBase64ImageFromUrl = (url) => {
            return new Promise((resolve, reject) => {
                var img = new Image();
                img.setAttribute("crossOrigin", "anonymous");
                img.onload = () => {
                    var canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    var dataURL = canvas.toDataURL("image/png");
                    resolve(dataURL);
                };
                img.onerror = error => reject(error);
                img.src = url;
            });
        };

        // B. LOAD LOGO
        let logoData = null;
        try {
            logoData = await getBase64ImageFromUrl("/images/MECHANIC.png");
        } catch (error) {
            console.warn("Logo not found");
        }

        // C. STYLES
        const brandColor = [0, 180, 216];
        const lightGray = [245, 247, 250];
        const darkText = [51, 51, 51];
        const grayText = [128, 128, 128];

        // D. HEADER
        doc.setFillColor(...brandColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("MECAPRO", 20, 28);

        if (logoData) doc.addImage(logoData, 'PNG', 160, 5, 30, 30);

        // E. INFO
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("ESTN Selouane", 20, 55);
        doc.text("Nador, Morocco", 20, 60);
        doc.text("mecapro.info@gmail.com", 20, 65);

        // F. INVOICE META
        const invoiceNum = repair.invoice_number || `INV-${repair.id}`;
        const dateIn = repair.created_at ? new Date(repair.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        const dateDue = repair.date_end ? new Date(repair.date_end).toLocaleDateString('en-GB') : "TBD";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("INVOICE", 140, 55);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...grayText);
        doc.text(`No: ${invoiceNum}`, 140, 62);
        doc.text(`Date In: ${dateIn}`, 140, 67);
        doc.text(`Due Date: ${dateDue}`, 140, 72);

        // G. BILL TO
        doc.setDrawColor(200);
        doc.line(20, 80, 190, 80);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandColor);
        doc.text("BILL TO:", 20, 90);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(user.name || "Guest Client", 20, 97);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grayText);
        const carInfo = `${repair.vehicle?.type ? repair.vehicle.type.toUpperCase() + ' - ' : ''}${repair.vehicle?.make || ''} ${repair.vehicle?.model || ''} - ${repair.vehicle?.license_plate || ''}`;
        doc.text(carInfo, 20, 103);

        // H. TABLE HEADER
        let y = 120;
        doc.setFillColor(...brandColor);
        doc.rect(20, y - 6, 170, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("DESCRIPTION", 25, y);
        doc.text("QTY", 110, y);
        doc.text("PRICE", 140, y);
        doc.text("TOTAL", 185, y, { align: "right" });

        // I. TABLE ROWS & LOGIC
        y += 12;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        let grandTotal = 0;
        let rowIndex = 0;

        const addRow = (description, qty, price) => {
            const parsedQty = typeof qty === 'number' ? qty : 1;
            const lineTotal = parsedQty * price;
            grandTotal += lineTotal;
            if (rowIndex % 2 === 0) {
                doc.setFillColor(...lightGray);
                doc.rect(20, y - 5, 170, 8, 'F');
            }
            doc.text(description, 25, y);
            doc.text(qty.toString(), 110, y);
            doc.text(price.toFixed(2), 140, y);
            doc.text(lineTotal.toFixed(2), 185, y, { align: "right" });
            y += 10;
            rowIndex++;
            if (y > 270) { doc.addPage(); y = 20; rowIndex = 0; }
        };

        const hasServices = repair.services && Array.isArray(repair.services) && repair.services.length > 0;
        const hasParts = repair.parts && Array.isArray(repair.parts) && repair.parts.length > 0;

        if (hasServices || hasParts) {
            // 1. Add Services
            if (hasServices) {
                repair.services.forEach(service => {
                    const price = Number(service.price || 0);
                    const qty = '-';
                    if (price > 0) addRow(service.name, qty, price);
                });
            } else if (repair.service) { // Fallback for single attached service
                const labor = Number(repair.service.price || repair.cost || 0);
                if (labor > 0) addRow(repair.service.name || "Repair Service", '-', labor);
            }

            // 2. Add Parts
            if (hasParts) {
                repair.parts.forEach(part => {
                    const qty = Number(part.quantity || part.pivot?.quantity || 1);
                    const price = Number(part.price || part.pivot?.price || 0);
                    if (price > 0) addRow(`Part: ${part.name}`, qty, price);
                });
            }
        } else {
            // Fallback: No details found, use the Main Total Cost
            const labor = Number(repair.cost || 0);
            if (labor > 0) {
                addRow(repair.service?.name || "Repair Service (Total)", '-', labor);
            }
        }

        // J. TOTALS
        y += 5;
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(100, y, 190, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkText);
        doc.text("Total a payer  : ", 100, y);

        doc.setFontSize(14);
        doc.setTextColor(...brandColor);
        doc.text(`${grandTotal.toFixed(2)} MAD`, 185, y, { align: "right" });

        // K. FOOTER
        y = doc.internal.pageSize.height - 20;
        doc.setFontSize(9);
        doc.setTextColor(...grayText);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for choosing MecaPro!", 105, y, { align: "center" });

        doc.save(`Invoice_${invoiceNum}.pdf`);
        showMessage(t('dashboard.messages.invoice_downloaded', 'Invoice downloaded successfully!'), 'success');
    };

    const handleAddVehicle = () => {
        setPlate1("");
        setPlate2("");
        setPlate3("");
        setShowAddVehicleModal(true);
    };

    const handleCloseVehicleModal = () => {
        setShowAddVehicleModal(false);
        setNewVehicle({ make: '', model: '', license_plate: '', year: '', type: 'car' });
        setPlate1("");
        setPlate2("");
        setPlate3("");
    };

    const handleSubmitVehicle = async (e) => {
        e.preventDefault();

        if (!newVehicle.make || !newVehicle.model || !newVehicle.year) {
            showMessage(t('dashboard.messages.fields_required', 'All fields are required'), 'error');
            return;
        }

        if (!plate1 || !plate2 || !plate3) {
            showMessage(t('dashboard.messages.plate_required', 'Complete license plate correctly'), 'error');
            return;
        }

        if (newVehicle.year < 1900 || newVehicle.year > new Date().getFullYear() + 1) {
            showMessage(t('dashboard.messages.invalid_year', 'Please enter a valid year'), 'error');
            return;
        }

        setSubmittingVehicle(true);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            await axios.post(
                `${API_BASE_URL}/vehicles`,
                newVehicle,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showMessage(t('dashboard.messages.vehicle_added', 'Vehicle added successfully!'), 'success');
            handleCloseVehicleModal();
            fetchData();
        } catch (err) {
            console.error('Add Vehicle Error:', err);
            showMessage(err.response?.data?.message || t('dashboard.messages.add_vehicle_failed', 'Failed to add vehicle'), 'error');
        } finally {
            setSubmittingVehicle(false);
        }
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase().trim().replace(/_/g, ' ');

        if (s === 'completed') return 'completed';
        if (s === 'estimate sent' || s.includes('estimate')) return 'estimate-sent';
        if (s === 'negotiation requested' || s.includes('negotiation')) return 'negotiation';
        if (s === 'in progress' || s === 'progress') return 'in-progress';
        if (s === 'pending') return 'pending';

        return 'pending';
    };

    return (
        <div className="client-space">
            <Joyride
                steps={tourSteps}
                run={runTour}
                continuous={true}
                scrollToFirstStep={true}
                showSkipButton={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: 'var(--red)',
                        textColor: 'var(--white)',
                        backgroundColor: 'var(--charcoal)',
                        arrowColor: 'var(--charcoal)',
                        overlayColor: 'rgba(0, 0, 0, 0.75)',
                    },
                    tooltip: {
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontFamily: "'Barlow', sans-serif",
                    },
                    tooltipContainer: {
                        textAlign: 'left'
                    },
                    buttonNext: {
                        backgroundColor: 'var(--red)',
                        color: 'var(--white)',
                        borderRadius: '4px',
                        padding: '10px 18px',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        border: 'none',
                    },
                    buttonBack: {
                        color: 'var(--muted)',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        marginRight: '14px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                    },
                    buttonSkip: {
                        color: 'var(--muted)',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                    }
                }}
            />
            <DashboardNavbar user={user} onLogout={() => { }} />

            <div className="main-content">


                <section className="dashboard-title">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2>{t('dashboard.welcome', { name: user.name, defaultValue: `Welcome Back, ${user.name} !` })}</h2>
                            <p>{t('dashboard.subtitle', 'Manage your vehicles & appointments')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-ai-diagnostic" onClick={() => setShowAIModal(true)}>
                                <i className="fa-solid fa-robot"></i> {t('dashboard.btn_ai_diagnostic', 'AI Diagnostic')}
                            </button>
                            <button className="btn-appt" onClick={() => setShowAppointmentModal(true)}>
                                <i className="fa-solid fa-calendar-plus"></i> {t('dashboard.request_appointment', 'Request Appointment')}
                            </button>
                        </div>
                    </div>
                </section>

                {message && (
                    <div className={`alert-message ${messageType}`}>
                        <span>{message}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-text">
                            <label>{t('dashboard.my_vehicles', 'My Vehicles')}</label>
                            <h3>{stats.vehicles}</h3>
                        </div>
                        <div className="stat-icon car-bg"><i className="fa-solid fa-car"></i></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-text">
                            <label>{t('dashboard.next_appointment', 'Next Appointment')}</label>
                            <h3>{stats.appointments}</h3>
                        </div>
                        <div className="stat-icon cal-bg"><i className="fa-solid fa-calendar"></i></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-text">
                            <label>{t('dashboard.invoices', 'Invoices')}</label>
                            <h3>{stats.invoices}</h3>
                        </div>
                        <div className="stat-icon inv-bg"><i className="fa-solid fa-file-invoice"></i></div>
                    </div>
                </div>

                {/* Vehicles Section */}
                <section className="vehicles-section-main">
                    <div className="vehicles-header-row">
                        <h3>{t('dashboard.my_vehicles', 'My Vehicles')}</h3>
                        <button className="add-vehicle-btn" onClick={handleAddVehicle}>
                            <i className="fa-solid fa-plus"></i> {t('dashboard.add_vehicle', 'Add vehicle')}
                        </button>
                    </div>

                    <div className="vehicles-display-container">
                        {vehicles.length === 0 ? (
                            <div className="vehicles-empty-state">
                                <i className="fa-solid fa-car" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '10px' }}></i>
                                <p style={{ margin: 0, color: '#64748b' }}>{t('dashboard.no_vehicles', 'No vehicles added yet. Click "Add vehicle" to get started!')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="vehicles-cards-row">
                                    {vehicles.slice(0, 3).map(v => (
                                        <div key={v.id} className="vehicle-display-card">
                                            <div className="vehicle-card-icon">
                                                <i className="fa-solid fa-car"></i>
                                            </div>
                                            <div className="vehicle-card-info">
                                                <h4>{v.make} {v.model}</h4>
                                                <p>{v.license_plate}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {vehicles.length > 3 && (
                                    <button className="all-vehicles-link" onClick={() => {/* Navigate to vehicles page later */ }}>
                                        {t('dashboard.all_vehicles', 'All vehicles')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Repairs List */}
                <section className="repairs-list">
                    <h3>{t('dashboard.my_repairs', 'My Repairs')}</h3>

                    {loading ? (
                        <SkeletonLoader type="repair-rows" count={3} />
                    ) : repairs.length === 0 ? (
                        <div className="empty-state">
                            <i className="fa-solid fa-inbox"></i>
                            <p>{t('dashboard.no_repairs_found', 'No repair jobs found.')}</p>
                        </div>
                    ) : (
                        repairs.map(repair => (
                            <div key={repair.id} className="repair-row-card">
                                <div className="repair-main">
                                    <div className="repair-type-icon"><i className="fa-solid fa-wrench"></i></div>
                                    <div className="repair-info">
                                        <div className="service-tags">
                                            {repair.services && repair.services.length > 0 ? (
                                                repair.services.map(s => <span key={s.id} className="tag">{s.name}</span>)
                                            ) : (
                                                <span className="tag">{t('dashboard.general_service', 'General Service')}</span>
                                            )}
                                        </div>
                                        <h4>{repair.vehicle?.make} {repair.vehicle?.model}</h4>
                                        <p className="due-date">{t('dashboard.due', 'Due')}: {repair.date_end ? new Date(repair.date_end).toLocaleDateString('en-GB', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        }) + ' – ' + new Date(repair.date_end).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        }).toUpperCase() : 'TBD'}</p>
                                    </div>
                                </div>

                                <div className="repair-actions">
                                    {repair.status?.toLowerCase() === 'completed' && (
                                        <>
                                            <span className="status-label completed-label">{t('common.status.completed', 'Completed')}</span>
                                            <button className="btn-download" onClick={() => handleDownloadInvoice(repair)}>
                                                {t('dashboard.download_invoice', 'Download Invoice')}
                                            </button>
                                        </>
                                    )}
                                    {repair.status?.toLowerCase() === 'estimate sent' && (
                                        <>
                                            <span className="status-label ready-label">{t('dashboard.estimate_ready', 'Estimate Ready')}</span>
                                            <button className="btn-secondary" onClick={() => handleDownloadEstimate(repair)}>
                                                {t('dashboard.download_estimate', 'Download Estimate')}
                                            </button>
                                            <button
                                                className="btn-accept"
                                                disabled={actionLoading === repair.id}
                                                onClick={() => askConfirm(
                                                    t('dashboard.accept_estimate_title', 'Accept Estimate'),
                                                    t('dashboard.accept_estimate_msg', 'Are you sure you want to accept this estimate? Work will begin immediately.'),
                                                    () => handleAcceptEstimate(repair.id)
                                                )}
                                            >
                                                {actionLoading === repair.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('dashboard.accept', 'Accept')}
                                            </button>
                                            {repair.negotiation_count > 0 ? (
                                                <button
                                                    className="btn-danger" style={{ background: 'transparent', border: '1px solid var(--red)', padding: '10px 18px', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, borderRadius: '4px', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--red)', transition: 'background 0.2s, color 0.2s' }}
                                                    onMouseEnter={(e) => { e.target.style.background = 'var(--red)'; e.target.style.color = 'var(--white)'; }}
                                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--red)'; }}
                                                    disabled={actionLoading === repair.id}
                                                    onClick={() => askConfirm(
                                                        t('dashboard.decline_estimate_title', 'Decline Estimate'),
                                                        t('dashboard.decline_estimate_msg', 'Are you sure you want to decline this estimate? This will cancel the repair request.'),
                                                        () => handleDeclineEstimate(repair.id)
                                                    )}
                                                >
                                                    {actionLoading === repair.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('dashboard.decline', 'Decline')}
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn-primary"
                                                    disabled={actionLoading === repair.id}
                                                    onClick={() => askConfirm(
                                                        t('dashboard.request_reduction_title', 'Request Reduction'),
                                                        t('dashboard.request_reduction_msg', 'This will send a discount request to the receptionist. Continue?'),
                                                        () => handleNegotiateJob(repair.id)
                                                    )}
                                                >
                                                    {actionLoading === repair.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('dashboard.request_reduction', 'Request Reduction')}
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {repair.status?.toLowerCase() === 'negotiation requested' && (
                                        <>
                                            <span className="status-label pending-label">{t('dashboard.negotiation_pending', 'Negotiation Pending')}</span>
                                            <button className="btn-secondary" onClick={() => handleDownloadEstimate(repair)}>
                                                {t('dashboard.download_estimate', 'Download Estimate')}
                                            </button>
                                            <button className="btn-primary" disabled={actionLoading === repair.id} onClick={() => askConfirm(
                                                t('dashboard.approve_estimate_title', 'Approve Estimate'),
                                                t('dashboard.approve_estimate_msg', 'Accept the estimate at the current price? This will start the repair work.'),
                                                () => handleApproveJob(repair.id)
                                            )}>
                                                {actionLoading === repair.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('dashboard.approve', 'Approve')}
                                            </button>
                                            <button className="btn-primary" disabled>{t('dashboard.reduction_requested', 'Reduction Already Requested')}</button>
                                        </>
                                    )}
                                    {repair.status?.toLowerCase() === 'in progress' && (
                                        <span className="status-label progress-label">{t('common.status.in_progress')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'pending' && (
                                        <span className="status-label pending-label">{t('common.status.pending')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'cancelled' && (
                                        <span className="status-label error-label">{t('common.status.cancelled')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'delivered' && (
                                        <span className="status-label ready-label">{t('common.status.delivered')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'ready' && (
                                        <span className="status-label ready-label">{t('common.status.ready')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'diagnostic' && (
                                        <span className="status-label pending-label">{t('common.status.diagnostic')}</span>
                                    )}
                                    {/* Fallback for anything else */}
                                    {![
                                        'completed', 'estimate sent', 'negotiation requested',
                                        'in progress', 'pending', 'cancelled', 'delivered',
                                        'ready', 'diagnostic'
                                    ].includes(repair.status?.toLowerCase()) && (
                                            <span className="status-label pending-label">{repair.status}</span>
                                        )}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                {/* Appointments Section */}
                <section className="appointments-section">
                    <h3><i className="fa-solid fa-calendar-days"></i> {t('dashboard.next_appointment', 'Next Appointment')}</h3>
                    {loading ? null : appointments.length === 0 ? (
                        <div className="appt-empty">{t('dashboard.no_appointments', 'No appointment requests yet.')}</div>
                    ) : (
                        <div className="appt-list">
                            {appointments.map(appt => (
                                <div key={appt.id} className="appt-card">
                                    <div className="appt-info">
                                        <p className="appt-date"><i className="fa-regular fa-calendar"></i> {new Date(appt.preferred_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        {appt.vehicle && <p className="appt-vehicle"><i className="fa-solid fa-car"></i> {appt.vehicle.make} {appt.vehicle.model}</p>}
                                        {appt.description && <p className="appt-desc">{appt.description}</p>}
                                        {appt.receptionist_notes && <p className="appt-notes"><i className="fa-solid fa-comment"></i> {appt.receptionist_notes}</p>}
                                    </div>
                                    <span className={`appt-badge appt-${appt.status.toLowerCase()}`}>{t(`common.status.${appt.status.toLowerCase()}`, appt.status)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Add Vehicle Modal */}
            {showAddVehicleModal && (
                <div className="modal-overlay" onClick={handleCloseVehicleModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('dashboard.modal_add_title', 'Add New Vehicle')}</h2>
                        <form onSubmit={handleSubmitVehicle}>
                            <div className="form-group">
                                <label>{t('dashboard.modal_maker', 'Maker')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('dashboard.modal_maker_placeholder', 'e.g., Toyota')}
                                    value={newVehicle.make}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('dashboard.modal_model', 'Model')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('dashboard.modal_model_placeholder', 'e.g., Camry')}
                                    value={newVehicle.model}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    {t('dashboard.modal_license_plate', 'License Plate')}
                                    <span className="required">*</span>
                                </label>

                                <div style={{ display: "flex", gap: "8px" }}>

                                    {/* First Part — Up to 6 Numbers */}
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={plate1}
                                        onChange={(e) =>
                                            setPlate1(e.target.value.replace(/[^0-9]/g, ""))
                                        }
                                        placeholder="123456"
                                        required
                                    />

                                    {/* Middle Part — 1 Letter Only */}
                                    <input
                                        type="text"
                                        maxLength="1"
                                        value={plate2}
                                        onChange={(e) =>
                                            setPlate2(
                                                e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase()
                                            )
                                        }
                                        placeholder="A"
                                        required
                                    />

                                    {/* Last Part — Up to 2 Numbers */}
                                    <input
                                        type="text"
                                        maxLength="2"
                                        value={plate3}
                                        onChange={(e) =>
                                            setPlate3(e.target.value.replace(/[^0-9]/g, ""))
                                        }
                                        placeholder="12"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{t('dashboard.modal_year', 'Year')} <span className="required">*</span></label>
                                <input
                                    type="number"
                                    placeholder="e.g., 2020"
                                    value={newVehicle.year}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('dashboard.type', 'Type')} <span className="required">*</span></label>
                                <select
                                    value={newVehicle.type}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                                    required
                                >
                                    <option value="car">{t('dashboard.vehicle_types.car', 'Car')}</option>
                                    <option value="bus">{t('dashboard.vehicle_types.bus', 'Bus')}</option>
                                    <option value="truck">{t('dashboard.vehicle_types.truck', 'Truck')}</option>
                                    <option value="moto">{t('dashboard.vehicle_types.moto', 'Moto')}</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleCloseVehicleModal}
                                    disabled={submittingVehicle}
                                >
                                    {t('dashboard.modal_cancel', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={submittingVehicle}
                                >
                                    {submittingVehicle ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i> {t('dashboard.modal_adding', 'Adding...')}
                                        </>
                                    ) : (
                                        t('dashboard.modal_add_button', 'Add Vehicle')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointment Request Modal (2-Step) */}
            {showAppointmentModal && (
                <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
                    <div className="modal-content appointment-modal" onClick={(e) => e.stopPropagation()}>
                        <h2><i className="fa-solid fa-calendar-plus"></i> {t('dashboard.request_appointment', 'Request Appointment')}</h2>

                        {apptError && (
                            <div className="alert-message error" style={{ marginBottom: '15px' }}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                                {apptError}
                            </div>
                        )}



                        {daysLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                                <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                                <p style={{ marginTop: '10px' }}>Loading calendar...</p>
                            </div>
                        ) : availableDays.length > 0 ? (
                            <div className="doctolib-scheduler">
                                <div className="doctolib-header-wrapper">
                                    <button
                                        type="button"
                                        className="doc-nav-btn prev"
                                        onClick={handleScrollPrev}
                                        disabled={startIndex === 0}
                                    >
                                        <i className="fa-solid fa-chevron-left"></i>
                                    </button>

                                    <div className="doc-days-headers">
                                        {availableDays.slice(startIndex, startIndex + 4).map(day => {
                                            const d = new Date(day.date);
                                            return (
                                                <div key={day.date} className="doc-day-col-header">
                                                    <strong>{d.toLocaleDateString(t('locale', 'en'), { weekday: 'long' })}</strong>
                                                    <span>{d.toLocaleDateString(t('locale', 'en'), { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        className="doc-nav-btn next"
                                        onClick={handleScrollNext}
                                        disabled={startIndex + 4 >= availableDays.length}
                                    >
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>

                                <div className="doc-slots-body">
                                    <div className="doc-slots-columns">
                                        {availableDays.slice(startIndex, startIndex + 4).map(day => (
                                            <div key={day.date} className="doc-slots-col">
                                                {day.slots.map(slot => {
                                                    const isPast = isPastSlot(day.date, slot.time);
                                                    const isAvail = slot.available && !isPast && !isWeekend(day.date);
                                                    const isSelected = newAppointment.preferred_date === day.date && newAppointment.appointment_time === slot.time;

                                                    if (!isAvail) {
                                                        return (
                                                            <div key={`${day.date}-${slot.time}`} className="doc-slot-btn disabled">
                                                                &mdash;
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            key={`${day.date}-${slot.time}`}
                                                            type="button"
                                                            className={`doc-slot-btn ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => setNewAppointment(prev => ({ ...prev, preferred_date: day.date, appointment_time: slot.time }))}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                        <button
                                            type="button"
                                            className="doc-more-slots-btn"
                                            onClick={handleScrollNext}
                                            disabled={startIndex + 4 >= availableDays.length}
                                        >
                                            {t('dashboard.more_slots', 'Voir plus de créneaux')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <form onSubmit={handleSubmitAppointment} className="appointment-step-2" style={{ marginTop: '20px' }}>
                            <div className="form-group">
                                <label>{t('dashboard.vehicle_optional', 'Vehicle (optional)')}</label>
                                <select
                                    value={newAppointment.vehicle_id}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, vehicle_id: e.target.value })}
                                    className="form-control"
                                >
                                    <option value="">-- {t('dashboard.no_specific_vehicle', 'No specific vehicle')} --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('dashboard.description_issue', 'Description / Issue')}</label>
                                <textarea
                                    placeholder={t('dashboard.describe_issue_placeholder', 'Describe the issue or reason for your visit...')}
                                    value={newAppointment.description}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                                    rows={3}
                                    className="form-control"
                                    style={{ height: 'auto', resize: 'vertical' }}
                                />
                            </div>

                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button type="button" className="cancel-btn align-left" onClick={() => setShowAppointmentModal(false)}>
                                    {t('receptionist.modal.cancel', 'Cancel')}
                                </button>
                                <button type="submit" className="save-btn" disabled={submittingAppointment || !newAppointment.appointment_time}>
                                    {submittingAppointment ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('dashboard.submitting', 'Submitting...')}</> : t('dashboard.confirm_appointment', 'Confirm Appointment')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Diagnostic Modal */}
            {showAIModal && (
                <AIDiagnostic
                    token={localStorage.getItem('ACCESS_TOKEN')}
                    inModal={true}
                    onClose={() => setShowAIModal(false)}
                />
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content confirm-modal">
                        <div className="confirm-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
                        <h2>{confirmModal.title}</h2>
                        <p className="confirm-message">{confirmModal.message}</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={closeConfirm}>{t('dashboard.modal_cancel', 'Cancel')}</button>
                            <button className="save-btn" onClick={confirmModal.onConfirm}>{t('dashboard.confirm', 'Confirm')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
