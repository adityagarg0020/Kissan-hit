/**
 * KissanSaathi Weather Service
 * Integrates with OpenWeather API via Backend Proxy
 * Deterministic Rule-Based Agricultural Alerts & In-Memory Caching
 */

const https = require('https');

// Configurable Alert Thresholds in one place (Section 7)
const ALERT_THRESHOLDS = {
  RAIN_POP_MIN: 50,          // Rain probability >= 50%
  HIGH_TEMP_C: 38,           // Temperature >= 38°C
  STRONG_WIND_KMH: 30,       // Wind speed >= 30 km/h
  THUNDERSTORM_CODES: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232] // Thunderstorm IDs
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const weatherCache = new Map();

/**
 * Coordinate validator
 */
function validateCoordinates(lat, lon) {
  const nLat = parseFloat(lat);
  const nLon = parseFloat(lon);

  if (isNaN(nLat) || isNaN(nLon)) {
    return { valid: false, error: 'Latitude and Longitude must be valid numbers.' };
  }
  if (nLat < -90 || nLat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90.' };
  }
  if (nLon < -180 || nLon > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180.' };
  }

  return { valid: true, lat: nLat, lon: nLon };
}

/**
 * Perform HTTPS GET request with timeout
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error('Invalid JSON received from weather service.'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error('Unable to connect to the weather service. Please check your internet connection.');
      err.code = 'ETIMEDOUT';
      reject(err);
    });

    req.on('error', (err) => {
      const networkErr = new Error('Unable to connect to the weather service. Please check your internet connection.');
      networkErr.original = err;
      reject(networkErr);
    });
  });
}

/**
 * Generate deterministic rule-based agricultural weather alerts
 */
function generateWeatherAlerts(current, forecastList = []) {
  const alerts = [];

  // Check Thunderstorm (current or in next 24 hours)
  const isCurrentThunderstorm = ALERT_THRESHOLDS.THUNDERSTORM_CODES.includes(current.weatherId);
  const isForecastThunderstorm = forecastList.slice(0, 8).some(f => 
    ALERT_THRESHOLDS.THUNDERSTORM_CODES.includes(f.weatherId)
  );

  if (isCurrentThunderstorm || isForecastThunderstorm) {
    alerts.push({
      id: 'alert-thunderstorm',
      type: 'thunderstorm',
      level: 'warning',
      title: '⛈️ Thunderstorm Alert',
      message: 'Thunderstorms are expected.',
      farmTip: 'Avoid outdoor farm work during thunderstorms and protect equipment where possible.'
    });
  }

  // Check Rain Likely (>= 50% pop or current rain)
  const isCurrentRain = ['Rain', 'Drizzle'].includes(current.condition);
  const maxRainPop = Math.max(
    current.rainProbability || 0,
    ...forecastList.slice(0, 8).map(f => f.rainProbability || 0)
  );

  if (isCurrentRain || maxRainPop >= ALERT_THRESHOLDS.RAIN_POP_MIN) {
    alerts.push({
      id: 'alert-rain',
      type: 'rain',
      level: 'info',
      title: '🌧️ Rain Likely',
      message: 'Rain is likely in your area.',
      farmTip: 'Consider the forecast before irrigation or spraying activities.'
    });
  }

  // Check High Temperature (>= 38°C)
  const maxTemp = Math.max(
    current.temperature || 0,
    ...forecastList.slice(0, 8).map(f => f.temperature || 0)
  );

  if (maxTemp >= ALERT_THRESHOLDS.HIGH_TEMP_C) {
    alerts.push({
      id: 'alert-heat',
      type: 'heat',
      level: 'warning',
      title: '🌡️ High Temperature Alert',
      message: 'High temperatures are expected.',
      farmTip: 'Monitor crops for heat stress and maintain appropriate irrigation.'
    });
  }

  // Check Strong Wind (>= 30 km/h)
  const maxWind = Math.max(
    current.windSpeed || 0,
    ...forecastList.slice(0, 8).map(f => f.windSpeed || 0)
  );

  if (maxWind >= ALERT_THRESHOLDS.STRONG_WIND_KMH) {
    alerts.push({
      id: 'alert-wind',
      type: 'wind',
      level: 'warning',
      title: '💨 Strong Wind Alert',
      message: 'Strong winds are expected.',
      farmTip: 'Check vulnerable crops and farm structures.'
    });
  }

  // If no significant alerts triggered
  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-none',
      type: 'none',
      level: 'normal',
      title: '✓ No major weather alerts',
      message: 'No major weather alerts are currently detected.',
      farmTip: 'Conditions are stable for routine field activities.'
    });
  }

  return alerts;
}

