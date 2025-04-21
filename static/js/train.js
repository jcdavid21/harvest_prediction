// Train Model JavaScript file
document.addEventListener('DOMContentLoaded', function () {
    // Add event listener for the model training form
    const trainingForm = document.getElementById('model-training-form');
    if (trainingForm) {
        trainingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            trainModel();
        });
    }

    // Add event listener for "Proceed to Predictions" button
    const proceedBtn = document.getElementById('proceed-to-predict');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', function () {
            goToPredict();
        });
    }

    // Check data availability when this script loads
    checkDataAvailability();

    // Also check when navigating to train section
    const trainNavLink = document.querySelector('[data-section="train"]');
    if (trainNavLink) {
        trainNavLink.addEventListener('click', function () {
            checkDataAvailability();
        });
    }

    const togglePreviewBtn = document.getElementById('toggle-preview');
    if (togglePreviewBtn) {
        togglePreviewBtn.addEventListener('click', function () {
            const previewContent = document.getElementById('file-preview-content');
            const isCollapsed = previewContent.classList.contains('collapse');

            if (isCollapsed) {
                previewContent.classList.remove('collapse');
                this.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Preview';

                // Load preview data if not already loaded
                if (document.getElementById('preview-body').children.length === 0) {
                    loadDataPreview();
                }
            } else {
                previewContent.classList.add('collapse');
                this.innerHTML = '<i class="fas fa-chevron-down"></i> Show Preview';
            }
        });
    }

    // Update the checkDataAvailability function to also load preview when data is available
    const originalCheckDataAvailability = checkDataAvailability;
    checkDataAvailability = function () {
        originalCheckDataAvailability();

        // If training form is shown, we have data, so prepare the preview section
        const trainingForm = document.getElementById('training-form');
        if (trainingForm && !trainingForm.classList.contains('hidden')) {
            document.getElementById('data-preview-section').classList.remove('hidden');
        }
    };
});

function checkDataAvailability() {
    console.log("Checking data availability...");

    // Check session storage for crop types (main indicator of data availability)
    const cropTypes = sessionStorage.getItem('cropTypes');

    if (cropTypes) {
        console.log("Data found in session storage:", cropTypes);
        // Show training form since we have data
        const noDataMessage = document.getElementById('no-data-message');
        const trainingForm = document.getElementById('training-form');

        if (noDataMessage) noDataMessage.classList.add('hidden');
        if (trainingForm) trainingForm.classList.remove('hidden');

        // Populate dropdown with crop types
        try {
            populateTargetColumnDropdown(JSON.parse(cropTypes));
        } catch (e) {
            console.error("Error parsing crop types:", e);
        }
    } else {
        console.log("No data found in session storage, checking with server...");

        // Make an AJAX call to check if data is available on the server
        fetch('http://localhost:8800/check_data_availability', {
            method: 'GET',
            credentials: 'include', // Include credentials in the request
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                console.log("Response status:", response.status);
                return response.json();
            })
            .then(data => {
                console.log("Server response:", data);

                if (data.data_available) {
                    console.log("Data available from server");
                    // Store the data in session storage
                    if (data.crop_types && data.crop_types.length > 0) {
                        sessionStorage.setItem('cropTypes', JSON.stringify(data.crop_types));
                    }
                    if (data.regions && data.regions.length > 0) {
                        sessionStorage.setItem('regions', JSON.stringify(data.regions));
                    }
                    if (data.provinces && data.provinces.length > 0) {
                        sessionStorage.setItem('provinces', JSON.stringify(data.provinces));
                    }

                    // Show training form and populate dropdown
                    const noDataMessage = document.getElementById('no-data-message');
                    const trainingForm = document.getElementById('training-form');

                    if (noDataMessage) noDataMessage.classList.add('hidden');
                    if (trainingForm) trainingForm.classList.remove('hidden');

                    if (data.crop_types) {
                        populateTargetColumnDropdown(data.crop_types);
                    }
                } else {
                    console.log("No data available from server");
                    const noDataMessage = document.getElementById('no-data-message');
                    const trainingForm = document.getElementById('training-form');

                    if (noDataMessage) noDataMessage.classList.remove('hidden');
                    if (trainingForm) trainingForm.classList.add('hidden');
                }
            })
            .catch(error => {
                console.error("Error checking data availability:", error);
                // Fallback to showing no data message
                const noDataMessage = document.getElementById('no-data-message');
                const trainingForm = document.getElementById('training-form');

                if (noDataMessage) noDataMessage.classList.remove('hidden');
                if (trainingForm) trainingForm.classList.add('hidden');
            });
    }
}

