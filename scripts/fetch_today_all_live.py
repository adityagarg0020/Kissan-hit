import os
import sys
import json
import time
import urllib.parse
import subprocess
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(BASE_DIR, "backend", ".env")

API_KEY = os.environ.get("DATA_GOV_API_KEY", "")
RESOURCE_ID = os.environ.get("DATA_GOV_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070")

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
TODAY_ISO = datetime.now().strftime("%Y-%m-%d")
TODAY_RAW = datetime.now().strftime("%d/%m/%Y")

def parse_date_to_iso(date_str):
    if not date_str:
        return TODAY_ISO
    s = str(date_str).strip()
    if "-" in s and len(s.split("-")[0]) == 4:
        return s
    parts = s.split("/")
    if len(parts) == 3:
        d, m, y = parts[0].zfill(2), parts[1].zfill(2), parts[2]
        return f"{y}-{m}-{d}"
    return s

def fetch_state_batch(state_name=None, arrival_date=None, offset=0, limit=1000):
    if arrival_date is None:
        arrival_date = TODAY_RAW
    params = {
        'api-key': API_KEY,
        'format': 'json',
        'limit': limit,
        'offset': offset,
        'filters[arrival_date]': arrival_date
    }
    if state_name:
        params['filters[state]'] = state_name

    url = f"https://api.data.gov.in/resource/{RESOURCE_ID}?" + urllib.parse.urlencode(params)
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

def fetch_all_today_records():
    print("=" * 75)
    print(f"🌾 FETCHING ALL LATEST MANDI ARRIVAL PRICES OF TODAY ({TODAY_RAW})")
    print(f"Resource ID: {RESOURCE_ID}")
    print("=" * 75)

    # 1. Discover all active states reporting today
    states = [
        'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chattisgarh', 'Goa',
        'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Karnataka',
        'Keralam', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
        'NCT of Delhi', 'Nagaland', 'Odisha', 'Pondicherry', 'Punjab',
        'Rajasthan', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
        'Uttarakhand', 'West Bengal'
    ]

    all_today_records = []
    seen_dedup = set()

    for idx, state in enumerate(states, 1):
        print(f"[{idx}/{len(states)}] Querying state: {state}...")
        offset = 0
        batch_size = 1000
        state_records_count = 0

        while True:
            try:
                records, total = fetch_state_batch(state_name=state, arrival_date=TODAY_RAW, offset=offset, limit=batch_size)
            except Exception as e:
                print(f"   ⚠️ Error fetching {state} at offset {offset}: {e}")
                break

            if not records:
                break

            for r in records:
                modal_p = float(r.get("modal_price", 0) or 0)
                min_p = float(r.get("min_price", 0) or 0)
                max_p = float(r.get("max_price", 0) or 0)

                if modal_p <= 0:
                    continue

                r_state = str(r.get("state", state)).strip()
                district = str(r.get("district", "")).strip()
                market = str(r.get("market", "")).strip()
                commodity = str(r.get("commodity", "")).strip()
                variety = str(r.get("variety", "Other") or "Other").strip()
                grade = str(r.get("grade", "FAQ") or "FAQ").strip()
                raw_date = str(r.get("arrival_date", TODAY_RAW)).strip()
                iso_date = parse_date_to_iso(raw_date)

                if not commodity:
                    continue

                dedup_key = f"{r_state.lower()}__{market.lower()}__{commodity.lower()}__{variety.lower()}__{grade.lower()}"
                if dedup_key in seen_dedup:
                    continue
                seen_dedup.add(dedup_key)

                spread = max_p - min_p
                spread_ratio = round(spread / modal_p, 4) if modal_p > 0 else 0.0
                norm_state = normalize_state(r_state)

                all_today_records.append({
                    "state": r_state,
                    "district": district,
                    "market": market,
                    "commodity": commodity,
                    "variety": variety,
                    "grade": grade,
                    "arrival_date": iso_date,
                    "min_price": min_p,
                    "max_price": max_p,
                    "modal_price": modal_p,
                    "arrival_date_raw": raw_date,
                    "date": iso_date,
                    "price_spread": spread,
                    "spread_ratio": spread_ratio,
                    "state_normalized": norm_state
                })
                state_records_count += 1

            offset += batch_size
            if offset >= total or len(records) < batch_size:
                break
            time.sleep(0.2)

        print(f"   -> Added {state_records_count} unique records for {state}.")

    print("\n" + "=" * 75)
    print(f"✅ Total unique live arrivals fetched for today: {len(all_today_records)}")
    print("=" * 75)
    return pd.DataFrame(all_today_records)

if __name__ == "__main__":
    df_today = fetch_all_today_records()
    out_path = os.path.join(BASE_DIR, "Data", "processed", "today_arrivals_18_sep_2026.csv")
    df_today.to_csv(out_path, index=False)
    print(f"Saved today's live arrivals to {out_path}")
