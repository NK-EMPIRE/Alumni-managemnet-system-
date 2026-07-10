const { verifyAccessToken } = require('../utils/jwt');
const { AuthenticationError } = require('./errorHandler');

function authenticate(req, res, next) {
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
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token has expired'));
    }
    return next(new AuthenticationError('Invalid token'));
  }
}

module.exports = authenticate;