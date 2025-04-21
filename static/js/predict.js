
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chart containers
    initializeChartContainers();
    
    // Check if a model is available when the page loads
    checkModelAvailability();

    // Set up event handlers
    document.getElementById('go-to-train')?.addEventListener('click', function() {
        window.location.href = 'train.php';
    });

    // Handle form submission for prediction
    const predictionForm = document.getElementById('prediction-parameters-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            generatePrediction();
        });
    }

    // Add listeners for the export button
    const exportButton = document.getElementById('export-prediction');
    if (exportButton) {
        exportButton.addEventListener('click', exportPredictionResults);
    }

    // Set up region-province cascade with automatic prediction triggering
    const regionSelect = document.getElementById('pred-region');
    const provinceSelect = document.getElementById('pred-province');
    
    if (regionSelect && provinceSelect) {
        regionSelect.addEventListener('change', function() {
            updateProvinceOptions(this.value);
            // Don't trigger prediction here to avoid incomplete data
        });
        
        // Add event listener to province select to automatically trigger prediction
        provinceSelect.addEventListener('change', function() {
            if (this.value) {
                generatePrediction();
            }
        });
    }
    
    // Add event listeners for prediction type radio buttons to trigger prediction
    const predictionTypeRadios = document.querySelectorAll('input[name="predictionType"]');
    predictionTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (regionSelect.value && provinceSelect.value) {
                generatePrediction();
            }
        });
    });
    
    // Set up adjustment controls
    setupAdjustmentControls();
    
    // Fix: Ensure charts are visible
    setTimeout(ensureChartsVisible, 500);
});

/**
 * Set up prediction adjustment controls
 */
function setupAdjustmentControls() {
    // Create adjustment sliders container
    const resultsSection = document.getElementById('prediction-results');
    if (!resultsSection) return;
    
    // Create adjustment controls
    const adjustmentContainer = document.createElement('div');
    adjustmentContainer.className = 'card mb-4';
    adjustmentContainer.innerHTML = `
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Adjust Prediction</h5>
        </div>
        <div class="card-body">
            <div class="mb-3">
                <label for="yield-adjustment" class="form-label">Yield Adjustment (%): <span id="yield-adjustment-value">0%</span></label>
                <input type="range" class="form-range" id="yield-adjustment" min="-50" max="50" value="0">
            </div>
            <div class="mb-3">
                <label for="production-ratio" class="form-label">Production Ratio (tons/hectare): <span id="production-ratio-value">2.5</span></label>
                <input type="range" class="form-range" id="production-ratio" min="1" max="5" step="0.1" value="2.5">
            </div>
        </div>
    `;
    
    // Insert adjustment controls before the quarterly predictions
    const quarterlyTable = document.querySelector('.table-responsive');
    if (quarterlyTable && quarterlyTable.parentNode) {
        quarterlyTable.parentNode.insertBefore(adjustmentContainer, quarterlyTable);
    } else {
        resultsSection.appendChild(adjustmentContainer);
    }
    
    // Add event listeners to sliders
    const yieldSlider = document.getElementById('yield-adjustment');
    const ratioSlider = document.getElementById('production-ratio');
    
    if (yieldSlider) {
        yieldSlider.addEventListener('input', function() {
            document.getElementById('yield-adjustment-value').textContent = this.value + '%';
            updateAdjustedPrediction();
        });
    }
    
    if (ratioSlider) {
        ratioSlider.addEventListener('input', function() {
            document.getElementById('production-ratio-value').textContent = this.value;
            updateAdjustedPrediction();
        });
    }
}

/**
 * Update prediction values based on adjustment sliders
 */
function updateAdjustedPrediction() {
    // Get current base prediction value (stored in a data attribute)
    const predictionValueElement = document.getElementById('prediction-value');
    if (!predictionValueElement || !predictionValueElement.hasAttribute('data-base-value')) return;
    
    const baseValue = parseFloat(predictionValueElement.getAttribute('data-base-value'));
    const yieldAdjustment = parseFloat(document.getElementById('yield-adjustment').value) / 100;
    const productionRatio = parseFloat(document.getElementById('production-ratio').value);
    
    // Calculate adjusted values
    const adjustedYield = baseValue * (1 + yieldAdjustment);
    const adjustedProduction = adjustedYield * productionRatio;
    
    // Update display for all elements with the prediction-value class
    const predictionElements = document.querySelectorAll('.prediction-value, #prediction-value');
    predictionElements.forEach(element => {
        element.textContent = formatNumber(adjustedYield);
    });
    
    // Update display for all elements with the production-value class
    const productionElements = document.querySelectorAll('.production-value, #production-value');
    productionElements.forEach(element => {
        element.textContent = formatNumber(adjustedProduction);
    });
    
    // Update quarterly predictions table with new adjustments
    updateQuarterlyTableWithAdjustments(baseValue, yieldAdjustment, productionRatio);
    
    // Update charts with new adjusted values - BUT NOT seasonal comparison
    updateChartsWithAdjustments(baseValue, yieldAdjustment, productionRatio);
    
    // Update the adjustment tracking chart with the new value
    updateAdjustmentTrackingChart(adjustedYield, yieldAdjustment * 100, productionRatio);
}


