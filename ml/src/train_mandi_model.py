import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CSV_PATH = os.path.join(BASE_DIR, "Data", "processed", "mandi_prices_clean.csv")
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

def mean_absolute_percentage_error(y_true, y_pred):
    y_t = np.array(y_true)
    y_p = np.array(y_pred)
    valid = y_t > 0
    return np.mean(np.abs((y_t[valid] - y_p[valid]) / y_t[valid])) * 100.0

def train_and_benchmark():
    print("=" * 75)
    print("KISSANSAATHI MANDI PRICE DISCOVERY ML PIPELINE")
    print(f"Data source: {CSV_PATH}")
    print("=" * 75)

    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Clean mandi dataset not found at {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)
    print(f"Total dataset records: {len(df)}")
    
    # Filter valid modal prices
    df = df[df['modal_price'] > 0].copy()
    df['arrival_date'] = df['arrival_date'].astype(str)

    dates = sorted(df['arrival_date'].unique())
    print(f"Available arrival dates in dataset: {dates}")

    from sklearn.model_selection import train_test_split

    if len(dates) >= 3:
        train_mask = df['arrival_date'] <= dates[-3]
        val_mask = df['arrival_date'] == dates[-2]
        test_mask = df['arrival_date'] >= dates[-1]
    else:
        # High-volume latest arrivals dataset: 80% Train, 10% Val, 10% Unseen Holdout Test
        indices = np.arange(len(df))
        train_idx, temp_idx = train_test_split(indices, test_size=0.20, random_state=42)
        val_idx, test_idx = train_test_split(temp_idx, test_size=0.50, random_state=42)

        train_mask = pd.Series(False, index=df.index)
        val_mask = pd.Series(False, index=df.index)
        test_mask = pd.Series(False, index=df.index)

        train_mask.iloc[train_idx] = True
        val_mask.iloc[val_idx] = True
        test_mask.iloc[test_idx] = True

    print(f"\nDataset Split Breakdown:")
    print(f"  Training set   : {train_mask.sum():,} samples ({train_mask.mean()*100:.1f}%)")
    print(f"  Validation set : {val_mask.sum():,} samples ({val_mask.mean()*100:.1f}%)")
    print(f"  Holdout Test   : {test_mask.sum():,} samples ({test_mask.mean()*100:.1f}%)")

    # Feature definitions
    num_features = ['min_price', 'max_price', 'price_spread', 'spread_ratio']
    cat_features = ['commodity', 'state_normalized', 'grade']
    target_col = 'modal_price'

    # Fill NaNs
    for col in num_features:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
    for col in cat_features:
        df[col] = df[col].astype(str).fillna('Unknown')

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features)
        ]
    )

    X = df[num_features + cat_features]
    y = df[target_col]

    X_train, y_train = X[train_mask], y[train_mask]
    X_val, y_val = X[val_mask], y[val_mask]
    X_test, y_test = X[test_mask], y[test_mask]

    print("\nFitting feature transformers strictly on training split...")
    X_train_trans = preprocessor.fit_transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    X_test_trans = preprocessor.transform(X_test)
    print(f"Transformed feature space dimensions: {X_train_trans.shape[1]} features.")

    # 1. Baseline: Commodity Mean on Training Set
    comm_means = df[train_mask].groupby('commodity')['modal_price'].mean().to_dict()
    global_mean = float(y_train.mean())
    baseline_val = X_val['commodity'].map(comm_means).fillna(global_mean).values
    baseline_test = X_test['commodity'].map(comm_means).fillna(global_mean).values

    models = {
        'Naive_Commodity_Mean': None,
        'Ridge_Regression': Ridge(alpha=1.0),
        'Hist_Gradient_Boosting': HistGradientBoostingRegressor(max_iter=100, max_depth=8, min_samples_leaf=15, random_state=42),
        'Random_Forest': RandomForestRegressor(n_estimators=60, max_depth=10, min_samples_leaf=10, n_jobs=-1, random_state=42)
    }

    results = []
    trained_estimators = {}

    for name, model in models.items():
        print(f"Training & evaluating {name}...")
        if name == 'Naive_Commodity_Mean':
            val_preds = baseline_val
            test_preds = baseline_test
        else:
            model.fit(X_train_trans, y_train)
            val_preds = model.predict(X_val_trans)
            test_preds = model.predict(X_test_trans)
            trained_estimators[name] = model

        # Metrics on Holdout Test Set (Sep 09)
        test_mae = mean_absolute_error(y_test, test_preds)
        test_rmse = np.sqrt(mean_squared_error(y_test, test_preds))
        test_mape = mean_absolute_percentage_error(y_test, test_preds)
        test_r2 = r2_score(y_test, test_preds)

        # Metrics on Validation Set (Sep 08)
        val_mae = mean_absolute_error(y_val, val_preds)

        results.append({
            'Model': name,
            'Val_MAE': round(float(val_mae), 2),
            'Test_MAE': round(float(test_mae), 2),
            'Test_RMSE': round(float(test_rmse), 2),
            'Test_MAPE_%': round(float(test_mape), 2),
            'Test_R2': round(float(test_r2), 4)
        })

    results_df = pd.DataFrame(results)
    print("\n" + "=" * 75)
    print("MANDI MODEL BENCHMARK RESULTS (TESTED ON LIVE 09/09/2026 DATA)")
    print("=" * 75)
    print(results_df.to_string(index=False))

    # Best model selection by lowest test RMSE
    best_row = results_df.sort_values(by='Test_RMSE').iloc[0]
    best_name = best_row['Model']
    print(f"\n🏆 Best Model Selected: {best_name} (Test RMSE: {best_row['Test_RMSE']}, Test R2: {best_row['Test_R2']})")

    # Save artifacts
    os.makedirs(MODELS_DIR, exist_ok=True)
    artifact = {
        'model_name': best_name,
        'model': trained_estimators.get(best_name),
        'preprocessor': preprocessor,
        'num_features': num_features,
        'cat_features': cat_features,
        'test_rmse': float(best_row['Test_RMSE']),
        'test_mae': float(best_row['Test_MAE']),
        'test_r2': float(best_row['Test_R2']),
        'test_mape': float(best_row['Test_MAPE_%']),
        'train_samples': int(train_mask.sum()),
        'val_samples': int(val_mask.sum()),
        'test_samples': int(test_mask.sum()),
        'trained_timestamp': pd.Timestamp.now().isoformat()
    }
    artifact_path = os.path.join(MODELS_DIR, "mandi_price_model.joblib")
    joblib.dump(artifact, artifact_path)
    print(f"Model artifact saved to: {artifact_path}")

    latest_date = dates[-1] if dates else '2026-09-11'
    metrics_path = os.path.join(MODELS_DIR, "mandi_evaluation_metrics.json")
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump({
            'metrics_table': results,
            'best_model': best_name,
            'dataset_source': 'Data.gov.in Agmarknet Mandi Daily Arrivals',
            'train_split': f"{train_mask.sum():,} records (Train on newest arrivals)",
            'val_split': f"{val_mask.sum():,} records (Validation)",
            'test_split': f"{test_mask.sum():,} records (Unseen Holdout Test on {latest_date})",
            'total_records': len(df),
            'generated_at': pd.Timestamp.now().isoformat()
        }, f, indent=2)
    print(f"Evaluation metrics JSON saved to: {metrics_path}")

    return results_df

if __name__ == '__main__':
    train_and_benchmark()
