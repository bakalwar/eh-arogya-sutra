/**
 * Navigation Module for E.H. Arogya Sutra App
 * Handles screen transitions and navigation logic
 */

// Navigation State
const NavigationState = {
  currentScreen: 'splash',
  screenHistory: [],
  maxHistorySize: 10
};

// Screen definitions with metadata
const SCREENS = {
  splash: {
    title: 'Welcome to E.H. Arogya Sutra',
    requiresAuth: false,
    showInNav: false
  },
  welcome: {
    title: 'स्वागत पेज',
    requiresAuth: false,
    showInNav: false
  },
  login: {
    title: 'Doctor Login',
    requiresAuth: false,
    showInNav: false
  },
  dashboard: {
    title: 'Dashboard',
    requiresAuth: true,
    showInNav: true,
    icon: '🏠'
  },
  search: {
    title: 'Search Engine',
    requiresAuth: true,
    showInNav: true,
    icon: '🔍'
  },
  report: {
    title: 'Report Analysis',
    requiresAuth: true,
    showInNav: false,
    icon: '🧪'
  },
  rx: {
    title: 'Prescription',
    requiresAuth: true,
    showInNav: true,
    icon: '📄'
  },
  admin: {
    title: 'Admin Panel',
    requiresAuth: true,
    requiresAdmin: true,
    showInNav: false,
    icon: '👨‍💼'
  },
  payment: {
    title: 'Payment & Subscription',
    requiresAuth: true,
    showInNav: false,
    icon: '💳'
  }
};

// Initialize Navigation
function initNavigation() {
  console.log('🧭 Initializing Navigation System...');

  // Setup navigation event listeners
  setupNavEventListeners();

  // Handle browser back/forward buttons
  setupBrowserNavigation();

  // Initialize screen history
  initScreenHistory();

  console.log('✅ Navigation system initialized');
}

// Setup Navigation Event Listeners
function setupNavEventListeners() {
  // Bottom navigation buttons
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(button => {
    button.addEventListener('click', handleNavClick);
  });

  // Dashboard action buttons
  const actionButtons = document.querySelectorAll('.da');
  actionButtons.forEach(button => {
    button.addEventListener('click', handleActionClick);
  });

  // Back buttons
  const backButtons = document.querySelectorAll('.srch-back, .rpt-title');
  backButtons.forEach(button => {
    if (button.classList.contains('srch-back')) {
      button.addEventListener('click', () => navigateBack());
    }
  });

}

// Handle Navigation Button Clicks
function handleNavClick(event) {
  const button = event.currentTarget;
  const targetScreen = button.dataset.screen?.replace('screen-', '');

  if (targetScreen && canNavigateTo(targetScreen)) {
    navigateToScreen(targetScreen, { source: 'nav' });
  } else {
    showNavigationError(targetScreen);
  }
}

// Handle Dashboard Action Clicks
function handleActionClick(event) {
  const action = event.currentTarget;
  const actionType = getActionType(action);

  switch (actionType) {
    case 'search':
      navigateToScreen('search', { source: 'dashboard' });
      break;
    case 'new-case':
      navigateToScreen('rx', { source: 'dashboard', mode: 'new' });
      break;
    case 'report':
      navigateToScreen('report', { source: 'dashboard' });
      break;
    case 'library':
      // TODO: Implement library screen
      showNotification('Library feature coming soon!', 'info');
      break;
    default:
      console.warn('Unknown action type:', actionType);
  }
}

// Main Navigation Function
function navigateToScreen(screenName, options = {}) {
  if (!SCREENS[screenName]) {
    console.error(`Screen "${screenName}" does not exist`);
    return false;
  }

  if (!canNavigateTo(screenName)) {
    console.warn(`Cannot navigate to "${screenName}" - permission denied`);
    showNavigationError(screenName);
    return false;
  }

  const targetEl = document.getElementById(`screen-${screenName}`);
  if (!targetEl) {
    showNotification(
      'यह स्क्रीन अभी ऐप में जोड़ी नहीं गई। / This screen is not in the app yet.',
      'info'
    );
    return false;
  }

  const previousScreen = NavigationState.currentScreen;

  // Hide current screen
  hideScreen(previousScreen);

  // Show new screen
  showScreen(screenName);

  // Update navigation state
  updateNavigationState(screenName, previousScreen, options);

  // Update UI elements
  updateNavigationUI(screenName);

  // Execute screen-specific logic
  executeScreenLogic(screenName, options);

  // Track navigation
  trackNavigation(screenName, previousScreen, options);

  console.log(`🧭 Navigated from ${previousScreen} to ${screenName}`);

  return true;
}

// Check if navigation is allowed
function canNavigateTo(screenName) {
  const screen = SCREENS[screenName];
  if (!screen) return false;

  // Check authentication
  if (screen.requiresAuth && !AppState.isAuthenticated) {
    return false;
  }

  // Check admin permissions
  if (screen.requiresAdmin && AppState.user?.role !== 'admin') {
    return false;
  }

  return true;
}

// Show Screen
function showScreen(screenName) {
  const screenElement = document.getElementById(`screen-${screenName}`);
  if (screenElement) {
    screenElement.classList.add('active');
    screenElement.style.display = 'block';

    // Add entrance animation
    setTimeout(() => {
      screenElement.classList.add('screen-entered');
    }, 50);
  }
}

