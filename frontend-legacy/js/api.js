/**
 * API Module for E.H. Arogya Sutra App
 * Handles all HTTP requests to the backend server
 */

const API_BASE_URL = (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production')
  ? 'https://api.eh-arogya-sutra.com'
  : 'http://localhost:5000';

const API_ENDPOINTS = {
  // Authentication
  login: '/api/auth/login',
  verifyOTP: '/api/auth/verify-otp',
  logout: '/api/auth/logout',
  refreshToken: '/api/auth/refresh',

  // Patients
  getPatients: '/api/patients',
  createPatient: '/api/patients',
  updatePatient: '/api/patients/:id',
  deletePatient: '/api/patients/:id',

  // Medicines
  getMedicines: '/api/medicines',
  searchMedicines: '/api/medicines/search',

  // Reports
  uploadReport: '/api/reports/upload',
  getReportAnalysis: '/api/reports/:id/analysis',

  // Prescriptions
  createPrescription: '/api/prescriptions',
  getPrescriptionPDF: '/api/prescriptions/:id/pdf',

  // Admin
  getAdminStats: '/api/admin/stats',
  getUsers: '/api/admin/users',

  // Payment
  createPayment: '/api/payment/create',
  verifyPayment: '/api/payment/verify'
};

// API Configuration
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000
};

// Global API State
const APIState = {
  isOnline: navigator.onLine,
  pendingRequests: new Map(),
  requestQueue: []
};

// Initialize API
function initAPI() {
  console.log('🔗 Initializing API Module...');

  // Setup network monitoring
  setupNetworkMonitoring();

  // Setup request/response interceptors
  setupInterceptors();

  // Setup offline queue
  setupOfflineQueue();

  console.log('✅ API Module initialized');
}

// Network Monitoring
function setupNetworkMonitoring() {
  window.addEventListener('online', () => {
    APIState.isOnline = true;
    processOfflineQueue();
    showNotification('Back online', 'success');
  });

  window.addEventListener('offline', () => {
    APIState.isOnline = false;
    showNotification('You are offline. Requests will be queued.', 'warning');
  });
}

// Request/Response Interceptors
function setupInterceptors() {
  // Add auth token to requests
  // Add error handling
  // Add loading states
}

// Offline Queue Management
function setupOfflineQueue() {
  // Load pending requests from localStorage
  const savedQueue = localStorage.getItem('eh_offline_queue');
  if (savedQueue) {
    try {
      APIState.requestQueue = JSON.parse(savedQueue);
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      APIState.requestQueue = [];
    }
  }
}

function saveOfflineQueue() {
  localStorage.setItem('eh_offline_queue', JSON.stringify(APIState.requestQueue));
}

function addToOfflineQueue(request) {
  APIState.requestQueue.push({
    ...request,
    timestamp: Date.now(),
    id: generateRequestId()
  });
  saveOfflineQueue();
}

function processOfflineQueue() {
  if (!APIState.isOnline || APIState.requestQueue.length === 0) return;

  console.log(`Processing ${APIState.requestQueue.length} offline requests...`);

  APIState.requestQueue.forEach(async (request) => {
    try {
      await makeRequest(request.method, request.url, request.data, request.config);
      // Remove from queue on success
      removeFromOfflineQueue(request.id);
    } catch (error) {
      console.error('Failed to process offline request:', error);
    }
  });
}

function removeFromOfflineQueue(requestId) {
  APIState.requestQueue = APIState.requestQueue.filter(req => req.id !== requestId);
  saveOfflineQueue();
}

// Core Request Function
async function makeRequest(method, endpoint, data = null, config = {}) {
  let url = buildURL(endpoint);
  const requestConfig = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    },
    ...config
  };

  // Add auth token
  const token = localStorage.getItem('eh_token');
  if (token) {
    requestConfig.headers['Authorization'] = `Bearer ${token}`;
  }

  // Add body for non-GET requests
  if (data && method.toUpperCase() !== 'GET') {
    requestConfig.body = JSON.stringify(data);
  }

  // Add query params for GET requests
  if (data && method.toUpperCase() === 'GET') {
    const params = new URLSearchParams(data);
    url += `?${params.toString()}`;
  }

  // Show loading for long requests
  const loadingId = showLoadingForRequest(endpoint);

  try {
    const response = await fetchWithTimeout(url, requestConfig);

    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }

    const result = await response.json();

    // Handle token refresh
    if (result.newToken) {
      localStorage.setItem('eh_token', result.newToken);
    }

    return result;

  } catch (error) {
    // Handle different error types
    if (error.name === 'TypeError' && !APIState.isOnline) {
      // Network error - add to offline queue
      addToOfflineQueue({ method, url, data, config });
      throw new APIError(0, 'Request queued for when you are back online');
    }

    throw error;

  } finally {
    hideLoadingForRequest(loadingId);
  }
}

