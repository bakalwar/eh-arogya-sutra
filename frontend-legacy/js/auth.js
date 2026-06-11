/**
 * Authentication Module for E.H. Arogya Sutra App
 * Handles login, OTP verification, and session management
 */

// Auth State
const AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  otpSent: false,
  otpVerified: false,
  loginAttempts: 0,
  lastLoginAttempt: null,
  sessionExpiry: null
};

// Auth Configuration
const AUTH_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
  sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  otpExpiry: 10 * 60 * 1000, // 10 minutes
  tokenRefreshThreshold: 60 * 60 * 1000 // 1 hour before expiry
};

// Initialize Authentication
function initAuth() {
  console.log('🔐 Initializing Authentication Module...');

  // Load saved auth state
  loadAuthState();

  // Setup auth event listeners
  setupAuthEventListeners();

  // Setup session monitoring
  setupSessionMonitoring();

  // Check token expiry
  checkTokenExpiry();

  console.log('✅ Authentication module initialized');
}

// Load Authentication State
function loadAuthState() {
  try {
    const token = localStorage.getItem('eh_token');
    const user = localStorage.getItem('eh_user');
    const expiry = localStorage.getItem('eh_session_expiry');

    if (token && user && expiry) {
      const userData = JSON.parse(user);
      const expiryTime = parseInt(expiry);

      if (Date.now() < expiryTime) {
        AuthState.isAuthenticated = true;
        AuthState.user = userData;
        AuthState.token = token;
        AuthState.sessionExpiry = expiryTime;

        // Update global state
        AppState.isAuthenticated = true;
        AppState.user = userData;

        console.log('✅ User session restored');
      } else {
        // Session expired
        clearAuthState();
        console.log('⏰ Session expired');
      }
    }
  } catch (error) {
    console.error('Failed to load auth state:', error);
    clearAuthState();
  }
}

// Setup Event Listeners
function setupAuthEventListeners() {
  // Login form
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // OTP boxes
  setupOTPInputHandling();

  // Logout buttons
  const logoutButtons = document.querySelectorAll('.logout-btn, .nav-logout');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', handleLogout);
  });

  // Password visibility toggle
  const passwordToggles = document.querySelectorAll('.password-toggle');
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', togglePasswordVisibility);
  });
}

// Handle Login Form Submission
async function handleLoginSubmit(event) {
  event.preventDefault();

  // Check login attempt limits
  if (!canAttemptLogin()) {
    const remainingTime = getLockoutRemainingTime();
    showNotification(`Too many failed attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`, 'error');
    return;
  }

  const formData = new FormData(event.target);
  const loginData = {
    mobile: formData.get('mobile')?.trim(),
    password: formData.get('password')
  };

  // Validate input
  if (!validateLoginData(loginData)) {
    return;
  }

  try {
    showLoading('Logging in...');

    // Update attempt count
    AuthState.loginAttempts++;
    AuthState.lastLoginAttempt = Date.now();
    saveAuthState();

    const response = await API.auth.login(loginData);

    if (response.success) {
      // Login successful
      await handleLoginSuccess(response);
    } else {
      // Login failed
      handleLoginFailure(response);
    }

  } catch (error) {
    console.error('Login error:', error);
    handleLoginFailure({ message: 'Network error. Please try again.' });
  } finally {
    hideLoading();
  }
}

// Validate Login Data
function validateLoginData(data) {
  if (!data.mobile || !data.password) {
    showNotification('Please enter both mobile number and password', 'error');
    return false;
  }

  // Validate mobile number (Indian format)
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(data.mobile)) {
    showNotification('Please enter a valid 10-digit mobile number', 'error');
    return false;
  }

  // Validate password length
  if (data.password.length < 6) {
    showNotification('Password must be at least 6 characters long', 'error');
    return false;
  }

  return true;
}

