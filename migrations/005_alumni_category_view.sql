-- Migration 005: Alumni Category Performance Indexes

-- Index to speed up category group-by queries on Alumni table
IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'IX_Alumni_Category_Fields'
)
BEGIN
  CREATE INDEX IX_Alumni_Category_Fields
  ON dbo.Alumni(designation, department, batch, company)
  INCLUDE (alumni_id, name, city, working_details, email, phone, experience);
END

-- Index on ProfessionalInformation for government job lookups
IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'IX_ProfInfo_GovtJob'
)
BEGIN
  CREATE INDEX IX_ProfInfo_GovtJob
  ON dbo.ProfessionalInformation(is_government_job, alumni_id)
  INCLUDE (designation, company, current_city, is_entrepreneur, higher_studies, other_occupation);
END
