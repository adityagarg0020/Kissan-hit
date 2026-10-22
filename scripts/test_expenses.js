import http from 'http';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('======================================================================');
  console.log('KISSANSAATHI FARM EXPENSE TRACKER TEST SUITE');
  console.log('======================================================================');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, msg = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}: ${msg}`);
      failed++;
    }
  }

  try {
    // Test 1: GET /api/expenses/farms
    const listRes = await request('GET', '/api/expenses/farms');
    assert('GET /api/expenses/farms returns 200 and seasons array',
      listRes.status === 200 && Array.isArray(listRes.body.data) && listRes.body.data.length > 0
    );

    // Test 2: GET /api/expenses/summary
    const summaryRes = await request('GET', '/api/expenses/summary');
    assert('GET /api/expenses/summary returns active summary',
      summaryRes.status === 200 && summaryRes.body.success && typeof summaryRes.body.total_cost === 'number'
    );

    // Test 3: POST /api/expenses/farms (Create test season)
    const testSeasonPayload = {
      farm_name: 'Automated Test Farm',
      crop: 'Mustard',
      variety: 'Pusa Bold',
      season: 'Rabi',
      year: 2026,
      land_area: 4,
      land_unit: 'Acre',
      sowing_date: '2026-10-15',
      harvest_date: '2027-02-28',
      estimated_production: 32,
      production_unit: 'Quintal',
      expected_selling_price: 5400
    };
    const createRes = await request('POST', '/api/expenses/farms', testSeasonPayload);
    assert('POST /api/expenses/farms creates farm season',
      createRes.status === 201 && createRes.body.data && createRes.body.data.crop === 'Mustard'
    );
    const newFarmId = createRes.body.data ? createRes.body.data.id : null;

    if (newFarmId) {
      // Test 4: Add expense entries
      const entryRes1 = await request('POST', `/api/expenses/farms/${newFarmId}/entries`, {
        category: 'Seeds',
        item_name: 'Certified Mustard Seeds Pusa Bold',
        amount: 3200,
        date: '2026-10-16',
        payment_mode: 'Cash',
        notes: '2 bags of 5kg'
      });
      assert('POST entry (Seeds) adds item and updates totals',
        entryRes1.status === 201 && entryRes1.body.farm.calculations.total_cost === 3200
      );

      const entryRes2 = await request('POST', `/api/expenses/farms/${newFarmId}/entries`, {
        category: 'Fertilizer',
        item_name: 'DAP & Urea',
        amount: 4800,
        date: '2026-10-20',
        payment_mode: 'UPI'
      });
      assert('POST entry (Fertilizer) accumulates total cost correctly',
        entryRes2.status === 201 && entryRes2.body.farm.calculations.total_cost === 8000
      );

      const entryIdToUpdate = entryRes2.body.entry ? entryRes2.body.entry.id : null;

      // Test 5: Verify calculations: 8000 total cost / 4 acres = 2000/acre; 8000 / 32q = 250/q break-even
      const calcs = entryRes2.body.farm.calculations;
      assert('Accurate cost per acre (8000 / 4 = 2000)', calcs.cost_per_acre === 2000);
      assert('Accurate break-even price (8000 / 32q = 250/q)', calcs.break_even_price === 250);

      // Test 6: Update entry
      if (entryIdToUpdate) {
        const updateRes = await request('PUT', `/api/expenses/farms/${newFarmId}/entries/${entryIdToUpdate}`, {
          amount: 6800,
          notes: 'Added extra bag'
        });
        assert('PUT entry updates amount and recalculates totals (3200 + 6800 = 10000)',
          updateRes.status === 200 && updateRes.body.farm.calculations.total_cost === 10000
        );
      }

      // Test 7: AI Advisor endpoint
      const aiRes = await request('POST', '/api/expenses/ai-advice', { farm_id: newFarmId });
      assert('POST /api/expenses/ai-advice generates advisory recommendations',
        aiRes.status === 200 && aiRes.body.success && typeof aiRes.body.advice === 'string' && aiRes.body.advice.length > 0
      );

      // Test 8: Clean up created test season
      const delRes = await request('DELETE', `/api/expenses/farms/${newFarmId}`);
      assert('DELETE /api/expenses/farms/:id cleans up test season',
        delRes.status === 200 && delRes.body.success
      );
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('======================================================================');
  console.log(`FARM EXPENSES TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
