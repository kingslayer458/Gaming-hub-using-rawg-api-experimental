let currentPage = 1;
let isLoading = false;

// Function to fetch games from the API
async function fetchGames(search = '', page = 1) {
    try {
        const response = await fetch(
            `${BASE_URL}/games?key=${API_KEY}&page=${page}&page_size=20&search=${search}`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching games:', error);
        return null;
    }
}

// Function to create game cards
function createGameCard(game) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.innerHTML = `
        <img src="${game.background_image}" alt="${game.name}">
        <div class="game-info">
            <h3 class="game-title">${game.name}</h3>
            <div class="game-rating">
                <span class="rating-score">${game.rating}/5</span>
                <span>(${game.ratings_count} ratings)</span>
            </div>
        </div>
    `;
    gameCard.addEventListener('click', () => showGameDetails(game.id));
    return gameCard;
}

// Function to fetch and display game details
async function showGameDetails(gameId) {
    try {
        const response = await fetch(
            `${BASE_URL}/games/${gameId}?key=${API_KEY}`
        );
        const game = await response.json();

        // Fetch screenshots
        const screenshotsResponse = await fetch(
            `${BASE_URL}/games/${gameId}/screenshots?key=${API_KEY}`
        );
        const screenshots = await screenshotsResponse.json();

        // Create modal content
        const gameDetails = document.getElementById('gameDetails');
        gameDetails.innerHTML = `
            <h2>${game.name}</h2>
            <div class="game-rating">
                <span class="rating-score">${game.rating}/5</span>
                <span>(${game.ratings_count} ratings)</span>
            </div>
            <div class="game-description">
                ${game.description}
            </div>
            <div class="screenshots-container">
                ${screenshots.results.map(screenshot => `
                    <img class="screenshot" src="${screenshot.image}" alt="Screenshot">
                `).join('')}
            </div>
            ${game.clip ? `
                <div class="video-container">
                    <video controls>
                        <source src="${game.clip.clip}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            ` : ''}
        `;

        // Show modal
        const modal = document.getElementById('gameModal');
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error fetching game details:', error);
    }
}

// Initialize the page
async function initializePage() {
    const gamesGrid = document.getElementById('gamesGrid');
    const data = await fetchGames();
    
    if (data && data.results) {
        data.results.forEach(game => {
            gamesGrid.appendChild(createGameCard(game));
        });
    }
}

// Search functionality
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');

searchButton.addEventListener('click', async () => {
    const searchTerm = searchInput.value.trim();
    const gamesGrid = document.getElementById('gamesGrid');
    gamesGrid.innerHTML = '';
    currentPage = 1;
    
    const data = await fetchGames(searchTerm);
    if (data && data.results) {
        data.results.forEach(game => {
            gamesGrid.appendChild(createGameCard(game));
        });
    }
});

// Modal close button functionality
const modal = document.getElementById('gameModal');
const closeButton = document.querySelector('.close-button');

closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Infinite scroll
window.addEventListener('scroll', async () => {
    if (isLoading) return;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        isLoading = true;
        currentPage++;
        const searchTerm = searchInput.value.trim();
        const data = await fetchGames(searchTerm, currentPage);
        
        if (data && data.results) {
            const gamesGrid = document.getElementById('gamesGrid');
            data.results.forEach(game => {
                gamesGrid.appendChild(createGameCard(game));
            });
        }
        isLoading = false;
    }
});
// Add these functions to your existing script.js

// Update the createGameCard function to include tracking button
function createGameCard(game) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.innerHTML = `
        <img src="${game.background_image}" alt="${game.name}">
        <div class="game-info">
            <h3 class="game-title">${game.name}</h3>
            <div class="game-rating">
                <span class="rating-score">${game.rating}/5</span>
                <span>(${game.ratings_count} ratings)</span>
            </div>
            <div class="game-actions">
                <button class="track-button" data-game-id="${game.id}">
                    Track Game
                </button>
                <button class="favorite-button" data-game-id="${game.id}">
                    ❤️
                </button>
            </div>
        </div>
    `;

    // Add event listeners for tracking and favoriting
    const trackButton = gameCard.querySelector('.track-button');
    const favoriteButton = gameCard.querySelector('.favorite-button');

    trackButton.addEventListener('click', (e) => {
        e.stopPropagation();
        trackGame(game.id);
    });

    favoriteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(game.id);
    });

    gameCard.addEventListener('click', () => showGameDetails(game.id));
    return gameCard;
}

// Add these new functions
function trackGame(gameId) {
    userSession.updateUserStats('tracked');
    const button = document.querySelector(`[data-game-id="${gameId}"].track-button`);
    button.textContent = 'Tracked';
    button.disabled = true;
}

function toggleFavorite(gameId) {
    const button = document.querySelector(`[data-game-id="${gameId}"].favorite-button`);
    if (button.classList.contains('active')) {
        button.classList.remove('active');
        userSession.currentUser.favorites--;
    } else {
        button.classList.add('active');
        userSession.updateUserStats('favorite');
    }
    userSession.displayUserInfo();
}

// Update the showGameDetails function to include review functionality
async function showGameDetails(gameId) {
    try {
        const response = await fetch(
            `${BASE_URL}/games/${gameId}?key=${API_KEY}`
        );
        const game = await response.json();

        const screenshotsResponse = await fetch(
            `${BASE_URL}/games/${gameId}/screenshots?key=${API_KEY}`
        );
        const screenshots = await screenshotsResponse.json();

        const gameDetails = document.getElementById('gameDetails');
        gameDetails.innerHTML = `
            <h2>${game.name}</h2>
            <div class="game-rating">
                <span class="rating-score">${game.rating}/5</span>
                <span>(${game.ratings_count} ratings)</span>
            </div>
            <div class="game-description">
                ${game.description}
            </div>
            <div class="user-review-section">
                <h3>Write a Review</h3>
                <div class="review-form">
                    <select id="reviewRating">
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Very Good</option>
                        <option value="3">3 - Good</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                    </select>
                    <textarea id="reviewText" placeholder="Write your review here..."></textarea>
                    <button onclick="submitReview(${gameId})">Submit Review</button>
                </div>
            </div>
            <div class="screenshots-container">
                ${screenshots.results.map(screenshot => `
                    <img class="screenshot" src="${screenshot.image}" alt="Screenshot">
                `).join('')}
            </div>
            ${game.clip ? `
                <div class="video-container">
                    <video controls>
                        <source src="${game.clip.clip}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            ` : ''}
        `;

        const modal = document.getElementById('gameModal');
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error fetching game details:', error);
    }
}

function submitReview(gameId) {
    const rating = document.getElementById('reviewRating').value;
    const text = document.getElementById('reviewText').value;
    
    if (text.trim()) {
        userSession.updateUserStats('review');
        // Here you would typically send the review to a backend server
        alert('Review submitted successfully!');
        document.getElementById('reviewText').value = '';
    } else {
        alert('Please write a review before submitting.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Functionality
    const themeToggle = document.createElement('button');
    themeToggle.classList.add('theme-toggle');
    themeToggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657L5.93 5.93m12.728 12.728 1.414 1.414M6.343 6.343 5.93 4.93m12.728 12.728 1.414 1.414" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 17a5 5 0 0 0 5-5 5 5 0 0 0-5-5v5z"/>
        </svg>
    `;
    document.body.appendChild(themeToggle);

    // Check for user's preferred color scheme
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.add('light-mode');
    }

    // Theme Toggle Logic
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
    });

    // Screenshot Carousel Interaction
    const screenshotsContainer = document.querySelector('.screenshots-container');
    if (screenshotsContainer) {
        // Auto-scroll functionality
        let scrollAmount = 0;
        const scrollStep = 250; // Width of a screenshot

        function autoScroll() {
            scrollAmount += scrollStep;
            if (scrollAmount >= screenshotsContainer.scrollWidth) {
                scrollAmount = 0;
            }
            screenshotsContainer.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }

        // Auto-scroll every 3 seconds
        setInterval(autoScroll, 3000);
    }
});

