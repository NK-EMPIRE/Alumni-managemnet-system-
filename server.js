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
      // Migrate Users table column
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'department'
        )
        BEGIN
          ALTER TABLE dbo.Users ADD department VARCHAR(100) NULL;
        END
      `);

      // Migrate Alumni table columns
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'date_of_birth'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD date_of_birth VARCHAR(20) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'working_details'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD working_details VARCHAR(500) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'linkedin_profile'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD linkedin_profile VARCHAR(255) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'experience'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD experience VARCHAR(50) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'salary'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD salary VARCHAR(50) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'city'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD city VARCHAR(100) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'country'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD country VARCHAR(100) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'faculty_assigned'
        )
        BEGIN
          ALTER TABLE dbo.Alumni ADD faculty_assigned VARCHAR(150) NULL;
        END
      `);

      // Migrate ImportHistory table columns
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns
          WHERE object_id = OBJECT_ID('dbo.ImportHistory') AND name = 'merged'
        )
        BEGIN
          ALTER TABLE dbo.ImportHistory ADD merged INT DEFAULT 0;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns
          WHERE object_id = OBJECT_ID('dbo.ImportHistory') AND name = 'skipped'
        )
        BEGIN
          ALTER TABLE dbo.ImportHistory ADD skipped INT DEFAULT 0;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns
          WHERE object_id = OBJECT_ID('dbo.ImportHistory') AND name = 'original_name'
        )
        BEGIN
          ALTER TABLE dbo.ImportHistory ADD original_name VARCHAR(500) NULL;
        END
      `);

      // AlumniAssignments migrations
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'assigned_by'
        )
        BEGIN
          ALTER TABLE dbo.AlumniAssignments ADD assigned_by INT NULL;
          ALTER TABLE dbo.AlumniAssignments ADD CONSTRAINT FK_AA_AssignedBy FOREIGN KEY (assigned_by) REFERENCES dbo.Users(user_id);
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'assignment_type'
        )
        BEGIN
          ALTER TABLE dbo.AlumniAssignments ADD assignment_type VARCHAR(50) NULL;
        END
      `);

      await pool.request().query(`
        IF EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'member_id' AND is_nullable = 0
        )
        BEGIN
          -- Drop foreign key constraint if it prevents changing nullability
          IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_AA_Member' AND parent_object_id = OBJECT_ID('dbo.AlumniAssignments'))
          BEGIN
            ALTER TABLE dbo.AlumniAssignments DROP CONSTRAINT FK_AA_Member;
          END
          
          ALTER TABLE dbo.AlumniAssignments ALTER COLUMN member_id INT NULL;
          
          -- Re-add the foreign key constraint
          ALTER TABLE dbo.AlumniAssignments ADD CONSTRAINT FK_AA_Member FOREIGN KEY (member_id) REFERENCES dbo.Users(user_id);
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'reassignment_reason'
        )
        BEGIN
          ALTER TABLE dbo.AlumniAssignments ADD reassignment_reason VARCHAR(500) NULL;
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.objects 
          WHERE parent_object_id = OBJECT_ID('dbo.AlumniAssignments') AND type = 'UQ' AND name = 'UQ_AlumniAssignments_Alumni'
        )
        BEGIN
          WITH cte AS (
            SELECT assignment_id, ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) as rn
            FROM dbo.AlumniAssignments
          )
          DELETE FROM dbo.AlumniAssignments WHERE assignment_id IN (SELECT assignment_id FROM cte WHERE rn > 1);

          ALTER TABLE dbo.AlumniAssignments ADD CONSTRAINT UQ_AlumniAssignments_Alumni UNIQUE (alumni_id);
        END
      `);

      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.FacultyAliases') AND type = 'U')
        BEGIN
          CREATE TABLE dbo.FacultyAliases (
            alias_id INT IDENTITY(1,1) PRIMARY KEY,
            faculty_id INT NOT NULL,
            alias_name VARCHAR(255) NOT NULL UNIQUE,
            CONSTRAINT FK_FacultyAliases_Users FOREIGN KEY (faculty_id) REFERENCES dbo.Users(user_id)
          );
        END
      `);

      logger.info('Migrations: verified and updated Users, Alumni, ImportHistory, AlumniAssignments, and FacultyAliases columns successfully');
    } catch (migErr) {
      logger.warn('Migration check failed: ' + migErr.message);
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