// Hide Screen
function hideScreen(screenName) {
  const screenElement = document.getElementById(`screen-${screenName}`);
  if (screenElement) {
    screenElement.classList.remove('screen-entered');
    screenElement.classList.remove('active');

    setTimeout(() => {
      screenElement.style.display = 'none';
    }, 300); // Match CSS transition duration
  }
}

// Update Navigation State
function updateNavigationState(newScreen, previousScreen, options) {
  NavigationState.currentScreen = newScreen;

  // Add to history
  NavigationState.screenHistory.push({
    screen: newScreen,
    previous: previousScreen,
    timestamp: Date.now(),
    options: options
  });

  // Limit history size
  if (NavigationState.screenHistory.length > NavigationState.maxHistorySize) {
    NavigationState.screenHistory.shift();
  }

  // Update URL hash
  updateURLHash(newScreen);
}

// Update Navigation UI
function updateNavigationUI(activeScreen) {
  // Update bottom navigation
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(button => {
    const buttonScreen = button.dataset.screen?.replace('screen-', '');
    if (buttonScreen === activeScreen) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });

  // Update page title
  updatePageTitle(activeScreen);

  // Update top banner if needed
  updateTopBanner(activeScreen);
}

// Execute Screen-Specific Logic
function executeScreenLogic(screenName, options) {
  switch (screenName) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'search':
      initializeSearch();
      break;
    case 'report':
      initializeReportUpload();
      break;
    case 'rx':
      initializePrescription(options);
      break;
    case 'admin':
      loadAdminData();
      break;
    case 'payment':
      loadPaymentPlans();
      break;
  }
}

// Navigate Back
function navigateBack() {
  if (NavigationState.screenHistory.length > 1) {
    const currentEntry = NavigationState.screenHistory.pop();
    const previousEntry = NavigationState.screenHistory[NavigationState.screenHistory.length - 1];

    navigateToScreen(previousEntry.screen, { source: 'back' });
  } else {
    // Default back behavior
    if (AppState.isAuthenticated) {
      navigateToScreen('dashboard');
    } else {
      navigateToScreen('login');
    }
  }
}

// Browser Navigation Support
function setupBrowserNavigation() {
  // Handle browser back/forward
  window.addEventListener('popstate', (event) => {
    const targetScreen = event.state?.screen || 'dashboard';
    navigateToScreen(targetScreen, { source: 'browser' });
  });

  // Handle initial hash
  const initialHash = window.location.hash.substring(1);
  if (initialHash && SCREENS[initialHash]) {
    navigateToScreen(initialHash, { source: 'url' });
  }
}

// Initialize Screen History
function initScreenHistory() {
  NavigationState.screenHistory = [{
    screen: 'splash',
    timestamp: Date.now()
  }];
}

// Update URL Hash
function updateURLHash(screenName) {
  const newHash = `#${screenName}`;
  if (window.location.hash !== newHash) {
    window.history.pushState({ screen: screenName }, '', newHash);
  }
}

// Update Page Title
function updatePageTitle(screenName) {
  const screen = SCREENS[screenName];
  const title = screen ? `${screen.title} - E.H. Arogya Sutra` : 'E.H. Arogya Sutra';
  document.title = title;
}

// Update Top Banner
function updateTopBanner(screenName) {
  // Update banner based on screen
  const bannerTitle = document.querySelector('.banner-title');
  if (bannerTitle) {
    const screen = SCREENS[screenName];
    bannerTitle.textContent = screen ? `${screen.title} · 2026` : 'Design System · 2026';
  }
}

// Helper Functions
function getActionType(actionElement) {
  const icon = actionElement.querySelector('.da-icon').textContent;
  switch (icon) {
    case '🔍': return 'search';
    case '📋': return 'new-case';
    case '🧪': return 'report';
    case '📚': return 'library';
    default: return 'unknown';
  }
}

function showNavigationError(screenName) {
  const screen = SCREENS[screenName];
  let message = `Cannot access ${screenName} screen.`;

  if (screen?.requiresAuth && !AppState.isAuthenticated) {
    message = 'Please login to access this feature.';
  } else if (screen?.requiresAdmin && AppState.user?.role !== 'admin') {
    message = 'Admin access required.';
  }

  showNotification(message, 'error');
}

// Screen Data Loading Functions
function loadDashboardData() {
  // TODO: Load dashboard stats, recent patients, etc.
  console.log('Loading dashboard data...');
}

function initializeSearch() {
  // TODO: Setup search functionality
  console.log('Initializing search...');
}

function initializeReportUpload() {
  // TODO: Setup file upload for reports
  console.log('Initializing report upload...');
}

function initializePrescription(options) {
  // TODO: Setup prescription form
  console.log('Initializing prescription...', options);
}

function loadAdminData() {
  // TODO: Load admin statistics
  console.log('Loading admin data...');
}

function loadPaymentPlans() {
  // TODO: Load payment plans
  console.log('Loading payment plans...');
}

// Tracking Function
function trackNavigation(toScreen, fromScreen, options) {
  // TODO: Send analytics data
  console.log(`Navigation: ${fromScreen} → ${toScreen}`, options);
}

// Export functions for global access
window.Navigation = {
  navigateTo: navigateToScreen,
  goBack: navigateBack,
  getCurrentScreen: () => NavigationState.currentScreen,
  getScreenHistory: () => NavigationState.screenHistory,
  canNavigateTo: canNavigateTo
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initNavigation);