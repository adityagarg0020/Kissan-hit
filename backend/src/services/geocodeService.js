const https = require('https');
const dataService = require('./dataService');
const distanceService = require('./distanceService');

class GeocodeService {
  constructor() {
    this.districtToStateMap = null;
    this.allDistricts = null;
    this.allStates = null;
  }

  ensureIndexed() {
    if (this.districtToStateMap) return;

    this.districtToStateMap = {};
    const stateSet = new Set();
    const districtSet = new Set();

    for (const r of dataService.mandiRecords) {
      const dLower = r.district.trim().toLowerCase();
      if (!this.districtToStateMap[dLower]) {
        this.districtToStateMap[dLower] = {
          district: r.district.trim(),
          state: r.state.trim(),
          canonical_state: r.canonical_state
        };
      }
      stateSet.add(r.state.trim());
      districtSet.add(r.district.trim());
    }

    this.allStates = Array.from(stateSet);
    this.allDistricts = Array.from(districtSet);
  }

  // Match raw district/state string to dataset
  matchDistrictAndState(rawDistrict, rawState) {
    this.ensureIndexed();
    let matchedDistrict = null;
    let matchedState = null;

    if (rawDistrict) {
      const dClean = rawDistrict.trim().toLowerCase();
      // Direct lookup
      if (this.districtToStateMap[dClean]) {
        matchedDistrict = this.districtToStateMap[dClean].district;
        matchedState = this.districtToStateMap[dClean].state;
      } else {
        // Partial substring search
        for (const [key, val] of Object.entries(this.districtToStateMap)) {
          if (key.includes(dClean) || dClean.includes(key)) {
            matchedDistrict = val.district;
            matchedState = val.state;
            break;
          }
        }
      }
    }

    if (rawState) {
      const sClean = rawState.trim().toLowerCase();
      for (const st of this.allStates) {
        if (st.toLowerCase() === sClean || sClean.includes(st.toLowerCase()) || st.toLowerCase().includes(sClean)) {
          matchedState = st;
          break;
        }
      }
    }

    return { matchedDistrict, matchedState };
  }

  // Find nearest district from coordinates lookup
  findNearestDistrictFromCoords(lat, lng, maxDistanceKm = 50) {
    this.ensureIndexed();
    const coords = dataService.districtCoordinates;
    let nearestDistrict = null;
    let minDistance = Infinity;

    for (const [distName, pt] of Object.entries(coords)) {
      const distKm = distanceService.calculateHaversine(lat, lng, pt[0], pt[1]);
      if (distKm < minDistance) {
        minDistance = distKm;
        nearestDistrict = distName;
      }
    }

    if (nearestDistrict && minDistance <= maxDistanceKm) {
      const dClean = nearestDistrict.trim().toLowerCase();
      const info = this.districtToStateMap[dClean];
      return {
        district: info ? info.district : nearestDistrict,
        state: info ? info.state : null,
        distanceKm: Math.round(minDistance * 10) / 10
      };
    }

    return null;
  }

  // Call OSM Nominatim with 3.5s timeout
  queryNominatim(lat, lng) {
    return new Promise((resolve) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
      const options = {
        headers: {
          'User-Agent': 'KissanSaathi/1.0 (contact@kissansaathi.in)',
          'Accept-Language': 'en'
        },
        timeout: 3500
      };

      const req = https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          return resolve(null);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  async reverseGeocode(lat, lng) {
    this.ensureIndexed();

    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);

    if (isNaN(nLat) || isNaN(nLng)) {
      return {
        success: false,
        error: 'Invalid latitude or longitude numbers.'
      };
    }

    // Check roughly within India bounding box (Lat 6-38, Lng 68-98)
    const isInIndiaBox = nLat >= 6.0 && nLat <= 38.5 && nLng >= 68.0 && nLng <= 98.5;
    if (!isInIndiaBox) {
      return {
        success: true,
        resolved: false,
        lat: nLat,
        lng: nLng,
        display_name: 'Current GPS location (Outside India region)',
        city: null,
        district: null,
        state: null,
        matched_in_dataset: false
      };
    }

    // 1. Try reverse geocoding via OSM Nominatim
    let osmResult = null;
    try {
      osmResult = await this.queryNominatim(nLat, nLng);
    } catch (e) {
      osmResult = null;
    }

    if (osmResult && osmResult.address) {
      const addr = osmResult.address;
      const rawCity = addr.city || addr.town || addr.village || addr.suburb || null;
      const rawDistrict = addr.county || addr.state_district || addr.district || rawCity;
      const rawState = addr.state || null;

      // Cross reference with our dataset
      const { matchedDistrict, matchedState } = this.matchDistrictAndState(rawDistrict, rawState);

      if (matchedDistrict && matchedState) {
        return {
          success: true,
          resolved: true,
          lat: nLat,
          lng: nLng,
          city: rawCity,
          district: matchedDistrict,
          state: matchedState,
          display_name: `${matchedDistrict}, ${matchedState}`,
          matched_in_dataset: true,
          source: 'osm_nominatim'
        };
      } else if (rawDistrict || rawState) {
        // District/state resolved geographically but not present in APMC dataset
        return {
          success: true,
          resolved: true,
          lat: nLat,
          lng: nLng,
          city: rawCity,
          district: matchedDistrict || rawDistrict,
          state: matchedState || rawState,
          display_name: `${rawDistrict || rawCity || 'Location'}, ${rawState || 'India'}`,
          matched_in_dataset: Boolean(matchedDistrict && matchedState),
          source: 'osm_nominatim'
        };
      }
    }

    // 2. Fallback: Local spatial index lookup using district_coordinates.json
    const localMatch = this.findNearestDistrictFromCoords(nLat, nLng, 45);
    if (localMatch && localMatch.district && localMatch.state) {
      return {
        success: true,
        resolved: true,
        lat: nLat,
        lng: nLng,
        city: localMatch.district,
        district: localMatch.district,
        state: localMatch.state,
        display_name: `${localMatch.district}, ${localMatch.state}`,
        matched_in_dataset: true,
        source: 'local_district_spatial_index',
        distance_to_center_km: localMatch.distanceKm
      };
    }

    // 3. Fallback when coordinates cannot be matched to any district
    return {
      success: true,
      resolved: false,
      lat: nLat,
      lng: nLng,
      city: null,
      district: null,
      state: null,
      display_name: 'Current GPS location (Location name unavailable)',
      matched_in_dataset: false,
      source: 'unresolved'
    };
  }
}

module.exports = new GeocodeService();
