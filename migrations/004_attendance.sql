-- Migration 004: Auto Attendance System (Tuesday login tracking)

-- 1. Create Attendance table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.Attendance') AND type = 'U')
BEGIN
  CREATE TABLE dbo.Attendance (
    attendance_id   INT IDENTITY(1,1) PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES dbo.Users(user_id),
    attendance_date DATE NOT NULL,
    login_time      DATETIME2 NULL,
    status          VARCHAR(10) NOT NULL DEFAULT 'Absent',
    marked_by       VARCHAR(20) NOT NULL DEFAULT 'system',
    notes           VARCHAR(200) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Attendance_UserDate UNIQUE (user_id, attendance_date)
  );

  CREATE INDEX IX_Attendance_Date ON dbo.Attendance(attendance_date);
  CREATE INDEX IX_Attendance_User ON dbo.Attendance(user_id);
  CREATE INDEX IX_Attendance_Status ON dbo.Attendance(status, attendance_date);
END
