// Main JavaScript file for the Harvest Prediction System
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initNavigation();
    checkUrlHash();

    const getStartedBtn = document.getElementById('get-started');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            navigateToSection('upload');
        });
    }
});

// Handle navigation between sections
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    // Update active nav link
    document.querySelectorAll('.nav-links li').forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update active section
    document.querySelectorAll('.section').forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Update URL hash
    window.location.hash = sectionId;
}

// Check URL hash on page load to navigate to the correct section
function checkUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        navigateToSection(hash);
    }
}

// Cross-section navigation functions that will be used by other scripts
function goToUpload() {
    navigateToSection('upload');
}

function goToTrain() {
    navigateToSection('train');
    
    // Make sure we check data availability when navigating to the train section
    // Use a small delay to ensure the DOM is fully updated before checking
    setTimeout(function() {
        if (typeof checkDataAvailability === 'function') {
            checkDataAvailability();
        } else {
            console.error("checkDataAvailability function not found");
        }
    }, 100);
}


function goToPredict() {
    navigateToSection('predict');
    
    // Initialize the predict section after navigating to it
    setTimeout(function() {
        if (typeof initPredictSection === 'function') {
            initPredictSection();
        } else {
            console.error("initPredictSection function not found");
        }
    }, 100);
}

function goToVisualize() {
    navigateToSection('visualize');
    // Initialize map if it's not already initialized
    if (typeof map === 'undefined') {
        initMap();
    }
}

// Display error messages
function showError(message, elementId = null) {
    const element = elementId ? document.getElementById(elementId) : null;
    
    if (element) {
        element.textContent = message;
        element.parentElement.classList.remove('hidden');
    } else {
        alert(message);
    }
}

// Format file size to human-readable format
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}