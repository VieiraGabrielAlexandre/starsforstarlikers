/**
 * API management for the Astronomy Explorer application
 * @fileoverview Handles all API interactions with the Astronomy API
 */

/**
 * Astronomy API client
 */
export class AstronomyAPI {
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

    /**
     * Get moon phase
     * @param {Object} params - Moon phase parameters
     * @returns {Promise<Object>} Moon phase response
     */
    async getMoonPhase(params) {
        const {
            latitude,
            longitude,
            date
        } = params;

        const requestData = {
            format: "png",
            style: {
                moonStyle: "default",
                backgroundStyle: "stars",
                backgroundColor: "red",
                headingColor: "white",
                textColor: "white"
            },
            observer: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                date: date
            },
            view: {
                type: "portrait-simple"
            }
        };

        return await this.request('/studio/moon-phase', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    /**
     * Get star positions
     * @param {Object} params - Star position parameters
     * @returns {Promise<Object>} Star positions response
     */
    async getStarPositions(params) {
        const {
            latitude,
            longitude,
            date,
            elevation = 0
        } = params;

        const queryParams = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            elevation: elevation.toString(),
            from_date: date,
            to_date: date,
            time: '00:00:00'
        });

        return await this.request(`/bodies/positions/sun?${queryParams}`);
    }
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
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
 * API response cache
 */
export class APICache {
    constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
        this.cache = new Map();
        this.maxAge = maxAge;
    }

    /**
     * Generate cache key
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    generateKey(endpoint, params) {
        return `${endpoint}:${JSON.stringify(params)}`;
    }

    /**
     * Get cached response
     * @param {string} key - Cache key
     * @returns {Object|null} Cached response or null
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cached response
     * @param {string} key - Cache key
     * @param {Object} data - Response data
     */
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.maxAge) {
                this.cache.delete(key);
            }
        }
    }
}

// Create global API instance
export const astronomyAPI = new AstronomyAPI();
export const apiCache = new APICache();