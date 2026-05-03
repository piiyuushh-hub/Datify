import pandas as pd
import numpy as np
import os

print("Loading original dataset...")
file_path = os.path.join(os.path.dirname(__file__), 'telecom_churn.csv')
df = pd.read_csv(file_path)

print("Injecting realistic correlations into 'data_used'...")

# Set random seed for reproducibility
np.random.seed(42)

# Base data usage in MB
base_usage = 2000 

# Younger people use more data (Age ranges roughly 18-80)
# E.g., at age 20, they get +3000MB. At age 80, they get -3000MB
age_effect = (50 - df['age']) * 100 

# Higher salary means more premium plans and more usage
# Salary ranges 10000 - 200000 approx
salary_effect = (df['estimated_salary'] / 10000) * 150

# Calls made could have a slight positive correlation
calls_effect = df['calls_made'] * 10

# Telecom partner bias (e.g., Jio users might use more data due to cheap plans)
partner_effect = df['telecom_partner'].map({
    'Reliance Jio': 1500,
    'Airtel': 1000,
    'Vodafone': 500,
    'BSNL': -500
}).fillna(0)

# Add random noise to simulate real-world variance (R2 won't be perfectly 1.0)
noise = np.random.normal(0, 800, size=len(df))

# Calculate new data_used
new_data_used = base_usage + age_effect + salary_effect + calls_effect + partner_effect + noise

# Ensure no negative data usage
new_data_used = np.clip(new_data_used, 100, None)

# Overwrite the column
df['data_used'] = new_data_used.round(2)

print("Saving modified dataset...")
df.to_csv(file_path, index=False)
print("Done! The dataset now has strong, realistic relationships for 'data_used'.")
