/**
 * Moon Phases - Dedicated Application
 * @fileoverview Moon phases functionality
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
                return 'Erro de CORS: O método OPTIONS não está configurado corretamente na API.';
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
 * Moon API client
 */
class MoonAPI {
    constructor() {
        // Usando proxy CORS temporário até configurar CORS no AWS
        this.baseUrl = 'https://cors-anywhere.herokuapp.com/https://9nj2r6j9fd.execute-api.sa-east-1.amazonaws.com';
        this.directUrl = 'https://9nj2r6j9fd.execute-api.sa-east-1.amazonaws.com';
        // Credenciais fixas da sua API
        this.authHeader = 'dHllZGZzZGY6dHdyZXQyMzQ=';
        this.useProxy = true;
    }

    /**
     * Toggle between proxy and direct API
     * @param {boolean} useProxy - Whether to use CORS proxy
     */
    setProxyMode(useProxy) {
        this.useProxy = useProxy;
        this.baseUrl = useProxy
            ? 'https://cors-anywhere.herokuapp.com/https://9nj2r6j9fd.execute-api.sa-east-1.amazonaws.com'
            : this.directUrl;
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
                'Authorization': `Basic ${this.authHeader}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        // Add proxy headers if using proxy
        if (this.useProxy) {
            defaultOptions.headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        const requestOptions = { ...defaultOptions, ...options };

        // Merge headers
        if (options.headers) {
            requestOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }

        console.log('Making request to:', url);
        console.log('Request options:', requestOptions);

        try {
            const response = await fetch(url, requestOptions);

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

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

            console.error('Network error:', error);

            // Check if it's a CORS or preflight error
            if (error.message.includes('CORS') || error.message.includes('preflight') || error.message.includes('fetch')) {
                throw new APIError(
                    'Erro de CORS: Preflight request falhou - método OPTIONS não configurado corretamente',
                    0,
                    'CORS Error',
                    {
                        originalError: error.message,
                        solution: 'O método OPTIONS precisa retornar status 200 OK com headers CORS corretos'
                    }
                );
            }

            // Other network errors
            throw new APIError(
                'Erro de rede ou API indisponível',
                0,
                'Network Error',
                { originalError: error.message }
            );
        }
    }

    /**
     * Generate moon visualization
     * @param {Object} params - Moon visualization parameters
     * @returns {Promise<Object>} Moon visualization response
     */
    async generateMoonVisualization(params) {
        const {
            format,
            latitude,
            longitude,
            date,
            moonStyle,
            backgroundStyle,
            backgroundColor,
            headingColor,
            textColor,
            orientation,
            viewType
        } = params;

        // Validate required parameters
        if (!format) {
            throw new Error('Format is required');
        }
        if (latitude === undefined || longitude === undefined) {
            throw new Error('Latitude and longitude are required');
        }
        if (!date) {
            throw new Error('Date is required');
        }

        const requestData = {
            format: format,
            observer: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                date: date
            },
            style: {
                moonStyle: moonStyle || 'default',
                backgroundStyle: backgroundStyle || 'stars',
                backgroundColor: backgroundColor || 'red',
                headingColor: headingColor || 'white',
                textColor: textColor || 'red'
            },
            view: {
                orientation: orientation || 'south-up',
                type: viewType || 'portrait-simple'
            }
        };

        console.log('API Request:', JSON.stringify(requestData, null, 2));

        const response = await this.request('/moon', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        console.log('API Response:', response);

        if (!response || !response.imageUrl) {
            throw new Error('Invalid API response: missing image URL');
        }

        return response;
    }
}

// =============================================================================
// MOON APPLICATION
// =============================================================================

/**
 * Moon Phases application
 */
class MoonApp {
    constructor() {
        // Initialize API and managers
        this.moonAPI = new MoonAPI();
        this.toast = new ToastManager();
        this.theme = new ThemeManager();

        // Initialize application
        this.init();
        this.setupEventListeners();
        this.setDefaultDate();
        this.createInteractiveStars();
    }

    /**
     * Initialize DOM elements and progress manager
     */
    init() {
        // Form elements
        this.form = document.getElementById('moonForm');
        this.searchBtn = document.getElementById('searchBtn');

        // Section elements
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        this.moonInfo = document.getElementById('moonInfo');

        // Result elements
        this.moonImage = document.getElementById('moonImage');

        // Progress manager
        this.progressManager = new ProgressManager(document.getElementById('progressBar'));

        // Current request data
        this.currentRequest = null;

        // Presets
        this.presets = {
            classic: {
                moonStyle: 'default',
                backgroundStyle: 'stars',
                backgroundColor: 'black',
                headingColor: 'white',
                textColor: 'white',
                orientation: 'south-up',
                viewType: 'portrait-simple',
                format: 'png'
            },
            modern: {
                moonStyle: 'shaded',
                backgroundStyle: 'solid',
                backgroundColor: 'navy',
                headingColor: 'white',
                textColor: 'blue',
                orientation: 'south-up',
                viewType: 'landscape-simple',
                format: 'png'
            },
            vintage: {
                moonStyle: 'sketch',
                backgroundStyle: 'solid',
                backgroundColor: 'red',
                headingColor: 'yellow',
                textColor: 'red',
                orientation: 'north-up',
                viewType: 'portrait-detailed',
                format: 'png'
            },
            minimal: {
                moonStyle: 'default',
                backgroundStyle: 'transparent',
                backgroundColor: 'white',
                headingColor: 'black',
                textColor: 'black',
                orientation: 'south-up',
                viewType: 'portrait-simple',
                format: 'svg'
            },
            artistic: {
                moonStyle: 'sketch',
                backgroundStyle: 'stars',
                backgroundColor: 'purple',
                headingColor: 'yellow',
                textColor: 'white',
                orientation: 'south-up',
                viewType: 'landscape-detailed',
                format: 'png'
            },
            scientific: {
                moonStyle: 'shaded',
                backgroundStyle: 'solid',
                backgroundColor: 'black',
                headingColor: 'white',
                textColor: 'white',
                orientation: 'north-up',
                viewType: 'portrait-detailed',
                format: 'png'
            }
        };
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
        // Back to home button
        const backToHome = document.getElementById('backToHome');
        if (backToHome) {
            backToHome.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.theme.toggleTheme();
                this.toast.show(`Tema alterado para ${newTheme === 'light' ? 'claro' : 'escuro'}`, 'info', 2000);
            });
        }

        // Preset suggestion items
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const preset = item.dataset.preset;
                this.applyPreset(preset);
            });
        });

        // Action buttons
        this.setupActionButtons();

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retrySearch());
        }
    }

    /**
     * Setup action buttons (download, share, fullscreen)
     */
    setupActionButtons() {
        const downloadBtn = document.getElementById('downloadBtn');
        const shareBtn = document.getElementById('shareBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadImage());
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareMoon());
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.openFullscreen());
        }
    }

    /**
     * Apply a preset configuration
     * @param {string} presetName - Name of the preset to apply
     */
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        // Apply preset values to form fields
        Object.keys(preset).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = preset[key];
            }
        });

        // Highlight the form briefly
        const searchCard = document.querySelector('.search-card');
        if (searchCard) {
            AnimationManager.pulse(searchCard);
            this.toast.show(`Preset "${this.getPresetDisplayName(presetName)}" aplicado!`, 'info', 2000);
        }
    }

    /**
     * Get display name for preset
     * @param {string} presetName - Preset name
     * @returns {string} Display name
     */
    getPresetDisplayName(presetName) {
        const names = {
            classic: 'Clássico',
            modern: 'Moderno',
            vintage: 'Vintage',
            minimal: 'Minimalista',
            artistic: 'Artístico',
            scientific: 'Científico'
        };
        return names[presetName] || presetName;
    }

    /**
     * Set button loading state
     * @param {boolean} loading - Whether to show loading state
     */
    setButtonLoading(loading) {
        if (!this.searchBtn) return;

        if (loading) {
            this.searchBtn.classList.add('loading');
            this.searchBtn.disabled = true;
        } else {
            this.searchBtn.classList.remove('loading');
            this.searchBtn.disabled = false;
        }
    }

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Reset all sections and states
        this.hideAllSections();
        this.progressManager.reset();

        // Get form data
        const formData = this.getFormData();

        // Validate form data
        const validation = this.validateFormData(formData);
        if (!validation.valid) {
            this.showError('Dados inválidos', validation.message);
            return;
        }

        // Show loading and start generation
        this.showLoading();
        this.setButtonLoading(true);

        try {
            await this.generateMoonVisualization(formData);
        } catch (error) {
            console.error('Error generating moon visualization:', error);

            if (error instanceof APIError) {
                this.showError(error.getUserMessage(), this.formatErrorDetails(error));
            } else {
                this.showError('Erro inesperado', error.message);
            }
        } finally {
            this.setButtonLoading(false);
        }
    }

    /**
     * Get form data
     * @returns {Object} Form data object
     */
    getFormData() {
        return {
            latitude: document.getElementById('latitude')?.value,
            longitude: document.getElementById('longitude')?.value,
            date: document.getElementById('date')?.value,
            moonStyle: document.getElementById('moonStyle')?.value,
            backgroundStyle: document.getElementById('backgroundStyle')?.value,
            backgroundColor: document.getElementById('backgroundColor')?.value,
            headingColor: document.getElementById('headingColor')?.value,
            textColor: document.getElementById('textColor')?.value,
            orientation: document.getElementById('orientation')?.value,
            viewType: document.getElementById('viewType')?.value,
            format: document.getElementById('format')?.value
        };
    }

    /**
     * Validate form data
     * @param {Object} formData - Form data to validate
     * @returns {Object} Validation result
     */
    validateFormData(formData) {
        const { latitude, longitude, date, format } = formData;

        if (!latitude || isNaN(parseFloat(latitude))) {
            return { valid: false, message: 'Por favor, insira uma latitude válida.' };
        }

        if (!longitude || isNaN(parseFloat(longitude))) {
            return { valid: false, message: 'Por favor, insira uma longitude válida.' };
        }

        if (!date) {
            return { valid: false, message: 'Por favor, selecione uma data.' };
        }

        if (!isValidDate(date)) {
            return { valid: false, message: 'Formato de data inválido. Use YYYY-MM-DD.' };
        }

        if (!format) {
            return { valid: false, message: 'Por favor, selecione um formato.' };
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (lat < -90 || lat > 90) {
            return { valid: false, message: 'Latitude deve estar entre -90 e 90 graus.' };
        }

        if (lng < -180 || lng > 180) {
            return { valid: false, message: 'Longitude deve estar entre -180 e 180 graus.' };
        }

        return { valid: true };
    }

    /**
     * Generate moon visualization using API
     * @param {Object} formData - Form data
     */
    async generateMoonVisualization(formData) {
        this.progressManager.animateToProgress(25, 500);

        try {
            // Store current request
            this.currentRequest = formData;

            // Make API request
            const response = await this.moonAPI.generateMoonVisualization(formData);

            this.progressManager.animateToProgress(100, 300);

            // Wait a bit for progress animation
            await new Promise(resolve => setTimeout(resolve, 500));

            // Display results
            this.displayResults(response.imageUrl);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Display results
     * @param {string} imageUrl - Generated image URL
     */
    displayResults(imageUrl) {
        this.hideAllSections();

        const { date, moonStyle, backgroundStyle } = this.currentRequest;

        // Update results title
        const resultsTitle = document.getElementById('resultsTitle');
        if (resultsTitle) {
            resultsTitle.innerHTML = `
                <svg class="results-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Fases da Lua - ${new Date(date).toLocaleDateString('pt-BR')}
            `;
        }

        // Update image
        if (this.moonImage) {
            this.moonImage.src = imageUrl;
            this.moonImage.alt = `Visualização das fases da lua para ${date}`;
        }

        // Update overlay
        const overlayTitle = document.getElementById('overlayTitle');
        const overlayDescription = document.getElementById('overlayDescription');

        if (overlayTitle) {
            overlayTitle.textContent = `Lua - ${new Date(date).toLocaleDateString('pt-BR')}`;
        }

        if (overlayDescription) {
            overlayDescription.textContent = `Estilo: ${moonStyle} | Fundo: ${backgroundStyle}`;
        }

        // Update info cards
        this.updateInfoCards(imageUrl);

        // Show results with animation
        if (this.resultsSection) {
            this.resultsSection.classList.add('show');
            AnimationManager.animateIn(this.resultsSection);
        }

        if (this.moonInfo) {
            this.moonInfo.classList.add('show');
        }

        // Scroll to results
        scrollToElement(this.resultsSection);

        // Show success notification
        this.toast.show('Visualização da lua gerada com sucesso!', 'success');
    }

    /**
     * Update info cards with current request data
     * @param {string} imageUrl - Generated image URL
     */
    updateInfoCards(imageUrl) {
        const formData = this.currentRequest;

        // Request details
        const requestDetails = document.getElementById('requestDetails');
        if (requestDetails) {
            requestDetails.innerHTML = `
                <p><strong>Formato:</strong> ${formData.format.toUpperCase()}</p>
                <p><strong>Estilo da Lua:</strong> ${this.getStyleDisplayName(formData.moonStyle)}</p>
                <p><strong>Fundo:</strong> ${this.getBackgroundDisplayName(formData.backgroundStyle)}</p>
                <p><strong>Orientação:</strong> ${this.getOrientationDisplayName(formData.orientation)}</p>
                <p><strong>URL da Imagem:</strong> <a href="${imageUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); word-break: break-all;">${imageUrl}</a></p>
            `;
        }

        // Moon description
        const moonDescription = document.getElementById('moonDescription');
        if (moonDescription) {
            moonDescription.textContent = 'A Lua é o único satélite natural da Terra e o quinto maior satélite do Sistema Solar. Suas fases são causadas pela mudança de posição relativa entre a Terra, a Lua e o Sol.';
        }

        // Location info
        const locationInfo = document.getElementById('locationInfo');
        if (locationInfo) {
            locationInfo.textContent = `Latitude: ${formData.latitude}°, Longitude: ${formData.longitude}°`;
        }

        // Date and time info
        const dateTimeInfo = document.getElementById('dateTimeInfo');
        if (dateTimeInfo) {
            const formattedDate = new Date(formData.date).toLocaleDateString('pt-BR');
            const currentTime = new Date().toLocaleTimeString('pt-BR');
            dateTimeInfo.textContent = `${formattedDate} - Gerado às ${currentTime}`;
        }
    }

    /**
     * Get display name for style
     * @param {string} style - Style code
     * @returns {string} Display name
     */
    getStyleDisplayName(style) {
        const names = {
            'default': 'Padrão',
            'sketch': 'Esboço',
            'shaded': 'Sombreado'
        };
        return names[style] || style;
    }

    /**
     * Get display name for background
     * @param {string} background - Background code
     * @returns {string} Display name
     */
    getBackgroundDisplayName(background) {
        const names = {
            'stars': 'Estrelas',
            'solid': 'Sólido',
            'transparent': 'Transparente'
        };
        return names[background] || background;
    }

    /**
     * Get display name for orientation
     * @param {string} orientation - Orientation code
     * @returns {string} Display name
     */
    getOrientationDisplayName(orientation) {
        const names = {
            'south-up': 'Sul para Cima',
            'north-up': 'Norte para Cima'
        };
        return names[orientation] || orientation;
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllSections();
        if (this.loadingSection) {
            this.loadingSection.classList.add('show');
            AnimationManager.animateIn(this.loadingSection);
        }
    }

    /**
     * Show error state
     * @param {string} title - Error title
     * @param {string} message - Error message
     * @param {string} details - Error details
     */
    showError(title, message, details = '') {
        this.hideAllSections();

        const errorTitle = document.querySelector('.error-title');
        const errorMessage = document.getElementById('errorMessage');
        const errorDetails = document.getElementById('errorDetails');

        if (errorTitle) {
            errorTitle.textContent = title;
        }

        if (errorMessage) {
            errorMessage.textContent = message;
        }

        if (errorDetails) {
            if (details) {
                let detailsText = typeof details === 'string' ? details : JSON.stringify(details, null, 2);

                // Add CORS solution if it's a CORS error
                if (title.includes('CORS') || message.includes('CORS')) {
                    detailsText += '\n\n🔧 SOLUÇÃO PARA AWS API GATEWAY:\n';
                    detailsText += '1. Acesse o AWS API Gateway Console\n';
                    detailsText += '2. Selecione sua API\n';
                    detailsText += '3. Selecione o recurso /moon\n';
                    detailsText += '4. Clique em "Actions" > "Enable CORS"\n';
                    detailsText += '5. Configure:\n';
                    detailsText += '   - Access-Control-Allow-Origin: *\n';
                    detailsText += '   - Access-Control-Allow-Headers: Content-Type,Authorization\n';
                    detailsText += '   - Access-Control-Allow-Methods: POST,OPTIONS\n';
                    detailsText += '6. Clique "Enable CORS and replace existing CORS headers"\n';
                    detailsText += '7. Deploy a API novamente (Actions > Deploy API)\n';
                    detailsText += '\n⚠️ IMPORTANTE: O método OPTIONS deve retornar status 200!\n';
                    detailsText += '\n🔄 ALTERNATIVA TEMPORÁRIA:\n';
                    detailsText += 'Usando proxy CORS para contornar o problema temporariamente.';
                }

                errorDetails.textContent = detailsText;
                errorDetails.style.display = 'block';
            } else {
                errorDetails.style.display = 'none';
            }
        }

        if (this.errorSection) {
            this.errorSection.classList.add('show');
            AnimationManager.animateIn(this.errorSection);
        }

        // Show error toast
        this.toast.show(title, 'error');
    }

    /**
     * Hide all sections
     */
    hideAllSections() {
        const sections = [this.loadingSection, this.resultsSection, this.errorSection];

        sections.forEach(section => {
            if (section) {
                section.classList.remove('show');
            }
        });

        if (this.moonInfo) {
            this.moonInfo.classList.remove('show');
        }
    }

    /**
     * Retry search
     */
    retrySearch() {
        this.hideAllSections();
        this.progressManager.reset();
        this.setButtonLoading(false);
        const searchPanel = document.querySelector('.search-panel');
        if (searchPanel) {
            scrollToElement(searchPanel);
        }
        this.toast.show('Pronto para nova busca!', 'info', 2000);
    }

    /**
     * Download moon image
     */
    downloadImage() {
        if (!this.moonImage || !this.moonImage.src) {
            this.toast.show('Nenhuma imagem disponível para download', 'error');
            return;
        }

        const date = this.currentRequest?.date || 'moon';
        const filename = `moon-phases-${date}-${Date.now()}.${this.currentRequest?.format || 'png'}`;

        downloadFile(this.moonImage.src, filename);
        this.toast.show('Download iniciado!', 'success');
    }

    /**
     * Share moon visualization
     */
    async shareMoon() {
        if (!this.moonImage || !this.currentRequest) {
            this.toast.show('Nenhum conteúdo disponível para compartilhar', 'error');
            return;
        }

        const date = new Date(this.currentRequest.date).toLocaleDateString('pt-BR');
        const shareData = {
            title: `Fases da Lua - ${date}`,
            text: `Confira esta visualização das fases da lua para ${date}!`,
            url: this.moonImage.src
        };

        const success = await shareContent(shareData);

        if (success) {
            this.toast.show('Conteúdo compartilhado!', 'success');
        } else {
            this.toast.show('Erro ao compartilhar conteúdo', 'error');
        }
    }

    /**
     * Open fullscreen modal
     */
    openFullscreen() {
        if (!this.moonImage || !this.moonImage.src) {
            this.toast.show('Nenhuma imagem disponível', 'error');
            return;
        }

        // Open image in new tab for fullscreen viewing
        const newWindow = window.open(this.moonImage.src, '_blank');
        if (newWindow) {
            this.toast.show('Imagem aberta em nova aba!', 'success');
        } else {
            this.toast.show('Erro ao abrir imagem em tela cheia', 'error');
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

    /**
     * Format error details for display
     * @param {APIError} error - API error object
     * @returns {string} Formatted error details
     */
    formatErrorDetails(error) {
        const details = error.getDetails();

        let formatted = `Status: ${details.status} - ${details.statusText}\n`;

        if (details.details && details.details.errors) {
            formatted += '\nDetalhes da validação:\n';
            details.details.errors.forEach(err => {
                formatted += `- ${err.property}: ${err.message}\n`;
            });
        } else if (details.details) {
            formatted += `\nDetalhes: ${JSON.stringify(details.details, null, 2)}`;
        }

        return formatted;
    }
}

// Initialize the moon application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MoonApp();
});