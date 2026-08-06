-- Migration 011: Master Data Governance & Auto-Learning Approval Queue
-- Created: 2026-08-06

-- 1. Upgrade Companies Table with Governance Columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'status')
BEGIN
  ALTER TABLE dbo.Companies ADD status VARCHAR(20) DEFAULT 'Approved' NOT NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'created_by')
BEGIN
  ALTER TABLE dbo.Companies ADD created_by INT NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'approved_by')
BEGIN
  ALTER TABLE dbo.Companies ADD approved_by INT NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'approved_at')
BEGIN
  ALTER TABLE dbo.Companies ADD approved_at DATETIME NULL;
END;

-- 2. Upgrade Designations Table with Governance Columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Designations') AND name = 'status')
BEGIN
  ALTER TABLE dbo.Designations ADD status VARCHAR(20) DEFAULT 'Approved' NOT NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Designations') AND name = 'created_by')
BEGIN
  ALTER TABLE dbo.Designations ADD created_by INT NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Designations') AND name = 'approved_by')
BEGIN
  ALTER TABLE dbo.Designations ADD approved_by INT NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Designations') AND name = 'approved_at')
BEGIN
  ALTER TABLE dbo.Designations ADD approved_at DATETIME NULL;
END;

-- 3. Create Master Universities Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.Universities'))
BEGIN
  CREATE TABLE dbo.Universities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    normalized_name NVARCHAR(255) NOT NULL UNIQUE,
    country_id INT NULL FOREIGN KEY REFERENCES dbo.Countries(id),
    usage_count INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'Approved' NOT NULL,
    created_by INT NULL,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    created_at DATETIME DEFAULT GETUTCDATE()
  );
  CREATE INDEX IX_Universities_Usage ON dbo.Universities(usage_count DESC, name ASC);
END;

-- Seed common Universities
IF NOT EXISTS (SELECT 1 FROM dbo.Universities WHERE normalized_name = 'annauniversity')
BEGIN
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('Anna University', 'annauniversity', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('IIT Madras', 'iitmadras', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('NIT Trichy', 'nittrichy', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('VIT', 'vit', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('SRM Institute of Science and Technology', 'srminstituteofscienceandtechnology', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('MIT', 'mit', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('Stanford University', 'stanforduniversity', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('Harvard University', 'harvarduniversity', 'Approved');
  INSERT INTO dbo.Universities (name, normalized_name, status) VALUES ('University of Oxford', 'universityofoxford', 'Approved');
END;

-- 4. Add University Columns to ProfessionalInformation and Alumni
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'university')
BEGIN
  ALTER TABLE dbo.ProfessionalInformation ADD university NVARCHAR(255) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'university')
BEGIN
  ALTER TABLE dbo.Alumni ADD university NVARCHAR(255) NULL;
END;
