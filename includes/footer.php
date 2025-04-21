<footer>
    <div class="container">
        <div class="row g-4">
            <div class="col-md-6">
                <h4 class="mb-3">AgriPredict</h4>
                <p>A machine learning tool designed to help agricultural planners optimize harvest yields through
                    accurate predictions.</p>
            </div>
            <div class="col-md-3">
                <h5 class="mb-3">Quick Links</h5>
                <ul class="list-unstyled">
                    <li><a href="index.php">Home</a></li>
                    <li><a href="upload.php">Upload Data</a></li>
                    <li><a href="train.php">Train Model</a></li>
                    <li><a href="predict.php">Predict</a></li>
                    <!-- <li><a href="visualize.php">Visualizations</a></li> -->
                </ul>
            </div>
            <!-- <div class="col-md-3">
                <h5 class="mb-3">Resources</h5>
                <ul class="list-unstyled">
                    <li><a href="#">Documentation</a></li>
                    <li><a href="#">API Reference</a></li>
                    <li><a href="#">Support</a></li>
                    <li><a href="#">Contact Us</a></li>
                </ul>
            </div> -->
        </div>
        <hr class="mt-4 mb-3 bg-light">
        <div class="row">
            <div class="col text-center">
                <p class="mb-0">&copy; 2025 AgriPredict. All rights reserved.</p>
            </div>
        </div>
    </div>
</footer>

<!-- JavaScript Libraries -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.12/sweetalert2.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>

<!-- Custom JavaScript -->
<script src="static/js/main.js"></script>
<?php
if ($currentPage == 'upload') {
    echo '<script src="static/js/upload.js"></script>';
} elseif ($currentPage == 'train') {
    echo '<script src="static/js/train.js"></script>';
} elseif ($currentPage == 'predict') {
    echo '<script src="static/js/predict.js"></script>';
} elseif ($currentPage == 'visualize') {
    echo '<script src="static/js/visualize.js"></script>';
}
?>
</body>
</html>