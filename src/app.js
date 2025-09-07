/**
 * Astronomy Explorer - Complete Application
 * @fileoverview Single file application to avoid CORS issues with ES6 modules
 */

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - Whether to execute immediately
 * @returns {Function} The debounced function
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function to limit the rate of function execution
 * @param {Function} func - The function to throttle
 * @param {number} limit - The number of milliseconds to limit
 * @returns {Function} The throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format date to YYYY-MM-DD format
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - The date string to validate
 * @returns {boolean} Whether the date is valid
 */
function isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Parse coordinates from string format "lat,lng"
 * @param {string} coordString - The coordinate string
 * @returns {Object|null} Object with lat and lng properties or null if invalid
 */
function parseCoordinates(coordString) {
    if (!coordString || typeof coordString !== 'string') return null;

    const parts = coordString.split(',');
    if (parts.length !== 2) return null;

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    return { lat, lng };
}

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            textArea.remove();
            return success;
        }
    } catch (error) {
        console.error('Failed to copy text:', error);
        return false;
    }
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Desired filename
 */
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Check if device supports sharing
 * @returns {boolean} Whether native sharing is supported
 */
function canShare() {
    return navigator.share && typeof navigator.share === 'function';
}

/**
 * Share content using native sharing or fallback
 * @param {Object} shareData - Data to share
 * @returns {Promise<boolean>} Success status
 */
async function shareContent(shareData) {
    try {
        if (canShare()) {
            await navigator.share(shareData);
            return true;
        } else {
            // Fallback: copy to clipboard
            const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            return await copyToClipboard(shareText);
        }
    } catch (error) {
        console.error('Failed to share:', error);
        return false;
    }
}

/**
 * Scroll to element smoothly
 * @param {Element|string} target - Element or selector to scroll to
 * @param {Object} options - Scroll options
 */
function scrollToElement(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
}

// =============================================================================
// UI MANAGEMENT CLASSES
// =============================================================================

/**
 * Toast notification system
 */
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        const id = generateId();

        toast.id = id;
        toast.className = `toast toast-${type}`;

        const icon = this.getIcon(type);
        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${icon}
            </svg>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            this.remove(id);
        }, duration);

        return id;
    }

    /**
     * Remove a toast notification
     * @param {string} id - Toast ID to remove
     */
    remove(id) {
        const toast = document.getElementById(id);
        if (!toast) return;

        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Get icon SVG for toast type
     * @param {string} type - Toast type
     * @returns {string} SVG path
     */
    getIcon(type) {
        const icons = {
            success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>',
            error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
            info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
        };
        return icons[type] || icons.info;
    }
}

/**
 * Theme management
 */
class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        // Set initial theme
        const theme = this.getStoredTheme() || this.getSystemTheme();
        this.setTheme(theme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    }
}

/**
 * Loading state management
 */
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }

    /**
     * Show loading state
     * @param {string} id - Unique loader ID
     * @param {Element} element - Element to show loading on
     */
    show(id, element) {
        this.activeLoaders.add(id);
        if (element) {
            element.classList.add('loading');
            element.disabled = true;
        }
    }

    /**
     * Hide loading state
     * @param {string} id - Loader ID to hide
     * @param {Element} element - Element to hide loading from
     */
    hide(id, element) {
        this.activeLoaders.delete(id);
        if (element) {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }

    /**
     * Check if any loaders are active
     * @returns {boolean} Whether any loaders are active
     */
    isLoading() {
        return this.activeLoaders.size > 0;
    }
}

/**
 * Modal management
 */
class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });
    }

    /**
     * Open a modal
     * @param {string} modalId - Modal element ID
     */
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.activeModals.add(modalId);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focus trap
        this.trapFocus(modal);
    }

    /**
     * Close a modal
     * @param {string} modalId - Modal element ID
     */
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.activeModals.delete(modalId);
        modal.classList.remove('show');

        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }
    }

    /**
     * Close all modals
     */
    closeAll() {
        this.activeModals.forEach(modalId => {
            this.close(modalId);
        });
    }

    /**
     * Trap focus within modal
     * @param {Element} modal - Modal element
     */
    trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        modal.addEventListener('keydown', handleTabKey);
        firstElement.focus();
    }
}

