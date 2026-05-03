from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os

app = FastAPI(title="Data Usage Predictor API")

# Allow Frontend to communicate with Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model pipeline
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
try:
    model_pipeline = joblib.load(MODEL_PATH)
    print("Machine Learning Model loaded successfully.")
except Exception as e:
    print(f"Error loading model from {MODEL_PATH}: {e}")
    model_pipeline = None

# Input Data Schema
class PredictionRequest(BaseModel):
    telecom_partner: str
    gender: str
    age: int
    city: str
    num_dependents: int
    estimated_salary: float
    calls_made: int
    sms_sent: int
    streaming_hours: float
    gaming_hours: float
    social_media_hours: float
    wifi_ratio: float
    weekend_usage_ratio: float
    background_data_mb: float
    auto_update: int

@app.post("/predict")
def predict_data_usage(req: PredictionRequest):
    if model_pipeline is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Please train the model first.")
    
    # Apply hard business rule: inactive sim = no data usage
    if req.calls_made == 0 and req.sms_sent == 0:
        return {"predicted_data_used_gb": 0}

    # Convert request to DataFrame
    data = {
        "telecom_partner": [req.telecom_partner],
        "gender": [req.gender],
        "age": [req.age],
        "city": [req.city],
        "num_dependents": [req.num_dependents],
        "estimated_salary": [req.estimated_salary],
        "calls_made": [req.calls_made],
        "sms_sent": [req.sms_sent],
        "streaming_hours": [req.streaming_hours],
        "gaming_hours": [req.gaming_hours],
        "social_media_hours": [req.social_media_hours],
        "wifi_ratio": [req.wifi_ratio],
        "weekend_usage_ratio": [req.weekend_usage_ratio],
        "background_data_mb": [req.background_data_mb],
        "auto_update": [req.auto_update]
    }
    df = pd.DataFrame(data)
    
    try:
        # Predict
        prediction = model_pipeline.predict(df)[0]
        # Data usage cannot be negative
        predicted_gb = max(0, round(prediction, 2))
        
        # Explainable AI (XAI) Heuristics
        explanations = []
        if req.streaming_hours > 3.0:
            explanations.append({"feature": "Streaming", "effect": "positive", "text": "High streaming hours significantly increased your predicted data consumption."})
        elif req.streaming_hours < 1.0:
            explanations.append({"feature": "Streaming", "effect": "negative", "text": "Low streaming hours kept your data consumption low."})
            
        if req.wifi_ratio > 0.7:
            explanations.append({"feature": "Wi-Fi Ratio", "effect": "negative", "text": "A high Wi-Fi reliance heavily reduced your cellular data usage."})
        elif req.wifi_ratio < 0.3:
            explanations.append({"feature": "Wi-Fi Ratio", "effect": "positive", "text": "Low Wi-Fi availability resulted in much higher cellular data dependence."})
            
        if req.gaming_hours > 2.0:
            explanations.append({"feature": "Gaming", "effect": "positive", "text": "Active mobile gaming contributed significantly to the prediction."})
        
        if req.calls_made > 100:
            explanations.append({"feature": "Calls", "effect": "neutral", "text": "High call volume indicates heavy phone usage but doesn't heavily impact cellular data."})

        return {"predicted_data_used_gb": predicted_gb, "explanations": explanations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
