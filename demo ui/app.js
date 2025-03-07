// RAWG API key - you would need to get your own from https://rawg.io/apidocs
const API_KEY = 'fa828279e28f467ca7d0690f4326d64e';
const BASE_URL = 'https://api.rawg.io/api';

// DOM Elements
const popularGamesGrid = document.getElementById('popular-games');
const newestGamesGrid = document.getElementById('newest-games');
const popularLoader = document.getElementById('popular-loader');
const newestLoader = document.getElementById('newest-loader');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const categories = document.querySelectorAll('.category');
const scrollTopBtn = document.getElementById('scroll-top');
const header = document.getElementById('header');
const modal = document.getElementById('wallpaper-modal');
const closeModal = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');
const modalImage = document.getElementById('modal-image');
const modalRating = document.getElementById('modal-rating');
const modalRelease = document.getElementById('modal-release');
const modalPlatforms = document.getElementById('modal-platforms');
const modalDescription = document.getElementById('modal-description');
const wallpaperOptions = document.querySelectorAll('.wallpaper-option');
const notification = document.getElementById('notification');
const heroBg = document.querySelector('.hero-bg');
const ctaButton = document.querySelector('.cta-button');

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Platform icons mapping
const platformIcons = {
    'pc': 'fas fa-desktop',
    'playstation': 'fab fa-playstation',
    'xbox': 'fab fa-xbox',
    'nintendo': 'fas fa-gamepad',
    'ios': 'fab fa-apple',
    'android': 'fab fa-android',
    'linux': 'fab fa-linux',
    'mac': 'fab fa-apple',
    'web': 'fas fa-globe'
};

// Fetch games from RAWG API
async function fetchGames(endpoint, params = {}) {
    const queryParams = new URLSearchParams({
        key: API_KEY,
        page_size: 12,
        ...params
    });

    try {
        const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching games:', error);
        displayError(error.message);
        return [];
    }
}

// Create game card
function createGameCard(game) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.dataset.id = game.id;

    // Calculate the animation delay based on index
    const delay = Math.random() * 0.5; // Random delay between 0 and 0.5s
    gameCard.style.animationDelay = `${delay}s`;

    const platformsHTML = game.platforms
        .slice(0, 3) // Limit to 3 platforms
        .map(p => {
            const slug = p.platform.slug;
            const icon = platformIcons[slug] || 'fas fa-question';
            return `<i class="${icon}" title="${p.platform.name}"></i>`;
        })
        .join('');

    gameCard.innerHTML = `
        <img src="${game.background_image}" alt="${game.name}" class="game-image">
        <div class="game-info">
            <h3 class="game-title">${game.name}</h3>
            <div class="game-meta">
                <div class="game-rating">
                    <i class="fas fa-star"></i>
                    <span>${game.rating}</span>
                </div>
                <div>${formatDate(game.released)}</div>
            </div>
            <div class="platform-icons">
                ${platformsHTML}
            </div>
            <button class="download-button">
                <i class="fas fa-download"></i>
                Get Wallpaper
            </button>
        </div>
    `;

    return gameCard;
}

// Load games to the grid
function loadGames(container, games) {
    container.innerHTML = '';

    games.forEach(game => {
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);

        // Add click event listener to open modal
        gameCard.addEventListener('click', () => openGameModal(game));
    });
}

// Open game modal
function openGameModal(game) {
    modalTitle.textContent = game.name;
    modalImage.src = game.background_image;
    modalRating.textContent = game.rating;
    modalRelease.textContent = `Release: ${formatDate(game.released)}`;
    modalDescription.textContent = game.description;

    // Add platforms
    modalPlatforms.innerHTML = '';
    game.platforms.forEach(p => {
        const slug = p.platform.slug;
        const icon = platformIcons[slug] || 'fas fa-question';
        const platformIcon = document.createElement('i');
        platformIcon.className = icon;
        platformIcon.title = p.platform.name;
        modalPlatforms.appendChild(platformIcon);
    });

    // Open modal with animation
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close game modal
function closeGameModal() {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
}

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Load initial data
function initializeWebsite() {
    // Set random hero background
    fetchGames('games', { ordering: '-added' }).then(heroGames => {
        const randomGame = heroGames[Math.floor(Math.random() * heroGames.length)];
        heroBg.style.backgroundImage = `url(${randomGame.background_image})`;

        // Load popular games
        popularLoader.style.display = 'block';
        fetchGames('games', { ordering: '-rating' }).then(popularGames => {
            loadGames(popularGamesGrid, popularGames);
            popularLoader.style.display = 'none';

            // Add staggered animation to game cards
            document.querySelectorAll('#popular-games .game-card').forEach((card, index) => {
                card.style.animationDelay = `${0.1 * index}s`;
            });
        });

        // Load newest games
        newestLoader.style.display = 'block';
        fetchGames('games', { ordering: '-released' }).then(newestGames => {
            loadGames(newestGamesGrid, newestGames);
            newestLoader.style.display = 'none';

            // Add staggered animation to game cards
            document.querySelectorAll('#newest-games .game-card').forEach((card, index) => {
                card.style.animationDelay = `${0.1 * index}s`;
            });
        });
    });
}

// Add event listeners
function addEventListeners() {
    // Search functionality
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            popularLoader.style.display = 'block';
            popularGamesGrid.innerHTML = '';

            fetchGames('games', { search: searchTerm }).then(filteredGames => {
                loadGames(popularGamesGrid, filteredGames);
                popularLoader.style.display = 'none';

                // Update section title
                document.querySelector('#popular .section-title').textContent =
                    `Search Results for "${searchInput.value}"`;
            });
        }
    });

    // Search on Enter key
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // Category filtering
    categories.forEach(category => {
        category.addEventListener('click', () => {
            // Update active class
            categories.forEach(c => c.classList.remove('active'));
            category.classList.add('active');

            const categoryValue = category.dataset.category;

            // Show loader and clear current games
            popularLoader.style.display = 'block';
            popularGamesGrid.innerHTML = '';

            fetchGames('games', { genres: categoryValue }).then(filteredGames => {
                loadGames(popularGamesGrid, filteredGames);
                popularLoader.style.display = 'none';

                // Update section title
                const categoryName = categoryValue === 'all' ? 'All Games' :
                    categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1);
                document.querySelector('#popular .section-title').textContent = categoryName;
            });
        });
    });

    // Scroll to top button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }

        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Modal close button
    closeModal.addEventListener('click', closeGameModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeGameModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeGameModal();
        }
    });

    // Wallpaper download options
    wallpaperOptions.forEach(option => {
        option.addEventListener('click', () => {
            const resolution = option.dataset.resolution;
            showNotification(`Downloading wallpaper in ${resolution} resolution...`);

            // Simulate download process
            setTimeout(() => {
                showNotification(`Wallpaper downloaded successfully!`);
            }, 2000);
        });
    });

    // CTA button animation on hover
    ctaButton.addEventListener('mouseover', () => {
        heroBg.style.filter = 'brightness(0.7)';
    });

    ctaButton.addEventListener('mouseout', () => {
        heroBg.style.filter = 'brightness(0.6)';
    });

    // CTA button click
    ctaButton.addEventListener('click', () => {
        // Smooth scroll to popular section
        document.getElementById('popular').scrollIntoView({
            behavior: 'smooth'
        });
    });
}

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeWebsite();
    addEventListeners();

    // Add some animations to category pills
    document.querySelectorAll('.category').forEach((category, index) => {
        category.style.animationDelay = `${0.1 * index}s`;
    });
});