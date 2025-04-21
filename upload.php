<?php
$pageTitle = "Upload Data";
$currentPage = "upload";
include "includes/header.php";
include "includes/navbar.php";
?>

<main>
    <!-- Upload Data Section -->
    <section id="upload" class="section active">
        <div class="container py-5">
            <div class="row mb-4">
                <div class="col">
                    <h2 class="fw-bold mb-1">Upload Harvest Data</h2>
                    <p class="text-muted">Import your historical palay and corn harvest data to begin the analysis</p>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card border-0 shadow">
                        <div class="card-body p-4">
                            <div class="upload-area" id="dropzone">
                                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                                <h3 class="mb-3 fw-bold">Drag & Drop Your CSV File</h3>
                                <p class="mb-3">or</p>
                                <label for="file-upload" class="btn btn-primary">Browse Files</label>
                                <input id="file-upload" type="file" accept=".csv" hidden>
                                <p class="text-muted mt-3 small">Only CSV files are accepted. The file should
                                    contain palay and corn harvest data.</p>
                            </div>

                            <div id="upload-preview" class="text-center py-4 hidden">
                                <h3 class="mb-3 fw-bold">File Selected:</h3>
                                <div class="card mb-3 border-0 shadow-sm">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center">
                                            <div class="me-3">
                                                <i class="fas fa-file-csv fa-2x text-primary"></i>
                                            </div>
                                            <div class="text-start">
                                                <p class="mb-1"><strong>Name:</strong> <span id="file-name"></span>
                                                </p>
                                                <p class="mb-0"><strong>Size:</strong> <span id="file-size"></span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-center gap-3">
                                    <button class="btn btn-primary" id="upload-btn">
                                        <i class="fas fa-upload me-2"></i> Upload
                                    </button>
                                    <button class="btn btn-secondary" id="cancel-upload">
                                        <i class="fas fa-times me-2"></i> Cancel
                                    </button>
                                </div>
                            </div>

                            <div id="upload-success" class="text-center py-4 hidden">
                                <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                                <h3 class="fw-bold">Upload Successful!</h3>
                                <p>Your data has been processed successfully.</p>
                                <a href="train.php" class="btn btn-primary mt-3" id="proceed-to-train">
                                    <i class="fas fa-brain me-2"></i> Proceed to Train Model
                                </a>
                            </div>

                            <div id="upload-error" class="text-center py-4 hidden">
                                <i class="fas fa-exclamation-circle fa-4x text-danger mb-3"></i>
                                <h3 class="fw-bold">Upload Failed</h3>
                                <p id="error-message">There was an error processing your file.</p>
                                <button class="btn btn-primary mt-3" id="try-again">
                                    <i class="fas fa-redo me-2"></i> Try Again
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="text-center mt-4">
                        <p class="text-muted">Need sample data? <a href="https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__2E__CS/0022E4EAHC0.px/?rxid=b76dcbcc-f5b8-46db-9a08-cec4d1bad744" class="text-primary" target="_blank">Download our
                                template CSV</a></p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<?php include "includes/footer.php"; ?>