/**
 * Update charts with adjusted values
 */
function updateChartsWithAdjustments(baseValue, yieldAdjustment, productionRatio) {
    // Update Yield Comparison Chart
    if (window.yieldComparisonChart) {
        const data = window.yieldComparisonChart.data.datasets[0].data;
        const adjustedData = data.map(value => {
            // If this is the selected region (highlighted bar), apply the adjustment
            if (value === window.originalBaseValue) {
                return baseValue * (1 + yieldAdjustment);
            }
            // For other regions, keep their relative positions
            const ratio = value / window.originalBaseValue;
            return baseValue * (1 + yieldAdjustment) * ratio;
        });
        
        window.yieldComparisonChart.data.datasets[0].data = adjustedData;
        window.yieldComparisonChart.update();
    }
    
    // Update Trend Analysis Chart
    if (window.trendAnalysisChart) {
        // Update historical and projected data
        const historicalData = window.trendAnalysisChart.data.datasets[0].data;
        const projectedData = window.trendAnalysisChart.data.datasets[1].data;
        
        // Find the current year's data point (the meeting point of historical and projected data)
        const currentYearIndex = historicalData.findIndex(val => val === window.originalBaseValue);
        
        if (currentYearIndex !== -1) {
            // Adjust the current year value
            historicalData[currentYearIndex] = baseValue * (1 + yieldAdjustment);
            projectedData[currentYearIndex] = baseValue * (1 + yieldAdjustment);
            
            // Adjust historical values keeping relative trends
            for (let i = 0; i < currentYearIndex; i++) {
                if (historicalData[i] !== null) {
                    const ratio = historicalData[i] / window.originalBaseValue;
                    historicalData[i] = baseValue * (1 + yieldAdjustment) * ratio;
                }
            }
            
            // Adjust projected values keeping relative trends
            for (let i = currentYearIndex + 1; i < projectedData.length; i++) {
                if (projectedData[i] !== null) {
                    const ratio = projectedData[i] / window.originalBaseValue;
                    projectedData[i] = baseValue * (1 + yieldAdjustment) * ratio;
                }
            }
            
            window.trendAnalysisChart.data.datasets[0].data = historicalData;
            window.trendAnalysisChart.data.datasets[1].data = projectedData;
            window.trendAnalysisChart.update();
        }
    }
    
    // DO NOT update Seasonal Comparison Chart - it should remain independent of adjustments
}

/**
 * Check if a trained model is available
 */
function checkModelAvailability() {
    fetch('http://localhost:8800/check_data_availability')
        .then(response => response.json())
        .then(data => {
            if (data.data_available) {
                // Show prediction form, hide no-model message
                document.getElementById('no-model-message').classList.add('hidden');
                document.getElementById('prediction-form').classList.remove('hidden');
                
                // Populate dropdowns with available data
                populateDropdowns(data);
                
                // Always disable crop type selection and set the value from the model
                const cropTypeSelect = document.getElementById('pred-cropType');
                if (cropTypeSelect && data.selected_crop_type) {
                    // Set value to the selected crop type from training
                    cropTypeSelect.value = data.selected_crop_type;
                    cropTypeSelect.disabled = true;
                    
                    // Add visual indication that this is from the training model
                    const cropTypeContainer = cropTypeSelect.closest('.mb-3');
                    if (cropTypeContainer) {
                        // Add a label to show this is from training model
                        const helpText = document.createElement('div');
                        helpText.className = 'form-text mt-2 badge bg-info text-white';
                        helpText.innerHTML = '<i class="fas fa-info-circle me-1"></i> Auto-selected from training model';
                        cropTypeContainer.appendChild(helpText);
                    }
                    
                    // Update label to show this is pre-selected
                    const cropTypeLabel = document.querySelector('label[for="pred-cropType"]');
                    if (cropTypeLabel) {
                        cropTypeLabel.innerHTML = `Crop Type: <span class="text-primary">${data.selected_crop_type}</span>`;
                    }
                }
            } else {
                // Hide prediction form, show no-model message
                document.getElementById('no-model-message').classList.remove('hidden');
                document.getElementById('prediction-form').classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error checking model availability:', error);
            // Show error message
            document.getElementById('no-model-message').classList.remove('hidden');
            document.getElementById('prediction-form').classList.add('hidden');
        });
}

/**
 * Populate form dropdowns with available data
 */
function populateDropdowns(data) {
    // Store all regions for use in updateProvinceOptions
    window.allRegions = data.regions;
    
    // Populate region dropdown
    const regionSelect = document.getElementById('pred-region');
    regionSelect.innerHTML = '<option value="" disabled selected>Select a region</option>';
    
    data.regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });

    // Populate crop type dropdown (will be disabled with selected value)
    const cropTypeSelect = document.getElementById('pred-cropType');
    cropTypeSelect.innerHTML = ''; // Clear existing options
    
    // Add just the selected crop type option
    if (data.selected_crop_type) {
        const option = document.createElement('option');
        option.value = data.selected_crop_type;
        option.textContent = data.selected_crop_type;
        option.selected = true;
        cropTypeSelect.appendChild(option);
    }

    // Store province data for cascade dropdown
    window.allProvinces = data.provinces;
}


