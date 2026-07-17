-- Migration 001: Add resolved_faculty_user_id to Alumni table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'resolved_faculty_user_id'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD resolved_faculty_user_id INT NULL;
END
