-- Migration 002: Consolidate Database Schema alterations

-- 1. Users Table Columns
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'department'
)
BEGIN
    ALTER TABLE dbo.Users ADD department VARCHAR(100) NULL;
END

-- 2. Alumni Table Columns
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'date_of_birth'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD date_of_birth VARCHAR(20) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'working_details'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD working_details VARCHAR(500) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'linkedin_profile'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD linkedin_profile VARCHAR(255) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'experience'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD experience VARCHAR(50) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'salary'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD salary VARCHAR(50) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'city'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD city VARCHAR(100) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'country'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD country VARCHAR(100) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'address'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD address VARCHAR(500) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'state'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD state VARCHAR(100) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'secondary_phone'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD secondary_phone VARCHAR(50) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'secondary_email'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD secondary_email VARCHAR(150) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'faculty_assigned'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD faculty_assigned VARCHAR(150) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'father_name'
)
BEGIN
    ALTER TABLE dbo.Alumni ADD father_name VARCHAR(150) NULL;
END

-- 3. Widening Phone Columns
IF EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'phone' AND max_length < 50
)
BEGIN
    ALTER TABLE dbo.Alumni ALTER COLUMN phone VARCHAR(50) NULL;
END

IF EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'phone' AND max_length < 50
)
BEGIN
    ALTER TABLE dbo.ProfessionalInformation ALTER COLUMN phone VARCHAR(50) NULL;
END

-- 4. ProfessionalInformation Columns
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'father_name'
)
BEGIN
    ALTER TABLE dbo.ProfessionalInformation ADD father_name VARCHAR(150) NULL;
END

-- 5. ImportHistory Columns
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.ImportHistory') AND name = 'merged'
)
BEGIN
    ALTER TABLE dbo.ImportHistory ADD merged INT DEFAULT 0;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.ImportHistory') AND name = 'skipped'
)
BEGIN
    ALTER TABLE dbo.ImportHistory ADD skipped INT DEFAULT 0;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.ImportHistory') AND name = 'original_name'
)
BEGIN
    ALTER TABLE dbo.ImportHistory ADD original_name VARCHAR(500) NULL;
END

-- 6. AlumniAssignments Columns & Constraints
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'assigned_by'
)
BEGIN
    ALTER TABLE dbo.AlumniAssignments ADD assigned_by INT NULL;
    ALTER TABLE dbo.AlumniAssignments ADD CONSTRAINT FK_AA_AssignedBy FOREIGN KEY (assigned_by) REFERENCES dbo.Users(user_id);
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'assignment_type'
)
BEGIN
    ALTER TABLE dbo.AlumniAssignments ADD assignment_type VARCHAR(50) NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'reassignment_reason'
)
BEGIN
    ALTER TABLE dbo.AlumniAssignments ADD reassignment_reason VARCHAR(500) NULL;
END

IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.AlumniAssignments') AND name = 'member_id' AND is_nullable = 0
)
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_AA_Member' AND parent_object_id = OBJECT_ID('dbo.AlumniAssignments'))
    BEGIN
        ALTER TABLE dbo.AlumniAssignments DROP CONSTRAINT FK_AA_Member;
    END
    
    ALTER TABLE dbo.AlumniAssignments ALTER COLUMN member_id INT NULL;
    ALTER TABLE dbo.AlumniAssignments ADD CONSTRAINT FK_AA_Member FOREIGN KEY (member_id) REFERENCES dbo.Users(user_id);
END

IF NOT EXISTS (
    SELECT * FROM sys.objects 
    WHERE parent_object_id = OBJECT_ID('dbo.AlumniAssignments') AND type = 'UQ' AND name = 'UQ_AlumniAssignments_Alumni'
)
BEGIN
    -- Delete duplicates first to avoid violation
    WITH cte AS (
        SELECT assignment_id, ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) as rn
        FROM dbo.AlumniAssignments
    )
    DELETE FROM dbo.AlumniAssignments WHERE assignment_id IN (SELECT assignment_id FROM cte WHERE rn > 1);

    ALTER TABLE dbo.AlumniAssignments ADD CONSTRAINT UQ_AlumniAssignments_Alumni UNIQUE (alumni_id);
END

-- 7. FacultyAliases Table and Unique Constraint Update
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.FacultyAliases') AND type = 'UQ')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.FacultyAliases') AND type = 'U')
    BEGIN
        CREATE TABLE dbo.FacultyAliases (
            alias_id INT IDENTITY(1,1) PRIMARY KEY,
            faculty_id INT NOT NULL,
            alias_name VARCHAR(255) NOT NULL,
            CONSTRAINT FK_FacultyAliases_Users FOREIGN KEY (faculty_id) REFERENCES dbo.Users(user_id)
        );
    END

    -- Dynamic drop of any unique constraint on alias_name
    DECLARE @ConstraintName NVARCHAR(200);
    SELECT TOP 1 @ConstraintName = name
    FROM sys.objects
    WHERE parent_object_id = OBJECT_ID('dbo.FacultyAliases') AND type = 'UQ';

    IF @ConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE dbo.FacultyAliases DROP CONSTRAINT ' + @ConstraintName);
    END

    -- Add composite unique constraint
    IF NOT EXISTS (
        SELECT * FROM sys.objects 
        WHERE parent_object_id = OBJECT_ID('dbo.FacultyAliases') AND type = 'UQ' AND name = 'UQ_FacultyAliases_Faculty_Alias'
    )
    BEGIN
        ALTER TABLE dbo.FacultyAliases ADD CONSTRAINT UQ_FacultyAliases_Faculty_Alias UNIQUE (faculty_id, alias_name);
    END
END
