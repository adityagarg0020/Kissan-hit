import React, { useEffect, useState } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

export default function CropSearchFilters({ onFilterChange, currentFilters }) {
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [markets, setMarkets] = useState([]);

  // Fetch cascading filter options based on current selections
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentFilters.commodity) params.append('commodity', currentFilters.commodity);
    if (currentFilters.state) params.append('state', currentFilters.state);
    if (currentFilters.district) params.append('district', currentFilters.district);

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
      .catch(err => console.error('Failed to load filter options:', err));
  }, [currentFilters.commodity, currentFilters.state, currentFilters.district]);

  const handleCommodityChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      commodity: val,
      state: '',
      district: '',
      market: ''
    });
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...currentFilters,
      state: val,
      district: '',
      market: ''
    });
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...currentFilters,
      district: val,
      market: ''
    });
  };

  const handleMarketChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...currentFilters,
      market: val
    });
  };

  const handleReset = () => {
    onFilterChange({
      commodity: 'Wheat',
      state: 'Uttar Pradesh',
      district: 'Agra',
      market: 'Agra APMC'
    });
  };

  return (
    <div className="card" id="search-section">
      <div className="card-header">
        <div className="card-title">
          <Search size={20} color="var(--primary)" /> Search Crop & Mandi Prices
        </div>
        <button 
          className="btn btn-outline" 
          onClick={handleReset} 
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          title="Reset to default selection"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="filter-grid">
        {/* 1. Crop / Commodity */}
        <div className="form-group">
          <label className="form-label" htmlFor="crop-select">1. Crop / Commodity</label>
          <select 
            id="crop-select" 
            className="form-select"
            value={currentFilters.commodity || ''}
            onChange={handleCommodityChange}
          >
            <option value="">-- All Commodities --</option>
            {commodities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* 2. State */}
        <div className="form-group">
          <label className="form-label" htmlFor="state-select">2. State</label>
          <select 
            id="state-select" 
            className="form-select"
            value={currentFilters.state || ''}
            onChange={handleStateChange}
          >
            <option value="">-- All States --</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 3. District */}
        <div className="form-group">
          <label className="form-label" htmlFor="district-select">3. District</label>
          <select 
            id="district-select" 
            className="form-select"
            value={currentFilters.district || ''}
            onChange={handleDistrictChange}
            disabled={!currentFilters.state}
          >
            <option value="">{currentFilters.state ? '-- Select District --' : '-- Select State First --'}</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 4. Mandi / Market */}
        <div className="form-group">
          <label className="form-label" htmlFor="mandi-select">4. Mandi / Market</label>
          <select 
            id="mandi-select" 
            className="form-select"
            value={currentFilters.market || ''}
            onChange={handleMarketChange}
            disabled={!currentFilters.district}
          >
            <option value="">{currentFilters.district ? '-- All Mandis in District --' : '-- Select District First --'}</option>
            {markets.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
