/**
 * E.H. Arogya Sutra App - Main Application Logic
 * Clinical Decision Support System for Ayurveda & Homeopathy
 * Version: 1.0.0
 * Date: May 10, 2026
 */

// Global App State
const AppState = {
  currentScreen: 'splash',
  user: null,
  isAuthenticated: false,
  loading: true,
  theme: 'dark',
  language: 'hi'
};

// DOM Elements
const elements = {
  loadingScreen: document.getElementById('loading-screen'),
  appContainer: document.getElementById('app'),
  navButtons: document.querySelectorAll('.nav-btn')
};

// Initialize App
function initApp() {
  console.log('🚀 Initializing E.H. Arogya Sutra App...');

  // Check for saved user session
  checkAuthStatus();

  // Setup event listeners
  setupEventListeners();

  // Start loading animation
  startLoadingSequence();

  // Initialize theme
  initTheme();

  // Setup PWA features
  initPWA();

  console.log('✅ App initialized successfully');
}

// Loading Sequence
function startLoadingSequence() {
  // Simulate loading time (1 second for demo)
  setTimeout(() => {
    hideLoadingScreen();
    showApp();
  }, 1000);
}

function hideLoadingScreen() {
  elements.loadingScreen.style.opacity = '0';
  setTimeout(() => {
    elements.loadingScreen.style.display = 'none';
  }, 500);
}

function showApp() {
  elements.appContainer.style.display = 'flex';
  AppState.loading = false;

  // Show appropriate screen based on auth status
  if (AppState.isAuthenticated) {
    navigateToScreen('dashboard');
  } else {
    navigateToScreen('welcome');
  }

  // For demo purposes, always show welcome screen first
  navigateToScreen('welcome');
}

