document.addEventListener('DOMContentLoaded', function () {
    // Check if elements exist before adding event listeners
    const goToUploadBtn = document.getElementById('go-to-upload');
    if (goToUploadBtn) {
        goToUploadBtn.addEventListener('click', function () {
            goToUpload();
        });
    }

    const tryAgainBtn = document.getElementById('try-again');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function () {
            resetUploadForm();
        });
    }

    const proceedToTrainBtn = document.getElementById('proceed-to-train');
    if (proceedToTrainBtn) {
        proceedToTrainBtn.addEventListener('click', function () {
            goToTrain();
        });
    }

    // Only initialize upload area if we're on the upload page
    if (document.getElementById('dropzone')) {
        initUploadArea();
    }
});

function initUploadArea() {
    const dropzone = document.getElementById('dropzone');
    const fileUpload = document.getElementById('file-upload');
    
    if (!dropzone || !fileUpload) {
        console.error("Required upload elements not found");
        return;
    }
    
    const cancelUpload = document.getElementById('cancel-upload');
    const uploadBtn = document.getElementById('upload-btn');

    // File drag and drop events
    dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Click to browse files
    dropzone.addEventListener('click', function (e) {
        if (e.target.tagName !== 'INPUT') {
            fileUpload.click();
        }
    });

    fileUpload.addEventListener('change', function () {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

    // Cancel upload button
    if (cancelUpload) {
        cancelUpload.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            resetUploadForm();
        });
    }

    // Upload button
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function (e) {
            e.preventDefault();  // Prevent any form submission
            e.stopPropagation(); // Stop event propagation

            const fileInput = document.getElementById('file-upload');
            if (fileInput.files.length > 0) {
                uploadFile(fileInput.files[0]);
            } else {
                console.log('No file selected');
            }
        });
    }
}

function handleFile(file) {
    // Check if file is CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showError('Only CSV files are allowed', 'error-message');
        document.getElementById('upload-error').classList.remove('hidden');
        document.getElementById('dropzone').classList.add('hidden');
        return;
    }

    // Display file info
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatFileSize(file.size);

    // Show preview
    document.getElementById('dropzone').classList.add('hidden');
    document.getElementById('upload-preview').classList.remove('hidden');
}

function uploadFile(file) {
    // Display loading state
    const uploadBtn = document.getElementById('upload-btn');
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    console.log('Starting upload of file:', file.name);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Send AJAX request to Flask backend
    fetch('http://localhost:8800/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include credentials in the request
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);

        if (data.error) {
            console.error('Upload error:', data.error);
            showError(data.error, 'error-message');
            document.getElementById('upload-preview').classList.add('hidden');
            document.getElementById('upload-error').classList.remove('hidden');
        } else {
            // Success
            console.log('Upload successful');
            document.getElementById('upload-preview').classList.add('hidden');
            document.getElementById('upload-success').classList.remove('hidden');

            // Store the regions, provinces, and crop types data
            // Use clear key names that match what we check for in train.js
            if (data.regions) {
                sessionStorage.setItem('regions', JSON.stringify(data.regions));
                console.log('Stored regions in session storage');
            }
            if (data.provinces) {
                sessionStorage.setItem('provinces', JSON.stringify(data.provinces));
                console.log('Stored provinces in session storage');
            }
            if (data.crop_types) {
                sessionStorage.setItem('cropTypes', JSON.stringify(data.crop_types));
                console.log('Stored crop types in session storage');
            }
        }
    })
    .catch(error => {
        console.error('Network error:', error);
        showError('Network error: ' + error.message, 'error-message');
        document.getElementById('upload-preview').classList.add('hidden');
        document.getElementById('upload-error').classList.remove('hidden');
    })
    .finally(() => {
        // Reset button state
        uploadBtn.textContent = 'Upload';
        uploadBtn.disabled = false;
    });
}

function resetUploadForm() {
    console.log("Resetting upload form...");
    
    // Reset file input
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.value = '';
    }

    // Hide preview, error, success
    const uploadPreview = document.getElementById('upload-preview');
    if (uploadPreview) {
        uploadPreview.classList.add('hidden');
    }
    
    const uploadError = document.getElementById('upload-error');
    if (uploadError) {
        uploadError.classList.add('hidden');
    }
    
    const uploadSuccess = document.getElementById('upload-success');
    if (uploadSuccess) {
        uploadSuccess.classList.add('hidden');
    }

    // Show dropzone
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        dropzone.classList.remove('hidden');
    }
    
    // Re-initialize the upload area
    setTimeout(() => {
        console.log("Re-initializing upload area");
        initUploadArea();
    }, 100);
}

// Add a utility function for formatting file size if it's not defined in main.js
if (typeof formatFileSize !== 'function') {
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Add a utility function for showing errors if it's not defined in main.js
if (typeof showError !== 'function') {
    function showError(message, elementId = null) {
        const element = elementId ? document.getElementById(elementId) : null;
        
        if (element) {
            element.textContent = message;
            element.parentElement.classList.remove('hidden');
        } else {
            alert(message);
        }
    }
}