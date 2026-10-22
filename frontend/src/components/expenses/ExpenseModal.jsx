import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';

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

export default function ExpenseModal({ isOpen, onClose, onSave, initialData = null, defaultCategory = 'Seeds' }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState(defaultCategory);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Optional category details
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [workers, setWorkers] = useState('');
  const [days, setDays] = useState('');
  const [equipment, setEquipment] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || 'Seeds');
      setName(initialData.name || '');
      setCost(initialData.cost ? initialData.cost.toString() : '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setQuantity(initialData.quantity ? initialData.quantity.toString() : '');
      setUnit(initialData.unit || '');
      setWorkers(initialData.workers ? initialData.workers.toString() : '');
      setDays(initialData.days ? initialData.days.toString() : '');
      setEquipment(initialData.equipment || '');
      setDescription(initialData.description || '');
      setShowAdvanced(Boolean(initialData.quantity || initialData.workers || initialData.equipment || initialData.description));
    } else {
      setCategory(defaultCategory);
      setName('');
      setCost('');
      setDate(new Date().toISOString().split('T')[0]);
      setQuantity('');
      setUnit('');
      setWorkers('');
      setDays('');
      setEquipment('');
      setDescription('');
      setShowAdvanced(false);
    }
    setErrorMsg(null);
  }, [initialData, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setErrorMsg(t('expenses.modal.fillRequired'));
      return;
    }

    const payload = {
      category,
      name: name.trim() || category,
      cost: parsedCost,
      date,
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit.trim() || null,
      workers: workers ? parseInt(workers, 10) : null,
      days: days ? parseInt(days, 10) : null,
      equipment: equipment.trim() || null,
      description: description.trim() || null
    };

    onSave(payload);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1100,
      backdropFilter: 'blur(3px)'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#e8f5e9', color: '#2b8a3e', display: 'flex' }}>
              {initialData ? <Edit2 size={18} /> : <Plus size={18} />}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {initialData ? t('expenses.modal.editTitle') : t('expenses.modal.addTitle')}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.3rem', display: 'flex' }} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.65rem 0.9rem', borderRadius: '6px', backgroundColor: '#fff5f5', color: '#e03131', border: '1px solid #ffc9c9', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Category Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {t('expenses.modal.category')} <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.92rem',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)'
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {t(`expenses.categories.${cat.id.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input (Primary) */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {t('expenses.modal.amount')} <span style={{ color: 'red' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#475569', fontSize: '1.1rem' }}>
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="e.g. 4500"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem 0.65rem 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Item Description / Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {t('expenses.modal.itemName')}
            </label>
            <input
              type="text"
              placeholder={category === 'Seeds' ? 'e.g. Certified Seed Wheat (HD-2967)' : category === 'Fertilizer' ? 'e.g. DAP 2 bags + Urea' : category === 'Labour' ? 'e.g. Field sowing & weeding' : 'e.g. Expense details'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Date Picker */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {t('expenses.modal.date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Toggle Optional Fields */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              {showAdvanced ? t('expenses.modal.hideDetails') : t('expenses.modal.showDetails')}
            </button>
          </div>

          {/* Advanced / Category Specific Fields */}
          {showAdvanced && (
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              {(category === 'Seeds' || category === 'Fertilizer' || category === 'Fuel' || category === 'Pesticides') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('expenses.modal.quantity')}</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 50"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('expenses.modal.unit')}</label>
                    <input
                      type="text"
                      placeholder={t('expenses.modal.unitPlaceholder')}
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {category === 'Labour' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('expenses.modal.workers')}</label>
                    <input
                      type="number"
                      placeholder="e.g. 6"
                      value={workers}
                      onChange={(e) => setWorkers(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('expenses.modal.days')}</label>
                    <input
                      type="number"
                      placeholder="e.g. 4"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {category === 'Machinery' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('expenses.modal.equipment')}</label>
                  <input
                    type="text"
                    placeholder={t('expenses.modal.equipmentPlaceholder')}
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('expenses.modal.notes')}</label>
                <textarea
                  rows="2"
                  placeholder={t('expenses.modal.notesPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
            >
              {t('expenses.modal.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.4rem', fontSize: '0.88rem' }}
            >
              <Check size={16} /> {t('expenses.modal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
