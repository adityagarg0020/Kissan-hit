const express = require('express');
const router = express.Router();
const expenseService = require('../services/expenseService');
const chatService = require('../services/chatService');
const { optionalAuth } = require('../middleware/authMiddleware');

router.use(optionalAuth);

// 1. List all recorded farm seasons
router.get(['/farms', '/list', '/'], (req, res) => {
  try {
    const farms = expenseService.getAllFarms(req.user?.id);
    res.json({ success: true, count: farms.length, data: farms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get active summary for Dashboard and Sell Decision
router.get('/summary', (req, res) => {
  try {
    const summary = expenseService.getActiveSummary(req.query.crop);
    res.json({ success: true, ...summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get single farm season with all expenses & metrics
router.get('/farms/:id', (req, res) => {
  try {
    const farm = expenseService.getFarmById(req.params.id);
    if (!farm) {
      return res.status(404).json({ success: false, error: 'Farm season record not found.' });
    }
    res.json({ success: true, data: farm });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create new farm season
router.post('/farms', (req, res) => {
  try {
    const farm = expenseService.createFarm(req.body, req.user?.id);
    res.status(201).json({ success: true, data: farm });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Update farm details / production / selling
router.put('/farms/:id', (req, res) => {
  try {
    const updated = expenseService.updateFarm(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Farm season record not found.' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Delete farm season
router.delete('/farms/:id', (req, res) => {
  try {
    const success = expenseService.deleteFarm(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Farm season record not found.' });
    }
    res.json({ success: true, message: 'Farm season deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Add individual expense entry
router.post('/farms/:id/entries', (req, res) => {
  try {
    const result = expenseService.addExpense(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Farm season not found.' });
    }
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Update individual expense entry
router.put('/farms/:id/entries/:entryId', (req, res) => {
  try {
    const result = expenseService.updateExpense(req.params.id, req.params.entryId, req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Expense item or farm not found.' });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. Delete individual expense entry
router.delete('/farms/:id/entries/:entryId', (req, res) => {
  try {
    const result = expenseService.deleteExpense(req.params.id, req.params.entryId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Expense item or farm not found.' });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. AI Cost-Reduction Advisor (strictly using verified farmer-entered values)
router.post('/ai-advice', async (req, res) => {
  try {
    const { farm_id, question } = req.body || {};
    const targetId = farm_id || (expenseService.farms[0] ? expenseService.farms[0].id : null);
    const farm = targetId ? expenseService.getFarmById(targetId) : null;
    if (!farm) {
      return res.status(404).json({ success: false, error: 'No farm expense data available.' });
    }

    const m = farm.metrics || farm.calculations || { category_breakdown: [], total_cost: 0 };
    const breakdownStr = (m.category_breakdown || [])
      .map(c => `- ${c.category}: ₹${c.cost.toLocaleString('en-IN')} (${c.percentage}%)`)
      .join('\n');

    const promptMessage = `The farmer has asked for cost optimization advice on their ${farm.crop} farm.
Recorded Information:
- Farm: ${farm.farm_name || 'My Farm'} (${farm.season} ${farm.year})
- Crop: ${farm.crop} ${farm.variety ? '(' + farm.variety + ')' : ''}
- Area: ${farm.area} ${farm.area_unit}
- Total Recorded Cost: ₹${m.total_cost.toLocaleString('en-IN')}
- Cost per ${farm.area_unit}: ₹${m.cost_per_acre ? m.cost_per_acre.toLocaleString('en-IN') : 'N/A'}
- Production: ${m.active_production} ${m.production_unit} (${m.production_basis} basis)
- Break-Even Price: ₹${m.break_even_price ? m.break_even_price.toLocaleString('en-IN') : 'N/A'}/quintal
- Current Mandi Rate: ₹${m.mandi_comparison?.data?.modal_price ? m.mandi_comparison.data.modal_price.toLocaleString('en-IN') : 'N/A'}/quintal (${m.mandi_comparison?.data?.market || 'Market'})
- Category Breakdown:
${breakdownStr}

Farmer's Question: "${question || 'Mera kharcha bahut zyada hai, kya kar sakta hoon?'}"

Provide an empathetic, practical cost-optimization advisory. 
RULES:
1. Identify the 2 largest expense categories and their percentage share.
2. Provide practical, agronomic reduction tips (e.g. soil testing before fertilizer, CHC machinery rental, collective transport).
3. Do NOT invent subsidy schemes, government grants, or specific input prices.
4. Never guarantee future profit. Keep the response clear, structured with bullet points.`;

    const aiResponse = await chatService.handleChat({
      message: promptMessage,
      conversationHistory: [],
      contextCrop: farm.crop,
      contextLocation: farm.selected_mandi || 'Uttar Pradesh'
    });

    res.json({
      success: true,
      advice: aiResponse.reply,
      crop: farm.crop,
      total_cost: m.total_cost,
      break_even_price: m.break_even_price,
      top_categories: m.category_breakdown.slice(0, 2)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
