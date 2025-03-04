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
// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);