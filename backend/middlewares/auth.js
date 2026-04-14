const supabase = require('../config/supabase');

/**
 * Middleware: Validates the Supabase JWT token from Authorization header.
 * Attaches the authenticated user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
    }

    const token = authHeader.split(' ')[1];

    // Validate the JWT using Supabase's getUser (verifies against Supabase Auth)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Attach user to request for downstream use
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
