import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { changeLanguage, setLanguage } = useTranslation();
  const updateLang = changeLanguage || setLanguage;

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile, preferences, and farms for authenticated user
  const loadUserData = useCallback(async (userId, userEmail = null) => {
    if (!userId) return;

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        if (profileData.preferred_language && typeof updateLang === 'function') {
          updateLang(profileData.preferred_language);
        }
      } else if (!profileErr && userEmail) {
        // Fallback profile if trigger hasn't run
        const fallbackProfile = {
          user_id: userId,
          email: userEmail,
          full_name: userEmail.split('@')[0],
          preferred_language: 'en'
        };
        setProfile(fallbackProfile);
      }

      // 2. Fetch Preferences
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefData) {
        setPreferences(prefData);
        if (prefData.language && typeof updateLang === 'function') {
          updateLang(prefData.language);
        }
      }

      // 3. Fetch Farms
      const { data: farmsData, error: farmsErr } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (farmsData && farmsData.length > 0) {
        setFarms(farmsData);
        setSelectedFarm(prev => {
          if (prev && farmsData.some(f => f.id === prev.id)) {
            return farmsData.find(f => f.id === prev.id);
          }
          return farmsData.find(f => f.is_primary) || farmsData[0];
        });
      } else {
        setFarms([]);
        setSelectedFarm(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Error loading user data:', err);
    }
  }, [setLanguage]);

  // Listen to Auth State Changes
  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email);
      }
      setLoading(false);
    }).catch(err => {
      console.warn('[AuthContext] GetSession error:', err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        await loadUserData(currentUser.id, currentUser.email);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setFarms([]);
        setSelectedFarm(null);
        setPreferences(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  // Sign Up with Email & Password
  const signUp = async ({ email, password, fullName, phone, preferredLanguage = 'en' }) => {
    // 1. Try backend instant-confirm registration first for smooth user onboarding experience
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone, preferredLanguage })
      });
      const resJson = await resp.json();
      if (resJson.success) {
        // Automatically sign in the newly verified farmer
        return await signIn({ email, password });
      } else if (resJson.error && resJson.error.includes('already')) {
        throw new Error('An account with this email already exists. Please log in.');
      } else if (resJson.error) {
        throw new Error(resJson.error);
      }
    } catch (e) {
      if (e.message && !e.message.includes('Failed to fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
    }

    // 2. Fallback to direct client-side Supabase registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          preferred_language: preferredLanguage
        }
      }
    });

    if (error) throw error;
    return data;
  };

  // Sign In with Email & Password
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setFarms([]);
    setSelectedFarm(null);
    setPreferences(null);
  };

  // Password Reset Request
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
    return data;
  };

  // Update Password (authenticated or via reset token)
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  };

  // Update Profile details
  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');

    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    setProfile(prev => ({ ...prev, ...updates }));

    if (updates.preferred_language) {
      setLanguage(updates.preferred_language);
      await updatePreferences({ language: updates.preferred_language });
    }
    return data;
  };

  // Update Preferences
  const updatePreferences = async (updates) => {
    if (!user) return;

    try {
      const payload = {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (!error && data) {
        setPreferences(data);
      }
    } catch (err) {
      console.warn('Preferences update error:', err);
    }
  };

  // Add New Farm
  const addFarm = async (farmData) => {
    if (!user) throw new Error('Not authenticated');

    const isFirst = farms.length === 0;
    const payload = {
      user_id: user.id,
      farm_name: farmData.farm_name,
      area: parseFloat(farmData.area),
      area_unit: farmData.area_unit || 'Acre',
      state: farmData.state || '',
      district: farmData.district || '',
      village: farmData.village || '',
      pincode: farmData.pincode || '',
      latitude: farmData.latitude ? parseFloat(farmData.latitude) : null,
      longitude: farmData.longitude ? parseFloat(farmData.longitude) : null,
      soil_type: farmData.soil_type || '',
      irrigation_type: farmData.irrigation_type || '',
      is_primary: farmData.is_primary || isFirst
    };

    const { data, error } = await supabase
      .from('farms')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    const updatedFarms = [...farms, data];
    setFarms(updatedFarms);
    if (data.is_primary || isFirst || !selectedFarm) {
      setSelectedFarm(data);
    }
    return data;
  };

  // Update Existing Farm
  const updateFarm = async (farmId, farmData) => {
    if (!user) throw new Error('Not authenticated');

    const payload = {
      ...farmData,
      area: farmData.area ? parseFloat(farmData.area) : undefined,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('farms')
      .update(payload)
      .eq('id', farmId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const updatedFarms = farms.map(f => f.id === farmId ? data : f);
    setFarms(updatedFarms);
    if (selectedFarm?.id === farmId) {
      setSelectedFarm(data);
    }
    return data;
  };

  // Delete Farm
  const deleteFarm = async (farmId) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', farmId)
      .eq('user_id', user.id);

    if (error) throw error;

    const remaining = farms.filter(f => f.id !== farmId);
    setFarms(remaining);
    if (selectedFarm?.id === farmId) {
      setSelectedFarm(remaining[0] || null);
    }
    return true;
  };

  // Switch Active Selected Farm
  const selectFarm = (farmId) => {
    const found = farms.find(f => f.id === farmId);
    if (found) setSelectedFarm(found);
  };

  // Refresh User Data manually
  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        farms,
        selectedFarm,
        preferences,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        updatePreferences,
        addFarm,
        updateFarm,
        deleteFarm,
        selectFarm,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
