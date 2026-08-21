import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom'; // Added Link
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardNavbar from '../components/DashboardNavbar';
import './RepairVisualizer.css';

// --- 1. VEHICLE TYPE TO MAIN IMAGE MAPPING ---
const VEHICLE_IMAGES = {
  car: '/car-views/car.png',
  sedan: '/car-views/car.png',
  suv: '/car-views/car.png',
  truck: '/truck-views/truck.png',
  bus: '/bus-views/bus.png',
  moto: '/moto-views/moto.png',
  motorcycle: '/moto-views/moto.png',
};

// --- 2. STATUS COLORS & STYLES ---
const STATUS_CONFIG = {
  'Pending': { color: 'rgba(255, 165, 0, 0.7)', borderColor: '#FFA500', lightColor: '#FFA500' },
  'In Progress': { color: 'rgba(0, 123, 255, 0.7)', borderColor: '#007BFF', lightColor: '#007BFF' },
  'Completed': { color: 'rgba(40, 167, 69, 0.7)', borderColor: '#28A745', lightColor: '#28A745' },
  'Cancelled': { color: 'rgba(220, 53, 69, 0.7)', borderColor: '#DC3545', lightColor: '#DC3545' }
};

// --- 3. ZONE MAPPING BY VEHICLE TYPE & SERVICE ZONE ---
const ZONE_MAP = {
  car: {
    LIGHTS: [{ top: '22%', left: '8%', width: '8%', height: '6%', borderRadius: '50%' }, { top: '22%', left: '84%', width: '8%', height: '6%', borderRadius: '50%' }],
    WHEELS: [{ top: '62%', left: '10%', width: '10%', height: '14%', borderRadius: '50%' }, { top: '62%', left: '80%', width: '10%', height: '14%', borderRadius: '50%' }],
    ENGINE: { top: '15%', left: '30%', width: '40%', height: '20%', borderRadius: '10%' },
    BODY: { top: '30%', left: '15%', width: '70%', height: '35%', borderRadius: '5px' },
    EXHAUST: { top: '75%', left: '82%', width: '6%', height: '6%', borderRadius: '50%' }
  },
  truck: {
    LIGHTS: [{ top: '20%', left: '5%', width: '7%', height: '6%', borderRadius: '50%' }, { top: '20%', left: '88%', width: '7%', height: '6%', borderRadius: '50%' }],
    WHEELS: [{ top: '58%', left: '5%', width: '9%', height: '15%', borderRadius: '50%' }, { top: '58%', left: '28%', width: '9%', height: '15%', borderRadius: '50%' }, { top: '58%', left: '54%', width: '9%', height: '15%', borderRadius: '50%' }, { top: '58%', left: '77%', width: '9%', height: '15%', borderRadius: '50%' }],
    ENGINE: { top: '18%', left: '10%', width: '25%', height: '25%', borderRadius: '8%' },
    BODY: { top: '35%', left: '8%', width: '85%', height: '30%', borderRadius: '5px' },
    CARGO: { top: '35%', left: '45%', width: '50%', height: '30%', borderRadius: '5px' }
  },
  bus: {
    LIGHTS: [{ top: '18%', left: '5%', width: '6%', height: '5%', borderRadius: '50%' }, { top: '18%', left: '89%', width: '6%', height: '5%', borderRadius: '50%' }],
    WHEELS: [{ top: '65%', left: '8%', width: '7%', height: '12%', borderRadius: '50%' }, { top: '65%', left: '35%', width: '7%', height: '12%', borderRadius: '50%' }, { top: '65%', left: '62%', width: '7%', height: '12%', borderRadius: '50%' }, { top: '65%', left: '78%', width: '7%', height: '12%', borderRadius: '50%' }],
    ENGINE: { top: '15%', left: '8%', width: '20%', height: '20%', borderRadius: '8%' },
    BODY: { top: '25%', left: '5%', width: '90%', height: '50%', borderRadius: '5px' }
  },
  moto: {
    LIGHTS: { top: '20%', left: '40%', width: '10%', height: '8%', borderRadius: '50%' },
    WHEELS: [{ top: '55%', left: '15%', width: '10%', height: '14%', borderRadius: '50%' }, { top: '55%', left: '75%', width: '10%', height: '14%', borderRadius: '50%' }],
    ENGINE: { top: '42%', left: '30%', width: '40%', height: '20%', borderRadius: '10%' },
    BODY: { top: '25%', left: '20%', width: '60%', height: '50%', borderRadius: '5px' }
  }
};

