const dataService = require('./dataService');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

class HistoricalService {
  // Get 10-Year Historical Price Trend Line
  getHistoricalTrend(commodity, state = 'All India') {
    const histCrop = dataService.matchHistoricalCrop(commodity);
    if (!histCrop) {
      return {
        error: `Crop '${commodity}' not found in 10-year historical dataset.`,
        available_crops: [...new Set(dataService.historicalRecords.map(r => r.crop))].sort()
      };
    }

    let records = dataService.historicalRecords.filter(r =>
      r.crop.toLowerCase() === histCrop.toLowerCase() &&
      (r.state.toLowerCase() === state.toLowerCase() || r.canonical_state.toLowerCase() === state.toLowerCase())
    );

    if (records.length < 12 && state.toLowerCase() !== 'all india') {
      records = dataService.historicalRecords.filter(r =>
        r.crop.toLowerCase() === histCrop.toLowerCase() &&
        r.state.toLowerCase() === 'all india'
      );
    }

    records.sort((a, b) => a.date.localeCompare(b.date));

    const prices = records.map(r => r.modal_price);
    const mean = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      commodity,
      historical_crop: histCrop,
      state: records.length > 0 ? records[0].state : state,
      total_observations: records.length,
      period: 'October 2016 – September 2026 (10 Years)',
      summary: {
        average_price: mean,
        min_recorded_price: min,
        max_recorded_price: max
      },
      series: records.map(r => ({
        calendar: r.calendar,
        date: r.date,
        year: r.year,
        month: r.month,
        month_name: MONTH_NAMES[r.month - 1],
        price: r.modal_price
      })),
      disclaimer: 'Historical patterns do not guarantee future prices.'
    };
  }

  // Best Historical Month for a Crop + State
  getBestHistoricalMonth(commodity, state = 'All India') {
    const histCrop = dataService.matchHistoricalCrop(commodity);
    if (!histCrop) {
      return null;
    }

    let records = dataService.historicalRecords.filter(r =>
      r.crop.toLowerCase() === histCrop.toLowerCase() &&
      (r.state.toLowerCase() === state.toLowerCase() || r.canonical_state.toLowerCase() === state.toLowerCase())
    );

    if (records.length < 12 && state.toLowerCase() !== 'all india') {
      records = dataService.historicalRecords.filter(r =>
        r.crop.toLowerCase() === histCrop.toLowerCase() &&
        r.state.toLowerCase() === 'all india'
      );
    }

    // Group by month (1..12)
    const monthBuckets = Array.from({ length: 12 }, () => []);
    for (const r of records) {
      if (r.month >= 1 && r.month <= 12) {
        monthBuckets[r.month - 1].push(r.modal_price);
      }
    }

    const monthlyStats = monthBuckets.map((prices, idx) => {
      const count = prices.length;
      // Absolute Rule 11: Missing values must remain missing; do not convert to 0
      if (count === 0) {
        return {
          month_number: idx + 1,
          month_name: MONTH_NAMES[idx],
          average_price: null,
          max_price: null,
          min_price: null,
          observation_count: 0
        };
      }
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / count);
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      return {
        month_number: idx + 1,
        month_name: MONTH_NAMES[idx],
        average_price: avg,
        max_price: max,
        min_price: min,
        observation_count: count
      };
    });

    // Best month: Highest average across all available years (NOT single outlier peak)
    const validMonths = monthlyStats.filter(m => m.observation_count > 0 && m.average_price !== null);
    let bestMonth = validMonths.length > 0 ? validMonths[0] : null;
    for (const m of validMonths) {
      if (m.average_price > bestMonth.average_price) {
        bestMonth = m;
      }
    }

    // Single highest peak record
    let highestPeakMonth = validMonths.length > 0 ? validMonths[0] : null;
    for (const m of validMonths) {
      if (m.max_price > highestPeakMonth.max_price) {
        highestPeakMonth = m;
      }
    }

    return {
      commodity,
      historical_crop: histCrop,
      state: records.length > 0 ? records[0].state : state,
      period: '2016–2026',
      best_month: bestMonth ? {
        month_name: bestMonth.month_name,
        average_price: bestMonth.average_price,
        unit: '₹/quintal',
        metric_explanation: 'Historically highest average modal price across all recorded years',
        observations_analyzed: bestMonth.observation_count
      } : null,
      highest_peak_month: highestPeakMonth ? {
        month_name: highestPeakMonth.month_name,
        max_recorded_price: highestPeakMonth.max_price,
        unit: '₹/quintal',
        metric_explanation: 'Single highest peak price recorded in historical records'
      } : null,
      monthly_breakdown: monthlyStats,
      disclaimer: 'Calculated from historical state-level Agmarknet records. Does not guarantee future prices.'
    };
  }

  // State-Wise Price Comparison & Ranking
  getStateWiseAnalysis(commodity, sortBy = 'highest_average') {
    const histCrop = dataService.matchHistoricalCrop(commodity);
    if (!histCrop) {
      return null;
    }

    const records = dataService.historicalRecords.filter(r =>
      r.crop.toLowerCase() === histCrop.toLowerCase() &&
      r.state.toLowerCase() !== 'all india'
    );

    // Group by state
    const stateMap = {};
    for (const r of records) {
      const st = r.state;
      if (!stateMap[st]) stateMap[st] = [];
      stateMap[st].push(r.modal_price);
    }

    const stateSummaries = Object.entries(stateMap).map(([state, prices]) => {
      const n = prices.length;
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / n);
      const max = Math.max(...prices);
      const min = Math.min(...prices);

      // Variance & Std Dev
      const variance = prices.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? Math.round((stdDev / avg) * 1000) / 10 : 0; // %

      let consistency = 'Stable';
      if (cv > 30) consistency = 'High Volatility';
      else if (cv >= 15) consistency = 'Moderate Volatility';

      return {
        state,
        record_count: n,
        observations: n,
        average_price: avg,
        max_price: max,
        min_price: min,
        std_dev: Math.round(stdDev),
        coefficient_of_variation_pct: cv,
        consistency_rating: consistency
      };
    });

    // Sorting
    if (sortBy === 'highest_recorded') {
      stateSummaries.sort((a, b) => b.max_price - a.max_price);
    } else if (sortBy === 'lowest_average') {
      stateSummaries.sort((a, b) => a.average_price - b.average_price);
    } else if (sortBy === 'most_consistent') {
      stateSummaries.sort((a, b) => a.coefficient_of_variation_pct - b.coefficient_of_variation_pct);
    } else {
      // Default: highest_average
      stateSummaries.sort((a, b) => b.average_price - a.average_price);
    }

    // Assign explicit rank
    stateSummaries.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    const topState = stateSummaries.length > 0 ? stateSummaries[0] : null;

    return {
      commodity,
      historical_crop: histCrop,
      sort_applied: sortBy,
      total_states: stateSummaries.length,
      total_states_compared: stateSummaries.length,
      historical_best_insight: topState ? {
        state: topState.state,
        insight_statement: `Based on the available historical data, this crop has recorded its highest average price in ${topState.state}.`,
        average_price: topState.average_price,
        max_recorded_price: topState.max_price,
        period: '2016–2026',
        records: topState.record_count
      } : null,
      rankings: stateSummaries,
      ranking: stateSummaries, // Backward compatibility
      disclaimer: 'Historical patterns do not guarantee future prices.'
    };
  }

  // Seasonal Price Analysis
  getSeasonalAnalysis(commodity, state = 'All India') {
    const histCrop = dataService.matchHistoricalCrop(commodity);
    if (!histCrop) {
      return null;
    }

    let records = dataService.historicalRecords.filter(r =>
      r.crop.toLowerCase() === histCrop.toLowerCase() &&
      (r.state.toLowerCase() === state.toLowerCase() || r.canonical_state.toLowerCase() === state.toLowerCase())
    );

    if (records.length < 12 && state.toLowerCase() !== 'all india') {
      records = dataService.historicalRecords.filter(r =>
        r.crop.toLowerCase() === histCrop.toLowerCase() &&
        r.state.toLowerCase() === 'all india'
      );
    }

    const seasons = {
      'Kharif (Monsoon)': [],
      'Rabi (Winter)': [],
      'Zaid (Summer)': []
    };

    for (const r of records) {
      if (r.season.includes('Kharif')) seasons['Kharif (Monsoon)'].push(r.modal_price);
      else if (r.season.includes('Rabi')) seasons['Rabi (Winter)'].push(r.modal_price);
      else if (r.season.includes('Zaid')) seasons['Zaid (Summer)'].push(r.modal_price);
    }

    const seasonalStats = Object.entries(seasons).map(([seasonName, prices]) => {
      const n = prices.length;
      if (n === 0) return { season: seasonName, average_price: null, observations: 0 };
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / n);
      return {
        season: seasonName,
        average_price: avg,
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
        observations: n
      };
    });

    return {
      commodity,
      historical_crop: histCrop,
      state: records.length > 0 ? records[0].state : state,
      seasons: seasonalStats,
      disclaimer: 'Seasonal averages reflect historical market arrivals and seasonal production cycles over 2016–2026.'
    };
  }

  // Price Volatility & Price Anomaly Detection
  getVolatilityAndAnomaly(commodity, state = 'All India', currentPrice = null) {
    const histCrop = dataService.matchHistoricalCrop(commodity);
    if (!histCrop) {
      return {
        volatility: { category: 'Unknown', cv_percentage: 0, description: 'Crop not recognized.' },
        anomaly: { is_anomaly: false, message: 'Crop not recognized.' }
      };
    }

    let records = dataService.historicalRecords.filter(r =>
      r.crop.toLowerCase() === histCrop.toLowerCase() &&
      (r.state.toLowerCase() === state.toLowerCase() || r.canonical_state.toLowerCase() === state.toLowerCase())
    );

    if (records.length < 12 && state.toLowerCase() !== 'all india') {
      records = dataService.historicalRecords.filter(r =>
        r.crop.toLowerCase() === histCrop.toLowerCase() &&
        r.state.toLowerCase() === 'all india'
      );
    }

    const prices = records.map(r => r.modal_price);
    const n = prices.length;
    if (n === 0) {
      return {
        volatility: { category: 'Unknown', cv_percentage: 0 },
        anomaly: { is_anomaly: false, message: 'Insufficient historical data for volatility assessment.' }
      };
    }

    const mean = prices.reduce((a, b) => a + b, 0) / n;
    const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    let volCategory = 'Stable';
    let volDescription = 'Historical price has shown low fluctuation (CV < 15%).';
    if (cv > 30) {
      volCategory = 'High';
      volDescription = 'Historical price fluctuates substantially (CV > 30%), influenced by supply shocks and perishability.';
    } else if (cv >= 15) {
      volCategory = 'Moderate';
      volDescription = 'Historical price displays moderate seasonal variation (CV between 15% and 30%).';
    }

    // Anomaly Detection: Z-Score test
    let anomalyData = {
      is_anomaly: false,
      z_score: 0,
      status: 'Normal',
      message: 'Current price aligns with historical price ranges.'
    };

    if (currentPrice && currentPrice > 0 && stdDev > 0) {
      const zScore = (currentPrice - mean) / stdDev;
      const roundedZ = Math.round(zScore * 100) / 100;

      if (zScore > 2.0) {
        anomalyData = {
          is_anomaly: true,
          z_score: roundedZ,
          status: 'Unusually High',
          message: `⚠️ Current price (₹${currentPrice.toLocaleString('en-IN')}) is unusually high compared to its historical pattern (Z-Score: +${roundedZ}).`
        };
      } else if (zScore < -2.0) {
        anomalyData = {
          is_anomaly: true,
          z_score: roundedZ,
          status: 'Unusually Low',
          message: `⚠️ Current price (₹${currentPrice.toLocaleString('en-IN')}) is unusually low compared to its historical pattern (Z-Score: ${roundedZ}).`
        };
      } else {
        anomalyData = {
          is_anomaly: false,
          z_score: roundedZ,
          status: 'Normal',
          message: `Current price (₹${currentPrice.toLocaleString('en-IN')}) is within expected historical bounds (Z-Score: ${roundedZ}).`
        };
      }
    }

    return {
      commodity,
      historical_crop: histCrop,
      state: records.length > 0 ? records[0].state : state,
      volatility: {
        category: volCategory,
        cv_percentage: Math.round(cv * 10) / 10,
        standard_deviation: Math.round(stdDev),
        mean_price: Math.round(mean),
        threshold_explanation: 'Classification: Stable (<15%), Moderate (15–30%), High (>30%) based on Coefficient of Variation.',
        description: volDescription
      },
      anomaly: anomalyData
    };
  }
}

module.exports = new HistoricalService();
