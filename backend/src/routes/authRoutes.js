const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../lib/supabaseAdmin');

// Instant-confirmed farmer registration for smooth demo
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, preferredLanguage } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: (fullName || email.split('@')[0]).trim(),
        phone: (phone || '').trim() || null,
        preferred_language: preferredLanguage || 'en'
      }
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Farmer account created and verified successfully.',
      user: data.user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
