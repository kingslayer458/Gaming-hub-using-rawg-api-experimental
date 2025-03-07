/**
 * Game Wallpaper Gallery
 * Main class for handling the wallpaper gallery functionality
 */
class WallpaperGallery {
    constructor() {
        this.wallpapers = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.isLoading = false;
        this.currentFilter = 'all';
        this.initializeDateTime();
        this.initializeEventListeners();
        this.loadWallpapers();
    }

    initializeDateTime() {
        const updateDateTime = () => {
            const now = new Date();
            const dateTimeString = this.formatUTCDateTime(now);
            document.getElementById('currentDateTime').innerHTML = 
                `Current Date and Time: ${dateTimeString}`;
        };
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    formatUTCDateTime(date) {
        const pad = (num) => String(num).padStart(2, '0');
        
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1);
        const day = pad(date.getUTCDate());
        const hours = pad(date.getUTCHours());
        const minutes = pad(date.getUTCMinutes());
        const seconds = pad(date.getUTCSeconds());

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async loadWallpapers(searchTerm = '') {
        if (this.isLoading) return;
        
        this.toggleLoadingState(true);
        try {
            let apiUrl = `${BASE_URL}/games?key=${API_KEY}&page=${this.currentPage}&page_size=${this.itemsPerPage}`;
            
            if (searchTerm) {
                apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
            } else {
                apiUrl += `&ordering=-rating&dates=2015-01-01,2024-12-31&metacritic=80,100`;
            }

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            if (data.results.length === 0) {
                this.showError('No games found. Try a different search term.');
                this.wallpapers = [];
            } else {
                this.wallpapers = data.results
                    .filter(game => game.background_image)
                    .map(game => ({
                        id: game.id,
                        title: game.name,
                        image: this.getHighResImage(game.background_image),
                        category: this.getCategoryFromGenres(game.genres),
                        description: game.description_raw || `${game.name} - Released: ${game.released}`,
                        rating: game.rating || 0,
                        metacritic: game.metacritic,
                        released: game.released
                    }));

                await this.loadScreenshotsForWallpapers();
            }

            this.renderWallpapers();
            this.updatePaginationControls(data.count);
        } catch (error) {
            console.error('Error loading wallpapers:', error);
            this.showError('Failed to load wallpapers. Please try again.');
            this.wallpapers = [];
            this.renderWallpapers();
        } finally {
            this.toggleLoadingState(false);
        }
    }

    async loadScreenshotsForWallpapers() {
        await Promise.all(this.wallpapers.map(async (wallpaper) => {
            try {
                const response = await fetch(
                    `${BASE_URL}/games/${wallpaper.id}/screenshots?key=${API_KEY}`
                );
                const data = await response.json();
                wallpaper.screenshots = data.results
                    .map(screenshot => this.getHighResImage(screenshot.image))
                    .filter(Boolean);
            } catch (error) {
                console.error(`Error loading screenshots for ${wallpaper.title}:`, error);
                wallpaper.screenshots = [];
            }
        }));
    }

    getHighResImage(url) {
        return url.replace('media/games', 'media/resize/1280/-/games');
    }

    getCategoryFromGenres(genres) {
        if (!genres || genres.length === 0) return 'other';
        const mainGenre = genres[0].slug;
        const categoryMap = {
            'action': 'action',
            'role-playing-games-rpg': 'rpg',
            'sports': 'sports',
            'racing': 'racing',
            'shooter': 'action',
            'adventure': 'action',
            'strategy': 'rpg'
        };
        return categoryMap[mainGenre] || 'other';
    }

    renderWallpapers() {
        const grid = document.getElementById('wallpapersGrid');
        grid.innerHTML = '';

        const filteredWallpapers = this.currentFilter === 'all' 
            ? this.wallpapers 
            : this.wallpapers.filter(w => w.category === this.currentFilter);

        if (filteredWallpapers.length === 0) {
            grid.innerHTML = '<div class="no-results">No wallpapers found</div>';
            return;
        }

        filteredWallpapers.forEach((wallpaper, index) => {
            const card = this.createWallpaperCard(wallpaper, index);
            grid.appendChild(card);
        });
    }

    createWallpaperCard(wallpaper, index) {
        const card = document.createElement('div');
        card.className = 'wallpaper-card';
        
        card.innerHTML = `
            <div class="wallpaper-image">
                <img src="${wallpaper.image}" alt="${wallpaper.title}" loading="lazy">
            </div>
            <div class="wallpaper-info">
                <h3>${wallpaper.title}</h3>
                ${wallpaper.metacritic ? `
                    <div class="metacritic-score">
                        <span class="score">${wallpaper.metacritic}</span>
                    </div>
                ` : ''}
                <div class="wallpaper-stats">
                    <span class="rating">★ ${wallpaper.rating.toFixed(1)}</span>
                    <span class="category">${wallpaper.category}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.showModal(wallpaper));
        return card;
    }

    showModal(wallpaper) {
        const modal = document.getElementById('imageModal');
        const modalContent = modal.querySelector('.modal-content');
    
        modalContent.innerHTML = `
            <span class="close-button">&times;</span>
            <div class="image-container">
                <div class="main-image">
                    <img src="${wallpaper.image}" alt="${wallpaper.title}" 
                         onerror="this.src='assets/placeholder.jpg';">
                </div>
                ${wallpaper.screenshots.length ? `
                    <div class="thumbnails">
                        ${wallpaper.screenshots.map(screenshot => `
                            <div class="thumbnail">
                                <img src="${screenshot}" alt="Screenshot" 
                                     onerror="this.src='assets/placeholder.jpg';"
                                     onclick="document.querySelector('.main-image img').src='${screenshot}'">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="image-info">
                    <h2>${wallpaper.title}</h2>
                    <p>${wallpaper.description}</p>
                    <div class="download-options">
                        <button class="download-btn" onclick="wallpaperGallery.downloadWallpaper('${wallpaper.image}', '4k', '${wallpaper.title}')">
                            <i class="fas fa-download"></i> Download 4K
                        </button>
                        <button class="download-btn" onclick="wallpaperGallery.downloadWallpaper('${wallpaper.image}', '1080p', '${wallpaper.title}')">
                            <i class="fas fa-download"></i> Download 1080p
                        </button>
                        <button class="save-btn" onclick="wallpaperGallery.openImageInNewTab('${wallpaper.image}')">
                            <i class="fas fa-external-link-alt"></i> Open Image
                        </button>
                    </div>
                </div>
            </div>
        `;
    
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        setTimeout(() => modal.classList.add('show'), 10);
        this.initializeModalEvents(modal);
    }

    async downloadWallpaper(url, quality, title) {
        try {
            this.toggleLoadingState(true);
            
            // Create an Image object to load the image
            const img = new Image();
            
            // Create a promise to handle image loading
            const imageLoadPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image'));
                img.crossOrigin = 'anonymous'; // Try with CORS
                img.src = url;
            });
            
            try {
                await imageLoadPromise;
            } catch (error) {
                // If CORS fails, inform the user and provide alternative
                throw new Error('CORS restrictions prevent direct download');
            }
            
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set dimensions based on quality
            if (quality === '4k') {
                canvas.width = 3840;
                canvas.height = 2160;
            } else { // 1080p
                canvas.width = 1920;
                canvas.height = 1080;
            }
            
            // Calculate dimensions to maintain aspect ratio
            const aspectRatio = img.width / img.height;
            let drawWidth = canvas.width;
            let drawHeight = canvas.width / aspectRatio;
            
            if (drawHeight < canvas.height) {
                drawHeight = canvas.height;
                drawWidth = canvas.height * aspectRatio;
            }
            
            const x = (canvas.width - drawWidth) / 2;
            const y = (canvas.height - drawHeight) / 2;
            
            // Draw the image on the canvas
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            
            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            
            // Create download link
            const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${quality}.jpg`;
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            
        } catch (error) {
            console.error('Error downloading wallpaper:', error);
            if (error.message.includes('CORS')) {
                this.showError('CORS restrictions prevent direct download. Use the "Open Image" button and save manually.');
            } else {
                this.showError('Failed to download wallpaper. Please try again.');
            }
        } finally {
            this.toggleLoadingState(false);
        }
    }
    
    openImageInNewTab(url) {
        window.open(url, '_blank');
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    toggleLoadingState(isLoading) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = isLoading ? 'flex' : 'none';
        this.isLoading = isLoading;
    }

    updatePaginationControls(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    initializeModalEvents(modal) {
        const closeBtn = modal.querySelector('.close-button');
        closeBtn.addEventListener('click', () => this.closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });
        
        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.closeModal(modal);
            }
        });
    }

    closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => modal.style.display = 'none', 300);
    }

    initializeEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.category;
                this.currentPage = 1;
                this.loadWallpapers();
            });
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadWallpapers();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.currentPage++;
            this.loadWallpapers();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        let searchTimeout;

        const performSearch = () => {
            const searchTerm = searchInput.value.trim();
            this.currentPage = 1;
            this.loadWallpapers(searchTerm);
        };

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 500);
        });

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch();
            }
        });
        
        // Clear search button
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                performSearch();
            });
            
            // Show/hide clear button based on input
            searchInput.addEventListener('input', () => {
                clearSearch.style.display = searchInput.value ? 'block' : 'none';
            });
        }
    }
}

// Initialize the gallery when the DOM is loaded
let wallpaperGallery;
document.addEventListener('DOMContentLoaded', () => {
    wallpaperGallery = new WallpaperGallery();
});