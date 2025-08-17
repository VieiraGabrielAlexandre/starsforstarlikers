/**
 * UI management functions for the Astronomy Explorer application
 * @fileoverview Handles UI interactions, animations, and visual feedback
 */

import { generateId, sleep } from './utils.js';

/**
 * Toast notification system
 */
export class ToastManager {
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
export class ThemeManager {
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
export class LoadingManager {
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
export class ModalManager {
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
export class AnimationManager {
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
export class ProgressManager {
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

/**
 * Form validation utilities
 */
export class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = new Map();
    }

    /**
     * Validate a field
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @param {Array} rules - Validation rules
     */
    validateField(fieldName, value, rules) {
        this.errors.delete(fieldName);

        for (const rule of rules) {
            const result = rule.validate(value);
            if (!result.valid) {
                this.errors.set(fieldName, result.message);
                break;
            }
        }

        this.updateFieldUI(fieldName);
        return !this.errors.has(fieldName);
    }

    /**
     * Update field UI based on validation
     * @param {string} fieldName - Field name
     */
    updateFieldUI(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        const errorElement = this.form.querySelector(`[data-error="${fieldName}"]`);

        if (this.errors.has(fieldName)) {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = this.errors.get(fieldName);
                errorElement.style.display = 'block';
            }
        } else {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }

    /**
     * Validate entire form
     * @returns {boolean} Whether form is valid
     */
    validateForm() {
        return this.errors.size === 0;
    }

    /**
     * Get all validation errors
     * @returns {Object} Errors object
     */
    getErrors() {
        return Object.fromEntries(this.errors);
    }
}

// Validation rules
export const ValidationRules = {
    required: (message = 'Este campo é obrigatório') => ({
        validate: (value) => ({
            valid: value !== null && value !== undefined && value.toString().trim() !== '',
            message
        })
    }),

    email: (message = 'Email inválido') => ({
        validate: (value) => ({
            valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message
        })
    }),

    minLength: (min, message = `Mínimo de ${min} caracteres`) => ({
        validate: (value) => ({
            valid: value && value.length >= min,
            message
        })
    }),

    date: (message = 'Data inválida') => ({
        validate: (value) => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(value)) return { valid: false, message };

            const date = new Date(value);
            return {
                valid: date instanceof Date && !isNaN(date),
                message
            };
        }
    })
};