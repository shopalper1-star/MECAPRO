// ============================================
// Central API Configuration
// All API calls must use this base URL.
// Change this ONE value to switch environments.
// ============================================
const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || 'https://mecapro.orkestr.run/api';

export default API_BASE_URL;