// Authentication Check
function checkAuthStatus() {
  const token = localStorage.getItem('eh_token');
  const user = localStorage.getItem('eh_user');

  if (token && user) {
    try {
      AppState.user = JSON.parse(user);
      AppState.isAuthenticated = true;
      // TODO: Validate token with server
    } catch (error) {
      console.error('Invalid user data in localStorage');
      logout();
    }
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Nav: handled in navigation.js (single source)

  const welcomeButton = document.querySelector('.welcome-action');
  if (welcomeButton) {
    welcomeButton.addEventListener('click', () => {
      navigateToScreen('login');
    });
  }

  // Login: handled in auth.js (form submit → API.auth.login)

  // OTP input handling
  setupOTPInputs();

  // Search functionality
  setupSearch();

  // File upload for reports
  setupFileUpload();

  // Payment handling
  setupPayment();

  // Admin functions
  setupAdmin();

  // Keyboard shortcuts
  setupKeyboardShortcuts();

  // Network status monitoring
  setupNetworkMonitoring();
}

// Screen Navigation
function navigateToScreen(screenName) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Show target screen
  const targetScreen = document.getElementById(`screen-${screenName}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
    AppState.currentScreen = screenName;

    // Update navigation buttons
    updateNavButtons(screenName);

    // Update URL hash for deep linking
    window.location.hash = screenName;

    // Analytics tracking
    trackScreenView(screenName);

    console.log(`📱 Navigated to screen: ${screenName}`);
  } else {
    console.error(`Screen not found: ${screenName}`);
  }
}

function updateNavButtons(activeScreen) {
  elements.navButtons.forEach(btn => {
    const screenId = btn.dataset.screen;
    if (screenId === `screen-${activeScreen}`) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Authentication Functions
async function handleLogin(e) {
  e.preventDefault();

  const mobile = document.querySelector('input[name="mobile"]').value;
  const password = document.querySelector('input[name="password"]').value;

  if (!mobile || !password) {
    showNotification('Please enter mobile number and password', 'error');
    return;
  }

  try {
    showLoading('Logging in...');

    const response = await API.auth.login({ mobile, password });

    if (response.success) {
      AppState.user = response.user;
      AppState.isAuthenticated = true;

      // Save to localStorage
      localStorage.setItem('eh_token', response.token);
      localStorage.setItem('eh_user', JSON.stringify(response.user));

      showNotification('Login successful!', 'success');
      navigateToScreen('dashboard');
    } else {
      showNotification(response.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Network error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

function logout() {
  // Clear state
  AppState.user = null;
  AppState.isAuthenticated = false;

  // Clear localStorage
  localStorage.removeItem('eh_token');
  localStorage.removeItem('eh_user');

  // Navigate to login
  navigateToScreen('login');

  showNotification('Logged out successfully', 'info');
}

// OTP Input Handling
function setupOTPInputs() {
  const otpBoxes = document.querySelectorAll('.otp-box');
  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      // Auto-focus next box
      if (e.target.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }

      // Mark as active
      e.target.classList.add('active');
    });

    box.addEventListener('keydown', (e) => {
      // Handle backspace
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
    });
  });
}

// Search Functionality
function setupSearch() {
  const searchInput = document.querySelector('.srch-input-text');
  const searchTags = document.querySelector('.srch-tags');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  // Tag management
  setupTagManagement();
}

function handleSearch(query) {
  if (!query || query.length < 2) return;

  // TODO: Implement search API call
  console.log('Searching for:', query);
  // Show loading
  // Call API
  // Update results
}

function setupTagManagement() {
  // Add tag functionality
  const addTagBtn = document.querySelector('.srch-add-tag');
  if (addTagBtn) {
    addTagBtn.addEventListener('click', () => {
      const tagText = prompt('Enter symptom:');
      if (tagText) {
        addSearchTag(tagText);
      }
    });
  }

  // Remove tag functionality
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('srch-tag-x')) {
      e.target.parentElement.remove();
    }
  });
}

function addSearchTag(tagText) {
  const tagsContainer = document.querySelector('.srch-tags');
  const tagElement = document.createElement('div');
  tagElement.className = 'srch-tag';
  tagElement.innerHTML = `${tagText} <span class="srch-tag-x">×</span>`;
  tagsContainer.appendChild(tagElement);
}

// File Upload for Reports
function setupFileUpload() {
  const uploadArea = document.querySelector('.rpt-upload');
  if (uploadArea) {
    uploadArea.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = handleFileUpload;
      input.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--c-gold)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload({ target: { files } });
      }
    });
  }
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type and size
  if (!validateFile(file)) {
    showNotification('Invalid file type or size', 'error');
    return;
  }

  // Show upload progress
  showUploadProgress(file);

  // TODO: Upload to server
  console.log('Uploading file:', file.name);
}

// Payment Setup
function setupPayment() {
  const payButtons = document.querySelectorAll('.pay-plan');
  payButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plan = e.currentTarget.dataset.plan;
      initiatePayment(plan);
    });
  });
}

async function initiatePayment(plan) {
  try {
    showLoading('Processing payment...');

    const response = await API.createPayment({ plan });

    if (response.success) {
      // Redirect to payment gateway or show QR
      if (response.qrCode) {
        showPaymentQR(response.qrCode);
      } else if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } else {
      showNotification('Payment initialization failed', 'error');
    }
  } catch (error) {
    console.error('Payment error:', error);
    showNotification('Payment failed. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// Admin Functions
function setupAdmin() {
  // Admin-specific functionality
  if (AppState.user?.role === 'admin') {
    // Enable admin features
    console.log('Admin mode activated');
  }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('.srch-input-text');
      if (searchInput) searchInput.focus();
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      closeAllModals();
    }

    // Alt + number: Navigate screens
    if (e.altKey && e.key >= '1' && e.key <= '8') {
      const screenIndex = parseInt(e.key) - 1;
      const screens = ['splash', 'login', 'dashboard', 'search', 'report', 'rx', 'admin', 'payment'];
      navigateToScreen(screens[screenIndex]);
    }
  });
}

// Network Monitoring
function setupNetworkMonitoring() {
  window.addEventListener('online', () => {
    showNotification('Back online', 'success');
    syncOfflineData();
  });

  window.addEventListener('offline', () => {
    showNotification('You are offline. Some features may not work.', 'warning');
  });
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('eh_theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  AppState.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('eh_theme', theme);
}

// PWA Features
function initPWA() {
  // Register service worker only when served over HTTP/S
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }

  // Install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });
}

// Utility Functions
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add to DOM
  document.body.appendChild(notification);

  // Show animation
  setTimeout(() => notification.classList.add('show'), 100);

  // Auto hide
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showLoading(message = 'Loading...') {
  // TODO: Implement loading overlay
  console.log('Loading:', message);
}

function hideLoading() {
  // TODO: Hide loading overlay
  console.log('Loading complete');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

function showUploadProgress(file) {
  // TODO: Implement upload progress UI
  console.log('Upload progress for:', file.name);
}

function showPaymentQR(qrData) {
  // TODO: Show QR code modal
  console.log('Payment QR:', qrData);
}

function closeAllModals() {
  // TODO: Close all open modals
  console.log('Closing all modals');
}

function syncOfflineData() {
  // TODO: Sync offline data when back online
  console.log('Syncing offline data');
}

function trackScreenView(screenName) {
  // TODO: Analytics tracking
  console.log('Screen view:', screenName);
}

// URL Hash Navigation
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1);
  if (hash) {
    navigateToScreen(hash);
  }
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export for debugging
window.EHApp = {
  state: AppState,
  navigate: navigateToScreen,
  login: handleLogin,
  logout: logout
};