/**
 * Constellation Charts - Dedicated Application
 * @fileoverview Constellation functionality separated from main app
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
        this.baseUrl = 'https://bozeiu0ny3.execute-api.sa-east-1.amazonaws.com';
        // Credenciais fixas da sua API
        this.authHeader = 'dHllZGZzZGY6dHdyZXQyMzQ=';
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

        const response = await this.request('/constellations', {
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
// CONSTELLATION APPLICATION
// =============================================================================

/**
 * Constellation Charts application
 */
class ConstellationApp {
    constructor() {
        // Initialize API and managers
        this.astronomyAPI = new AstronomyAPI();
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

        // Suggestion constellation items
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const constellation = item.dataset.constellation;
                this.selectSuggestedConstellation(constellation);
            });
        });

        // Action buttons
        this.setupActionButtons();

        // Config buttons
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
            shareBtn.addEventListener('click', () => this.shareConstellation());
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.openFullscreen());
        }
    }

    /**
     * Select a suggested constellation
     * @param {string} constellation - Constellation code
     */
    selectSuggestedConstellation(constellation) {
        const constellationSelect = document.getElementById('constellation');
        const styleSelect = document.getElementById('style');

        if (constellationSelect) constellationSelect.value = constellation;
        if (styleSelect) styleSelect.value = 'default';

        // Highlight the form briefly
        const searchCard = document.querySelector('.search-card');
        if (searchCard) {
            AnimationManager.pulse(searchCard);
            this.toast.show(`Constelação ${this.getConstellationName(constellation)} selecionada!`, 'info', 2000);
        }
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
            await this.generateStarChart(formData);
        } catch (error) {
            console.error('Error generating star chart:', error);

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
            constellation: document.getElementById('constellation')?.value,
            style: document.getElementById('style')?.value,
            location: document.getElementById('location')?.value,
            date: document.getElementById('date')?.value
        };
    }

    /**
     * Validate form data
     * @param {Object} formData - Form data to validate
     * @returns {Object} Validation result
     */
    validateFormData(formData) {
        const { constellation, style, location, date } = formData;

        if (!constellation) {
            return { valid: false, message: 'Por favor, selecione uma constelação.' };
        }

        if (!style) {
            return { valid: false, message: 'Por favor, selecione um estilo de visualização.' };
        }

        if (!location) {
            return { valid: false, message: 'Por favor, selecione uma localização.' };
        }

        if (!date) {
            return { valid: false, message: 'Por favor, selecione uma data.' };
        }

        if (!isValidDate(date)) {
            return { valid: false, message: 'Formato de data inválido. Use YYYY-MM-DD.' };
        }

        const coordinates = parseCoordinates(location);
        if (!coordinates) {
            return { valid: false, message: 'Coordenadas de localização inválidas.' };
        }

        return { valid: true };
    }

    /**
     * Generate star chart using API
     * @param {Object} formData - Form data
     */
    async generateStarChart(formData) {
        const { constellation, style, location, date } = formData;

        // Parse coordinates
        const coordinates = parseCoordinates(location);

        this.progressManager.animateToProgress(25, 500);

        try {
            // Store current request
            this.currentRequest = {
                constellation,
                style,
                location,
                date,
                coordinates
            };

            // Make API request
            const response = await this.astronomyAPI.generateStarChart({
                constellation,
                style,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                date
            });

            this.progressManager.animateToProgress(100, 300);

            // Wait a bit for progress animation
            await new Promise(resolve => setTimeout(resolve, 500));

            // Display results
            this.displayResults(response.data.imageUrl);
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

        const { constellation, style, location, date } = this.currentRequest;

        // Update results title
        const resultsTitle = document.getElementById('resultsTitle');
        if (resultsTitle) {
            const constellationName = this.getConstellationName(constellation);
            resultsTitle.innerHTML = `
                <svg class="results-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                ${constellationName}
            `;
        }

        // Update image
        if (this.constellationImage) {
            this.constellationImage.src = imageUrl;
            this.constellationImage.alt = `Mapa estelar da constelação ${this.getConstellationName(constellation)}`;
        }

        // Update overlay
        const overlayTitle = document.getElementById('overlayTitle');
        const overlayDescription = document.getElementById('overlayDescription');

        if (overlayTitle) {
            overlayTitle.textContent = this.getConstellationName(constellation);
        }

        if (overlayDescription) {
            overlayDescription.textContent = `Mapa estelar gerado pela Astronomy API - Estilo: ${style}`;
        }

        // Update info cards
        this.updateInfoCards(imageUrl);

        // Show results with animation
        if (this.resultsSection) {
            this.resultsSection.classList.add('show');
            AnimationManager.animateIn(this.resultsSection);
        }

        if (this.constellationInfo) {
            this.constellationInfo.classList.add('show');
        }

        // Scroll to results
        scrollToElement(this.resultsSection);

        // Show success notification
        this.toast.show('Mapa estelar gerado com sucesso!', 'success');
    }

    /**
     * Update info cards with current request data
     * @param {string} imageUrl - Generated image URL
     */
    updateInfoCards(imageUrl) {
        const { constellation, style, location, date } = this.currentRequest;

        // Request details
        const requestDetails = document.getElementById('requestDetails');
        if (requestDetails) {
            const constellationName = this.getConstellationName(constellation);
            requestDetails.innerHTML = `
                <p><strong>Constelação:</strong> ${constellationName} (${constellation})</p>
                <p><strong>Estilo:</strong> ${this.getStyleName(style)}</p>
                <p><strong>URL da Imagem:</strong> <a href="${imageUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); word-break: break-all;">${imageUrl}</a></p>
            `;
        }

        // Constellation description
        const constellationDescription = document.getElementById('constellationDescription');
        if (constellationDescription) {
            constellationDescription.textContent = this.getConstellationDescription(constellation);
        }

        // Location info
        const locationInfo = document.getElementById('locationInfo');
        if (locationInfo) {
            const locationName = this.getLocationName(location);
            locationInfo.textContent = `${locationName} (${location})`;
        }

        // Date and time info
        const dateTimeInfo = document.getElementById('dateTimeInfo');
        if (dateTimeInfo) {
            const formattedDate = new Date(date).toLocaleDateString('pt-BR');
            const currentTime = new Date().toLocaleTimeString('pt-BR');
            dateTimeInfo.textContent = `${formattedDate} - Gerado às ${currentTime}`;
        }
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

        const errorMessage = document.getElementById('errorMessage');
        const errorDetails = document.getElementById('errorDetails');

        if (errorMessage) {
            errorMessage.textContent = message;
        }

        if (errorDetails) {
            if (details) {
                errorDetails.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
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

        if (this.constellationInfo) {
            this.constellationInfo.classList.remove('show');
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
     * Download constellation image
     */
    downloadImage() {
        if (!this.constellationImage || !this.constellationImage.src) {
            this.toast.show('Nenhuma imagem disponível para download', 'error');
            return;
        }

        const constellation = this.currentRequest?.constellation || 'constellation';
        const filename = `star-chart-${constellation}-${Date.now()}.png`;

        downloadFile(this.constellationImage.src, filename);
        this.toast.show('Download iniciado!', 'success');
    }

    /**
     * Share constellation
     */
    async shareConstellation() {
        if (!this.constellationImage || !this.currentRequest) {
            this.toast.show('Nenhum conteúdo disponível para compartilhar', 'error');
            return;
        }

        const constellationName = this.getConstellationName(this.currentRequest.constellation);
        const shareData = {
            title: `Mapa Estelar - ${constellationName}`,
            text: `Confira este mapa estelar da constelação ${constellationName}!`,
            url: this.constellationImage.src
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
        if (!this.constellationImage || !this.constellationImage.src) {
            this.toast.show('Nenhuma imagem disponível', 'error');
            return;
        }

        // Open image in new tab for fullscreen viewing
        const newWindow = window.open(this.constellationImage.src, '_blank');
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
     * Get constellation name from code
     * @param {string} code - Constellation code
     * @returns {string} Constellation name
     */
    getConstellationName(code) {
        const constellationSelect = document.getElementById('constellation');
        if (!constellationSelect) return code;

        const option = constellationSelect.querySelector(`option[value="${code}"]`);
        return option ? option.textContent : code;
    }

    /**
     * Get style name from code
     * @param {string} code - Style code
     * @returns {string} Style name
     */
    getStyleName(code) {
        const styleNames = {
            'default': 'Padrão',
            'inverted': 'Invertido',
            'navy': 'Azul Marinho',
            'red': 'Vermelho'
        };
        return styleNames[code] || code;
    }

    /**
     * Get location name from coordinates
     * @param {string} location - Location coordinates
     * @returns {string} Location name
     */
    getLocationName(location) {
        const locationSelect = document.getElementById('location');
        if (!locationSelect) return location;

        const option = locationSelect.querySelector(`option[value="${location}"]`);
        return option ? option.textContent : location;
    }

    /**
     * Get constellation description
     * @param {string} constellation - Constellation code
     * @returns {string} Constellation description
     */
    getConstellationDescription(constellation) {
        const descriptions = {
            'ori': 'Órion é uma das constelações mais reconhecíveis do céu noturno, representando um caçador mitológico com seu cinturão de três estrelas.',
            'uma': 'A Ursa Maior é uma das constelações mais conhecidas, contendo o famoso asterismo da "Grande Carroça" ou "Arado".',
            'cas': 'Cassiopeia é facilmente reconhecível por sua forma distintiva de "W" ou "M", representando a rainha vaidosa da mitologia grega.',
            'cyg': 'Cygnus, o Cisne, é uma grande constelação que se estende ao longo da Via Láctea, com Deneb marcando sua cauda.',
            'leo': 'Leo é uma constelação zodiacal facilmente reconhecível, representando um leão com Regulus como sua estrela mais brilhante.',
            'sco': 'Scorpius é uma constelação zodiacal que realmente se parece com um escorpião, com Antares como seu "coração" vermelho.'
        };

        return descriptions[constellation] || 'Uma fascinante constelação do céu noturno com sua própria história e características únicas.';
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

// Initialize the constellation application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ConstellationApp();
});