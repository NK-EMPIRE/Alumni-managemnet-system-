/**
 * Master Data Engine Service.
 * Single source of truth for Career Taxonomies, Master Lookup Tables, Cascading Locations, and Dynamic Autocomplete.
 */

const { sql, getPool } = require('../config/database');

// 1. Employment Statuses
const EMPLOYMENT_STATUSES = [
  'Working',
  'Higher Studies',
  'Not Working',
  'Retired',
  'Unknown'
];

// 2. Career Types
const CAREER_TYPES = [
  'Private Employee',
  'Government Employee',
  'Entrepreneur',
  'Business Owner',
  'Self Employed',
  'Freelancer',
  'Research Scholar',
  'Student',
  'Intern',
  'Other'
];

// 3. Career Categories & Dependent Role Categories Mapping
const CAREER_TAXONOMY = {
  'Engineering': [
    'Software Development',
    'AI & Machine Learning',
    'Cyber Security',
    'Cloud',
    'DevOps',
    'Embedded Systems',
    'QA & Testing',
    'Data Engineering',
    'Civil & Construction',
    'Electrical & Electronics',
    'Mechanical & Automation'
  ],
  'Information Technology': [
    'Software Development',
    'AI & Machine Learning',
    'Cyber Security',
    'Cloud & Infrastructure',
    'Database Administration',
    'IT Support & Networking',
    'UI/UX & Product Design'
  ],
  'Business': [
    'Executive Leadership',
    'Sales & Growth',
    'Marketing & Brand',
    'Operations & Quality',
    'Finance & Accounting',
    'HR & People Ops',
    'Business Strategy & Consulting',
    'Product Management'
  ],
  'Finance': [
    'Accounting & Audit',
    'Banking & Wealth',
    'Financial Analysis',
    'Taxation & Compliance',
    'Investment & Equity'
  ],
  'Healthcare': [
    'Medical & Surgery',
    'Nursing & Clinical',
    'Pharmacy & Life Sciences',
    'Biomedical & Lab',
    'Healthcare Operations'
  ],
  'Education': [
    'University & College Faculty',
    'School Education',
    'Academic Research',
    'Educational Administration',
    'Tutoring & Coaching'
  ],
  'Government': [
    'Administration & Civil Services',
    'Police & Defense',
    'Banking & Public Finance',
    'Railways & Transport',
    'Public Works & State Services'
  ],
  'Manufacturing': [
    'Production & Operations',
    'Quality Control & Assurance',
    'Industrial Maintenance',
    'Supply Chain & Procurement'
  ],
  'Construction': [
    'Site Engineering',
    'Structural Design',
    'Project Management',
    'Architecture'
  ],
  'Legal': [
    'Corporate Law',
    'Litigation & Advocacy',
    'Legal Compliance'
  ],
  'Media': [
    'Content Writing',
    'Journalism & News',
    'Digital Media & PR',
    'Graphic & Video Production'
  ],
  'Hospitality': [
    'Hotel & Resort Management',
    'Food & Beverage',
    'Travel & Tourism'
  ],
  'Research': [
    'Scientific Research',
    'Academic Fellowship',
    'R&D Innovation'
  ],
  'Agriculture': [
    'Agri-Business',
    'Farming Operations',
    'Agri-Tech & Research'
  ],
  'Defense': [
    'Army',
    'Navy',
    'Air Force',
    'Defense Research'
  ],
  'Sports': [
    'Professional Athletics',
    'Coaching & Fitness',
    'Sports Management'
  ],
  'Arts': [
    'Design & Fine Arts',
    'Performing Arts',
    'Creative Writing'
  ],
  'Others': [
    'General Work',
    'Unassigned Category'
  ]
};

// Founder triggers array for automatic Entrepreneur suggestion
const FOUNDER_KEYWORDS = ['founder', 'co-founder', 'owner', 'managing partner', 'proprietor'];

/**
 * Returns available master career taxonomies.
 */
function getCareerTaxonomies() {
  return {
    employmentStatuses: EMPLOYMENT_STATUSES,
    careerTypes: CAREER_TYPES,
    careerCategories: Object.keys(CAREER_TAXONOMY),
    taxonomyMap: CAREER_TAXONOMY
  };
}

/**
 * Get list of countries.
 */
async function getCountries() {
  const pool = await getPool();
  const res = await pool.request().query('SELECT id, name, code FROM dbo.Countries ORDER BY name ASC');
  return res.recordset;
}

/**
 * Get states for a country.
 */
async function getStates(countryId) {
  const pool = await getPool();
  const req = pool.request();
  let query = 'SELECT id, country_id, name FROM dbo.States';
  if (countryId) {
    req.input('cid', sql.Int, countryId);
    query += ' WHERE country_id = @cid';
  }
  query += ' ORDER BY name ASC';
  const res = await req.query(query);
  return res.recordset;
}

/**
 * Get districts for a state.
 */
async function getDistricts(stateId) {
  const pool = await getPool();
  const req = pool.request();
  let query = 'SELECT id, state_id, name FROM dbo.Districts';
  if (stateId) {
    req.input('sid', sql.Int, stateId);
    query += ' WHERE state_id = @sid';
  }
  query += ' ORDER BY name ASC';
  const res = await req.query(query);
  return res.recordset;
}

