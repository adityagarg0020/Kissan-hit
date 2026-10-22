const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const distanceService = require('../services/distanceService');
const recommendationService = require('../services/recommendationService');
const historicalService = require('../services/historicalService');
const predictionService = require('../services/predictionService');
const alertService = require('../services/alertService');
const geocodeService = require('../services/geocodeService');
const dataGovService = require('../services/dataGovService');
const chatService = require('../services/chatService');
const autoTrainService = require('../services/autoTrainService');
const expenseRoutes = require('./expenseRoutes');
const { optionalAuth } = require('../middleware/authMiddleware');

// Mount expenses submodule
router.use('/expenses', expenseRoutes);

// Reverse Geocoding for GPS Location
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng query parameters are required' });
    }
    const result = await geocodeService.reverseGeocode(lat, lng);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Live Price Ticker
router.get('/ticker', (req, res) => {
  try {
    const ticker = dataService.getLiveTicker();
    res.json({ success: true, count: ticker.length, ticker });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Cascading Search Filters
router.get('/filters', (req, res) => {
  try {
    const { commodity, state, district } = req.query;
    const filterOptions = dataService.getFilterOptions(commodity, state, district);
    res.json({ success: true, ...filterOptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Search Mandi Prices
router.get('/search', (req, res) => {
  try {
    const { commodity, state, district, market, variety, grade, limit, page } = req.query;
    const result = dataService.searchMandiPrices({
      commodity,
      state,
      district,
      market,
      variety,
      grade,
      limit: limit ? parseInt(limit, 10) : 50,
      page: page ? parseInt(page, 10) : 1
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Current Price Details
router.get('/current-price', (req, res) => {
  try {
    const { commodity, state, district, market } = req.query;
    if (!commodity) {
      return res.status(400).json({ success: false, error: 'commodity query parameter is required' });
    }
    const details = dataService.getCurrentPriceDetails({ commodity, state, district, market });
    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'No current mandi record found matching criteria.'
      });
    }
    res.json({ success: true, data: details });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Nearby Mandis (Haversine Straight-line Distance)
router.get('/nearby', (req, res) => {
  try {
    const { commodity, lat, lng, district, max_radius, limit } = req.query;
    const nearby = distanceService.findNearbyMandis({
      commodity: commodity || null,
      userLat: lat ? parseFloat(lat) : null,
      userLng: lng ? parseFloat(lng) : null,
      userDistrict: district || null,
      maxRadiusKm: max_radius ? parseFloat(max_radius) : 150,
      limit: limit ? parseInt(limit, 10) : 15
    });
    res.json({ success: true, ...nearby });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Compare Nearby Mandis & Price Spread
router.get('/compare', (req, res) => {
  try {
    const { commodity, lat, lng, district } = req.query;
    const comparison = recommendationService.getBestNearbyMandi({
      commodity: commodity || 'Wheat',
      userLat: lat ? parseFloat(lat) : null,
      userLng: lng ? parseFloat(lng) : null,
      userDistrict: district || null
    });
    res.json({ success: true, ...comparison });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Best Nearby Mandi Recommendation
router.get('/best-nearby', (req, res) => {
  try {
    const { commodity, lat, lng, district } = req.query;
    const result = recommendationService.getBestNearbyMandi({
      commodity: commodity || 'Wheat',
      userLat: lat ? parseFloat(lat) : null,
      userLng: lng ? parseFloat(lng) : null,
      userDistrict: district || null
    });
    res.json({ success: true, best_mandi: result.best_mandi });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. 10-Year Historical Price Trend
router.get('/history', (req, res) => {
  try {
    const { commodity, state } = req.query;
    if (!commodity) {
      return res.status(400).json({ success: false, error: 'commodity query parameter is required' });
    }
    const trend = historicalService.getHistoricalTrend(commodity, state || 'All India');
    if (trend.error) {
      return res.status(404).json({ success: false, ...trend });
    }
    res.json({ success: true, ...trend });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Comprehensive Historical Intelligence
router.get('/historical-analysis', (req, res) => {
  try {
    const { commodity, state, current_price, sort_by } = req.query;
    if (!commodity) {
      return res.status(400).json({ success: false, error: 'commodity query parameter is required' });
    }
    const crop = commodity.trim();
    const st = state || 'All India';
    const cPrice = current_price ? parseFloat(current_price) : null;

    const trend = historicalService.getHistoricalTrend(crop, st);
    if (trend.error) {
      return res.status(404).json({ success: false, ...trend });
    }
    const bestMonth = historicalService.getBestHistoricalMonth(crop, st);
    const stateRanking = historicalService.getStateWiseAnalysis(crop, sort_by || 'highest_average');
    const seasonal = historicalService.getSeasonalAnalysis(crop, st);
    const volatilityAnomaly = historicalService.getVolatilityAndAnomaly(crop, st, cPrice);

    res.json({
      success: true,
      commodity: crop,
      state: st,
      trend,
      best_month: bestMonth,
      state_ranking: stateRanking,
      seasonal,
      volatility: volatilityAnomaly.volatility,
      anomaly: volatilityAnomaly.anomaly,
      disclaimers: {
        historical: 'Historical patterns do not guarantee future prices.',
        indicative: 'Market prices are indicative and may vary depending on quality, grade, quantity, arrivals and market conditions.'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. AI Price Prediction & Sell Decision Support
router.post('/predict-price', async (req, res) => {
  try {
    const { commodity, state, current_price, horizon_days } = req.body;
    if (!commodity) {
      return res.status(400).json({ success: false, error: 'commodity parameter is required in request body' });
    }
    const forecast = await predictionService.getPrediction({
      commodity,
      state: state || 'All India',
      currentPrice: current_price ? parseFloat(current_price) : null,
      horizonDays: horizon_days ? parseInt(horizon_days, 10) : 7
    });
    if (forecast.status === 'failed' || forecast.success === false) {
      return res.status(forecast.status_code || 404).json(forecast);
    }
    res.json({ success: true, ...forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/forecast', async (req, res) => {
  try {
    const { commodity, state, current_price, horizon_days } = req.query;
    if (!commodity) {
      return res.status(400).json({ success: false, error: 'commodity query parameter is required' });
    }
    const forecast = await predictionService.getPrediction({
      commodity,
      state: state || 'All India',
      currentPrice: current_price ? parseFloat(current_price) : null,
      horizonDays: horizon_days ? parseInt(horizon_days, 10) : 7
    });
    if (forecast.status === 'failed' || forecast.success === false) {
      return res.status(forecast.status_code || 404).json(forecast);
    }
    res.json({ success: true, ...forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias: GET /api/market/prediction
router.get('/prediction', async (req, res) => {
  try {
    const { commodity, state, current_price, horizon_days } = req.query;
    if (!commodity) {
      return res.status(400).json({ success: false, error: 'commodity query parameter is required' });
    }
    const forecast = await predictionService.getPrediction({
      commodity,
      state: state || 'All India',
      currentPrice: current_price ? parseFloat(current_price) : null,
      horizonDays: horizon_days ? parseInt(horizon_days, 10) : 7
    });
    if (forecast.status === 'failed' || forecast.success === false) {
      return res.status(forecast.status_code || 404).json(forecast);
    }
    res.json({ success: true, ...forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Alerts Endpoints
router.get('/alerts', optionalAuth, async (req, res) => {
  try {
    const alerts = await alertService.getAlerts(req.user?.id);
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/alerts', optionalAuth, async (req, res) => {
  try {
    const newAlert = await alertService.createAlert({ ...req.body, user_id: req.user?.id });
    res.status(201).json({ success: true, alert: newAlert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/alerts/:id', optionalAuth, async (req, res) => {
  try {
    const result = await alertService.deleteAlert(req.params.id, req.user?.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Data.gov.in Live Synchronization Endpoints
router.get('/sync-status', (req, res) => {
  res.json({ success: true, ...dataGovService.getStatus() });
});

router.post('/sync', async (req, res) => {
  try {
    const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 500;
    const result = await dataGovService.syncLatestMandiData({ limit });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reload', async (req, res) => {
  try {
    const count = await dataService.reloadMandiData();
    res.json({ success: true, message: `Datasets reloaded successfully`, total_records: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12b. Autonomous Self-Training Engine Endpoints
router.get('/auto-train/status', (req, res) => {
  res.json({ success: true, ...autoTrainService.getStatus() });
});

router.post('/auto-train/trigger', async (req, res) => {
  try {
    const forceTrain = Boolean(req.body?.forceTrain);
    const fetchCount = req.body?.fetchCount ? parseInt(req.body.fetchCount, 10) : 3000;
    
    // Execute cycle asynchronously or await based on query/body
    const isAsync = req.query?.async === 'true' || req.body?.async === true;
    if (isAsync) {
      autoTrainService.executeCycle({ reason: 'manual_trigger', forceTrain, fetchCount }).catch(err => {
        console.error('[AutoTrainAPI] Background run error:', err);
      });
      return res.json({
        success: true,
        message: 'Autonomous sync and training initiated in background.',
        currentStatus: autoTrainService.getStatus()
      });
    }

    const result = await autoTrainService.executeCycle({ reason: 'manual_trigger', forceTrain, fetchCount });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. OpenAI AI Assistant Chat Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory, contextLocation, contextCrop } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'message string is required in body' });
    }

    const response = await chatService.handleChat({
      message,
      conversationHistory,
      contextLocation,
      contextCrop
    });

    res.json({ success: true, ...response });
  } catch (err) {
    console.error('[ChatAPI] Error processing chat:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