const RepairVisualizer = ({ repairJob }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { repairId } = useParams();

  const [user] = useState({ name: localStorage.getItem('USER_NAME') || 'Receptionist', role: 'Receptionist' });
  const [repairs, setRepairs] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);

  useEffect(() => {
    fetchRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairId]);

  const fetchRepairs = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const res = await axios.get('http://127.0.0.1:8000/api/receptionist/dashboard', {
        headers: { Authorization: `Bearer ${token} ` }
      });
      console.log("FIRST REPAIR DATA:", JSON.stringify(res.data.repairs[0], null, 2));
      console.log("FULL API DATA:", res.data);

      const allRepairs = res.data.repairs || [];

      if (repairId) {
        const targetRepair = allRepairs.find(r => r.id.toString() === repairId.toString());
        if (targetRepair) {
          setRepairs([targetRepair]);
          setSelectedRepair(targetRepair);
        } else {
          // If specific repair not found, show all repairs instead of blank state
          console.warn(`Repair ID ${repairId} not found. Showing all repairs.`);
          setRepairs(allRepairs);
          setSelectedRepair(allRepairs.length > 0 ? allRepairs[0] : null);
        }
      } else {
        setRepairs(allRepairs);
        if (allRepairs.length > 0) setSelectedRepair(allRepairs[0]);
      }
    } catch (err) {
      console.error("Error loading repairs", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // --- Get vehicle type from repair data ---
  const getVehicleType = (repair) => {
    if (!repair || !repair.vehicle) return 'car';
    const vehicleType = repair.vehicle.type?.toLowerCase() || 'car';
    // Normalize vehicle types
    if (vehicleType.includes('bus')) return 'bus';
    if (vehicleType.includes('truck')) return 'truck';
    if (vehicleType.includes('moto') || vehicleType.includes('bike')) return 'moto';
    return 'car'; // default
  };

  // --- Get service zone ---
  const getServiceZone = (repair) => {
    if (!repair || !repair.service || !repair.service.zone) return 'BODY';
    return repair.service.zone.toUpperCase();
  };

  // --- Get image path based on vehicle type ---
  const getVehicleImage = (repair) => {
    const vehicleType = getVehicleType(repair);
    return VEHICLE_IMAGES[vehicleType] || VEHICLE_IMAGES.car;
  };

  // --- Get status color configuration ---
  const getStatusConfig = (repair) => {
    const statusKey = repair.status?.trim() || 'Pending';
    let config = STATUS_CONFIG['Pending'];
    
    if (statusKey.toLowerCase().includes('progress')) config = STATUS_CONFIG['In Progress'];
    else if (statusKey.toLowerCase() === 'completed') config = STATUS_CONFIG['Completed'];
    else if (statusKey.toLowerCase() === 'cancelled') config = STATUS_CONFIG['Cancelled'];
    
    return config;
  };

  // --- Render the highlighted zone with lightning button ---
  const renderZone = () => {
    if (!selectedRepair) return null;
    
    const vehicleType = getVehicleType(selectedRepair);
    const serviceZone = getServiceZone(selectedRepair);
    const statusConfig = getStatusConfig(selectedRepair);
    
    if (!ZONE_MAP[vehicleType] || !ZONE_MAP[vehicleType][serviceZone]) {
      console.warn(`No zone mapping for vehicle type: ${vehicleType}, zone: ${serviceZone}`);
      return null;
    }
    
    const coords = ZONE_MAP[vehicleType][serviceZone];
    if (!coords) return null;

    const styleBase = {
      position: 'absolute',
      backgroundColor: statusConfig.color,
      border: `3px solid ${statusConfig.borderColor}`,
      boxShadow: `0 0 20px ${statusConfig.lightColor}, inset 0 0 15px ${statusConfig.lightColor}`,
      zIndex: 10,
      cursor: 'pointer',
      animation: 'pulse 1.5s infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    const zonesToRender = Array.isArray(coords) ? coords : [coords];

    return zonesToRender.map((pos, index) => (
      <div
        key={index}
        className="visual-overlay-box"
        style={{
          ...styleBase,
          top: pos.top,
          left: pos.left,
          width: pos.width,
          height: pos.height,
          borderRadius: pos.borderRadius || '5px'
        }}
        title={`${serviceZone}: ${selectedRepair.status}`}
      >
        <i className="fa-solid fa-bolt" style={{ fontSize: '0.6rem', color: statusConfig.lightColor }}></i>
      </div>
    ));
  };

  return (
    <div className="visualizer-page">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="visualizer-content">

        {/* --- LEFT SIDEBAR --- */}
        <div className="repair-sidebar">
          <div className="repair-sidebar-header">
            <h3>{repairId ? t('receptionist.visualizer.tracking_repair', 'Tracking Repair') : t('receptionist.visualizer.active_workshop_jobs', 'Active Workshop Jobs')}</h3>
          </div>

          <div className="repair-list">
            {repairs.map(repair => (
              <div
                key={repair.id}
                className={`repair-item ${selectedRepair?.id === repair.id ? 'active' : ''}`}
                onClick={() => setSelectedRepair(repair)}
              >
                <div className="repair-header">
                  <span className="vehicle-title">{repair.vehicle?.make} {repair.vehicle?.model}</span>
                  <span className={`badge ${repair.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {repair.status}
                  </span>
                </div>

                <div className="repair-desc">
                  {repair.service?.name}
                </div>
                <span className="repair-sub-desc">
                  {repair.description ? (repair.description.length > 50 ? repair.description.substring(0, 50) + '...' : repair.description) : t('receptionist.visualizer.no_notes_provided', 'No notes provided')}
                </span>
              </div>
            ))}
            {repairs.length === 0 && <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>{t('receptionist.visualizer.no_active_repairs', 'No active repairs found.')}</div>}
          </div>

          {repairId && selectedRepair && (
            <Link
              to={`/receptionist/client/${selectedRepair.vehicle?.client_id}/${selectedRepair.vehicle?.owner_name}`}
              className="back-link-container"
            >
              <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i>
              {t('receptionist.visualizer.back_to_client', 'Back to Client')}
            </Link>
          )}
        </div >

        {/* --- RIGHT STAGE --- */}
        < div className="visualizer-stage" >
          {
            selectedRepair ? (
              <div className="car-card-wrapper" >

                <div className="stage-header">
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedRepair.vehicle?.plate_number}</h2>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {selectedRepair.vehicle?.make} {selectedRepair.vehicle?.model} - {selectedRepair.service?.name}
                    </span>
                  </div>
                </div>

                <div className="car-container">
                  <img
                    src={getVehicleImage(selectedRepair)}
                    alt={`${selectedRepair.vehicle?.type} View`}
                    className="vehicle-image"
                  />
                  {renderZone()}
                </div>

                <div className="legend">
                  <div className="legend-item"><span className="dot pending" style={{ background: '#FFA500' }}></span> {t('common.status.pending', 'Pending')}</div>
                  <div className="legend-item"><span className="dot progress" style={{ background: '#007BFF' }}></span> {t('common.status.in_progress', 'In Progress')}</div>
                  <div className="legend-item"><span className="dot completed" style={{ background: '#28A745' }}></span> {t('common.status.completed', 'Completed')}</div>
                  <div className="legend-item"><span className="dot cancelled" style={{ background: '#DC3545' }}></span> {t('common.status.cancelled', 'Cancelled')}</div>
                </div>

              </div>
            ) : (
              <div className="empty-state">{t('receptionist.visualizer.select_repair_prompt', 'Select a repair to visualize details.')}</div>
            )}
        </div >
      </div >
    </div >
  );
};

export default RepairVisualizer;