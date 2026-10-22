import os
import sys
import json
import time
import subprocess
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
API_KEY = os.environ.get("DATA_GOV_API_KEY", "")
RESOURCE_ID = os.environ.get("DATA_GOV_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070")
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSV_PATH = os.path.join(BASE_DIR, "Data", "processed", "mandi_prices_clean.csv")
ENV_PATH = os.path.join(BASE_DIR, "backend", ".env")

if not API_KEY and os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("DATA_GOV_API_KEY="):
                API_KEY = line.strip().split("=", 1)[1].strip()
            elif line.startswith("DATA_GOV_RESOURCE_ID="):
                RESOURCE_ID = line.strip().split("=", 1)[1].strip()

STATE_MAPPING = {
    'andaman and nicobar': 'Andaman And Nicobar Islands',
    'andaman and nicobar islands': 'Andaman And Nicobar Islands',
    'chattisgarh': 'Chhattisgarh',
    'chhattisgarh': 'Chhattisgarh',
    'jammu and kashmir': 'Jammu And Kashmir',
    'keralam': 'Kerala',
    'kerala': 'Kerala',
    'nct of delhi': 'Delhi',
    'delhi': 'Delhi',
    'pondicherry': 'Puducherry',
    'puducherry': 'Puducherry'
}

def normalize_state(state):
    if not state:
        return ""
    s_clean = str(state).strip()
    return STATE_MAPPING.get(s_clean.lower(), s_clean)

from datetime import datetime

def parse_date_to_iso(date_str):
    if not date_str:
        return datetime.now().strftime("%Y-%m-%d")
    s = str(date_str).strip()
    if "-" in s and len(s.split("-")[0]) == 4:
        return s
    parts = s.split("/")
    if len(parts) == 3:
        d, m, y = parts[0].zfill(2), parts[1].zfill(2), parts[2]
        return f"{y}-{m}-{d}"
    return s

def fetch_batch(offset=0, limit=1000):
    url = f"https://api.data.gov.in/resource/{RESOURCE_ID}?api-key={API_KEY}&format=json&limit={limit}&offset={offset}"
    cmd = [
        "curl.exe", "-s", "--max-time", "30",
        "-H", "User-Agent: KissanSaathi/1.0 (contact@kissansaathi.in)",
        url
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if result.returncode != 0 or not result.stdout:
        raise RuntimeError(f"curl failed or empty response: {result.stderr}")
    
    data = json.loads(result.stdout)
    return data.get("records", []), data.get("total", 0)

def main(target_records=5000):
    print("=" * 70)
    print("[Ingestion] KISSANSAATHI DATA.GOV.IN LIVE INGESTION PIPELINE")
    print(f"Resource ID: {RESOURCE_ID}")
    print(f"Target Records to Fetch: {target_records}")
    print("=" * 70)

    # 1. Load existing deduplication keys
    existing_keys = set()
    if os.path.exists(CSV_PATH):
        df_existing = pd.read_csv(CSV_PATH)
        print(f"Existing records in CSV: {len(df_existing)}")
        for _, row in df_existing.iterrows():
            key = f"{str(row.get('state','')).strip().lower()}__{str(row.get('market','')).strip().lower()}__{str(row.get('commodity','')).strip().lower()}__{str(row.get('variety','')).strip().lower()}__{str(row.get('arrival_date','')).strip()}"
            existing_keys.add(key)
    else:
        df_existing = pd.DataFrame()
        print("Creating new CSV file.")

    # 2. Fetch pages
    all_new_records = []
    offset = 0
    batch_size = 1000

    while offset < target_records:
        print(f"Fetching batch offset={offset}, limit={batch_size}...")
        try:
            records, total = fetch_batch(offset, batch_size)
        except Exception as e:
            print(f"Fetch error at offset {offset}: {e}")
            break

        if not records:
            print("No more records returned from API.")
            break

        print(f"  -> Received {len(records)} records (Total reported by API: {total})")
        
        for r in records:
            min_p = float(r.get("min_price", 0) or 0)
            max_p = float(r.get("max_price", 0) or 0)
            modal_p = float(r.get("modal_price", 0) or 0)
            
            if modal_p <= 0:
                continue
            
            state = str(r.get("state", "")).strip()
            district = str(r.get("district", "")).strip()
            market = str(r.get("market", "")).strip()
            commodity = str(r.get("commodity", "")).strip()
            variety = str(r.get("variety", "Other") or "Other").strip()
            grade = str(r.get("grade", "FAQ") or "FAQ").strip()
            raw_date = str(r.get("arrival_date", "")).strip()
            iso_date = parse_date_to_iso(raw_date)

            if not commodity or not state:
                continue

            dedup_key = f"{state.lower()}__{market.lower()}__{commodity.lower()}__{variety.lower()}__{iso_date}"
            if dedup_key in existing_keys:
                continue

            existing_keys.add(dedup_key)
            spread = max_p - min_p
            spread_ratio = round(spread / modal_p, 4) if modal_p > 0 else 0.0
            norm_state = normalize_state(state)

            all_new_records.append({
                "state": state,
                "district": district,
                "market": market,
                "commodity": commodity,
                "variety": variety,
                "grade": grade,
                "arrival_date": iso_date,
                "min_price": min_p,
                "max_price": max_p,
                "modal_price": modal_p,
                "arrival_date_raw": raw_date if raw_date else "09/09/2026",
                "date": iso_date,
                "price_spread": spread,
                "spread_ratio": spread_ratio,
                "state_normalized": norm_state
            })

        offset += batch_size
        time.sleep(0.5)

    print(f"\nFresh unique arrival records collected: {len(all_new_records)}")

    if all_new_records:
        df_new = pd.DataFrame(all_new_records)
        df_combined = pd.concat([df_existing, df_new], ignore_index=True) if not df_existing.empty else df_new
        df_combined.to_csv(CSV_PATH, index=False)
        print(f"Successfully saved to: {CSV_PATH}")
        print(f"Total records in dataset now: {len(df_combined)}")

        # Also save JSON format for fast access if needed
        json_path = os.path.join(BASE_DIR, "Data", "processed", "mandi_prices_clean.json")
        try:
            df_combined.to_json(json_path, orient="records", date_format="iso")
            print(f"Updated {json_path}")
        except Exception as e:
            print(f"Notice: JSON export error: {e}")

        # Summary of arrivals by date
        print("\nArrival Dates Summary in Updated Dataset:")
        print(df_combined["arrival_date"].value_counts().head(10))

        # Top commodities in fresh batch
        print("\nTop Commodities in Fresh Batch:")
        print(df_new["commodity"].value_counts().head(10))
    else:
        print("No new records were added (all fetched records were already present).")

    return len(all_new_records)

if __name__ == "__main__":
    count = 5000
    if len(sys.argv) > 1:
        count = int(sys.argv[1])
    main(count)
