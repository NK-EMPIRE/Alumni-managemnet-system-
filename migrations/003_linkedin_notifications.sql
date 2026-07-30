-- Migration 003: LinkedIn Auto-Match Notifications

-- 1. Add linkedin_url to Users table (members who log in)
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'linkedin_url'
)
BEGIN
    ALTER TABLE dbo.Users ADD linkedin_url VARCHAR(255) NULL;
END

-- 2. Add linkedin_verified flag to Users table
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'linkedin_verified'
)
BEGIN
    ALTER TABLE dbo.Users ADD linkedin_verified BIT NOT NULL DEFAULT 0;
END

-- 3. Create Notifications table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.Notifications') AND type = 'U')
BEGIN
    CREATE TABLE dbo.Notifications (
        notification_id    INT IDENTITY(1,1) PRIMARY KEY,
        recipient_user_id  INT NOT NULL REFERENCES dbo.Users(user_id),
        sender_user_id     INT NULL     REFERENCES dbo.Users(user_id),
        type               VARCHAR(50)  NOT NULL DEFAULT 'linkedin_match',
        message_text       VARCHAR(500) NOT NULL,
        detected_url       VARCHAR(255) NULL,
        source_message_id  INT NULL     REFERENCES dbo.WorkspaceMessages(message_id),
        is_read            BIT          NOT NULL DEFAULT 0,
        status             VARCHAR(20)  NOT NULL DEFAULT 'pending',
        created_at         DATETIME2    NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Notifications_Recipient ON dbo.Notifications(recipient_user_id, is_read);
END
