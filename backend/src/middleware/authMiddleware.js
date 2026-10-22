const supabaseAdmin = require('../lib/supabaseAdmin');

/**
 * Strict authentication: Request fails with 401 if valid user token is not present
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired authentication session.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Failed to authenticate user.' });
  }
}

/**
 * Optional authentication: Attaches req.user if token is present, continues without error if absent
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) req.user = user;
    } catch (e) {
      // ignore
    }
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
