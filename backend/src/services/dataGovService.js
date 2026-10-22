const https = require('https');
const dataService = require('./dataService');

class DataGovService {
  constructor() {
    this.resourceId = process.env.DATA_GOV_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';
    this.apiKey = process.env.DATA_GOV_API_KEY || '';
    this.lastSyncTime = null;
    this.lastSyncCount = 0;
    this.lastError = null;
    this.isSyncing = false;
  }

  // Parse DD/MM/YYYY to YYYY-MM-DD
  parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      return dateStr; // Already YYYY-MM-DD
    }
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  // Fetch records from Data.gov.in API
  fetchRecords({ limit = 100, offset = 0 } = {}) {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.DATA_GOV_API_KEY || this.apiKey;
      if (!apiKey || apiKey === 'YOUR_DATA_GOV_API_KEY') {
        return reject(new Error('Valid DATA_GOV_API_KEY is not configured in backend/.env'));
      }

      const resourceId = process.env.DATA_GOV_RESOURCE_ID || this.resourceId;
      const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&offset=${offset}`;

      const options = {
        headers: {
          'User-Agent': 'KissanSaathi/1.0 (contact@kissansaathi.in)',
          'Accept': 'application/json'
        },
        timeout: 12000
      };

      const req = https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          let errData = '';
          res.on('data', chunk => errData += chunk);
          res.on('end', () => {
            reject(new Error(`Data.gov.in API returned HTTP ${res.statusCode}: ${errData.slice(0, 150)}`));
          });
          return;
        }

        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse Data.gov.in JSON response: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Data.gov.in request timed out after 12 seconds'));
      });
    });
  }

  // Synchronize latest mandi data and integrate into active in-memory records
  async syncLatestMandiData({ limit = 500 } = {}) {
    if (this.isSyncing) {
      return {
        status: 'in_progress',
        message: 'A data synchronization is already in progress.',
        lastSyncTime: this.lastSyncTime
      };
    }

    this.isSyncing = true;
    this.lastError = null;

    try {
      console.log(`[DataGovService] Fetching up to ${limit} latest mandi arrival records from Data.gov.in...`);
      const apiResponse = await this.fetchRecords({ limit });

      const records = apiResponse.records || [];
      if (!Array.isArray(records) || records.length === 0) {
        this.isSyncing = false;
        return {
          success: true,
          recordsAdded: 0,
          totalRecords: dataService.mandiRecords.length,
          message: 'Data.gov.in returned 0 records for the requested parameters.'
        };
      }

      // Build existing deduplication index
      const existingKeys = new Set();
      for (const r of dataService.mandiRecords) {
        existingKeys.add(`${r.state}__${r.market}__${r.commodity}__${r.variety}__${r.arrival_date}`.toLowerCase());
      }

      let addedCount = 0;
      const newMandiItems = [];

      for (const item of records) {
        const minPrice = parseFloat(item.min_price) || 0;
        const maxPrice = parseFloat(item.max_price) || 0;
        const modalPrice = parseFloat(item.modal_price) || 0;

        if (modalPrice <= 0 || !item.commodity || !item.state) continue;

        const arrivalDate = this.parseDate(item.arrival_date);
        const dedupKey = `${item.state}__${item.market}__${item.commodity}__${item.variety}__${arrivalDate}`.toLowerCase();

        if (!existingKeys.has(dedupKey)) {
          existingKeys.add(dedupKey);

          const priceSpread = maxPrice - minPrice;
          const spreadRatio = modalPrice > 0 ? priceSpread / modalPrice : 0;

          newMandiItems.push({
            state: item.state.trim(),
            canonical_state: item.state.trim(),
            district: (item.district || '').trim(),
            market: (item.market || '').trim(),
            commodity: item.commodity.trim(),
            variety: (item.variety || 'Other').trim(),
            grade: (item.grade || 'FAQ').trim(),
            arrival_date: arrivalDate,
            min_price: minPrice,
            max_price: maxPrice,
            modal_price: modalPrice,
            price_spread: priceSpread,
            spread_ratio: Math.round(spreadRatio * 1000) / 1000,
            source: 'Live Data.gov.in Agmarknet API'
          });
          addedCount++;
        }
      }

      // Prepend fresh records to in-memory store so latest arrivals appear immediately
      if (newMandiItems.length > 0) {
        dataService.mandiRecords.unshift(...newMandiItems);
      }

      this.lastSyncTime = new Date().toISOString();
      this.lastSyncCount = addedCount;
      this.isSyncing = false;

      console.log(`[DataGovService] Live sync completed: ${addedCount} new records added. Total in-memory records: ${dataService.mandiRecords.length}`);

      return {
        success: true,
        recordsFetched: records.length,
        recordsAdded: addedCount,
        totalAvailableInGov: apiResponse.total || null,
        totalMandiRecords: dataService.mandiRecords.length,
        syncTime: this.lastSyncTime,
        message: `Successfully synchronized ${addedCount} fresh market arrivals from Data.gov.in.`
      };
    } catch (err) {
      this.isSyncing = false;
      this.lastError = err.message;
      console.error('[DataGovService] Sync failed:', err);
      throw err;
    }
  }

  // Get current sync status
  getStatus() {
    return {
      configured: Boolean(this.apiKey && this.apiKey !== 'YOUR_DATA_GOV_API_KEY'),
      resourceId: this.resourceId,
      lastSyncTime: this.lastSyncTime,
      lastSyncCount: this.lastSyncCount,
      lastError: this.lastError,
      isSyncing: this.isSyncing,
      totalMandiRecords: dataService.mandiRecords.length
    };
  }
}

module.exports = new DataGovService();
