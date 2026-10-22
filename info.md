# 🌾 KissanSaathi (किसान साथी) — Project Information & System Documentation

> **Core Purpose:** Agricultural Market Intelligence, Real-Time APMC Mandi Price Discovery, Nearest-Market Haversine Distance Engine, 10-Year Historical Analytics, Machine Learning Price Forecasting, Weather Advisories, and Farm Expense & Break-Even Economics for Indian Farmers.

---

## 1. 📌 Project Overview & Value Proposition

KissanSaathi is an end-to-end agricultural market intelligence and decision support platform engineered to address information asymmetry for Indian farmers. By connecting directly with official government data sources (AgMarknet via Data.gov.in) and localized weather streams (OpenWeather), the platform empowers farmers to:
- Discover real-time, transparent APMC auction prices across mandis in India.
- Calculate straight-line transport distances and evaluate nearby markets using composite optimization scoring.
- Analyze 10 years of historical price trends (2016–2026) to identify peak selling months and seasonal patterns.
- Leverage scientifically validated machine learning models for forward-looking price forecasting and decision support.
- Track seasonal farm expenses to compute personal break-even selling prices and profit/loss margins.
- Access weather advisories and ask questions through an AI-grounded multi-lingual assistant.

---

## 2. 🏗️ Technology Stack Architecture

### Frontend Layer
- **Core Framework:** React 19 (`react` ^19.2.8, `react-dom` ^19.2.8)
- **Application Routing:** React Router v7 (`react-router-dom` ^7.18.3)
- **Build Tool & Bundler:** Vite 8 (`vite` ^8.2.2)
- **Icons:** Lucide React (`lucide-react` ^1.43.0)
- **Styling:** Custom Pure Vanilla CSS Design System (`index.css`) utilizing CSS Custom Properties (tokens), glassmorphism, responsive CSS Grid / Flexbox layouts, and micro-animations without external CSS utility frameworks.
- **Charts & Visualizations:** Handcrafted, zero-dependency, responsive SVG charts (`PriceChart.jsx`, `HistoricalChart.jsx`, `ComparisonChart.jsx`, `ExpenseDonutChart.jsx`).
- **Internationalization (i18n):** Multi-lingual translation engine supporting **English (`en`)**, **Hindi (`hi`)**, and **Marathi (`mr`)** with modular JSON translation dictionaries for all pages.
- **State Management:** React Context API (`AuthContext.jsx`, `MarketContext.jsx`, `I18nProvider`).
- **Authentication Client:** Supabase JS Client (`@supabase/supabase-js` ^2.116.0) with local token persistence.

### Backend Layer
- **Runtime:** Node.js (v18+)
- **Server Framework:** Express.js (`express` ^4.19.2)
- **Middleware:** `cors`, `dotenv`, JSON body parser, HTTP request latency logger, and token-based auth middleware (`authMiddleware.js`).
- **Data Ingestion & In-Memory Cache:** Fast streaming CSV parser (`csv-parser`) and JSON loader maintaining **51,000+ mandi records** and **38,550+ 10-year records** in memory for sub-millisecond query latency (`dataService.js`).
- **Serverless Compatibility:** Vercel serverless entry point (`api/index.js`, `vercel.json`).
- **Authentication Service:** Supabase Admin (`@supabase/supabase-js`) for cloud PostgreSQL-backed farmer identity management.

### Machine Learning & Data Pipeline Layer
- **Language:** Python 3.9+
- **Core Libraries:** `scikit-learn`, `pandas`, `numpy`, `joblib`
- **Model Artifacts:** Serialized joblib packages (`ml/models/price_forecast_model.joblib`, `ml/models/mandi_price_model.joblib`) including feature columns, training bounds, and performance metrics.
- **Automation:** Autonomous background scheduler (`autoTrainService.js`) orchestrating periodic data synchronization from Data.gov.in and model retraining without server downtime.

---

## 3. 🚀 Comprehensive Feature Breakdown (All 14 Modules)