/**
 * Get cities for a district or state.
 */
async function getCities(districtId, stateId) {
  const pool = await getPool();
  const req = pool.request();
  let query = 'SELECT c.id, c.district_id, c.name FROM dbo.Cities c';
  if (districtId) {
    req.input('did', sql.Int, districtId);
    query += ' WHERE c.district_id = @did';
  } else if (stateId) {
    req.input('sid', sql.Int, stateId);
    query += ' JOIN dbo.Districts d ON d.id = c.district_id WHERE d.state_id = @sid';
  }
  query += ' ORDER BY c.name ASC';
  const res = await req.query(query);
  return res.recordset;
}

/**
 * Lookup or insert company name into dbo.Companies master table with Pending status for new items.
 */
async function resolveAndStoreCompany(companyName, industry = null, userId = null) {
  if (!companyName || !companyName.trim()) return null;
  const raw = companyName.trim();
  const norm = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!norm || norm === 'null' || norm === 'no' || norm.length < 2) return null;

  const pool = await getPool();
  const req = pool.request()
    .input('raw', sql.NVarChar(255), raw)
    .input('norm', sql.NVarChar(255), norm)
    .input('ind', sql.NVarChar(100), industry || null)
    .input('uid', sql.Int, userId || null);

  const res = await req.query(`
    MERGE dbo.Companies WITH (HOLDLOCK) AS target
    USING (SELECT @norm AS normalized_name) AS source
    ON target.normalized_name = source.normalized_name
    WHEN MATCHED THEN
      UPDATE SET usage_count = target.usage_count + 1
    WHEN NOT MATCHED THEN
      INSERT (company_name, normalized_name, industry, usage_count, status, created_by)
      VALUES (@raw, @norm, @ind, 1, 'Pending', @uid);

    SELECT company_name FROM dbo.Companies WHERE normalized_name = @norm;
  `);

  return res.recordset[0] ? res.recordset[0].company_name : raw;
}

/**
 * Lookup or insert designation title into dbo.Designations master table with Pending status for new items.
 */
async function resolveAndStoreDesignation(title, category = null, userId = null) {
  if (!title || !title.trim()) return null;
  const raw = title.trim();
  const norm = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!norm || norm === 'null' || norm === 'no' || norm.length < 2) return null;

  const pool = await getPool();
  const req = pool.request()
    .input('raw', sql.NVarChar(255), raw)
    .input('norm', sql.NVarChar(255), norm)
    .input('cat', sql.NVarChar(100), category || null)
    .input('uid', sql.Int, userId || null);

  const res = await req.query(`
    MERGE dbo.Designations WITH (HOLDLOCK) AS target
    USING (SELECT @norm AS normalized_title) AS source
    ON target.normalized_title = source.normalized_title
    WHEN MATCHED THEN
      UPDATE SET usage_count = target.usage_count + 1
    WHEN NOT MATCHED THEN
      INSERT (title, normalized_title, category, usage_count, status, created_by)
      VALUES (@raw, @norm, @cat, 1, 'Pending', @uid);

    SELECT title FROM dbo.Designations WHERE normalized_title = @norm;
  `);

  return res.recordset[0] ? res.recordset[0].title : raw;
}

/**
 * Lookup or insert university name into dbo.Universities master table with Pending status for new items.
 */
async function resolveAndStoreUniversity(name, countryId = null, userId = null) {
  if (!name || !name.trim()) return null;
  const raw = name.trim();
  const norm = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!norm || norm === 'null' || norm === 'no' || norm.length < 2) return null;

  const pool = await getPool();
  const req = pool.request()
    .input('raw', sql.NVarChar(255), raw)
    .input('norm', sql.NVarChar(255), norm)
    .input('cid', sql.Int, countryId || null)
    .input('uid', sql.Int, userId || null);

  const res = await req.query(`
    MERGE dbo.Universities WITH (HOLDLOCK) AS target
    USING (SELECT @norm AS normalized_name) AS source
    ON target.normalized_name = source.normalized_name
    WHEN MATCHED THEN
      UPDATE SET usage_count = target.usage_count + 1
    WHEN NOT MATCHED THEN
      INSERT (name, normalized_name, country_id, usage_count, status, created_by)
      VALUES (@raw, @norm, @cid, 1, 'Pending', @uid);

    SELECT name FROM dbo.Universities WHERE normalized_name = @norm;
  `);

  return res.recordset[0] ? res.recordset[0].name : raw;
}

/**
 * Search Companies (returns Approved items).
 */
async function searchCompanies(query, limit = 50) {
  const qStr = (query || '').trim().toLowerCase();
  const pool = await getPool();
  const req = pool.request().input('q', sql.NVarChar(200), `%${qStr}%`);

  const querySql = `
    SELECT company_name, usage_count
    FROM dbo.Companies
    WHERE status = 'Approved'
      AND (${qStr === '' ? '1=1' : 'LOWER(company_name) LIKE @q OR LOWER(normalized_name) LIKE @q'})
    ORDER BY usage_count DESC, company_name ASC
    OFFSET 0 ROWS FETCH NEXT ${parseInt(limit, 10)} ROWS ONLY;
  `;

  const res = await req.query(querySql);
  return res.recordset.map(r => r.company_name);
}

