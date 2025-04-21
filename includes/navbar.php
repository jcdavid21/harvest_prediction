<nav class="navbar navbar-expand-lg navbar-dark sticky-top">
    <div class="container">
        <a class="navbar-brand" href="index.php">
            <i class="fas fa-seedling me-2"></i>
            <span>AgriPredict</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto nav-links">
                <li class="nav-item">
                    <a class="nav-link <?php echo ($currentPage == 'home') ? 'active' : ''; ?>" href="index.php">
                        <i class="fas fa-home me-1"></i> Home
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($currentPage == 'upload') ? 'active' : ''; ?>" href="upload.php">
                        <i class="fas fa-upload me-1"></i> Upload Data
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($currentPage == 'train') ? 'active' : ''; ?>" href="train.php">
                        <i class="fas fa-brain me-1"></i> Train Model
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo ($currentPage == 'predict') ? 'active' : ''; ?>" href="predict.php">
                        <i class="fas fa-chart-line me-1"></i> Predict
                    </a>
                </li>
                <!-- <li class="nav-item">
                    <a class="nav-link <?php echo ($currentPage == 'visualize') ? 'active' : ''; ?>" href="visualize.php">
                        <i class="fas fa-chart-bar me-1"></i> Visualizations
                    </a>
                </li> -->
            </ul>
        </div>
    </div>
</nav>