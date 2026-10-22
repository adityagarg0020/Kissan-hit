import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';
import PriceCard from '../components/common/PriceCard';
import CropSelector from '../components/common/CropSelector';
import StateSelector from '../components/common/StateSelector';
import DistrictSelector from '../components/common/DistrictSelector';
import MandiSelector from '../components/common/MandiSelector';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import DataSourceBadge from '../components/common/DataSourceBadge';

export default function LiveMarketPage() {
  const {
    filters,
    updateFilters,
    commodities,
    states,
    districts,
    markets
  } = useMarket();
  const { t, formatNumber, formatDate } = useTranslation();

  // Local filter states for variety and grade
  const [variety, setVariety] = useState('');
  const [grade, setGrade] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Current price details for hero card
  const [currentPriceData, setCurrentPriceData] = useState(null);
  const [loadingHero, setLoadingHero] = useState(false);

  // Search results list
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingResults, setLoadingResults] = useState(false);

  // Available varieties and grades collected from results
  const [availableVarieties, setAvailableVarieties] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);

  // Fetch hero current price details
  useEffect(() => {
    if (!filters.commodity) return;
    setLoadingHero(true);

    const params = new URLSearchParams({
      commodity: filters.commodity,
      state: filters.state || '',
      district: filters.district || '',
      market: filters.market || ''
    });

    fetch(`/api/market/current-price?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCurrentPriceData(data.data);
        } else {
          setCurrentPriceData(null);
        }
        setLoadingHero(false);
      })
      .catch(err => {
        console.error('Error fetching current price:', err);
        setLoadingHero(false);
      });
  }, [filters.commodity, filters.state, filters.district, filters.market]);

  // Fetch paginated mandi search results
  useEffect(() => {
    setLoadingResults(true);

    const params = new URLSearchParams({
      commodity: searchQuery || filters.commodity || '',
      state: filters.state || '',
      district: filters.district || '',
      market: filters.market || '',
      variety: variety || '',
      grade: grade || '',
      page: currentPage.toString(),
      limit: '15'
    });

    fetch(`/api/market/search?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSearchResults(data.records || []);
          setTotalResults(data.total || 0);
          setTotalPages(data.total_pages || 1);

          // Extract unique varieties and grades from records
          if (data.records) {
            const vList = [...new Set(data.records.map(r => r.variety).filter(Boolean))].sort();
            const gList = [...new Set(data.records.map(r => r.grade).filter(Boolean))].sort();
            setAvailableVarieties(vList);
            setAvailableGrades(gList);
          }
        } else {
          setSearchResults([]);
          setTotalResults(0);
        }
        setLoadingResults(false);
      })
      .catch(err => {
        console.error('Error searching mandi prices:', err);
        setLoadingResults(false);
      });
  }, [filters.commodity, filters.state, filters.district, filters.market, variety, grade, searchQuery, currentPage]);

  const handleResetFilters = () => {
    updateFilters({
      commodity: 'Wheat',
      state: 'Uttar Pradesh',
      district: 'Agra',
      market: ''
    });
    setVariety('');
    setGrade('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="live-market-page">
      {/* Page Header */}
      <div className="page-header-box">
        <h1 className="page-title">
          📈 {t('market.pageTitle')}
        </h1>
        <p className="page-subtitle">
          {t('market.pageSubtitle')}
        </p>
      </div>

      {/* Cascading Search & Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Filter size={18} color="var(--primary)" /> {t('common.actions.filter')}
          </div>
          <button
            className="btn btn-outline"
            onClick={handleResetFilters}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            title="Reset filters to default"
          >
            <RotateCcw size={14} /> {t('common.actions.resetFilters')}
          </button>
        </div>

        {/* Free text search input */}
        <div style={{ marginBottom: '1rem' }}>
          <div className="search-input-wrapper">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input-field"
              placeholder={t('market.filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                className="btn-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Cascading Filter Selectors Grid */}
        <div className="filter-grid">
          {/* 1. Crop / Commodity */}
          <CropSelector
            value={filters.commodity}
            onChange={(val) => {
              updateFilters({ commodity: val, market: '' });
              setCurrentPage(1);
            }}
            commodities={commodities}
            showAllOption={true}
          />

          {/* 2. State */}
          <StateSelector
            value={filters.state}
            onChange={(val) => {
              updateFilters({ state: val, district: '', market: '' });
              setCurrentPage(1);
            }}
            states={states}
            showAllOption={true}
          />

          {/* 3. District */}
          <DistrictSelector
            value={filters.district}
            onChange={(val) => {
              updateFilters({ district: val, market: '' });
              setCurrentPage(1);
            }}
            districts={districts}
            disabled={!filters.state}
            showAllOption={true}
          />

          {/* 4. Mandi / Market */}
          <MandiSelector
            value={filters.market}
            onChange={(val) => {
              updateFilters({ market: val });
              setCurrentPage(1);
            }}
            markets={markets}
            disabled={!filters.district}
            showAllOption={true}
          />

          {/* 5. Variety Filter */}
          <div className="form-group">
            <label className="form-label" htmlFor="variety-filter">5. {t('market.filters.variety')}</label>
            <select
              id="variety-filter"
              className="form-select"
              value={variety}
              onChange={(e) => {
                setVariety(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">-- {t('market.filters.allVarieties')} --</option>
              {availableVarieties.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* 6. Grade Filter */}
          <div className="form-group">
            <label className="form-label" htmlFor="grade-filter">6. {t('market.filters.grade')}</label>
            <select
              id="grade-filter"
              className="form-select"
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">-- {t('market.filters.allGrades')} --</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hero Current Mandi Price Card */}
      <div style={{ marginBottom: '1.5rem' }}>
        {loadingHero ? (
          <LoadingState message={t('common.states.loadingData')} />
        ) : currentPriceData ? (
          <PriceCard priceData={currentPriceData} />
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            {t('common.states.tryBroadening')}
          </div>
        )}
      </div>

      {/* Mandi Auction Records Table & List */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              📋 {t('market.results.title')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {t('market.results.showing')} {formatNumber(searchResults.length)} {t('common.actions.of')} {formatNumber(totalResults)} {t('market.results.resultsFound')}
            </div>
          </div>
          <DataSourceBadge source="Agmarknet Data.gov.in" verified={true} />
        </div>

        {loadingResults ? (
          <LoadingState message={t('common.states.loadingData')} />
        ) : searchResults.length === 0 ? (
          <EmptyState
            title={t('market.results.noResults')}
            message={t('common.states.tryBroadening')}
            action={
              <button className="btn btn-outline" onClick={handleResetFilters}>
                {t('common.actions.resetFilters')}
              </button>
            }
          />
        ) : (
          <>
            <div className="mandi-table-wrapper">
              <table className="mandi-table">
                <thead>
                  <tr>
                    <th>{t('market.results.columns.market')}</th>
                    <th>{t('market.results.columns.location')}</th>
                    <th>{t('market.results.columns.commodity')}</th>
                    <th>{t('market.results.columns.variety')} / {t('market.results.columns.grade')}</th>
                    <th style={{ textAlign: 'right' }}>{t('market.priceCard.minRate')}</th>
                    <th style={{ textAlign: 'right' }}>{t('market.priceCard.maxRate')}</th>
                    <th style={{ textAlign: 'right' }}>{t('market.priceCard.modalPrice')}</th>
                    <th>{t('market.results.columns.arrivalDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((row, idx) => (
                    <tr key={`${row.market}-${row.commodity}-${idx}`}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                        {row.market}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {row.district}, {row.state}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        🌾 {row.commodity}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {row.variety || 'Standard'}
                        </span>
                        {row.grade && (
                          <span className="card-badge" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>
                            {row.grade}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                        ₹{formatNumber(row.min_price)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--primary-dark)', fontSize: '0.86rem' }}>
                        ₹{formatNumber(row.max_price)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                        ₹{formatNumber(row.modal_price)}<span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{t('market.priceCard.perQuintal')}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {formatDate(row.arrival_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                >
                  <ChevronLeft size={16} /> {t('common.actions.prev')}
                </button>

                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {t('common.actions.page')} {formatNumber(currentPage)} {t('common.actions.of')} {formatNumber(totalPages)}
                </span>

                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                >
                  {t('common.actions.next')} <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
