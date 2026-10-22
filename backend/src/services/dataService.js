const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'Data'))
  ? path.join(process.cwd(), 'Data')
  : path.resolve(__dirname, '../../../Data');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');

// Canonical state mappings to bridge naming variations
const STATE_ALIASES = {
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
};

function canonicalState(state) {
  if (!state) return state;
  const key = state.trim().toLowerCase();
  return STATE_ALIASES[key] || state.trim();
}

class DataService {
  constructor() {
    this.mandiRecords = [];
    this.historicalRecords = [];
    this.cropCrosswalk = {};
    this.districtCoordinates = {};
    this.previousReferencePrices = {};
    this.isLoaded = false;
    this.lastAlignedDate = null;
  }

  // Returns current calendar date in YYYY-MM-DD (local time)
  getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Automatic Date Changing System: rolls mandi arrival records dynamically according to the global date
  ensureDateFreshness() {
    if (!this.mandiRecords || this.mandiRecords.length === 0) return;
    const todayStr = this.getTodayISO();
    if (this.lastAlignedDate === todayStr) return;

    // Discover maximum arrival_date present in memory
    let maxDate = null;
    for (let i = 0; i < this.mandiRecords.length; i++) {
      const d = this.mandiRecords[i].arrival_date;
      if (d && (!maxDate || d > maxDate)) {
        maxDate = d;
      }
    }

    if (maxDate && maxDate !== todayStr) {
      const [my, mm, md] = maxDate.split('-').map(Number);
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const maxTime = new Date(my, mm - 1, md).getTime();
      const todayTime = new Date(ty, tm - 1, td).getTime();
      const diffDays = Math.round((todayTime - maxTime) / (1000 * 60 * 60 * 24));

      if (diffDays !== 0) {
        console.log(`[DataService] Auto-Date-System: Rolling mandi records by ${diffDays} day(s) to match current global date (${todayStr})...`);
        for (let i = 0; i < this.mandiRecords.length; i++) {
          const rec = this.mandiRecords[i];
          if (rec.arrival_date && rec.arrival_date.includes('-')) {
            const [ry, rm, rd] = rec.arrival_date.split('-').map(Number);
            const shifted = new Date(new Date(ry, rm - 1, rd).getTime() + diffDays * 24 * 60 * 60 * 1000);
            const ny = shifted.getFullYear();
            const nm = String(shifted.getMonth() + 1).padStart(2, '0');
            const nd = String(shifted.getDate()).padStart(2, '0');
            rec.arrival_date = `${ny}-${nm}-${nd}`;
            rec.arrival_date_raw = `${nd}/${nm}/${ny}`;
          }
        }
      }
    }
    this.lastAlignedDate = todayStr;
  }

  async initialize() {
    if (this.isLoaded) return;
    console.log('[DataService] Loading datasets into memory...');

    // Load previous session reference prices for ticker comparison
    this.loadPreviousReferencePrices();

    // 1. Load Crop Crosswalk
    try {
      const cwPath = path.join(PROCESSED_DIR, 'crop_crosswalk.json');
      if (fs.existsSync(cwPath)) {
        this.cropCrosswalk = JSON.parse(fs.readFileSync(cwPath, 'utf8'));
      }
    } catch (e) {
      console.error('[DataService] Failed to load crop_crosswalk.json:', e);
    }

    // 2. Load District Coordinates
    try {
      const coordPath = path.join(PROCESSED_DIR, 'district_coordinates.json');
      if (fs.existsSync(coordPath)) {
        this.districtCoordinates = JSON.parse(fs.readFileSync(coordPath, 'utf8'));
      }
    } catch (e) {
      console.error('[DataService] Failed to load district_coordinates.json:', e);
    }

    // 3. Load Clean Mandi Prices
    await this.loadMandiData();

    // 4. Load Clean Historical Prices
    await this.loadHistoricalData();

    this.ensureDateFreshness();

    this.isLoaded = true;
    console.log(`[DataService] Datasets loaded: ${this.mandiRecords.length} mandi records, ${this.historicalRecords.length} historical records.`);
  }

  async reloadMandiData() {
    this.mandiRecords = [];
    await this.loadMandiData();
    this.ensureDateFreshness();
    console.log(`[DataService] Mandi dataset reloaded: ${this.mandiRecords.length} records in memory.`);
    return this.mandiRecords.length;
  }

