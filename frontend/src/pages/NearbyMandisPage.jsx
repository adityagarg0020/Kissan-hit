import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';
import CropSelector from '../components/common/CropSelector';
import StateSelector from '../components/common/StateSelector';
import DistrictSelector from '../components/common/DistrictSelector';
import RecommendationCard from '../components/common/RecommendationCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function NearbyMandisPage() {
  const {
    filters,
    updateFilters,
    userLocation,
    setManualLocation,
    setGpsLocation,
    commodities,
    states,
    districts
  } = useMarket();
  const { t, formatNumber, formatDate } = useTranslation();

  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(null);
  const [showWeightsInfo, setShowWeightsInfo] = useState(false);

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use My Location (GPS) Flow
  const handleUseMyLocation = () => {
    if (locating) return;

    if (!navigator.geolocation) {
      setGpsError(t('common.location.notSupported'));
      return;
    }

    setLocating(true);
    setGpsError(null);
    setGpsSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Math.round(position.coords.latitude * 10000) / 10000;
        const lng = Math.round(position.coords.longitude * 10000) / 10000;

        try {
          const res = await fetch(`/api/market/reverse-geocode?lat=${lat}&lng=${lng}`);
          const geoData = await res.json();

          if (geoData.success && geoData.resolved) {
            setGpsLocation({
              lat,
              lng,
              district: geoData.district,
              state: geoData.state,
              city: geoData.city,
              displayName: geoData.display_name,
              matchedInDataset: geoData.matched_in_dataset
            });
            setGpsSuccess(`${geoData.display_name}`);
          } else {
            setGpsLocation({
              lat,
              lng,
              district: null,
              state: null,
              city: null,
              displayName: `GPS (${t('common.location.locationUnavailable')})`,
              matchedInDataset: false
            });
            setGpsSuccess(`${lat}° N, ${lng}° E`);
          }
        } catch (err) {
          console.warn('Reverse geocoding request error:', err);
          setGpsLocation({
            lat,
            lng,
            district: null,
            state: null,
            city: null,
            displayName: `GPS (${t('common.location.locationUnavailable')})`,
            matchedInDataset: false
          });
          setGpsSuccess(`${lat}° N, ${lng}° E`);
        } finally {
          setLocating(false);
          setTimeout(() => setGpsSuccess(null), 5000);
        }
      },
      (error) => {
        setLocating(false);
        let msg = t('common.location.gpsUnavailable');
        if (error.code === 1) {
          msg = t('common.location.permissionDenied');
        } else if (error.code === 2) {
          msg = t('common.location.gpsUnavailable');
        } else if (error.code === 3) {
          msg = t('common.location.timeout');
        }
        setGpsError(msg);
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true }
    );
  };

  // Fetch Nearby Mandis & Recommendation based on active location mode
  useEffect(() => {
    if (!filters.commodity) return;
    setLoading(true);

    const isGps = userLocation.mode === 'gps';
    const params = new URLSearchParams({
      commodity: filters.commodity
    });

    if (isGps && userLocation.lat && userLocation.lng) {
      params.append('lat', userLocation.lat.toString());
      params.append('lng', userLocation.lng.toString());
      if (userLocation.district) {
        params.append('district', userLocation.district);
      }
    } else {
      const manualDistrict = userLocation.district || filters.district || '';
      if (manualDistrict) {
        params.append('district', manualDistrict);
      }
      if (userLocation.lat && userLocation.lng) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
      }
    }

    fetch(`/api/market/compare?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setComparisonData(data);
        } else {
          setComparisonData(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching nearby mandis:', err);
        setLoading(false);
      });
  }, [
    filters.commodity,
    userLocation.mode,
    userLocation.lat,
    userLocation.lng,
    userLocation.district,
    userLocation.state,
    filters.district
  ]);

  const bestMandi = comparisonData?.best_mandi;
  const comparisonList = comparisonData?.comparison || [];
  const spreadAnalysis = comparisonData?.spread_analysis;
  const isGpsMode = userLocation.mode === 'gps';

  return (
    <div className="nearby-mandis-page">
      {/* Page Header */}
      <div className="page-header-box">
        <h1 className="page-title">
          📍 {t('nearby.pageTitle')}
        </h1>
        <p className="page-subtitle">
          {t('nearby.pageSubtitle')}
        </p>
      </div>

      {/* 1. Location & Crop Selection Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <MapPin size={18} color="var(--primary)" /> {t('nearby.farmerLocationTitle')}
          </div>
          <button
            className="btn btn-location"
            onClick={handleUseMyLocation}
            disabled={locating}
            style={{ minWidth: '170px' }}
          >
            <Navigation size={15} className={locating ? 'spin' : ''} />
            {locating ? t('common.location.detecting') : t('common.location.useMyLocation')}
          </button>
        </div>

        {gpsError && (
          <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--red-wash)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', border: '1px solid #ffa8a8' }}>
            <AlertCircle size={16} /> {gpsError}
          </div>
        )}

        {gpsSuccess && (
          <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#d8f3dc', borderRadius: 'var(--radius-sm)', color: '#2b8a3e', fontSize: '0.84rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', border: '1px solid #b2f2bb' }}>
            <CheckCircle2 size={16} /> {gpsSuccess}
          </div>
        )}

        {/* Unified Location Display Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.85rem 1.15rem', backgroundColor: isGpsMode ? '#e7f5ff' : 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', borderLeft: isGpsMode ? '4px solid #1971c2' : '4px solid var(--border-medium)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                {t('nearby.detectedRef')}
              </span>
              <span className="card-badge" style={{ backgroundColor: isGpsMode ? '#228be6' : 'var(--border-medium)', color: isGpsMode ? '#ffffff' : 'var(--text-main)', fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                {isGpsMode ? t('nearby.gpsModeActive') : t('nearby.manualModeActive')}
              </span>
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isGpsMode ? '#1864ab' : 'var(--primary-dark)', marginTop: '0.2rem' }}>
              {userLocation.displayName || (userLocation.district ? `${userLocation.district}, ${userLocation.state}` : t('common.location.notSet'))}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {userLocation.lat && userLocation.lng ? (
              <div style={{ fontSize: '0.82rem', color: isGpsMode ? '#1971c2' : 'var(--text-muted)', fontWeight: 600 }}>
                {t('nearby.coordinates')} {userLocation.lat}° N, {userLocation.lng}° E ({isGpsMode ? t('common.location.gpsMode') : t('common.location.districtCenter')})
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('nearby.coordinates')} {t('common.states.noData')}
              </div>
            )}
            {isGpsMode && (
              <div style={{ fontSize: '0.72rem', color: '#1864ab', marginTop: '0.15rem' }}>
                {t('nearby.realtimeGpsDesc')}
              </div>
            )}
          </div>
        </div>

        {/* Filter Grid */}
        <div className="filter-grid">
          {/* Crop Selection */}
          <CropSelector
            value={filters.commodity}
            onChange={(val) => updateFilters({ commodity: val })}
            commodities={commodities}
            showAllOption={false}
          />

          {/* Manual State Selection */}
          <StateSelector
            value={userLocation.state || ''}
            onChange={(val) => {
              setManualLocation({ state: val, district: '' });
            }}
            states={states}
            label={t('nearby.manualStateLabel')}
          />

          {/* Manual District Selection */}
          <DistrictSelector
            value={userLocation.district || ''}
            onChange={(val) => {
              setManualLocation({ state: userLocation.state, district: val });
            }}
            districts={districts}
            disabled={!userLocation.state}
            label={t('nearby.manualDistrictLabel')}
          />
        </div>

        <div style={{ marginTop: '0.85rem', fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {t('nearby.formulaNotice')}
        </div>
      </div>

      {/* 2. Recommendation Algorithm Explainer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => setShowWeightsInfo(!showWeightsInfo)}
          style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
        >
          <Info size={14} /> {t('nearby.howCalculated')}
        </button>
      </div>

      {showWeightsInfo && (
        <div style={{ backgroundColor: 'var(--primary-wash)', border: '1px solid var(--primary-soft)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <strong>{t('nearby.scoringBreakdown')}</strong>
          <ul style={{ marginLeft: '1.25rem', marginTop: '0.35rem', lineHeight: '1.6' }}>
            <li>{t('nearby.scorePrice')}</li>
            <li>{t('nearby.scoreProximity')}</li>
            <li>{t('nearby.scoreFreshness')}</li>
          </ul>
          <p style={{ marginTop: '0.4rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            "{t('nearby.recommendationDisclaimer')}"
          </p>
        </div>
      )}

      {/* 3. Loading State */}
      {loading && (
        <LoadingState message={t('nearby.calculating')} />
      )}

      {/* 4. Top Recommended Mandi Highlight */}
      {!loading && bestMandi && (
        <div style={{ marginBottom: '1.5rem' }}>
          <RecommendationCard
            title={t('nearby.topRecommended')}
            subtitle={bestMandi.market}
            distanceLabel={`${bestMandi.district}, ${bestMandi.state} • ${bestMandi.distance_label}`}
            burden={bestMandi.transportation_burden}
            price={bestMandi.modal_price}
            date={bestMandi.arrival_date}
            statement={bestMandi.recommendation_statement}
          />
        </div>
      )}

      {/* 5. Nearby Mandis Price Spread Banner */}
      {!loading && spreadAnalysis && spreadAnalysis.price_spread > 0 && (
        <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderLeft: '4px solid var(--accent-gold)' }}>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t('nearby.priceDifferenceAcross')}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.1rem' }}>
              {spreadAnalysis.spread_label}
            </div>
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            {t('nearby.high')}: <strong>₹{formatNumber(spreadAnalysis.highest_reported_price)}</strong> &bull; {t('nearby.low')}: <strong>₹{formatNumber(spreadAnalysis.lowest_reported_price)}</strong>
          </div>
        </div>
      )}

      {/* 6. Nearby Mandis Grid */}
      {!loading && comparisonList.length === 0 && (
        <EmptyState
          title={t('nearby.noNearbyMandis')}
          message={t('nearby.expandRadiusHint')}
        />
      )}

      {!loading && comparisonList.length > 0 && (
        <div className="section-block">
          <h2 className="section-title">
            {t('nearby.allNearbyMandis', { commodity: filters.commodity })}
          </h2>
          <p className="section-subtitle">
            {t('nearby.rankedBy', { location: userLocation.displayName || '' })}
          </p>

          <div className="mandi-card-grid">
            {comparisonList.map((mandi, idx) => (
              <div className={`mandi-card ${idx === 0 ? 'is-best' : ''}`} key={`${mandi.market}-${idx}`}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div className="mandi-card-name">{mandi.market}</div>
                    {idx === 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-dark)', background: '#d8f3dc', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {t('nearby.topPick')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {mandi.district}, {mandi.state}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className={`burden-tag ${mandi.transportation_burden?.level ? mandi.transportation_burden.level.toLowerCase() : 'low'}`}>
                      {mandi.distance_km !== null ? `${formatNumber(mandi.distance_km)} ${t('nearby.km')} (${t('nearby.straightLine')})` : 'Distance N/A'} &bull; {mandi.transportation_burden?.level || 'Standard'}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.6rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('market.priceCard.minRate')}: ₹{formatNumber(mandi.min_price)} | {t('market.priceCard.maxRate')}: ₹{formatNumber(mandi.max_price)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('market.priceCard.arrivalDate')}: {formatDate(mandi.arrival_date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                      ₹{formatNumber(mandi.modal_price)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('market.priceCard.perQuintal')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