/**
 * Animation utilities
 */
class AnimationManager {
    /**
     * Animate element entrance
     * @param {Element} element - Element to animate
     * @param {string} animation - Animation type
     */
    static animateIn(element, animation = 'fadeInUp') {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';

        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    /**
     * Animate element exit
     * @param {Element} element - Element to animate
     * @param {Function} callback - Callback after animation
     */
    static animateOut(element, callback) {
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    /**
     * Pulse animation
     * @param {Element} element - Element to pulse
     */
    static pulse(element) {
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'transform 0.15s ease';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }

    /**
     * Shake animation for errors
     * @param {Element} element - Element to shake
     */
    static shake(element) {
        element.style.animation = 'shake 0.5s ease-in-out';

        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
}

/**
 * Progress bar management
 */
class ProgressManager {
    constructor(element) {
        this.element = element;
        this.currentProgress = 0;
    }

    /**
     * Set progress value
     * @param {number} value - Progress value (0-100)
     */
    setProgress(value) {
        this.currentProgress = Math.max(0, Math.min(100, value));
        if (this.element) {
            this.element.style.width = `${this.currentProgress}%`;
        }
    }

    /**
     * Animate progress to value
     * @param {number} targetValue - Target progress value
     * @param {number} duration - Animation duration in ms
     */
    animateToProgress(targetValue, duration = 300) {
        const startValue = this.currentProgress;
        const difference = targetValue - startValue;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (difference * easeOutCubic);

            this.setProgress(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Reset progress to 0
     */
    reset() {
        this.setProgress(0);
    }
}

// =============================================================================
// API MANAGEMENT
// =============================================================================

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, status, statusText, details) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.statusText = statusText;
        this.details = details;
    }

    /**
     * Get user-friendly error message
     * @returns {string} User-friendly error message
     */
    getUserMessage() {
        switch (this.status) {
            case 401:
                return 'Credenciais da API inválidas. Verifique sua Application ID e Secret.';
            case 403:
                return 'Acesso negado. Verifique suas permissões da API.';
            case 429:
                return 'Limite de requisições excedido. Tente novamente em alguns minutos.';
            case 422:
                return 'Dados inválidos enviados para a API. Verifique os parâmetros.';
            case 500:
            case 502:
            case 503:
            case 504:
                return 'Erro no servidor da API. Tente novamente mais tarde.';
            case 0:
                return 'Erro de conexão. Verifique sua internet e tente novamente.';
            default:
                return this.message || 'Erro desconhecido na API.';
        }
    }

    /**
     * Get detailed error information
     * @returns {Object} Detailed error info
     */
    getDetails() {
        return {
            message: this.message,
            status: this.status,
            statusText: this.statusText,
            details: this.details,
            userMessage: this.getUserMessage()
        };
    }
}

/**
 * Astronomy API client
 */
class AstronomyAPI {
    constructor() {
        this.baseUrl = 'https://api.astronomyapi.com/api/v2';
        this.apiKey = '';
        this.apiSecret = '';
    }

    /**
     * Set API credentials
     * @param {string} apiKey - Application ID
     * @param {string} apiSecret - Application Secret
     */
    setCredentials(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    /**
     * Check if credentials are set
     * @returns {boolean} Whether credentials are available
     */
    hasCredentials() {
        return !!(this.apiKey && this.apiSecret);
    }

    /**
     * Create authorization header
     * @returns {string} Base64 encoded authorization header
     */
    getAuthHeader() {
        if (!this.hasCredentials()) {
            throw new Error('API credentials not set');
        }
        return btoa(`${this.apiKey}:${this.apiSecret}`);
    }

    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${this.getAuthHeader()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const requestOptions = { ...defaultOptions, ...options };

        // Merge headers
        if (options.headers) {
            requestOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new APIError(
                    `API Error: ${response.status} - ${response.statusText}`,
                    response.status,
                    response.statusText,
                    errorData
                );
            }

            return await response.json();
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }

            // Network or other errors
            throw new APIError(
                'Network error or API unavailable',
                0,
                'Network Error',
                { originalError: error.message }
            );
        }
    }

    /**
     * Generate star chart
     * @param {Object} params - Star chart parameters
     * @returns {Promise<Object>} Star chart response
     */
    async generateStarChart(params) {
        const {
            constellation,
            style = 'default',
            latitude,
            longitude,
            date
        } = params;

        // Validate required parameters
        if (!constellation) {
            throw new Error('Constellation is required');
        }
        if (latitude === undefined || longitude === undefined) {
            throw new Error('Latitude and longitude are required');
        }
        if (!date) {
            throw new Error('Date is required');
        }

        const requestData = {
            style: style,
            observer: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                date: date
            },
            view: {
                type: "constellation",
                parameters: {
                    constellation: constellation
                }
            }
        };

        console.log('API Request:', JSON.stringify(requestData, null, 2));

        const response = await this.request('/studio/star-chart', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        console.log('API Response:', response);

        if (!response.data || !response.data.imageUrl) {
            throw new Error('Invalid API response: missing image URL');
        }

        return response;
    }
}

// =============================================================================
// MAIN APPLICATION
// =============================================================================

/**
 * Main application class
 */
class AstronomyExplorer {
    constructor() {
        // Initialize API and managers
        this.astronomyAPI = new AstronomyAPI();
        this.toast = new ToastManager();
        this.theme = new ThemeManager();
        this.loading = new LoadingManager();
        this.modal = new ModalManager();

        // Initialize application
        this.init();
        this.setupEventListeners();
        this.setDefaultDate();
        this.loadApiCredentials();
        this.createInteractiveStars();
    }

