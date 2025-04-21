<?php
$pageTitle = "Train Model";
$currentPage = "train";
include "includes/header.php";
include "includes/navbar.php";
?>

<main>
    <!-- Train Model Section -->
    <section id="train" class="section active">
        <div class="container py-5">
            <div class="row mb-4">
                <div class="col">
                    <h2 class="fw-bold mb-1">Train Model</h2>
                    <p class="text-muted">Configure and train your agricultural yield prediction model for optimal results</p>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card border-0 shadow">
                        <div class="card-body p-4">
                            <div id="no-data-message" class="text-center py-4">
                                <i class="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
                                <h3 class="fw-bold">No Data Available</h3>
                                <p>Please upload your agricultural data first before training the model.</p>
                                <a href="upload.php" class="btn btn-primary mt-3" id="go-to-upload">
                                    <i class="fas fa-upload me-2"></i> Go to Upload
                                </a>
                            </div>

                            <div id="training-form" class="hidden">
                                <h3 class="mb-4 fw-bold">Configure Training Parameters</h3>

                                <!-- Data Preview Section -->
                                <div id="data-preview-section" class="mb-4">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h4 class="fw-bold m-0">Current Data File Preview</h4>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" id="toggle-preview">
                                            <i class="fas fa-chevron-down"></i> Show Preview
                                        </button>
                                    </div>

                                    <div id="file-preview-content" class="collapse">
                                        <div class="card mb-3">
                                            <div class="card-header bg-light">
                                                <h5 class="m-0 text-primary" id="preview-filename">filename.csv</h5>
                                            </div>
                                            <div class="card-body">
                                                <div class="row g-3 mb-3">
                                                    <div class="col-md-3">
                                                        <div class="stat-card bg-light p-3 rounded text-center">
                                                            <div class="text-muted">Rows</div>
                                                            <div class="h4 mb-0" id="stat-rows">0</div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="stat-card bg-light p-3 rounded text-center">
                                                            <div class="text-muted">Columns</div>
                                                            <div class="h4 mb-0" id="stat-cols">0</div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="stat-card bg-light p-3 rounded text-center">
                                                            <div class="text-muted">Numeric Cols</div>
                                                            <div class="h4 mb-0" id="stat-numeric">0</div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="stat-card bg-light p-3 rounded text-center">
                                                            <div class="text-muted">Missing Values</div>
                                                            <div class="h4 mb-0" id="stat-missing">0</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="table-responsive">
                                                    <table class="table table-sm table-striped table-hover" id="preview-table">
                                                        <thead class="table-light">
                                                            <tr id="preview-header">
                                                                <!-- Header will be populated by JavaScript -->
                                                            </tr>
                                                        </thead>
                                                        <tbody id="preview-body">
                                                            <!-- Data will be populated by JavaScript -->
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div class="text-center text-muted small">
                                                    <p>Showing first 10 rows. Target columns are available in the dropdown below.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Parameter Explanations Card -->
                                <div class="card mb-4 bg-light">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <button class="btn btn-link" type="button" data-bs-toggle="collapse"
                                                data-bs-target="#parameterExplanations" aria-expanded="true"
                                                aria-controls="parameterExplanations">
                                                <i class="fas fa-info-circle me-2"></i> Parameter Explanations
                                            </button>
                                        </h5>
                                    </div>
                                    <div id="parameterExplanations" class="collapse show">
                                        <div class="card-body">
                                            <h6 class="fw-bold">Target Column</h6>
                                            <p>The agricultural crop you want to predict yields for. This will be the variable your model learns to predict.</p>
                                            
                                            <h6 class="fw-bold">Model Type</h6>
                                            <p>The machine learning algorithm used to create your prediction model. Different algorithms have different strengths:</p>
                                            <ul>
                                                <li><strong>Random Forest:</strong> Good all-around performer, handles many features well</li>
                                                <li><strong>Gradient Boosting:</strong> Often provides high accuracy, may require more tuning</li>
                                                <li><strong>Linear Regression:</strong> Simple and interpretable, works well for linear relationships</li>
                                                <li><strong>Support Vector Regression:</strong> Good for non-linear data, works well with medium-sized datasets</li>
                                            </ul>

                                            <h6 class="fw-bold">Test Size</h6>
                                            <p>The percentage of your data that will be set aside for testing the model's performance. A larger test size gives more reliable performance metrics but leaves less data for training.</p>

                                            <h6 class="fw-bold">Random State</h6>
                                            <p>A number that ensures your results are reproducible. Using the same random state value will result in the same train/test split each time.</p>

                                            <h6 class="fw-bold">Feature Scaling</h6>
                                            <p>Normalizes the numeric features to a similar scale. This is important for many algorithms to perform well, especially when features have different units or ranges.</p>
                                        </div>
                                    </div>
                                </div>

                                <form id="model-training-form">
                                    <div class="row mb-4">
                                        <div class="col-md-12">
                                            <div class="card h-100">
                                                <div class="card-header">
                                                    <h5 class="mb-0">Target Selection</h5>
                                                </div>
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <label for="targetColumn" class="form-label">Select Target Column:</label>
                                                        <select class="form-select" id="targetColumn" name="targetColumn" required>
                                                            <option value="" selected disabled>Select what to predict...</option>
                                                            <!-- Options will be populated by JavaScript -->
                                                        </select>
                                                        <div class="form-text">This is the agricultural crop you want to predict yields for.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- <div class="col-md-6">
                                            <div class="card h-100">
                                                <div class="card-header">
                                                    <h5 class="mb-0">Model Selection</h5>
                                                </div>
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <label for="modelType" class="form-label">Model Type:</label>
                                                        <select class="form-select" id="modelType" name="modelType" required>
                                                            <option value="random_forest" selected>Random Forest Regressor</option>
                                                            <option value="gradient_boosting">Gradient Boosting</option>
                                                            <option value="linear_regression">Linear Regression</option>
                                                            <option value="svr">Support Vector Regression</option>
                                                        </select>
                                                        <div class="form-text">Choose the algorithm that will be used for training.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div> -->
                                    </div>

                                    <div class="row mb-4">
                                        <div class="col-md-12">
                                            <div class="card">
                                                <div class="card-header">
                                                    <h5 class="mb-0">Training Parameters</h5>
                                                </div>
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <label for="testSize" class="form-label">Test Size: <span id="testSizeValue">20%</span></label>
                                                        <input type="range" class="form-range" id="testSize" name="testSize" min="10" max="40" value="20" oninput="document.getElementById('testSizeValue').textContent = this.value + '%'">
                                                        <div class="form-text">Percentage of data used for testing the model.</div>
                                                    </div>

                                                    <div class="row">
                                                        <div class="col-md-6">
                                                            <div class="mb-3">
                                                                <label for="randomState" class="form-label">Random State:</label>
                                                                <input type="number" class="form-control" id="randomState" name="randomState" value="42" min="0">
                                                                <div class="form-text">For reproducible results.</div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="mb-3 form-check form-switch mt-4">
                                                                <input class="form-check-input" type="checkbox" id="featureScaling" name="featureScaling" checked>
                                                                <label class="form-check-label" for="featureScaling">Use Feature Scaling</label>
                                                                <div class="form-text">Normalize features for better performance.</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-play me-2"></i> Train Model
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <!-- Training progress section -->
                            <div id="training-progress" class="py-4 text-center hidden">
                                <h3 class="mb-4 fw-bold">Training in Progress</h3>
                                <div class="progress mb-4" style="height: 20px;">
                                    <div id="train-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated"
                                        role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                        0%
                                    </div>
                                </div>
                                <p class="text-center mb-2">Please wait while the model is being trained...</p>
                                <!-- Live metrics will be added here dynamically -->
                                <div id="training-progress-metrics" class="mt-4">
                                    <!-- Content will be populated by JavaScript -->
                                </div>
                                <!-- Progress chart will be added here -->
                                <div id="progress-chart-container" class="mt-4">
                                    <canvas id="progressChart" width="400" height="200"></canvas>
                                </div>
                            </div>

                            <!-- Training results section -->
                            <div id="training-results" class="py-4 hidden">
                                <h3 class="fw-bold mb-4 text-center">Model Training Results</h3>

                                <div class="row g-4 mb-4">
                                    <div class="col-md-4">
                                        <div class="metric-card">
                                            <h5>Accuracy</h5>
                                            <div class="value" id="accuracy-value">--</div>
                                            <p class="text-muted">Overall model accuracy</p>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="metric-card">
                                            <h5>RMSE</h5>
                                            <div class="value" id="rmse-value">--</div>
                                            <p class="text-muted">Root Mean Square Error</p>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="metric-card">
                                            <h5>R² Score</h5>
                                            <div class="value" id="r2-value">--</div>
                                            <p class="text-muted">Coefficient of determination</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="row g-4 mb-4">
                                    <div class="col-md-6">
                                        <div class="card border-0 shadow h-100">
                                            <div class="card-body">
                                                <h5 class="card-title">Training & Validation Loss</h5>
                                                <img id="training-loss-plot" class="img-fluid" alt="Training & Validation Loss">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card border-0 shadow h-100">
                                            <div class="card-body">
                                                <h5 class="card-title">Feature Importance</h5>
                                                <img id="feature-importance-plot" src="" alt="Feature Importance Plot" class="img-fluid">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="text-center">
                                    <button id="proceed-to-predict" class="btn btn-primary">
                                        <i class="fas fa-chart-line me-2"></i> Proceed to Predictions
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<style>
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 0.5rem;
        padding: 1.5rem;
        text-align: center;
        height: 100%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .metric-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .metric-card .value {
        font-size: 2rem;
        font-weight: bold;
        margin: 0.5rem 0;
        color: #0d6efd;
    }

    .hidden {
        display: none !important;
    }

    /* Data preview styles */
    #data-preview-section {
        transition: all 0.3s ease;
    }

    #file-preview-content {
        transition: all 0.3s ease;
    }

    .stat-card {
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    #preview-table {
        font-size: 0.85rem;
    }

    #preview-table th {
        position: sticky;
        top: 0;
        background-color: #f8f9fa;
        z-index: 1;
    }

    .table-responsive {
        max-height: 300px;
        overflow-y: auto;
    }

    /* Progress chart styles */
    #progress-chart-container {
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        margin-top: 2rem;
        transition: all 0.3s ease;
    }

    /* Pulsing animation for training progress */
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4);
        }

        70% {
            box-shadow: 0 0 0 10px rgba(13, 110, 253, 0);
        }

        100% {
            box-shadow: 0 0 0 0 rgba(13, 110, 253, 0);
        }
    }

    .pulse-animation {
        animation: pulse 2s infinite;
    }

    #training-progress {
        border-radius: 0.5rem;
        transition: all 0.3s ease;
    }

    #training-progress-metrics {
        transition: all 0.3s ease;
    }

    /* Card transitions */
    .card {
        transition: all 0.3s ease;
    }

    .card:hover {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    /* Form styling improvements */
    .form-control:focus, .form-select:focus {
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    }

    .btn-primary {
        transition: all 0.2s ease;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(13, 110, 253, 0.4);
    }
</style>

<?php include "includes/footer.php"; ?>