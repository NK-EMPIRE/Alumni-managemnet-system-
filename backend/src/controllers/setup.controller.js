const { sql, getPool } = require('../config/database');
const { hashPassword } = require('../utils/password');
const { success } = require('../utils/response');
const { logger } = require('../utils/logger');

async function runSetup(req, res, next) {
  try {
    const pool = await getPool();
    const results = [];

    const tablesExist = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    const existingTables = tablesExist.recordset.map(r => r.TABLE_NAME);

    if (existingTables.length > 0) {
      var migrations = [];
      var colCheck = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Alumni' AND COLUMN_NAME = 'date_of_birth'");
      if (colCheck.recordset.length === 0) {
        await pool.request().query("ALTER TABLE Alumni ADD date_of_birth VARCHAR(20)");
        migrations.push('Added date_of_birth column to Alumni');
      }
      var deptCheck = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'department'");
      if (deptCheck.recordset.length === 0) {
        await pool.request().query("ALTER TABLE Users ADD department VARCHAR(100)");
        migrations.push('Added department column to Users');
      }
      if (migrations.length > 0) {
        return success(res, { message: 'Migrations applied', migrations: migrations, tables: existingTables }, 'Migrations completed');
      }
      return success(res, { message: 'Database already initialized', tables: existingTables }, 'Setup already completed');
    }

    const schema = `
      CREATE TABLE Roles (role_id INT IDENTITY(1,1) PRIMARY KEY, role_name VARCHAR(30) NOT NULL UNIQUE, description VARCHAR(255), created_at DATETIME2 DEFAULT GETUTCDATE());
      CREATE TABLE Users (user_id INT IDENTITY PRIMARY KEY, role_id INT NOT NULL, leader_id INT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, phone VARCHAR(20), password_hash VARCHAR(255) NOT NULL, is_active BIT DEFAULT 1, last_login DATETIME2, created_at DATETIME2 DEFAULT GETUTCDATE(), updated_at DATETIME2 DEFAULT GETUTCDATE(), deleted_at DATETIME2 NULL, CONSTRAINT FK_Users_Role FOREIGN KEY (role_id) REFERENCES Roles(role_id), CONSTRAINT FK_Users_Leader FOREIGN KEY (leader_id) REFERENCES Users(user_id));
      CREATE TABLE Departments (department_id INT IDENTITY PRIMARY KEY, department_name VARCHAR(100) NOT NULL UNIQUE, is_active BIT DEFAULT 1, created_at DATETIME2 DEFAULT GETUTCDATE());
      CREATE TABLE Batches (batch_id INT IDENTITY PRIMARY KEY, batch_year VARCHAR(10) NOT NULL UNIQUE, is_active BIT DEFAULT 1, created_at DATETIME2 DEFAULT GETUTCDATE());
      CREATE TABLE Teams (team_id INT IDENTITY PRIMARY KEY, team_name VARCHAR(200) NOT NULL, leader_id INT NOT NULL, is_active BIT DEFAULT 1, distribution_locked BIT DEFAULT 0, created_at DATETIME2 DEFAULT GETUTCDATE(), updated_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_Teams_Leader FOREIGN KEY (leader_id) REFERENCES Users(user_id));
      CREATE TABLE TeamMembers (team_member_id INT IDENTITY PRIMARY KEY, team_id INT NOT NULL, user_id INT NOT NULL, assigned_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_TM_Team FOREIGN KEY (team_id) REFERENCES Teams(team_id), CONSTRAINT FK_TM_User FOREIGN KEY (user_id) REFERENCES Users(user_id), CONSTRAINT UQ_Team_User UNIQUE (team_id, user_id));
      CREATE TABLE Alumni (alumni_id INT IDENTITY PRIMARY KEY, register_no VARCHAR(30) UNIQUE, name VARCHAR(150) NOT NULL, gender VARCHAR(10), date_of_birth VARCHAR(20), batch VARCHAR(10), department VARCHAR(50), email VARCHAR(150), phone VARCHAR(20), company VARCHAR(200), designation VARCHAR(200), working_details VARCHAR(500), linkedin_profile VARCHAR(255), is_updated BIT DEFAULT 0, updated_date DATETIME2, created_at DATETIME2 DEFAULT GETUTCDATE());
      CREATE TABLE ProfessionalInformation (info_id INT IDENTITY PRIMARY KEY, alumni_id INT NOT NULL, company VARCHAR(200), designation VARCHAR(200), current_city VARCHAR(100), state VARCHAR(100), country VARCHAR(100), email VARCHAR(150), phone VARCHAR(20), linkedin_url VARCHAR(500), higher_studies VARCHAR(200), is_entrepreneur BIT DEFAULT 0, is_government_job BIT DEFAULT 0, other_occupation VARCHAR(200), remarks VARCHAR(MAX), updated_by INT NOT NULL, updated_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_PI_Alumni FOREIGN KEY (alumni_id) REFERENCES Alumni(alumni_id), CONSTRAINT FK_PI_UpdatedBy FOREIGN KEY (updated_by) REFERENCES Users(user_id));
      CREATE TABLE AlumniAssignments (assignment_id INT IDENTITY PRIMARY KEY, alumni_id INT NOT NULL, team_id INT NOT NULL, member_id INT NOT NULL, status VARCHAR(30) DEFAULT 'Pending', assigned_date DATETIME2 DEFAULT GETUTCDATE(), completed_date DATETIME2 NULL, CONSTRAINT FK_AA_Alumni FOREIGN KEY (alumni_id) REFERENCES Alumni(alumni_id), CONSTRAINT FK_AA_Team FOREIGN KEY (team_id) REFERENCES Teams(team_id), CONSTRAINT FK_AA_Member FOREIGN KEY (member_id) REFERENCES Users(user_id));
      CREATE TABLE ImportHistory (import_id INT IDENTITY PRIMARY KEY, file_name VARCHAR(500) NOT NULL, total_rows INT DEFAULT 0, imported INT DEFAULT 0, duplicates INT DEFAULT 0, errors INT DEFAULT 0, error_details VARCHAR(MAX), imported_by INT NOT NULL, status VARCHAR(30) DEFAULT 'Completed', created_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_IH_ImportedBy FOREIGN KEY (imported_by) REFERENCES Users(user_id));
      CREATE TABLE AuditLogs (audit_id INT IDENTITY PRIMARY KEY, user_id INT NULL, username VARCHAR(100), role_name VARCHAR(30), action VARCHAR(100) NOT NULL, target VARCHAR(255), description VARCHAR(MAX), ip_address VARCHAR(50), user_agent VARCHAR(500), status VARCHAR(30) DEFAULT 'Success', created_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_AL_User FOREIGN KEY (user_id) REFERENCES Users(user_id));
      CREATE TABLE ActivityLogs (activity_id INT IDENTITY PRIMARY KEY, user_id INT NOT NULL, activity_type VARCHAR(100) NOT NULL, description VARCHAR(MAX), metadata VARCHAR(MAX), created_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_ActL_User FOREIGN KEY (user_id) REFERENCES Users(user_id));
      CREATE TABLE Reports (report_id INT IDENTITY PRIMARY KEY, report_name VARCHAR(500) NOT NULL, report_type VARCHAR(100) NOT NULL, parameters VARCHAR(MAX), format VARCHAR(30) DEFAULT 'excel', file_path VARCHAR(500), generated_by INT NOT NULL, status VARCHAR(30) DEFAULT 'Pending', created_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_R_GeneratedBy FOREIGN KEY (generated_by) REFERENCES Users(user_id));
      CREATE TABLE ScheduledReports (schedule_id INT IDENTITY PRIMARY KEY, report_name VARCHAR(500) NOT NULL, report_type VARCHAR(100) NOT NULL, frequency VARCHAR(30) NOT NULL, parameters VARCHAR(MAX), next_run DATETIME2, is_active BIT DEFAULT 1, created_by INT NOT NULL, created_at DATETIME2 DEFAULT GETUTCDATE(), CONSTRAINT FK_SR_CreatedBy FOREIGN KEY (created_by) REFERENCES Users(user_id));
      CREATE TABLE SystemSettings (setting_id INT IDENTITY PRIMARY KEY, setting_key VARCHAR(100) NOT NULL UNIQUE, setting_value VARCHAR(MAX), setting_group VARCHAR(100), created_at DATETIME2 DEFAULT GETUTCDATE(), updated_at DATETIME2 DEFAULT GETUTCDATE());
      CREATE TABLE EmailNotifications (notification_id INT IDENTITY PRIMARY KEY, recipient_email VARCHAR(255) NOT NULL, subject VARCHAR(500) NOT NULL, body VARCHAR(MAX), status VARCHAR(30) DEFAULT 'Pending', sent_at DATETIME2, error_message VARCHAR(MAX), created_at DATETIME2 DEFAULT GETUTCDATE());
    `;

    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      await pool.request().query(stmt + ';');
    }
    results.push('Tables created');

    await pool.request().query(`
      INSERT INTO Roles (role_name, description) VALUES
      ('ADMIN', 'System administrator with full access'),
      ('LEADER', 'Team leader who manages team workflow'),
      ('MEMBER', 'Team member who updates alumni records')
    `);
    results.push('Roles seeded');

    await pool.request().query(`
      INSERT INTO Departments (department_name) VALUES
      ('Computer Science'), ('Electronics'), ('Electrical'),
      ('Mechanical'), ('Civil'), ('Information Technology')
    `);
    results.push('Departments seeded');

    await pool.request().query(`
      INSERT INTO Batches (batch_year) VALUES
      ('2020'), ('2021'), ('2022'), ('2023'), ('2024')
    `);
    results.push('Batches seeded');

    const adminHash = await hashPassword('admin123');
    await pool.request()
      .input('hash', sql.NVarChar(255), adminHash)
      .query(`INSERT INTO Users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (1, 'System', 'Admin', 'admin', @hash, 1)`);
    results.push('Admin user created (email: admin, password: admin123)');

    await pool.request().query(`
      INSERT INTO SystemSettings (setting_key, setting_value, setting_group) VALUES
      ('session_timeout_minutes', '30', 'security'),
      ('password_min_length', '8', 'security'),
      ('max_login_attempts', '5', 'security'),
      ('lockout_duration_minutes', '15', 'security'),
      ('site_name', 'APIUMS', 'general'),
      ('college_name', 'Example College of Engineering', 'general')
    `);
    results.push('System settings seeded');

    logger.info('Database setup completed successfully');
    success(res, { results }, 'Database initialized successfully');
  } catch (err) {
    logger.error('Database setup failed', { error: err.message });
    next(err);
  }
}

module.exports = { runSetup };
