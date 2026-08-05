-- Migration 006: Ensure company and designation columns exist on dbo.Alumni
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'company'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD company VARCHAR(200) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'designation'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD designation VARCHAR(200) NULL;
END
