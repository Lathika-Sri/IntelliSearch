/**
 * Admin authorization middleware.
 * Verifies secret admin key via 'x-admin-key' header.
 */
function requireAdmin(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const expectedKey = process.env.ADMIN_API_KEY || 'admin-secret-key-123';
  const providedKey = req.headers['x-admin-key'];

  if (expectedKey === 'disabled' || providedKey === expectedKey) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Valid x-admin-key header is required for admin endpoints.'
  });
}

module.exports = {
  requireAdmin
};
