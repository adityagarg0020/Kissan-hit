const fs = require('fs');
const path = require('path');
const dataService = require('./dataService');

const DATA_FILE = path.resolve(__dirname, '../../../Data/user_expenses.json');

// Standard unit conversions to Acre
const AREA_CONVERSIONS_TO_ACRE = {
  'Acre': 1.0,
  'Hectare': 2.47105,
  'Bigha': 0.625 // Standard North Indian Pucca Bigha (5/8 acre)
};

const PREDEFINED_CATEGORIES = [
  'Seeds',
  'Fertilizer',
  'Pesticides',
  'Labour',
  'Machinery',
  'Irrigation',
  'Fuel',
  'Transportation',
  'Storage',
  'Packaging',
  'Other'
];

// Standard Indian agricultural yields (in Quintals per Acre) and average selling benchmarks
const CROP_BENCHMARK_YIELDS = {
  'Wheat': 18,
  'Paddy': 22,
  'Rice': 22,
  'Cotton': 10,
  'Mustard': 8,
  'Soybean': 10,
  'Maize': 24,
  'Gram': 8,
  'Chana': 8,
  'Potato': 100,
  'Onion': 80,
  'Sugarcane': 350,
  'Tomato': 120,
  'Groundnut': 12,
  'Bajra': 12,
  'Jowar': 10,
  'Barley': 14
};

const CROP_BENCHMARK_PRICES = {
  'Wheat': 2450,
  'Paddy': 2300,
  'Rice': 2800,
  'Cotton': 7120,
  'Mustard': 5450,
  'Soybean': 4600,
  'Maize': 2225,
  'Gram': 5440,
  'Chana': 5440,
  'Potato': 1250,
  'Onion': 1750,
  'Sugarcane': 340,
  'Tomato': 1800,
  'Groundnut': 6375,
  'Bajra': 2500,
  'Jowar': 3180,
  'Barley': 1850
};

