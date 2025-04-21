<?php
$pageTitle = "Generate Harvest Predictions";  // Changed title to be more specific
$currentPage = "predict";
include "includes/header.php";
?>

<!-- Include navbar -->
<?php include "includes/navbar.php"; ?>

<style>
    /* Add custom CSS for wider layout */
    .container-wide {
        max-width: 1420px;
        margin: 0 auto;
    }

    .card {
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .metric-card {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #28a745;
    }

    .metric-card .value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #28a745;
    }
</style>

<main>
    <!-- Predict Section -->
    <section id="predict" class="section active">
        <div class="container-wide py-5"> <!-- Changed to container-wide -->
            <div class="row mb-4">
                <div class="col">
                    <h2 class="fw-bold mb-1">Harvest Yield Predictions</h2> <!-- More specific title -->
                    <p class="text-muted">Predict future agricultural harvest yields based on trained models</p>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-12"> <!-- Changed to col-12 for full width -->
                    <div id="no-model-message" class="text-center py-4">
                        <i class="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
                        <h3 class="fw-bold">No Model Available</h3>
                        <p>Please train a harvest prediction model before generating forecasts.</p>
                        <button class="btn btn-primary mt-3" id="go-to-train">
                            <i class="fas fa-brain me-2"></i> Go to Train Model
                        </button>
                    </div>

                    <div id="prediction-form" class="hidden">
                        <div class="card border-0 shadow">
                            <div class="card-body p-4">
                                <h3 class="mb-4 fw-bold">Harvest Prediction Parameters</h3> <!-- More specific title -->
                                <form id="prediction-parameters-form">
                                    <div class="row"> <!-- Added row for better layout -->
                                        <div class="col-md-4 mb-3">
                                            <label for="pred-region" class="form-label">Region:</label>
                                            <select id="pred-region" name="region" class="form-select" required>
                                                <option value="" disabled selected>Select a region</option>
                                            </select>
                                        </div>

                                        <div class="col-md-4 mb-3">
                                            <label for="pred-province" class="form-label">Province:</label>
                                            <select id="pred-province" name="province" class="form-select" required>
                                                <option value="" disabled selected>Select a province</option>
                                            </select>
                                        </div>

                                        <div class="col-md-4 mb-3">
                                            <label for="pred-cropType" class="form-label">Crop Type:</label>
                                            <select id="pred-cropType" name="cropType" class="form-select" required>
                                                <option value="" disabled selected>Select a crop type</option>
                                            </select>
                                            <div id="crop-type-help" class="form-text"></div> <!-- Added container for help text -->
                                        </div>
                                    </div>

                                    <!-- Fixed Code -->
                                    <div class="mb-4">
                                        <label class="form-label">Prediction Period:</label>
                                        <div class="d-flex gap-3">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="predictionType"
                                                    id="quarterly" value="quarter" checked>
                                                <label class="form-check-label" for="quarterly">Quarterly</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="predictionType"
                                                    id="semester" value="semester">
                                                <label class="form-check-label" for="semester">Semester</label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="predictionType"
                                                    id="annual" value="annual">
                                                <label class="form-check-label" for="annual">Annual</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary btn-lg"> <!-- Made button larger -->
                                            <i class="fas fa-chart-line me-2"></i> Predict Harvest Yield
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div id="prediction-loader" class="text-center py-4 mt-4 hidden">
                            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-3 fs-5">Generating harvest predictions...</p> <!-- Larger text -->
                        </div>
                    </div>

                    <div id="prediction-results" class="mt-4 hidden">
                        <div class="card border-0 shadow mb-4">
                            <div class="card-body p-4">
                                <h3 class="fw-bold text-center mb-4">Harvest Prediction Results</h3> <!-- More specific title -->

                                <div class="row mb-4">
                                    <div class="col-md-6 mx-auto">
                                        <div class="metric-card text-center">
                                            <h5>Predicted Annual Harvest Yield</h5>
                                            <div class="value" id="prediction-value">0</div>
                                            <p class="text-muted">Hectares</p>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mx-auto">
                                        <div class="metric-card text-center">
                                            <h5>Estimated Production</h5>
                                            <div class="value text-primary" id="production-value">0</div>
                                            <p class="text-muted">Metric Tons</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <h5>Model Confidence</h5>
                                    <div class="progress confidence-progress mb-2" style="height: 20px;">
                                        <div id="confidence-bar" class="progress-bar progress-bar-striped" role="progressbar"
                                            style="width: 0%" aria-valuenow="0" aria-valuemin="0"
                                            aria-valuemax="100"></div>
                                    </div>
                                    <p class="text-end small mb-0"><span id="confidence-value">0%</span></p>
                                </div>

                                <!-- Quarterly Predictions Table -->
                                <div class="mb-4">
                                    <h5 class="mb-3">Detailed Quarterly Predictions</h5>
                                    <div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead class="table-light">
                                                <tr>
                                                    <th>Period</th>
                                                    <th>Predicted Yield (Hectares)</th>
                                                    <th>Estimated Production (Tons)</th>
                                                    <th>Growth Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody id="quarterly-predictions-body">
                                                <!-- Will be populated by JavaScript -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- Main Prediction Charts -->
                                <div class="row g-4 mb-4">
                                    <div class="col-md-6">
                                        <div class="card border-0 shadow-sm h-100">
                                            <div class="card-body">
                                                <h5 class="card-title">Harvest Yield Comparison</h5>
                                                <img id="prediction-plot" src="/api/placeholder/500/300"
                                                    alt="Harvest Prediction Plot" class="img-fluid">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-header bg-primary text-white">
                                                <h5 class="mb-0">Harvest Forecast</h5>
                                            </div>
                                            <div class="card-body">
                                                <div class="row">
                                                    <div class="col-md-6 mb-3">
                                                        <div class="d-flex flex-column align-items-center">
                                                            <div class="display-6 mb-2" id="prediction-value">0</div>
                                                            <div class="text-muted">Area Harvested (hectares)</div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6 mb-3">
                                                        <div class="d-flex flex-column align-items-center">
                                                            <div class="display-6 mb-2" id="production-value">0</div>
                                                            <div class="text-muted">Production (tons)</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="mt-3">
                                                    <label class="fw-bold">Confidence Level</label>
                                                    <div class="progress">
                                                        <div id="confidence-bar" class="progress-bar progress-bar-striped" role="progressbar" style="width: 0%"></div>
                                                    </div>
                                                    <div class="d-flex justify-content-end mt-1">
                                                        <small id="confidence-value">0%</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card h-100">
                                            <div class="card-header bg-primary text-white">
                                                <h5 class="mb-0">Advanced Harvest Analysis</h5>
                                            </div>
                                            <div class="card-body">
                                                <div class="table-responsive">
                                                    <table class="table table-bordered">
                                                        <thead>
                                                            <tr>
                                                                <th>Period</th>
                                                                <th>Yield (ha)</th>
                                                                <th>Production (tons)</th>
                                                                <th>Growth</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody id="quarterly-predictions-body">
                                                            <!-- This will be populated dynamically -->
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Additional Analysis Charts -->
                                <h4 class="fw-bold mt-5 mb-4">Advanced Harvest Analysis</h4>

                                <div class="row g-4 mb-4">
                                    <!-- Yield Comparison Chart -->
                                    <div class="col-md-6">
                                        <div id="yield-comparison-card" class="card border-0 shadow-sm h-100 hidden">
                                            <div class="card-body">
                                                <h5 class="card-title">Regional Yield Comparison</h5>
                                                <img id="yield-comparison-plot" src="/api/placeholder/500/300"
                                                    alt="Yield Comparison Plot" class="img-fluid">
                                                <p class="text-muted small mt-2">Comparison of predicted harvest yields across different regions</p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Trend Analysis Chart -->
                                    <div class="col-md-6">
                                        <div id="trend-analysis-card" class="card border-0 shadow-sm h-100 hidden">
                                            <div class="card-body">
                                                <h5 class="card-title">Harvest Trend Analysis</h5>
                                                <img id="trend-analysis-plot" src="/api/placeholder/500/300"
                                                    alt="Harvest Trend Analysis Plot" class="img-fluid">
                                                <p class="text-muted small mt-2">Historical and predicted harvest yield trends</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row g-4 mb-4">
                                    <!-- Seasonal Comparison Chart -->
                                    <div class="col-md-12">
                                        <div id="seasonal-comparison-card" class="card border-0 shadow-sm hidden">
                                            <div class="card-body">
                                                <h5 class="card-title">Seasonal Harvest Performance</h5>
                                                <img id="seasonal-comparison-plot" src="/api/placeholder/800/400"
                                                    alt="Seasonal Harvest Comparison Plot" class="img-fluid">
                                                <p class="text-muted small mt-2">Analysis of seasonal variations in harvest yields</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- <div class="text-center mt-4">
                                    <button class="btn btn-primary btn-lg" id="export-prediction"> 
                                        <i class="fas fa-file-export me-2"></i> Export Harvest Predictions
                                    </button>
                                </div> -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<!-- Footer -->
<?php include "includes/footer.php"; ?>