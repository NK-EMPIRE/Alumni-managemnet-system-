const sql = require('mssql');
const { logger } = require('../utils/logger');

let pool = null;

function buildConfig() {
  return {
    user: process.env.DB_USERNAME || process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || process.env.DB_SERVER,
    database: process.env.DB_NAME || process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000
    },
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      enableArithAbort: true
    }
  };
}

async function getPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect(buildConfig());
  } catch (e) {
    logger.error('Database connection failed:', e);
    throw e;
  }
  try {
    await pool.query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'must_change_password'
      )
      BEGIN
        ALTER TABLE dbo.Users ADD must_change_password BIT DEFAULT 0 NOT NULL;
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.AssignmentAuditLog'))
      BEGIN
        CREATE TABLE dbo.AssignmentAuditLog (
          audit_id INT IDENTITY PRIMARY KEY,
          alumni_id INT NOT NULL,
          old_member_id INT NULL,
          new_member_id INT NULL,
          changed_by INT NULL,
          changed_at DATETIME2 DEFAULT GETUTCDATE()
        );
      END

      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('dbo.ImportHistory') AND name = 'duration_sec'
      )
      BEGIN
        ALTER TABLE dbo.ImportHistory ADD duration_sec DECIMAL(10, 2) NULL;
      END

      IF EXISTS (
        SELECT * FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'CK_AlumniAssignments_status'
      )
      BEGIN
        ALTER TABLE dbo.AlumniAssignments DROP CONSTRAINT CK_AlumniAssignments_status;
        ALTER TABLE dbo.AlumniAssignments ADD CONSTRAINT CK_AlumniAssignments_status 
          CHECK (status IN ('Available', 'ASSIGNED_TO_LEADER', 'DISTRIBUTED', 'Pending', 'Draft', 'Completed', 'Reopened'));
      END
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.EmailCampaigns'))
      BEGIN
          CREATE TABLE dbo.EmailCampaigns (
              campaign_id INT IDENTITY PRIMARY KEY,
              leader_id INT NOT NULL REFERENCES dbo.Users(user_id),
              team_id INT NOT NULL REFERENCES dbo.Teams(team_id),
              total_recipients INT NOT NULL,
              sent_count INT DEFAULT 0,
              failed_count INT DEFAULT 0,
              status VARCHAR(30) DEFAULT 'Queued',
              created_at DATETIME2 DEFAULT GETUTCDATE(),
              completed_at DATETIME2 NULL
          );
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.EmailCampaignRecipients'))
      BEGIN
          CREATE TABLE dbo.EmailCampaignRecipients (
              recipient_id INT IDENTITY PRIMARY KEY,
              campaign_id INT NOT NULL REFERENCES dbo.EmailCampaigns(campaign_id),
              assignment_id INT NOT NULL REFERENCES dbo.AlumniAssignments(assignment_id),
              alumni_id INT NOT NULL REFERENCES dbo.Alumni(alumni_id),
              email VARCHAR(255) NOT NULL,
              status VARCHAR(30) DEFAULT 'Pending',
              message_id VARCHAR(255) NULL,
              sent_at DATETIME2 NULL
          );
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.AlumniReplies'))
      BEGIN
          CREATE TABLE dbo.AlumniReplies (
              reply_id INT IDENTITY PRIMARY KEY,
              assignment_id INT NOT NULL REFERENCES dbo.AlumniAssignments(assignment_id),
              alumni_id INT NOT NULL REFERENCES dbo.Alumni(alumni_id),
              raw_reply_text NVARCHAR(MAX) NOT NULL,
              received_at DATETIME2 DEFAULT GETUTCDATE(),
              review_status VARCHAR(30) DEFAULT 'Pending Review',
              reviewed_by INT NULL REFERENCES dbo.Users(user_id),
              reviewed_at DATETIME2 NULL
          );
      END

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.AlumniReplies') AND name = 'IX_AlumniReplies_Assignment')
      BEGIN
          CREATE INDEX IX_AlumniReplies_Assignment ON dbo.AlumniReplies(assignment_id);
      END

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.EmailCampaignRecipients') AND name = 'IX_EmailCampaignRecipients_Campaign')
      BEGIN
          CREATE INDEX IX_EmailCampaignRecipients_Campaign ON dbo.EmailCampaignRecipients(campaign_id);
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.WorkspaceMessages'))
      BEGIN
          CREATE TABLE dbo.WorkspaceMessages (
              message_id INT IDENTITY PRIMARY KEY,
              user_id INT NOT NULL REFERENCES dbo.Users(user_id),
              message_text NVARCHAR(MAX) NOT NULL,
              attachment_url VARCHAR(500) NULL,
              created_at DATETIME2 DEFAULT GETUTCDATE()
          );
      END

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.WorkspaceMessages') AND name = 'IX_WorkspaceMessages_CreatedAt')
      BEGIN
          CREATE INDEX IX_WorkspaceMessages_CreatedAt ON dbo.WorkspaceMessages(created_at DESC);
      END
    `);
  } catch (e) {
    logger.error('Database migration failed:', e);
  }
  pool.on('error', (err) => {
    logger.error('SQL Pool error:', err);
    pool = null;
  });
  return pool;
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { sql, getPool, closePool, connectDB: getPool };