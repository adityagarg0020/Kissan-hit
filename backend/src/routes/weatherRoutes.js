const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const chatService = require('../services/chatService');

// 1. GET /api/weather?lat=28.6139&lon=77.2090
router.get('/', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon || req.query.lng;
    const forceRefresh = req.query.refresh === 'true';

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and Longitude query parameters are required (e.g., /api/weather?lat=28.6139&lon=77.2090).'
      });
    }

    const weatherData = await weatherService.getWeather(lat, lon, forceRefresh);
    res.json(weatherData);
  } catch (err) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Weather data is temporarily unavailable. Please try again later.',
      code: err.code || 'WEATHER_ERROR',
      detail: err.code === 'INVALID_API_KEY'
        ? 'OpenWeather rejected the key with HTTP 401 (Invalid API key). If you just generated this key, OpenWeather takes 10 to 60 minutes to activate new keys. Please also ensure your OpenWeather account email is verified.'
        : undefined
    });
  }
});

// Alias: GET /api/weather/current
router.get('/current', async (req, res) => {
  try {
    const lat = req.query.lat || 27.1767;
    const lon = req.query.lon || req.query.lng || 78.0081;
    const forceRefresh = req.query.refresh === 'true';
    const weatherData = await weatherService.getWeather(lat, lon, forceRefresh);
    res.json({ success: true, current: weatherData.current, location: weatherData.location });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Alias: GET /api/weather/forecast
router.get('/forecast', async (req, res) => {
  try {
    const lat = req.query.lat || 27.1767;
    const lon = req.query.lon || req.query.lng || 78.0081;
    const forceRefresh = req.query.refresh === 'true';
    const weatherData = await weatherService.getWeather(lat, lon, forceRefresh);
    res.json({ success: true, forecast: weatherData.forecast, location: weatherData.location });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/weather/ai-explain
router.post('/ai-explain', async (req, res) => {
  try {
    let { weather, question, language = 'en', lat, lon, lng } = req.body;

    if (weather && weather.data && weather.data.current) {
      weather = weather.data;
    }

    const fetchLat = lat || req.query?.lat;
    const fetchLon = lon || lng || req.query?.lon || req.query?.lng;

    if ((!weather || !weather.current) && fetchLat && fetchLon) {
      try {
        const fetched = await weatherService.getWeather(fetchLat, fetchLon);
        if (fetched && fetched.current) {
          weather = fetched;
        }
      } catch (err) {
        console.warn('[WeatherRoutes] Auto-fetch weather for AI explanation failed:', err.message);
      }
    }

    if (!weather || !weather.current) {
      return res.status(400).json({
        success: false,
        error: 'Verified weather information is required for AI explanation.'
      });
    }

    const c = weather.current;
    const loc = weather.location || {};
    const alerts = weather.alerts || [];
    const forecast = weather.forecast || [];

    const activeAlertsStr = alerts.length > 0
      ? alerts.map(a => `${a.title}: ${a.message} (Tip: ${a.farmTip})`).join('; ')
      : 'No major alerts.';

    const forecastSummary = forecast.slice(0, 4).map(f => 
      `${f.dayName}: ${f.temperature}°C, ${f.condition}, Rain: ${f.rainProbability}%`
    ).join(' | ');

    let langInstruction = 'Respond in clear, simple English.';
    if (language === 'hi') {
      langInstruction = 'कृपया सरल, किसान-अनुकूल हिंदी (Devanagari script) में उत्तर दें।';
    } else if (language === 'mr') {
      langInstruction = 'कृपया सोप्या, शेतकरी-अनुकूल मराठी (Devanagari script) मध्ये उत्तर द्या.';
    } else if (language === 'hinglish') {
      langInstruction = 'Respond in friendly conversational Hinglish (Roman script, e.g. "Aaj mausam saaf hai, aap sinchai kar sakte hain").';
    }

    const systemPrompt = `You are Kissan Saathi's agricultural weather assistant. Use only the verified weather data provided. Never invent weather values, forecasts, rainfall, or alerts. Do not claim certainty about future weather. Give short, simple, farmer-friendly explanations. ${langInstruction}`;

    const userPrompt = `Verified Weather Data for ${loc.name || 'Current Location'}:
- Current Temperature: ${c.temperature}°C (Feels like: ${c.feelsLike}°C)
- Condition: ${c.condition} (${c.description})
- Humidity: ${c.humidity}%
- Wind Speed: ${c.windSpeed} km/h
- Rain Probability: ${c.rainProbability}%
- Active Alerts: ${activeAlertsStr}
- Upcoming Days: ${forecastSummary}

Farmer's Question: "${question || 'How is the weather today and what should I do on the farm?'}"

Explain this weather in 3-4 bullet points specifically focused on irrigation, chemical spraying, and field safety. Only use the numbers provided above.`;

    let explanation = '';

    // Try calling OpenAI with dedicated weather system prompt
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      explanation = completion.choices?.[0]?.message?.content?.trim();
    } catch (aiErr) {
      console.log('[WeatherRoutes] OpenAI call fallback:', aiErr.message);
    }

    // Deterministic fallback if OpenAI call was not successful or quota limited
    if (!explanation) {
      if (language === 'hi') {
        explanation = `🌾 **किसान साथी मौसम विश्लेषण (${loc.name || 'आपका क्षेत्र'}):**\n\n` +
          `• **तापमान एवं स्थिति:** वर्तमान तापमान ${c.temperature}°C (${c.description}) है, जो ${c.feelsLike}°C जैसा महसूस हो रहा है। आर्द्रता ${c.humidity}% है।\n` +
          `• **वर्षा एवं हवा:** वर्षा की संभावना ${c.rainProbability}% है तथा हवा की गति ${c.windSpeed} km/h दर्ज की गई है।\n` +
          `• **खेत कार्य सलाह:** ${c.rainProbability >= 50 ? 'बारिश का अनुमान होने के कारण कीटनाशक या खाद का छिड़काव तुरंत टालें और जलभराव से बचाव करें।' : 'मौसम सामान्य कृषि गतिविधियों, निराई-गुड़ाई और आवश्यकतानुसार हल्की सिंचाई के अनुकूल है।'}\n` +
          `• **अलर्ट स्थिति:** ${alerts[0]?.title || 'वर्तमान में कोई गंभीर मौसम अलर्ट नहीं है।'}`;
      } else if (language === 'mr') {
        explanation = `🌾 **किसान साथी हवामान विश्लेषण (${loc.name || 'तुमचा परिसर'}):**\n\n` +
          `• **तापमान आणि स्थिती:** सध्याचे तापमान ${c.temperature}°C (${c.description}) असून, ते ${c.feelsLike}°C सारखे जाणवत आहे. हवेतील आर्द्रता ${c.humidity}% आहे.\n` +
          `• **पाऊस आणि वारा:** पावसाची शक्यता ${c.rainProbability}% असून वाऱ्याचा वेग ${c.windSpeed} km/h नोंदवला गेला आहे.\n` +
          `• **शेती सल्ला:** ${c.rainProbability >= 50 ? 'पावसाची शक्यता असल्याने कीटकनाशक अथवा खतांची फवारणी तात्काळ पुढे ढकला आणि शेतात पाणी साचू देऊ नका.' : 'हवामान नेहमीच्या शेतीकामांसाठी, खुरपणी आणि आवश्यकतेनुसार हलक्या सिंचनासाठी अनुकूल आहे.'}\n` +
          `• **सूचना स्थिती:** ${alerts[0]?.title || 'सध्या कोणतीही मोठी हवामान सूचना नाही.'}`;
      } else if (language === 'hinglish') {
        explanation = `🌾 **Kissan Saathi Weather Advice (${loc.name || 'Aapka Area'}):**\n\n` +
          `• **Mausam Summary:** Current temperature ${c.temperature}°C (${c.description}) hai, feels like ${c.feelsLike}°C, humidity ${c.humidity}%.\n` +
          `• **Baarish aur Hawa:** Rain probability ${c.rainProbability}% hai aur wind speed ${c.windSpeed} km/h hai.\n` +
          `• **Kheti Tip:** ${c.rainProbability >= 50 ? 'Baarish hone ki sambhavna hai, isliye foliar spray aur sinchai filhaal rok dein.' : 'Mausam stable hai, regular khet ki dekhbhal aur zaroorat ke anusaar light sinchai kar sakte hain.'}\n` +
          `• **Weather Alert:** ${alerts[0]?.title || 'No major weather alert.'}`;
      } else {
        explanation = `🌾 **Kissan Saathi Agricultural Weather Advisory (${loc.name || 'Your Location'}):**\n\n` +
          `• **Temperature & Conditions:** Currently ${c.temperature}°C (${c.description}), feels like ${c.feelsLike}°C with ${c.humidity}% humidity.\n` +
          `• **Precipitation & Wind:** Rain probability is ${c.rainProbability}%, and wind speed is currently ${c.windSpeed} km/h.\n` +
          `• **Agricultural Action:** ${c.rainProbability >= 50 ? 'Rain is anticipated. Consider postponing irrigation and pesticide spraying to prevent chemical run-off.' : 'Conditions are favorable for regular fieldwork, weeding, and routine irrigation.'}\n` +
          `• **Alert Status:** ${alerts[0]?.title || 'No major weather alerts detected.'}`;
      }
    }

    res.json({
      success: true,
      explanation,
      language
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate AI weather explanation.'
    });
  }
});

module.exports = router;
