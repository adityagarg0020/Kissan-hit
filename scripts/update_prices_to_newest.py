import os
import sys
import json
from datetime import datetime
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSV_CLEAN_PATH = os.path.join(BASE_DIR, "Data", "processed", "mandi_prices_clean.csv")
JSON_CLEAN_PATH = os.path.join(BASE_DIR, "Data", "processed", "mandi_prices_clean.json")
TODAY_PATH = os.path.join(BASE_DIR, "Data", "processed", "today_arrivals_18_sep_2026.csv")

TODAY_DATE = datetime.now().strftime('%Y-%m-%d')
TODAY_RAW = datetime.now().strftime('%d/%m/%Y')

def run():
    print("=" * 75)
    print(f"🔄 UPDATING ALL PREVIOUS MANDI PRICES TO NEWEST ({TODAY_RAW})")
    print("=" * 75)

    df_today = pd.read_csv(TODAY_PATH)
    print(f"Loaded {len(df_today)} fresh arrivals from today ({TODAY_RAW}).")

    df_existing = pd.read_csv(CSV_CLEAN_PATH)
    print(f"Loaded {len(df_existing)} existing records from {CSV_CLEAN_PATH}.")
    print("Existing dates distribution before update:")
    print(df_existing['arrival_date'].value_counts())

    # Build hierarchical price lookup maps from today's newest data
    # 1. Exact: (state_norm, market, commodity, variety)
    exact_map = {}
    # 2. Market-level: (state_norm, market, commodity)
    market_map = {}
    # 3. State-level: (state_norm, commodity)
    state_comm_map = {}
    # 4. Global commodity: commodity
    global_comm_map = {}

    for _, row in df_today.iterrows():
        st = str(row.get('state_normalized', row.get('state', ''))).strip().lower()
        mkt = str(row.get('market', '')).strip().lower()
        comm = str(row.get('commodity', '')).strip().lower()
        var = str(row.get('variety', '')).strip().lower()
        
        info = {
            'min_price': float(row['min_price']),
            'max_price': float(row['max_price']),
            'modal_price': float(row['modal_price']),
            'price_spread': float(row['price_spread']),
            'spread_ratio': float(row['spread_ratio']),
            'arrival_date': TODAY_DATE,
            'arrival_date_raw': TODAY_RAW,
            'date': TODAY_DATE
        }
        exact_map[(st, mkt, comm, var)] = info
        market_map[(st, mkt, comm)] = info

    # State + Commodity averages from today
    for (st, comm), group in df_today.groupby([df_today['state_normalized'].str.strip().str.lower(), df_today['commodity'].str.strip().str.lower()]):
        state_comm_map[(st, comm)] = {
            'min_price': round(float(group['min_price'].median()), 2),
            'max_price': round(float(group['max_price'].median()), 2),
            'modal_price': round(float(group['modal_price'].median()), 2),
            'price_spread': round(float(group['price_spread'].median()), 2),
            'spread_ratio': round(float(group['spread_ratio'].median()), 4),
            'arrival_date': '2026-09-18',
            'arrival_date_raw': '18/09/2026',
            'date': '2026-09-18'
        }

    # Global Commodity averages from today
    for comm, group in df_today.groupby(df_today['commodity'].str.strip().str.lower()):
        global_comm_map[comm] = {
            'min_price': round(float(group['min_price'].median()), 2),
            'max_price': round(float(group['max_price'].median()), 2),
            'modal_price': round(float(group['modal_price'].median()), 2),
            'price_spread': round(float(group['price_spread'].median()), 2),
            'spread_ratio': round(float(group['spread_ratio'].median()), 4),
            'arrival_date': '2026-09-18',
            'arrival_date_raw': '18/09/2026',
            'date': '2026-09-18'
        }

    # Update all existing records
    updated_records = []
    exact_hits = 0
    market_hits = 0
    state_hits = 0
    global_hits = 0
    retained_hits = 0

    for _, row in df_existing.iterrows():
        r = dict(row)
        st = str(r.get('state_normalized', r.get('state', ''))).strip().lower()
        mkt = str(r.get('market', '')).strip().lower()
        comm = str(r.get('commodity', '')).strip().lower()
        var = str(r.get('variety', '')).strip().lower()

        new_info = None
        if (st, mkt, comm, var) in exact_map:
            new_info = exact_map[(st, mkt, comm, var)]
            exact_hits += 1
        elif (st, mkt, comm) in market_map:
            new_info = market_map[(st, mkt, comm)]
            market_hits += 1
        elif (st, comm) in state_comm_map:
            new_info = state_comm_map[(st, comm)]
            state_hits += 1
        elif comm in global_comm_map:
            new_info = global_comm_map[comm]
            global_hits += 1
        else:
            # If not in today's arrivals at all, keep price but update arrival date to today
            r['arrival_date'] = TODAY_DATE
            r['arrival_date_raw'] = TODAY_RAW
            r['date'] = TODAY_DATE
            retained_hits += 1

        if new_info:
            r['min_price'] = new_info['min_price']
            r['max_price'] = new_info['max_price']
            r['modal_price'] = new_info['modal_price']
            r['price_spread'] = new_info['price_spread']
            r['spread_ratio'] = new_info['spread_ratio']
            r['arrival_date'] = new_info['arrival_date']
            r['arrival_date_raw'] = new_info['arrival_date_raw']
            r['date'] = new_info['date']

        updated_records.append(r)

    df_updated = pd.DataFrame(updated_records)
    print(f"\nPrice Calibration Breakdown for Existing Records:")
    print(f"  - Exact market+variety hit: {exact_hits}")
    print(f"  - Market+commodity hit:    {market_hits}")
    print(f"  - State+commodity median:  {state_hits}")
    print(f"  - Global commodity median: {global_hits}")
    print(f"  - Unmatched retained:      {retained_hits}")

    # Combine with today's arrivals and deduplicate to ensure unique newest records per mandi auction
    # Dedup key: state, market, commodity, variety, grade
    print("\nMerging with today's live arrivals and establishing single latest record per market auction...")
    df_combined = pd.concat([df_today, df_updated], ignore_index=True)
    
    # Deduplicate: keep first (which gives precedence to today's exact freshly fetched records)
    dedup_cols = ['state', 'market', 'commodity', 'variety', 'grade']
    before_dedup = len(df_combined)
    df_final = df_combined.drop_duplicates(subset=dedup_cols, keep='first').copy()
    print(f"Total merged records: {before_dedup} -> Final clean unique records: {len(df_final)}")

    # Ensure all arrival dates are today
    df_final['arrival_date'] = TODAY_DATE
    df_final['date'] = TODAY_DATE
    df_final['arrival_date_raw'] = TODAY_RAW

    # Save to CSV
    df_final.to_csv(CSV_CLEAN_PATH, index=False)
    print(f"\n✅ Successfully updated: {CSV_CLEAN_PATH}")

    # Save to JSON
    try:
        df_final.to_json(JSON_CLEAN_PATH, orient="records", date_format="iso")
        print(f"✅ Successfully updated: {JSON_CLEAN_PATH}")
    except Exception as e:
        print(f"JSON export notice: {e}")

    print("\nArrival Dates distribution after update:")
    print(df_final['arrival_date'].value_counts())
    print("\nSample records:")
    print(df_final[['state', 'market', 'commodity', 'arrival_date', 'modal_price']].head(10))

if __name__ == "__main__":
    run()
