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

const app = express();

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
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use('/api/setup', setupRoutes);
app.use('/api/v1', appRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'APIUMS API is running', timestamp: new Date().toISOString(), uptime: process.uptime() });
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

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const pool = await connectDB();
    try {
      const { runMigrations } = require('./migrations/runner');
      await runMigrations();
      logger.info('Migrations executed successfully');
    } catch (migErr) {
      logger.warn('Migration run failed: ' + migErr.message);
    }
    app.listen(PORT, () => {
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
