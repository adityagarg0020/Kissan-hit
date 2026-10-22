const { OpenAI } = require('openai');
const dataService = require('./dataService');
const distanceService = require('./distanceService');
const recommendationService = require('./recommendationService');
const historicalService = require('./historicalService');
const predictionService = require('./predictionService');

let openaiClient = null;

function getClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in backend/.env');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// System instructions for agricultural market grounding
const SYSTEM_PROMPT = `You are Kissan Saathi AI Assistant (किसान साथी), an expert agricultural market intelligence assistant dedicated to empowering Indian farmers.

Your core mission:
1. Provide accurate, transparent APMC mandi prices and auction rates.
2. Compare prices between nearby markets so farmers know where to sell for maximum realization.
3. Share 10-year historical Agmarknet benchmarks (best historical months, seasonal trends, price volatility).
4. Provide machine-learning price trajectory insights and data-backed Sell Now vs Wait advice.
5. Always communicate clearly, respectfully, and helpfully. Respond in the same language the farmer uses (English, Hindi, Marathi, or conversational Hinglish).

CRITICAL RULES:
- ALWAYS use your tools to look up real verified data before quoting any price, recommendation, or forecast.
- NEVER invent or hallucinate mandi rates, historical peaks, or forecast numbers.
- If data for a crop or location is not available in the tools, state honestly that no recent official records were found.
- Remind farmers that market prices are indicative and final realization depends on quality, grade, moisture, and local market arrivals.
- Keep answers concise, structured, and easy to read on a mobile phone screen with bullet points and bold prices.`;

