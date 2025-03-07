/**
 * Modal Downloader
 * Enhanced functionality for downloading images from modal view
 */

// Function to download a single wallpaper with specified resolution
async function downloadModalWallpaper(imageUrl, resolution, filename) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${filename}-${resolution}.${imageUrl.split('.').pop()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        return true;
    } catch (error) {
        console.error(`Failed to download ${filename}:`, error);
        return false;
    }
}

// Function to download all images in the current modal
async function downloadAllModalWallpapers() {
    // Find the currently open modal
    const modal = document.querySelector('#imageModal.show');
    if (!modal) {
        console.error('No modal is currently open');
        return;
    }

    // Show loading state
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    try {
        // Get all thumbnail images in the modal
        const thumbnails = modal.querySelectorAll('.thumbnail img');
        const mainImage = modal.querySelector('.main-image img');
        const title = modal.querySelector('.image-info h2')?.textContent || 'wallpaper';
        
        // Create a status indicator
        const statusDiv = document.createElement('div');
        statusDiv.className = 'download-status';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--card-background);
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 2001;
            color: var(--text-color);
        `;
        document.body.appendChild(statusDiv);

        let downloaded = 0;
        const total = thumbnails.length;

        // Download each image
        for (let i = 0; i < thumbnails.length; i++) {
            const img = thumbnails[i];
            const imageUrl = img.src;
            // Remove thumbnail suffix if present and get full resolution URL
            const fullResUrl = imageUrl.replace('-thumb', '').replace('-small', '');
            
            statusDiv.innerHTML = `Downloading image ${i + 1} of ${total}...`;
            
            await downloadModalWallpaper(fullResUrl, 'full', `${title}-${i + 1}`);
            downloaded++;
            
            // Add a small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Show success message
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `Successfully downloaded ${downloaded} wallpapers!`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

    } catch (error) {
        console.error('Failed to download wallpapers:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Failed to download wallpapers. Please try again.';
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.classList.add('show'), 100);
        setTimeout(() => {
            errorMessage.classList.remove('show');
            setTimeout(() => errorMessage.remove(), 300);
        }, 3000);
    } finally {
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        // Remove status indicator
        const statusDiv = document.querySelector('.download-status');
        if (statusDiv) statusDiv.remove();
    }
}

// Add a "Download All" button to the modal's download options
function addModalDownloadAllButton() {
    // Check if we're in a modal
    const downloadOptions = document.querySelector('.modal .download-options');
    if (!downloadOptions) return;

    // Check if button already exists
    if (downloadOptions.querySelector('.download-all-btn')) return;

    // Create and add the download all button
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.className = 'download-btn download-all-btn';
    downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All Images';
    downloadAllBtn.onclick = downloadAllModalWallpapers;
    downloadOptions.appendChild(downloadAllBtn);
}

// Add the download button when a modal opens
function initializeModalDownloader() {
    // Create a MutationObserver to watch for modal changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('show')) {
                addModalDownloadAllButton();
            }
        });
    });

    // Start observing modals
    document.querySelectorAll('.modal').forEach(modal => {
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });
    });
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeModalDownloader);