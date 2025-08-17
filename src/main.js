class AstronomyExplorer {
    constructor() {
        this.apiKey = '';
        this.apiSecret = '';
        this.baseUrl = 'https://api.astronomyapi.com/api/v2';
        this.currentDate = new Date().toISOString().split('T')[0];

        this.init();
        this.setupEventListeners();
        this.setDefaultDate();
        this.loadApiCredentials();
        this.createInteractiveStars();
    }

    init() {
        this.form = document.getElementById('constellationForm');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        this.constellationImage = document.getElementById('constellationImage');
        this.constellationInfo = document.getElementById('constellationInfo');
        this.searchBtn = document.getElementById('searchBtn');
        this.progressBar = document.getElementById('progressBar');
        this.fullscreenModal = document.getElementById('fullscreenModal');
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date');
        dateInput.value = this.currentDate;
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Featured constellation cards
        document.querySelectorAll('.featured-card').forEach(card => {
            card.addEventListener('click', () => {
                const constellation = card.dataset.constellation;
                this.selectFeaturedConstellation(constellation);
            });
        });

        // Action buttons
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadImage());
        document.getElementById('shareBtn')?.addEventListener('click', () => this.shareConstellation());
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.openFullscreen());
        document.getElementById('retryBtn')?.addEventListener('click', () => this.retrySearch());

        // Config buttons
        document.getElementById('saveConfigBtn')?.addEventListener('click', () => this.saveApiCredentials());

        // Fullscreen modal
        document.getElementById('fullscreenClose')?.addEventListener('click', () => this.closeFullscreen());
        this.fullscreenModal?.addEventListener('click', (e) => {
            if (e.target === this.fullscreenModal) {
                this.closeFullscreen();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.fullscreenModal.classList.contains('show')) {
                this.closeFullscreen();
            }
        });
    }

    loadApiCredentials() {
        const savedKey = localStorage.getItem('astronomy_api_key');
        const savedSecret = localStorage.getItem('astronomy_api_secret');

        if (savedKey && savedSecret) {
            this.apiKey = savedKey;
            this.apiSecret = savedSecret;
            document.getElementById('apiKey').value = savedKey;
            document.getElementById('apiSecret').value = savedSecret;
            this.showNotification('Credenciais da API carregadas!', 'success');
        }
    }

    saveApiCredentials() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const apiSecret = document.getElementById('apiSecret').value.trim();

        if (!apiKey || !apiSecret) {
            this.showNotification('Por favor, preencha ambos os campos da API.', 'error');
            return;
        }

        this.apiKey = apiKey;
        this.apiSecret = apiSecret;

        localStorage.setItem('astronomy_api_key', apiKey);
        localStorage.setItem('astronomy_api_secret', apiSecret);

        this.showNotification('Credenciais da API salvas com sucesso!', 'success');
    }

    selectFeaturedConstellation(constellation) {
        document.getElementById('constellation').value = constellation;
        document.getElementById('style').value = 'default';

        // Scroll to form
        document.querySelector('.search-section').scrollIntoView({
            behavior: 'smooth'
        });

        // Highlight the form briefly
        const searchCard = document.querySelector('.search-card');
        searchCard.style.transform = 'scale(1.02)';
        searchCard.style.boxShadow = '0 30px 60px rgba(99, 102, 241, 0.3)';

        setTimeout(() => {
            searchCard.style.transform = '';
            searchCard.style.boxShadow = '';
        }, 1000);
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Reset all sections first
        this.hideAllSections();
        this.setButtonLoading(false);
        this.updateProgress(0);

        if (!this.apiKey || !this.apiSecret) {
            this.showError('Credenciais da API não configuradas', 'Por favor, configure suas credenciais da Astronomy API na seção de configuração abaixo.');
            return;
        }

        const constellation = document.getElementById('constellation').value;
        const style = document.getElementById('style').value;
        const location = document.getElementById('location').value;
        const date = document.getElementById('date').value;

        if (!constellation || !style || !location || !date) {
            this.showError('Campos obrigatórios', 'Por favor, preencha todos os campos: constelação, estilo, localização e data.');
            return;
        }

        this.showLoading();

        try {
            await this.generateStarChart(constellation, style, location, date);
        } catch (error) {
            console.error('Erro na requisição:', error);
            this.showError('Erro na API', error.message, error.details);
        }
    }

    async generateStarChart(constellation, style, location, date) {
        this.setButtonLoading(true);
        this.updateProgress(0);

        try {
            // Parse location
            if (!date || date.trim() === '') {
                throw new Error('Data é obrigatória');
            }

            // Ensure date is in YYYY-MM-DD format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                throw new Error('Formato de data inválido. Use YYYY-MM-DD');
            }

            if (!location) {
                throw new Error('Localização não selecionada');
            }

            const locationParts = location.split(',');
            if (locationParts.length !== 2) {
                throw new Error('Formato de localização inválido');
            }

            const [latitude, longitude] = locationParts.map(coord => parseFloat(coord.trim()));

            if (isNaN(latitude) || isNaN(longitude)) {
                throw new Error('Coordenadas inválidas');
            }

            // Validate constellation and style
            if (!constellation || constellation.trim() === '') {
                throw new Error('Constelação é obrigatória');
            }

            if (!style || style.trim() === '') {
                throw new Error('Estilo é obrigatório');
            }

            // Prepare request data
            const requestData = {
                style: style,
                observer: {
                    latitude: latitude,
                    longitude: longitude,
                    date: date
                },
                view: {
                    type: "constellation",
                    parameters: {
                        constellation: constellation
                    }
                }
            };

            console.log('Request data:', JSON.stringify(requestData, null, 2));

            this.updateProgress(25);

            // Create authorization header
            const auth = btoa(`${this.apiKey}:${this.apiSecret}`);

            // Make API request
            const response = await fetch(`${this.baseUrl}/studio/star-chart`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            this.updateProgress(75);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Response:', errorData);
                throw new Error(`API Error: ${response.status} - ${response.statusText}`, {
                    cause: {
                        status: response.status,
                        statusText: response.statusText,
                        details: errorData
                    }
                });
            }

            const data = await response.json();
            console.log('API Success Response:', data);
            this.updateProgress(100);

            if (!data.data || !data.data.imageUrl) {
                throw new Error('Resposta inválida da API', {
                    cause: {
                        response: data
                    }
                });
            }

            // Display results
            this.displayResults(constellation, style, location, date, data.data.imageUrl, requestData);

        } catch (error) {
            console.error('Erro detalhado:', error);

            let errorMessage = 'Erro desconhecido';
            let errorDetails = '';

            if (error.cause) {
                if (error.cause.status === 401) {
                    errorMessage = 'Credenciais inválidas';
                    errorDetails = 'Verifique se sua Application ID e Application Secret estão corretas.';
                } else if (error.cause.status === 429) {
                    errorMessage = 'Limite de requisições excedido';
                    errorDetails = 'Aguarde alguns minutos antes de tentar novamente.';
                } else if (error.cause.status >= 500) {
                    errorMessage = 'Erro no servidor da API';
                    errorDetails = 'O servidor da Astronomy API está temporariamente indisponível.';
                } else {
                    errorMessage = error.message;
                    errorDetails = JSON.stringify(error.cause, null, 2);
                }
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Erro de conexão';
                errorDetails = 'Verifique sua conexão com a internet e tente novamente.';
            } else {
                errorMessage = error.message;
                errorDetails = error.stack || 'Nenhum detalhe adicional disponível.';
            }

            this.showError(errorMessage, errorDetails);

        } finally {
            this.setButtonLoading(false);
        }
    }

    updateProgress(percentage) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
    }

    displayResults(constellation, style, location, date, imageUrl, requestData) {
        this.hideAllSections();

        // Get constellation name
        const constellationSelect = document.getElementById('constellation');
        const constellationName = constellationSelect.options[constellationSelect.selectedIndex].text;

        // Get location name
        const locationSelect = document.getElementById('location');
        const locationName = locationSelect.options[locationSelect.selectedIndex].text;

        // Update results title
        document.getElementById('resultsTitle').innerHTML = `
            <span class="results-icon">✨</span>
            ${constellationName}
        `;

        // Update image
        this.constellationImage.src = imageUrl;
        this.constellationImage.alt = `Mapa estelar da constelação ${constellationName}`;

        // Update overlay
        document.getElementById('overlayTitle').textContent = constellationName;
        document.getElementById('overlayDescription').textContent = `Mapa estelar gerado pela Astronomy API - Estilo: ${style}`;

        // Update info cards
        document.getElementById('requestDetails').innerHTML = `
            <p><strong>Constelação:</strong> ${constellationName} (${constellation})</p>
            <p><strong>Estilo:</strong> ${style}</p>
            <p><strong>URL da Imagem:</strong> <a href="${imageUrl}" target="_blank" style="color: var(--primary-color); word-break: break-all;">${imageUrl}</a></p>
        `;

        document.getElementById('constellationDescription').textContent = this.getConstellationDescription(constellation);
        document.getElementById('locationInfo').textContent = `${locationName} (${location})`;
        document.getElementById('dateTimeInfo').textContent = `${new Date(date).toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`;

        // Show results
        this.resultsSection.classList.add('show');
        this.constellationInfo.classList.add('show');

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Add success animation
        this.animateResults();

        // Show success notification
        this.showNotification('Mapa estelar gerado com sucesso!', 'success');
    }

    getConstellationDescription(constellation) {
        const descriptions = {
            'ori': 'Órion é uma das constelações mais reconhecíveis do céu noturno, representando um caçador mitológico.',
            'uma': 'A Ursa Maior é uma das constelações mais conhecidas, contendo o famoso asterismo da "Grande Carroça".',
            'cas': 'Cassiopeia é facilmente reconhecível por sua forma distintiva de "W" ou "M".',
            'cyg': 'Cygnus, o Cisne, é uma grande constelação que se estende ao longo da Via Láctea.',
            'leo': 'Leo é uma constelação zodiacal facilmente reconhecível, representando um leão.',
            'sco': 'Scorpius é uma constelação zodiacal que realmente se parece com um escorpião.',
            'and': 'Andrômeda é famosa por conter a Galáxia de Andrômeda, a galáxia espiral mais próxima da Via Láctea.',
            'per': 'Perseu é uma constelação que contém várias estrelas brilhantes e é o radiante da chuva de meteoros Perseidas.',
            'gem': 'Gêmeos representa os gêmeos Castor e Pólux, com duas estrelas brilhantes com os mesmos nomes.',
            'tau': 'Touro é uma constelação zodiacal que contém as Plêiades e as Híades.',
            'vir': 'Virgem é a segunda maior constelação do céu e contém Spica, uma das estrelas mais brilhantes.',
            'sgr': 'Sagitário aponta para o centro da Via Láctea e contém muitos aglomerados estelares.',
            'aqr': 'Aquário é conhecido como o "Portador de Água" e contém várias nebulosas planetárias.',
            'psc': 'Peixes representa dois peixes conectados por uma corda.',
            'ari': 'Áries representa um carneiro e é historicamente importante como o primeiro signo do zodíaco.',
            'cnc': 'Câncer contém o aglomerado estelar M44, conhecido como Colmeia ou Presépio.',
            'lib': 'Libra representa uma balança e é a única constelação zodiacal que representa um objeto inanimado.',
            'cap': 'Capricórnio representa uma cabra marinha e é uma das constelações mais antigas conhecidas.',
            'aql': 'Aquila, a Águia, contém Altair, uma das estrelas do Triângulo de Verão.',
            'lyr': 'Lyra é uma pequena constelação que contém Vega, uma das estrelas mais brilhantes do céu.',
            'dra': 'Draco é uma grande constelação que serpenteia ao redor do polo norte celestial.',
            'umi': 'A Ursa Menor contém a Estrela Polar (Polaris), que marca o polo norte celestial.',
            'cep': 'Cefeu é uma constelação circumpolar que representa um rei da mitologia grega.',
            'her': 'Hércules é uma grande constelação que representa o herói da mitologia grega.',
            'boo': 'Boötes, o Pastor, contém Arcturus, uma das estrelas mais brilhantes do céu.',
            'cru': 'Crux, o Cruzeiro do Sul, é a menor das 88 constelações modernas.',
            'cen': 'Centaurus representa um centauro e contém Alpha Centauri, o sistema estelar mais próximo do Sol.',
            'car': 'Carina fazia parte da antiga constelação Argo Navis e contém Canopus.',
            'vel': 'Vela também fazia parte de Argo Navis e representa as velas do navio.',
            'pup': 'Puppis representa a popa do navio Argo e contém várias estrelas brilhantes.'
        };

        return descriptions[constellation] || 'Uma fascinante constelação do céu noturno com sua própria história e características únicas.';
    }

    animateResults() {
        const resultsCard = document.querySelector('.results-card');
        resultsCard.style.opacity = '0';
        resultsCard.style.transform = 'translateY(30px)';

        setTimeout(() => {
            resultsCard.style.transition = 'all 0.6s ease';
            resultsCard.style.opacity = '1';
            resultsCard.style.transform = 'translateY(0)';
        }, 100);
    }

    showLoading() {
        this.hideAllSections();
        this.loadingSection.classList.add('show');
        this.updateProgress(0);
    }

    showError(title, message, details = '') {
        this.hideAllSections();
        document.getElementById('errorMessage').textContent = message;

        const errorDetails = document.getElementById('errorDetails');
        if (details) {
            errorDetails.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
            errorDetails.style.display = 'block';
        } else {
            errorDetails.style.display = 'none';
        }

        if (!location) {
            this.showError('Localização obrigatória', 'Por favor, selecione uma localização.');
            return;
        }

        if (!date) {
            this.showError('Data obrigatória', 'Por favor, selecione uma data.');
            return;
        }
        this.errorSection.classList.add('show');
        this.setButtonLoading(false);
    }

    hideAllSections() {
        this.loadingSection.classList.remove('show');
        this.resultsSection.classList.remove('show');
        this.errorSection.classList.remove('show');
        this.constellationInfo.classList.remove('show');
    }

    setButtonLoading(loading) {
        const searchBtn = document.getElementById('searchBtn');
        if (loading) {
            searchBtn.classList.add('loading');
            searchBtn.disabled = true;
        } else {
            searchBtn.classList.remove('loading');
            searchBtn.disabled = false;
        }
    }

    retrySearch() {
        this.hideAllSections();
        this.setButtonLoading(false);
        this.updateProgress(0);
        document.querySelector('.search-section').scrollIntoView({ behavior: 'smooth' });
    }

    downloadImage() {
        const imageUrl = this.constellationImage.src;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'constellation-star-chart.png';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Download iniciado!', 'success');
    }

    shareConstellation() {
        const imageUrl = this.constellationImage.src;
        const constellationSelect = document.getElementById('constellation');
        const constellationName = constellationSelect.options[constellationSelect.selectedIndex].text;

        if (navigator.share) {
            navigator.share({
                title: `Mapa Estelar - ${constellationName}`,
                text: `Confira este mapa estelar da constelação ${constellationName}!`,
                url: imageUrl
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            const shareText = `Mapa Estelar - ${constellationName}: ${imageUrl}`;
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Link copiado para a área de transferência!', 'success');
            }).catch(() => {
                this.showNotification('Erro ao copiar link', 'error');
            });
        }
    }

    openFullscreen() {
        const fullscreenImage = document.getElementById('fullscreenImage');
        fullscreenImage.src = this.constellationImage.src;
        fullscreenImage.alt = this.constellationImage.alt;
        this.fullscreenModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeFullscreen() {
        this.fullscreenModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#6366f1'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    createInteractiveStars() {
        const starsContainer = document.querySelector('.stars-container');
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AstronomyExplorer();
});