/**
 * Generate actionable agronomic farm tips
 */
function generateAgriculturalAdvice(current, alerts) {
  const tips = [];

  const hasRainAlert = alerts.some(a => a.type === 'rain');
  const hasHeatAlert = alerts.some(a => a.type === 'heat');
  const hasWindAlert = alerts.some(a => a.type === 'wind');
  const hasThunderAlert = alerts.some(a => a.type === 'thunderstorm');

  if (hasThunderAlert) {
    tips.push({
      category: 'Safety & Equipment',
      icon: '⛈️',
      text: 'Thunderstorm warning active. Secure open harvest, stall machinery under shelter, and avoid standing near lone trees or iron poles in fields.'
    });
  }

  if (hasRainAlert) {
    tips.push({
      category: 'Irrigation & Spraying',
      icon: '🌧️',
      text: 'Rain is anticipated. Defer chemical spraying to avoid chemical wash-off, and hold off on field irrigation to prevent waterlogging.'
    });
  } else if (hasHeatAlert) {
    tips.push({
      category: 'Irrigation & Moisture',
      icon: '🌡️',
      text: 'High temperatures may increase soil evaporation. Schedule light, frequent irrigations during early morning or evening hours to reduce heat stress.'
    });
  } else {
    tips.push({
      category: 'Field Operations',
      icon: '🌾',
      text: 'Weather parameters are favorable for regular weeding, fertilizer top-dressing, and intercultural farm operations.'
    });
  }

  if (hasWindAlert) {
    tips.push({
      category: 'Pesticide Application',
      icon: '💨',
      text: 'High wind velocity increases spray drift. Postpone foliar spraying until wind calms to prevent chemical wastage and drift injury.'
    });
  }

  return tips;
}

/**
 * Aggregate 3-hour forecast intervals into a clean 5-day daily forecast
 */
function aggregateDailyForecast(forecastList = []) {
  const daysMap = new Map();
  const todayStr = new Date().toISOString().split('T')[0];

  for (const item of forecastList) {
    if (!item.dt_txt) continue;
    const dateStr = item.dt_txt.split(' ')[0];
    
    if (!daysMap.has(dateStr)) {
      daysMap.set(dateStr, []);
    }
    daysMap.get(dateStr).push(item);
  }

  const result = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let dayIndex = 0;
  for (const [dateStr, intervals] of daysMap.entries()) {
    if (result.length >= 6) break; // 5-6 day forecast

    const temps = intervals.map(i => i.main?.temp).filter(t => typeof t === 'number');
    const minTemp = Math.round(Math.min(...temps));
    const maxTemp = Math.round(Math.max(...temps));

    // Midday interval (around 12:00:00) or first interval
    const middayInterval = intervals.find(i => i.dt_txt.includes('12:00:00')) || intervals[Math.floor(intervals.length / 2)];
    const weatherObj = middayInterval.weather?.[0] || {};

    const pops = intervals.map(i => i.pop || 0);
    const maxPop = Math.round(Math.max(...pops) * 100);

    const d = new Date(dateStr);
    let dayName = daysOfWeek[d.getDay()];
    if (dateStr === todayStr) {
      dayName = 'Today';
    } else if (dayIndex === 1) {
      dayName = 'Tomorrow';
    }

    result.push({
      date: dateStr,
      dayName,
      temperature: Math.round(middayInterval.main?.temp ?? ((minTemp + maxTemp) / 2)),
      tempMin: minTemp,
      tempMax: maxTemp,
      feelsLike: Math.round(middayInterval.main?.feels_like ?? middayInterval.main?.temp),
      humidity: middayInterval.main?.humidity ?? 60,
      windSpeed: Math.round((middayInterval.wind?.speed || 0) * 3.6),
      weatherId: weatherObj.id || 800,
      condition: weatherObj.main || 'Clear',
      description: weatherObj.description || 'clear sky',
      rainProbability: maxPop,
      icon: weatherObj.icon || '01d'
    });

    dayIndex++;
  }

  return result;
}

/**
 * Main Weather Service Fetcher
 */
