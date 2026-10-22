import numpy as np
import pandas as pd
from preprocessing import add_calendar_features, apply_outlier_bounds

def create_time_series_features(df, price_col='Mandi Modal Price (AgMarknet)', outlier_bounds=None):
    """
    Constructs autoregressive lag and rolling window features strictly chronologically
    per (State, Crop) series to prevent data leakage.
    """
    df = df.copy()
    if outlier_bounds is not None:
        df = apply_outlier_bounds(df, outlier_bounds, price_col=price_col)
    df = add_calendar_features(df)
    
    # Sort strictly by series and date
    df.sort_values(by=['State', 'Crop', 'date'], inplace=True)
    df.reset_index(drop=True, inplace=True)
    
    grouped = df.groupby(['State', 'Crop'])
    
    # Lags (t-1, t-2, t-3, t-12)
    df['lag_1'] = grouped[price_col].shift(1)
    df['lag_2'] = grouped[price_col].shift(2)
    df['lag_3'] = grouped[price_col].shift(3)
    df['lag_12'] = grouped[price_col].shift(12)  # Year-ago seasonal lag
    
    # Rolling Statistics computed on lag_1 to avoid leakage of current target
    # 3-month rolling mean & std
    rolling_3 = grouped['lag_1'].transform(lambda x: x.rolling(window=3, min_periods=1).mean())
    df['rolling_mean_3'] = rolling_3
    
    rolling_std_3 = grouped['lag_1'].transform(lambda x: x.rolling(window=3, min_periods=1).std().fillna(0))
    df['rolling_std_3'] = rolling_std_3
    
    # 6-month rolling mean
    rolling_6 = grouped['lag_1'].transform(lambda x: x.rolling(window=6, min_periods=2).mean())
    df['rolling_mean_6'] = rolling_6
    
    # 12-month rolling mean
    rolling_12 = grouped['lag_1'].transform(lambda x: x.rolling(window=12, min_periods=3).mean())
    df['rolling_mean_12'] = rolling_12
    
    # Price momentum: difference between lag_1 and lag_3
    df['momentum_3'] = df['lag_1'] - df['lag_3']
    
    # Ratio to 12-month average
    df['ratio_to_12m'] = df['lag_1'] / (df['rolling_mean_12'] + 1e-5)
    
    # Drop rows where lag_1 is NaN (i.e. first month of each series)
    feature_df = df.dropna(subset=['lag_1']).copy()
    
    # Backfill missing lag_2, lag_3, lag_12 with available lags
    feature_df['lag_2'] = feature_df['lag_2'].fillna(feature_df['lag_1'])
    feature_df['lag_3'] = feature_df['lag_3'].fillna(feature_df['lag_2'])
    feature_df['lag_12'] = feature_df['lag_12'].fillna(feature_df['lag_1'])
    feature_df['rolling_mean_3'] = feature_df['rolling_mean_3'].fillna(feature_df['lag_1'])
    feature_df['rolling_mean_6'] = feature_df['rolling_mean_6'].fillna(feature_df['rolling_mean_3'])
    feature_df['rolling_mean_12'] = feature_df['rolling_mean_12'].fillna(feature_df['rolling_mean_6'])
    feature_df['momentum_3'] = feature_df['momentum_3'].fillna(0)
    feature_df['ratio_to_12m'] = feature_df['ratio_to_12m'].fillna(1.0)
    
    return feature_df

if __name__ == '__main__':
    from data_loader import load_historical_data
    raw_df = load_historical_data()
    feat_df = create_time_series_features(raw_df)
    print("Features engineered. Shape:", feat_df.shape)
    print("Feature columns:", [c for c in feat_df.columns if 'lag' in c or 'rolling' in c or 'sin' in c])
