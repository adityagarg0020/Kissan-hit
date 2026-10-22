const http = require('http');

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5050${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runLocationTests() {
  console.log('='.repeat(70));
  console.log('TEST SUITE: USE MY LOCATION / GPS REVERSE GEOCODING & STATE CONSISTENCY');
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

  // TEST 1: Reverse Geocoding at user coordinates (28.7002, 77.4407 - Ghaziabad, UP)
  await test('Test 1: Reverse geocode (28.7002, 77.4407) does NOT return Agra', async () => {
    const res = await request('/api/market/reverse-geocode?lat=28.7002&lng=77.4407');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.resolved) throw new Error('Expected coordinates to be resolved');
    if (res.body.district === 'Agra') throw new Error('STALE BUG REPRODUCED: Returned Agra instead of resolved district');
    if (res.body.district !== 'Ghaziabad') throw new Error(`Expected Ghaziabad, got ${res.body.district}`);
    if (res.body.state !== 'Uttar Pradesh') throw new Error(`Expected Uttar Pradesh, got ${res.body.state}`);
    if (res.body.display_name !== 'Ghaziabad, Uttar Pradesh') throw new Error(`Unexpected display name: ${res.body.display_name}`);
  });

  // TEST 2: Reverse Geocoding at Mumbai (19.0760, 72.8777)
  await test('Test 2: Reverse geocode in Maharashtra (19.0760, 72.8777) resolves State & District to Maharashtra', async () => {
    const res = await request('/api/market/reverse-geocode?lat=19.0760&lng=72.8777');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.state !== 'Maharashtra') throw new Error(`Expected Maharashtra, got ${res.body.state}`);
    if (res.body.district !== 'Mumbai') throw new Error(`Expected Mumbai, got ${res.body.district}`);
  });

  // TEST 3: Nearby Mandis Calculation changes between Agra and Ghaziabad
  await test('Test 3: Nearby Mandis calculation differs between Agra and Ghaziabad GPS coordinates', async () => {
    // 1. Mandis from Agra manual coordinates (27.1767, 78.0081)
    const resAgra = await request('/api/market/compare?commodity=Wheat&lat=27.1767&lng=78.0081&district=Agra');
    // 2. Mandis from Ghaziabad GPS coordinates (28.7002, 77.4407)
    const resGhaziabad = await request('/api/market/compare?commodity=Wheat&lat=28.7002&lng=77.4407&district=Ghaziabad');

    if (resAgra.status !== 200 || resGhaziabad.status !== 200) throw new Error('API request failed');

    const topAgra = resAgra.body.best_mandi;
    const topGhaziabad = resGhaziabad.body.best_mandi;

    // Distances should be calculated from respective origins
    const distToTopFromAgra = topAgra.distance_km;
    const distToTopFromGhaziabad = topGhaziabad.distance_km;

    console.log(`       Agra top pick: ${topAgra.market} (${distToTopFromAgra} km from Agra)`);
    console.log(`       Ghaziabad top pick: ${topGhaziabad.market} (${distToTopFromGhaziabad} km from Ghaziabad)`);

    // Verify distance from Ghaziabad to Agra is non-zero and substantial (~180km)
    const distBetween = Math.abs(distToTopFromAgra - distToTopFromGhaziabad);
    if (topAgra.market === topGhaziabad.market && distToTopFromAgra === distToTopFromGhaziabad) {
      throw new Error('Distances did not change between coordinates!');
    }
  });

  // TEST 4: Invalid/Ocean coordinates (0, 0) does NOT invent a location
  await test('Test 4: Coordinates outside India (0, 0) does NOT invent a location or return Agra', async () => {
    const res = await request('/api/market/reverse-geocode?lat=0&lng=0');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.resolved !== false) throw new Error('Expected resolved to be false for ocean coordinates');
    if (res.body.district !== null) throw new Error(`Fabricated district found: ${res.body.district}`);
    if (res.body.state !== null) throw new Error(`Fabricated state found: ${res.body.state}`);
    if (!res.body.display_name.includes('unavailable') && !res.body.display_name.includes('Outside India')) {
      throw new Error(`Expected unavailable notice, got: ${res.body.display_name}`);
    }
  });

  // TEST 5: Missing lat/lng returns 400 Bad Request
  await test('Test 5: Missing lat or lng returns HTTP 400', async () => {
    const res = await request('/api/market/reverse-geocode?lat=28.7002');
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  console.log('='.repeat(70));
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

runLocationTests();