| # | Feature / Page | Route | Description & Key Capabilities |
|---|---|---|---|
| 1 | **Landing Page** | `/` | Public landing page with hero showcase, transparency badge, live price ticker, platform features, testimonials, FAQ, and language selector. |
| 2 | **Farmer Dashboard** | `/dashboard` | Executive operational hub featuring live AgMarknet freshness indicators (e.g. 09 Sep 2026), 8 popular crop cards (Wheat, Tomato, Onion, Potato, Mustard, Paddy, Cotton, Soybean) with intraday rate shifts, quick action cards, farm expense profit status, and active alerts. |
| 3 | **Live Mandi Prices** | `/market` | Real-time APMC auction rates with continuous Right → Left live price marquee ticker, cascading 6-tier filters (Commodity → State → District → Mandi → Variety → Grade), Hero Price Card (Modal, Min, Max, and Spread), and paginated auction records table. |
| 4 | **Nearby Mandis** | `/nearby-mandis` | GPS ("Use My Location" HTML5 Geolocation API with reverse geocoding) or manual district selector. Computes straight-line Haversine distances to mandis, categorizes Transportation Burden (Low/Medium/High), and highlights the top-recommended market using a **60/30/10 scoring formula**. |
| 5 | **Price Comparison** | `/comparison` | Interactive multi-mandi selector (compare 2 to 8 mandis simultaneously), calculating highest/lowest price, price spread (₹/quintal and %), extra potential income per truckload (50 quintals), and side-by-side SVG comparison bar charts. |
| 6 | **10-Year Historical Analysis** | `/historical` | 10-year AgMarknet state-level records (2016–2026, 38,550+ observations). Features interactive SVG trend line with hover data points, 12-month seasonality price heatmap, "Best Historical Month to Sell", Kharif/Rabi/Zaid season averages, volatility ratings (CV%), Gaussian Z-score anomaly detection, and state-wise price rankings. |
| 7 | **AI Price Prediction** | `/prediction` | Autoregressive multi-month price forecast (e.g. Oct, Nov, Dec 2026) powered by Machine Learning. Interactive SVG trajectory chart with widening statistical uncertainty confidence ribbons ($RMSE$), trend classification (*Increasing*, *Decreasing*, *Stable*), and transparent model evaluation metrics ($R^2$, MAE, RMSE). |
| 8 | **Sell Decision Support** | `/sell-decision` | Triangulates live mandi rates against 10-year historical medians, ML forecast directions, and the farmer's personal break-even cost to provide clear advice (*"Potentially favorable to sell now"* vs *"Potentially favorable to wait"*), accompanied by transparent rationales. |
| 9 | **Farm Expense & Break-Even Tracker** | `/expenses` | Complete farm economic ledger: records crops, seasons, multi-unit land size (Acre, Hectare, Bigha), and 11 expense categories (Seeds, Fertilizer, Labour, Machinery, etc.). Computes Total Cost, Cost per Acre/Quintal, Break-Even Selling Price, Expected/Actual Revenue, ROI %, and automated profit/loss comparison against live mandi prices. |
| 10 | **Weather Intelligence & Agro-Advisories** | `/weather` | Real-time local meteorological data via OpenWeather API (temperature, feels-like, humidity, wind speed, rain probability). Features rule-based agricultural alerts (Rain/Spray warning, Heat stress, Lodging wind risk) and an AI weather explainer providing crop management advice in 4 languages. |
| 11 | **AI Kisan Assistant Chatbot** | `/ai-assistant` | Conversational assistant powered by OpenAI (`gpt-4o-mini`) equipped with function-calling tools to query live mandi rates, find nearby markets, inspect historical benchmarks, and fetch forecast data. Features zero-hallucination prompts and fallback logic. |
| 12 | **Price Alerts Engine** | `/alerts` | Customizable notifications for price ceiling breaches, floor price drops, percentage volatility shifts, and AI forecast trajectory updates. |
| 13 | **Farmer Profile** | `/profile` | Farmer account management (name, phone, state, district, preferred language, primary cultivated crops) synchronized with Supabase. |
| 14 | **Authentication & Security** | `/login`, `/reset-password` | Protected route shell requiring authenticated sessions, instant account registration, and password recovery. |

---

## 4. 🤖 Machine Learning Algorithms & Training Pipelines

The system employs two distinct, specialized Machine Learning pipelines to ensure scientific rigor and eliminate temporal data leakage.