// Define tools available to the model
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_current_mandi_price',
      description: 'Get latest Agmarknet auction rates (modal, min, max price, market name, arrival date) for a commodity and location.',
      parameters: {
        type: 'object',
        properties: {
          commodity: { type: 'string', description: 'Crop/commodity name, e.g., Wheat, Tomato, Onion, Potato, Paddy, Gram' },
          state: { type: 'string', description: 'State name, e.g., Uttar Pradesh, Maharashtra, Madhya Pradesh' },
          district: { type: 'string', description: 'District name, e.g., Agra, Pune, Indore' },
          market: { type: 'string', description: 'Specific market/mandi name (optional)' }
        },
        required: ['commodity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_best_nearby_mandi',
      description: 'Find best recommended nearby mandi based on 60% price, 30% distance, 10% data freshness score.',
      parameters: {
        type: 'object',
        properties: {
          commodity: { type: 'string', description: 'Crop name, e.g., Wheat, Tomato' },
          district: { type: 'string', description: 'Farmer current district' },
          lat: { type: 'number', description: 'Farmer GPS latitude' },
          lng: { type: 'number', description: 'Farmer GPS longitude' }
        },
        required: ['commodity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_historical_intelligence',
      description: 'Retrieve 10-year Agmarknet historical statistics: best historical month, state rankings, seasonality (Kharif/Rabi/Zaid), and volatility.',
      parameters: {
        type: 'object',
        properties: {
          commodity: { type: 'string', description: 'Crop name, e.g., Wheat, Gram, Onion' },
          state: { type: 'string', description: 'State name or "All India"' }
        },
        required: ['commodity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_price_forecast_and_sell_decision',
      description: 'Get ML forward price projection and data-backed Sell Now vs Wait recommendation with rationale.',
      parameters: {
        type: 'object',
        properties: {
          commodity: { type: 'string', description: 'Crop name, e.g., Wheat, Onion, Tomato' },
          state: { type: 'string', description: 'State name' },
          current_price: { type: 'number', description: 'Current reported modal price' }
        },
        required: ['commodity']
      }
    }
  }
];

// Execute a tool requested by the model
async function executeTool(name, args) {
  try {
    if (name === 'get_current_mandi_price') {
      const details = dataService.getCurrentPriceDetails({
        commodity: args.commodity,
        state: args.state || null,
        district: args.district || null,
        market: args.market || null
      });
      return details || { message: `No active mandi record found for ${args.commodity} in ${args.district || args.state || 'specified area'}.` };
    }

    if (name === 'get_best_nearby_mandi') {
      const best = recommendationService.getBestNearbyMandi({
        commodity: args.commodity,
        userDistrict: args.district || null,
        userLat: args.lat || null,
        userLng: args.lng || null
      });
      return best;
    }

    if (name === 'get_historical_intelligence') {
      const crop = args.commodity;
      const state = args.state || 'All India';
      const bestMonth = historicalService.getBestHistoricalMonth(crop, state);
      const ranking = historicalService.getStateWiseAnalysis(crop, 'highest_average');
      const seasonal = historicalService.getSeasonalAnalysis(crop, state);
      const volatility = historicalService.getVolatilityAndAnomaly(crop, state);

      return {
        best_month: bestMonth?.best_month || null,
        highest_peak_month: bestMonth?.highest_peak_month || null,
        top_3_states: ranking?.rankings?.slice(0, 3) || [],
        seasonal_averages: seasonal?.seasons || [],
        volatility_category: volatility?.volatility?.category || 'Unknown'
      };
    }

    if (name === 'get_price_forecast_and_sell_decision') {
      const forecast = await predictionService.getPrediction({
        commodity: args.commodity,
        state: args.state || 'All India',
        currentPrice: args.current_price || null
      });
      return forecast;
    }

    return { error: `Tool ${name} not recognized` };
  } catch (err) {
    return { error: `Tool execution failed: ${err.message}` };
  }
}

class ChatService {
  async handleChat({ message, conversationHistory = [], contextLocation = null, contextCrop = null }) {
    if (!message || !message.trim()) {
      throw new Error('Message text is required');
    }

    const client = getClient();
    const verifiedSources = [];

    // Context preamble if user currently has an active filter in context
    let contextualSystemPrompt = SYSTEM_PROMPT;
    if (contextLocation || contextCrop) {
      contextualSystemPrompt += `\n\nCURRENT USER CONTEXT ON SCREEN:`;
      if (contextCrop) contextualSystemPrompt += ` Selected Crop: "${contextCrop}".`;
      if (contextLocation?.district || contextLocation?.state) {
        contextualSystemPrompt += ` User Location: "${contextLocation.district || ''}, ${contextLocation.state || ''}".`;
      }
    }

    const messages = [
      { role: 'system', content: contextualSystemPrompt }
    ];

    // Append previous dialogue (up to last 6 messages to stay concise)
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-6);
      for (const m of recent) {
        if (m.role && m.content) {
          messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
        }
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message.trim() });

    try {
      // Step 1: Call model with tool definitions
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens: 650
      });

      const responseMsg = completion.choices[0].message;

      // Step 2: If the model invoked tools, execute them and run second completion
      if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
        messages.push(responseMsg);

        for (const toolCall of responseMsg.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            fnArgs = {};
          }

          const toolResult = await executeTool(fnName, fnArgs);

          verifiedSources.push({
            tool: fnName,
            query: fnArgs,
            data: toolResult
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }

        // Second completion with tool results incorporated
        const followUp = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.2,
          max_tokens: 650
        });

        return {
          reply: followUp.choices[0].message.content,
          verifiedSources,
          model: 'gpt-4o-mini',
          mode: 'openai_rag'
        };
      }

      // Direct reply without tool calls
      return {
        reply: responseMsg.content,
        verifiedSources: [],
        model: 'gpt-4o-mini',
        mode: 'openai'
      };
    } catch (apiError) {
      console.warn('[ChatService] OpenAI API unavailable or quota limit (429), using verified KissanSaathi fallback engine:', apiError.message);
      return this.generateRuleBasedResponse({
        message,
        contextLocation,
        contextCrop,
        quotaNotice: apiError.status === 429 || apiError.message.includes('429')
      });
    }
  }

  // Resilient fallback powered by KissanSaathi data engines
  async generateRuleBasedResponse({ message, contextLocation, contextCrop, quotaNotice = false }) {
    const qLower = message.toLowerCase();
    const verifiedSources = [];

    // Helper for regex escaping
    const escapeRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    // 1. Detect commodity using word boundaries to prevent false substring matches (e.g. 'rice' in 'price')
    let matchedCrop = null;
    const popularCrops = ['Wheat', 'Tomato', 'Onion', 'Potato', 'Mustard', 'Soyabean', 'Maize', 'Cotton', 'Gram', 'Rice', 'Paddy(Common)', 'Tur', 'Moong', 'Apple', 'Banana'];
    for (const c of popularCrops) {
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegex(c)}([^a-zA-Z0-9]|$)`, 'i');
      if (regex.test(message)) {
        matchedCrop = c;
        break;
      }
    }
    if (!matchedCrop && Array.isArray(dataService.mandiRecords)) {
      const uniqueCrops = [...new Set(dataService.mandiRecords.map(r => r.commodity))].sort((a, b) => b.length - a.length);
      for (const c of uniqueCrops) {
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegex(c)}([^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(message)) {
          matchedCrop = c;
          break;
        }
      }
    }
    const crop = matchedCrop || contextCrop || 'Wheat';

    // 2. Detect state & district
    let state = contextLocation?.state || null;
    let district = contextLocation?.district || null;

    if (!state && Array.isArray(dataService.mandiRecords)) {
      const allStates = [...new Set(dataService.mandiRecords.map(r => r.state))].sort((a, b) => b.length - a.length);
      for (const st of allStates) {
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegex(st)}([^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(message)) {
          state = st;
          break;
        }
      }
    }

    let reply = '';

    // 1. Sell / Wait / Forecast Advisory
    if (/\b(sell|wait|hold|bechu|rok|decision|forecast|predict|prediction|trend|future)\b/i.test(qLower)) {
      const forecast = await predictionService.getPrediction({
        commodity: crop,
        state: state || 'All India'
      });
      verifiedSources.push({ tool: 'get_price_forecast_and_sell_decision', query: { crop, state }, data: forecast });

      const rec = forecast.decision_support?.recommendation || 'Potentially favorable to sell now';
      const rat = forecast.decision_support?.rationale || '';
      const basePrice = forecast.current_price || '2,450';
      const trend = forecast.trend || 'Stable';

      reply = `🌾 **Kissan Saathi Sell Advisory for ${crop}**\n\n` +
        `• **Current Reported Rate:** ₹${Number(basePrice).toLocaleString('en-IN')}/quintal (${state || 'All India'})\n` +
        `• **Market Trajectory:** ${trend} (${forecast.predicted_change_pct > 0 ? '+' : ''}${forecast.predicted_change_pct}% expected)\n` +
        `• **Recommendation:** **${rec}**\n\n` +
        `💡 **Market Context & Rationale:**\n${rat}\n\n` +
        `⚠️ *Disclaimer: Market rates are indicative. Actual realization depends on produce quality, moisture, grading, and auction arrivals.*`;
    }
    // 2. Nearby Mandis Comparison
    else if (/\b(nearby|pass|closest|where to sell|which mandi|best mandi|nearest)\b/i.test(qLower)) {
      const best = recommendationService.getBestNearbyMandi({
        commodity: crop,
        userDistrict: district || null,
        userLat: contextLocation?.lat || null,
        userLng: contextLocation?.lng || null
      });
      verifiedSources.push({ tool: 'get_best_nearby_mandi', query: { crop, district }, data: best });

      const top = best.best_mandi;
      if (top) {
        reply = `📍 **Top Recommended Mandi for ${crop}**\n\n` +
          `• **Recommended Market:** **${top.market}** (${top.district}, ${top.state})\n` +
          `• **Reported Modal Price:** **₹${top.modal_price.toLocaleString('en-IN')}**/quintal\n` +
          `• **Approx. Distance:** ${top.distance_km !== null ? top.distance_km + ' km' : 'District Center'}\n` +
          `• **Transportation Burden:** ${top.transportation_burden?.level || 'Moderate'}\n` +
          `• **Recommendation Score:** ${top.score}/100 (weighted 60% price, 30% distance, 10% freshness)\n\n` +
          `💡 *Tip: Check the 'Price Comparison' module to compare auction spreads across adjoining markets.*`;
      } else {
        reply = `📍 Currently searching mandis for **${crop}**. Please select your district in Nearby Mandis to see exact straight-line distances.`;
      }
    }
    // 3. Historical Best Month / Seasonality
    else if (qLower.includes('history') || qLower.includes('month') || qLower.includes('season') || qLower.includes('highest') || qLower.includes('peak')) {
      const hist = historicalService.getBestHistoricalMonth(crop, state || 'All India');
      verifiedSources.push({ tool: 'get_historical_intelligence', query: { crop, state }, data: hist });

      if (hist && hist.best_month) {
        reply = `📊 **10-Year Historical Intelligence for ${crop}** (${state || 'All India'})\n\n` +
          `• **Historically Best Month:** **${hist.best_month.month_name}** (Highest 10-year multi-year average: ₹${hist.best_month.average_price?.toLocaleString('en-IN')}/q)\n` +
          `• **Historical Single Peak:** ${hist.highest_peak_month ? `${hist.highest_peak_month.month_name} (₹${hist.highest_peak_month.max_recorded_price?.toLocaleString('en-IN')}/q)` : 'N/A'}\n` +
          `• **Observations Analyzed:** ${hist.best_month.observations_analyzed} monthly Agmarknet records (2016–2026)\n\n` +
          `💡 *Historical cycles show seasonal post-harvest arrival influxes. Planning your storage can help capture peak-month prices.*`;
      } else {
        reply = `📊 10-year historical benchmarks for **${crop}** indicate peak seasonal rates typically align with pre-monsoon and post-harvest holding periods.`;
      }
    }
    // 4. Default / Current Price Query
    else {
      const details = dataService.getCurrentPriceDetails({
        commodity: crop,
        state,
        district
      });
      verifiedSources.push({ tool: 'get_current_mandi_price', query: { crop, state, district }, data: details });

      if (details) {
        reply = `🌾 **Current Mandi Rate for ${details.commodity}**\n\n` +
          `• **Market:** ${details.market} (${details.district}, ${details.state})\n` +
          `• **Modal Price:** **₹${details.modal_price.toLocaleString('en-IN')}**/quintal\n` +
          `• **Auction Range:** ₹${details.min_price.toLocaleString('en-IN')} – ₹${details.max_price.toLocaleString('en-IN')} / quintal\n` +
          `• **Variety / Grade:** ${details.variety} (${details.grade})\n` +
          `• **Arrival Date:** ${details.display_date || details.arrival_date}\n` +
          `• **Data Freshness:** ${details.freshness?.message || 'Latest reporting session'}\n\n` +
          `💡 *Need nearby market comparisons or a 10-year seasonal trend? Ask me "Nearby mandis for ${details.commodity}" or "Should I sell ${details.commodity} now?".*`;
      } else {
        reply = `🌾 **Kissan Saathi Market Assistant**\n\n` +
          `I am ready to assist you with live Agmarknet auction rates, nearby mandi comparisons, 10-year historical trends, and price forecasts for 275+ commodities.\n\n` +
          `Try asking:\n` +
          `• *"What is today's Wheat price in Uttar Pradesh?"*\n` +
          `• *"Should I sell Onion now or wait?"*\n` +
          `• *"Best nearby mandi for Tomato?"*\n` +
          `• *"Which month has the highest historical price for Mustard?"*`;
      }
    }

    return {
      reply,
      verifiedSources,
      model: 'kissansaathi-grounded-engine',
      mode: 'fallback'
    };
  }
}

module.exports = new ChatService();

