"""
Persistent ML Worker Process
-----------------------------
Loads the model ONCE on startup, then listens on stdin for JSON input.
Outputs a JSON result to stdout for each input. Stays alive indefinitely.
This eliminates the per-request startup overhead of Python + library imports.
"""
import sys
import json
import pandas as pd
import joblib
import os
import warnings

warnings.filterwarnings('ignore')

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

# --- Load model ONCE at startup ---
try:
    model_pipeline = joblib.load(MODEL_PATH)
    # Signal to Node.js that the worker is ready
    sys.stdout.write(json.dumps({"status": "ready"}) + "\n")
    sys.stdout.flush()
except Exception as e:
    sys.stdout.write(json.dumps({"status": "error", "error": f"Model failed to load: {str(e)}"}) + "\n")
    sys.stdout.flush()
    sys.exit(1)


def predict(req):
    """Run prediction on a single request dict."""
    # Hard business rule: inactive sim = no data usage
    if req.get('calls_made', 0) == 0 and req.get('sms_sent', 0) == 0:
        return {"predicted_data_used_gb": 0, "explanations": []}

    data = {
        "telecom_partner":     [req.get('telecom_partner')],
        "gender":              [req.get('gender')],
        "age":                 [req.get('age')],
        "city":                [req.get('city')],
        "num_dependents":      [req.get('num_dependents')],
        "estimated_salary":    [req.get('estimated_salary')],
        "calls_made":          [req.get('calls_made')],
        "sms_sent":            [req.get('sms_sent')],
        "streaming_hours":     [req.get('streaming_hours')],
        "gaming_hours":        [req.get('gaming_hours')],
        "social_media_hours":  [req.get('social_media_hours')],
        "wifi_ratio":          [req.get('wifi_ratio')],
        "weekend_usage_ratio": [req.get('weekend_usage_ratio')],
        "background_data_mb":  [req.get('background_data_mb')],
        "auto_update":         [req.get('auto_update')]
    }
    df = pd.DataFrame(data)

    base_prediction = model_pipeline.predict(df)[0]

    # Heuristic: weekend_usage_ratio visibly impacts the prediction
    weekend_ratio = req.get('weekend_usage_ratio', 0.28)
    weekend_modifier = 1.0 + (weekend_ratio - 0.28) * 0.4
    prediction = base_prediction * weekend_modifier
    predicted_gb = max(0, round(float(prediction), 2))

    # Explainable AI (XAI) Heuristics
    explanations = []
    stream_hrs = req.get('streaming_hours', 0)
    if stream_hrs > 3.0:
        explanations.append({"feature": "Streaming", "effect": "positive",
            "text": "High streaming hours significantly increased your predicted data consumption."})
    elif stream_hrs < 1.0:
        explanations.append({"feature": "Streaming", "effect": "negative",
            "text": "Low streaming hours kept your data consumption low."})

    wifi = req.get('wifi_ratio', 0)
    if wifi > 0.7:
        explanations.append({"feature": "Wi-Fi Ratio", "effect": "negative",
            "text": "A high Wi-Fi reliance heavily reduced your cellular data usage."})
    elif wifi < 0.3:
        explanations.append({"feature": "Wi-Fi Ratio", "effect": "positive",
            "text": "Low Wi-Fi availability resulted in much higher cellular data dependence."})

    if req.get('gaming_hours', 0) > 2.0:
        explanations.append({"feature": "Gaming", "effect": "positive",
            "text": "Active mobile gaming contributed significantly to the prediction."})

    if weekend_ratio > 0.6:
        explanations.append({"feature": "Weekend Usage", "effect": "positive",
            "text": "Concentrating your data usage on weekends generally increases total monthly consumption due to binge habits."})
    elif weekend_ratio < 0.15:
        explanations.append({"feature": "Weekend Usage", "effect": "negative",
            "text": "Low weekend usage suggests you use data strictly for necessities, keeping overall consumption lower."})

    if req.get('calls_made', 0) > 100:
        explanations.append({"feature": "Calls", "effect": "neutral",
            "text": "High call volume indicates heavy phone usage but doesn't heavily impact cellular data."})

    return {"predicted_data_used_gb": predicted_gb, "explanations": explanations}


# --- Persistent stdin/stdout event loop ---
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        result = predict(req)
        sys.stdout.write(json.dumps(result) + "\n")
        sys.stdout.flush()
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e)}) + "\n")
        sys.stdout.flush()
