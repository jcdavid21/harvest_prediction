# 📊 XGBoost Regression Web App

A simple Flask web application for training and evaluating an XGBoost regression model using a custom dataset. Includes visualizations, metrics, and predictions — all accessible through a user-friendly web interface.

---

## ⚙️ Setup Instructions

### ✅ Requirements
- **Python 3.8+** (Recommended: 3.8 to 3.11)

### 📦 Install Dependencies

Before running the app, install all required Python packages:

```bash
pip install matplotlib pandas numpy xgboost flask scikit-learn seaborn flask-cors chardet
```

---

## 🚀 Run the App

Start the Flask server using:

```bash
python app.py
```

Once the server is running, open your browser and go to:

```
http://127.0.0.1:5000
```

---

## 📂 Dataset Instructions

### 1. Download the Dataset

You can either:
- Place your dataset directly in the `/uploads` folder  
**OR**
- Download it from the official source:  
  🔗 [Download Dataset](https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__2E__CS/0022E4EAHC0.px/?rxid=b76dcbcc-f5b8-46db-9a08-cec4d1bad744)

> **Note:** Refresh the page after visiting the link to properly access the download.

### 2. Upload the Dataset

After starting the server:
- Go to the web app in your browser
- Use the upload interface to upload your dataset file

---

## 🤖 Train the Model

After uploading the dataset:
- Click **"Train Model"**
- View training metrics such as **RMSE** and **R²**

---

## 📈 Make Predictions

Once the model is trained:
- Navigate to the **"Prediction"** section
- Enter new input values
- Get real-time predictions along with visual results

---

## 🧠 Tech Stack

- Python
- Flask
- XGBoost
- scikit-learn
- pandas, NumPy
- matplotlib, seaborn
- HTML/CSS + Bootstrap (frontend)
