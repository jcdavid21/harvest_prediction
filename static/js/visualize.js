// Visualize JavaScript file for Harvest Prediction System
document.addEventListener('DOMContentLoaded', function() {
    // Add click event to visualize section in navigation
    document.querySelector('[data-section="visualize"]').addEventListener('click', function() {
        initializeVisualizations();
    });
    
    // Add event listener for viz type selector
    document.getElementById('viz-type-selector').addEventListener('change', function() {
        changeVisualizationType(this.value);
    });
});

// Initialize visualizations when the user navigates to the visualize section
function initializeVisualizations() {
    // Check if data is available
    const cropTypes = sessionStorage.getItem('cropTypes');
    
    if (!cropTypes) {
        document.getElementById('no-viz-data').classList.remove('hidden');
        document.getElementById('visualization-container').classList.add('hidden');
        return;
    }
    
    document.getElementById('no-viz-data').classList.add('hidden');
    document.getElementById('visualization-container').classList.remove('hidden');
    
    // Initialize the map for heatmap visualization
    initMap();
    
    // By default, show the heatmap
    changeVisualizationType('heatmap');
}

// Initialize map for heatmap visualization
function initMap() {
    // If map already exists, don't recreate it
    if (window.harvestMap) return;
    
    // Create map in the 'map-container' div
    const map = L.map('map-container').setView([16.5, 121.0], 7); // Center on CAR region
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Store map in global variable for later use
    window.harvestMap = map;
    
    // Load heatmap data
    loadHeatmapData();
}

// Load heatmap data from server
function loadHeatmapData() {
    fetch('/heatmap')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
            } else {
                // Render heatmap with the data
                renderHeatmap(data.heatmap_data);
            }
        })
        .catch(error => {
            showError('Network error: ' + error.message);
        });
}

// Render heatmap on the map
function renderHeatmap(heatmapData) {
    // Clear any existing markers
    if (window.harvestMarkers) {
        window.harvestMarkers.forEach(marker => window.harvestMap.removeLayer(marker));
    }
    
    window.harvestMarkers = [];
    
    // Add markers for each data point
    heatmapData.forEach(point => {
        // Calculate marker size based on value
        const radius = Math.sqrt(point.value) / 10 * 30;
        
        // Create circle marker with size proportional to value
        const marker = L.circleMarker([point.lat, point.lng], {
            radius: radius,
            fillColor: '#FF4500',
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(window.harvestMap);
        
        // Add popup with information
        marker.bindPopup(`
            <b>${point.province}</b><br>
            Value: ${point.value.toFixed(2)} hectares
        `);
        
        window.harvestMarkers.push(marker);
    });
}

// Change visualization type (heatmap, bar chart, line chart)
function changeVisualizationType(type) {
    // Hide all visualization containers
    document.querySelectorAll('.viz-container').forEach(container => {
        container.classList.add('hidden');
    });
    
    // Show selected visualization container
    document.getElementById(`${type}-container`).classList.remove('hidden');
    
    // Initialize specific visualization based on type
    switch (type) {
        case 'heatmap':
            // If map already initialized, just make sure it's visible
            if (window.harvestMap) {
                window.harvestMap.invalidateSize();
            } else {
                initMap();
            }
            break;
            
        case 'barchart':
            initBarChart();
            break;
            
        case 'linechart':
            initLineChart();
            break;
    }
}

// Initialize bar chart visualization
function initBarChart() {
    // Check if we already have a chart
    if (window.harvestBarChart) {
        window.harvestBarChart.destroy();
    }
    
    // Get crop types from session storage
    const cropTypes = JSON.parse(sessionStorage.getItem('cropTypes') || '[]');
    
    // Create dummy data for visualization
    // In a real app, you would fetch this from the server
    const labels = cropTypes.slice(0, 5); // Use up to 5 crop types
    const data = labels.map(() => Math.floor(Math.random() * 5000) + 1000); // Random values
    
    // Create chart
    const ctx = document.getElementById('bar-chart').getContext('2d');
    window.harvestBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Harvest (Hectares)',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Harvest by Crop Type'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hectares'
                    }
                }
            }
        }
    });
}

// Initialize line chart visualization
function initLineChart() {
    // Check if we already have a chart
    if (window.harvestLineChart) {
        window.harvestLineChart.destroy();
    }
    
    // Create dummy time series data for visualization
    // In a real app, you would fetch this from the server
    const labels = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'];
    
    // Create random time series for Palay and Corn
    const palayData = labels.map((_, i) => {
        const base = 3000;
        const trend = i * 100; // Upward trend
        const seasonal = Math.sin(i * Math.PI / 2) * 500; // Seasonal component
        const random = (Math.random() - 0.5) * 300; // Random noise
        return base + trend + seasonal + random;
    });
    
    const cornData = labels.map((_, i) => {
        const base = 2000;
        const trend = i * 80; // Upward trend
        const seasonal = Math.cos(i * Math.PI / 2) * 400; // Seasonal component
        const random = (Math.random() - 0.5) * 250; // Random noise
        return base + trend + seasonal + random;
    });
    
    // Create chart
    const ctx = document.getElementById('line-chart').getContext('2d');
    window.harvestLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Palay Harvest',
                    data: palayData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Corn Harvest',
                    data: cornData,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Harvest Trends by Quarter'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Hectares'
                    }
                }
            }
        }
    });
}

// Export visualization as image
function exportVisualization(type) {
    let element;
    let filename;
    
    switch (type) {
        case 'heatmap':
            // For map, we need to use a library like html2canvas (not included in this demo)
            alert('Map export feature requires additional libraries. Not implemented in this demo.');
            return;
            
        case 'barchart':
            if (!window.harvestBarChart) return;
            const barCanvas = document.getElementById('bar-chart');
            const barImage = barCanvas.toDataURL('image/png');
            filename = 'harvest_bar_chart.png';
            downloadImage(barImage, filename);
            break;
            
        case 'linechart':
            if (!window.harvestLineChart) return;
            const lineCanvas = document.getElementById('line-chart');
            const lineImage = lineCanvas.toDataURL('image/png');
            filename = 'harvest_line_chart.png';
            downloadImage(lineImage, filename);
            break;
    }
}

// Download image helper function
function downloadImage(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}