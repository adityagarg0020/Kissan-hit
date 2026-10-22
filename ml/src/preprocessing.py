import numpy as np
import pandas as pd

STATE_NAME_MAPPING = {
    'Andaman and Nicobar': 'Andaman And Nicobar Islands',
    'Chattisgarh': 'Chhattisgarh',
    'Jammu and Kashmir': 'Jammu And Kashmir',
    'Keralam': 'Kerala',
    'NCT of Delhi': 'Delhi',
    'Pondicherry': 'Puducherry'
}

def normalize_state_name(state_name):
    """
    Normalizes state name variations between Mandi and Historical datasets.
    """
    if not isinstance(state_name, str):
        return state_name
    s = state_name.strip()
    return STATE_NAME_MAPPING.get(s, s)

def compute_outlier_bounds(df_train, price_col='Mandi Modal Price (AgMarknet)', group_cols=['Crop']):
    """
    Computes IQR clipping bounds strictly on training data to prevent data leakage.
    """
    bounds = {}
    for crop, group in df_train.groupby('Crop'):
        q1 = group[price_col].quantile(0.25)
        q3 = group[price_col].quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            upper = q3 * 3.0
            lower = max(1.0, q1 * 0.2)
        else:
            upper = q3 + 3.5 * iqr
            lower = max(1.0, q1 - 2.5 * iqr)
        bounds[crop] = (lower, upper)
    return bounds

def apply_outlier_bounds(df, bounds, price_col='Mandi Modal Price (AgMarknet)'):
    """
    Applies training-derived bounds to clip price outliers across any split.
    """
    df_clipped = df.copy()
    for crop, (lower, upper) in bounds.items():
        mask = df_clipped['Crop'] == crop
        if mask.any():
            df_clipped.loc[mask, price_col] = df_clipped.loc[mask, price_col].clip(lower=lower, upper=upper)
    return df_clipped


def add_calendar_features(df):
    """
    Extracts month, year, quarter, and cyclical sine/cosine calendar encodings.
    """
    df = df.copy()
    if 'date' not in df.columns:
        df['date'] = pd.to_datetime(df['Calendar'], format='%b %Y', errors='coerce')
    
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['quarter'] = df['date'].dt.quarter
    
    # Cyclical month representation
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12.0)
    
    # Agricultural season classification
    # Kharif (Monsoon): Jun-Oct, Rabi (Winter): Nov-Mar, Zaid (Summer): Apr-May
    def classify_season(m):
        if m in [6, 7, 8, 9, 10]:
            return 'Kharif'
        elif m in [11, 12, 1, 2, 3]:
            return 'Rabi'
        else:
            return 'Zaid'
            
    df['season'] = df['month'].apply(classify_season)
    return df
