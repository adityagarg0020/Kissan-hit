import http from 'http';
import {
  validateCoordinates,
  generateWeatherAlerts,
  generateAgriculturalAdvice,
  aggregateDailyForecast,
  ALERT_THRESHOLDS
} from '../backend/src/services/weatherService.js';

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
  console.log('KISSANSAATHI WEATHER SERVICE & ALERTS TEST SUITE');
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

  // 1. Unit Tests on Validation
  const validCoord = validateCoordinates(28.6139, 77.2090);
  assert('Valid coordinates accepted (28.6139, 77.2090)', validCoord.valid === true);

  const invalidLat = validateCoordinates(120, 77.2090);
  assert('Invalid latitude rejected (> 90)', invalidLat.valid === false);

  const invalidLon = validateCoordinates(28.6139, 200);
  assert('Invalid longitude rejected (> 180)', invalidLon.valid === false);

  // 2. Unit Tests on Deterministic Alert Generation
  // Case A: Thunderstorm Alert
  const thunderAlerts = generateWeatherAlerts({ weatherId: 211, condition: 'Thunderstorm', temperature: 28, rainProbability: 80, windSpeed: 25 }, []);
  assert('Thunderstorm alert triggers on ID 211', thunderAlerts.some(a => a.type === 'thunderstorm' && a.level === 'warning'));

  // Case B: Rain Alert
  const rainAlerts = generateWeatherAlerts({ weatherId: 500, condition: 'Rain', temperature: 26, rainProbability: 75, windSpeed: 15 }, []);
  assert('Rain alert triggers on rain probability >= 50%', rainAlerts.some(a => a.type === 'rain' && a.title.includes('Rain Likely')));

  // Case C: High Temperature Alert
  const heatAlerts = generateWeatherAlerts({ weatherId: 800, condition: 'Clear', temperature: 41, rainProbability: 10, windSpeed: 10 }, []);
  assert('Heat alert triggers on temperature >= 38°C', heatAlerts.some(a => a.type === 'heat' && a.title.includes('High Temperature')));

  // Case D: Strong Wind Alert
  const windAlerts = generateWeatherAlerts({ weatherId: 800, condition: 'Clear', temperature: 30, rainProbability: 10, windSpeed: 35 }, []);
  assert('Wind alert triggers on wind speed >= 30 km/h', windAlerts.some(a => a.type === 'wind' && a.title.includes('Strong Wind')));

  // Case E: Normal / No Alert
  const normalAlerts = generateWeatherAlerts({ weatherId: 801, condition: 'Clouds', temperature: 28, rainProbability: 20, windSpeed: 12 }, []);
  assert('Normal status returns "No major weather alerts"', normalAlerts.some(a => a.type === 'none' && a.title.includes('No major weather alerts')));

  // 3. Daily Forecast Aggregator Test
  const mockForecastList = [
    { dt_txt: '2026-10-13 09:00:00', main: { temp: 28, feels_like: 30, humidity: 65 }, weather: [{ id: 800, main: 'Clear', description: 'clear sky' }], wind: { speed: 3 }, pop: 0.1 },
    { dt_txt: '2026-10-13 12:00:00', main: { temp: 33, feels_like: 35, humidity: 55 }, weather: [{ id: 801, main: 'Clouds', description: 'few clouds' }], wind: { speed: 4 }, pop: 0.2 },
    { dt_txt: '2026-10-14 12:00:00', main: { temp: 30, feels_like: 32, humidity: 70 }, weather: [{ id: 500, main: 'Rain', description: 'light rain' }], wind: { speed: 5 }, pop: 0.75 }
  ];
  const aggregated = aggregateDailyForecast(mockForecastList);
  assert('Daily forecast aggregation groups by date', Array.isArray(aggregated) && aggregated.length === 2);
  assert('Rain probability formatted as percentage (0.75 -> 75%)', aggregated[1].rainProbability === 75);

  // 4. API Endpoints Tests via HTTP
  // Test missing coordinates
  const missingRes = await request('GET', '/api/weather');
  assert('GET /api/weather without coords returns 400', missingRes.status === 400);

  // Test invalid coordinates
  const invalidRes = await request('GET', '/api/weather?lat=999&lon=77.2090');
  assert('GET /api/weather with lat=999 returns 400', invalidRes.status === 400);

  // Test API endpoint error handling (when API key is activating or invalid)
  const weatherRes = await request('GET', '/api/weather?lat=28.6139&lon=77.2090');
  assert('GET /api/weather handles OpenWeather status cleanly without fabricating fake weather',
    weatherRes.status === 200 || (weatherRes.status === 401 && weatherRes.body.error.includes('Weather data is temporarily unavailable'))
  );

  // Test AI Weather Explanation (English)
  const aiPayload = {
    weather: {
      location: { name: 'Agra', latitude: 27.1767, longitude: 78.0081 },
      current: {
        temperature: 32,
        feelsLike: 34,
        humidity: 62,
        windSpeed: 12,
        condition: 'Clouds',
        description: 'scattered clouds',
        rainProbability: 25
      },
      alerts: [{ title: '✓ No major weather alerts', message: 'No alerts', farmTip: 'Normal field operations' }],
      forecast: [
        { dayName: 'Tomorrow', temperature: 31, condition: 'Rain', rainProbability: 60 }
      ]
    },
    language: 'en'
  };
  const aiResEn = await request('POST', '/api/weather/ai-explain', aiPayload);
  assert('POST /api/weather/ai-explain returns explanation in English',
    aiResEn.status === 200 && typeof aiResEn.body.explanation === 'string' && aiResEn.body.explanation.length > 0
  );

  // Test AI Weather Explanation (Hinglish)
  aiPayload.language = 'hinglish';
  const aiResHinglish = await request('POST', '/api/weather/ai-explain', aiPayload);
  assert('POST /api/weather/ai-explain returns explanation in Hinglish',
    aiResHinglish.status === 200 && typeof aiResHinglish.body.explanation === 'string'
  );

  // Test AI Weather Explanation (Hindi)
  aiPayload.language = 'hi';
  const aiResHi = await request('POST', '/api/weather/ai-explain', aiPayload);
  assert('POST /api/weather/ai-explain returns explanation in Hindi',
    aiResHi.status === 200 && typeof aiResHi.body.explanation === 'string'
  );

  console.log('======================================================================');
  console.log(`WEATHER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
