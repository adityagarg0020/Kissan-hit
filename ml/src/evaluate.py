import os
import json
import joblib
import pandas as pd
import numpy as np

def evaluate_summary():
    metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "evaluation_metrics.json"))
    if not os.path.exists(metrics_path):
        print("Metrics file not found. Run train.py first.")
        return
        
    with open(metrics_path, 'r') as f:
        data = json.load(f)
        
    print("=" * 60)
    print("KISSANSAATHI ML MODEL EVALUATION REPORT")
    print(f"Train Period: {data.get('train_range')}")
    print(f"Val Period:   {data.get('val_range')}")
    print(f"Test Period:  {data.get('test_range')} (Chronological Holdout)")
    print(f"Selected Best Model: {data.get('best_model')}")
    print("=" * 60)
    
    df_metrics = pd.DataFrame(data['metrics_table'])
    print(df_metrics.to_string(index=False))
    return df_metrics

if __name__ == '__main__':
    evaluate_summary()
