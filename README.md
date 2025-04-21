# 📊 XGBoost Regression Web App

A simple Flask web application for training and evaluating an XGBoost regression model using a custom dataset. Includes visualizations, metrics, and predictions, all accessible through a web interface.

---

## ⚙️ Setup Instructions

### ✅ Requirements
- **Python 3.8+** (Recommended: 3.8 to 3.11)

### 📦 Install Dependencies

Before running the app, install all required Python packages:

```bash
pip install matplotlib pandas numpy xgboost flask scikit-learn seaborn flask-cors chardet


🚀 Run the App
Start the Flask server using:
python app.py

📂 Dataset Instructions
1. Download the Dataset
You can either:

Place your dataset directly in the /uploads folder

Or download it from the official source:

🔗 Download Dataset

Note: Refresh the page after visiting the link to access the file properly.

2. Upload Dataset
Once the server is running:

Go to the web app

Upload your dataset file via the provided upload interface

🤖 Train the Model
After uploading the dataset:

Click "Train Model"

View training metrics such as RMSE and R²

📈 Make Predictions
Once the model is trained:

Proceed to the "Prediction" section

Input new data and get real-time predictions with visual outputs

🧠 Tech Stack
Python

Flask

XGBoost

scikit-learn

pandas, NumPy

matplotlib, seaborn

HTML/CSS + Bootstrap (frontend)
