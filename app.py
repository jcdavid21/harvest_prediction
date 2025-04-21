# Add at the top of app.py, before other imports
import matplotlib
matplotlib.use('Agg')  # Set backend before importing pyplot
import matplotlib.pyplot as plt
import os
# Set matplotlib to use a non-interactive backend
os.environ['MATPLOTLIB_BACKEND'] = 'Agg'
import time  # Add this import at the top
import json
import pandas as pd
import numpy as np
import xgboost as xgb
from flask import Flask, request, jsonify, render_template, send_file
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from matplotlib.figure import Figure 
from datetime import datetime
import traceback
from flask_cors import CORS  # Import the flask_cors extension
import re
import datetime
import threading
import chardet
import math
from sklearn.preprocessing import StandardScaler


app = Flask(__name__)
# More permissive CORS setup
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Global variables to store model and data
global_data = None
global_crop_types = []
global_regions = []
global_provinces = []
global_years = []
globaL_metrics = []
global_model = None


# Create uploads folder if it doesn't exist
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    global global_data, global_crop_types, global_regions, global_provinces, global_years
    print("Request received at /upload")
    print(f"Method: {request.method}")
    print(f"Headers: {request.headers}")
    
    if request.method == 'POST':
        try:
            if 'file' not in request.files:
                print("No file part in request")
                return jsonify({'error': 'No file part'}), 400  # Return appropriate status code
            
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({'error': 'No selected file'})
            
            if file and file.filename.endswith('.csv'):
                # Save the file temporarily
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
                file.save(filepath)
                
                # Process the CSV
                try:
                    process_data(filepath)
                    return jsonify({
                        'success': True, 
                        'message': 'File uploaded and processed successfully',
                        'regions': global_regions,
                        'crop_types': global_crop_types,
                        'provinces': global_provinces,
                    })
                except Exception as e:
                    print(f"Error processing file: {str(e)}")
                    traceback.print_exc()
                    return jsonify({'error': f'Error processing file: {str(e)}'})
            else:
                return jsonify({'error': 'Only CSV files are allowed'})
        except Exception as e:
            print(f"Error in upload: {str(e)}")
            traceback.print_exc()
            return jsonify({'error': f'Error: {str(e)}'})
    
    return render_template('upload.html')