function loadDataPreview() {
    console.log("Loading data preview...");

    const previewBody = document.getElementById('preview-body');
    // Show loading indicator
    previewBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

    fetch('http://localhost:8800/get_data_preview', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => {
            console.log("Preview response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Preview data:", data);

            if (data.success) {
                // Handle successful data preview
                // Your existing success code here...

                // Update the filename
                document.getElementById('preview-filename').textContent = data.filename;

                // Update statistics
                document.getElementById('stat-rows').textContent = data.stats.row_count;
                document.getElementById('stat-cols').textContent = data.stats.column_count;
                document.getElementById('stat-numeric').textContent = data.stats.numeric_columns.length;
                document.getElementById('stat-missing').textContent = data.stats.missing_values;

                // Populate table header
                const headerRow = document.getElementById('preview-header');
                headerRow.innerHTML = '';

                data.columns.forEach(column => {
                    const th = document.createElement('th');
                    th.textContent = column;
                    // Highlight numeric columns
                    if (data.stats.numeric_columns.includes(column)) {
                        th.classList.add('text-primary');
                    }
                    headerRow.appendChild(th);
                });

                // Populate table body
                const tableBody = document.getElementById('preview-body');
                tableBody.innerHTML = '';

                if (data.preview && data.preview.length > 0) {
                    data.preview.forEach(row => {
                        const tr = document.createElement('tr');

                        data.columns.forEach(column => {
                            const td = document.createElement('td');
                            // Handle undefined, null, and empty values
                            td.textContent = (row[column] !== null && row[column] !== undefined) ?
                                row[column] : 'N/A';

                            // Apply special styling for missing values
                            if (row[column] === null || row[column] === undefined) {
                                td.classList.add('text-muted', 'fst-italic');
                            }

                            tr.appendChild(td);
                        });

                        tableBody.appendChild(tr);
                    });
                } else {
                    // Handle empty preview data
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = data.columns.length;
                    td.textContent = 'No preview data available';
                    td.classList.add('text-center', 'fst-italic');
                    tr.appendChild(td);
                    tableBody.appendChild(tr);
                }
            } else {
                console.error("Failed to get data preview:", data.error);

                // Show a nice error message with action button
                const dataStatus = data.data_status || 'error';

                previewBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center p-4">
                            <div class="alert alert-warning">
                                <h5><i class="fas fa-exclamation-triangle me-2"></i>No Data Available</h5>
                                <p>${data.error || 'No data available for preview'}</p>
                                ${dataStatus === 'missing' ?
                        '<a href="index.php" class="btn btn-primary btn-sm">Go to Data Upload</a>' :
                        '<button class="btn btn-primary btn-sm" onclick="loadDataPreview()">Try Again</button>'}
                            </div>
                        </td>
                    </tr>
                `;

                // Update the header as well
                document.getElementById('preview-header').innerHTML = '<th>Status</th>';
            }
        })
        .catch(error => {
            console.error("Error loading data preview:", error);

            // Show error in a more user-friendly way
            previewBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center p-4">
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-times-circle me-2"></i>Error Loading Preview</h5>
                            <p>${error.message}</p>
                            <button class="btn btn-primary btn-sm mt-2" onclick="loadDataPreview()">Try Again</button>
                        </div>
                    </td>
                </tr>
            `;

            // Update the header as well
            document.getElementById('preview-header').innerHTML = '<th>Error</th>';
        });
}

// Populate the target column dropdown
function populateTargetColumnDropdown(cropTypes) {
    const targetColumn = document.getElementById('targetColumn');
    if (!targetColumn) {
        console.error("Target column dropdown not found");
        return;
    }

    // Clear existing options except the first one
    while (targetColumn.options.length > 1) {
        targetColumn.remove(1);
    }

    // Add crop types as options
    cropTypes.forEach(crop => {
        const option = document.createElement('option');
        option.value = crop;
        option.textContent = crop;
        targetColumn.appendChild(option);
    });
}

function trainModel() {
    // Get form data
    const form = document.getElementById('model-training-form');
    const formData = new FormData(form);

    // Show progress
    document.getElementById('training-form').classList.add('hidden');
    document.getElementById('training-progress').classList.remove('hidden');

    // Initial progress bar
    const progressBar = document.getElementById('train-progress-bar');
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0);
    progressBar.textContent = '0%';

    // Initialize the training progress chart
    initProgressChart();

    // Start polling for progress updates
    const progressInterval = setInterval(checkTrainingProgress, 800);

    // Send AJAX request to Flask backend
    fetch('http://localhost:8800/train', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            // Stop polling
            clearInterval(progressInterval);

            if (data.error) {
                // Better error handling
                console.error("Training error:", data.error);
                showError("Training error: " + data.error);
                document.getElementById('training-progress').classList.add('hidden');
                document.getElementById('training-form').classList.remove('hidden');
            } else {
                // Success - show results
                // Store model availability in session storage
                sessionStorage.setItem('modelTrained', 'true');

                console.log("RECEIVED DATA FROM SERVER:", data);
                console.log("METRICS RECEIVED:", data.metrics);

                if (data.metrics) {
                    console.log("ACCURACY VALUE TYPE:", typeof data.metrics.accuracy);
                    console.log("ACCURACY VALUE:", data.metrics.accuracy);
                    console.log("PREDICTION ERROR:", data.metrics.prediction_error);
                    console.log("R2 VALUE:", data.metrics.r2);
                    console.log("PARSED ACCURACY:", parseFloat(data.metrics.accuracy));
                }

                // Also store any other relevant data
                if (data.feature_importance) {
                    sessionStorage.setItem('featureImportance', JSON.stringify(data.feature_importance));
                    const targetColumn = formData.get('targetColumn');
                    sessionStorage.setItem('trainedTargetColumn', targetColumn);
                }

                if (data.training_loss_plot) {
                    const trainingLossPlot = document.getElementById('training-loss-plot');
                    if (trainingLossPlot) {
                        trainingLossPlot.src = 'data:image/png;base64,' + data.training_loss_plot;
                    }
                }

                // Store time information if available
                if (data.time_info) {
                    sessionStorage.setItem('timeInfo', JSON.stringify(data.time_info));
                }

                document.getElementById('training-progress').classList.add('hidden');
                document.getElementById('training-results').classList.remove('hidden');

                // This code replaces the accuracy calculation part in the trainModel() function
                // Inside the success case of the fetch response in trainModel()

                if (data.metrics) {
                    // Debug logging for troubleshooting
                    console.log("METRICS RECEIVED:", data.metrics);

                    // Display accuracy with prioritization logic
                    let accuracyValue = 'N/A';
                    let accuracyMethod = data.metrics.accuracy_method || 'unknown';

                    // Use the 'accuracy' field which now contains the best calculated accuracy
                    if (data.metrics.accuracy !== undefined &&
                        data.metrics.accuracy !== null &&
                        !isNaN(parseFloat(data.metrics.accuracy))) {

                        const accuracy = parseFloat(data.metrics.accuracy);

                        // Format based on value range
                        if (accuracy === 0) {
                            accuracyValue = '0.00%';
                        } else if (accuracy > 0 && accuracy < 0.01) {
                            accuracyValue = '< 0.01%';
                        } else if (accuracy > 99.99 && accuracy < 100) {
                            accuracyValue = '> 99.99%';
                        } else {
                            accuracyValue = accuracy.toFixed(2) + '%';
                        }

                        // Add a badge indicating the calculation method if available
                        if (accuracyMethod === 'r2_based') {
                            accuracyValue += ' <span class="badge bg-info" title="Based on R² score">R²</span>';
                        }

                        console.log(`Using ${accuracyMethod} accuracy value:`, accuracy, "→", accuracyValue);
                    }

                    // Set the displayed accuracy value
                    document.getElementById('accuracy-value').innerHTML = accuracyValue;

                    // Display other metrics with improved formatting
                    if (data.metrics.rmse !== undefined) {
                        const rmse = parseFloat(data.metrics.rmse);
                        document.getElementById('rmse-value').textContent =
                            !isNaN(rmse) ? rmse.toFixed(4) : 'N/A';
                    }

                    if (data.metrics.r2 !== undefined) {
                        const r2 = parseFloat(data.metrics.r2);
                        document.getElementById('r2-value').textContent =
                            !isNaN(r2) ? r2.toFixed(4) : 'N/A';
                    }

                    // Add additional metrics if available
                    const additionalMetrics = document.getElementById('additional-metrics');
                    if (additionalMetrics) {
                        let metricsHtml = '<div class="alert alert-info mt-3">';
                        metricsHtml += '<h5>Additional Metrics:</h5>';

                        // Add MAPE if available
                        if (data.metrics.mape !== undefined && !isNaN(parseFloat(data.metrics.mape))) {
                            const mape = parseFloat(data.metrics.mape);
                            if (mape > 100) {
                                metricsHtml += `<p><strong>MAPE:</strong> > 100% (high error)</p>`;
                            } else {
                                metricsHtml += `<p><strong>MAPE:</strong> ${mape.toFixed(2)}%</p>`;
                            }
                        }

                        // Add overfitting warning if detected
                        if (data.metrics.is_overfit) {
                            metricsHtml += '<p class="text-warning"><strong>Warning:</strong> Model may be overfitting the data.</p>';
                        }

                        // Add accuracy calculation method explanation
                        if (accuracyMethod === 'r2_based') {
                            metricsHtml += '<p><small>* Accuracy is based on R² score because percentage error calculation was unstable</small></p>';
                        }

                        metricsHtml += '</div>';
                        additionalMetrics.innerHTML = metricsHtml;
                    }
                }

                // Add additional metrics if available
                const additionalMetrics = document.getElementById('additional-metrics');
                if (additionalMetrics && data.metrics.mape !== undefined) {
                    additionalMetrics.innerHTML = `
                        <div class="alert alert-info mt-3">
                            <h5>Additional Metrics:</h5>
                            <p><strong>MAPE:</strong> ${data.metrics.mape.toFixed(2)}%</p>
                            ${data.metrics.is_overfit ?
                            '<p class="text-warning"><strong>Warning:</strong> Model may be overfitting the data.</p>' : ''}
                        </div>
                    `;
                }

                // Update plots
                if (data.prediction_plot) {
                    const predictionPlot = document.getElementById('prediction-plot');
                    if (predictionPlot) {
                        predictionPlot.src = 'data:image/png;base64,' + data.prediction_plot;
                    }
                }

                if (data.residual_plot) {
                    const residualPlot = document.getElementById('residual-plot');
                    if (residualPlot) {
                        residualPlot.src = 'data:image/png;base64,' + data.residual_plot;
                    }
                }

                if (data.feature_importance_plot) {
                    document.getElementById('feature-importance-plot').src = 'data:image/png;base64,' + data.feature_importance_plot;
                }

                // Display model information
                const modelInfo = document.getElementById('model-info');
                if (modelInfo) {
                    modelInfo.innerHTML = `
                        <div class="card mb-3">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">Model Details</h5>
                            </div>
                            <div class="card-body">
                                <p><strong>Target Column:</strong> ${data.target_column}</p>
                                <p><strong>Feature Count:</strong> ${data.feature_count}</p>
                                <p><strong>Sample Count:</strong> ${data.sample_count}</p>
                            </div>
                        </div>
                    `;
                }

                // Log feature importance
                console.log("Feature importance:", data.feature_importance);
            }
        })
        .catch(error => {
            // Stop polling
            clearInterval(progressInterval);

            console.error("Network error:", error);
            showError('Network error: ' + error.message);
            document.getElementById('training-progress').classList.add('hidden');
            document.getElementById('training-form').classList.remove('hidden');
        });
}

