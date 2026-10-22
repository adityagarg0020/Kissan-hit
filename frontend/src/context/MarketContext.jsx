import React, { createContext, useContext, useState, useEffect } from 'react';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  // Shared filter selection
  const [filters, setFilters] = useState({
    commodity: 'Wheat',
    state: 'Uttar Pradesh',
    district: 'Agra',
    market: ''
  });

  // Shared farmer location with explicit mode ('manual' | 'gps')
  const [userLocation, setUserLocation] = useState({
    mode: 'manual', // 'manual' | 'gps'
    district: 'Agra',
    state: 'Uttar Pradesh',
    lat: 27.1767,
    lng: 78.0081,
    city: 'Agra',
    displayName: 'Agra, Uttar Pradesh',
    method: 'Manual'
  });

  // Ticker data shared across navbar/ticker
  const [tickerItems, setTickerItems] = useState([]);
  const [loadingTicker, setLoadingTicker] = useState(true);

  // Cascading options
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [markets, setMarkets] = useState([]);

  // Active alerts count for badges
  const [alertsCount, setAlertsCount] = useState(0);

  // Load ticker once
  useEffect(() => {
    fetch('/api/market/ticker')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.ticker) {
          setTickerItems(data.ticker);
        }
        setLoadingTicker(false);
      })
      .catch(err => {
        console.error('Failed to load ticker:', err);
        setLoadingTicker(false);
      });
  }, []);

  // Load cascading filter options
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.commodity) params.append('commodity', filters.commodity);
    if (filters.state) params.append('state', filters.state);
    if (filters.district) params.append('district', filters.district);

    fetch(`/api/market/filters?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCommodities(data.commodities || []);
          setStates(data.states || []);
          setDistricts(data.districts || []);
          setMarkets(data.markets || []);
        }
      })
      .catch(err => console.error('Failed to load filters:', err));
  }, [filters.commodity, filters.state, filters.district]);

  // Load active alerts count
  useEffect(() => {
    fetch('/api/market/alerts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.alerts) {
          setAlertsCount(data.alerts.length);
        }
      })
      .catch(err => console.error('Failed to fetch alerts count:', err));
  }, []);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Switch to Manual Mode
  const setManualLocation = ({ state, district, lat = null, lng = null }) => {
    const dispName = district ? (state ? `${district}, ${state}` : district) : (state || 'Location Not Set');
    setUserLocation({
      mode: 'manual',
      district: district || '',
      state: state || '',
      lat: lat,
      lng: lng,
      city: district || '',
      displayName: dispName,
      method: 'Manual'
    });

    setFilters(prev => ({
      ...prev,
      state: state || prev.state,
      district: district !== undefined ? district : prev.district,
      market: ''
    }));
  };

  // Switch to GPS Mode
  const setGpsLocation = ({ lat, lng, district, state, city, displayName, matchedInDataset = false }) => {
    const disp = displayName || (district && state ? `${district}, ${state}` : 'Current GPS location (Location name unavailable)');

    setUserLocation({
      mode: 'gps',
      lat,
      lng,
      district: district || null,
      state: state || null,
      city: city || null,
      displayName: disp,
      method: 'GPS'
    });

    // Update filters to match GPS resolved location
    if (state) {
      setFilters(prev => ({
        ...prev,
        state,
        district: district || prev.district,
        market: ''
      }));
    }

  };

  // General updater for backward compatibility
  const updateLocation = (newLoc) => {
    setUserLocation(prev => ({ ...prev, ...newLoc }));
    if (newLoc.district && newLoc.state) {
      setFilters(prev => ({
        ...prev,
        state: newLoc.state,
        district: newLoc.district,
        market: ''
      }));
    }
  };

  return (
    <MarketContext.Provider
      value={{
        filters,
        setFilters,
        updateFilters,
        userLocation,
        setUserLocation,
        setManualLocation,
        setGpsLocation,
        updateLocation,
        tickerItems,
        loadingTicker,
        commodities,
        states,
        districts,
        markets,
        alertsCount,
        setAlertsCount
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