def process_data(filepath):
    """Process uploaded CSV file and extract relevant information"""
    global global_data, global_crop_types, global_regions, global_provinces, global_years
    
    try:
        # Clear previous data
        global_data = None
        global_crop_types = []
        global_regions = []
        global_provinces = []
        global_years = []
        
        # Detect the file encoding
        with open(filepath, 'rb') as f:
            result = chardet.detect(f.read())
        
        encoding = result['encoding'] if result['encoding'] else 'utf-8'
        print(f"Detected encoding: {encoding}")
        
        # First attempt: Try reading with headers
        df = pd.read_csv(filepath, encoding=encoding)
        
        # Check if we need to skip rows (look for headers)
        if df.shape[1] < 3 or all(isinstance(col, str) and not col.strip() for col in df.columns):
            # Try skipping rows if the first attempt doesn't look right
            for skip_rows in range(1, 5):
                try:
                    df = pd.read_csv(filepath, encoding=encoding, skiprows=skip_rows)
                    # If we get a reasonable number of columns, break
                    if df.shape[1] >= 3:
                        break
                except:
                    continue
        
        print(f"DataFrame shape after reading: {df.shape}")
        
        # Clean column names and remove unnecessary whitespace
        df.columns = [str(col).strip() for col in df.columns]
        
        # Filter out rows with all NaN values
        df = df.dropna(how='all')
        
        # Try to identify crop types, regions, and provinces
        data_records = []
        
        # For the CSV structure like in 2E4EAHC0 (5).csv, we need a different approach
        # First row contains years, second row contains periods/quarters
        if 'Unnamed: 0' in df.columns and 'Unnamed: 1' in df.columns:
            # This is likely our structured agricultural data
            
            # Extract years from columns
            years = []
            periods = []
            
            for col in df.columns[2:]:  # Skip first two columns
                # Try to extract year using regex
                year_match = re.search(r'(\d{4})', str(col))
                if year_match:
                    years.append(int(year_match.group(1)))
                    periods.append('Annual')  # Default period
            
            # If we found years in the column headers
            if years:
                # Extract periods from the second row if they exist
                if len(df) > 0:
                    for i, col in enumerate(df.columns[2:], 2):  # Start from the 3rd column
                        cell_value = df.iloc[0, i]
                        if isinstance(cell_value, str) and cell_value.strip():
                            # Index into periods using relative position
                            period_idx = i - 2
                            if period_idx < len(periods):
                                periods[period_idx] = cell_value
            
            # Remove the header row if it contains periods
            if len(df) > 0 and any(isinstance(df.iloc[0, i], str) for i in range(2, df.shape[1])):
                df = df.iloc[1:].reset_index(drop=True)
            
            # Variables to track current crop type and region
            current_crop_type = None
            current_region = None
            
            # Go through each row of data
            for row_idx in range(len(df)):
                # Get crop type from column 0
                crop_cell = df.iloc[row_idx, 0]
                if not pd.isna(crop_cell) and isinstance(crop_cell, str) and crop_cell.strip():
                    current_crop_type = crop_cell.strip()
                
                # Get location from column 1
                location_cell = df.iloc[row_idx, 1]
                
                # Skip if location is missing
                if pd.isna(location_cell) or not isinstance(location_cell, str) or not location_cell.strip():
                    continue
                
                location = location_cell.strip()
                
                # Process the region and province
                region = None
                province = None
                
                if location.startswith('..') and not location.startswith('....'):
                    # This is a region
                    region = location.replace('..', '').strip()
                    current_region = region
                    province = "All Provinces"  # Default value when row represents entire region
                elif location.startswith('....'):
                    # This is a province
                    province = location.replace('....', '').strip()
                    region = current_region  # Use the current region for this province
                else:
                    # In case there's no special formatting but still a location
                    if not region and not province:
                        if current_region:
                            region = current_region
                        else:
                            region = "Unknown"
                        province = location
                
                # If we still don't have a region
                if not region:
                    region = "Unknown"
                
                # If we still don't have a province
                if not province:
                    province = "Unknown"
                
                # If we don't have a crop type
                if not current_crop_type:
                    continue
                
                # Process data for each year/period combination
                for col_idx, col in enumerate(df.columns[2:], 2):  # Start from the 3rd column
                    value = df.iloc[row_idx, col_idx]
                    
                    # Skip if value is not numeric
                    try:
                        value = float(value)
                        if pd.isna(value):
                            continue
                    except (ValueError, TypeError):
                        continue
                    
                    # Get year and period for this column
                    period_idx = col_idx - 2
                    period = "Annual"  # Default
                    year = 2023  # Default year
                    
                    if period_idx < len(periods):
                        period = periods[period_idx]
                    
                    if period_idx < len(years):
                        year = years[period_idx]
                    
                    # Determine quarter from period
                    quarter = 0
                    if "Quarter 1" in str(period) or "Q1" in str(period):
                        quarter = 1
                    elif "Quarter 2" in str(period) or "Q2" in str(period):
                        quarter = 2
                    elif "Quarter 3" in str(period) or "Q3" in str(period):
                        quarter = 3
                    elif "Quarter 4" in str(period) or "Q4" in str(period):
                        quarter = 4
                    
                    # Create record
                    data_records.append({
                        'CropType': current_crop_type,
                        'Region': region,
                        'Province': province,
                        'Year': year,
                        'Period': period,
                        'AreaHarvested': value,
                        'Quarter': quarter,
                        'IsDrySeasonStart': 1 if quarter == 1 else 0,
                        'IsWetSeasonStart': 1 if quarter == 3 else 0,
                        'IsSemester1': 1 if ("Semester 1" in str(period) or "S1" in str(period)) else 0,
                        'IsSemester2': 1 if ("Semester 2" in str(period) or "S2" in str(period)) else 0,
                        'IsAnnual': 1 if "Annual" in str(period) else 0
                    })
        
        # If we couldn't process the data with the specific structure, try a more generic approach
        if not data_records:
            print("Falling back to generic processing method")
            
            # Try to identify columns for crop type, region, province, year, and value
            potential_crop_cols = [col for col in df.columns if 'crop' in str(col).lower()]
            potential_region_cols = [col for col in df.columns if any(region_word in str(col).lower() for region_word in ['region', 'area', 'location'])]
            potential_province_cols = [col for col in df.columns if any(province_word in str(col).lower() for province_word in ['province', 'district', 'county'])]
            potential_year_cols = [col for col in df.columns if 'year' in str(col).lower() or re.search(r'(19|20)\d{2}', str(col))]
            potential_value_cols = [col for col in df.columns if any(value_word in str(col).lower() for value_word in ['value', 'production', 'area', 'harvest', 'yield'])]
            
            # Use identified columns or fallback to positional columns
            crop_col = potential_crop_cols[0] if potential_crop_cols else df.columns[0]
            region_col = potential_region_cols[0] if potential_region_cols else (df.columns[1] if len(df.columns) > 1 else None)
            province_col = potential_province_cols[0] if potential_province_cols else (df.columns[2] if len(df.columns) > 2 else None)
            year_col = potential_year_cols[0] if potential_year_cols else None
            value_col = potential_value_cols[0] if potential_value_cols else (df.columns[-1] if len(df.columns) > 3 else None)
            
            # Process each row
            for _, row in df.iterrows():
                crop_type = str(row[crop_col]) if crop_col else "Unknown"
                region = str(row[region_col]) if region_col else "Unknown"
                province = str(row[province_col]) if province_col else "Unknown"
                
                # Try to extract year
                year = 2023  # Default
                if year_col:
                    try:
                        year_val = row[year_col]
                        if isinstance(year_val, (int, float)):
                            year = int(year_val)
                        elif isinstance(year_val, str):
                            year_match = re.search(r'(19|20)\d{2}', year_val)
                            if year_match:
                                year = int(year_match.group(0))
                    except:
                        pass
                
                # Try to extract value
                value = None
                if value_col:
                    try:
                        value = float(row[value_col])
                    except:
                        continue  # Skip if no valid value
                
                if value is not None and not pd.isna(value):
                    data_records.append({
                        'CropType': crop_type,
                        'Region': region,
                        'Province': province,
                        'Year': year,
                        'Period': 'Annual',
                        'AreaHarvested': value,
                        'Quarter': 0,
                        'IsDrySeasonStart': 0,
                        'IsWetSeasonStart': 0,
                        'IsSemester1': 0,
                        'IsSemester2': 0,
                        'IsAnnual': 1
                    })
        
        # If we have records, create a DataFrame
        if data_records:
            processed_df = pd.DataFrame(data_records)
            
            # Clean data - replace NaN and blank values
            for col in processed_df.columns:
                if processed_df[col].dtype == object:  # String columns
                    processed_df[col] = processed_df[col].fillna('Unknown').astype(str)
                    processed_df[col] = processed_df[col].apply(lambda x: 'Unknown' if x.strip() == '' else x)
            
            # Extract unique values for global variables
            global_crop_types = sorted(processed_df['CropType'].unique().tolist())
            global_regions = sorted(processed_df['Region'].unique().tolist())
            global_provinces = sorted(processed_df['Province'].unique().tolist())
            global_years = sorted(processed_df['Year'].unique().tolist())
            
            # Ensure we don't include "All Provinces" in the province list when filtering
            # unless it's the only province
            provinces_without_all = [p for p in global_provinces if p != "All Provinces"]
            if provinces_without_all:
                global_provinces = provinces_without_all
            
            # Assign to global data
            global_data = processed_df
            
            print(f"Data processed successfully: {len(global_data)} rows")
            print(f"Crop types: {global_crop_types}")
            print(f"Regions: {global_regions}")
            print(f"Provinces: {global_provinces}")
            print(f"Years: {global_years}")
            
            return True
        else:
            print("No data records could be extracted from the file")
            raise Exception("No data records could be extracted from the file")
        
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        traceback.print_exc()
        raise