class ExpenseService {
  constructor() {
    this.farms = [];
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.farms = Array.isArray(parsed.farms) ? parsed.farms : [];
      } else {
        // Initial sample prototype season for farmers
        this.farms = [
          {
            id: 'farm-wheat-2026',
            farm_name: 'Main Village Farm',
            crop: 'Wheat',
            variety: 'HD-2967',
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
            selling_date: '2026-10-22',
            selected_mandi: 'Agra',
            selected_state: 'Uttar Pradesh',
            expenses: [
              { id: 'exp-1', category: 'Seeds', name: 'Certified Wheat Seeds (HD-2967)', quantity: 80, unit: 'kg', cost: 4500, date: '2026-04-10' },
              { id: 'exp-2', category: 'Fertilizer', name: 'DAP & Urea Fertilizer Bags', quantity: 4, unit: 'bags', cost: 8200, date: '2026-05-12' },
              { id: 'exp-3', category: 'Labour', name: 'Field Sowing, Weeding & Harvesting', workers: 8, days: 5, cost: 12000, date: '2026-06-01' },
              { id: 'exp-4', category: 'Irrigation', name: 'Tubewell Electricity & Water Runs', cost: 3500, date: '2026-06-20' },
              { id: 'exp-5', category: 'Machinery', name: 'Tractor Plowing & Rotavator', equipment: 'Tractor', cost: 5000, date: '2026-04-05' },
              { id: 'exp-6', category: 'Transportation', name: 'Trolley Freight to APMC Mandi', cost: 2000, date: '2026-10-22' },
              { id: 'exp-7', category: 'Other', name: 'Jute Bags, Twine & Handling', cost: 1000, date: '2026-10-22' }
            ],
            created_at: '2026-04-01T10:00:00.000Z',
            updated_at: '2026-10-22T10:00:00.000Z'
          }
        ];
        this.saveData();
      }
    } catch (err) {
      console.error('[ExpenseService] Error loading user_expenses.json:', err);
      this.farms = [];
    }
  }

  saveData() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify({ farms: this.farms }, null, 2), 'utf8');
    } catch (err) {
      console.error('[ExpenseService] Error saving user_expenses.json:', err);
    }
  }

  // Calculate comprehensive farm metrics
  calculateMetrics(farm) {
    if (!farm) return null;

    const expenses = Array.isArray(farm.expenses) ? farm.expenses : [];
    const totalCost = expenses.reduce((sum, exp) => sum + (parseFloat(exp.cost) || 0), 0);

    // Area Normalization
    const areaUnit = farm.area_unit || 'Acre';
    const areaVal = parseFloat(farm.area) || 0;
    const toAcreFactor = AREA_CONVERSIONS_TO_ACRE[areaUnit] || 1.0;
    const normalizedAcres = areaVal > 0 ? areaVal * toAcreFactor : 0;

    const costPerAcre = normalizedAcres > 0 ? Math.round(totalCost / normalizedAcres) : null;
    const costPerHectare = normalizedAcres > 0 ? Math.round(totalCost / (normalizedAcres / 2.47105)) : null;
    const costPerBigha = normalizedAcres > 0 ? Math.round(totalCost / (normalizedAcres / 0.625)) : null;

    // Production & Cost per Quintal
    const actualProd = parseFloat(farm.actual_production) || 0;
    const expectedProd = parseFloat(farm.expected_production) || 0;
    const prodUnit = farm.production_unit || 'Quintal';

    // Standard benchmark yield based on crop & area
    const benchmarkYieldPerAcre = CROP_BENCHMARK_YIELDS[farm.crop] || CROP_BENCHMARK_YIELDS['Wheat'] || 18;
    const benchmarkProd = Math.max(1, Math.round(benchmarkYieldPerAcre * (normalizedAcres > 0 ? normalizedAcres : 1)));

    let activeProd = 0;
    let prodBasis = 'benchmark';

    if (actualProd > 0) {
      activeProd = actualProd;
      prodBasis = 'actual';
    } else if (expectedProd > 0) {
      activeProd = expectedProd;
      prodBasis = 'expected';
    } else {
      activeProd = benchmarkProd;
      prodBasis = 'benchmark';
    }

    const costPerQuintal = activeProd > 0 ? Math.round(totalCost / activeProd) : 0;
    const breakEvenPrice = activeProd > 0 ? Math.round(totalCost / activeProd) : 0;

    // Selling Details & Revenue
    const expSellPrice = parseFloat(farm.expected_selling_price) || 0;
    const actSellPrice = parseFloat(farm.actual_selling_price) || 0;
    const qtySold = parseFloat(farm.quantity_sold) || 0;

    const benchmarkPrice = CROP_BENCHMARK_PRICES[farm.crop] || 2450;
    const effectiveSellPrice = actSellPrice > 0 ? actSellPrice : (expSellPrice > 0 ? expSellPrice : benchmarkPrice);
    const breakEvenProduction = effectiveSellPrice > 0 ? Math.round((totalCost / effectiveSellPrice) * 10) / 10 : 0;

    const estimatedRevenue = (expectedProd > 0 && expSellPrice > 0) ? Math.round(expectedProd * expSellPrice) : 0;
    const actualRevenue = (qtySold > 0 && actSellPrice > 0) ? Math.round(qtySold * actSellPrice) : 0;
    const effectiveRevenue = actualRevenue > 0 ? actualRevenue : estimatedRevenue;

    const profitLoss = (effectiveRevenue > 0 && totalCost > 0) ? effectiveRevenue - totalCost : null;
    const profitStatus = profitLoss !== null
      ? (profitLoss > 0 ? 'profit' : (profitLoss < 0 ? 'loss' : 'breakeven'))
      : 'pending';

    // Category Breakdown
    const categoryTotals = {};
    for (const cat of PREDEFINED_CATEGORIES) {
      categoryTotals[cat] = 0;
    }
    for (const exp of expenses) {
      const cat = exp.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (parseFloat(exp.cost) || 0);
    }

    const categoryBreakdown = Object.entries(categoryTotals)
      .filter(([_, cost]) => cost > 0)
      .map(([category, cost]) => ({
        category,
        cost,
        percentage: totalCost > 0 ? Math.round((cost / totalCost) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.cost - a.cost);

    // Current Mandi Market Price Comparison
    let mandiPriceDetails = null;
    let marketDiff = null;
    let mandiPriceAvailable = false;

    if (farm.crop) {
      try {
        const details = dataService.getCurrentPriceDetails({
          commodity: farm.crop,
          state: farm.selected_state && farm.selected_state !== 'All India' ? farm.selected_state : null,
          market: farm.selected_mandi && farm.selected_mandi !== 'Any' ? farm.selected_mandi : null
        });

        if (details && details.modal_price > 0) {
          mandiPriceAvailable = true;
          const modalP = details.modal_price;
          mandiPriceDetails = {
            commodity: details.commodity,
            modal_price: modalP,
            market: details.market || farm.selected_mandi || 'State Mandis',
            state: details.state || farm.selected_state || 'Agmarknet',
            arrival_date: details.arrival_date || new Date().toISOString().split('T')[0],
            source: 'Live Data.gov.in Agmarknet API'
          };

          if (breakEvenPrice !== null && breakEvenPrice > 0) {
            marketDiff = modalP - breakEvenPrice;
          }
        }
      } catch (err) {
        console.warn('[ExpenseService] Mandi price lookup error:', err.message);
      }
    }

    return {
      farm_id: farm.id,
      farm_name: farm.farm_name,
      crop: farm.crop,
      season: farm.season,
      year: farm.year,
      area: areaVal,
      area_unit: areaUnit,
      normalized_acres: normalizedAcres,
      production_unit: prodUnit,
      expected_production: expectedProd,
      actual_production: actualProd,
      active_production: activeProd,
      production_basis: prodBasis,
      total_cost: totalCost,
      cost_per_acre: costPerAcre,
      cost_per_hectare: costPerHectare,
      cost_per_bigha: costPerBigha,
      cost_per_quintal: costPerQuintal,
      break_even_price: breakEvenPrice,
      break_even_production: breakEvenProduction,
      expected_selling_price: expSellPrice,
      actual_selling_price: actSellPrice,
      estimated_revenue: estimatedRevenue,
      actual_revenue: actualRevenue,
      effective_revenue: effectiveRevenue,
      profit_loss: profitLoss,
      profit_status: profitStatus,
      category_breakdown: categoryBreakdown,
      mandi_comparison: {
        available: mandiPriceAvailable,
        data: mandiPriceDetails,
        break_even_price: breakEvenPrice,
        difference: marketDiff,
        message: mandiPriceAvailable
          ? (marketDiff !== null
              ? (marketDiff >= 0
                  ? `The current Agmarknet market price is ₹${marketDiff}/quintal above your recorded break-even price.`
                  : `The current Agmarknet market price is ₹${Math.abs(marketDiff)}/quintal below your recorded break-even price.`)
              : 'Market price retrieved, but break-even cannot be calculated until production is entered.')
          : 'No current market price is available for the selected crop and market.'
      }
    };
  }

  // List all recorded farms/seasons with summary
  getAllFarms(userId = null) {
    let list = this.farms;
    if (userId) {
      const userSpecific = this.farms.filter(f => f.user_id === userId);
      // If user has specific farms, return those; if none yet, return all available prototype records
      if (userSpecific.length > 0) {
        list = userSpecific;
      }
    }
    return list.map(farm => {
      const metrics = this.calculateMetrics(farm);
      return {
        id: farm.id,
        farm_name: farm.farm_name || 'My Farm',
        crop: farm.crop,
        variety: farm.variety || '',
        season: farm.season,
        year: farm.year,
        area: farm.area,
        area_unit: farm.area_unit,
        expenses_count: (farm.expenses || []).length,
        total_cost: metrics.total_cost,
        break_even_price: metrics.break_even_price,
        profit_loss: metrics.profit_loss,
        profit_status: metrics.profit_status
      };
    });
  }

  // Get full farm details with metrics
  getFarmById(id) {
    const farm = this.farms.find(f => f.id === id);
    if (!farm) return null;
    const metrics = this.calculateMetrics(farm);
    return { ...farm, metrics, calculations: metrics };
  }

  // Create new farm season
  createFarm(data, userId = null) {
    const areaVal = parseFloat(data.area !== undefined ? data.area : data.land_area);
    const expProd = parseFloat(data.expected_production !== undefined ? data.expected_production : data.estimated_production);
    const expSellPrice = parseFloat(data.expected_selling_price);
    const cropName = (data.crop || 'Wheat').trim();
    const normalizedArea = areaVal > 0 ? areaVal : 1;
    const defaultYield = (CROP_BENCHMARK_YIELDS[cropName] || 18) * normalizedArea;
    const defaultPrice = CROP_BENCHMARK_PRICES[cropName] || 2450;

    const newFarm = {
      id: `farm-${Date.now()}`,
      user_id: userId || data.user_id || null,
      farm_name: (data.farm_name || `${cropName} Field`).trim(),
      crop: cropName,
      variety: (data.variety || '').trim(),
      season: data.season || 'Rabi',
      year: parseInt(data.year, 10) || 2026,
      area: normalizedArea,
      area_unit: data.area_unit || data.land_unit || 'Acre',
      expected_production: expProd > 0 ? expProd : defaultYield,
      actual_production: parseFloat(data.actual_production) || 0,
      production_unit: data.production_unit || 'Quintal',
      expected_selling_price: expSellPrice > 0 ? expSellPrice : defaultPrice,
      actual_selling_price: parseFloat(data.actual_selling_price) || 0,
      quantity_sold: parseFloat(data.quantity_sold) || 0,
      selling_date: data.selling_date || new Date().toISOString().split('T')[0],
      selected_mandi: data.selected_mandi || 'Agra',
      selected_state: data.selected_state || 'Uttar Pradesh',
      expenses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.farms.unshift(newFarm);
    this.saveData();
    return this.getFarmById(newFarm.id);
  }

  // Update farm details
  updateFarm(id, data) {
    const farm = this.farms.find(f => f.id === id);
    if (!farm) return null;

    if (data.farm_name !== undefined) farm.farm_name = String(data.farm_name).trim();
    if (data.crop !== undefined) farm.crop = String(data.crop).trim();
    if (data.variety !== undefined) farm.variety = String(data.variety).trim();
    if (data.season !== undefined) farm.season = String(data.season);
    if (data.year !== undefined) farm.year = parseInt(data.year, 10) || farm.year;
    if (data.area !== undefined || data.land_area !== undefined) {
      const a = parseFloat(data.area !== undefined ? data.area : data.land_area);
      if (a >= 0) farm.area = a;
    }
    if (data.area_unit !== undefined || data.land_unit !== undefined) {
      farm.area_unit = String(data.area_unit || data.land_unit);
    }
    if (data.expected_production !== undefined || data.estimated_production !== undefined) {
      farm.expected_production = Math.max(0, parseFloat(data.expected_production !== undefined ? data.expected_production : data.estimated_production) || 0);
    }
    if (data.actual_production !== undefined) farm.actual_production = Math.max(0, parseFloat(data.actual_production) || 0);
    if (data.production_unit !== undefined) farm.production_unit = String(data.production_unit);
    if (data.expected_selling_price !== undefined) farm.expected_selling_price = Math.max(0, parseFloat(data.expected_selling_price) || 0);
    if (data.actual_selling_price !== undefined) farm.actual_selling_price = Math.max(0, parseFloat(data.actual_selling_price) || 0);
    if (data.quantity_sold !== undefined) farm.quantity_sold = Math.max(0, parseFloat(data.quantity_sold) || 0);
    if (data.selling_date !== undefined) farm.selling_date = String(data.selling_date);
    if (data.selected_mandi !== undefined) farm.selected_mandi = String(data.selected_mandi);
    if (data.selected_state !== undefined) farm.selected_state = String(data.selected_state);

    farm.updated_at = new Date().toISOString();
    this.saveData();
    return this.getFarmById(id);
  }

  // Delete farm season
  deleteFarm(id) {
    const idx = this.farms.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.farms.splice(idx, 1);
    this.saveData();
    return true;
  }

  // Add individual expense item
  addExpense(farmId, data) {
    const farm = this.farms.find(f => f.id === farmId);
    if (!farm) return null;

    const rawCost = data.cost !== undefined ? data.cost : data.amount;
    const cost = parseFloat(rawCost);
    if (isNaN(cost) || cost <= 0) {
      throw new Error('Expense amount must be a valid number greater than 0.');
    }

    const expenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: data.category || 'Other',
      name: (data.name || data.item_name || data.category || 'Expense').trim(),
      cost: cost,
      date: data.date || new Date().toISOString().split('T')[0],
      quantity: data.quantity ? parseFloat(data.quantity) : null,
      unit: data.unit ? String(data.unit).trim() : null,
      workers: data.workers ? parseInt(data.workers, 10) : null,
      days: data.days ? parseInt(data.days, 10) : null,
      equipment: data.equipment ? String(data.equipment).trim() : null,
      description: (data.description || data.notes) ? String(data.description || data.notes).trim() : null
    };

    if (!Array.isArray(farm.expenses)) farm.expenses = [];
    farm.expenses.push(expenseItem);
    farm.updated_at = new Date().toISOString();
    this.saveData();

    const metrics = this.calculateMetrics(farm);
    return {
      expense: expenseItem,
      metrics,
      calculations: metrics,
      farm: this.getFarmById(farmId)
    };
  }

  // Edit individual expense item
  updateExpense(farmId, expenseId, data) {
    const farm = this.farms.find(f => f.id === farmId);
    if (!farm) return null;

    const expense = (farm.expenses || []).find(e => e.id === expenseId);
    if (!expense) return null;

    if (data.category !== undefined) expense.category = String(data.category);
    if (data.name !== undefined || data.item_name !== undefined) {
      expense.name = String(data.name || data.item_name).trim();
    }
    const rawCost = data.cost !== undefined ? data.cost : data.amount;
    if (rawCost !== undefined) {
      const cost = parseFloat(rawCost);
      if (isNaN(cost) || cost <= 0) {
        throw new Error('Expense amount must be greater than 0.');
      }
      expense.cost = cost;
    }

    if (data.date !== undefined) expense.date = data.date;
    if (data.quantity !== undefined) expense.quantity = parseFloat(data.quantity) || null;
    if (data.unit !== undefined) expense.unit = String(data.unit).trim();
    if (data.workers !== undefined) expense.workers = parseInt(data.workers, 10) || null;
    if (data.days !== undefined) expense.days = parseInt(data.days, 10) || null;
    if (data.equipment !== undefined) expense.equipment = String(data.equipment).trim();
    if (data.description !== undefined || data.notes !== undefined) {
      expense.description = String(data.description || data.notes).trim();
    }

    farm.updated_at = new Date().toISOString();
    this.saveData();

    const metrics = this.calculateMetrics(farm);
    return {
      expense,
      metrics,
      calculations: metrics,
      farm: this.getFarmById(farmId)
    };
  }

  // Delete individual expense item
  deleteExpense(farmId, expenseId) {
    const farm = this.farms.find(f => f.id === farmId);
    if (!farm) return false;

    const idx = (farm.expenses || []).findIndex(e => e.id === expenseId);
    if (idx === -1) return false;

    farm.expenses.splice(idx, 1);
    farm.updated_at = new Date().toISOString();
    this.saveData();

    return {
      success: true,
      metrics: this.calculateMetrics(farm)
    };
  }

  // Quick summary of active season for Dashboard and Sell Decision
  getActiveSummary(crop = null) {
    let farm = null;
    if (crop) {
      farm = this.farms.find(f => f.crop.toLowerCase() === crop.toLowerCase());
    }
    if (!farm && this.farms.length > 0) {
      farm = this.farms[0];
    }
    if (!farm) {
      return {
        has_records: false,
        message: 'No farm expense records logged yet.'
      };
    }

    const metrics = this.calculateMetrics(farm);
    return {
      has_records: true,
      farm_id: farm.id,
      farm_name: farm.farm_name,
      crop: farm.crop,
      variety: farm.variety,
      season: farm.season,
      year: farm.year,
      total_cost: metrics.total_cost,
      break_even_price: metrics.break_even_price,
      cost_per_acre: metrics.cost_per_acre,
      active_production: metrics.active_production,
      production_unit: metrics.production_unit,
      profit_loss: metrics.profit_loss,
      profit_status: metrics.profit_status
    };
  }
}

module.exports = new ExpenseService();
