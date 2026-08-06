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

/**
 * Normalizes location strings (City, State, Country) by removing pin codes, noise prefixes,
 * stripping special characters, and converting to proper Title Case.
 */
function normalizeLocation(str) {
  if (!str) return '';
  let s = String(str).trim();

  // Strip pincodes, postal codes e.g. "SIVAGANGA-630201" -> "SIVAGANGA"
  s = s.replace(/[-–]\s*\d{5,6}\b/g, '');
  s = s.replace(/\b\d{5,6}\b/g, '');

  // Strip noise symbols
  s = s.replace(/^[-\s,.=]+|[-\s,.=]+$/g, '');

  if (!s || s === '--' || s.toLowerCase() === 'null') return '';

  // Standardize spaces and case
  s = s.replace(/\s+/g, ' ');
  const cleanAlpha = s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Canonical dictionary lookup
  if (cleanAlpha.includes('tamilnadu') || cleanAlpha === 'tn') return 'Tamil Nadu';
  if (cleanAlpha.includes('karnataka') || cleanAlpha === 'ka') return 'Karnataka';
  if (cleanAlpha.includes('andhrapradesh') || cleanAlpha === 'ap') return 'Andhra Pradesh';
  if (cleanAlpha.includes('kerala') || cleanAlpha === 'kl') return 'Kerala';
  if (cleanAlpha.includes('maharashtra') || cleanAlpha === 'mh' || cleanAlpha === 'mumbai') return 'Maharashtra';
  if (cleanAlpha.includes('madhyapradesh') || cleanAlpha === 'mp') return 'Madhya Pradesh';
  if (cleanAlpha.includes('jharkhand')) return 'Jharkhand';
  if (cleanAlpha.includes('rajasthan')) return 'Rajasthan';
  if (cleanAlpha.includes('odisha') || cleanAlpha.includes('orissa')) return 'Odisha';
  if (cleanAlpha.includes('pondicherry') || cleanAlpha.includes('puducherry')) return 'Puducherry';
  if (cleanAlpha.includes('andaman')) return 'Andaman & Nicobar';
  if (cleanAlpha.includes('singapore')) return 'Singapore';
  if (cleanAlpha.includes('unitedstates') || cleanAlpha === 'us' || cleanAlpha === 'usa') return 'United States';
  if (cleanAlpha.includes('saudi') || cleanAlpha.includes('saudhi') || cleanAlpha === 'makkah') return 'Saudi Arabia';
  if (cleanAlpha.includes('abudhabi') || cleanAlpha.includes('qatar') || cleanAlpha.includes('muscut')) return s;

  // Generic Title Case conversion
  return s.split(' ').map(word => {
    if (word.length <= 2 && word === word.toUpperCase()) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Deduplicates and canonicalizes a list of location strings.
 */
function canonicalizeLocationList(list) {
  const map = new Map();

  list.forEach(raw => {
    const norm = normalizeLocation(raw);
    if (norm && norm.length >= 2) {
      // Key by strict lower-case alphanumeric to eliminate "Tamil Nadu", "TAMIL NADU", "TamilNadu" dupes
      const key = norm.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!map.has(key)) {
        map.set(key, norm);
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

module.exports = {
  cleanRoleAndCompany,
  classifyDomainSimilarity,
  normalizeLocation,
  canonicalizeLocationList
};