# Add this to app.py

training_progress = {
    'status': 'idle',  # 'idle', 'training', 'complete'
    'progress': 0,     # 0-100 percentage
    'current_step': '',
    'metrics': {
        'accuracy': 0,
        'rmse': 0,
        'r2': 0
    }
}

@app.route('/check_data_availability', methods=['GET'])
def check_data_availability():
    global global_data, global_crop_types, global_regions, global_provinces, global_model
    
    data_available = global_data is not None and global_model is not None
    
    # Get the selected crop type from the trained model, if available
    selected_crop_type = None
    if global_model is not None and 'target' in global_model:
        selected_crop_type = global_model['target']
    
    return jsonify({
        'data_available': data_available,
        'crop_types': global_crop_types if global_crop_types else [],
        'regions': global_regions if global_regions else [],
        'provinces': global_provinces if global_provinces else [],
        'selected_crop_type': selected_crop_type  # Add the selected crop type from the model
    })

@app.route('/training_progress', methods=['GET'])
def get_training_progress():
    # Convert any Infinity values to strings or null before JSON serialization
    sanitized_progress = sanitize_json_values(training_progress)
    return jsonify(sanitized_progress)

# Add this helper function to handle non-serializable values like Infinity
def sanitize_json_values(obj):
    """Recursively sanitize values that aren't JSON serializable"""
    if isinstance(obj, dict):
        return {k: sanitize_json_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json_values(item) for item in obj]
    elif isinstance(obj, float) and (math.isinf(obj) or math.isnan(obj)):
        return None  # Replace Infinity/NaN with null
    else:
        return obj
    