### 1. Monthly Time-Series Forecasting Model (`ml/src/train.py`)
- **Primary Algorithm:** **`HistGradientBoostingRegressor`** (Scikit-Learn's optimized histogram-based gradient boosted decision tree ensemble, inspired by LightGBM).
- **Hyperparameters:** `max_iter=150`, `max_depth=6`, `min_samples_leaf=20`, `random_state=42`.
- **Target Variable:** `Mandi Modal Price (AgMarknet)` (₹/quintal).
- **Feature Engineering (`ml/src/feature_engineering.py`):**
  - **Autoregressive Lags:** $lag_1$, $lag_2$, $lag_3$, and seasonal annual lag $lag_{12}$ (same month of previous year).
  - **Rolling Window Metrics:** 3-month, 6-month, and 12-month rolling means, plus 3-month rolling standard deviation (computed strictly on $lag_1$ to avoid lookahead target leakage).
  - **Price Momentum:** $lag_1 - lag_3$.
  - **Ratio-to-Baseline:** $\frac{lag_1}{rolling\_mean_{12}}$.
  - **Cyclical Calendar Features:** $\sin\left(\frac{2\pi \cdot month}{12}\right)$ and $\cos\left(\frac{2\pi \cdot month}{12}\right)$, quarter, and agricultural season (Kharif, Rabi, Zaid).
  - **Crop Categorical Indicators:** One-hot encoded crop dummy variables.
- **Outlier Bounds Handling (`ml/src/preprocessing.py`):**
  - Interquartile Range (IQR) clipping bounds are computed **strictly from the training partition** ($Train \le 2023$) to avoid leakage into validation and holdout test sets.
- **Strict Chronological Evaluation Split:**
  - **Training Set (2016-10 to 2023-12):** 28,237 samples
  - **Validation Set (2024-01 to 2024-12):** 3,624 samples
  - **Holdout Test Set (2025-01 to 2026-09 unseen):** 6,157 samples
- **Model Comparison Benchmarks (`ml/models/evaluation_metrics.json`):**

| Model | Val MAE (₹) | Test MAE (₹) | Test RMSE (₹) | Test MAPE (%) | Test $R^2$ Score | Status |
|---|---|---|---|---|---|---|
| **HistGradientBoosting** | 403.25 | **407.68** | **734.82** | **14.20%** | **0.9294** | 🏆 **Champion Model** |
| **Random Forest Regressor** | 391.16 | 409.64 | 738.60 | 14.46% | 0.9287 | Benchmark |
| **Ridge Regression** | 407.76 | 413.05 | 739.93 | 14.49% | 0.9285 | Benchmark |
| **Naive Lag-1** | 397.35 | 400.54 | 793.74 | 13.63% | 0.9177 | Baseline |
| **Rolling Mean (3-Month)** | 461.91 | 470.26 | 814.22 | 17.30% | 0.9134 | Baseline |

### 2. Daily Mandi Price Discovery Model (`ml/src/train_mandi_model.py`)
- **Primary Algorithm:** **`Ridge Regression`** with `StandardScaler` on numerical features and `OneHotEncoder(handle_unknown='ignore')` on categorical features.
- **Dataset:** 51,247 records from Data.gov.in daily arrivals.
- **Features Used:** `min_price`, `max_price`, `price_spread`, `spread_ratio`, `commodity`, `state_normalized`, `grade`.
- **Holdout Evaluation on Live Data (09/09/2026):**
  - **$R^2$ Score:** **0.9345**
  - **Test MAE:** **₹183.10 / quintal**
  - **Test RMSE:** **₹1,684.22 / quintal**

### 3. Autoregressive Prediction & Statistical Uncertainty (`ml/src/predict.py`)
- For forward horizons (Month 1, Month 2, Month 3), the model rolls forward autoregressively, feeding predicted prices back into lag variables.
- Dynamic prediction intervals expand across successive steps to model real-world market uncertainty:
  $$\text{Interval} = \hat{y} \pm RMSE \times \left(1.0 + 0.15 \times step\right)$$

---

## 5. 📐 Mathematical Formulas & Decision Algorithms

### A. Haversine Straight-Line Distance Formula (`distanceService.js`)
Calculates great-circle distance between farmer coordinates $(\phi_1, \lambda_1)$ and mandi centroid $(\phi_2, \lambda_2)$ on Earth ($R = 6,371\text{ km}$):
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$

**Transportation Burden Index:**
- **Low:** $d \le 10\text{ km}$ (Green)
- **Moderate:** $10\text{ km} < d \le 30\text{ km}$ (Orange)
- **High:** $d > 30\text{ km}$ (Red)

### B. Mandi Recommendation Composite Scoring (60 / 30 / 10 Formula) (`recommendationService.js`)
Balances maximum selling price against transport distance and data freshness:
$$\text{Price Score } (S_p) = \frac{\text{Price} - \text{Price}_{\min}}{\text{Price}_{\max} - \text{Price}_{\min}}$$
$$\text{Distance Score } (S_d) = 1 - \frac{\text{Distance} - \text{Distance}_{\min}}{\text{Distance}_{\max} - \text{Distance}_{\min}}$$
$$\text{Freshness Score } (S_f) = \max\left(0, 1 - \frac{\text{Age in Days}}{7}\right)$$
$$\text{Total Score} = \left(0.60 \times S_p + 0.30 \times S_d + 0.10 \times S_f\right) \times 100$$

### C. Price Volatility & Anomaly Detection (`historicalService.js`)
- **Coefficient of Variation ($CV$):**
  $$CV = \left(\frac{\sigma}{\mu}\right) \times 100\%$$
  - **Stable:** $CV < 15\%$
  - **Moderate Volatility:** $15\% \le CV \le 30\%$
  - **High Volatility:** $CV > 30\%$
- **Gaussian Z-Score Anomaly Detection:**
  $$Z = \frac{\text{Current Price} - \mu}{\sigma}$$
  - $Z > +2.0$: **Unusually High** (favorable selling window)
  - $Z < -2.0$: **Unusually Low** (potential distress pricing)
  - $-2.0 \le Z \le +2.0$: **Normal Historical Range**

### D. Farm Break-Even Economics (`expenseService.js`)
- **Standardized Area:** Converts Bigha ($0.625\text{ acre}$) and Hectares ($2.471\text{ acres}$) to normalized acres.
- **Break-Even Price:**
  $$\text{Break-Even Price (₹/q)} = \frac{\text{Total Production Cost (₹)}}{\text{Active Production (Quintals)}}$$
- **Market Arbitrage Difference:**
  $$\Delta = \text{Current Mandi Modal Price} - \text{Break-Even Price}$$

---

## 6. 🌐 APIs & Integrations Overview

### External Third-Party APIs
1. **Data.gov.in Agmarknet API:**
   - **Resource ID:** `9ef84268-d588-465a-a308-a864a43d0070`
   - **Endpoint:** `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
   - **Purpose:** Ingests official daily mandi arrival rates (Modal, Min, Max price, commodity, market, district, state, arrival date).
2. **OpenWeatherMap API:**
   - **Current Weather:** `https://api.openweathermap.org/data/2.5/weather`
   - **5-Day / 3-Hour Forecast:** `https://api.openweathermap.org/data/2.5/forecast`
   - **Purpose:** Supplies live meteorological conditions, rain probability, wind speed, and temperature for local farm advisories.
3. **OpenStreetMap Nominatim API:**
   - **Endpoint:** `https://nominatim.openstreetmap.org/reverse`
   - **Purpose:** Reverse geocoding GPS coordinates $(\text{lat}, \text{lng})$ into district and state names.
4. **OpenAI API (`gpt-4o-mini`):**
   - **Purpose:** Powers conversational AI Kisan Assistant with function-calling tools and generates localized weather advisories in English, Hindi, and Marathi.
5. **Supabase Cloud API:**
   - **Purpose:** Cloud PostgreSQL database, user registration, JWT authentication tokens, and profile synchronization.

---

### Internal Backend REST API Endpoints

#### 1. System & Health
- `GET /api/health` — Returns system health, loaded record counts, latest arrival date, and session freshness.

#### 2. Mandi Market Intelligence (`marketRoutes.js`)
- `GET /api/market/ticker` — Returns streaming live price ticker items.
- `GET /api/market/filters` — Cascading dropdown options (Commodity, State, District, Mandi, Variety, Grade).
- `GET /api/market/search` — Paginated and filtered mandi auction records.
- `GET /api/market/current-price` — Latest price details for a specific crop/location.
- `GET /api/market/nearby` — Nearby mandis calculated via Haversine distance.
- `GET /api/market/compare` — Comparative price spread analysis between candidate markets.
- `GET /api/market/best-nearby` — Returns top recommended mandi using the 60/30/10 scoring formula.
- `GET /api/market/reverse-geocode` — Converts GPS coordinates to district/state names.

#### 3. Historical Analytics & Anomaly Detection
- `GET /api/market/history` — 10-year monthly historical price series.
- `GET /api/market/historical-analysis` — Full historical intelligence report (10-year trend, best month, Kharif/Rabi/Zaid seasonality, CV% volatility, Z-score anomaly, state rankings).

#### 4. AI Price Forecasting & Decision Support
- `POST /api/market/predict-price` / `GET /api/market/prediction` — ML forecast trajectory, confidence intervals, trend direction, and sell decision recommendations.

#### 5. Autonomous Training & Data Sync
- `GET /api/market/auto-train/status` — Returns scheduler status, last sync timestamp, and model evaluation metrics.
- `POST /api/market/auto-train/trigger` — Manually triggers the autonomous data fetch and model training pipeline.
- `POST /api/market/sync` — Synchronizes latest records from Data.gov.in.
- `POST /api/market/reload` — Reloads datasets into backend memory without restarting the server.

#### 6. Farm Expenses & Break-Even Management (`expenseRoutes.js`)
- `GET /api/expenses/farms` — Lists farmer's crop seasons.
- `GET /api/expenses/summary` — Aggregate financial summary for dashboard display.
- `GET /api/expenses/farms/:id` — Details, cost breakdown, and break-even metrics for a single farm.
- `POST /api/expenses/farms` — Creates a new farm season with itemized costs.
- `PUT /api/expenses/farms/:id` — Updates farm details, production yield, or selling price.
- `DELETE /api/expenses/farms/:id` — Deletes a farm record.

#### 7. Weather Intelligence (`weatherRoutes.js`)
- `GET /api/weather` — Returns current weather, 5-day forecast, and deterministic rule-based agricultural alerts.
- `POST /api/weather/ai-explain` — Generates multi-lingual farming advice based on real weather readings.

#### 8. Conversational AI Assistant
- `POST /api/chat` (or `POST /api/market/chat`) — Grounded assistant endpoint with function calling.

#### 9. Alerts Management
- `GET /api/market/alerts` — Retrieves active price alerts.
- `POST /api/market/alerts` — Creates a new price or forecast alert.
- `DELETE /api/market/alerts/:id` — Deletes an alert.

#### 10. Authentication (`authRoutes.js`)
- `POST /api/auth/register` — Creates and auto-verifies farmer accounts.

---

## 7. 📁 Datasets & Crosswalk Mapping

1. **Daily Mandi Arrivals (`Data/processed/mandi_prices_clean.csv` / `.json`):**  
   51,247 records containing `state`, `district`, `market`, `commodity`, `variety`, `grade`, `arrival_date`, `min_price`, `max_price`, and `modal_price`.
2. **10-Year Historical State Prices (`Data/processed/historical_prices_clean.csv` / `.json`):**  
   38,550 monthly observations spanning October 2016 through September 2026 across 28 crops and all Indian states.
3. **District Coordinates (`Data/processed/district_coordinates.json`):**  
   700+ verified centroid latitude/longitude coordinates of Indian districts for instant GPS fallback.
4. **Commodity Crosswalk Mapping (`Data/processed/crop_crosswalk.json`):**  
   Bridges common names to official AgMarknet naming conventions (e.g. `Wheat` $\leftrightarrow$ `Wheat`, `Gram` $\leftrightarrow$ `Bengal Gram(Gram)(Whole)`, `Paddy` $\leftrightarrow$ `Paddy(Common)`).

---

## 8. 💻 Quick Start & Running Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### Installation & Launch
```bash
# 1. Install frontend dependencies
cd frontend
npm install
cd ..

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Launch both Frontend and Backend concurrently from project root
npm run dev
```

- **Frontend Application:** `http://localhost:3000` (or `http://localhost:5173`)
- **Backend API:** `http://localhost:5000` (or `http://localhost:5050`)