    /**
     * Initialize DOM elements and progress manager
     */
    init() {
        // Screen elements
        this.homeScreen = document.getElementById('homeScreen');
        this.constellationScreen = document.getElementById('constellationScreen');

        // Form elements
        this.form = document.getElementById('constellationForm');
        this.searchBtn = document.getElementById('searchBtn');

        // Section elements
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        this.constellationInfo = document.getElementById('constellationInfo');

        // Result elements
        this.constellationImage = document.getElementById('constellationImage');

        // Progress manager
        this.progressManager = new ProgressManager(document.getElementById('progressBar'));

        // Current request data
        this.currentRequest = null;
    }

    /**
     * Set default date to today
     */
    setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = formatDate(new Date());
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Home screen navigation
        const constellationOption = document.getElementById('constellationChartsOption');
        if (constellationOption) {
            constellationOption.addEventListener('click', () => {
                window.location.href = 'constellation.html';
            });
        }

        // Moon phases navigation
        const moonOption = document.querySelector('.option-card:nth-child(2)');
        if (moonOption && !moonOption.classList.contains('coming-soon')) {
            moonOption.addEventListener('click', () => {
                window.location.href = 'moon.html';
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.theme.toggleTheme();
                this.toast.show(`Tema alterado para ${newTheme === 'light' ? 'claro' : 'escuro'}`, 'info', 2000);
            });
        }

    }

    /**
     * Create interactive stars in background
     */
    createInteractiveStars() {
        const starsContainer = document.querySelector('.stars-container');
        if (!starsContainer) return;

        const numberOfStars = 100;

        for (let i = 0; i < numberOfStars; i++) {
            const star = document.createElement('div');
            star.className = 'interactive-star';
            star.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: white;
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: twinkle ${Math.random() * 3 + 2}s infinite;
                animation-delay: ${Math.random() * 2}s;
                opacity: ${Math.random() * 0.8 + 0.2};
            `;

            starsContainer.appendChild(star);
        }
    }

}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AstronomyExplorer();
});