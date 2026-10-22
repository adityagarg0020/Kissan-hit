const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('KISSANSAATHI SYSTEMATIC API TEST SUITE (PHASE 18)');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}:`, e.message);
      failed++;
    }
  }

  // 1. Ticker
  await test('GET /api/market/ticker (Status 200 & verified prices)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/ticker', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.success || !Array.isArray(res.body.ticker)) throw new Error('Invalid ticker format');
    if (res.body.ticker.length === 0) throw new Error('Ticker returned empty array');
    const first = res.body.ticker[0];
    if (typeof first.modal_price !== 'number' || first.modal_price <= 0) throw new Error('Invalid modal price');
  });

  // 2. Search Mandis
  await test('GET /api/market/search with valid crop (Status 200)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/search?commodity=Wheat&limit=5', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.records.length === 0) throw new Error('Expected records for Wheat');
  });

  await test('GET /api/market/search with nonexistent crop (Status 200, 0 records)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/search?commodity=NonExistent999', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.records.length !== 0 || res.body.total !== 0) throw new Error('Expected 0 records for nonexistent crop');
  });

  // 3. Current Price
  await test('GET /api/market/current-price (Valid: 200)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/current-price?commodity=Wheat&state=Uttar+Pradesh', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.data || res.body.data.modal_price <= 0) throw new Error('Missing price data');
  });

  await test('GET /api/market/current-price missing commodity (Status 400)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/current-price?state=Uttar+Pradesh', method: 'GET' });
    if (res.status !== 400) throw new Error(`Expected 400 for missing commodity, got ${res.status}`);
  });

  await test('GET /api/market/current-price nonexistent crop (Status 404)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/current-price?commodity=NonExistentCrop888', method: 'GET' });
    if (res.status !== 404) throw new Error(`Expected 404 for unknown crop, got ${res.status}`);
  });

  // 4. Nearby Mandis
  await test('GET /api/market/nearby with coordinates (Status 200)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/nearby?commodity=Wheat&lat=28.6139&lng=77.2090&limit=5', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.mandis || res.body.mandis.length === 0) throw new Error('Expected nearby mandis');
    const m = res.body.mandis[0];
    if (typeof m.distance_km !== 'number' || m.distance_km < 0) throw new Error('Invalid distance_km');
  });

  // 5. Compare
  await test('GET /api/market/compare (Status 200)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/compare?commodity=Wheat&lat=28.6139&lng=77.2090', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.best_mandi) throw new Error('Missing best_mandi in comparison');
  });

  // 6. History
  await test('GET /api/market/history (Valid: 200)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/history?commodity=Wheat&state=Uttar+Pradesh', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.series || res.body.series.length < 12) throw new Error('Expected at least 12 months history');
  });

  await test('GET /api/market/history missing commodity (Status 400)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/history', method: 'GET' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test('GET /api/market/history nonexistent crop (Status 404)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/history?commodity=NonExistentCrop444', method: 'GET' });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 7. Historical Analysis
  await test('GET /api/market/historical-analysis (Valid: 200 & rankings array)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/historical-analysis?commodity=Wheat&state=Uttar+Pradesh', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.state_ranking || !Array.isArray(res.body.state_ranking.rankings)) throw new Error('Expected rankings array');
    if (res.body.state_ranking.rankings.length === 0) throw new Error('Rankings array empty');
    const first = res.body.state_ranking.rankings[0];
    if (first.rank !== 1 || !first.observations) throw new Error('Rank or observations missing');
  });

  // 8. Prediction
  await test('POST /api/market/predict-price (Valid: 200 & Phase 15 daily disclaimer)', async () => {
    const payload = JSON.stringify({ commodity: 'Wheat', state: 'Uttar Pradesh', current_price: 2450 });
    const res = await request({
      host: 'localhost',
      port: 5050,
      path: '/api/market/predict-price',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, payload);

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.daily_forecast !== null) throw new Error('daily_forecast must be null per Phase 15');
    if (!res.body.daily_forecast_message.includes('Not enough historical data')) throw new Error('Missing Phase 15 daily forecast notice');
    if (!res.body.monthly_forecast || res.body.monthly_forecast.length === 0) throw new Error('Expected monthly_forecast');
  });

  await test('POST /api/market/predict-price missing commodity (Status 400)', async () => {
    const payload = JSON.stringify({ state: 'Uttar Pradesh' });
    const res = await request({
      host: 'localhost',
      port: 5050,
      path: '/api/market/predict-price',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, payload);

    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test('POST /api/market/predict-price nonexistent crop (Status 404)', async () => {
    const payload = JSON.stringify({ commodity: 'DragonFruitUnknown', state: 'Uttar Pradesh' });
    const res = await request({
      host: 'localhost',
      port: 5050,
      path: '/api/market/predict-price',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, payload);

    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 9. Alerts
  await test('GET /api/market/alerts (Status 200)', async () => {
    const res = await request({ host: 'localhost', port: 5050, path: '/api/market/alerts', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.alerts)) throw new Error('Expected alerts array');
  });

  console.log('='.repeat(70));
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

// Give server 1 second to settle before running
setTimeout(runTests, 1000);
