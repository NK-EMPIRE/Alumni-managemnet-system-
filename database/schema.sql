-- ============================================================
-- Alumni Professional Information Update Management System
-- COMPLETE DATABASE SCHEMA for Microsoft SQL Server
-- Run this in SSMS against your database
-- ============================================================

-- Drop existing tables (order matters for FK constraints)
IF OBJECT_ID('dbo.EmailNotifications', 'U') IS NOT NULL DROP TABLE dbo.EmailNotifications;
IF OBJECT_ID('dbo.SystemSettings', 'U') IS NOT NULL DROP TABLE dbo.SystemSettings;
IF OBJECT_ID('dbo.ScheduledReports', 'U') IS NOT NULL DROP TABLE dbo.ScheduledReports;
IF OBJECT_ID('dbo.Reports', 'U') IS NOT NULL DROP TABLE dbo.Reports;
IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NOT NULL DROP TABLE dbo.ActivityLogs;
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
IF OBJECT_ID('dbo.ImportHistory', 'U') IS NOT NULL DROP TABLE dbo.ImportHistory;
IF OBJECT_ID('dbo.AlumniAssignments', 'U') IS NOT NULL DROP TABLE dbo.AlumniAssignments;
IF OBJECT_ID('dbo.ProfessionalInformation', 'U') IS NOT NULL DROP TABLE dbo.ProfessionalInformation;
IF OBJECT_ID('dbo.Alumni', 'U') IS NOT NULL DROP TABLE dbo.Alumni;
IF OBJECT_ID('dbo.TeamMembers', 'U') IS NOT NULL DROP TABLE dbo.TeamMembers;
IF OBJECT_ID('dbo.Teams', 'U') IS NOT NULL DROP TABLE dbo.Teams;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE dbo.Roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL,
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Roles_role_name UNIQUE (role_name)
);

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE dbo.Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL,
    leader_id INT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BIT DEFAULT 1,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    deleted_at DATETIME NULL,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (role_id) REFERENCES dbo.Roles(role_id),
    CONSTRAINT FK_Users_Leader FOREIGN KEY (leader_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT UQ_Users_email UNIQUE (email)
);

-- ============================================================
-- 3. TEAMS
-- ============================================================
CREATE TABLE dbo.Teams (
    team_id INT IDENTITY(1,1) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    leader_id INT NOT NULL,
    is_active BIT DEFAULT 1,
    distribution_locked BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Teams_Leader FOREIGN KEY (leader_id) REFERENCES dbo.Users(user_id)
);

-- ============================================================
-- 4. TEAM MEMBERS
-- ============================================================
CREATE TABLE dbo.TeamMembers (
    team_member_id INT IDENTITY(1,1) PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_TeamMembers_Teams FOREIGN KEY (team_id) REFERENCES dbo.Teams(team_id),
    CONSTRAINT FK_TeamMembers_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT UQ_TeamMembers_User UNIQUE (team_id, user_id)
);

-- ============================================================
-- 5. ALUMNI (core table)
-- ============================================================
CREATE TABLE dbo.Alumni (
    alumni_id INT IDENTITY(1,1) PRIMARY KEY,
    register_no VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) NULL,
    batch VARCHAR(10) NULL,
    department VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    company VARCHAR(200) NULL,
    designation VARCHAR(200) NULL,
    working_details VARCHAR(500) NULL,
    linkedin_profile VARCHAR(255) NULL,
    is_updated BIT DEFAULT 0,
    updated_date DATETIME NULL,
    created_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Alumni_register_no UNIQUE (register_no)
);

