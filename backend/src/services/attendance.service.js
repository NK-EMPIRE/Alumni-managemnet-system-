const { sql, getPool } = require('../config/database');

// IST offset = UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(utcDate) {
  return new Date(utcDate.getTime() + IST_OFFSET_MS);
}

function isTuesday(date) {
  return date.getDay() === 2; // 0=Sun, 2=Tue
}

/**
 * Called on every login. Records attendance if today is Tuesday and within window.
 * Window: 13:15 – 14:45 IST
 * Present: 13:15 – 13:30 IST
 * Late:    13:30 – 14:45 IST
 * Outside window: do nothing
 */
async function recordLoginAttendance(userId, role) {
  // Track all active users including ADMIN, LEADER, MEMBER
  const nowUTC = new Date();
  const nowIST = toIST(nowUTC);

  if (!isTuesday(nowIST)) return;

  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const windowStart = 13 * 60 + 15; // 13:15
  const onTimeEnd   = 13 * 60 + 30; // 13:30
  const windowEnd   = 14 * 60 + 45; // 14:45

  if (totalMinutes < windowStart || totalMinutes > windowEnd) return;

  const status = totalMinutes <= onTimeEnd ? 'Present' : 'Late';
  const attendanceDate = nowIST.toISOString().slice(0, 10); // YYYY-MM-DD

  const pool = await getPool();
  await pool.request()
    .input('userId', sql.Int, userId)
    .input('attendanceDate', sql.Date, new Date(attendanceDate))
    .input('loginTime', sql.DateTime2, nowUTC)
    .input('status', sql.VarChar(10), status)
    .query(`
      IF NOT EXISTS (
        SELECT 1 FROM dbo.Attendance
        WHERE user_id = @userId AND attendance_date = @attendanceDate
      )
      BEGIN
        INSERT INTO dbo.Attendance (user_id, attendance_date, login_time, status, marked_by)
        VALUES (@userId, @attendanceDate, @loginTime, @status, 'system');
      END
    `);
}

/**
 * Mark all active users (ADMIN, LEADER, MEMBER) who have NO record for the given Tuesday as Absent.
 * @param {string} dateStr - YYYY-MM-DD (must be a Tuesday)
 */
async function markAbsentees(dateStr) {
  const pool = await getPool();

  // Validate it's a Tuesday
  const d = new Date(dateStr);
  const istD = toIST(d);
  if (!isTuesday(istD) && !isTuesday(d)) {
    // Still allow admin to force-mark for any date
  }

  const result = await pool.request()
    .input('targetDate', sql.Date, new Date(dateStr))
    .query(`
      INSERT INTO dbo.Attendance (user_id, attendance_date, login_time, status, marked_by)
      SELECT u.user_id, @targetDate, NULL, 'Absent', 'system'
      FROM dbo.Users u
      WHERE u.is_active = 1
        AND NOT EXISTS (
          SELECT 1 FROM dbo.Attendance a
          WHERE a.user_id = u.user_id AND a.attendance_date = @targetDate
        )
    `);

  return { markedAbsent: result.rowsAffected[0] };
}

/**
 * Get paginated attendance report.
 */
async function getReport({ page = 1, limit = 50, date, userId, status, role }) {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  const pool = await getPool();
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limitNum)
    .input('filterDate', sql.Date, date ? new Date(date) : null)
    .input('filterUserId', sql.Int, userId ? parseInt(userId, 10) : null)
    .input('filterStatus', sql.VarChar(10), status || null)
    .input('filterRole', sql.VarChar(20), role || null);

  const result = await request.query(`
    WITH Att AS (
      SELECT
        a.attendance_id,
        a.user_id,
        u.first_name + ' ' + u.last_name AS user_name,
        r.role_name AS role,
        u.department,
        a.attendance_date,
        a.login_time,
        a.status,
        a.marked_by,
        a.notes,
        a.updated_at,
        COUNT(*) OVER() AS total_count
      FROM dbo.Attendance a
      JOIN dbo.Users u ON u.user_id = a.user_id
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      WHERE (@filterDate IS NULL OR a.attendance_date = @filterDate)
        AND (@filterUserId IS NULL OR a.user_id = @filterUserId)
        AND (@filterStatus IS NULL OR a.status = @filterStatus)
        AND (@filterRole IS NULL OR r.role_name = @filterRole)
    )
    SELECT * FROM Att
    ORDER BY attendance_date DESC, user_name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const data = result.recordset;
  const totalCount = data.length > 0 ? data[0].total_count : 0;
  return { data, totalCount, page: pageNum, limit: limitNum };
}

/**
 * Get attendance summary (counts per date).
 */
async function getSummary(date) {
  const pool = await getPool();
  const request = pool.request()
    .input('filterDate', sql.Date, date ? new Date(date) : null);

  const result = await request.query(`
    SELECT
      a.attendance_date,
      SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
      SUM(CASE WHEN a.status = 'Late'    THEN 1 ELSE 0 END) AS late_count,
      SUM(CASE WHEN a.status = 'Absent'  THEN 1 ELSE 0 END) AS absent_count,
      COUNT(*) AS total_count
    FROM dbo.Attendance a
    WHERE (@filterDate IS NULL OR a.attendance_date = @filterDate)
    GROUP BY a.attendance_date
    ORDER BY a.attendance_date DESC;
  `);

  return result.recordset;
}

/**
 * Admin override: update a specific attendance record.
 */
async function updateRecord(attendanceId, { status, notes }) {
  const pool = await getPool();
  await pool.request()
    .input('attendanceId', sql.Int, attendanceId)
    .input('status', sql.VarChar(10), status)
    .input('notes', sql.VarChar(200), notes || null)
    .query(`
      UPDATE dbo.Attendance
      SET status = @status, notes = @notes, marked_by = 'admin', updated_at = GETUTCDATE()
      WHERE attendance_id = @attendanceId
    `);

  const updated = await pool.request()
    .input('attendanceId', sql.Int, attendanceId)
    .query('SELECT * FROM dbo.Attendance WHERE attendance_id = @attendanceId');

  return updated.recordset[0];
}

/**
 * Get all Tuesdays in system that have attendance records.
 */
async function getAvailableDates() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT attendance_date
    FROM dbo.Attendance
    ORDER BY attendance_date DESC;
  `);
  return result.recordset.map(r => r.attendance_date);
}

/**
 * Get own attendance (for LEADER/MEMBER).
 */
async function getMyAttendance(userId, { page = 1, limit = 20 }) {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limitNum)
    .query(`
      SELECT attendance_date, login_time, status, notes,
        COUNT(*) OVER() AS total_count
      FROM dbo.Attendance
      WHERE user_id = @userId
      ORDER BY attendance_date DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `);

  const data = result.recordset;
  return { data, totalCount: data.length > 0 ? data[0].total_count : 0, page: pageNum, limit: limitNum };
}

module.exports = {
  recordLoginAttendance,
  markAbsentees,
  getReport,
  getSummary,
  updateRecord,
  getAvailableDates,
  getMyAttendance
};