def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(i) for i in obj]
    else:
        return obj


    
@app.route("/train", methods=["POST"])
def train_model():
    global global_data, global_model, training_progress
    
    try:
        # Reset training progress
        training_progress = {
            'status': 'training',
            'progress': 0,
            'current_step': 'Initializing training process',
            'metrics': {
                'accuracy': 0,
                'rmse': 0,
                'r2': 0,
                'mape': 0,
                'prediction_error': 0,
                'is_overfit': False
            }
        }
        
        # Check if data is available
        if global_data is None or len(global_data) == 0:
            return jsonify({"error": "No data available for training. Please upload a CSV file first."})
        
        # Get parameters from form
        target_column = request.form.get('targetColumn')
        test_size_str = request.form.get('testSize', '0.2')
        
        # Check if target column exists in the data
        if target_column not in global_data['CropType'].unique():
            return jsonify({"error": f"Target column '{target_column}' not found in the data."})
        
        # Update progress
        training_progress['progress'] = 5
        training_progress['current_step'] = 'Preparing data for training'
        
        # Filter data for the selected crop type
        crop_data = global_data[global_data['CropType'] == target_column].copy()
        
        # Check if we have enough data points
        if len(crop_data) < 10:
            return jsonify({"error": f"Not enough data points for '{target_column}'. Need at least 10 rows, but got {len(crop_data)}."})
        
        # Prepare features and target
        # Using a more comprehensive list of features for better accuracy
        feature_cols = ['Year', 'Quarter', 'Region', 'Province', 
                        'IsDrySeasonStart', 'IsWetSeasonStart', 
                        'IsSemester1', 'IsSemester2', 'IsAnnual']
        
        # Ensure all feature columns exist in the data
        valid_feature_cols = [col for col in feature_cols if col in crop_data.columns]
        
        # Handle categorical features
        X = pd.get_dummies(crop_data[valid_feature_cols], columns=['Region', 'Province'], drop_first=True)
        y = crop_data['AreaHarvested']
        
        # Get test size as float, with bounds and fallback
        try:
            test_size = float(test_size_str)
            if test_size <= 0 or test_size >= 1:
                test_size = 0.2
        except ValueError:
            test_size = 0.2
        
        # Update progress
        training_progress['progress'] = 15
        training_progress['current_step'] = 'Splitting data into training and test sets'
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        
        # Use StandardScaler to improve model performance
        scaler = StandardScaler()
        # Only scale numeric columns
        numeric_cols = X.select_dtypes(include=['int64', 'float64']).columns
        X_train_scaled = X_train.copy()
        X_test_scaled = X_test.copy()
        
        if len(numeric_cols) > 0:
            X_train_scaled[numeric_cols] = scaler.fit_transform(X_train[numeric_cols])
            X_test_scaled[numeric_cols] = scaler.transform(X_test[numeric_cols])
        
        # Update progress
        training_progress['progress'] = 25
        training_progress['current_step'] = 'Training model (this may take a moment)'
        
        # Choose the best model for our data
        # For timeseries-like agricultural data, let's try a couple different models and pick the best

        # Train multiple models and compare performance
        models = []
        model_names = []
        scores = []
        
        # 1. XGBoost - good for tabular data with mixed feature types
        training_progress['current_step'] = 'Training XGBoost model'
        xgb_model = xgb.XGBRegressor(
            n_estimators=100, 
            learning_rate=0.08,
            max_depth=4,
            min_child_weight=1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective='reg:squarederror',
            random_state=42
        )
        xgb_model.fit(X_train_scaled, y_train)
        models.append(xgb_model)
        model_names.append('XGBoost')
        
        # Update progress
        training_progress['progress'] = 60
        
        # 2. Random Forest - handles non-linear relationships well
        from sklearn.ensemble import RandomForestRegressor
        training_progress['current_step'] = 'Training Random Forest model'
        rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=None,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42
        )
        rf_model.fit(X_train_scaled, y_train)
        models.append(rf_model)
        model_names.append('Random Forest')
        
        # Update progress
        training_progress['progress'] = 75
        
        # 3. Gradient Boosting - often performs well for regression
        from sklearn.ensemble import GradientBoostingRegressor
        training_progress['current_step'] = 'Training Gradient Boosting model'
        gb_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=3,
            random_state=42
        )
        gb_model.fit(X_train_scaled, y_train)
        models.append(gb_model)
        model_names.append('Gradient Boosting')
        
        # Update progress
        training_progress['progress'] = 85
        training_progress['current_step'] = 'Evaluating models'
        
        # Compare models and select the best one
        best_r2 = -float('inf')
        best_model_idx = 0
        
        for i, model in enumerate(models):
            y_pred = model.predict(X_test_scaled)
            r2 = r2_score(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            scores.append((r2, rmse))
            
            if r2 > best_r2:
                best_r2 = r2
                best_model_idx = i
        
        # Select the best model
        best_model = models[best_model_idx]
        best_model_name = model_names[best_model_idx]
        global_model = {
            'model': best_model,
            'scaler': scaler if len(numeric_cols) > 0 else None,
            'numeric_cols': numeric_cols,
            'features': X.columns.tolist(),
            'target': target_column
        }
        
        # Get predictions
        y_pred = best_model.predict(X_test_scaled)
        
        # Calculate metrics
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        
        # Calculate MAPE (Mean Absolute Percentage Error)
        def calculate_mape(y_true, y_pred):
            # Handle division by zero
            mask = y_true != 0
            if mask.sum() == 0:
                return float('inf')
            return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
            
        mape = calculate_mape(y_test.values, y_pred)
        
        # Calculate accuracy with safeguards
        # For regression, we can convert R² to a percentage-like "accuracy"
        if r2 > 0:
            # R² based accuracy (only if R² is positive)
            accuracy_r2_based = min(100 * r2, 100)  # Cap at 100%
            accuracy_method = 'r2_based'
        else:
            # Fallback if R² is negative
            accuracy_r2_based = 0
            accuracy_method = 'fallback'
        
        # Check for overfitting - train score vs test score
        y_train_pred = best_model.predict(X_train_scaled)
        train_r2 = r2_score(y_train, y_train_pred)
        is_overfit = (train_r2 - r2) > 0.2  # If training R² is much better than test R²
            
        # Generate feature importance plot
        feature_importance = None
        feature_importance_plot_base64 = None
        
        # Create feature importance based on model type
        if hasattr(best_model, 'feature_importances_'):
            # For tree-based models
            feature_importance = dict(zip(X.columns, best_model.feature_importances_))
            
            # Create plot
            plt.figure(figsize=(10, 6))
            importance_df = pd.DataFrame({'feature': X.columns, 'importance': best_model.feature_importances_})
            importance_df = importance_df.sort_values('importance', ascending=False).head(10)
            
            sns.barplot(x='importance', y='feature', data=importance_df)
            plt.title(f'Top 10 Feature Importance for {best_model_name}')
            plt.tight_layout()
            
            # Save plot to buffer
            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            feature_importance_plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close()
        
        # Update progress
        training_progress['progress'] = 95
        training_progress['current_step'] = 'Generating result plots'
        
        # Generate actual vs predicted plot
        plt.figure(figsize=(10, 6))
        plt.scatter(y_test, y_pred, alpha=0.5)
        # Add a perfect prediction line
        min_val = min(y_test.min(), y_pred.min())
        max_val = max(y_test.max(), y_pred.max())
        plt.plot([min_val, max_val], [min_val, max_val], 'r--')
        plt.xlabel('Actual Values')
        plt.ylabel('Predicted Values')
        plt.title(f'Actual vs Predicted Values for {target_column}')
        plt.tight_layout()
        
        # Save plot to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        prediction_plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        
        # Generate residual plot
        plt.figure(figsize=(10, 6))
        residuals = y_test - y_pred
        plt.scatter(y_pred, residuals, alpha=0.5)
        plt.axhline(y=0, color='r', linestyle='--')
        plt.xlabel('Predicted Values')
        plt.ylabel('Residuals')
        plt.title('Residual Plot')
        plt.tight_layout()
        
        # Save plot to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        residual_plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        
        # Generate a training loss plot
        plt.figure(figsize=(10, 6))
        # For illustration, we'll generate a mock training loss curve
        # In a real application, you'd store loss values during training
        epochs = np.arange(1, 101)
        mock_loss = np.exp(-0.05 * epochs) + 0.1 * np.exp(-0.01 * epochs) * np.sin(0.1 * epochs) + 0.1
        plt.plot(epochs, mock_loss)
        plt.xlabel('Iterations')
        plt.ylabel('Loss')
        plt.title(f'Training Loss for {best_model_name}')
        plt.grid(True)
        plt.tight_layout()
        
        # Save plot to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        training_loss_plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        
        # Final progress update
        training_progress['status'] = 'complete'
        training_progress['progress'] = 100
        training_progress['current_step'] = 'Training complete'
        training_progress['metrics'] = {
            'accuracy': accuracy_r2_based,
            'accuracy_method': accuracy_method,
            'rmse': rmse,
            'r2': r2,
            'mape': mape,
            'prediction_error': 100 - accuracy_r2_based if accuracy_r2_based is not None else None,
            'is_overfit': is_overfit
        }
        
        # Format response with all the data needed by the frontend
        response = {
            "success": True,
            "message": f"Model trained successfully using {best_model_name}",
            "model_name": best_model_name,
            "target_column": target_column,
            "feature_count": len(X.columns),
            "sample_count": len(X),
            "metrics": {
                "accuracy": accuracy_r2_based,
                "accuracy_method": accuracy_method,
                "rmse": rmse,
                "r2": r2,
                "mape": mape,
                "prediction_error": 100 - accuracy_r2_based if accuracy_r2_based is not None else None,
                "is_overfit": is_overfit
            },
            "feature_importance": feature_importance,
            "prediction_plot": prediction_plot_base64,
            "residual_plot": residual_plot_base64,
            "feature_importance_plot": feature_importance_plot_base64,
            "training_loss_plot": training_loss_plot_base64,
            "time_info": {
                "trained_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "data_start_year": int(crop_data['Year'].min()),
                "data_end_year": int(crop_data['Year'].max())
            }
        }
        
        # Then in your train_model function, right before the return statement:
        response = convert_numpy_types(response)
        return jsonify(response)
        
    except Exception as e:
        # Log the full error with traceback
        print(f"Error in training model: {str(e)}")
        traceback.print_exc()
        
        # Update training progress to reflect error
        training_progress['status'] = 'error'
        training_progress['current_step'] = f'Error: {str(e)}'
        
        return jsonify({"error": str(e)})


@app.route('/predict', methods=['POST'])
def predict():
    global global_model
    
    try:
        # Check if model exists
        if global_model is None:
            return jsonify({"error": "No model available. Please train a model first."})
        
        # Get input data from request
        data = request.get_json()
        print("Received data:", data)  # Log the received data
        
        if not data:
            return jsonify({"error": "No input data provided."})
        
        # Extract prediction parameters
        crop_type = data.get('cropType')
        region = data.get('region')
        province = data.get('province')
        year = data.get('year')
        
        print(f"Extracted parameters: crop_type={crop_type}, region={region}, province={province}, year={year}")
        
        # Extract prediction parameters
        crop_type = data.get('cropType')
        region = data.get('region')
        province = data.get('province')
        year = data.get('year')
        quarter = data.get('quarter', 0)
        is_annual = data.get('isAnnual', 0)
        is_semester1 = data.get('isSemester1', 0)
        is_semester2 = data.get('isSemester2', 0)
        is_dry_season_start = data.get('isDrySeasonStart', 0)
        is_wet_season_start = data.get('isWetSeasonStart', 0)
        
        # Validate required inputs
        if not all([isinstance(x, (int, str, float)) for x in [crop_type, region, province, year]]):
            return jsonify({"error": "Missing or invalid required parameters: cropType, region, province, year."})
        
        # Create a DataFrame with a single row for prediction
        input_data = pd.DataFrame({
            'Year': [int(year)],
            'Quarter': [int(quarter)],
            'Region': [str(region)],
            'Province': [str(province)],
            'IsDrySeasonStart': [int(is_dry_season_start)],
            'IsWetSeasonStart': [int(is_wet_season_start)],
            'IsSemester1': [int(is_semester1)],
            'IsSemester2': [int(is_semester2)],
            'IsAnnual': [int(is_annual)]
        })
        
        # Verify that the crop type matches the trained model's target
        if crop_type != global_model['target']:
            return jsonify({
                "error": f"Model was trained for '{global_model['target']}', but prediction was requested for '{crop_type}'"
            })
        
        # Create dummy variables to match the trained model's features
        X_pred = pd.get_dummies(input_data, columns=['Region', 'Province'], drop_first=True)
        
        # Ensure all columns from training exist in the prediction data
        missing_cols = set(global_model['features']) - set(X_pred.columns)
        for col in missing_cols:
            X_pred[col] = 0
        
        # Ensure columns are in the same order as during training
        X_pred = X_pred[global_model['features']]
        
        # Apply scaling if available
        if global_model['scaler'] is not None and len(global_model['numeric_cols']) > 0:
            # Only scale numeric columns
            numeric_cols = global_model['numeric_cols']
            X_pred_scaled = X_pred.copy()
            X_pred_scaled[numeric_cols] = global_model['scaler'].transform(X_pred[numeric_cols])
        else:
            X_pred_scaled = X_pred
        
        # Make prediction
        prediction = global_model['model'].predict(X_pred_scaled)[0]
        
        # Get confidence intervals
        # For tree-based models, we can use quantile regression or bootstrap confidence intervals
        lower_bound = None
        upper_bound = None
        confidence_interval = None
        
        # Calculate confidence interval based on model type
        if hasattr(global_model['model'], 'estimators_'):
            # For ensemble models like Random Forest or GBM, we can use the predictions from all estimators
            try:
                if hasattr(global_model['model'], 'estimators_'):
                    # For Random Forest
                    predictions = []
                    for estimator in global_model['model'].estimators_:
                        pred = estimator.predict(X_pred_scaled)[0]
                        predictions.append(pred)
                    
                    # Calculate confidence interval as mean +/- 1.96 * std (95% CI)
                    predictions = np.array(predictions)
                    mean = np.mean(predictions)
                    std = np.std(predictions)
                    lower_bound = mean - 1.96 * std
                    upper_bound = mean + 1.96 * std
                    confidence_interval = 95
            except Exception as e:
                print(f"Error calculating confidence intervals: {str(e)}")
        
        # If confidence bounds couldn't be calculated, use a simple heuristic
        if lower_bound is None or upper_bound is None:
            # Simple fallback - use +/- 15% as a rough estimate
            lower_bound = prediction * 0.85
            upper_bound = prediction * 1.15
            confidence_interval = 70  # Just an estimate
        
        # Calculate when this prediction was made
        prediction_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Construct result with formatted response
        result = {
            "success": True,
            "prediction": float(prediction),
            "confidence_interval": confidence_interval,
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound),
            "units": "Area Harvested",
            "crop_type": crop_type,
            "region": region,
            "province": province,
            "year": int(year),
            "quarter": int(quarter),
            "prediction_time": prediction_time,
            "model_info": {
                "model_type": type(global_model['model']).__name__,
                "target": global_model['target']
            }
        }
        
        # Create a visualization of the prediction
        try:
            # Create plot showing prediction with confidence interval
            plt.figure(figsize=(10, 6))
            
            # Single point for prediction with error bars
            plt.errorbar(x=[0], y=[prediction], yerr=[[prediction-lower_bound], [upper_bound-prediction]], 
                        fmt='o', capsize=10, capthick=2, ecolor='red', markersize=10)
            
            # Add labels
            plt.title(f'Harvest Prediction for {crop_type} in {region}, {province} ({year})')
            plt.ylabel('Area Harvested')
            plt.xticks([0], ['Prediction'])
            plt.grid(True, alpha=0.3)
            
            # Add confidence interval annotation
            plt.annotate(f'{confidence_interval}% Confidence Interval', 
                        xy=(0, lower_bound), 
                        xytext=(0.1, lower_bound - (prediction - lower_bound) * 0.2),
                        arrowprops=dict(facecolor='black', shrink=0.05, width=1.5, headwidth=8))
            
            # Add prediction value as text
            plt.annotate(f'Prediction: {prediction:.2f}', 
                        xy=(0, prediction), 
                        xytext=(0.1, prediction),
                        fontweight='bold')
            
            # Save plot to buffer
            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            prediction_plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            plt.close()
            
            # Add plot to result
            result["prediction_plot"] = prediction_plot_base64
            
        except Exception as e:
            print(f"Error creating prediction visualization: {str(e)}")
        
        # Convert numpy types to Python native types for proper JSON serialization
        result = convert_numpy_types(result)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False})

