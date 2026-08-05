-- Migration 007: Create LookupDictionary table for user-added typeahead terms
IF NOT EXISTS (
    SELECT * FROM sys.tables 
    WHERE object_id = OBJECT_ID('dbo.LookupDictionary')
)
BEGIN
    CREATE TABLE dbo.LookupDictionary (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category VARCHAR(50) NOT NULL, -- designation, company, city, state, country
        value NVARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT GETUTCDATE()
    );

    CREATE UNIQUE INDEX UX_LookupDictionary_Cat_Val 
    ON dbo.LookupDictionary(category, value);
END
