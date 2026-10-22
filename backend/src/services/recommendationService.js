const distanceService = require('./distanceService');

class RecommendationService {
  constructor() {
    // Configurable weights
    this.weights = {
      price: 0.60,      // 60%
      distance: 0.30,   // 30%
      freshness: 0.10   // 10%
    };
  }

  // Get Best Nearby Mandi Recommendation
  getBestNearbyMandi({ commodity, userLat, userLng, userDistrict, mandisList = null }) {
    let candidateMandis = mandisList;
    if (!candidateMandis) {
      const nearbyRes = distanceService.findNearbyMandis({
        commodity,
        userLat,
        userLng,
        userDistrict,
        maxRadiusKm: 120,
        limit: 20
      });
      candidateMandis = nearbyRes.mandis;
    }

    if (!candidateMandis || candidateMandis.length === 0) {
      return {
        best_mandi: null,
        comparison: [],
        spread_analysis: null,
        message: 'No active mandi records found for comparison in the selected area.'
      };
    }

    // Determine min/max across candidates for normalization
    const prices = candidateMandis.map(m => m.modal_price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRange = maxP - minP || 1;

    const validDistances = candidateMandis.map(m => m.distance_km).filter(d => d !== null);
    const minD = validDistances.length > 0 ? Math.min(...validDistances) : 5;
    const maxD = validDistances.length > 0 ? Math.max(...validDistances) : 50;
    const distRange = maxD - minD || 1;

    const refDate = Date.now();

    // Score each candidate mandi
    const scoredMandis = candidateMandis.map(mandi => {
      // 1. Price Score: higher modal price gets higher score [0, 1]
      const priceScore = (mandi.modal_price - minP) / priceRange;

      // 2. Distance Score: closer distance gets higher score [0, 1]
      let distScore = 0.5;
      if (mandi.distance_km !== null) {
        distScore = 1 - (mandi.distance_km - minD) / distRange;
      }

      // 3. Freshness Score: recent arrival date gets higher score [0, 1]
      const arrivalTime = new Date(mandi.arrival_date).getTime();
      const ageDays = Math.max(0, (refDate - arrivalTime) / (1000 * 60 * 60 * 24));
      const freshnessScore = Math.max(0, 1 - (ageDays / 7)); // 0-7 days decay

      // Composite Weighted Score
      const compositeScore =
        priceScore * this.weights.price +
        distScore * this.weights.distance +
        freshnessScore * this.weights.freshness;

      return {
        ...mandi,
        score: Math.round(compositeScore * 1000) / 10, // out of 100
        score_breakdown: {
          price_factor: Math.round(priceScore * 100),
          distance_factor: Math.round(distScore * 100),
          freshness_factor: Math.round(freshnessScore * 100)
        }
      };
    });

    // Sort by composite score descending
    scoredMandis.sort((a, b) => b.score - a.score);

    const bestMandi = scoredMandis[0];

    // Price spread across candidate mandis
    const highestModal = Math.max(...prices);
    const lowestModal = Math.min(...prices);
    const priceSpread = highestModal - lowestModal;

    return {
      best_mandi: {
        ...bestMandi,
        badge: 'Recommended Mandi',
        recommendation_statement: 'Recommended based on current reported price, distance and data freshness.',
        weights_used: {
          current_price: '60%',
          distance: '30%',
          data_freshness: '10%'
        }
      },
      comparison: scoredMandis,
      spread_analysis: {
        highest_reported_price: highestModal,
        lowest_reported_price: lowestModal,
        price_spread: priceSpread,
        spread_label: `₹${priceSpread.toLocaleString('en-IN')}/quintal difference between highest and lowest nearby mandis`,
        disclaimer: 'Price difference is indicative of reported market rates. Net realization depends on actual quality grading, weighing, and individual transportation costs.'
      }
    };
  }
}

module.exports = new RecommendationService();