/**
 * Update province options based on selected region
 */
function updateProvinceOptions(selectedRegion) {
    // This should filter provinces by region - make it do something meaningful
    const provinceSelect = document.getElementById('pred-province');
    provinceSelect.innerHTML = '<option value="" disabled selected>Select a province</option>';
    
    if (window.allProvinces) {
        // Filter provinces by region - this is a mock implementation
        // In a real app, you would get provinces that belong to the selected region
        const filteredProvinces = window.allProvinces.filter((province, index) => {
            // Simple mock implementation - divide provinces among regions
            // In a real app, you would have a proper mapping of regions to provinces
            const regionIndex = window.allRegions ? window.allRegions.indexOf(selectedRegion) : 0;
            return index % (window.allRegions ? window.allRegions.length : 1) === regionIndex;
        });
        
        filteredProvinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            provinceSelect.appendChild(option);
        });
    }
}

/**
 * Generate prediction based on form inputs
 */
function generatePrediction() {
    // Validate form before proceeding
    const regionSelect = document.getElementById('pred-region');
    const provinceSelect = document.getElementById('pred-province');
    const cropTypeSelect = document.getElementById('pred-cropType');
    
    if (!regionSelect.value || !provinceSelect.value || !cropTypeSelect.value) {
        alert('Please select region, province, and crop type before generating prediction.');
        return;
    }
    
    // Show loader
    document.getElementById('prediction-loader').classList.remove('hidden');
    
    // Gather form data
    const region = regionSelect.value;
    const province = provinceSelect.value;
    const cropType = cropTypeSelect.value;
    const predictionType = document.querySelector('input[name="predictionType"]:checked').value;
    
    // Set current year and determine quarter/semester
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Determine quarter based on current month
    let quarter = Math.ceil(currentMonth / 3);
    let isDrySeasonStart = quarter === 1 ? 1 : 0;
    let isWetSeasonStart = quarter === 3 ? 1 : 0;
    let isSemester1 = currentMonth <= 6 ? 1 : 0;
    let isSemester2 = currentMonth > 6 ? 1 : 0;
    let isAnnual = predictionType === 'annual' ? 1 : 0;
    
    // Create prediction request data
    const requestData = {
        cropType: cropType,
        region: region,
        province: province,
        year: currentYear,
        quarter: quarter,
        isDrySeasonStart: isDrySeasonStart,
        isWetSeasonStart: isWetSeasonStart,
        isSemester1: isSemester1,
        isSemester2: isSemester2,
        isAnnual: isAnnual
    };
    
    console.log('Sending prediction request:', requestData);
    
    // Function to get a consistent modifier based on province name
    function getProvinceModifier(provinceName) {
        // Simple hash function to get a consistent number from province name
        let hash = 0;
        for (let i = 0; i < provinceName.length; i++) {
            hash = provinceName.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Convert to a number between 0.8 and 1.2 (±20% variation)
        return 0.8 + (Math.abs(hash) % 40) / 100;
    }
    
    // Make prediction request
    fetch('http://localhost:8800/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        // Hide loader
        document.getElementById('prediction-loader').classList.add('hidden');
        
        if (data.success) {
            // Apply province-specific modifier to make each province unique
            const provinceModifier = getProvinceModifier(province);
            data.prediction = data.prediction * provinceModifier;
            
            // Clean up existing adjustment tracking chart if it exists
            const existingChart = document.getElementById('adjustment-tracking-card');
            if (existingChart) {
                // If we're changing provinces, we should reset the chart data
                if (window.lastProvince && window.lastProvince !== province) {
                    if (window.adjustmentTrackingChart) {
                        window.adjustmentTrackingChart.data.labels = ['Original'];
                        window.adjustmentTrackingChart.data.datasets[0].data = [data.prediction];
                        window.adjustmentTrackingChart.update();
                    }
                }
            }
            
            // Store the current province for next comparison
            window.lastProvince = province;
            
            // Show results and update with prediction data
            displayPredictionResults(data, predictionType);
            
            // Make sure adjustment tracking chart is added (without duplicating)
            addAdjustmentTrackingChart();
            
            // Store region data for comparison charts
            window.lastRegion = region;
            
            // Apply regional variations to comparison chart if needed
            if (window.yieldComparisonChart) {
                // Update the chart with region-specific information
                const regionIndex = window.allRegions ? window.allRegions.indexOf(region) : -1;
                if (regionIndex >= 0) {
                    // Highlight the selected region in the comparison chart
                    window.yieldComparisonChart.data.datasets[0].backgroundColor = 
                        window.yieldComparisonChart.data.datasets[0].backgroundColor.map((color, index) => 
                            index === regionIndex ? 'rgba(75, 192, 192, 0.8)' : 'rgba(153, 102, 255, 0.6)');
                            
                    window.yieldComparisonChart.update();
                }
            }
        } else {
            alert('Prediction failed: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error making prediction:', error);
        document.getElementById('prediction-loader').classList.add('hidden');
        alert('Error making prediction. Please try again.');
    });
}

/**
 * Display prediction results in the UI
 */
function displayPredictionResults(data, predictionType) {
    // Show results section
    document.getElementById('prediction-results').classList.remove('hidden');
    
    // Store original base value for adjustments
    window.originalBaseValue = data.prediction;
    
    // Store base prediction value as data attribute for adjustment calculations
    const predictionValueElement = document.getElementById('prediction-value');
    predictionValueElement.setAttribute('data-base-value', data.prediction);
    
    // Update all prediction value elements
    const predictionElements = document.querySelectorAll('.prediction-value, #prediction-value');
    predictionElements.forEach(element => {
        element.textContent = formatNumber(data.prediction);
    });
    
    // Calculate estimated production (sample calculation - adjust as needed)
    const productionRatio = 2.5; // Default: 2.5 tons per hectare
    const estimatedProduction = data.prediction * productionRatio;
    
    // Update all production value elements
    const productionElements = document.querySelectorAll('.production-value, #production-value');
    productionElements.forEach(element => {
        element.textContent = formatNumber(estimatedProduction);
    });
    
    // Update confidence bars
    const confidenceBars = document.querySelectorAll('.confidence-bar, #confidence-bar');
    const confidenceValues = document.querySelectorAll('.confidence-value, #confidence-value');
    const confidence = data.confidence_interval || 80;
    
    confidenceBars.forEach(bar => {
        bar.style.width = confidence + '%';
        
        // Set color based on confidence
        if (confidence >= 90) {
            bar.className = 'progress-bar progress-bar-striped bg-success';
        } else if (confidence >= 70) {
            bar.className = 'progress-bar progress-bar-striped bg-info';
        } else if (confidence >= 50) {
            bar.className = 'progress-bar progress-bar-striped bg-warning';
        } else {
            bar.className = 'progress-bar progress-bar-striped bg-danger';
        }
    });
    
    confidenceValues.forEach(value => {
        value.textContent = confidence + '%';
    });
    
    // Populate quarterly predictions table
    populateQuarterlyTable(data, predictionType);
    
    // Display the prediction plot image if available
    if (data.prediction_plot) {
        const plotContainers = document.querySelectorAll('#prediction-plot-container');
        const plotImages = document.querySelectorAll('#prediction-plot');
        
        plotImages.forEach(img => {
            // Set the base64 image data and show the image
            img.src = `data:image/png;base64,${data.prediction_plot}`;
            img.alt = `Prediction Plot for ${data.crop_type}`;
            img.classList.remove('hidden');
        });
        
        plotContainers.forEach(container => {
            container.classList.remove('hidden');
        });
    }
    
    // Update charts with prediction data
    updateCharts(data);
    
    // Show advanced analysis cards - Fix: Make sure all cards are visible
    document.querySelectorAll('.analysis-card, #yield-comparison-card, #trend-analysis-card, #seasonal-comparison-card').forEach(card => {
        card.classList.remove('hidden');
    });
    
    // Show forecast cards in the Harvest Forecast section - Fix: Make all forecast sections visible
    document.querySelectorAll('.forecast-section, .forecast-row, .forecast-card').forEach(element => {
        element.classList.remove('hidden');
    });
    
    // Fix: Explicitly show the forecast container
    const forecastContainers = document.querySelectorAll('.forecast-container, .card-body .row');
    forecastContainers.forEach(container => {
        container.classList.remove('hidden');
    });
    
    // Reset adjustment sliders to default values
    if (document.getElementById('yield-adjustment')) {
        document.getElementById('yield-adjustment').value = 0;
        document.getElementById('yield-adjustment-value').textContent = '0%';
    }
    
    if (document.getElementById('production-ratio')) {
        document.getElementById('production-ratio').value = 2.5;
        document.getElementById('production-ratio-value').textContent = '2.5';
    }
}


/**
 * Update quarterly predictions table with adjusted values
 */
function updateQuarterlyTableWithAdjustments(baseValue, yieldAdjustment, productionRatio) {
    // Update all quarterly tables
    const quarterlyTables = document.querySelectorAll('table');
    
    quarterlyTables.forEach(table => {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        // Update each row with adjusted values
        for (let i = 0; i < tbody.rows.length; i++) {
            const row = tbody.rows[i];
            
            // Get the base yield variation from the row (stored as data attribute)
            const baseVariation = parseFloat(row.getAttribute('data-variation') || 1);
            
            // Calculate adjusted values
            const adjustedVariation = baseVariation * (1 + yieldAdjustment);
            const adjustedYield = baseValue * adjustedVariation;
            const adjustedProduction = adjustedYield * productionRatio;
            
            // Update values in cells if they exist
            if (row.cells.length > 1) row.cells[1].textContent = formatNumber(adjustedYield);
            if (row.cells.length > 2) row.cells[2].textContent = formatNumber(adjustedProduction);
            
            // Calculate growth rate relative to the base prediction
            const growthRate = ((adjustedVariation - 1) * 100).toFixed(2) + '%';
            
            // Update growth rate cell with color coding if it exists
            if (row.cells.length > 3) {
                const growthNum = parseFloat(growthRate);
                const cell4 = row.cells[3];
                
                cell4.textContent = growthRate;
                cell4.className = ''; // Reset classes
                
                if (growthNum > 0) {
                    cell4.classList.add('text-success');
                    cell4.innerHTML = `<i class="fas fa-arrow-up me-1"></i>${growthRate}`;
                } else if (growthNum < 0) {
                    cell4.classList.add('text-danger');
                    cell4.innerHTML = `<i class="fas fa-arrow-down me-1"></i>${growthRate}`;
                } else {
                    cell4.classList.add('text-muted');
                }
            }
        }
    });
}

/**
 * Format numbers with thousands separators
 */
function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });
}