// Handle Login Success
async function handleLoginSuccess(response) {
  try {
    // Update auth state
    AuthState.isAuthenticated = true;
    AuthState.user = response.user;
    AuthState.token = response.token;
    AuthState.sessionExpiry = Date.now() + AUTH_CONFIG.sessionDuration;
    AuthState.loginAttempts = 0; // Reset attempts

    // Save to localStorage
    localStorage.setItem('eh_token', response.token);
    localStorage.setItem('eh_user', JSON.stringify(response.user));
    localStorage.setItem('eh_session_expiry', AuthState.sessionExpiry.toString());

    // Update global state
    AppState.isAuthenticated = true;
    AppState.user = response.user;

    // Show success message
    showNotification(`Welcome back, Dr. ${response.user.name}!`, 'success');

    // Navigate to dashboard
    setTimeout(() => {
      navigateToScreen('dashboard');
    }, 1000);

    console.log('✅ Login successful for user:', response.user.name);

  } catch (error) {
    console.error('Error handling login success:', error);
    showNotification('Login failed. Please try again.', 'error');
  }
}

// Handle Login Failure
function handleLoginFailure(response) {
  const message = response.message || 'Login failed. Please check your credentials.';

  showNotification(message, 'error');

  // Log failed attempt
  console.warn('Login failed:', message);

  // Clear password field
  const passwordField = document.querySelector('input[name="password"]');
  if (passwordField) {
    passwordField.value = '';
    passwordField.focus();
  }
}

// Setup OTP Input Handling
function setupOTPInputHandling() {
  const otpBoxes = document.querySelectorAll('.otp-box');

  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      const value = e.target.value;

      // Only allow numbers
      if (!/^\d*$/.test(value)) {
        e.target.value = value.replace(/\D/g, '');
        return;
      }

      // Auto-focus next box
      if (value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }

      // Mark as filled
      e.target.classList.toggle('active', !!value);
    });

    box.addEventListener('keydown', (e) => {
      // Handle backspace
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpBoxes[index - 1].focus();
        otpBoxes[index - 1].value = '';
        otpBoxes[index - 1].classList.remove('active');
      }

      // Handle arrow keys
      if (e.key === 'ArrowLeft' && index > 0) {
        otpBoxes[index - 1].focus();
      }
      if (e.key === 'ArrowRight' && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const digits = paste.replace(/\D/g, '').split('');

      digits.forEach((digit, i) => {
        if (otpBoxes[index + i]) {
          otpBoxes[index + i].value = digit;
          otpBoxes[index + i].classList.add('active');
        }
      });

      // Focus last filled box or next empty box
      const nextIndex = Math.min(index + digits.length, otpBoxes.length - 1);
      otpBoxes[nextIndex].focus();
    });
  });
}

// Get OTP Value
function getOTPValue() {
  const otpBoxes = document.querySelectorAll('.otp-box');
  let otp = '';

  otpBoxes.forEach(box => {
    otp += box.value || '';
  });

  return otp;
}

