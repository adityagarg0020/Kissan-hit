import React, { useState } from 'react';
import { Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function LocationSelector({ userLocation, onLocationChange }) {
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const { t } = useTranslation();

  const handleUseMyLocation = () => {
    if (locating) return;

    if (!navigator.geolocation) {
      setErrorMsg(t('common.location.notSupported'));
      return;
    }

    setLocating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Math.round(position.coords.latitude * 10000) / 10000;
        const lng = Math.round(position.coords.longitude * 10000) / 10000;

        try {
          const res = await fetch(`/api/market/reverse-geocode?lat=${lat}&lng=${lng}`);
          const geo = await res.json();

          if (geo.success && geo.resolved) {
            onLocationChange({
              mode: 'gps',
              lat,
              lng,
              district: geo.district,
              state: geo.state,
              city: geo.city,
              displayName: geo.display_name,
              method: 'GPS',
              matchedInDataset: geo.matched_in_dataset
            });
            setSuccessMsg(`${geo.display_name}`);
          } else {
            onLocationChange({
              mode: 'gps',
              lat,
              lng,
              district: null,
              state: null,
              city: null,
              displayName: `GPS (${t('common.location.locationUnavailable')})`,
              method: 'GPS',
              matchedInDataset: false
            });
            setSuccessMsg(`${lat}° N, ${lng}° E`);
          }
        } catch (err) {
          onLocationChange({
            mode: 'gps',
            lat,
            lng,
            district: null,
            state: null,
            city: null,
            displayName: `GPS (${t('common.location.locationUnavailable')})`,
            method: 'GPS',
            matchedInDataset: false
          });
        } finally {
          setLocating(false);
          setTimeout(() => setSuccessMsg(null), 4000);
        }
      },
      (error) => {
        setLocating(false);
        let msg = t('common.location.gpsUnavailable');
        if (error.code === 1) msg = t('common.location.permissionDenied');
        else if (error.code === 2) msg = t('common.location.gpsUnavailable');
        else if (error.code === 3) msg = t('common.location.timeout');
        setErrorMsg(msg);
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true }
    );
  };

  const isGps = userLocation?.mode === 'gps' || userLocation?.method === 'GPS';

  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              📍 {t('common.location.farmerLocation')}
            </span>
            <span className="card-badge" style={{ backgroundColor: isGps ? '#228be6' : 'var(--border-medium)', color: isGps ? '#ffffff' : 'var(--text-main)', fontSize: '0.7rem' }}>
              {isGps ? t('common.location.gpsMode') : t('common.location.manualMode')}
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-deep)', marginTop: '0.1rem' }}>
            {userLocation.displayName || (userLocation.district ? `${userLocation.district}, ${userLocation.state}` : t('common.location.notSet'))}
          </div>
          {userLocation.lat && userLocation.lng && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              GPS: {userLocation.lat}° N, {userLocation.lng}° E ({isGps ? t('common.location.gpsMode') : t('common.location.districtCenter')})
            </div>
          )}
        </div>

        <button 
          className="btn btn-location"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          <Navigation size={16} className={locating ? 'spin' : ''} />
          {locating ? t('common.location.detecting') : t('common.location.useMyLocation')}
        </button>
      </div>

      {successMsg && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#2b8a3e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle size={15} /> {errorMsg}
        </div>
      )}
    </div>
  );
}
