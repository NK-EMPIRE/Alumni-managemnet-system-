const { sql, getPool } = require('../config/database');

/**
 * Get aggregated category groups from alumni + ProfessionalInformation.
 * Returns counts grouped by designation, company, city, profession_type, department, batch.
 */
async function getCategoryGroups({ department, batch, status, onlyUpdated }) {
  const pool = await getPool();

  const createRequest = () => pool.request()
    .input('department', sql.NVarChar(50), department || null)
    .input('batch', sql.NVarChar(10), batch || null)
    .input('status', sql.NVarChar(30), status || null)
    .input('onlyUpdated', sql.Bit, onlyUpdated ? 1 : 0);

  const profJoinSql = `
    LEFT JOIN (
      SELECT alumni_id, designation, company, current_city, state, country, is_government_job, is_entrepreneur, higher_studies, other_occupation,
             ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY info_id DESC) AS rn
      FROM dbo.ProfessionalInformation
    ) pi ON pi.alumni_id = a.alumni_id AND pi.rn = 1
  `;

  const assignJoinSql = `
    LEFT JOIN (
      SELECT alumni_id, status, ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
      FROM dbo.AlumniAssignments
    ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
  `;

  const whereSql = `
    WHERE (@department IS NULL OR a.department = @department)
      AND (@batch IS NULL OR a.batch = @batch)
      AND (@status IS NULL OR (@status = 'Unassigned' AND aa.status IS NULL) OR aa.status = @status)
      AND (@onlyUpdated = 0 OR a.is_updated = 1 OR pi.designation IS NOT NULL OR pi.company IS NOT NULL OR a.designation IS NOT NULL OR a.company IS NOT NULL)
  `;

  const [desigResult, companyResult, cityResult, professionResult, deptResult, batchResult] = await Promise.all([
    // Designations / Roles
    createRequest().query(`
      SELECT ISNULL(NULLIF(LTRIM(RTRIM(COALESCE(pi.designation, a.designation))), ''), 'Not Specified') AS designation,
             COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a ${profJoinSql} ${assignJoinSql} ${whereSql}
      GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(COALESCE(pi.designation, a.designation))), ''), 'Not Specified')
      ORDER BY count DESC;
    `),

    // Companies
    createRequest().query(`
      SELECT ISNULL(NULLIF(LTRIM(RTRIM(COALESCE(pi.company, a.company))), ''), 'Not Specified') AS company,
             COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a ${profJoinSql} ${assignJoinSql} ${whereSql}
      GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(COALESCE(pi.company, a.company))), ''), 'Not Specified')
      ORDER BY count DESC;
    `),

    // Cities
    createRequest().query(`
      SELECT ISNULL(NULLIF(LTRIM(RTRIM(COALESCE(pi.current_city, a.city))), ''), 'Not Specified') AS city,
             COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a ${profJoinSql} ${assignJoinSql} ${whereSql}
      GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(COALESCE(pi.current_city, a.city))), ''), 'Not Specified')
      ORDER BY count DESC;
    `),

    // Profession types
    createRequest().query(`
      SELECT
        CASE
          WHEN pi.is_government_job = 1 THEN 'Government'
          WHEN pi.is_entrepreneur = 1 THEN 'Business / Entrepreneur'
          WHEN pi.higher_studies IS NOT NULL AND pi.higher_studies <> '' THEN 'Higher Studies'
          WHEN LOWER(ISNULL(pi.other_occupation,'')) LIKE '%freelance%' THEN 'Freelance'
          WHEN (COALESCE(pi.company, a.company) IS NOT NULL AND COALESCE(pi.company, a.company) <> '') THEN 'Private Sector'
          ELSE 'Unknown / Other'
        END AS profession_type,
        COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a ${profJoinSql} ${assignJoinSql} ${whereSql}
      GROUP BY CASE
        WHEN pi.is_government_job = 1 THEN 'Government'
        WHEN pi.is_entrepreneur = 1 THEN 'Business / Entrepreneur'
        WHEN pi.higher_studies IS NOT NULL AND pi.higher_studies <> '' THEN 'Higher Studies'
        WHEN LOWER(ISNULL(pi.other_occupation,'')) LIKE '%freelance%' THEN 'Freelance'
        WHEN (COALESCE(pi.company, a.company) IS NOT NULL AND COALESCE(pi.company, a.company) <> '') THEN 'Private Sector'
        ELSE 'Unknown / Other'
      END
      ORDER BY count DESC;
    `),

    // Departments
    createRequest().query(`
      SELECT ISNULL(NULLIF(LTRIM(RTRIM(a.department)), ''), 'Not Specified') AS department,
             COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a ${profJoinSql} ${assignJoinSql} ${whereSql}
      GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(a.department)), ''), 'Not Specified')
      ORDER BY count DESC;
    `),

    // Batches
    createRequest().query(`
      SELECT ISNULL(NULLIF(LTRIM(RTRIM(a.batch)), ''), 'Not Specified') AS batch,
             COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a ${profJoinSql} ${assignJoinSql} ${whereSql}
      GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(a.batch)), ''), 'Not Specified')
      ORDER BY count DESC;
    `)
  ]);

  return {
    designations: desigResult.recordset,
    companies: companyResult.recordset,
    cities: cityResult.recordset,
    professions: professionResult.recordset,
    departments: deptResult.recordset,
    batches: batchResult.recordset
  };
}

/**
 * Get paginated list of alumni for a specific category detail view.
 */
