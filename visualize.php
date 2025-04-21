<?php
$pageTitle = "Data Visualizations";
$currentPage = "visualize";
include "includes/header.php";
include "includes/navbar.php";
?>

<main>
    <!-- Visualizations Section -->
    <section id="visualize" class="section">
        <div class="container py-5">
            <div class="row mb-4">
                <div class="col">
                    <h2 class="fw-bold mb-1">Data Visualizations</h2>
                    <p class="text-muted">Explore harvest data through interactive visualizations</p>
                </div>
            </div>

            <div id="no-viz-data" class="text-center py-4">
                <i class="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
                <h3 class="fw-bold">No Data Available</h3>
                <p>Please upload data first to view visualizations.</p>
                <button class="btn btn-primary mt-3" id="go-to-upload-viz">
                    <i class="fas fa-upload me-2"></i> Go to Upload
                </button>
            </div>

            <div id="visualization-container" class="hidden">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="form-group">
                            <label for="viz-type-selector" class="form-label">Visualization Type:</label>
                            <select id="viz-type-selector" class="form-select">
                                <option value="heatmap">Geographic Heatmap</option>
                                <option value="barchart">Bar Chart</option>
                                <option value="linechart">Line Chart</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 text-end align-self-end">
                        <button class="btn btn-outline-primary"
                            onclick="exportVisualization(document.getElementById('viz-type-selector').value)">
                            <i class="fas fa-download me-2"></i> Export Visualization
                        </button>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <!-- Heatmap Visualization -->
                        <div id="heatmap-container" class="viz-container">
                            <div id="map-container"></div>
                        </div>

                        <!-- Bar Chart Visualization -->
                        <div id="barchart-container" class="viz-container hidden">
                            <canvas id="bar-chart"></canvas>
                        </div>

                        <!-- Line Chart Visualization -->
                        <div id="linechart-container" class="viz-container hidden">
                            <canvas id="line-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>