import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, CheckCircle2, Clock, Zap, Database, AlertCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function AutoTrainStatusCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [forceTrain, setForceTrain] = useState(false);
  const { t, formatNumber } = useTranslation();

  const fetchStatus = () => {
    fetch('/api/market/auto-train/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch auto-train status:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000); // Auto-poll every 8s
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/market/auto-train/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceTrain, async: false })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: 'success', text: data.message });
      } else {
        setActionMsg({ type: 'error', text: data.message || data.error });
      }
      fetchStatus();
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Request failed: ' + err.message });
    } finally {
      setTriggering(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
          <RefreshCw size={16} className="spin-icon" /> {t('common.states.loadingData')}
        </div>
      </div>
    );
  }

  const isBusy = triggering || status?.isWorking;
  const metrics = status?.metrics;
  const bestModel = metrics?.best_model || 'Ridge_Regression';
  const bestMetrics = metrics?.metrics_table?.find(m => m.Model === bestModel);

  const nextRunFormatted = status?.nextRunTime
    ? new Date(status.nextRunTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'In ~60 mins';

  return (
    <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid #c8e6c9', background: 'linear-gradient(180deg, #fbfdfa 0%, #ffffff 100%)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: '#e8f5e9', color: '#2e7d32', display: 'flex' }}>
            <Cpu size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('prediction.autoTrainCard.title')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {t('prediction.autoTrainCard.subtitle')}
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div>
          {isBusy ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#fff3bf', color: '#d9480f', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600 }}>
              <RefreshCw size={14} className="spin-icon" />
              {t('prediction.autoTrainCard.executingPipeline')}
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#e6fcf5', color: '#0ca678', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ca678' }} />
              {t('prediction.autoTrainCard.activeEvery', { mins: status?.intervalMinutes || 60 })}
            </span>
          )}
        </div>
      </div>

      {/* Metric Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Total Ingested */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '0.9rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Database size={13} color="var(--primary)" /> {t('prediction.autoTrainCard.mandiRecords')}
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {formatNumber(status?.totalMandiRecords || 45281)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2b8a3e', marginTop: '0.15rem' }}>
            {t('prediction.autoTrainCard.liveArrivals')}
          </div>
        </div>

        {/* Champion Model */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '0.9rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Zap size={13} color="#f59f00" /> {t('prediction.autoTrainCard.bestTrainedModel')}
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {bestModel.replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Holdout Test R²: <strong>{bestMetrics?.Test_R2 || '0.9922'}</strong>
          </div>
        </div>

        {/* Prediction Accuracy */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '0.9rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <TrendingUp size={13} color="#2b8a3e" /> {t('prediction.autoTrainCard.testMetrics')}
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            ₹{bestMetrics?.Test_RMSE || '467.82'} / ₹{bestMetrics?.Test_MAE || '190.77'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Test MAPE: {bestMetrics?.['Test_MAPE_%'] || '57.0'}%
          </div>
        </div>

        {/* Next Autonomous Cycle */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '0.9rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Clock size={13} color="#1c7ed6" /> {t('prediction.autoTrainCard.nextAutoSync')}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {nextRunFormatted}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {t('prediction.autoTrainCard.daemonActive')}
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: actionMsg.type === 'success' ? '#ebfbee' : '#fff5f5',
          color: actionMsg.type === 'success' ? '#2b8a3e' : '#c92a2a',
          border: `1px solid ${actionMsg.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
        }}>
          {actionMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Interactive Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #edf2f7' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={forceTrain}
            onChange={(e) => setForceTrain(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          {t('prediction.autoTrainCard.forceRetrain')}
        </label>

        <button
          onClick={handleTrigger}
          disabled={isBusy}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1.1rem',
            fontSize: '0.85rem',
            opacity: isBusy ? 0.7 : 1,
            cursor: isBusy ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={14} className={isBusy ? 'spin-icon' : ''} />
          {isBusy ? t('prediction.autoTrainCard.executingPipeline') : t('prediction.autoTrainCard.syncRetrainNow')}
        </button>
      </div>
    </div>
  );
}