// Extend the existing showGameDetails function
async function showGameDetails(gameId) {
    try {
        const response = await fetch(
            `${BASE_URL}/games/${gameId}?key=${API_KEY}`
        );
        const game = await response.json();

        const screenshotsResponse = await fetch(
            `${BASE_URL}/games/${gameId}/screenshots?key=${API_KEY}`
        );
        const screenshots = await screenshotsResponse.json();

        const gameDetails = document.getElementById('gameDetails');
        gameDetails.innerHTML = `
            <div class="modal-header">
                <h2>${game.name}</h2>
                <div class="game-meta">
                    <span class="rating">
                        Rating: <strong>${game.rating}/5</strong> 
                        (${game.ratings_count} ratings)
                    </span>
                </div>
            </div>

            <div class="game-description">
                ${game.description}
            </div>

            <div class="screenshots-section">
                <h3>Screenshots</h3>
                <div class="screenshots-gallery">
                    ${screenshots.results.map((screenshot, index) => `
                        <div class="screenshot-item" data-index="${index}">
                            <img src="${screenshot.image}" alt="Game Screenshot">
                            <div class="screenshot-overlay">
                                <span>View Full Image</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${game.clip ? `
                <div class="game-trailer">
                    <h3>Game Trailer</h3>
                    <video controls>
                        <source src="${game.clip.clip}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            ` : ''}
        `;

        // Setup lightbox functionality
        setupLightbox(screenshots.results);

        const modal = document.getElementById('gameModal');
        modal.style.display = 'flex';

    } catch (error) {
        console.error('Error fetching game details:', error);
    }
}

// Lightbox functionality
function setupLightbox(screenshots) {
    // Create lightbox container if it doesn't exist
    let lightbox = document.querySelector('.lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.classList.add('lightbox');
        document.body.appendChild(lightbox);
    }

    const screenshotItems = document.querySelectorAll('.screenshot-item');
    screenshotItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Create lightbox content
            lightbox.innerHTML = `
                <div class="lightbox-content">
                    <span class="lightbox-close">&times;</span>
                    <img class="lightbox-image" src="${screenshots[index].image}" alt="Full Screenshot">
                </div>
            `;

            // Show lightbox
            lightbox.style.display = 'flex';

            // Close lightbox functionality
            const closeBtn = lightbox.querySelector('.lightbox-close');
            closeBtn.addEventListener('click', () => {
                lightbox.style.display = 'none';
            });

            // Close on clicking outside the image
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    lightbox.style.display = 'none';
                }
            });
        });
    });
}

// Theme Toggle Enhanced
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.createElement('button');
    themeToggle.classList.add('theme-toggle');
    themeToggle.textContent = 'Toggle Theme';
    document.body.appendChild(themeToggle);

    // Theme preference detection
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initial theme setup
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.add('light-mode');
    }

    // Theme toggle logic
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
    });
});
// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);