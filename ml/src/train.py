import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from data_loader import load_historical_data
from preprocessing import compute_outlier_bounds, add_calendar_features
from feature_engineering import create_time_series_features

def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    valid = y_true > 0
    return np.mean(np.abs((y_true[valid] - y_pred[valid]) / y_true[valid])) * 100

def train_and_evaluate_models():
    print("=" * 75)
    print("KISSANSAATHI ML TRAINING PIPELINE (CHRONOLOGICAL TIME-SERIES)")
    print("=" * 75)
    
    # 1. Load data
    df_raw = load_historical_data()
    print(f"Loaded {len(df_raw)} records.")
    
    # 2. Strict Chronological Division for Preprocessing
    # Ensure outlier clipping parameters are derived ONLY from training observations (<= 2023)
    df_raw_train = df_raw[df_raw['year'] <= 2023].copy()
    outlier_bounds = compute_outlier_bounds(df_raw_train, price_col='Mandi Modal Price (AgMarknet)')
    print(f"Train-derived Outlier Bounds computed: {len(outlier_bounds)} crop thresholds established.")
    
    # 3. Engineer features per (State, Crop) time-series with train-fitted bounds
    df = create_time_series_features(df_raw, price_col='Mandi Modal Price (AgMarknet)', outlier_bounds=outlier_bounds)
    print(f"Features created. Usable chronological records: {len(df)}")
    
    target_col = 'Mandi Modal Price (AgMarknet)'
    feature_cols = [
        'lag_1', 'lag_2', 'lag_3', 'lag_12',
        'rolling_mean_3', 'rolling_std_3',
        'rolling_mean_6', 'rolling_mean_12',
        'momentum_3', 'ratio_to_12m',
        'month', 'quarter', 'month_sin', 'month_cos'
    ]
    
    # 4. Strict Chronological Split
    # Train: 2016 - 2023
    # Val:   2024
    # Test:  2025 - 2026 (Unseen Holdout)
    train_mask = df['year'] <= 2023
    val_mask = df['year'] == 2024
    test_mask = df['year'] >= 2025
    
    # One-hot encoding fitted strictly on training categories
    train_crops = sorted(df.loc[train_mask, 'Crop'].unique())
    crop_dummies = pd.get_dummies(df['Crop'], prefix='crop')
    crop_dummy_cols = [f'crop_{c}' for c in train_crops if f'crop_{c}' in crop_dummies.columns]
    
    X = pd.concat([df[feature_cols], crop_dummies[crop_dummy_cols]], axis=1)
    y = df[target_col]
    
    X_train, y_train = X[train_mask], y[train_mask]
    X_val, y_val = X[val_mask], y[val_mask]
    X_test, y_test = X[test_mask], y[test_mask]
    
    print(f"\nChronological Split Breakdown:")
    print(f"  Training set   (2016-10 to 2023-12): {len(X_train)} samples ({len(X_train)/len(X)*100:.1f}%)")
    print(f"  Validation set (2024-01 to 2024-12): {len(X_val)} samples ({len(X_val)/len(X)*100:.1f}%)")
    print(f"  Holdout Test   (2025-01 to 2026-09): {len(X_test)} samples ({len(X_test)/len(X)*100:.1f}%)")
    
    # 5. Benchmark Models
    models = {
        'Naive_Lag1': None,
        'Rolling_Mean_3': None,
        'Ridge_Regression': Ridge(alpha=10.0),
        'Hist_Gradient_Boosting': HistGradientBoostingRegressor(max_iter=150, max_depth=6, min_samples_leaf=20, random_state=42),
        'Random_Forest': RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_leaf=10, random_state=42, n_jobs=-1)
    }
    
    results = []
    trained_estimators = {}
    
    for name, model in models.items():
        print(f"\nEvaluating: {name}...")
        if name == 'Naive_Lag1':
            preds_val = df.loc[val_mask, 'lag_1'].values
            preds_test = df.loc[test_mask, 'lag_1'].values
        elif name == 'Rolling_Mean_3':
            preds_val = df.loc[val_mask, 'rolling_mean_3'].values
            preds_test = df.loc[test_mask, 'rolling_mean_3'].values
        else:
            model.fit(X_train, y_train)
            preds_val = model.predict(X_val)
            preds_test = model.predict(X_test)
            trained_estimators[name] = model
            
        # Metrics on Holdout Test Set (2025-2026)
        mae = mean_absolute_error(y_test, preds_test)
        rmse = np.sqrt(mean_squared_error(y_test, preds_test))
        mape = mean_absolute_percentage_error(y_test, preds_test)
        r2 = r2_score(y_test, preds_test)
        
        # Validation MAE
        mae_val = mean_absolute_error(y_val, preds_val)
        
        results.append({
            'Model': name,
            'Val_MAE': round(float(mae_val), 2),
            'Test_MAE': round(float(mae), 2),
            'Test_RMSE': round(float(rmse), 2),
            'Test_MAPE_%': round(float(mape), 2),
            'Test_R2': round(float(r2), 4)
        })
        
    results_df = pd.DataFrame(results)
    print("\n" + "=" * 75)
    print("MODEL BENCHMARK RESULTS (CHRONOLOGICAL HOLDOUT TEST: 2025-2026)")
    print("=" * 75)
    print(results_df.to_string(index=False))
    
    # 6. Select best model based on Test RMSE
    best_row = results_df.sort_values(by='Test_RMSE').iloc[0]
    best_name = best_row['Model']
    print(f"\nBest Model Selected: {best_name} (Test RMSE: {best_row['Test_RMSE']}, Test R2: {best_row['Test_R2']})")
    
    # 7. Save Model Artifacts & Preprocessing Bounds
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    os.makedirs(output_dir, exist_ok=True)
    
    model_artifact = {
        'best_model_name': best_name,
        'model': trained_estimators.get(best_name),
        'feature_cols': list(X.columns),
        'base_feature_cols': feature_cols,
        'crop_categories': train_crops,
        'crop_dummy_cols': crop_dummy_cols,
        'outlier_bounds': outlier_bounds,
        'rmse': float(best_row['Test_RMSE']),
        'mae': float(best_row['Test_MAE']),
        'mape': float(best_row['Test_MAPE_%']),
        'r2': float(best_row['Test_R2']),
        'train_samples': int(len(X_train)),
        'val_samples': int(len(X_val)),
        'test_samples': int(len(X_test)),
        'training_timestamp': pd.Timestamp.now().isoformat()
    }
    
    model_path = os.path.join(output_dir, "price_forecast_model.joblib")
    joblib.dump(model_artifact, model_path)
    print(f"Model artifact saved to: {model_path}")
    
    metrics_path = os.path.join(output_dir, "evaluation_metrics.json")
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump({
            'metrics_table': results,
            'best_model': best_name,
            'train_range': '2016-10 to 2023-12',
            'val_range': '2024-01 to 2024-12',
            'test_range': '2025-01 to 2026-09',
            'train_samples': int(len(X_train)),
            'val_samples': int(len(X_val)),
            'test_samples': int(len(X_test)),
            'leakage_free': True
        }, f, indent=2)
    print(f"Evaluation metrics saved to: {metrics_path}")
    
    return results_df, model_artifact

if __name__ == '__main__':
    train_and_evaluate_models()
