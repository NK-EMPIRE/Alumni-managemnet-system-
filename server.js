'use strict';

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { Server } = require('socket.io');
const { connectDB, getPool, sql } = require('./backend/src/config/database');
const { logger, stream } = require('./backend/src/utils/logger');
const { errorHandler, notFoundHandler } = require('./backend/src/middleware/errorHandler');
const { verifyAccessToken } = require('./backend/src/utils/jwt');
const { parseAllowedOrigins, isAllowedOrigin, requireProductionSecret } = require('./backend/src/config/security');
const appRoutes = require('./backend/src/routes/index');
const setupRoutes = require('./backend/src/routes/setup.routes');
const { setIO } = require('./backend/src/helpers/realtime');

const app = express();
const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {})
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true);
    return callback(new Error('CORS origin is not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Automation-Secret'],
  credentials: true,
  maxAge: 86400
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  setHeaders(res, pathStr) {
    if (pathStr.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (pathStr.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    } else if (/\.(css|png|jpg|jpeg|gif|svg|woff2?)$/i.test(pathStr)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 12,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});
app.use('/api/v1/auth/login', loginLimiter);

app.use('/api/setup', setupRoutes);
app.use('/api/v1', appRoutes);
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AMS API is running', timestamp: new Date().toISOString(), uptime: process.uptime() });
});
app.use('/api', notFoundHandler);

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true);
      return callback(new Error('Socket origin is not allowed'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use(async (socket, next) => {
  try {
    const authorization = socket.handshake.headers.authorization || '';
    const token = socket.handshake.auth?.token || authorization.replace(/^Bearer\s+/i, '');
    if (!token) return next(new Error('Authentication required'));

    const decoded = verifyAccessToken(token);
    const pool = await getPool();
    const userResult = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query(`
        SELECT u.user_id, r.role_name
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON u.role_id = r.role_id
        WHERE u.user_id = @userId AND u.is_active = 1 AND u.deleted_at IS NULL
      `);
    if (!userResult.recordset.length) return next(new Error('Account is inactive or not found'));

    const teamResult = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query(`
        SELECT team_id FROM dbo.Teams WHERE leader_id = @userId AND is_active = 1
        UNION
        SELECT team_id FROM dbo.TeamMembers WHERE user_id = @userId
      `);

    socket.user = {
      userId: decoded.userId,
      role: String(userResult.recordset[0].role_name || '').toUpperCase(),
      teamIds: teamResult.recordset.map((row) => Number(row.team_id)).filter(Number.isInteger)
    };
    return next();
  } catch (err) {
    return next(new Error('Invalid socket authentication'));
  }
});

setIO(io);

io.on('connection', (socket) => {
  socket.on('join', ({ teamId } = {}) => {
    if (socket.user.role === 'ADMIN') socket.join('admin');

    const numericTeamId = Number(teamId);
    if (Number.isInteger(numericTeamId) && (socket.user.role === 'ADMIN' || socket.user.teamIds.includes(numericTeamId))) {
      socket.join(`team:${numericTeamId}`);
    }
  });

  socket.on('joinUser', ({ userId } = {}) => {
    const numericUserId = Number(userId);
    if (Number.isInteger(numericUserId) && (socket.user.role === 'ADMIN' || numericUserId === Number(socket.user.userId))) {
      socket.join(`user:${numericUserId}`);
    }
  });
});

async function startServer() {
  try {
    requireProductionSecret('JWT_SECRET', process.env.JWT_SECRET);
    requireProductionSecret('REFRESH_TOKEN_SECRET', process.env.REFRESH_TOKEN_SECRET);
    requireProductionSecret('N8N_SHARED_SECRET', process.env.N8N_SHARED_SECRET);
  } catch (configError) {
    logger.error(`CRITICAL SECURITY ERROR: ${configError.message}. Refusing to boot server.`);
    process.exit(1);
  }

  try {
    await connectDB();
    try {
      const { runMigrations } = require('./migrations/runner');
      await runMigrations();
      logger.info('Migrations executed successfully');
    } catch (migErr) {
      logger.error('Migration run failed: ' + migErr.message + '. Server will start but some features may not work.');
    }
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