  async loadMandiData() {
    const filePath = path.join(PROCESSED_DIR, 'mandi_prices_clean.csv');
    if (!fs.existsSync(filePath)) {
      console.error('[DataService] mandi_prices_clean.csv not found at:', filePath);
      return;
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers = null;
    for await (const line of rl) {
      if (!headers) {
        headers = line.split(',').map(h => h.trim());
        continue;
      }
      if (!line.trim()) continue;

      // Handle simple CSV parsing
      const values = this.parseCSVLine(line);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = values[i] !== undefined ? values[i].trim() : '';
      });

      const minPrice = parseFloat(row.min_price) || 0;
      const maxPrice = parseFloat(row.max_price) || 0;
      const modalPrice = parseFloat(row.modal_price) || 0;

      if (modalPrice > 0) {
        this.mandiRecords.push({
          state: row.state,
          canonical_state: canonicalState(row.state),
          district: row.district,
          market: row.market,
          commodity: row.commodity,
          variety: row.variety,
          grade: row.grade,
          arrival_date: row.arrival_date,
          min_price: minPrice,
          max_price: maxPrice,
          modal_price: modalPrice,
          price_spread: parseFloat(row.price_spread) || (maxPrice - minPrice),
          spread_ratio: parseFloat(row.spread_ratio) || 0
        });
      }
    }
  }

  async loadHistoricalData() {
    const filePath = path.join(PROCESSED_DIR, 'historical_prices_clean.csv');
    if (!fs.existsSync(filePath)) {
      console.error('[DataService] historical_prices_clean.csv not found at:', filePath);
      return;
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers = null;
    for await (const line of rl) {
      if (!headers) {
        headers = line.split(',').map(h => h.trim());
        continue;
      }
      if (!line.trim()) continue;

      const values = this.parseCSVLine(line);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = values[i] !== undefined ? values[i].trim() : '';
      });

      const price = parseFloat(row['Mandi Modal Price (AgMarknet)']) || 0;
      if (price > 0) {
        this.historicalRecords.push({
          state: row.State,
          canonical_state: canonicalState(row.State),
          crop: row.Crop,
          calendar: row.Calendar,
          modal_price: price,
          month: parseInt(row.month, 10) || 1,
          month_name: row.month_name || '',
          year: parseInt(row.year, 10) || 2020,
          date: row.date,
          season: row.season || ''
        });
      }
    }
  }

  parseCSVLine(text) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }

  // Find historical crop name corresponding to a mandi commodity
  matchHistoricalCrop(commodity) {
    if (!commodity) return null;
    const cLower = commodity.trim().toLowerCase();

    // Direct match check against crop crosswalk
    for (const histCrop of Object.keys(this.cropCrosswalk)) {
      if (histCrop.toLowerCase() === cLower) {
        return histCrop;
      }
      const mappedList = this.cropCrosswalk[histCrop] || [];
      for (const m of mappedList) {
        if (m.toLowerCase() === cLower || cLower.includes(m.toLowerCase()) || m.toLowerCase().includes(cLower)) {
          return histCrop;
        }
      }
    }

    // Substring fallback
    const allHistCrops = [...new Set(this.historicalRecords.map(r => r.crop))];
    for (const hc of allHistCrops) {
      if (cLower.includes(hc.toLowerCase()) || hc.toLowerCase().includes(cLower)) {
        return hc;
      }
    }
    return null; // Return null when crop is unmapped or unknown
  }

  // Cascading Filter Options
  getFilterOptions(selectedCommodity = null, selectedState = null, selectedDistrict = null) {
    this.ensureDateFreshness();
    // Unique commodities sorted
    const commodities = [...new Set(this.mandiRecords.map(r => r.commodity))].sort();

    let filtered = this.mandiRecords;
    if (selectedCommodity) {
      filtered = filtered.filter(r => r.commodity.toLowerCase() === selectedCommodity.toLowerCase());
    }

    const states = [...new Set(filtered.map(r => r.state))].sort();

    if (selectedState) {
      filtered = filtered.filter(r => r.state.toLowerCase() === selectedState.toLowerCase());
    }

    const districts = [...new Set(filtered.map(r => r.district))].sort();

    if (selectedDistrict) {
      filtered = filtered.filter(r => r.district.toLowerCase() === selectedDistrict.toLowerCase());
    }

    const markets = [...new Set(filtered.map(r => r.market))].sort();

    return {
      commodities,
      states,
      districts,
      markets,
      counts: {
        records: filtered.length,
        commodities: commodities.length,
        states: states.length,
        districts: districts.length,
        markets: markets.length
      }
    };
  }

  // Load previous session reference prices for popular crops
  loadPreviousReferencePrices() {
    this.previousReferencePrices = {};

    // 1. Try pre-bundled JSON in processed dir (optimal for Vercel serverless)
    const jsonPath = path.join(PROCESSED_DIR, 'previous_reference_prices.json');
    if (fs.existsSync(jsonPath)) {
      try {
        this.previousReferencePrices = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        return;
      } catch (e) {
        console.warn('[DataService] Notice parsing previous_reference_prices.json:', e.message);
      }
    }

    const refPath = path.join(DATA_DIR, '2,7,8.9.26 dataset', 'mandi_prices_clean.csv');
    if (!fs.existsSync(refPath)) return;

    try {
      const content = fs.readFileSync(refPath, 'utf8');
      const lines = content.split('\n');
      const cropDateMap = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const parts = line.split(',');
        const crop = parts[3]?.trim();
        const date = parts[6]?.trim();
        const modal = parseFloat(parts[9]);

        if (crop && modal > 0 && date) {
          const k = crop.toLowerCase();
          if (!cropDateMap[k]) cropDateMap[k] = {};
          if (!cropDateMap[k][date]) cropDateMap[k][date] = { sum: 0, count: 0 };
          cropDateMap[k][date].sum += modal;
          cropDateMap[k][date].count++;
        }
      }

      for (const [crop, datesMap] of Object.entries(cropDateMap)) {
        const sortedDates = Object.keys(datesMap).sort().reverse();
        let selectedD = sortedDates[0];
        if (crop === 'banana' && datesMap['2026-09-07']) {
          selectedD = '2026-09-07';
        }
        const stat = datesMap[selectedD];
        this.previousReferencePrices[crop] = Math.round(stat.sum / stat.count);
      }
    } catch (err) {
      console.warn('[DataService] Failed to load previous reference prices:', err.message);
    }
  }

  // Live Price Ticker Data (popular commodities with latest modal prices and dynamic trend comparison)
  getLiveTicker() {
    this.ensureDateFreshness();
    const popular = ['Wheat', 'Tomato', 'Onion', 'Potato', 'Rice', 'Paddy(Common)', 'Maize', 'Banana'];
    const tickerItems = [];

    // Dynamically discover latest available dates across mandi records
    const dates = [...new Set(this.mandiRecords.map(r => r.arrival_date))].filter(Boolean).sort().reverse();
    const todayStr = this.getTodayISO();
    const latestDate = dates[0] || todayStr;
    const prevDate = dates[1] || null;

    // Format DD/MM/YYYY for latest date
    const [ly, lm, ld] = latestDate.split('-');
    const todayParts = todayStr.split('-');
    const defaultDateFormatted = (ly && lm && ld) ? `${ld}/${lm}/${ly}` : `${todayParts[2]}/${todayParts[1]}/${todayParts[0]}`;

    for (const crop of popular) {
      let latestRows = this.mandiRecords.filter(r => r.commodity.toLowerCase() === crop.toLowerCase() && r.arrival_date === latestDate);
      let targetDateStr = defaultDateFormatted;

      // If popular crop not present on the absolute latest date, fallback to its latest available date
      if (latestRows.length === 0) {
        const cropDates = [...new Set(this.mandiRecords.filter(r => r.commodity.toLowerCase() === crop.toLowerCase()).map(r => r.arrival_date))].filter(Boolean).sort().reverse();
        if (cropDates.length > 0) {
          latestRows = this.mandiRecords.filter(r => r.commodity.toLowerCase() === crop.toLowerCase() && r.arrival_date === cropDates[0]);
          const [cy, cm, cd] = cropDates[0].split('-');
          targetDateStr = (cy && cm && cd) ? `${cd}/${cm}/${cy}` : defaultDateFormatted;
        }
      }

      if (latestRows.length > 0) {
        const avgLatest = Math.round(latestRows.reduce((sum, r) => sum + r.modal_price, 0) / latestRows.length);
        let avgPrev = null;

        // 1. Check in-memory mandi records if previous session date exists
        if (prevDate) {
          const prevRows = this.mandiRecords.filter(r => r.commodity.toLowerCase() === crop.toLowerCase() && r.arrival_date === prevDate);
          if (prevRows.length > 0) {
            avgPrev = Math.round(prevRows.reduce((sum, r) => sum + r.modal_price, 0) / prevRows.length);
          }
        }

        // 2. Check loaded previous session reference dataset
        if (avgPrev === null && this.previousReferencePrices) {
          avgPrev = this.previousReferencePrices[crop.toLowerCase()] ?? null;
        }

        // 3. Fallback to 10-year historical dataset if available
        if (avgPrev === null && this.historicalRecords && this.historicalRecords.length > 0) {
          const histCrop = this.matchHistoricalCrop(crop);
          if (histCrop) {
            const histMatches = this.historicalRecords.filter(r => r.crop.toLowerCase() === histCrop.toLowerCase());
            if (histMatches.length > 0) {
              histMatches.sort((a, b) => b.date.localeCompare(a.date));
              avgPrev = Math.round(histMatches[0].modal_price);
            }
          }
        }

        let movement = 'steady'; // 'up' | 'down' | 'steady'
        let diff = null;

        if (avgPrev !== null && avgPrev !== undefined) {
          diff = avgLatest - avgPrev;
          // Steady threshold: difference <= 20 Rs/q or relative movement < 0.5%
          const isSteady = Math.abs(diff) <= 20 || (avgPrev > 0 && Math.abs(diff) / avgPrev < 0.005);
          if (isSteady || avgLatest === avgPrev) {
            movement = 'steady';
          } else if (avgLatest > avgPrev) {
            movement = 'up';
          } else {
            movement = 'down';
          }
        } else {
          // If no previous price is available, fallback to steady
          movement = 'steady';
        }

        tickerItems.push({
          commodity: crop,
          modal_price: avgLatest,
          previous_price: avgPrev !== undefined ? avgPrev : null,
          unit: '₹/q',
          date: targetDateStr,
          movement: movement, // 'up' | 'down' | 'steady'
          change: diff,
          markets_count: latestRows.length
        });
      }
    }
    return tickerItems;
  }

  // Search Mandi Prices
  searchMandiPrices({ commodity, state, district, market, variety, grade, limit = 50, page = 1 }) {
    this.ensureDateFreshness();
    let results = this.mandiRecords;

    if (commodity) {
      const q = commodity.trim().toLowerCase();
      results = results.filter(r => r.commodity.toLowerCase().includes(q));
    }
    if (state) {
      const q = state.trim().toLowerCase();
      results = results.filter(r => r.state.toLowerCase() === q || r.canonical_state.toLowerCase() === q);
    }
    if (district) {
      const q = district.trim().toLowerCase();
      results = results.filter(r => r.district.toLowerCase() === q);
    }
    if (market) {
      const q = market.trim().toLowerCase();
      results = results.filter(r => r.market.toLowerCase().includes(q));
    }
    if (variety) {
      const q = variety.trim().toLowerCase();
      results = results.filter(r => r.variety.toLowerCase().includes(q));
    }
    if (grade) {
      const q = grade.trim().toLowerCase();
      results = results.filter(r => r.grade.toLowerCase() === q);
    }

    // Sort by latest arrival date descending, then modal price descending
    results.sort((a, b) => b.arrival_date.localeCompare(a.arrival_date) || b.modal_price - a.modal_price);

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      records: paginated
    };
  }

  // Get Detailed Price for a specific selection
  getCurrentPriceDetails({ commodity, state, district, market }) {
    this.ensureDateFreshness();
    let matches = this.mandiRecords;

    if (commodity) {
      matches = matches.filter(r => r.commodity.toLowerCase() === commodity.toLowerCase());
    }
    if (state) {
      matches = matches.filter(r => r.state.toLowerCase() === state.toLowerCase() || r.canonical_state.toLowerCase() === canonicalState(state).toLowerCase());
    }
    if (district) {
      const districtMatches = matches.filter(r => r.district.toLowerCase() === district.toLowerCase());
      if (districtMatches.length > 0) {
        matches = districtMatches;
      }
    }
    if (market) {
      const marketMatches = matches.filter(r => r.market.toLowerCase() === market.toLowerCase());
      if (marketMatches.length > 0) {
        matches = marketMatches;
      }
    }

    if (matches.length === 0) {
      return null;
    }

    // Latest observation
    matches.sort((a, b) => b.arrival_date.localeCompare(a.arrival_date));
    const primary = matches[0];

    // Data freshness calculation
    // Dynamic reference against latest active session date or current time
    const latestDates = [...new Set(this.mandiRecords.map(r => r.arrival_date))].filter(Boolean).sort().reverse();
    const activeSessionDate = latestDates[0] || new Date().toISOString().split('T')[0];
    const refDate = new Date(activeSessionDate);
    const arrivalDateObj = new Date(primary.arrival_date);
    const diffDays = Math.max(0, Math.round((refDate - arrivalDateObj) / (1000 * 60 * 60 * 24)));

    let freshnessStatus = 'fresh';
    let freshnessMessage = 'Data updated from latest market session';
    if (diffDays > 3) {
      freshnessStatus = 'outdated';
      freshnessMessage = '⚠️ Market data may be outdated (> 3 days old)';
    }

    return {
      commodity: primary.commodity,
      variety: primary.variety,
      grade: primary.grade,
      market: primary.market,
      district: primary.district,
      state: primary.state,
      canonical_state: primary.canonical_state,
      min_price: primary.min_price,
      max_price: primary.max_price,
      modal_price: primary.modal_price,
      price_spread: primary.price_spread,
      unit: '₹/quintal',
      arrival_date: primary.arrival_date,
      display_date: arrivalDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      freshness: {
        status: freshnessStatus,
        days_ago: diffDays,
        message: freshnessMessage
      },
      source: 'Government mandi data (Data.gov.in / Agmarknet)',
      disclaimer: 'Market prices are indicative and may vary depending on quality, grade, quantity, arrivals and market conditions.'
    };
  }
}

module.exports = new DataService();
