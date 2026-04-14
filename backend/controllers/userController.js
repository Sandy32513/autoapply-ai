const supabase = require('../config/supabase');

/**
 * GET /api/me
 * Returns the authenticated user's profile from the `users` table.
 */
const getMe = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe };
