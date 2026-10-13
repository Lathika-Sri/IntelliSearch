
function requireAdmin(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const expectedKey = process.env.ADMIN_API_KEY;
  const providedKey = req.headers['x-admin-key'];

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: 'Admin authentication is not configured.'
    });
  }

  if (providedKey && providedKey === expectedKey) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Valid admin key is required.'
  });
}

module.exports = { requireAdmin };