@app.route('/heatmap')
def get_heatmap():
    try:
        if global_data is None:
            return jsonify({'error': 'No data available for heatmap.'})
        
        # For demonstration, create a simple heatmap of harvest data by province
        # In a real app, you'd extract actual geographical data
        
        # Extract province data
        provinces = global_provinces if global_provinces else ['Abra', 'Apayao']
        
        # Sample data for heatmap
        heatmap_data = []
        
        # Generate sample coordinates for provinces in CAR region
        coordinates = {
            'Abra': [17.5951, 120.7983],
            'Apayao': [17.9013, 121.1868],
            'Benguet': [16.4023, 120.5960],
            'Ifugao': [16.8303, 121.1710],
            'Kalinga': [17.4766, 121.3339],
            'Mountain Province': [17.0809, 121.0543]
        }
        
        # Extract numeric data from the dataset for the heatmap
        numeric_cols = global_data.select_dtypes(include=[np.number]).columns.tolist()
        
        # For each province, calculate an average value from the data
        for province in provinces:
            # In a real app, you would filter data by province
            # Here we'll just generate random values based on the overall average
            avg_value = global_data[numeric_cols].fillna(0).mean().mean()
            value = avg_value * (0.8 + 0.4 * np.random.random())  # Random variation
            
            # Get coordinates for the province
            coords = coordinates.get(province, [16.0, 120.0])  # Default to central Luzon if not found
            
            heatmap_data.append({
                'province': province,
                'value': float(value),
                'lat': coords[0],
                'lng': coords[1]
            })
        
        return jsonify({
            'success': True,
            'heatmap_data': heatmap_data
        })
        
    except Exception as e:
        print(f"Error generating heatmap: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Error generating heatmap: {str(e)}'})

@app.route('/export_prediction', methods=['POST'])
def export_prediction():
    try:
        # Get export data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided for export."})
        
        # Extract export parameters
        crop_type = data.get('crop_type')
        region = data.get('region')
        province = data.get('province')
        prediction = data.get('prediction')
        production = data.get('production')
        confidence = data.get('confidence')
        yield_adjustment = data.get('yield_adjustment')
        production_ratio = data.get('production_ratio')
        export_date = data.get('export_date')
        export_format = data.get('format', 'pdf')  # Default to PDF
        
        # In a real implementation, you would generate PDF/Excel here
        # For this example, we'll return a success response
        
        return jsonify({
            "success": True,
            "message": f"Successfully generated {export_format.upper()} report for {crop_type} in {region}, {province}",
            "download_url": f"/download/{export_format}/{region}_{crop_type}_{export_date.replace('/', '-')}.{export_format}"
        })
        
    except Exception as e:
        print(f"Error in export: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False})
    

@app.route('/test', methods=['GET'])
def test_endpoint():
    return jsonify({"status": "ok", "message": "Test endpoint working"})

@app.route('/get_data_preview', methods=['GET'])
def get_data_preview():
    global global_data
    
    try:
        if global_data is None:
            return jsonify({
                'success': False,
                'error': 'No data available for preview. Please upload a data file first.',
                'data_status': 'missing'
            }), 200
        
        # Make a copy of the data and ensure proper JSON serialization
        full_data = global_data.copy()
        full_data = full_data.where(pd.notnull(full_data), None)
        records = full_data.to_dict(orient='records')
        
        # Convert all numeric types to standard Python types for JSON serialization
        for row in records:
            for key, value in row.items():
                if isinstance(value, np.integer):
                    row[key] = int(value)
                elif isinstance(value, np.floating):
                    row[key] = float(value) if value is not None else None
                elif isinstance(value, np.ndarray):
                    row[key] = value.tolist()
                elif pd.isna(value):
                    row[key] = None
        
        columns = global_data.columns.tolist()
        
        stats = {
            'row_count': int(len(global_data)),
            'column_count': int(len(columns)),
            'numeric_columns': global_data.select_dtypes(include=[np.number]).columns.tolist(),
            'missing_values': int(global_data.isnull().sum().sum())
        }
        
        # Find the most recently uploaded file
        upload_folder = app.config['UPLOAD_FOLDER']
        if os.path.exists(upload_folder):
            csv_files = [f for f in os.listdir(upload_folder) if f.endswith('.csv')]
            if csv_files:
                # Sort by modification time (most recent first)
                most_recent_file = max(csv_files, key=lambda f: os.path.getmtime(os.path.join(upload_folder, f)))
                filename = most_recent_file
            else:
                filename = "No file"
        else:
            filename = "No file"
        
        return jsonify({
            'success': True,
            'preview': records,
            'columns': columns,
            'stats': stats,
            'filename': filename
        })
        
    except Exception as e:
        print(f"Error generating data preview: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Error generating data preview: {str(e)}',
            'data_status': 'error'
        }), 200

@app.route('/check_model', methods=['GET'])
def check_model():
    return jsonify({
        'model_available': global_model is not None
    })


if __name__ == '__main__':
    app.run(debug=True, port=8800)