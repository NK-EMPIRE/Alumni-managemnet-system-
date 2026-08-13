const { sql, getPool } = require('../config/database');

function getISTDate(date = new Date()) {
  const istStr = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istStr);
}

function isTuesday(date) {
  return date.getDay() === 2; // 0=Sun, 2=Tue
}

/**
 * Called on every login. Records attendance ONLY if today is Tuesday in IST and time is within 1:15 PM – 2:45 PM IST.
 * - Present (On-Time: 1:15 PM – 1:30 PM IST)
 * - Late (Delayed: 1:30 PM – 2:45 PM IST)
 * - Absent (No Login in Window: marked automatically when window closes or via markAbsentees)
 * Logins before 1:15 PM IST or after 2:45 PM IST or on non-Tuesdays are NOT recorded on login.
 */
async function recordLoginAttendance(userId, role) {
  const nowIST = getISTDate();

  if (!isTuesday(nowIST)) return;

  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const WINDOW_START = 13 * 60 + 15; // 1:15 PM IST = 795 mins
  const ONTIME_CUTOFF = 13 * 60 + 30; // 1:30 PM IST = 810 mins
  const WINDOW_END = 14 * 60 + 45;   // 2:45 PM IST = 885 mins

  // Attendance MUST take ONLY during the Tuesday window (1:15 PM - 2:45 PM), NOT before and NOT after
  if (totalMinutes < WINDOW_START || totalMinutes > WINDOW_END) {
    return;
  }

  // Present: On-Time 1:15 - 1:30 PM
  // Late: Delayed 1:30 - 2:45 PM
  const status = totalMinutes <= ONTIME_CUTOFF ? 'Present' : 'Late';

  const yyyy = nowIST.getFullYear();
  const mm = String(nowIST.getMonth() + 1).padStart(2, '0');
  const dd = String(nowIST.getDate()).padStart(2, '0');
  const attendanceDate = `${yyyy}-${mm}-${dd}`;

  const pool = await getPool();
  await pool.request()
    .input('userId', sql.Int, userId)
    .input('attendanceDate', sql.Date, attendanceDate)
    .input('loginTime', sql.DateTime2, new Date())
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
 * Automatically mark absentees for a Tuesday if its window has passed (past date or after 2:45 PM IST today).
 */
async function autoMarkIfWindowClosed(dateStr) {
  if (!dateStr) return;
  try {
    const dateFormatted = typeof dateStr === 'string' ? dateStr.slice(0, 10) : new Date(dateStr).toISOString().slice(0, 10);
    const nowIST = getISTDate();
    const yyyy = nowIST.getFullYear();
    const mm = String(nowIST.getMonth() + 1).padStart(2, '0');
    const dd = String(nowIST.getDate()).padStart(2, '0');
    const todayISTStr = `${yyyy}-${mm}-${dd}`;

    const totalMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();
    const WINDOW_END = 14 * 60 + 45; // 2:45 PM IST = 885 mins

    if (dateFormatted < todayISTStr || (dateFormatted === todayISTStr && totalMinutes > WINDOW_END)) {
      await markAbsentees(dateFormatted);
    }
  } catch (err) {
    // Ignore background auto-marking check errors
  }
}

/**
 * Mark all active users (ADMIN, LEADER, MEMBER) who have NO record for the given Tuesday as Absent.
 * @param {string} dateStr - YYYY-MM-DD (must be a Tuesday)
 */
async function markAbsentees(dateStr) {
  const pool = await getPool();

  const targetDateStr = typeof dateStr === 'string' ? dateStr.slice(0, 10) : new Date(dateStr).toISOString().slice(0, 10);

  const result = await pool.request()
    .input('targetDate', sql.Date, new Date(targetDateStr))
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
  if (date) {
    await autoMarkIfWindowClosed(date);
  }

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
        u.user_id,
        u.first_name + ' ' + u.last_name AS user_name,
        r.role_name AS role,
        u.department,
        COALESCE(a.attendance_date, @filterDate) AS attendance_date,
        a.login_time,
        COALESCE(a.status, 'Absent') AS status,
        COALESCE(a.marked_by, 'system') AS marked_by,
        a.notes,
        a.updated_at,
        COUNT(*) OVER() AS total_count
      FROM dbo.Users u
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      LEFT JOIN dbo.Attendance a ON u.user_id = a.user_id AND (@filterDate IS NULL OR a.attendance_date = @filterDate)
      WHERE u.is_active = 1
        AND (@filterUserId IS NULL OR u.user_id = @filterUserId)
        AND (@filterRole IS NULL OR r.role_name = @filterRole)
        AND (@filterStatus IS NULL OR COALESCE(a.status, 'Absent') = @filterStatus)
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
  if (date) {
    await autoMarkIfWindowClosed(date);
  }

  const pool = await getPool();
  const request = pool.request()
    .input('filterDate', sql.Date, date ? new Date(date) : null);

  const result = await request.query(`
    SELECT
      COALESCE(a.attendance_date, @filterDate) AS attendance_date,
      SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
      SUM(CASE WHEN a.status = 'Late'    THEN 1 ELSE 0 END) AS late_count,
      SUM(CASE WHEN COALESCE(a.status, 'Absent') = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
      COUNT(u.user_id) AS total_count
    FROM dbo.Users u
    LEFT JOIN dbo.Attendance a ON u.user_id = a.user_id AND (@filterDate IS NULL OR a.attendance_date = @filterDate)
    WHERE u.is_active = 1
    GROUP BY COALESCE(a.attendance_date, @filterDate)
    ORDER BY attendance_date DESC;
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