// Initialize progress chart
let progressChart = null;
let progressLabels = [];
let progressData = [];

function initProgressChart() {
    // Add a canvas for the chart if it doesn't exist
    let chartContainer = document.getElementById('progress-chart-container');
    if (!chartContainer) {
        chartContainer = document.createElement('div');
        chartContainer.id = 'progress-chart-container';
        chartContainer.className = 'mt-4';
        chartContainer.innerHTML = '<canvas id="progressChart" width="400" height="200"></canvas>';
        document.getElementById('training-progress').appendChild(chartContainer);
    }

    // Reset data arrays
    progressLabels = [];
    progressData = [];

    // Destroy existing chart if it exists
    if (progressChart) {
        progressChart.destroy();
    }

    // Initialize new chart
    const ctx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: progressLabels,
            datasets: [{
                label: 'Training Progress',
                data: progressData,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(75, 192, 192)'
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 500
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Progress (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Model Training Progress'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Progress: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

// Function to update progress chart
function updateProgressChart(progress) {
    if (progressChart) {
        // Add timestamp
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Add data to chart
        progressLabels.push(timeString);
        progressData.push(progress);

        // Keep only the last 10 data points for better visualization
        if (progressLabels.length > 10) {
            progressLabels.shift();
            progressData.shift();
        }

        // Update chart
        progressChart.data.labels = progressLabels;
        progressChart.data.datasets[0].data = progressData;
        progressChart.update();
    }
}

// Function to check training progress
function checkTrainingProgress() {
    fetch('http://localhost:8800/training_progress', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'training') {
                // Update progress bar
                const progressBar = document.getElementById('train-progress-bar');
                progressBar.style.width = data.progress + '%';
                progressBar.setAttribute('aria-valuenow', data.progress);
                progressBar.textContent = data.progress + '%';

                // Update status text
                document.getElementById('training-progress').querySelector('p').textContent =
                    `${data.current_step} (${data.progress}% complete)`;

                // Update progress chart
                updateProgressChart(data.progress);

                // Add real-time metrics if available
                if (data.metrics) {
                    let metricsHtml = '<div class="mt-3">';
                    metricsHtml += '<h6>Current Metrics:</h6>';

                    // Helper function to safely display metric
                    const displayMetric = (value, label, format) => {
                        if (value !== undefined && value !== null && !isNaN(value) && value !== Infinity && value !== -Infinity) {
                            return `<p><strong>${label}:</strong> ${format(value)}</p>`;
                        }
                        return '';
                    };

                    // Apply safe display for each metric
                    metricsHtml += displayMetric(data.metrics.prediction_error, 'Accuracy', v => (100 - v).toFixed(2) + '%');
                    metricsHtml += displayMetric(data.metrics.rmse, 'RMSE', v => v.toFixed(4));
                    metricsHtml += displayMetric(data.metrics.r2, 'R²', v => v.toFixed(4));
                    metricsHtml += displayMetric(data.metrics.mape, 'MAPE', v => v.toFixed(2) + '%');

                    metricsHtml += '</div>';

                    // Update or create metrics div
                    let metricsDiv = document.getElementById('training-progress-metrics');
                    if (!metricsDiv) {
                        metricsDiv = document.createElement('div');
                        metricsDiv.id = 'training-progress-metrics';
                        document.getElementById('training-progress').appendChild(metricsDiv);
                    }
                    metricsDiv.innerHTML = metricsHtml;
                }

                // Add pulsing effect to indicate active training
                const progressSection = document.getElementById('training-progress');
                if (!progressSection.classList.contains('pulse-animation')) {
                    progressSection.classList.add('pulse-animation');
                }
            }
        })
        .catch(error => {
            console.error("Error checking training progress:", error);
            // Display error message to user
            const progressSection = document.getElementById('training-progress');
            progressSection.innerHTML += `<div class="alert alert-danger mt-2">Error checking progress: ${error.message}</div>`;
        });
}

// Utility function to show errors - should be defined in main.js but adding here as backup
function showError(message, elementId = null) {
    const element = elementId ? document.getElementById(elementId) : null;

    if (element) {
        element.textContent = message;
        element.parentElement.classList.remove('hidden');
    } else {
        alert(message);
    }
}

// Function to navigate to the prediction page
function goToPredict() {
    window.location.href = 'predict.php';
}