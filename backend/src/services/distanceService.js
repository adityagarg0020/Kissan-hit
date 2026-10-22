const dataService = require('./dataService');

class DistanceService {
  constructor() {
    this.EARTH_RADIUS_KM = 6371;
    // Configurable thresholds for transportation burden
    this.BURDEN_THRESHOLDS = {
      low: 10,     // 0-10 km -> Low
      medium: 30   // 10-30 km -> Medium, > 30 km -> High
    };
  }

  // Haversine straight-line distance between two (lat, lon) coordinates
  calculateHaversine(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  // Classify transportation burden based on straight-line distance
  classifyTransportationBurden(distanceKm) {
    if (distanceKm === null || distanceKm === undefined) {
      return { level: 'Unknown', color: 'gray', label: 'Distance N/A' };
    }
    if (distanceKm <= this.BURDEN_THRESHOLDS.low) {
      return { level: 'Low', color: 'green', label: '0–10 km (Low Transportation Burden)' };
    } else if (distanceKm <= this.BURDEN_THRESHOLDS.medium) {
      return { level: 'Medium', color: 'orange', label: '10–30 km (Moderate Transportation Burden)' };
    } else {
      return { level: 'High', color: 'red', label: '30+ km (High Transportation Burden)' };
    }
  }

  // Find district coordinates from verified lookup table
  getDistrictCoordinates(districtName) {
    if (!districtName) return null;
    const coords = dataService.districtCoordinates;
    if (coords[districtName]) return coords[districtName];

    // Case-insensitive lookup
    const target = districtName.trim().toLowerCase();
    for (const [key, val] of Object.entries(coords)) {
      if (key.toLowerCase() === target) {
        return val;
      }
    }
    return null;
  }

  // Get nearby mandis for a given commodity and farmer location
  findNearbyMandis({ commodity, userLat, userLng, userDistrict, maxRadiusKm = 100, limit = 15 }) {
    let mandis = dataService.mandiRecords;

    if (commodity) {
      mandis = mandis.filter(r => r.commodity.toLowerCase() === commodity.toLowerCase());
    }

    // If user provided a district name but no GPS, try getting district coordinates
    let originLat = userLat;
    let originLng = userLng;

    if ((!originLat || !originLng) && userDistrict) {
      const distCoord = this.getDistrictCoordinates(userDistrict);
      if (distCoord) {
        originLat = distCoord[0];
        originLng = distCoord[1];
      }
    }

    // Deduplicate mandis to latest observation per market
    const latestPerMarket = {};
    for (const record of mandis) {
      const key = `${record.state}__${record.market}`;
      if (!latestPerMarket[key] || record.arrival_date > latestPerMarket[key].arrival_date) {
        latestPerMarket[key] = record;
      }
    }
    const uniqueMandis = Object.values(latestPerMarket);

    // Compute distance for each mandi based on its district coordinates
    const evaluated = uniqueMandis.map(mandi => {
      const mandiDistrictCoord = this.getDistrictCoordinates(mandi.district);
      let distanceKm = null;
      let coordFound = false;

      if (originLat && originLng && mandiDistrictCoord) {
        distanceKm = Math.round(this.calculateHaversine(originLat, originLng, mandiDistrictCoord[0], mandiDistrictCoord[1]) * 10) / 10;
        coordFound = true;
      }

      const burden = this.classifyTransportationBurden(distanceKm);

      return {
        ...mandi,
        distance_km: distanceKm,
        has_exact_coords: coordFound,
        transportation_burden: burden,
        distance_label: distanceKm !== null ? `${distanceKm} km (approx. straight-line distance to district market center)` : 'Distance unavailable (district coordinates pending)'
      };
    });

    // Filter by max radius if coordinates exist, and sort by distance
    let sorted = evaluated;
    if (originLat && originLng) {
      sorted = evaluated
        .filter(m => m.distance_km !== null && m.distance_km <= maxRadiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);
    } else {
      // Sort by modal price descending if no location
      sorted = evaluated.sort((a, b) => b.modal_price - a.modal_price);
    }

    return {
      origin: {
        lat: originLat,
        lng: originLng,
        district: userDistrict || 'Detected Location'
      },
      total_found: sorted.length,
      mandis: sorted.slice(0, limit),
      note: 'Straight-line Haversine distance calculated to verified district market center. Road distance and mandi-gate coordinates may vary.'
    };
  }
}

module.exports = new DistanceService();