// Fetch with timeout
function fetchWithTimeout(url, options = {}) {
  const { timeout = API_CONFIG.timeout } = options;

  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Authentication API
const AuthAPI = {
  async login(credentials) {
    return await makeRequest('POST', API_ENDPOINTS.login, credentials);
  },

  async verifyOTP(otpData) {
    return await makeRequest('POST', API_ENDPOINTS.verifyOTP, otpData);
  },

  async logout() {
    const result = await makeRequest('POST', API_ENDPOINTS.logout);
    localStorage.removeItem('eh_token');
    localStorage.removeItem('eh_user');
    return result;
  },

  async refreshToken() {
    return await makeRequest('POST', API_ENDPOINTS.refreshToken);
  }
};

// Patients API
const PatientsAPI = {
  async getAll() {
    return await makeRequest('GET', API_ENDPOINTS.getPatients);
  },

  async create(patientData) {
    return await makeRequest('POST', API_ENDPOINTS.createPatient, patientData);
  },

  async update(id, patientData) {
    const endpoint = API_ENDPOINTS.updatePatient.replace(':id', id);
    return await makeRequest('PUT', endpoint, patientData);
  },

  async delete(id) {
    const endpoint = API_ENDPOINTS.deletePatient.replace(':id', id);
    return await makeRequest('DELETE', endpoint);
  }
};

// Medicines API
const MedicinesAPI = {
  async getAll() {
    return await makeRequest('GET', API_ENDPOINTS.getMedicines);
  },

  async search(query) {
    return await makeRequest('GET', API_ENDPOINTS.searchMedicines, query);
  }
};

// Reports API
const ReportsAPI = {
  async upload(formData) {
    return await makeRequest('POST', API_ENDPOINTS.uploadReport, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  async getAnalysis(reportId) {
    const endpoint = API_ENDPOINTS.getReportAnalysis.replace(':id', reportId);
    return await makeRequest('GET', endpoint);
  }
};

// Prescriptions API
const PrescriptionsAPI = {
  async create(prescriptionData) {
    return await makeRequest('POST', API_ENDPOINTS.createPrescription, prescriptionData);
  },

  async getPDF(prescriptionId) {
    const endpoint = API_ENDPOINTS.getPrescriptionPDF.replace(':id', prescriptionId);
    return await makeRequest('GET', endpoint);
  }
};

// Admin API
const AdminAPI = {
  async getStats() {
    return await makeRequest('GET', API_ENDPOINTS.getAdminStats);
  },

  async getUsers() {
    return await makeRequest('GET', API_ENDPOINTS.getUsers);
  }
};

// Payment API
const PaymentAPI = {
  async createPayment(paymentData) {
    return await makeRequest('POST', API_ENDPOINTS.createPayment, paymentData);
  },

  async verifyPayment(paymentId) {
    const endpoint = API_ENDPOINTS.verifyPayment.replace(':id', paymentId);
    return await makeRequest('POST', endpoint);
  }
};

// Utility Functions
function buildURL(endpoint) {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
}

function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showLoadingForRequest(endpoint) {
  // Show loading for certain endpoints
  const loadingEndpoints = ['login', 'upload', 'create'];
  const shouldShowLoading = loadingEndpoints.some(ep => endpoint.includes(ep));

  if (shouldShowLoading) {
    return showLoading('Processing...');
  }
  return null;
}

function hideLoadingForRequest(loadingId) {
  if (loadingId) {
    hideLoading();
  }
}

// Error Classes
class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// Export API object
const API = {
  // Core functions
  request: makeRequest,
  isOnline: () => APIState.isOnline,

  // API modules
  auth: AuthAPI,
  patients: PatientsAPI,
  medicines: MedicinesAPI,
  reports: ReportsAPI,
  prescriptions: PrescriptionsAPI,
  admin: AdminAPI,
  payment: PaymentAPI,

  // Initialization
  init: initAPI
};

// Make API globally available
window.API = API;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAPI);

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}