/**
 * Search Designations (returns Approved items).
 */
async function searchDesignations(query, limit = 50) {
  const qStr = (query || '').trim().toLowerCase();
  const pool = await getPool();
  const req = pool.request().input('q', sql.NVarChar(200), `%${qStr}%`);

  const querySql = `
    SELECT title, usage_count
    FROM dbo.Designations
    WHERE status = 'Approved'
      AND (${qStr === '' ? '1=1' : 'LOWER(title) LIKE @q OR LOWER(normalized_title) LIKE @q'})
    ORDER BY usage_count DESC, title ASC
    OFFSET 0 ROWS FETCH NEXT ${parseInt(limit, 10)} ROWS ONLY;
  `;

  const res = await req.query(querySql);
  return res.recordset.map(r => r.title);
}

/**
 * Search Universities (returns Approved items).
 */
async function searchUniversities(query, limit = 50) {
  const qStr = (query || '').trim().toLowerCase();
  const pool = await getPool();
  const req = pool.request().input('q', sql.NVarChar(200), `%${qStr}%`);

  const querySql = `
    SELECT name, usage_count
    FROM dbo.Universities
    WHERE status = 'Approved'
      AND (${qStr === '' ? '1=1' : 'LOWER(name) LIKE @q OR LOWER(normalized_name) LIKE @q'})
    ORDER BY usage_count DESC, name ASC
    OFFSET 0 ROWS FETCH NEXT ${parseInt(limit, 10)} ROWS ONLY;
  `;

  const res = await req.query(querySql);
  return res.recordset.map(r => r.name);
}

/**
 * Get items pending admin review across Companies, Designations, and Universities.
 */
async function getPendingMasterItems() {
  const pool = await getPool();
  const compRes = await pool.request().query(`
    SELECT 'company' AS type, id, company_name AS name, created_at, created_by
    FROM dbo.Companies WHERE status = 'Pending' ORDER BY created_at DESC
  `);
  const desRes = await pool.request().query(`
    SELECT 'designation' AS type, id, title AS name, created_at, created_by
    FROM dbo.Designations WHERE status = 'Pending' ORDER BY created_at DESC
  `);
  const uniRes = await pool.request().query(`
    SELECT 'university' AS type, id, name, created_at, created_by
    FROM dbo.Universities WHERE status = 'Pending' ORDER BY created_at DESC
  `);

  return [...compRes.recordset, ...desRes.recordset, ...uniRes.recordset];
}

/**
 * Approve a pending master item.
 */
async function approveMasterItem(type, id, adminId) {
  const pool = await getPool();
  const req = pool.request().input('id', sql.Int, id).input('aid', sql.Int, adminId);

  if (type === 'company') {
    await req.query("UPDATE dbo.Companies SET status = 'Approved', approved_by = @aid, approved_at = GETUTCDATE() WHERE id = @id");
  } else if (type === 'designation') {
    await req.query("UPDATE dbo.Designations SET status = 'Approved', approved_by = @aid, approved_at = GETUTCDATE() WHERE id = @id");
  } else if (type === 'university') {
    await req.query("UPDATE dbo.Universities SET status = 'Approved', approved_by = @aid, approved_at = GETUTCDATE() WHERE id = @id");
  }
  return true;
}

/**
 * Reject a pending master item.
 */
async function rejectMasterItem(type, id, adminId) {
  const pool = await getPool();
  const req = pool.request().input('id', sql.Int, id).input('aid', sql.Int, adminId);

  if (type === 'company') {
    await req.query("UPDATE dbo.Companies SET status = 'Rejected', approved_by = @aid, approved_at = GETUTCDATE() WHERE id = @id");
  } else if (type === 'designation') {
    await req.query("UPDATE dbo.Designations SET status = 'Rejected', approved_by = @aid, approved_at = GETUTCDATE() WHERE id = @id");
  } else if (type === 'university') {
    await req.query("UPDATE dbo.Universities SET status = 'Rejected', approved_by = @aid, approved_at = GETUTCDATE() WHERE id = @id");
  }
  return true;
}

/**
 * Check if a designation matches founder keywords.
 */
function isFounderDesignation(title) {
  if (!title) return false;
  const lower = title.toLowerCase();
  return FOUNDER_KEYWORDS.some(kw => lower.includes(kw));
}

module.exports = {
  EMPLOYMENT_STATUSES,
  CAREER_TYPES,
  CAREER_TAXONOMY,
  getCareerTaxonomies,
  getCountries,
  getStates,
  getDistricts,
  getCities,
  resolveAndStoreCompany,
  resolveAndStoreDesignation,
  resolveAndStoreUniversity,
  searchCompanies,
  searchDesignations,
  searchUniversities,
  getPendingMasterItems,
  approveMasterItem,
  rejectMasterItem,
  isFounderDesignation
};