-- ============================================================
-- 6. PROFESSIONAL INFORMATION (update history)
-- ============================================================
CREATE TABLE dbo.ProfessionalInformation (
    info_id INT IDENTITY(1,1) PRIMARY KEY,
    alumni_id INT NOT NULL,
    company VARCHAR(200) NULL,
    designation VARCHAR(200) NULL,
    current_city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    linkedin_url VARCHAR(255) NULL,
    higher_studies VARCHAR(200) NULL,
    is_entrepreneur BIT DEFAULT 0,
    is_government_job BIT DEFAULT 0,
    other_occupation VARCHAR(200) NULL,
    remarks VARCHAR(500) NULL,
    updated_by INT NOT NULL,
    updated_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ProfessionalInfo_Alumni FOREIGN KEY (alumni_id) REFERENCES dbo.Alumni(alumni_id),
    CONSTRAINT FK_ProfessionalInfo_UpdatedBy FOREIGN KEY (updated_by) REFERENCES dbo.Users(user_id)
);

-- ============================================================
-- 7. ALUMNI ASSIGNMENTS (tracks which member handles which alumni)
-- ============================================================
CREATE TABLE dbo.AlumniAssignments (
    assignment_id INT IDENTITY(1,1) PRIMARY KEY,
    alumni_id INT NOT NULL,
    team_id INT NOT NULL,
    member_id INT NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending' NOT NULL,
    assigned_date DATETIME DEFAULT GETUTCDATE(),
    completed_date DATETIME NULL,
    CONSTRAINT FK_AlumniAssignments_Alumni FOREIGN KEY (alumni_id) REFERENCES dbo.Alumni(alumni_id),
    CONSTRAINT FK_AlumniAssignments_Team FOREIGN KEY (team_id) REFERENCES dbo.Teams(team_id),
    CONSTRAINT FK_AlumniAssignments_Member FOREIGN KEY (member_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT CK_AlumniAssignments_status CHECK (status IN ('Pending', 'Draft', 'Completed'))
);

-- ============================================================
-- 8. IMPORT HISTORY
-- ============================================================
CREATE TABLE dbo.ImportHistory (
    import_id INT IDENTITY(1,1) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    total_rows INT DEFAULT 0,
    imported INT DEFAULT 0,
    duplicates INT DEFAULT 0,
    errors INT DEFAULT 0,
    error_details VARCHAR(MAX) NULL,
    imported_by INT NOT NULL,
    status VARCHAR(30) DEFAULT 'Completed',
    created_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ImportHistory_User FOREIGN KEY (imported_by) REFERENCES dbo.Users(user_id)
);

-- ============================================================
-- 9. AUDIT LOGS
-- ============================================================
CREATE TABLE dbo.AuditLogs (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(100) NULL,
    role_name VARCHAR(30) NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NULL,
    description VARCHAR(MAX) NULL,
    ip_address VARCHAR(50) NULL,
    user_agent VARCHAR(500) NULL,
    status VARCHAR(30) DEFAULT 'Success',
    created_at DATETIME DEFAULT GETUTCDATE()
);

-- ============================================================
-- 10. ACTIVITY LOGS
-- ============================================================
CREATE TABLE dbo.ActivityLogs (
    activity_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description VARCHAR(MAX) NULL,
    metadata VARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ActivityLogs_User FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id)
);

-- ============================================================
-- 11. REPORTS
-- ============================================================
CREATE TABLE dbo.Reports (
    report_id INT IDENTITY(1,1) PRIMARY KEY,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    parameters VARCHAR(MAX) NULL,
    format VARCHAR(20) DEFAULT 'PDF',
    file_path VARCHAR(500) NULL,
    generated_by INT NULL,
    status VARCHAR(30) DEFAULT 'Pending',
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Reports_GeneratedBy FOREIGN KEY (generated_by) REFERENCES dbo.Users(user_id)
);

-- ============================================================
-- 12. SCHEDULED REPORTS
-- ============================================================
CREATE TABLE dbo.ScheduledReports (
    schedule_id INT IDENTITY(1,1) PRIMARY KEY,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    parameters VARCHAR(MAX) NULL,
    next_run DATETIME NULL,
    created_by INT NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ScheduledReports_CreatedBy FOREIGN KEY (created_by) REFERENCES dbo.Users(user_id),
    CONSTRAINT CK_ScheduledReports_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly'))
);

