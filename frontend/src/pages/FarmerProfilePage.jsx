import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';
import {
  User,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  CheckCircle,
  AlertCircle,
  Shield,
  Layers,
  Droplets,
  Sprout,
  Navigation,
  Globe
} from 'lucide-react';

export default function FarmerProfilePage() {
  const {
    user,
    profile,
    farms,
    selectedFarm,
    updateProfile,
    addFarm,
    updateFarm,
    deleteFarm,
    selectFarm,
    signOut
  } = useAuth();
  const { states, districts } = useMarket();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [preferredLang, setPreferredLang] = useState(profile?.preferred_language || language || 'en');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Farm Modal State (Add or Edit)
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState(null); // null if adding
  const [farmForm, setFarmForm] = useState({
    farm_name: '',
    area: '',
    area_unit: 'Acre',
    state: 'Uttar Pradesh',
    district: 'Agra',
    village: '',
    pincode: '',
    soil_type: 'Alluvial',
    irrigation_type: 'Tubewell / Borewell',
    latitude: '',
    longitude: '',
    is_primary: false
  });
  const [farmSaving, setFarmSaving] = useState(false);
  const [farmError, setFarmError] = useState(null);

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        preferred_language: preferredLang
      });
      setProfileMsg({ type: 'success', text: t('profile.personal.profileSaved', 'Farmer profile updated successfully!') });
      setIsEditingProfile(false);
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || t('profile.personal.profileSaveError', 'Failed to update profile.') });
    } finally {
      setProfileSaving(false);
    }
  };

  // Open Add Farm Modal
  const openAddFarmModal = () => {
    setEditingFarmId(null);
    setFarmForm({
      farm_name: `Farm ${farms.length + 1}`,
      area: '2',
      area_unit: 'Acre',
      state: 'Uttar Pradesh',
      district: 'Agra',
      village: '',
      pincode: '',
      soil_type: 'Alluvial',
      irrigation_type: 'Tubewell / Borewell',
      latitude: '',
      longitude: '',
      is_primary: farms.length === 0
    });
    setFarmError(null);
    setFarmModalOpen(true);
  };

  // Open Edit Farm Modal
  const openEditFarmModal = (farm) => {
    setEditingFarmId(farm.id);
    setFarmForm({
      farm_name: farm.farm_name || '',
      area: farm.area !== undefined ? String(farm.area) : '',
      area_unit: farm.area_unit || 'Acre',
      state: farm.state || 'Uttar Pradesh',
      district: farm.district || 'Agra',
      village: farm.village || '',
      pincode: farm.pincode || '',
      soil_type: farm.soil_type || 'Alluvial',
      irrigation_type: farm.irrigation_type || 'Tubewell / Borewell',
      latitude: farm.latitude !== undefined && farm.latitude !== null ? String(farm.latitude) : '',
      longitude: farm.longitude !== undefined && farm.longitude !== null ? String(farm.longitude) : '',
      is_primary: !!farm.is_primary
    });
    setFarmError(null);
    setFarmModalOpen(true);
  };

  // Handle Farm Save (Add or Edit)
  const handleSaveFarm = async (e) => {
    e.preventDefault();
    setFarmSaving(true);
    setFarmError(null);

    try {
      const areaNum = parseFloat(farmForm.area);
      if (isNaN(areaNum) || areaNum <= 0) {
        throw new Error('Please enter a valid farm area greater than 0.');
      }

      const payload = {
        farm_name: farmForm.farm_name.trim(),
        area: areaNum,
        area_unit: farmForm.area_unit,
        state: farmForm.state,
        district: farmForm.district.trim(),
        village: farmForm.village.trim() || null,
        pincode: farmForm.pincode.trim() || null,
        soil_type: farmForm.soil_type,
        irrigation_type: farmForm.irrigation_type,
        latitude: farmForm.latitude ? parseFloat(farmForm.latitude) : null,
        longitude: farmForm.longitude ? parseFloat(farmForm.longitude) : null,
        is_primary: farmForm.is_primary
      };

      if (editingFarmId) {
        await updateFarm(editingFarmId, payload);
      } else {
        await addFarm({
          ...payload,
          primary_crop: 'Wheat'
        });
      }
      setFarmModalOpen(false);
    } catch (err) {
      setFarmError(err.message || 'Failed to save farm.');
    } finally {
      setFarmSaving(false);
    }
  };

  // Delete Farm with prompt
  const handleDeleteFarm = async (farmId, name) => {
    if (window.confirm(t('profile.farms.deleteConfirm', `Are you sure you want to delete "${name}"? This will also remove associated crop and expense logs for this farm.`))) {
      try {
        await deleteFarm(farmId);
      } catch (err) {
        alert(t('profile.personal.profileSaveError', 'Could not delete farm: ') + err.message);
      }
    }
  };

  // Use Browser GPS for Farm Coordinates
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFarmForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(4),
          longitude: pos.coords.longitude.toFixed(4)
        }));
      },
      (err) => {
        alert('Unable to retrieve coordinates: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Logout
  const handleLogout = async () => {
    if (window.confirm(t('profile.account.signOutConfirm', 'Are you sure you want to sign out?'))) {
      await signOut();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="farmer-profile-page" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>👤</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              {t('profile.pageTitle', 'Farmer Profile & Farm Management')}
            </h1>
          </div>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('profile.pageSubtitle', 'Manage your personal profile, registered farms, soil parameters, and crop workspaces.')}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderColor: '#ffc9c9', color: '#c92a2a', fontWeight: 600 }}
        >
          <LogOut size={16} /> {t('profile.account.signOut', 'Sign Out')}
        </button>
      </div>

      {/* Global Status Message */}
      {profileMsg && (
        <div style={{
          backgroundColor: profileMsg.type === 'success' ? '#ebfbee' : '#fff5f5',
          border: `1px solid ${profileMsg.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`,
          color: profileMsg.type === 'success' ? '#2b8a3e' : '#c92a2a',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}>
          {profileMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{profileMsg.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* ========================================================================= */}
        {/* 2. Personal Information Card */}
        {/* ========================================================================= */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1.05rem' }}>
              <User size={18} color="var(--primary)" /> {t('profile.personal.title', 'Personal Information')}
            </div>
            {!isEditingProfile && (
              <button
                className="btn btn-outline"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => {
                  setFullName(profile?.full_name || '');
                  setPhone(profile?.phone || '');
                  setPreferredLang(profile?.preferred_language || language || 'en');
                  setIsEditingProfile(true);
                }}
              >
                <Edit2 size={13} /> {t('profile.personal.editBtn', 'Edit')}
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">{t('profile.personal.farmerName', 'Full Name')} *</label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-phone">{t('profile.personal.phone', 'Phone Number')}</label>
                <input
                  id="edit-phone"
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">{t('profile.personal.email', 'Email (Auth Managed)')}</label>
                <input
                  id="edit-email"
                  type="text"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-lang">{t('profile.personal.preferredLang', 'Preferred Language')}</label>
                <select
                  id="edit-lang"
                  className="form-select"
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={profileSaving} style={{ flex: 1 }}>
                  {profileSaving ? t('profile.personal.saving', 'Saving...') : t('profile.personal.saveProfile', 'Save Profile')}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={profileSaving}
                >
                  {t('profile.personal.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('profile.personal.farmerName', 'Farmer Name')}
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  {profile?.full_name || t('profile.personal.farmerBrother', 'Farmer Brother')}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('profile.personal.email', 'Email Address')}
                </span>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  {user?.email || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('profile.personal.phone', 'Phone Number')}
                </span>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  {profile?.phone || t('profile.personal.notRecorded', 'Not recorded')}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('profile.personal.preferredLang', 'Preferred Language')}
                </span>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe size={14} color="var(--primary)" />
                  {profile?.preferred_language === 'hi' ? 'हिंदी (Hindi)' : profile?.preferred_language === 'mr' ? 'मराठी (Marathi)' : 'English'}
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {t('profile.personal.farmerId', 'Farmer ID')}: <code>{user?.id?.substring(0, 16)}...</code>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. Farm Selector & Overview Card */}
        {/* ========================================================================= */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1.05rem' }}>
              <Layers size={18} color="var(--primary)" /> {t('profile.farms.title', 'Active Farm Workspace')}
            </div>
            <span className="card-badge">
              {farms.length} {t('profile.farms.title', 'Farms')}
            </span>
          </div>

          {farms.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="farm-selector">
                  {t('profile.farms.subtitle', 'Current Selected Farm:')}
                </label>
                <select
                  id="farm-selector"
                  className="form-select"
                  value={selectedFarm?.id || ''}
                  onChange={(e) => selectFarm(e.target.value)}
                  style={{ fontWeight: 700, borderColor: 'var(--primary-light)', padding: '0.65rem' }}
                >
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>
                      🌾 {f.farm_name} ({f.area} {f.area_unit}) {f.is_primary ? '• ' + t('profile.farms.activeFarmBadge', 'Primary') : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFarm && (
                <div style={{
                  backgroundColor: '#f7faf7',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>
                        {selectedFarm.farm_name}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {t('profile.farms.area', 'Area')}: <strong>{selectedFarm.area} {selectedFarm.area_unit}</strong>
                      </div>
                    </div>
                    {selectedFarm.is_primary && (
                      <span className="card-badge" style={{ backgroundColor: '#ebfbee', color: '#2b8a3e' }}>
                        {t('profile.farms.activeFarmBadge', 'Primary')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('profile.farms.location', 'Location')}: </span>
                      {selectedFarm.district || selectedFarm.state ? `${selectedFarm.district || ''}, ${selectedFarm.state || ''}` : t('profile.farms.noFarms', 'Not specified')}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('profile.farmModal.village', 'Village')}: </span>
                      {selectedFarm.village || '—'}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('profile.farms.soilType', 'Soil Type')}: </span>
                      {selectedFarm.soil_type || '—'}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('profile.farms.irrigationType', 'Irrigation')}: </span>
                      {selectedFarm.irrigation_type || '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => openEditFarmModal(selectedFarm)}
                    >
                      <Edit2 size={13} /> {t('profile.farms.editFarmBtn', 'Edit This Farm')}
                    </button>
                    {farms.length > 1 && (
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#c92a2a', borderColor: '#ffc9c9' }}
                        onClick={() => handleDeleteFarm(selectedFarm.id, selectedFarm.farm_name)}
                      >
                        <Trash2 size={13} /> {t('profile.farms.deleteFarmBtn', 'Delete')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              <Sprout size={32} style={{ color: 'var(--primary-light)', margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.88rem' }}>{t('profile.farms.noFarms', 'No farms registered yet.')}</p>
              <button className="btn btn-primary" onClick={openAddFarmModal} style={{ marginTop: '0.5rem' }}>
                <Plus size={15} /> {t('profile.farms.addNewFarm', 'Add Your First Farm')}
              </button>
            </div>
          )}

          <div style={{ marginTop: '1.25rem' }}>
            <button
              className="btn btn-primary"
              onClick={openAddFarmModal}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.45rem', padding: '0.65rem' }}
            >
              <Plus size={16} /> {t('profile.farms.addNewFarm', 'Add Another Farm')}
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. All Registered Farms Table / Grid */}
      {/* ========================================================================= */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              🌾 {t('profile.farms.title', 'All Registered Farms')} ({farms.length})
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              {t('profile.farms.subtitle', 'Switch between your fields or update farm-specific soil and irrigation details.')}
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={openAddFarmModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            <Plus size={15} /> {t('profile.farms.addNewFarm', 'New Farm')}
          </button>
        </div>

        {farms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            {t('profile.farms.noFarms', 'No farms recorded. Click "New Farm" to add your field.')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {farms.map((farm) => {
              const isSelected = selectedFarm?.id === farm.id;
              return (
                <div
                  key={farm.id}
                  style={{
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    backgroundColor: isSelected ? '#f7faf7' : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-dark)' }}>
                        {farm.farm_name}
                      </div>
                      {farm.is_primary && (
                        <span className="card-badge" style={{ backgroundColor: '#ebfbee', color: '#2b8a3e', fontSize: '0.7rem' }}>
                          {t('profile.farms.activeFarmBadge', 'Primary')}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.35rem' }}>
                      🌾 {t('profile.farms.area', 'Area')}: <strong>{farm.area} {farm.area_unit}</strong>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      📍 {farm.district || farm.state ? `${farm.district || ''}, ${farm.state || ''}` : t('profile.farms.noFarms', 'Location Not Set')}
                      {farm.village && ` (${farm.village})`}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.4 }}>
                      <div>🌱 {t('profile.farms.soilType', 'Soil')}: {farm.soil_type || 'Standard'}</div>
                      <div>💧 {t('profile.farms.irrigationType', 'Irrigation')}: {farm.irrigation_type || 'Standard'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                        color: isSelected ? '#ffffff' : 'var(--primary)'
                      }}
                      onClick={() => selectFarm(farm.id)}
                    >
                      {isSelected ? '✓ ' + t('profile.farms.activeFarmBadge', 'Active Workspace') : t('profile.farms.setActiveBtn', 'Select Farm')}
                    </button>

                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        onClick={() => openEditFarmModal(farm)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                        title={t('profile.farms.editFarmBtn', 'Edit farm details')}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteFarm(farm.id, farm.farm_name)}
                        style={{ background: 'none', border: 'none', color: '#c92a2a', cursor: 'pointer', padding: '0.3rem' }}
                        title={t('profile.farms.deleteFarmBtn', 'Delete farm')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. Privacy & Security Notice (Section 26) */}
      {/* ========================================================================= */}
      <div style={{
        marginTop: '1.5rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <Shield size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong>{t('landing.transparency.title', 'Privacy & Data Ownership Notice')}:</strong> {t('landing.transparency.subtitle', 'Your information is used to personalize your Kissan Saathi experience and manage your farm records.')}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. Farm Add/Edit Modal */}
      {/* ========================================================================= */}
      {farmModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
                {editingFarmId ? t('profile.farmModal.editTitle', 'Edit Farm Details') : t('profile.farmModal.addTitle', 'Add New Farm')}
              </h2>
              <button
                onClick={() => setFarmModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {farmError && (
              <div style={{
                backgroundColor: '#fff5f5',
                border: '1px solid #ffc9c9',
                color: '#c92a2a',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                marginBottom: '1rem'
              }}>
                {farmError}
              </div>
            )}

            <form onSubmit={handleSaveFarm} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-farm-name">{t('profile.farmModal.farmName', 'Farm Name')} *</label>
                <input
                  id="modal-farm-name"
                  type="text"
                  className="form-input"
                  placeholder={t('profile.farmModal.farmNamePlaceholder', 'e.g. Village West Plot')}
                  value={farmForm.farm_name}
                  onChange={(e) => setFarmForm({ ...farmForm, farm_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-area">{t('profile.farmModal.area', 'Farm Area')} *</label>
                  <input
                    id="modal-area"
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-input"
                    placeholder="e.g. 5"
                    value={farmForm.area}
                    onChange={(e) => setFarmForm({ ...farmForm, area: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-unit">{t('profile.farmModal.areaUnit', 'Area Unit')} *</label>
                  <select
                    id="modal-unit"
                    className="form-select"
                    value={farmForm.area_unit}
                    onChange={(e) => setFarmForm({ ...farmForm, area_unit: e.target.value })}
                  >
                    <option value="Acre">{t('profile.farmModal.units.acre', 'Acre (एकड़)')}</option>
                    <option value="Hectare">{t('profile.farmModal.units.hectare', 'Hectare (हेक्टेयर)')}</option>
                    <option value="Bigha">{t('profile.farmModal.units.bigha', 'Bigha (बीघा)')}</option>
                    <option value="Guntha">{t('profile.farmModal.units.guntha', 'Guntha (गुंठा)')}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-state">{t('profile.farmModal.state', 'State')}</label>
                  <select
                    id="modal-state"
                    className="form-select"
                    value={farmForm.state}
                    onChange={(e) => setFarmForm({ ...farmForm, state: e.target.value })}
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-district">{t('profile.farmModal.district', 'District')}</label>
                  <input
                    id="modal-district"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Agra"
                    value={farmForm.district}
                    onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-village">{t('profile.farmModal.village', 'Village / Locality')}</label>
                  <input
                    id="modal-village"
                    type="text"
                    className="form-input"
                    placeholder={t('profile.farmModal.villagePlaceholder', 'e.g. Fatehpur')}
                    value={farmForm.village}
                    onChange={(e) => setFarmForm({ ...farmForm, village: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-pincode">{t('profile.farmModal.pincode', 'Pincode')}</label>
                  <input
                    id="modal-pincode"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 282001"
                    value={farmForm.pincode}
                    onChange={(e) => setFarmForm({ ...farmForm, pincode: e.target.value })}
                    maxLength={10}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-soil">{t('profile.farmModal.soilType', 'Soil Type')}</label>
                  <select
                    id="modal-soil"
                    className="form-select"
                    value={farmForm.soil_type}
                    onChange={(e) => setFarmForm({ ...farmForm, soil_type: e.target.value })}
                  >
                    <option value="Alluvial">{t('profile.farmModal.soils.alluvial', 'Alluvial (जलोढ़)')}</option>
                    <option value="Black Soil">{t('profile.farmModal.soils.black', 'Black / Regur (काली मिट्टी)')}</option>
                    <option value="Red & Yellow">{t('profile.farmModal.soils.red', 'Red & Yellow (लाल मिट्टी)')}</option>
                    <option value="Sandy Loam">Sandy Loam (बलुई दोमट)</option>
                    <option value="Clayey">{t('profile.farmModal.soils.clay', 'Clayey (मटियार)')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-irrigation">{t('profile.farmModal.irrigationType', 'Irrigation Type')}</label>
                  <select
                    id="modal-irrigation"
                    className="form-select"
                    value={farmForm.irrigation_type}
                    onChange={(e) => setFarmForm({ ...farmForm, irrigation_type: e.target.value })}
                  >
                    <option value="Tubewell / Borewell">{t('profile.farmModal.irrigations.tubewell', 'Tubewell / Borewell')}</option>
                    <option value="Canal">{t('profile.farmModal.irrigations.canal', 'Canal (नहर)')}</option>
                    <option value="Drip Irrigation">{t('profile.farmModal.irrigations.drip', 'Drip / Sprinkler')}</option>
                    <option value="Sprinkler">{t('profile.farmModal.irrigations.drip', 'Sprinkler')}</option>
                    <option value="Rainfed">{t('profile.farmModal.irrigations.rainfed', 'Rainfed (वर्षा आधारित)')}</option>
                  </select>
                </div>
              </div>

              {/* Coordinates with explicit user button */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {t('profile.farmModal.coordsTitle', 'GPS Coordinates (Optional)')}
                  </span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="btn btn-outline"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Navigation size={12} /> {t('profile.farmModal.detectGps', 'Use My Location')}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    placeholder={t('profile.farmModal.latitude', 'Latitude (e.g. 27.1767)')}
                    value={farmForm.latitude}
                    onChange={(e) => setFarmForm({ ...farmForm, latitude: e.target.value })}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    placeholder={t('profile.farmModal.longitude', 'Longitude (e.g. 78.0081)')}
                    value={farmForm.longitude}
                    onChange={(e) => setFarmForm({ ...farmForm, longitude: e.target.value })}
                  />
                </div>
              </div>

              {/* Primary Farm Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  id="modal-primary"
                  type="checkbox"
                  checked={farmForm.is_primary}
                  onChange={(e) => setFarmForm({ ...farmForm, is_primary: e.target.checked })}
                />
                <label htmlFor="modal-primary" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  {t('profile.farmModal.coordsDesc', 'Set as primary / default farm')}
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={farmSaving} style={{ flex: 1 }}>
                  {farmSaving ? t('profile.farmModal.savingFarm', 'Saving...') : (editingFarmId ? t('profile.farmModal.saveFarm', 'Save Changes') : t('profile.farmModal.saveFarm', 'Create Farm'))}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setFarmModalOpen(false)}
                  disabled={farmSaving}
                >
                  {t('profile.farmModal.cancel', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

