import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Plus, Trash2, Edit2, TrendingUp, TrendingDown,
  Scale, AlertCircle, CheckCircle2, RefreshCw, Info, Sparkles,
  ChevronRight, Calendar, MapPin, Wheat, ArrowUpRight
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import ExpenseModal from '../components/expenses/ExpenseModal';
import ExpenseDonutChart from '../components/charts/ExpenseDonutChart';
import LoadingState from '../components/common/LoadingState';

const CATEGORIES = [
  { id: 'Seeds', emoji: '🌱' },
  { id: 'Fertilizer', emoji: '🧪' },
  { id: 'Pesticides', emoji: '🛡️' },
  { id: 'Labour', emoji: '👷' },
  { id: 'Machinery', emoji: '🚜' },
  { id: 'Irrigation', emoji: '💧' },
  { id: 'Fuel', emoji: '⛽' },
  { id: 'Transportation', emoji: '🚚' },
  { id: 'Storage', emoji: '📦' },
  { id: 'Packaging', emoji: '🛍️' },
  { id: 'Other', emoji: '🏷️' }
];

export default function ExpenseTrackerPage() {
  const { t, formatNumber } = useTranslation();
  const { commodities, states } = useMarket();
  const { session, farms, selectedFarm, selectFarm } = useAuth();

  const [farmsList, setFarmsList] = useState([]);
  const [activeFarmId, setActiveFarmId] = useState(null);
  const [activeFarm, setActiveFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to generate headers with Supabase auth token
  const authHeaders = (isJson = true) => ({
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [modalDefaultCategory, setModalDefaultCategory] = useState('Seeds');

  // Farm Details Form
  const [farmForm, setFarmForm] = useState({
    farm_name: '',
    crop: 'Wheat',
    variety: '',
    season: 'Rabi',
    year: 2026,
    area: 2,
    area_unit: 'Acre',
    expected_production: 25,
    actual_production: 27,
    production_unit: 'Quintal',
    expected_selling_price: 2600,
    actual_selling_price: 2620,
    quantity_sold: 27,
    selling_date: new Date().toISOString().split('T')[0],
    selected_mandi: 'Agra',
    selected_state: 'Uttar Pradesh'
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaveMsg, setDetailsSaveMsg] = useState(null);

  // Mandi Price Lookup State
  const [fetchingMandiPrice, setFetchingMandiPrice] = useState(false);
  const [mandiPriceNotice, setMandiPriceNotice] = useState(null);

  // AI Advisor State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAdvice, setAiAdvice] = useState(null);
  const [askingAi, setAskingAi] = useState(false);

  // 1. Fetch Farms List
  const loadFarmsList = (targetId = null) => {
    fetch('/api/expenses/farms', { headers: authHeaders(false) })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setFarmsList(data.data);
          const chosenId = targetId || activeFarmId || data.data[0]?.id;
          if (chosenId) {
            setActiveFarmId(chosenId);
            loadFarmDetails(chosenId);
          } else {
            setLoading(false);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load farms list:', err);
        setLoading(false);
      });
  };

  // 2. Fetch Active Farm Details & Metrics
  const loadFarmDetails = (id) => {
    fetch(`/api/expenses/farms/${id}`, { headers: authHeaders(false) })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setActiveFarm(data.data);
          setFarmForm({
            farm_name: data.data.farm_name || '',
            crop: data.data.crop || 'Wheat',
            variety: data.data.variety || '',
            season: data.data.season || 'Rabi',
            year: data.data.year || 2026,
            area: data.data.area || 1,
            area_unit: data.data.area_unit || 'Acre',
            expected_production: data.data.expected_production || 0,
            actual_production: data.data.actual_production || 0,
            production_unit: data.data.production_unit || 'Quintal',
            expected_selling_price: data.data.expected_selling_price || 0,
            actual_selling_price: data.data.actual_selling_price || 0,
            quantity_sold: data.data.quantity_sold || 0,
            selling_date: data.data.selling_date || '',
            selected_mandi: data.data.selected_mandi || 'Agra',
            selected_state: data.data.selected_state || 'Uttar Pradesh'
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load farm details:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFarmsList();
  }, [session?.access_token]);

  // Handle Farm Details Save
  const handleSaveFarmDetails = async (e) => {
    e.preventDefault();
    if (!activeFarmId) return;
    setSavingDetails(true);
    setDetailsSaveMsg(null);

    try {
      const res = await fetch(`/api/expenses/farms/${activeFarmId}`, {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify(farmForm)
      });
      const data = await res.json();
      if (data.success) {
        setActiveFarm(data.data);
        setDetailsSaveMsg(t('expenses.farmDetails.savedSuccess'));
        setTimeout(() => setDetailsSaveMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error updating farm details:', err);
    } finally {
      setSavingDetails(false);
    }
  };

  // Create New Season
  const handleCreateNewSeason = async () => {
    const crop = prompt(t('expenses.newSeasonPrompt'), 'Wheat');
    if (!crop || !crop.trim()) return;

    const season = prompt(t('expenses.seasonPrompt'), 'Kharif');
    const year = prompt(t('expenses.yearPrompt'), '2026');

    try {
      const res = await fetch('/api/expenses/farms', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          farm_name: `${crop} Field`,
          crop: crop.trim(),
          season: season || 'Kharif',
          year: parseInt(year, 10) || 2026,
          area: 1,
          area_unit: 'Acre'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        loadFarmsList(data.data.id);
      }
    } catch (err) {
      alert('Failed to create new season: ' + err.message);
    }
  };

  // Delete Farm Season
  const handleDeleteSeason = async () => {
    if (!activeFarmId) return;
    if (!confirm(t('expenses.deleteConfirm', { crop: activeFarm.crop, season: activeFarm.season, year: activeFarm.year }))) return;

    try {
      const res = await fetch(`/api/expenses/farms/${activeFarmId}`, {
        method: 'DELETE',
        headers: authHeaders(false)
      });
      const data = await res.json();
      if (data.success) {
        loadFarmsList();
      }
    } catch (err) {
      alert('Failed to delete season: ' + err.message);
    }
  };

  // Add / Edit Expense Save
  const handleSaveExpense = async (payload) => {
    try {
      let res;
      if (editingExpense) {
        res = await fetch(`/api/expenses/farms/${activeFarmId}/entries/${editingExpense.id}`, {
          method: 'PUT',
          headers: authHeaders(true),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/expenses/farms/${activeFarmId}/entries`, {
          method: 'POST',
          headers: authHeaders(true),
          body: JSON.stringify(payload)
        });
      }
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setEditingExpense(null);
        loadFarmDetails(activeFarmId);
      }
    } catch (err) {
      alert('Error saving expense: ' + err.message);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    if (!confirm(t('expenses.deleteItemConfirm'))) return;
    try {
      const res = await fetch(`/api/expenses/farms/${activeFarmId}/entries/${expenseId}`, {
        method: 'DELETE',
        headers: authHeaders(false)
      });
      const data = await res.json();
      if (data.success) {
        loadFarmDetails(activeFarmId);
      }
    } catch (err) {
      alert('Error deleting expense: ' + err.message);
    }
  };

  // Use Current Mandi Price Feature
  const handleUseCurrentMandiPrice = async () => {
    setFetchingMandiPrice(true);
    setMandiPriceNotice(null);
    try {
      const params = new URLSearchParams({
        commodity: farmForm.crop,
        state: farmForm.selected_state || '',
        market: farmForm.selected_mandi || ''
      });
      const res = await fetch(`/api/market/current-price?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data && data.data.modal_price > 0) {
        const modalP = data.data.modal_price;
        setFarmForm(prev => ({ ...prev, expected_selling_price: modalP }));
        setMandiPriceNotice({
          type: 'success',
          text: t('expenses.production.rateFetched', {
            price: formatNumber(modalP),
            mandi: data.data.market || 'Agmarknet',
            date: data.data.arrival_date || new Date().toISOString().split('T')[0]
          })
        });
      } else {
        setMandiPriceNotice({
          type: 'error',
          text: t('expenses.production.noPriceAvailable')
        });
      }
    } catch (err) {
      setMandiPriceNotice({
        type: 'error',
        text: t('expenses.production.fetchFailed')
      });
    } finally {
      setFetchingMandiPrice(false);
    }
  };

  // Ask AI Cost Advisor
  const handleAskAi = async (customQ = null) => {
    const q = customQ || aiQuestion || t('expenses.aiAdvisor.q1');
    setAskingAi(true);
    setAiAdvice(null);
    try {
      const res = await fetch('/api/expenses/ai-advice', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          farm_id: activeFarmId,
          question: q
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiAdvice(data.advice);
      }
    } catch (err) {
      setAiAdvice(t('expenses.aiAdvisor.busy'));
    } finally {
      setAskingAi(false);
    }
  };

  if (loading) {
    return <LoadingState message={t('common.states.loadingData')} />;
  }

  const m = activeFarm?.metrics || {};
  const expenses = activeFarm?.expenses || [];

  // Robust break-even values with fallback calculation so Break-Even Price is always available
  const totalCost = (m.total_cost !== undefined) ? m.total_cost : expenses.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0);
  const benchmarkYield = Math.max(1, Math.round(18 * (parseFloat(activeFarm?.area) || 1)));
  const effectiveProd = (parseFloat(activeFarm?.actual_production) > 0)
    ? parseFloat(activeFarm.actual_production)
    : ((parseFloat(activeFarm?.expected_production) > 0) ? parseFloat(activeFarm.expected_production) : benchmarkYield);
  const breakEvenVal = (m.break_even_price !== null && m.break_even_price !== undefined)
    ? m.break_even_price
    : (totalCost > 0 ? Math.round(totalCost / effectiveProd) : 0);

  return (
    <div className="expense-tracker-page">
      {/* 1. Page Header & Season Switcher */}
      <div className="page-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            💰 {t('expenses.pageTitle')}
          </h1>
          <p className="page-subtitle">
            {t('expenses.pageSubtitle')}
          </p>

          {/* Multiple Farms Switcher */}
          {farms && farms.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                🌾 Farm:
              </span>
              <select
                value={selectedFarm?.id || ''}
                onChange={(e) => selectFarm(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1.5px solid var(--primary-light)',
                  backgroundColor: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--primary-deep)'
                }}
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} ({f.area} {f.area_unit}) {f.district ? `• ${f.district}` : ''}
                  </option>
                ))}
              </select>
              <Link to="/profile" style={{ fontSize: '0.78rem', color: 'var(--primary-deep)', fontWeight: 600, textDecoration: 'none' }}>
                Manage in Profile &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Season Selector Dropdown & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            value={activeFarmId || ''}
            onChange={(e) => {
              setActiveFarmId(e.target.value);
              loadFarmDetails(e.target.value);
            }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              color: 'var(--text-main)'
            }}
          >
            {farmsList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.year} — {f.crop} ({f.season}) &bull; ₹{formatNumber(f.total_cost || 0)}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateNewSeason}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem', padding: '0.5rem 0.85rem' }}
          >
            <Plus size={15} /> {t('expenses.newSeason')}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Strip */}
      <div className="dashboard-stats-strip" style={{ marginBottom: '1.5rem', marginTop: 0 }}>
        <div className="stat-pill" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-num" style={{ color: 'var(--text-main)' }}>
            ₹{formatNumber(m.total_cost || 0)}
          </div>
          <div className="stat-lbl" style={{ color: 'var(--text-secondary)' }}>
            {t('expenses.kpis.totalCost')}
          </div>
        </div>

        <div className="stat-pill" style={{ borderLeft: '4px solid #1c7ed6', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-num" style={{ color: '#1c7ed6' }}>
            {m.cost_per_acre ? `₹${formatNumber(m.cost_per_acre)}` : '—'}
          </div>
          <div className="stat-lbl" style={{ color: 'var(--text-secondary)' }}>
            {t('expenses.kpis.costPerAcre')}
          </div>
        </div>

        <div className="stat-pill" style={{ borderLeft: '4px solid #7048e8', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-num" style={{ color: '#7048e8' }}>
            {m.cost_per_hectare ? `₹${formatNumber(m.cost_per_hectare)}` : '—'}
          </div>
          <div className="stat-lbl" style={{ color: 'var(--text-secondary)' }}>
            {t('expenses.kpis.costPerHectare')}
          </div>
        </div>

        <div className="stat-pill" style={{ borderLeft: '4px solid #2b8a3e', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-num" style={{ color: '#2b8a3e' }}>
            ₹{formatNumber(breakEvenVal)}{t('prediction.perQ')}
          </div>
          <div className="stat-lbl" style={{ color: 'var(--text-secondary)' }}>
            {t('expenses.kpis.breakEvenPrice')} ({t('expenses.kpis.perQuintalBasis')})
          </div>
        </div>
      </div>

      {/* 3. Category Touch Cards Grid (Mobile-First) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {t('expenses.categories.title')}
          </h3>
          <button
            onClick={() => {
              setEditingExpense(null);
              setModalDefaultCategory('Seeds');
              setModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem', padding: '0.45rem 0.95rem' }}
          >
            <Plus size={15} /> {t('expenses.categories.addExpense')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.75rem' }}>
          {CATEGORIES.map((cat) => {
            const catItem = (m.category_breakdown || []).find(c => c.category === cat.id);
            const catCost = catItem ? catItem.cost : 0;
            const catCount = expenses.filter(e => e.category === cat.id).length;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setEditingExpense(null);
                  setModalDefaultCategory(cat.id);
                  setModalOpen(true);
                }}
                className="card"
                style={{
                  padding: '0.85rem',
                  marginBottom: 0,
                  cursor: 'pointer',
                  border: catCost > 0 ? '1.5px solid #86efac' : '1px solid var(--border-light)',
                  backgroundColor: catCost > 0 ? '#f0fdf4' : '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{cat.emoji}</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t(`expenses.categories.${cat.id.toLowerCase()}`)}
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: catCost > 0 ? '#15803d' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {catCost > 0 ? `₹${formatNumber(catCost)}` : '₹0'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {catCount} {catCount === 1 ? t('expenses.entry') : t('expenses.entries')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Two Column Layout: Farm Details & Financial Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Card: Farm & Crop Details */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div className="card-title" style={{ fontSize: '0.98rem' }}>
              <Wheat size={18} color="var(--primary)" /> {t('expenses.farmDetails.title')}
            </div>
            <button onClick={handleDeleteSeason} style={{ background: 'none', border: 'none', color: '#e03131', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Trash2 size={14} /> {t('expenses.farmDetails.deleteSeason')}
            </button>
          </div>

          <form onSubmit={handleSaveFarmDetails}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.farmDetails.farmName')}
                </label>
                <input
                  type="text"
                  value={farmForm.farm_name}
                  onChange={(e) => setFarmForm({ ...farmForm, farm_name: e.target.value })}
                  placeholder="e.g. Village Field A"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.farmDetails.crop')}
                </label>
                <input
                  type="text"
                  value={farmForm.crop}
                  onChange={(e) => setFarmForm({ ...farmForm, crop: e.target.value })}
                  placeholder="e.g. Wheat"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.farmDetails.variety')}
                </label>
                <input
                  type="text"
                  value={farmForm.variety}
                  onChange={(e) => setFarmForm({ ...farmForm, variety: e.target.value })}
                  placeholder="e.g. HD-2967"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.farmDetails.season')}
                </label>
                <select
                  value={farmForm.season}
                  onChange={(e) => setFarmForm({ ...farmForm, season: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="Rabi">Rabi</option>
                  <option value="Kharif">Kharif</option>
                  <option value="Zaid">Zaid</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.farmDetails.year')}
                </label>
                <input
                  type="number"
                  value={farmForm.year}
                  onChange={(e) => setFarmForm({ ...farmForm, year: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Farm Area & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.farmDetails.farmArea')}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={farmForm.area}
                  onChange={(e) => setFarmForm({ ...farmForm, area: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.farmDetails.areaUnit')}
                </label>
                <select
                  value={farmForm.area_unit}
                  onChange={(e) => setFarmForm({ ...farmForm, area_unit: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  <option value="Acre">{t('expenses.farmDetails.acre')}</option>
                  <option value="Hectare">{t('expenses.farmDetails.hectare')}</option>
                  <option value="Bigha">{t('expenses.farmDetails.bigha')}</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '1rem', fontStyle: 'italic' }}>
              {t('expenses.farmDetails.unitNotice')}
            </div>

            {detailsSaveMsg && (
              <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: '#ebfbee', color: '#2b8a3e', fontSize: '0.82rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} /> {detailsSaveMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={savingDetails}
              className="btn btn-outline"
              style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
            >
              {savingDetails ? t('expenses.farmDetails.saving') : t('expenses.farmDetails.updateParams')}
            </button>
          </form>
        </div>

        {/* Right Card: Production, Sales & Current Mandi Integration */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div className="card-title" style={{ fontSize: '0.98rem' }}>
              <Scale size={18} color="var(--primary)" /> {t('expenses.production.title')}
            </div>
          </div>

          <form onSubmit={handleSaveFarmDetails}>
            {/* Expected vs Actual Production */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.production.expectedProd')}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 25"
                  value={farmForm.expected_production}
                  onChange={(e) => setFarmForm({ ...farmForm, expected_production: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.production.actualProd')}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 27"
                  value={farmForm.actual_production}
                  onChange={(e) => setFarmForm({ ...farmForm, actual_production: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Selling Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.production.expectedPrice')}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2600"
                  value={farmForm.expected_selling_price}
                  onChange={(e) => setFarmForm({ ...farmForm, expected_selling_price: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {t('expenses.production.actualPrice')}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2620"
                  value={farmForm.actual_selling_price}
                  onChange={(e) => setFarmForm({ ...farmForm, actual_selling_price: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Mandi Connect Button */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  🌾 {t('expenses.production.targetApmc')}
                </span>
                <input
                  type="text"
                  placeholder="Mandi name (e.g. Agra)"
                  value={farmForm.selected_mandi}
                  onChange={(e) => setFarmForm({ ...farmForm, selected_mandi: e.target.value })}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', width: '140px' }}
                />
              </div>

              <button
                type="button"
                onClick={handleUseCurrentMandiPrice}
                disabled={fetchingMandiPrice}
                className="btn btn-outline"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', backgroundColor: '#ffffff' }}
              >
                <RefreshCw size={13} className={fetchingMandiPrice ? 'spin-icon' : ''} />
                {fetchingMandiPrice ? t('expenses.production.fetchingMandiPrice') : t('expenses.production.useCurrentMandiPrice')}
              </button>

              {mandiPriceNotice && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  backgroundColor: mandiPriceNotice.type === 'success' ? '#ebfbee' : '#fff5f5',
                  color: mandiPriceNotice.type === 'success' ? '#2b8a3e' : '#c92a2a',
                  border: `1px solid ${mandiPriceNotice.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
                }}>
                  {mandiPriceNotice.text}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingDetails}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
            >
              {savingDetails ? t('expenses.farmDetails.saving') : t('expenses.production.saveProduction')}
            </button>
          </form>
        </div>
      </div>

      {/* 5. Profit/Loss & Break-Even Analysis Section */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title">
            <Scale size={20} color="var(--primary)" /> {t('expenses.breakEvenAnalysis.title')}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {t('expenses.breakEvenAnalysis.farmerEntered')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Revenue */}
          <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {m.actual_revenue > 0 ? t('expenses.kpis.actualRevenue') : t('expenses.kpis.expectedRevenue')}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.3rem' }}>
              ₹{formatNumber(m.effective_revenue || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              {m.actual_revenue > 0 ? `${m.actual_production || 0}q sold @ ₹${formatNumber(m.actual_selling_price)}/q` : `${m.expected_production || 0}q yield @ ₹${formatNumber(m.expected_selling_price)}/q`}
            </div>
          </div>

          {/* Total Cost */}
          <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('expenses.kpis.totalCost')}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d9480f', marginTop: '0.3rem' }}>
              ₹{formatNumber(m.total_cost || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              {expenses.length} {t('expenses.kpis.loggedItems')}
            </div>
          </div>

          {/* Profit or Loss */}
          <div style={{
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: m.profit_status === 'profit' ? '#f0fdf4' : m.profit_status === 'loss' ? '#fef2f2' : '#f8fafc',
            border: `1px solid ${m.profit_status === 'profit' ? '#bbf7d0' : m.profit_status === 'loss' ? '#fecaca' : '#e2e8f0'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('expenses.kpis.netProfitLoss')}
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: m.profit_status === 'profit' ? '#15803d' : m.profit_status === 'loss' ? '#b91c1c' : '#475569',
              marginTop: '0.3rem'
            }}>
              {m.profit_loss !== null ? (m.profit_loss >= 0 ? `+₹${formatNumber(m.profit_loss)}` : `-₹${formatNumber(Math.abs(m.profit_loss))}`) : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: m.profit_status === 'profit' ? '#166534' : m.profit_status === 'loss' ? '#991b1b' : '#64748b', marginTop: '0.2rem', fontWeight: 600 }}>
              {m.profit_status === 'profit' ? `🟢 ${t('expenses.kpis.profit')}` : m.profit_status === 'loss' ? `🔴 ${t('expenses.kpis.loss')}` : t('expenses.kpis.pending')}
            </div>
          </div>

          {/* Break-Even Production */}
          <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('expenses.kpis.breakEvenProduction')}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2563eb', marginTop: '0.3rem' }}>
              {m.break_even_production !== null && m.break_even_production !== undefined
                ? `${formatNumber(m.break_even_production)} q`
                : (totalCost > 0 ? `${formatNumber(Math.round((totalCost / 2450) * 10) / 10)} q` : '0 q')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              {t('expenses.kpis.minYieldRequired')}
            </div>
          </div>
        </div>

        {/* Break-Even Transparency Notice */}
        <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: '#fff9db', border: '1px solid #ffe066', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
          <Info size={18} color="#e67700" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
          <div style={{ fontSize: '0.82rem', color: '#495057', lineHeight: '1.5' }}>
            <strong>{t('expenses.breakEvenAnalysis.explanationTitle')}</strong>{' '}
            {t('expenses.breakEvenAnalysis.explanationText', {
              price: `₹${formatNumber(breakEvenVal)}/quintal`,
              cost: formatNumber(totalCost || 0),
              basis: m.production_basis === 'actual' ? t('expenses.breakEvenAnalysis.actualHarvest') : t('expenses.breakEvenAnalysis.expectedYield'),
              prod: formatNumber(m.active_production || effectiveProd || 0)
            })}
          </div>
        </div>
      </div>

      {/* 6. Market Price Comparison & Sell Decision Link */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #2b8a3e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚖️</span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('expenses.mandiComparison.title')}
              </h3>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {t('expenses.mandiComparison.subtitle')}
            </p>
          </div>

          <Link
            to="/sell-decision"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem', padding: '0.45rem 0.9rem' }}
          >
            {t('expenses.mandiComparison.sellAdviceLink')} <ArrowUpRight size={15} />
          </Link>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('expenses.mandiComparison.yourBreakEven')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ₹{formatNumber(breakEvenVal)}{t('prediction.perQ')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('expenses.mandiComparison.currentAgmarknet')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2b8a3e' }}>
                {m.mandi_comparison?.data?.modal_price ? `₹${formatNumber(m.mandi_comparison.data.modal_price)}${t('prediction.perQ')}` : '—'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {m.mandi_comparison?.data?.market} ({m.mandi_comparison?.data?.arrival_date || 'Live'})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('expenses.mandiComparison.spreadDiff')}</div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: (m.mandi_comparison?.difference || 0) >= 0 ? '#15803d' : '#b91c1c'
              }}>
                {m.mandi_comparison?.difference !== null
                  ? `${m.mandi_comparison.difference >= 0 ? '+' : ''}₹${formatNumber(m.mandi_comparison.difference)}${t('prediction.perQ')}`
                  : '—'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>
              {m.mandi_comparison?.message}
            </p>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <em>{t('expenses.mandiComparison.disclaimer')}</em>
            </p>
          </div>
        </div>
      </div>

      {/* 7. Visual Analytics: Donut & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Donut Chart */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div className="card-title" style={{ fontSize: '0.98rem' }}>
              📊 {t('expenses.chart.title')}
            </div>
          </div>
          <ExpenseDonutChart data={m.category_breakdown || []} totalCost={m.total_cost || 0} />
        </div>

        {/* AI Cost-Reduction Advisor */}
        <div className="card" style={{ background: 'linear-gradient(180deg, #fbfdfa 0%, #ffffff 100%)' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <div className="card-title" style={{ fontSize: '0.98rem' }}>
              <Sparkles size={18} color="var(--primary)" /> {t('expenses.aiAdvisor.title')}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {t('expenses.aiAdvisor.subtitle')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
            <button
              onClick={() => handleAskAi(t('expenses.aiAdvisor.q1'))}
              disabled={askingAi}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', textAlign: 'left', padding: '0.5rem 0.85rem' }}
            >
              💡 "{t('expenses.aiAdvisor.q1')}"
            </button>
            <button
              onClick={() => handleAskAi(t('expenses.aiAdvisor.q2'))}
              disabled={askingAi}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', textAlign: 'left', padding: '0.5rem 0.85rem' }}
            >
              🔍 "{t('expenses.aiAdvisor.q2')}"
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder={t('expenses.aiAdvisor.placeholder')}
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            <button
              onClick={() => handleAskAi()}
              disabled={askingAi}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {askingAi ? <RefreshCw size={14} className="spin-icon" /> : t('expenses.aiAdvisor.askButton')}
            </button>
          </div>

          {aiAdvice && (
            <div style={{
              marginTop: '1rem',
              padding: '0.9rem',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              lineHeight: '1.55',
              whiteSpace: 'pre-line',
              color: '#334155'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} /> {t('expenses.aiAdvisor.kissanSaathiAnalysis')}
              </div>
              {aiAdvice}
            </div>
          )}
        </div>
      </div>

      {/* 8. Itemized Expenses Transaction Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('expenses.ledger.title', { count: expenses.length })}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t('expenses.ledger.subtitle', { crop: activeFarm?.crop, season: activeFarm?.season, year: activeFarm?.year })}
            </span>
          </div>

          <button
            onClick={() => {
              setEditingExpense(null);
              setModalDefaultCategory('Seeds');
              setModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem', padding: '0.45rem 0.95rem' }}
          >
            <Plus size={15} /> {t('expenses.categories.addExpense')}
          </button>
        </div>

        {expenses.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Wallet size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('expenses.ledger.noEntriesTitle')}</div>
            <p style={{ fontSize: '0.82rem', margin: '0.35rem auto 1rem auto', maxWidth: '360px' }}>
              {t('expenses.ledger.noEntriesDesc')}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('expenses.ledger.date')}</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('expenses.ledger.category')}</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('expenses.ledger.description')}</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('expenses.ledger.details')}</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>{t('expenses.ledger.amount')}</th>
                  <th style={{ padding: '0.75rem 0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>{t('expenses.ledger.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.9rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {item.date || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        color: '#334155'
                      }}>
                        {t(`expenses.categories.${item.category.toLowerCase()}`, {}, item.category)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', color: '#64748b', fontSize: '0.82rem' }}>
                      {item.quantity ? `${item.quantity} ${item.unit || ''}` : ''}
                      {item.workers ? `${item.workers} workers × ${item.days || 1}d` : ''}
                      {item.equipment ? `${item.equipment}` : ''}
                      {item.description && !item.quantity && !item.workers && !item.equipment ? item.description : ''}
                      {!item.quantity && !item.workers && !item.equipment && !item.description && '—'}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#d9480f' }}>
                      ₹{formatNumber(item.cost || 0)}
                    </td>
                    <td style={{ padding: '0.75rem 0.9rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => {
                          setEditingExpense(item);
                          setModalOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.3rem', marginRight: '0.5rem' }}
                        title="Edit entry"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        style={{ background: 'none', border: 'none', color: '#e03131', cursor: 'pointer', padding: '0.3rem' }}
                        title="Delete entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={4} style={{ padding: '0.85rem 0.9rem', color: 'var(--text-main)' }}>
                    {t('expenses.ledger.totalCostFooter')}
                  </td>
                  <td style={{ padding: '0.85rem 0.9rem', textAlign: 'right', color: '#d9480f', fontSize: '1.05rem' }}>
                    ₹{formatNumber(m.total_cost || 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Expense Modal (Quick Entry / Edit) */}
      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        defaultCategory={modalDefaultCategory}
      />
    </div>
  );
}
