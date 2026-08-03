const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const { connectDB, getPool } = require('./backend/src/config/database');
const { logger, stream } = require('./backend/src/utils/logger');
const { errorHandler } = require('./backend/src/middleware/errorHandler');
const appRoutes = require('./backend/src/routes/index');
const setupRoutes = require('./backend/src/routes/setup.routes');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();

app.set('trust proxy', 1);

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.disable('x-powered-by');
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  setHeaders: function (res, pathStr) {
    if (pathStr.endsWith('.js') || pathStr.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
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

const http = require('http');
const { Server } = require('socket.io');
const { setIO } = require('./backend/src/helpers/realtime');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setIO(io);

io.on('connection', (socket) => {
  // Join team/admin rooms for assignments
  socket.on('join', ({ role, teamId }) => {
    if (role === 'ADMIN') {
      socket.join('admin');
    }
    if (teamId) {
      socket.join(`team:${teamId}`);
    }
  });

  // Join personal room for targeted notifications
  socket.on('joinUser', ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production' && !process.env.N8N_SHARED_SECRET) {
    logger.error('CRITICAL SECURITY ERROR: N8N_SHARED_SECRET is not defined in production environment. Refusing to boot server.');
    process.exit(1);
  }
  try {
    const pool = await connectDB();
    try {
      const { runMigrations } = require('./migrations/runner');
      await runMigrations();
      logger.info('Migrations executed successfully');
    } catch (migErr) {
      logger.error('Migration run failed: ' + migErr.message + '. Server will start but some features may not work.');
    }
    server.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Frontend: http://localhost:${PORT}`);
      logger.info(`API: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
}

startServer();