// Verify OTP
async function verifyOTP() {
  const otp = getOTPValue();

  if (otp.length !== 6) {
    showNotification('Please enter complete 6-digit OTP', 'error');
    return;
  }

  try {
    showLoading('Verifying OTP...');

    const response = await API.auth.verifyOTP({
      mobile: AuthState.pendingMobile,
      otp: otp
    });

    if (response.success) {
      AuthState.otpVerified = true;
      showNotification('OTP verified successfully!', 'success');

      // Complete login process
      await handleLoginSuccess(response);
    } else {
      showNotification('Invalid OTP. Please try again.', 'error');
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    showNotification('OTP verification failed. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// Handle Logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    logout();
  }
}

// Logout Function
function logout() {
  // Clear auth state
  clearAuthState();

  // Clear global state
  AppState.isAuthenticated = false;
  AppState.user = null;

  // Show message
  showNotification('Logged out successfully', 'info');

  // Navigate to login
  navigateToScreen('login');

  console.log('👋 User logged out');
}

// Clear Authentication State
function clearAuthState() {
  AuthState.isAuthenticated = false;
  AuthState.user = null;
  AuthState.token = null;
  AuthState.otpSent = false;
  AuthState.otpVerified = false;
  AuthState.sessionExpiry = null;

  // Clear localStorage
  localStorage.removeItem('eh_token');
  localStorage.removeItem('eh_user');
  localStorage.removeItem('eh_session_expiry');
}

// Check Token Expiry
function checkTokenExpiry() {
  if (!AuthState.sessionExpiry) return;

  const timeUntilExpiry = AuthState.sessionExpiry - Date.now();
  const shouldRefresh = timeUntilExpiry < AUTH_CONFIG.tokenRefreshThreshold;

  if (shouldRefresh && timeUntilExpiry > 0) {
    // Auto-refresh token
    refreshToken();
  } else if (timeUntilExpiry <= 0) {
    // Token expired
    handleTokenExpiry();
  }
}

// Refresh Token
async function refreshToken() {
  try {
    const response = await API.auth.refreshToken();

    if (response.success) {
      AuthState.token = response.token;
      AuthState.sessionExpiry = Date.now() + AUTH_CONFIG.sessionDuration;

      localStorage.setItem('eh_token', response.token);
      localStorage.setItem('eh_session_expiry', AuthState.sessionExpiry.toString());

      console.log('🔄 Token refreshed successfully');
    } else {
      handleTokenExpiry();
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    handleTokenExpiry();
  }
}

// Handle Token Expiry
function handleTokenExpiry() {
  console.warn('Session expired');
  showNotification('Your session has expired. Please login again.', 'warning');
  logout();
}

// Setup Session Monitoring
function setupSessionMonitoring() {
  // Check token expiry every minute
  setInterval(checkTokenExpiry, 60 * 1000);

  // Handle visibility change (tab switching)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkTokenExpiry();
    }
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    // Could save any pending state here
  });
}

// Login Attempt Management
function canAttemptLogin() {
  if (AuthState.loginAttempts >= AUTH_CONFIG.maxLoginAttempts) {
    const timeSinceLastAttempt = Date.now() - (AuthState.lastLoginAttempt || 0);
    return timeSinceLastAttempt > AUTH_CONFIG.lockoutDuration;
  }
  return true;
}

function getLockoutRemainingTime() {
  const timeSinceLastAttempt = Date.now() - (AuthState.lastLoginAttempt || 0);
  return Math.max(0, AUTH_CONFIG.lockoutDuration - timeSinceLastAttempt);
}

// Save Auth State
function saveAuthState() {
  try {
    localStorage.setItem('eh_auth_state', JSON.stringify({
      loginAttempts: AuthState.loginAttempts,
      lastLoginAttempt: AuthState.lastLoginAttempt
    }));
  } catch (error) {
    console.error('Failed to save auth state:', error);
  }
}

// Load Auth State
function loadAuthState() {
  try {
    const saved = localStorage.getItem('eh_auth_state');
    if (saved) {
      const state = JSON.parse(saved);
      AuthState.loginAttempts = state.loginAttempts || 0;
      AuthState.lastLoginAttempt = state.lastLoginAttempt || null;
    }
  } catch (error) {
    console.error('Failed to load auth state:', error);
  }
}

// Password Visibility Toggle
function togglePasswordVisibility(event) {
  const button = event.currentTarget;
  const input = button.previousElementSibling;

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// Utility Functions
function isAuthenticated() {
  return AuthState.isAuthenticated;
}

function getCurrentUser() {
  return AuthState.user;
}

function getToken() {
  return AuthState.token;
}

// Export Auth object
const Auth = {
  // State
  isAuthenticated,
  getCurrentUser,
  getToken,

  // Actions
  login: handleLoginSubmit,
  verifyOTP,
  logout,
  refreshToken,

  // Utilities
  canAttemptLogin,
  getLockoutRemainingTime,

  // Initialization
  init: initAuth
};

// Make Auth globally available
window.Auth = Auth;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAuth);

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}