/**
 * Main application controller for the Astronomy Explorer
 * @fileoverview Orchestrates the entire application functionality
 */

import { astronomyAPI, APIError } from './api.js';
import { ToastManager, ThemeManager, LoadingManager, ModalManager, ProgressManager, AnimationManager } from './ui.js';
import { formatDate, parseCoordinates, isValidDate, downloadFile, shareContent, scrollToElement } from './utils.js';

/**
 * Main application class
 */
class AstronomyExplorer {
    constructor() {
        // Initialize managers
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
        this.fullscreenModal = document.getElementById('fullscreenModal');

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

        // Featured constellation cards
        document.querySelectorAll('.featured-card').forEach(card => {
            card.addEventListener('click', () => {
                const constellation = card.dataset.constellation;
                this.selectFeaturedConstellation(constellation);
            });

            // Add keyboard support
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const constellation = card.dataset.constellation;
                    this.selectFeaturedConstellation(constellation);
                }
            });
        });

        // Action buttons
        this.setupActionButtons();

        // Config buttons
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => this.saveApiCredentials());
        }

        // Fullscreen modal
        this.setupFullscreenModal();

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
            shareBtn.addEventListener('click', () => this.shareConstellation());
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.openFullscreen());
        }
    }

    /**
     * Setup fullscreen modal functionality
     */
    setupFullscreenModal() {
        const fullscreenClose = document.getElementById('fullscreenClose');

        if (fullscreenClose) {
            fullscreenClose.addEventListener('click', () => this.closeFullscreen());
        }

        if (this.fullscreenModal) {
            // Close on backdrop click
            this.fullscreenModal.addEventListener('click', (e) => {
                if (e.target === this.fullscreenModal || e.target.classList.contains('modal-backdrop')) {
                    this.closeFullscreen();
                }
            });
        }
    }

    /**
     * Load API credentials from localStorage
     */
    loadApiCredentials() {
        const savedKey = localStorage.getItem('astronomy_api_key');
        const savedSecret = localStorage.getItem('astronomy_api_secret');

        if (savedKey && savedSecret) {
            astronomyAPI.setCredentials(savedKey, savedSecret);

            const apiKeyInput = document.getElementById('apiKey');
            const apiSecretInput = document.getElementById('apiSecret');

            if (apiKeyInput) apiKeyInput.value = savedKey;
            if (apiSecretInput) apiSecretInput.value = savedSecret;

            this.toast.show('Credenciais da API carregadas!', 'success', 3000);
        }
    }

    /**
     * Save API credentials to localStorage
     */
    saveApiCredentials() {
        const apiKeyInput = document.getElementById('apiKey');
        const apiSecretInput = document.getElementById('apiSecret');

        if (!apiKeyInput || !apiSecretInput) return;

        const apiKey = apiKeyInput.value.trim();
        const apiSecret = apiSecretInput.value.trim();

        if (!apiKey || !apiSecret) {
            this.toast.show('Por favor, preencha ambos os campos da API.', 'error');
            AnimationManager.shake(apiKeyInput.parentElement);
            return;
        }

        // Set credentials in API client
        astronomyAPI.setCredentials(apiKey, apiSecret);

        // Save to localStorage
        localStorage.setItem('astronomy_api_key', apiKey);
        localStorage.setItem('astronomy_api_secret', apiSecret);

        this.toast.show('Credenciais da API salvas com sucesso!', 'success');
        AnimationManager.pulse(document.querySelector('.config-btn'));
    }

    /**
     * Select a featured constellation
     * @param {string} constellation - Constellation code
     */
    selectFeaturedConstellation(constellation) {
        const constellationSelect = document.getElementById('constellation');
        const styleSelect = document.getElementById('style');

        if (constellationSelect) constellationSelect.value = constellation;
        if (styleSelect) styleSelect.value = 'default';

        // Scroll to form with smooth animation
        scrollToElement('.search-section');

        // Highlight the form briefly
        const searchCard = document.querySelector('.search-card');
        if (searchCard) {
            AnimationManager.pulse(searchCard);
            this.toast.show(`Constelação ${this.getConstellationName(constellation)} selecionada!`, 'info', 2000);
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

        // Check API credentials
        if (!astronomyAPI.hasCredentials()) {
            this.showError(
                'Credenciais da API não configuradas',
                'Por favor, configure suas credenciais da Astronomy API na seção de configuração abaixo.'
            );
            scrollToElement('.config-section');
            return;
        }

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

        try {
            await this.generateStarChart(formData);
        } catch (error) {
            console.error('Error generating star chart:', error);

            if (error instanceof APIError) {
                this.showError(error.getUserMessage(), this.formatErrorDetails(error));
            } else {
                this.showError('Erro inesperado', error.message);
            }
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

        // Set loading state
        this.loading.show('starChart', this.searchBtn);
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
            const response = await astronomyAPI.generateStarChart({
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

        } finally {
            this.loading.hide('starChart', this.searchBtn);
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
                <svg class="results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
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
                <p><strong>URL da Imagem:</strong> <a href="${imageUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-500); word-break: break-all;">${imageUrl}</a></p>
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
        scrollToElement('.search-section');
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

        const fullscreenImage = document.getElementById('fullscreenImage');
        if (fullscreenImage) {
            fullscreenImage.src = this.constellationImage.src;
            fullscreenImage.alt = this.constellationImage.alt;
        }

        this.modal.open('fullscreenModal');
    }

    /**
     * Close fullscreen modal
     */
    closeFullscreen() {
        this.modal.close('fullscreenModal');
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
            'sco': 'Scorpius é uma constelação zodiacal que realmente se parece com um escorpião, com Antares como seu "coração" vermelho.',
            'and': 'Andrômeda é famosa por conter a Galáxia de Andrômeda, a galáxia espiral mais próxima da Via Láctea.',
            'per': 'Perseu é uma constelação que contém várias estrelas brilhantes e é o radiante da chuva de meteoros Perseidas.',
            'gem': 'Gêmeos representa os gêmeos Castor e Pólux, com duas estrelas brilhantes com os mesmos nomes.',
            'tau': 'Touro é uma constelação zodiacal que contém as Plêiades e as Híades, dois dos aglomerados estelares mais famosos.',
            'vir': 'Virgem é a segunda maior constelação do céu e contém Spica, uma das estrelas mais brilhantes.',
            'sgr': 'Sagitário aponta para o centro da Via Láctea e contém muitos aglomerados estelares e nebulosas.',
            'aqr': 'Aquário é conhecido como o "Portador de Água" e contém várias nebulosas planetárias interessantes.',
            'psc': 'Peixes representa dois peixes conectados por uma corda, sendo uma constelação zodiacal.',
            'ari': 'Áries representa um carneiro e é historicamente importante como o primeiro signo do zodíaco.',
            'cnc': 'Câncer contém o aglomerado estelar M44, conhecido como Colmeia ou Presépio.',
            'lib': 'Libra representa uma balança e é a única constelação zodiacal que representa um objeto inanimado.',
            'cap': 'Capricórnio representa uma cabra marinha e é uma das constelações mais antigas conhecidas.',
            'aql': 'Aquila, a Águia, contém Altair, uma das estrelas do famoso Triângulo de Verão.',
            'lyr': 'Lyra é uma pequena constelação que contém Vega, uma das estrelas mais brilhantes do céu noturno.',
            'dra': 'Draco é uma grande constelação que serpenteia ao redor do polo norte celestial.',
            'umi': 'A Ursa Menor contém a Estrela Polar (Polaris), que marca o polo norte celestial.',
            'cep': 'Cefeu é uma constelação circumpolar que representa um rei da mitologia grega.',
            'her': 'Hércules é uma grande constelação que representa o herói da mitologia grega.',
            'boo': 'Boötes, o Pastor, contém Arcturus, uma das estrelas mais brilhantes do céu.',
            'cru': 'Crux, o Cruzeiro do Sul, é a menor das 88 constelações modernas, mas muito importante para navegação.',
            'cen': 'Centaurus representa um centauro e contém Alpha Centauri, o sistema estelar mais próximo do Sol.',
            'car': 'Carina fazia parte da antiga constelação Argo Navis e contém Canopus, a segunda estrela mais brilhante.',
            'vel': 'Vela também fazia parte de Argo Navis e representa as velas do navio dos Argonautas.',
            'pup': 'Puppis representa a popa do navio Argo e contém várias estrelas brilhantes e nebulosas.'
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AstronomyExplorer();
});