-- ============================================================
-- 13. SYSTEM SETTINGS
-- ============================================================
CREATE TABLE dbo.SystemSettings (
    setting_id INT IDENTITY(1,1) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value VARCHAR(MAX) NOT NULL,
    setting_group VARCHAR(50) NULL,
    created_at DATETIME DEFAULT GETUTCDATE(),
    updated_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_SystemSettings_key UNIQUE (setting_key)
);

-- ============================================================
-- 14. EMAIL NOTIFICATIONS
-- ============================================================
CREATE TABLE dbo.EmailNotifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    recipient_email VARCHAR(150) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body VARCHAR(MAX) NULL,
    sent_status VARCHAR(30) DEFAULT 'Pending',
    sent_at DATETIME NULL,
    error_message VARCHAR(500) NULL,
    created_at DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_EmailNotifications_User FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IX_Users_email ON dbo.Users(email);
CREATE INDEX IX_Users_role_id ON dbo.Users(role_id);
CREATE INDEX IX_Users_leader_id ON dbo.Users(leader_id);
CREATE INDEX IX_Users_is_active ON dbo.Users(is_active);
CREATE INDEX IX_Alumni_register_no ON dbo.Alumni(register_no);
CREATE INDEX IX_Alumni_department ON dbo.Alumni(department);
CREATE INDEX IX_Alumni_batch ON dbo.Alumni(batch);
CREATE INDEX IX_AlumniAssignments_member ON dbo.AlumniAssignments(member_id);
CREATE INDEX IX_AlumniAssignments_status ON dbo.AlumniAssignments(status);
CREATE INDEX IX_AlumniAssignments_team ON dbo.AlumniAssignments(team_id);
CREATE INDEX IX_AuditLogs_action ON dbo.AuditLogs(action);
CREATE INDEX IX_AuditLogs_created ON dbo.AuditLogs(created_at);
CREATE INDEX IX_ActivityLogs_user ON dbo.ActivityLogs(user_id);
CREATE INDEX IX_ActivityLogs_created ON dbo.ActivityLogs(created_at);
CREATE INDEX IX_Reports_type ON dbo.Reports(report_type);
CREATE INDEX IX_ImportHistory_created ON dbo.ImportHistory(created_at);
CREATE INDEX IX_TeamMembers_team ON dbo.TeamMembers(team_id);
CREATE INDEX IX_Teams_leader ON dbo.Teams(leader_id);
CREATE INDEX IX_ProfessionalInformation_alumni ON dbo.ProfessionalInformation(alumni_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles
IF NOT EXISTS (SELECT 1 FROM dbo.Roles)
BEGIN
    INSERT INTO dbo.Roles (role_name) VALUES ('ADMIN');
    INSERT INTO dbo.Roles (role_name) VALUES ('LEADER');
    INSERT INTO dbo.Roles (role_name) VALUES ('MEMBER');
END

-- System Settings
IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings)
BEGIN
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('app.name', 'Alumni Professional Information Update Management System', 'general');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('app.version', '1.0.0', 'general');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('app.default_batch', '2024', 'general');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('email.enabled', 'true', 'email');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('email.from_name', 'APIUMS', 'email');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('assignment.max_per_member', '25', 'assignment');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('import.max_file_size', '5MB', 'import');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('session.timeout_minutes', '30', 'security');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('session.max_attempts', '5', 'security');
    INSERT INTO dbo.SystemSettings (setting_key, setting_value, setting_group) VALUES ('notifications.audit_retention_days', '365', 'notifications');
END

-- Default Admin User (password: Admin@123)
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = 'admin@alumni.edu')
BEGIN
    DECLARE @adminRoleId INT;
    SELECT @adminRoleId = role_id FROM dbo.Roles WHERE role_name = 'ADMIN';
    INSERT INTO dbo.Users (role_id, first_name, last_name, email, password_hash, is_active)
    VALUES (@adminRoleId, 'Admin', 'User', 'admin@alumni.edu', '$2a$12$dBdejpulbaoNtO09eSez8eaWYGQbTWPvJ6IFltI9kTCNq.w45w/ZC', 1);
END

PRINT 'Database schema created successfully!';