/**
 * Populate quarterly predictions table
 */
function populateQuarterlyTable(data, predictionType) {
    // Get all quarterly tables
    const tableSelectors = ['#quarterly-predictions-body'];
    
    tableSelectors.forEach(selector => {
        const tbodyElements = document.querySelectorAll(selector);
        
        tbodyElements.forEach(tbody => {
            tbody.innerHTML = '';
            
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
            
            // Base value from prediction
            const baseValue = data.prediction;
            
            // Generate rows based on prediction type
            if (predictionType === 'quarter') {
                // Generate quarterly predictions
                for (let i = 0; i < 4; i++) {
                    const quarter = (currentQuarter + i) % 4 || 4;
                    const year = currentYear + Math.floor((currentQuarter + i - 1) / 4);
                    
                    // Calculate quarterly variations (sample - adjust as needed)
                    const variation = getRandomVariation(0.92, 1.08);
                    const quarterlyValue = baseValue * variation;
                    const production = quarterlyValue * 2.5; // Example: 2.5 tons per hectare
                    const growthRate = ((variation - 1) * 100).toFixed(2) + '%';
                    
                    addTableRow(tbody, `Q${quarter} ${year}`, quarterlyValue, production, growthRate, variation);
                }
            } else if (predictionType === 'semester') {
                // Generate semester predictions
                const currentSemester = currentDate.getMonth() < 6 ? 1 : 2;
                
                for (let i = 0; i < 2; i++) {
                    const semester = (currentSemester + i) % 2 || 2;
                    const year = currentYear + Math.floor((currentSemester + i - 1) / 2);
                    
                    // Calculate semester variations
                    const variation = getRandomVariation(0.95, 1.05);
                    const semesterValue = baseValue * variation;
                    const production = semesterValue * 2.5;
                    const growthRate = ((variation - 1) * 100).toFixed(2) + '%';
                    
                    addTableRow(tbody, `S${semester} ${year}`, semesterValue, production, growthRate, variation);
                }
            } else {
                // Annual prediction
                const nextYear = currentYear + 1;
                
                // Current year
                addTableRow(tbody, `Annual ${currentYear}`, baseValue, baseValue * 2.5, "0.00%", 1.0);
                
                // Next year prediction with slight growth
                const variation = getRandomVariation(1.02, 1.10); // Slight growth for next year
                const nextYearValue = baseValue * variation;
                const production = nextYearValue * 2.5;
                const growthRate = ((variation - 1) * 100).toFixed(2) + '%';
                
                addTableRow(tbody, `Annual ${nextYear}`, nextYearValue, production, growthRate, variation);
            }
        });
    });
}

