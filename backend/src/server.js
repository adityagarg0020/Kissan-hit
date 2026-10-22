const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const marketRoutes = require('./routes/marketRoutes');
const dataService = require('./services/dataService');
const autoTrainService = require('./services/autoTrainService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow local frontend dev server
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger (safe, no keys)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
const healthHandler = (req, res) => {
  dataService.ensureDateFreshness();
  const dates = [...new Set(dataService.mandiRecords.map(r => r.arrival_date))].filter(Boolean).sort().reverse();
  const todayStr = dataService.getTodayISO ? dataService.getTodayISO() : new Date().toISOString().split('T')[0];
  const latestDate = dates[0] || todayStr;
  
  let formattedFreshness = '22 Oct 2026';
  if (latestDate && latestDate.includes('-')) {
    const [y, m, d] = latestDate.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || 'Oct';
    formattedFreshness = `${parseInt(d, 10)} ${monthName} ${y}`;
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Kissan Saathi Market Intelligence API',
    data_loaded: dataService.isLoaded,
    mandi_records_count: dataService.mandiRecords.length,
    historical_records_count: dataService.historicalRecords.length,
    latest_arrival_date: latestDate,
    mandi_session_freshness: formattedFreshness
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

const expenseRoutes = require('./routes/expenseRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const authRoutes = require('./routes/authRoutes');

// Mount Routes (with and without /api prefix for Vercel serverless rewrite compatibility)
app.use('/api/market', marketRoutes);
app.use('/market', marketRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/expenses', expenseRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/weather', weatherRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Direct Aliases
app.post('/api/chat', (req, res, next) => {
  req.url = '/chat';
  marketRoutes(req, res, next);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('[ServerError]', err);
  }
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start Server after Data Initialization
async function startServer() {
  try {
    await dataService.initialize();
    app.listen(PORT, () => {
      console.log(`======================================================================`);
      console.log(`🚀 Kissan Saathi Backend Server running on http://localhost:${PORT}`);
      console.log(`🌱 Market Intelligence & Price Discovery Module Active`);
      console.log(`📁 Data: ${dataService.mandiRecords.length} mandi records, ${dataService.historicalRecords.length} 10-year records`);
      console.log(`🔒 Data.gov.in API Key is securely protected in backend .env`);
      console.log(`======================================================================`);

      // Start autonomous live data sync and model self-training scheduler
      autoTrainService.startScheduler();
    });
  } catch (e) {
    console.error('[Fatal Error] Failed to start backend:', e);
    process.exit(1);
  }
}

if (!process.env.VERCEL && require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
