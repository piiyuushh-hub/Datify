from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import root_mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pandas as pd
import numpy as np
import joblib
import os

print("Loading dataset...")
file_path = os.path.join(os.path.dirname(__file__), 'final_realistic_dataset.csv')
df = pd.read_csv(file_path)

print(f"Original dataset shape: {df.shape}")

# Drop irrelevant columns for predicting data usage
columns_to_drop = ['customer_id', 'pincode', 'date_of_registration', 'churn', 'state']
df = df.drop(columns=[col for col in columns_to_drop if col in df.columns])

# Handle missing values by dropping them for simplicity, or imputing
df = df.dropna()
print(f"Dataset shape after dropping missing values & irrelevant columns: {df.shape}")

# OPTIMIZATION: Subsample the data to 50,000 rows so it trains quickly
if len(df) > 50000:
    print("Dataset is very large. Subsampling to 50,000 rows for faster training...")
    df = df.sample(n=50000, random_state=42)

# Separate features and target
X = df.drop(columns=['monthly_data_usage'])
y = df['monthly_data_usage']

# Identify numerical and categorical columns
categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
numerical_cols = X.select_dtypes(include=['number']).columns.tolist()

print("Numerical features:", numerical_cols)
print("Categorical features:", categorical_cols)

# Create preprocessor
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
    ])

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Define the models (Original 3 models)
models = {
    "Linear Regression": LinearRegression(),
    "Random Forest": RandomForestRegressor(n_estimators=30, max_depth=8, random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingRegressor(n_estimators=30, max_depth=5, random_state=42)
}

best_model = None
best_r2 = -float('inf')
best_model_name = ""
results = {}

print("\nTraining models... This might take a minute.")

for name, model in models.items():
    print(f"\nTraining {name}...")
    pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                               ('regressor', model)])
    
    # Train the model
    pipeline.fit(X_train, y_train)
    
    # Predict
    y_pred = pipeline.predict(X_test)
    
    # Evaluate
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    results[name] = {'RMSE': rmse, 'R2': r2, 'pipeline': pipeline}
    print(f"{name} Results - RMSE: {rmse:.2f}, R2: {r2:.4f}")
    
    # Check if best
    if r2 > best_r2:
        best_r2 = r2
        best_model = pipeline
        best_model_name = name

print(f"\n=============================================")
print(f"Best Model Selected: {best_model_name} (R2: {best_r2:.4f})")
print(f"=============================================")

# Save the best model
model_filename = os.path.join(os.path.dirname(__file__), 'model.pkl')
joblib.dump(best_model, model_filename)
print(f"\nModel saved successfully as {model_filename}")