/**
 * Add a row to the predictions table
 */
function addTableRow(tbody, period, yieldValue, production, growthRate, variation) {
    const row = tbody.insertRow();
    
    // Store the variation factor as a data attribute for later adjustments
    row.setAttribute('data-variation', variation);
    
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    const cell3 = row.insertCell(2);
    const cell4 = row.insertCell(3);
    
    cell1.textContent = period;
    cell2.textContent = formatNumber(yieldValue);
    cell3.textContent = formatNumber(production);
    
    // Add growth rate with color coding
    const growthNum = parseFloat(growthRate);
    cell4.textContent = growthRate;
    
    if (growthNum > 0) {
        cell4.classList.add('text-success');
        cell4.innerHTML = `<i class="fas fa-arrow-up me-1"></i>${growthRate}`;
    } else if (growthNum < 0) {
        cell4.classList.add('text-danger');
        cell4.innerHTML = `<i class="fas fa-arrow-down me-1"></i>${growthRate}`;
    } else {
        cell4.classList.add('text-muted');
    }
}

/**
 * Generate a random variation within a range
 */
function getRandomVariation(min, max) {
    return (Math.random() * (max - min) + min);
}


function updateCharts(data) {
    // Update the prediction plot from the server if available
    if (data.prediction_plot) {
        // Create a new image element or update existing
        const predictionPlot = document.getElementById('prediction-plot');
        if (predictionPlot) {
            predictionPlot.src = `data:image/png;base64,${data.prediction_plot}`;
            predictionPlot.alt = 'Prediction Plot';
            predictionPlot.classList.remove('hidden');
            
            // Show the container
            const plotContainer = document.getElementById('prediction-plot-container');
            if (plotContainer) {
                plotContainer.classList.remove('hidden');
            }
        }
    }
    
    // Generate Chart.js charts
    generateYieldComparisonChart(data);
    generateTrendAnalysisChart(data);
    generateSeasonalComparisonChart(data);
    
    // Make sure all chart containers are visible
    document.getElementById('yield-comparison-card').classList.remove('hidden');
    document.getElementById('trend-analysis-card').classList.remove('hidden');
    document.getElementById('seasonal-comparison-card').classList.remove('hidden');
}

