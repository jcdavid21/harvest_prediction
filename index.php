<?php
$pageTitle = "Home";
$currentPage = "home";
include "includes/header.php";
include "includes/navbar.php";
?>

<main>
    <!-- Home Section -->
    <section id="home" class="section active">
        <div id="hero">
            <div class="container hero-content mx-auto">
                <h1 class="hero-title">Palay and Corn Harvest Prediction System</h1>
                <p class="hero-subtitle">Leverage machine learning to predict and optimize agricultural yields
                    across regions</p>
                <a href="upload.php" class="btn btn-light btn-hero" id="get-started">
                    Get Started <i class="fas fa-arrow-right ms-2"></i>
                </a>
            </div>
        </div>

        <div class="container mb-5">
            <div class="row g-4 mb-5">
                <div class="col-md-3">
                    <div class="feature-card card text-center">
                        <div class="card-body">
                            <div class="feature-icon">
                                <i class="fas fa-upload fa-2x"></i>
                            </div>
                            <h3 class="card-title h4 mb-3">Upload Data</h3>
                            <p class="card-text">Import historical crop data with ease through our user-friendly
                                interface</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="feature-card card text-center">
                        <div class="card-body">
                            <div class="feature-icon">
                                <i class="fas fa-brain fa-2x"></i>
                            </div>
                            <h3 class="card-title h4 mb-3">Train Model</h3>
                            <p class="card-text">Build powerful XGBoost models tuned for agricultural predictions
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="feature-card card text-center">
                        <div class="card-body">
                            <div class="feature-icon">
                                <i class="fas fa-chart-line fa-2x"></i>
                            </div>
                            <h3 class="card-title h4 mb-3">Make Predictions</h3>
                            <p class="card-text">Generate accurate forecasts for future harvest yields</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="feature-card card text-center">
                        <div class="card-body">
                            <div class="feature-icon">
                                <i class="fas fa-map-marked-alt fa-2x"></i>
                            </div>
                            <h3 class="card-title h4 mb-3">Visualize Results</h3>
                            <p class="card-text">Explore data through interactive maps and insightful charts</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-12 text-center mb-4">
                    <h2 class="fw-bold">How It Works</h2>
                    <p class="text-muted">A simple four-step process to transform your agricultural data into
                        actionable predictions</p>
                </div>
            </div>

            <div class="row g-4 mb-5">
                <div class="col-md-3">
                    <div class="step-card card h-100">
                        <div class="card-body text-center">
                            <div class="step-number">1</div>
                            <h3 class="card-title h4 mb-3">Upload Your Data</h3>
                            <p class="card-text">Import CSV files containing historical harvest data for palay and
                                corn across regions</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="step-card card h-100">
                        <div class="card-body text-center">
                            <div class="step-number">2</div>
                            <h3 class="card-title h4 mb-3">Train the Model</h3>
                            <p class="card-text">Configure and optimize the XGBoost model parameters for maximum
                                accuracy</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="step-card card h-100">
                        <div class="card-body text-center">
                            <div class="step-number">3</div>
                            <h3 class="card-title h4 mb-3">Generate Predictions</h3>
                            <p class="card-text">Obtain quarterly, semester, or yearly harvest forecasts for
                                specific regions</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="step-card card h-100">
                        <div class="card-body text-center">
                            <div class="step-number">4</div>
                            <h3 class="card-title h4 mb-3">Analyze Results</h3>
                            <p class="card-text">Explore visualizations and export predictions for strategic
                                planning</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-md-8 text-center">
                    <div class="card p-4 bg-light border-0 shadow-sm">
                        <h3 class="mb-3">Ready to optimize your agricultural planning?</h3>
                        <p class="mb-4">Start by uploading your historical harvest data and let our system generate
                            accurate predictions.</p>
                        <a href="upload.php" class="btn btn-primary mx-auto" id="upload-data-btn">
                            Upload Data Now <i class="fas fa-arrow-right ms-2"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<?php include "includes/footer.php"; ?>