async function getWeather(lat, lon, forceRefresh = false) {
  const coordCheck = validateCoordinates(lat, lon);
  if (!coordCheck.valid) {
    const err = new Error(coordCheck.error);
    err.status = 400;
    throw err;
  }

  const { lat: validLat, lon: validLon } = coordCheck;
  const cacheKey = `${validLat.toFixed(2)}_${validLon.toFixed(2)}`;

  // Check in-memory cache
  if (!forceRefresh && weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.payload;
    }
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    const err = new Error('Weather data is temporarily unavailable. Please try again later.');
    err.status = 503;
    err.code = 'API_KEY_UNCONFIGURED';
    throw err;
  }

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${validLat}&lon=${validLon}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${validLat}&lon=${validLon}&appid=${apiKey}&units=metric`;

  let weatherRes, forecastRes;
  try {
    [weatherRes, forecastRes] = await Promise.all([
      httpGet(weatherUrl),
      httpGet(forecastUrl)
    ]);
  } catch (netErr) {
    const err = new Error('Unable to connect to the weather service. Please check your internet connection.');
    err.status = 502;
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  if (weatherRes.status === 401 || forecastRes.status === 401) {
    const err = new Error('Weather data is temporarily unavailable. Please try again later.');
    err.status = 401;
    err.code = 'INVALID_API_KEY';
    throw err;
  }

  if (weatherRes.status !== 200) {
    const err = new Error('Weather data is temporarily unavailable. Please try again later.');
    err.status = weatherRes.status;
    err.code = 'OPENWEATHER_ERROR';
    throw err;
  }

  const currentRaw = weatherRes.data;
  const forecastRaw = forecastRes.data || {};

  // Parse immediate forecast interval for rain probability
  const firstForecastItem = Array.isArray(forecastRaw.list) && forecastRaw.list.length > 0 ? forecastRaw.list[0] : null;
  const currentRainProb = firstForecastItem && typeof firstForecastItem.pop === 'number'
    ? Math.round(firstForecastItem.pop * 100)
    : 0;

  const currentNormalized = {
    temperature: Math.round(currentRaw.main?.temp ?? 0),
    feelsLike: Math.round(currentRaw.main?.feels_like ?? currentRaw.main?.temp ?? 0),
    tempMin: Math.round(currentRaw.main?.temp_min ?? currentRaw.main?.temp ?? 0),
    tempMax: Math.round(currentRaw.main?.temp_max ?? currentRaw.main?.temp ?? 0),
    humidity: currentRaw.main?.humidity ?? 0,
    windSpeed: Math.round((currentRaw.wind?.speed || 0) * 3.6), // m/s to km/h
    condition: currentRaw.weather?.[0]?.main || 'Clear',
    description: currentRaw.weather?.[0]?.description || 'clear sky',
    weatherId: currentRaw.weather?.[0]?.id || 800,
    icon: currentRaw.weather?.[0]?.icon || '01d',
    rainProbability: currentRainProb
  };

  // Forecast daily aggregation
  const dailyForecast = aggregateDailyForecast(forecastRaw.list || []);

  // Alerts
  const forecastListNormalized = (forecastRaw.list || []).map(i => ({
    temperature: Math.round(i.main?.temp || 0),
    windSpeed: Math.round((i.wind?.speed || 0) * 3.6),
    weatherId: i.weather?.[0]?.id || 800,
    condition: i.weather?.[0]?.main || 'Clear',
    rainProbability: Math.round((i.pop || 0) * 100)
  }));

  const alerts = generateWeatherAlerts(currentNormalized, forecastListNormalized);
  const advice = generateAgriculturalAdvice(currentNormalized, alerts);

  const payload = {
    success: true,
    location: {
      name: currentRaw.name || 'Current Location',
      latitude: validLat,
      longitude: validLon,
      country: currentRaw.sys?.country || 'IN'
    },
    current: currentNormalized,
    forecast: dailyForecast,
    alerts,
    advice,
    updatedAt: new Date().toISOString()
  };

  // Store in cache
  weatherCache.set(cacheKey, {
    timestamp: Date.now(),
    payload
  });

  return payload;
}

module.exports = {
  ALERT_THRESHOLDS,
  validateCoordinates,
  generateWeatherAlerts,
  generateAgriculturalAdvice,
  aggregateDailyForecast,
  getWeather,
  _cache: weatherCache
};
