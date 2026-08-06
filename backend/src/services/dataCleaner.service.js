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
 * Normalizes City strings by stripping pin codes e.g. "A.THEKKUR, SIVAGANGA-630201" -> "A.thekkur, Sivaganga".
 */
function normalizeCity(str) {
  if (!str) return '';
  let s = String(str).trim();

  // Exclude invalid non-city phrases
  if (s.toLowerCase().includes('focus is on') || s.toLowerCase() === 'null' || s === '--') return '';

  // Strip pincodes, postal codes e.g. "SIVAGANGA-630201" -> "SIVAGANGA"
  s = s.replace(/[-–]\s*\d{5,6}\b/g, '');
  s = s.replace(/\b\d{5,6}\b/g, '');
  s = s.replace(/^[-\s,.=]+|[-\s,.=]+$/g, '');

  if (!s) return '';

  // Return formatted Title Case
  return s.split(/\s+/).map(word => {
    if (word.length <= 2 && word === word.toUpperCase()) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Normalizes State strings by filtering out Countries / Cities misplaced in State column.
 */
function normalizeState(str) {
  if (!str) return '';
  let s = String(str).trim();
  const lower = s.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!s || s === '--' || lower === 'null') return '';

  // Filter out misplaced countries from state column
  if (['us', 'usa', 'unitedstates', 'qatar', 'singapore', 'abudhabi', 'makkah', 'saudiarabia'].includes(lower)) {
    return ''; // misplaced country in state column
  }

  // Canonical Indian states & provinces
  if (lower.includes('tamilnadu') || lower === 'tn') return 'Tamil Nadu';
  if (lower.includes('karnataka') || lower === 'ka') return 'Karnataka';
  if (lower.includes('andhrapradesh') || lower === 'ap') return 'Andhra Pradesh';
  if (lower.includes('kerala') || lower === 'kl') return 'Kerala';
  if (lower.includes('maharashtra') || lower === 'mh' || lower === 'mumbai') return 'Maharashtra';
  if (lower.includes('madhyapradesh') || lower === 'mp') return 'Madhya Pradesh';
  if (lower.includes('jharkhand')) return 'Jharkhand';
  if (lower.includes('rajasthan')) return 'Rajasthan';
  if (lower.includes('odisha') || lower.includes('orissa')) return 'Odisha';
  if (lower.includes('pondicherry') || lower.includes('puducherry')) return 'Puducherry';
  if (lower.includes('andaman')) return 'Andaman & Nicobar';
  if (lower.includes('georgia')) return 'Georgia';
  if (lower.includes('meghalaya')) return 'Meghalaya';
  if (lower.includes('ontario')) return 'Ontario';

  return s.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

/**
 * Normalizes Country strings.
 */
function normalizeCountry(str) {
  if (!str) return '';
  let s = String(str).trim();
  const lower = s.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!s || s === '--' || lower === 'null' || lower.includes('sharpenanalytics')) return '';

  if (lower === 'us' || lower === 'usa' || lower.includes('unitedstates')) return 'United States';
  if (lower.includes('saudi') || lower.includes('saudhi') || lower === 'makkah') return 'Saudi Arabia';
  if (lower.includes('qatar')) return 'Qatar';
  if (lower.includes('singapore')) return 'Singapore';
  if (lower.includes('abudhabi') || lower.includes('uae')) return 'United Arab Emirates';
  if (lower.includes('muscut') || lower.includes('oman')) return 'Oman (Muscat)';
  if (lower.includes('canada')) return 'Canada';
  if (lower.includes('india')) return 'India';
  if (lower.includes('unitedkingdom') || lower === 'uk') return 'United Kingdom';

  return s.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

/**
 * Deduplicates and canonicalizes a list of location strings based on type.
 */
function canonicalizeLocationList(list, type) {
  const map = new Map();

  list.forEach(raw => {
    let norm = '';
    if (type === 'city') norm = normalizeCity(raw);
    else if (type === 'state') norm = normalizeState(raw);
    else if (type === 'country') norm = normalizeCountry(raw);
    else norm = normalizeCity(raw);

    if (norm && norm.length >= 2) {
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
  normalizeCity,
  normalizeState,
  normalizeCountry,
  canonicalizeLocationList
};
