const { verifyAccessToken } = require('../utils/jwt');
const { getPool } = require('../config/database');
const { AuthenticationError } = require('./errorHandler');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return next(new AuthenticationError('Authorization header is required'));
  }

  if (!header.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authorization header must use Bearer scheme'));
  }

  const token = header.split(' ')[1];

  if (!token) {
    return next(new AuthenticationError('Token is required'));
  }

  try {
    const decoded = verifyAccessToken(token);
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', decoded.userId)
      .query('SELECT user_id FROM Users WHERE user_id = @userId AND is_active = 1');
    if (result.recordset.length === 0) {
      return next(new AuthenticationError('Account is deactivated or not found'));
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token has expired'));
    }
    if (err instanceof AuthenticationError) return next(err);
    return next(new AuthenticationError('Invalid token'));
  }
}

module.exports = authenticate;