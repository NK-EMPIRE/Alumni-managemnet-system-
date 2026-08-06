-- Migration 008: High-Performance Database Indexes for 10,000+ Alumni Scaling
-- Created: 2026-08-06

-- 1. Index on Alumni for filtering & search
IF NOT EXISTS (
  SELECT * FROM sys.indexes 
  WHERE name = 'IX_Alumni_Analysis_Search' AND object_id = OBJECT_ID('dbo.Alumni')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_Alumni_Analysis_Search
  ON dbo.Alumni (department, batch, is_updated)
  INCLUDE (register_no, name, company, designation, city, state, country, working_details);
END;

-- 2. Index on ProfessionalInformation for join & role filtering
IF NOT EXISTS (
  SELECT * FROM sys.indexes 
  WHERE name = 'IX_ProfInfo_Alumni_Join' AND object_id = OBJECT_ID('dbo.ProfessionalInformation')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_ProfInfo_Alumni_Join
  ON dbo.ProfessionalInformation (alumni_id, info_id DESC)
  INCLUDE (company, designation, current_city, state, country, is_government_job, is_entrepreneur, higher_studies);
END;

-- 3. Index on AlumniAssignments for team & member scoping
IF NOT EXISTS (
  SELECT * FROM sys.indexes 
  WHERE name = 'IX_AlumniAssignments_Scoping' AND object_id = OBJECT_ID('dbo.AlumniAssignments')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_AlumniAssignments_Scoping
  ON dbo.AlumniAssignments (alumni_id, assigned_date DESC)
  INCLUDE (team_id, member_id, status);
END;
