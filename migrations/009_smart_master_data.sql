-- Migration 009: Smart Master Data & Career Classification Engine Tables
-- Created: 2026-08-06

-- 1. Master Companies Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.Companies'))
BEGIN
  CREATE TABLE dbo.Companies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_name NVARCHAR(255) NOT NULL,
    normalized_name NVARCHAR(255) NOT NULL UNIQUE,
    industry NVARCHAR(100) NULL,
    usage_count INT DEFAULT 1,
    created_at DATETIME DEFAULT GETUTCDATE()
  );
  CREATE INDEX IX_Companies_Usage ON dbo.Companies(usage_count DESC, company_name ASC);
END;

-- 2. Master Designations Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.Designations'))
BEGIN
  CREATE TABLE dbo.Designations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    normalized_title NVARCHAR(255) NOT NULL UNIQUE,
    category NVARCHAR(100) NULL,
    usage_count INT DEFAULT 1,
    created_at DATETIME DEFAULT GETUTCDATE()
  );
  CREATE INDEX IX_Designations_Usage ON dbo.Designations(usage_count DESC, title ASC);
END;

-- 3. Master Countries Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.Countries'))
BEGIN
  CREATE TABLE dbo.Countries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NULL
  );
END;

-- 4. Master States Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.States'))
BEGIN
  CREATE TABLE dbo.States (
    id INT IDENTITY(1,1) PRIMARY KEY,
    country_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Countries(id),
    name NVARCHAR(100) NOT NULL
  );
  CREATE INDEX IX_States_Country ON dbo.States(country_id, name);
END;

-- 5. Master Districts Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.Districts'))
BEGIN
  CREATE TABLE dbo.Districts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    state_id INT NOT NULL FOREIGN KEY REFERENCES dbo.States(id),
    name NVARCHAR(100) NOT NULL
  );
  CREATE INDEX IX_Districts_State ON dbo.Districts(state_id, name);
END;

-- 6. Master Cities Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.Cities'))
BEGIN
  CREATE TABLE dbo.Cities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    district_id INT NOT NULL FOREIGN KEY REFERENCES dbo.Districts(id),
    name NVARCHAR(100) NOT NULL
  );
  CREATE INDEX IX_Cities_District ON dbo.Cities(district_id, name);
END;

-- 7. Add structured classification columns to dbo.ProfessionalInformation
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'employment_status')
BEGIN
  ALTER TABLE dbo.ProfessionalInformation ADD employment_status VARCHAR(50) DEFAULT 'Working' NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'career_type')
BEGIN
  ALTER TABLE dbo.ProfessionalInformation ADD career_type VARCHAR(50) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'career_category')
BEGIN
  ALTER TABLE dbo.ProfessionalInformation ADD career_category VARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'role_category')
BEGIN
  ALTER TABLE dbo.ProfessionalInformation ADD role_category VARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'district')
BEGIN
  ALTER TABLE dbo.ProfessionalInformation ADD district NVARCHAR(100) NULL;
END;

-- 8. Add structured classification columns to dbo.Alumni
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'employment_status')
BEGIN
  ALTER TABLE dbo.Alumni ADD employment_status VARCHAR(50) DEFAULT 'Working' NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'career_type')
BEGIN
  ALTER TABLE dbo.Alumni ADD career_type VARCHAR(50) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'career_category')
BEGIN
  ALTER TABLE dbo.Alumni ADD career_category VARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'role_category')
BEGIN
  ALTER TABLE dbo.Alumni ADD role_category VARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'district')
BEGIN
  ALTER TABLE dbo.Alumni ADD district NVARCHAR(100) NULL;
END;