async function getCategoryAlumni({
  designation, company, city, profType, department, batch, status,
  search, onlyUpdated, page = 1, limit = 20
}) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  const pool = await getPool();
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limitNum)
    .input('designation', sql.NVarChar(200), designation || null)
    .input('company', sql.NVarChar(200), company || null)
    .input('city', sql.NVarChar(100), city || null)
    .input('profType', sql.NVarChar(50), profType || null)
    .input('department', sql.NVarChar(50), department || null)
    .input('batch', sql.NVarChar(10), batch || null)
    .input('status', sql.NVarChar(30), status || null)
    .input('search', sql.NVarChar(200), search ? `%${search}%` : null)
    .input('onlyUpdated', sql.Bit, onlyUpdated ? 1 : 0);

  const query = `
    WITH CategoryCTE AS (
      SELECT
        a.alumni_id, a.register_no, a.name, a.department, a.batch,
        COALESCE(pi.email, a.email) AS email,
        COALESCE(pi.phone, a.phone) AS phone,
        a.secondary_email, a.secondary_phone,
        COALESCE(pi.designation, a.designation) AS designation,
        COALESCE(pi.company, a.company) AS company,
        COALESCE(pi.current_city, a.city) AS city,
        COALESCE(pi.linkedin_url, a.linkedin_profile) AS linkedin_profile,
        a.working_details, a.experience, a.is_updated,
        ISNULL(aa.status, 'Unassigned') AS assignment_status,
        ul.first_name + ' ' + ul.last_name AS leader_name,
        um.first_name + ' ' + um.last_name AS member_name,
        CASE
          WHEN pi.is_government_job = 1 THEN 'Government'
          WHEN pi.is_entrepreneur = 1 THEN 'Business / Entrepreneur'
          WHEN pi.higher_studies IS NOT NULL AND pi.higher_studies <> '' THEN 'Higher Studies'
          WHEN LOWER(ISNULL(pi.other_occupation,'')) LIKE '%freelance%' THEN 'Freelance'
          WHEN COALESCE(pi.company, a.company) IS NOT NULL AND COALESCE(pi.company, a.company) <> '' THEN 'Private Sector'
          ELSE 'Unknown / Other'
        END AS profession_type,
        COUNT(*) OVER() AS total_count
      FROM dbo.Alumni a
      LEFT JOIN (
        SELECT alumni_id, designation, company, current_city, state, country, email, phone, linkedin_url,
               is_government_job, is_entrepreneur, higher_studies, other_occupation,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY info_id DESC) AS rn
        FROM dbo.ProfessionalInformation
      ) pi ON pi.alumni_id = a.alumni_id AND pi.rn = 1
      LEFT JOIN (
        SELECT alumni_id, team_id, member_id, status,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
        FROM dbo.AlumniAssignments
      ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
      LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
      LEFT JOIN dbo.Users ul ON ul.user_id = t.leader_id
      LEFT JOIN dbo.Users um ON um.user_id = aa.member_id
      WHERE
        (@onlyUpdated = 0 OR (a.is_updated = 1 OR pi.designation IS NOT NULL OR pi.company IS NOT NULL OR a.designation IS NOT NULL OR a.company IS NOT NULL))
        AND (@designation IS NULL OR COALESCE(pi.designation, a.designation) = @designation)
        AND (@company IS NULL OR COALESCE(pi.company, a.company) = @company)
        AND (@city IS NULL OR COALESCE(pi.current_city, a.city) = @city)
        AND (@department IS NULL OR a.department = @department)
        AND (@batch IS NULL OR a.batch = @batch)
        AND (@status IS NULL OR (@status = 'Unassigned' AND aa.status IS NULL) OR aa.status = @status)
        AND (@search IS NULL OR a.name LIKE @search OR a.department LIKE @search OR COALESCE(pi.company, a.company) LIKE @search OR COALESCE(pi.designation, a.designation) LIKE @search OR a.register_no LIKE @search)
        AND (
          @profType IS NULL
          OR (
            @profType = 'Government' AND pi.is_government_job = 1
          ) OR (
            @profType = 'Business / Entrepreneur' AND pi.is_entrepreneur = 1
          ) OR (
            @profType = 'Higher Studies' AND pi.higher_studies IS NOT NULL AND pi.higher_studies <> ''
          ) OR (
            @profType = 'Freelance' AND LOWER(ISNULL(pi.other_occupation,'')) LIKE '%freelance%'
          ) OR (
            @profType = 'Private Sector' AND COALESCE(pi.company, a.company) IS NOT NULL AND COALESCE(pi.company, a.company) <> ''
            AND (pi.is_government_job IS NULL OR pi.is_government_job = 0)
            AND (pi.is_entrepreneur IS NULL OR pi.is_entrepreneur = 0)
          ) OR (
            @profType = 'Unknown / Other' AND (pi.is_government_job IS NULL OR pi.is_government_job = 0)
            AND (pi.is_entrepreneur IS NULL OR pi.is_entrepreneur = 0)
            AND (pi.higher_studies IS NULL OR pi.higher_studies = '')
            AND (COALESCE(pi.company, a.company) IS NULL OR COALESCE(pi.company, a.company) = '')
          )
        )
    )
    SELECT * FROM CategoryCTE
    ORDER BY name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `;

  const result = await request.query(query);
  const data = result.recordset;
  const totalCount = data.length > 0 ? data[0].total_count : 0;
  return { data, totalCount, page: pageNum, limit: limitNum };
}

module.exports = { getCategoryGroups, getCategoryAlumni };
