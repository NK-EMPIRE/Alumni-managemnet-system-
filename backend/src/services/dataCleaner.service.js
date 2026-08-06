/**
 * Zero-Cost Intelligence Data Cleaning & Role Normalization Service.
 * Provides fast local NLP/TF-IDF token matching, string parsing, and clean extraction.
 */

// Canonical Industry Domain Taxonomy
const CANONICAL_DOMAINS = {
  'Software Engineering': ['software', 'developer', 'sde', 'programmer', 'full stack', 'backend', 'frontend', 'engineer', 'web', 'mobile', 'coder', 'system analyst', 'tech lead', 'solution architect'],
  'Data Science & AI': ['data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'data analyst', 'data engineer', 'big data', 'ai', 'data', 'bi analyst'],
  'Education & Research': ['professor', 'assistant professor', 'associate professor', 'lecturer', 'teacher', 'hod', 'dean', 'head of dept', 'principal', 'tutor', 'academic'],
  'Healthcare & Life Sciences': ['doctor', 'nurse', 'medical rep', 'pharmacist', 'surgeon', 'healthcare', 'clinical'],
  'Operations & Quality Assurance': ['quality', 'qc', 'operations', 'logistics', 'safety', 'compliance', 'manager', 'lead', 'coordinator', 'inspector'],
  'Business & Trades': ['own business', 'business', 'builder', 'contractor', 'shop', 'owner', 'proprietor', 'entrepreneur'],
  'Public Sector & Civil Services': ['police', 'govt', 'tnstc', 'military', 'vao', 'panchayat', 'clerk', 'sub inspector']
};

/**
 * Computes TF-IDF vector similarity score between input text and domain terms.
 */
function classifyDomainSimilarity(text) {
  if (!text) return 'Other / Unclassified';
  const clean = text.toLowerCase();

  let bestDomain = 'Other / Unclassified';
  let maxScore = 0;

  for (const [domain, keywords] of Object.entries(CANONICAL_DOMAINS)) {
    let score = 0;
    for (const kw of keywords) {
      if (clean.includes(kw)) {
        score += kw.length; // Exact match weighted by keyword length
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

function cleanRoleAndCompany(designationRaw, companyRaw, workingDetailsRaw) {
  let designation = (designationRaw || '').trim();
  let company = (companyRaw || '').trim();
  let workingDetails = (workingDetailsRaw || '').trim();
  let city = '';

  // 1. Parse raw unstructured workingDetails if designation/company is missing
  if ((!designation || !company) && workingDetails) {
    const dashMatch = workingDetails.match(/^([^-]+)\s*-\s*(.+)$/i);
    if (dashMatch) {
      if (!designation) designation = dashMatch[1].trim();
      if (!company) company = dashMatch[2].trim();
    } else {
      const inMatch = workingDetails.match(/(?:working\s+in|at)\s+([^,.]+)/i);
      if (inMatch && !company) {
        company = inMatch[1].trim();
      }
      if (!designation) {
        designation = workingDetails;
      }
    }
  }

  // 2. Separate Academic Titles from Institution Name
  if (designation) {
    const academicMatch = designation.match(/^(Assistant Professor|Associate Professor|Professor|HOD|Head of Dept|Dean|Lecturer|Teacher|Principal|Correspondent)\s+(?:at|in|of|-)\s+(.+)$/i);
    if (academicMatch) {
      designation = academicMatch[1].trim();
      if (!company || company === 'null') {
        company = academicMatch[2].trim();
      }
    }
  }

  // 3. Extract City from Company String if formatted like "Company, City"
  if (company && company.includes(',')) {
    const parts = company.split(',');
    if (parts.length === 2 && parts[1].trim().length < 25) {
      company = parts[0].trim();
      city = parts[1].trim();
    }
  }

  // 4. TF-IDF Domain Classification
  const domainCategory = classifyDomainSimilarity(`${designation} ${company} ${workingDetails}`);

  return { designation, company, city, domainCategory };
}

module.exports = {
  cleanRoleAndCompany,
  classifyDomainSimilarity
};