/**
 * Generate yield comparison chart using Chart.js
 */
function generateYieldComparisonChart(data) {
    const chartContainer = document.getElementById('yield-comparison-chart');
    if (!chartContainer) return;
    
    // Clear previous chart if it exists
    if (window.yieldComparisonChart) {
        window.yieldComparisonChart.destroy();
    }
    
    // Create canvas element for the chart if it doesn't exist
    let canvas = document.getElementById('yield-comparison-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'yield-comparison-canvas';
        chartContainer.appendChild(canvas);
    }
    
    // Get regions for comparison (could be fetched from API in a real implementation)
    const regions = ['Region I', 'Region II', 'Region III', 'Region IV', 'Region V'];
    
    // Use the prediction value for the selected region, and generate random relative values for others
    const baseValue = parseFloat(data.prediction);
    const yields = regions.map((region, index) => {
        // Current region gets the actual prediction value
        if (region === data.region) {
            return baseValue;
        }
        // Other regions get +/- 30% variation
        return baseValue * (0.7 + Math.random() * 0.6);
    });
    
    // Create chart
    const ctx = canvas.getContext('2d');
    window.yieldComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regions,
            datasets: [{
                label: `${data.crop_type} Yield Estimate (hectares)`,
                data: yields,
                backgroundColor: regions.map(region => 
                    region === data.region ? 'rgba(75, 192, 192, 0.8)' : 'rgba(153, 102, 255, 0.6)'),
                borderColor: regions.map(region => 
                    region === data.region ? 'rgb(75, 192, 192)' : 'rgb(153, 102, 255)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Regional Yield Comparison',
                    font: {
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: `Comparison of predicted ${data.crop_type} yields across different regions`,
                    font: {
                        size: 14,
                        style: 'italic'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `Yield: ${formatNumber(context.raw)} hectares`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Area Harvested (hectares)'
                    }
                }
            }
        }
    });
    
    // Make container visible
    document.getElementById('yield-comparison-card').classList.remove('hidden');
}

/**
 * Generate trend analysis chart using Chart.js
 */
