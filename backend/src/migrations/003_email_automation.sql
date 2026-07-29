IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.EmailCampaigns'))
BEGIN
    CREATE TABLE dbo.EmailCampaigns (
        campaign_id INT IDENTITY PRIMARY KEY,
        leader_id INT NOT NULL REFERENCES dbo.Users(user_id),
        team_id INT NOT NULL REFERENCES dbo.Teams(team_id),
        total_recipients INT NOT NULL,
        sent_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        status VARCHAR(30) DEFAULT 'Queued', -- Queued, InProgress, Completed, Failed
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        completed_at DATETIME2 NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.EmailCampaignRecipients'))
BEGIN
    CREATE TABLE dbo.EmailCampaignRecipients (
        recipient_id INT IDENTITY PRIMARY KEY,
        campaign_id INT NOT NULL REFERENCES dbo.EmailCampaigns(campaign_id),
        assignment_id INT NOT NULL REFERENCES dbo.AlumniAssignments(assignment_id),
        alumni_id INT NOT NULL REFERENCES dbo.Alumni(alumni_id),
        email VARCHAR(255) NOT NULL,
        status VARCHAR(30) DEFAULT 'Pending', -- Pending, Sent, Failed, Bounced
        message_id VARCHAR(255) NULL,
        sent_at DATETIME2 NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('dbo.AlumniReplies'))
BEGIN
    CREATE TABLE dbo.AlumniReplies (
        reply_id INT IDENTITY PRIMARY KEY,
        assignment_id INT NOT NULL REFERENCES dbo.AlumniAssignments(assignment_id),
        alumni_id INT NOT NULL REFERENCES dbo.Alumni(alumni_id),
        raw_reply_text NVARCHAR(MAX) NOT NULL,
        received_at DATETIME2 DEFAULT GETUTCDATE(),
        review_status VARCHAR(30) DEFAULT 'Pending Review', -- Pending Review, Reviewed
        reviewed_by INT NULL REFERENCES dbo.Users(user_id),
        reviewed_at DATETIME2 NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.AlumniReplies') AND name = 'IX_AlumniReplies_Assignment')
BEGIN
    CREATE INDEX IX_AlumniReplies_Assignment ON dbo.AlumniReplies(assignment_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.EmailCampaignRecipients') AND name = 'IX_EmailCampaignRecipients_Campaign')
BEGIN
    CREATE INDEX IX_EmailCampaignRecipients_Campaign ON dbo.EmailCampaignRecipients(campaign_id);
END
