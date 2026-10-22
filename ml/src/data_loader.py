import os
import json
import pandas as pd

DEFAULT_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Data"))

def load_historical_data(data_path=None):
    """
    Loads the 10-year cleaned historical state-level dataset.
    Columns: State, Crop, Calendar, Mandi Modal Price (AgMarknet), month, year, date, season
    """
    if data_path is None:
        data_path = os.path.join(DEFAULT_DATA_DIR, "processed", "historical_prices_clean.csv")
        if not os.path.exists(data_path):
            data_path = os.path.join(DEFAULT_DATA_DIR, "raw", "historical_prices_raw.csv")

    df = pd.read_csv(data_path)
    
    # Normalize column names
    price_col = 'Mandi Modal Price (AgMarknet)'
    if price_col not in df.columns:
        matching = [c for c in df.columns if 'price' in c.lower()]
        if matching:
            df.rename(columns={matching[0]: price_col}, inplace=True)
            
    # Ensure date column
    if 'date' not in df.columns or df['date'].isna().any():
        df['date'] = pd.to_datetime(df['Calendar'], format='%b %Y', errors='coerce')
    else:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')

    # Drop any remaining invalid rows (zero or negative prices)
    df = df[df[price_col] > 0].copy()
    df.sort_values(by=['State', 'Crop', 'date'], inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df

def load_mandi_data(data_path=None):
    """
    Loads the recent mandi-level dataset (Sep 2026).
    """
    if data_path is None:
        data_path = os.path.join(DEFAULT_DATA_DIR, "processed", "mandi_prices_clean.csv")
        if not os.path.exists(data_path):
            data_path = os.path.join(DEFAULT_DATA_DIR, "2,7,8.9.26 dataset", "mandi_prices_clean.csv")

    df = pd.read_csv(data_path)
    if 'arrival_date' in df.columns:
        df['date'] = pd.to_datetime(df['arrival_date'], errors='coerce')
    return df

def load_crosswalk(crosswalk_path=None):
    """
    Loads the crop crosswalk mapping 29 historical crops to mandi commodities.
    """
    if crosswalk_path is None:
        crosswalk_path = os.path.join(DEFAULT_DATA_DIR, "processed", "crop_crosswalk.json")
    if os.path.exists(crosswalk_path):
        with open(crosswalk_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def load_district_coordinates(coords_path=None):
    """
    Loads district centroid coordinates for distance calculation.
    """
    if coords_path is None:
        coords_path = os.path.join(DEFAULT_DATA_DIR, "processed", "district_coordinates.json")
    if os.path.exists(coords_path):
        with open(coords_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

if __name__ == "__main__":
    df_hist = load_historical_data()
    print(f"Loaded {len(df_hist)} historical records across {df_hist['Crop'].nunique()} crops and {df_hist['State'].nunique()} states.")