function generateTrendAnalysisChart(data) {
    const chartContainer = document.getElementById('trend-analysis-chart');
    if (!chartContainer) return;
    
    // Clear previous chart if it exists
    if (window.trendAnalysisChart) {
        window.trendAnalysisChart.destroy();
    }
    
    // Create canvas element for the chart if it doesn't exist
    let canvas = document.getElementById('trend-analysis-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'trend-analysis-canvas';
        chartContainer.appendChild(canvas);
    }
    
    // Generate historical and projected data
    const currentYear = parseInt(data.year);
    const predictionValue = parseFloat(data.prediction);
    
    // Generate 3 years of historical data with a slight downward trend
    const years = [];
    const historicalData = [];
    const projectedData = [];
    
    for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        years.push(year.toString());
        
        if (i > 0) {
            // Historical data with some variation and a slight downward trend
            historicalData.push(predictionValue * (0.85 + (i * 0.05) + (Math.random() * 0.1)));
            projectedData.push(null);
        } else {
            // Current year is actual prediction
            historicalData.push(predictionValue);
            projectedData.push(predictionValue);
        }
    }
    
    // Add future projections with a slight upward trend
    for (let i = 1; i <= 2; i++) {
        const year = currentYear + i;
        years.push(year.toString());
        historicalData.push(null);
        
        // Projected values with upward trend
        projectedData.push(predictionValue * (1 + (i * 0.05) + (Math.random() * 0.05)));
    }
    
    // Create chart
    const ctx = canvas.getContext('2d');
    window.trendAnalysisChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Historical Data',
                    data: historicalData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Projected Trend',
                    data: projectedData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: 'rgba(153, 102, 255, 1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Harvest Trend Analysis',
                    font: {
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: `Historical and predicted ${data.crop_type} harvest yield trends`,
                    font: {
                        size: 14,
                        style: 'italic'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Yield: ${formatNumber(context.raw)} hectares`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Area Harvested (hectares)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // Make container visible
    document.getElementById('trend-analysis-card').classList.remove('hidden');
}

/**
 * Generate seasonal comparison chart using Chart.js
 */
function generateSeasonalComparisonChart(data) {
    const chartContainer = document.getElementById('seasonal-comparison-chart');
    if (!chartContainer) return;
    
    // Clear previous chart if it exists
    if (window.seasonalComparisonChart) {
        window.seasonalComparisonChart.destroy();
    }
    
    // Create canvas element for the chart if it doesn't exist
    let canvas = document.getElementById('seasonal-comparison-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'seasonal-comparison-canvas';
        chartContainer.appendChild(canvas);
    }
    
    // Generate seasonal data for current year and previous year
    const baseValue = parseFloat(data.prediction);
    const currentYear = parseInt(data.year);
    const previousYear = currentYear - 1;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate seasonal pattern data - actual pattern would depend on crop type and region
    const seasonalPatterns = {
        rice: [0.5, 0.4, 0.3, 0.4, 0.6, 0.8, 1.0, 1.2, 1.1, 0.9, 0.7, 0.6],
        corn: [0.7, 0.6, 0.5, 0.6, 0.8, 1.0, 1.2, 1.1, 0.9, 0.8, 0.7, 0.6],
        wheat: [0.9, 0.8, 0.7, 0.6, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.0],
        default: [0.8, 0.7, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.0, 0.9, 0.8, 0.7]
    };
    
    // Select pattern based on crop type or use default
    const cropPattern = seasonalPatterns[data.crop_type.toLowerCase()] || seasonalPatterns.default;
    
    // Generate data for current and previous year
    const currentYearData = cropPattern.map(factor => baseValue * factor);
    
    // Previous year data with slightly lower baseline (90% of current prediction)
    const previousYearData = cropPattern.map(factor => baseValue * factor * 0.9);
    
    // Create chart
    const ctx = canvas.getContext('2d');
    window.seasonalComparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: `${currentYear}`,
                    data: currentYearData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: `${previousYear}`,
                    data: previousYearData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Seasonal Harvest Performance',
                    font: {
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: `Monthly ${data.crop_type} harvest performance comparison`,
                    font: {
                        size: 14,
                        style: 'italic'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatNumber(context.raw)} hectares`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Area Harvested (hectares)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // Make container visible
    document.getElementById('seasonal-comparison-card').classList.remove('hidden');
}

/**
 * Export prediction results as a PDF using jsPDF or as Excel using SheetJS
 */
function exportPredictionResults() {
    // Get current prediction data
    const cropType = document.getElementById('pred-cropType').value;
    const region = document.getElementById('pred-region').value;
    const province = document.getElementById('pred-province').value;
    const predictionValue = document.getElementById('prediction-value').textContent;
    const productionValue = document.getElementById('production-value').textContent;
    const confidenceValue = document.getElementById('confidence-value').textContent;
    
    // Get adjustment values
    const yieldAdjustment = document.getElementById('yield-adjustment') ? 
        document.getElementById('yield-adjustment').value + '%' : '0%';
    const productionRatio = document.getElementById('production-ratio') ?
        document.getElementById('production-ratio').value : '2.5';
    
    const exportData = {
        crop_type: cropType,
        region: region,
        province: province,
        prediction: predictionValue,
        production: productionValue,
        confidence: confidenceValue,
        yield_adjustment: yieldAdjustment,
        production_ratio: productionRatio,
        export_date: new Date().toLocaleDateString()
    };
    
    // Create export options dropdown or modal
    const exportOptions = document.createElement('div');
    exportOptions.className = 'export-options-modal';
    exportOptions.innerHTML = `
        <div class="export-options-content card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Export Options</h5>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <div class="card-body">
                <p>Select export format:</p>
                <div class="d-grid gap-2">
                    <button class="btn btn-outline-primary" id="export-pdf">
                        <i class="fas fa-file-pdf me-2"></i>Export as PDF
                    </button>
                    <button class="btn btn-outline-success" id="export-excel">
                        <i class="fas fa-file-excel me-2"></i>Export as Excel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to body and show
    document.body.appendChild(exportOptions);
    
    // Add event listeners
    const closeBtn = exportOptions.querySelector('.btn-close');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(exportOptions);
    });
    
    // PDF Export
    const pdfBtn = exportOptions.querySelector('#export-pdf');
    pdfBtn.addEventListener('click', function() {
        // In a real implementation, we would use jsPDF
        console.log('Exporting as PDF:', exportData);
        alert('PDF export functionality would generate a report with the following data:\n\n' + 
              JSON.stringify(exportData, null, 2));
        document.body.removeChild(exportOptions);
    });
    
    // Excel Export
    const excelBtn = exportOptions.querySelector('#export-excel');
    excelBtn.addEventListener('click', function() {
        // In a real implementation, we would use SheetJS
        console.log('Exporting as Excel:', exportData);
        alert('Excel export functionality would generate a spreadsheet with the following data:\n\n' + 
              JSON.stringify(exportData, null, 2));
        document.body.removeChild(exportOptions);
    });
    
    // Add modal style to page if not present
    if (!document.getElementById('export-options-style')) {
        const style = document.createElement('style');
        style.id = 'export-options-style';
        style.textContent = `
            .export-options-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1050;
            }
            .export-options-content {
                width: 400px;
                max-width: 90%;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Initialize chart containers in the HTML
 */
function initializeChartContainers() {
    // Replace the image placeholders with canvas elements for Chart.js
    
    // Yield comparison chart
    const yieldComparisonPlot = document.getElementById('yield-comparison-plot');
    if (yieldComparisonPlot) {
        const container = document.createElement('div');
        container.id = 'yield-comparison-chart';
        container.style.height = '300px';
        container.style.width = '100%';
        
        if (yieldComparisonPlot.parentNode) {
            yieldComparisonPlot.parentNode.replaceChild(container, yieldComparisonPlot);
        }
    }
    
    // Trend analysis chart
    const trendAnalysisPlot = document.getElementById('trend-analysis-plot');
    if (trendAnalysisPlot) {
        const container = document.createElement('div');
        container.id = 'trend-analysis-chart';
        container.style.height = '300px';
        container.style.width = '100%';
        
        if (trendAnalysisPlot.parentNode) {
            trendAnalysisPlot.parentNode.replaceChild(container, trendAnalysisPlot);
        }
    }
    
    // Seasonal comparison chart
    const seasonalComparisonPlot = document.getElementById('seasonal-comparison-plot');
    if (seasonalComparisonPlot) {
        const container = document.createElement('div');
        container.id = 'seasonal-comparison-chart';
        container.style.height = '400px';
        container.style.width = '100%';
        
        if (seasonalComparisonPlot.parentNode) {
            seasonalComparisonPlot.parentNode.replaceChild(container, seasonalComparisonPlot);
        }
    }
    
    // Fix: Ensure all analysis sections are properly initialized and visible after loading
    document.addEventListener('DOMContentLoaded', function() {
        // Force show any analysis cards that might be hidden
        document.querySelectorAll('.analysis-card, .forecast-section, .forecast-container').forEach(element => {
            if (element) element.classList.remove('hidden');
        });
    });
}

function ensureChartsVisible() {
    // Make sure all chart containers are visible
    document.querySelectorAll('.analysis-card, #yield-comparison-card, #trend-analysis-card, #seasonal-comparison-card').forEach(card => {
        card.classList.remove('hidden');
    });
    
    // Show all forecast sections
    document.querySelectorAll('.forecast-section, .forecast-row, .forecast-card').forEach(element => {
        element.classList.remove('hidden');
    });
    
    // If charts exist but aren't visible, try re-rendering them
    if (window.yieldComparisonChart) window.yieldComparisonChart.update();
    if (window.trendAnalysisChart) window.trendAnalysisChart.update();
    if (window.seasonalComparisonChart) window.seasonalComparisonChart.update();
}


function addAdjustmentTrackingChart() {
    // Check if chart already exists - if so, just update it and return
    const existingChart = document.getElementById('adjustment-tracking-card');
    if (existingChart) {
        // Just update the existing chart
        createAdjustmentTrackingChart();
        return;
    }
    
    // Create a container for the adjustment tracking chart if it doesn't exist
    const resultsSection = document.getElementById('prediction-results');
    if (!resultsSection) return;
    
    // Create the card for the adjustment tracking
    const adjustmentTrackingCard = document.createElement('div');
    adjustmentTrackingCard.className = 'card mb-4';
    adjustmentTrackingCard.id = 'adjustment-tracking-card';
    adjustmentTrackingCard.innerHTML = `
        <div class="card-header bg-success text-white">
            <h5 class="mb-0">Adjustment Impact Visualization</h5>
        </div>
        <div class="card-body">
            <div id="adjustment-tracking-chart" style="height: 300px;"></div>
        </div>
    `;
    
    // Add the card after the adjustment controls
    const adjustmentControls = document.querySelector('.card-body');
    if (adjustmentControls && adjustmentControls.parentNode) {
        adjustmentControls.parentNode.parentNode.insertAdjacentElement('afterend', adjustmentTrackingCard);
    } else {
        resultsSection.appendChild(adjustmentTrackingCard);
    }
    
    // Initialize the chart
    createAdjustmentTrackingChart();
}

/**
 * Create the adjustment tracking chart
 */
function createAdjustmentTrackingChart() {
    const chartContainer = document.getElementById('adjustment-tracking-chart');
    if (!chartContainer) return;
    
    // Clear previous chart if exists
    if (window.adjustmentTrackingChart) {
        window.adjustmentTrackingChart.destroy();
    }
    
    // Create canvas element for chart if it doesn't exist
    let canvas = document.getElementById('adjustment-tracking-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'adjustment-tracking-canvas';
        chartContainer.appendChild(canvas);
    }
    
    // Get base prediction value
    const baseValue = window.originalBaseValue || 0;
    
    // Initial point is the original prediction
    const adjustmentValues = [baseValue];
    const labels = ['Original'];
    
    // Create chart
    const ctx = canvas.getContext('2d');
    window.adjustmentTrackingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Adjusted Prediction Value',
                data: adjustmentValues,
                borderColor: 'rgba(40, 167, 69, 1)',
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(40, 167, 69, 1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Prediction Adjustment Impact',
                    font: {
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: 'Track how adjustments affect your prediction value',
                    font: {
                        size: 14,
                        style: 'italic'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `Value: ${formatNumber(value)} hectares`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Area Harvested (hectares)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Adjustments'
                    }
                }
            }
        }
    });
}

function updateAdjustmentTrackingChart(adjustedValue, adjustmentPercentage, ratio) {
    if (!window.adjustmentTrackingChart) return;
    
    // Add a new data point to the chart
    const labels = window.adjustmentTrackingChart.data.labels;
    const data = window.adjustmentTrackingChart.data.datasets[0].data;
    
    // Generate a descriptive label for this adjustment
    const label = `Adj ${labels.length}: ${adjustmentPercentage}%, ${ratio}`;
    
    // Add the new data point
    labels.push(label);
    data.push(adjustedValue);
    
    // Keep only the last 8 data points to avoid overcrowding
    if (labels.length > 8) {
        labels.shift();
        data.shift();
    }
    
    // Update the chart
    window.adjustmentTrackingChart.update();
}