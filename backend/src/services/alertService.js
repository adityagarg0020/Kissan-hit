const supabaseAdmin = require('../lib/supabaseAdmin');

class AlertService {
  constructor() {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    this.memoryAlerts = [
      {
        id: 'alert-1',
        commodity: 'Wheat',
        state: 'Uttar Pradesh',
        market: 'Agra',
        alert_type: 'above',
        target_price: 2500,
        current_price: 2450,
        status: 'Active',
        created_at: todayStr
      },
      {
        id: 'alert-2',
        commodity: 'Tomato',
        state: 'Maharashtra',
        market: 'Pune',
        alert_type: 'movement',
        threshold_pct: 10,
        current_price: 2100,
        status: 'Triggered',
        message: 'Price moved +14.2% over the last 2 recorded market days.',
        created_at: yesterdayStr
      }
    ];
  }

  async getAlerts(userId = null) {
    if (userId) {
      try {
        const { data, error } = await supabaseAdmin
          .from('price_alerts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(d => ({
            id: d.id,
            commodity: d.crop,
            state: d.state,
            market: d.mandi,
            alert_type: d.condition_type,
            target_price: d.threshold_price,
            threshold_pct: d.threshold_pct,
            current_price: d.current_price,
            status: d.is_active ? 'Active' : 'Inactive',
            message: d.message,
            created_at: d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          }));
        }
      } catch (err) {
        console.warn('[AlertService] Supabase query fallback:', err.message);
      }
    }
    return this.memoryAlerts;
  }

  async createAlert({ commodity, state, market, alert_type, target_price, threshold_pct, current_price, user_id }) {
    let resolvedPrice = current_price ? parseFloat(current_price) : null;
    if (!resolvedPrice && commodity) {
      try {
        const dataService = require('./dataService');
        const details = dataService.getCurrentPriceDetails({
          commodity,
          state: state && state !== 'All India' ? state : null,
          market: market && market !== 'Any' ? market : null
        });
        if (details && details.modal_price) {
          resolvedPrice = details.modal_price;
        }
      } catch (e) {
        // ignore lookup error
      }
    }

    if (user_id) {
      try {
        const payload = {
          user_id,
          crop: commodity || 'Wheat',
          state: state || 'All India',
          district: state && state !== 'All India' ? state : '',
          mandi: market || 'Any',
          condition_type: alert_type || 'above',
          threshold_price: target_price ? parseFloat(target_price) : null,
          threshold_pct: threshold_pct ? parseFloat(threshold_pct) : 5,
          current_price: resolvedPrice,
          is_active: true
        };

        const { data, error } = await supabaseAdmin
          .from('price_alerts')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            commodity: data.crop,
            state: data.state,
            market: data.mandi,
            alert_type: data.condition_type,
            target_price: data.threshold_price,
            threshold_pct: data.threshold_pct,
            current_price: data.current_price,
            status: 'Active',
            created_at: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          };
        }
      } catch (err) {
        console.warn('[AlertService] Supabase insert fallback:', err.message);
      }
    }

    const newAlert = {
      id: `alert-${Date.now()}`,
      commodity: commodity || 'Wheat',
      state: state || 'All India',
      market: market || 'Any',
      alert_type: alert_type || 'above',
      target_price: target_price ? parseFloat(target_price) : null,
      threshold_pct: threshold_pct ? parseFloat(threshold_pct) : 5,
      current_price: resolvedPrice,
      status: 'Active',
      created_at: new Date().toISOString().split('T')[0]
    };
    this.memoryAlerts.unshift(newAlert);
    return newAlert;
  }

  async deleteAlert(alertId, userId = null) {
    if (userId) {
      try {
        const { error } = await supabaseAdmin
          .from('price_alerts')
          .delete()
          .eq('id', alertId)
          .eq('user_id', userId);

        if (!error) {
          return { success: true };
        }
      } catch (err) {
        console.warn('[AlertService] Supabase delete fallback:', err.message);
      }
    }

    this.memoryAlerts = this.memoryAlerts.filter(a => a.id !== alertId);
    return { success: true, remaining: this.memoryAlerts.length };
  }
}

module.exports = new AlertService();
