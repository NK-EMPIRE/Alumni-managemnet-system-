const { Country, State, City } = require('country-state-city');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

function removeAccents(str) {
  if (!str) return '';
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

const COUNTRY_ALIASES = {
  'usa': 'US',
  'us': 'US',
  'united states': 'US',
  'united states of america': 'US',
  'uk': 'GB',
  'united kingdom': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'ind': 'IN',
  'india': 'IN',
  'bharat': 'IN',
  'can': 'CA',
  'canada': 'CA',
  'aus': 'AU',
  'australia': 'AU',
  'sg': 'SG',
  'singapore': 'SG',
  'ger': 'DE',
  'germany': 'DE',
  'deutschland': 'DE'
};

const STATE_ALIASES = {
  'tn': 'TN',
  'tamil nadu': 'TN',
  'tamilnadu': 'TN',
  'mh': 'MH',
  'maharashtra': 'MH',
  'ka': 'KA',
  'karnataka': 'KA',
  'kl': 'KL',
  'kerala': 'KL',
  'ap': 'AP',
  'andhra pradesh': 'AP',
  'tg': 'TG',
  'ts': 'TG',
  'telangana': 'TG',
  'dl': 'DL',
  'delhi': 'DL',
  'ncr': 'DL',
  'wb': 'WB',
  'west bengal': 'WB',
  'bengal': 'WB',
  'gj': 'GJ',
  'gujarat': 'GJ',
  'rj': 'RJ',
  'rajasthan': 'RJ',
  'up': 'UP',
  'uttar pradesh': 'UP',
  'mp': 'MP',
  'madhya pradesh': 'MP',
  'pb': 'PB',
  'punjab': 'PB',
  'hr': 'HR',
  'haryana': 'HR',
  'or': 'OD',
  'odisha': 'OD',
  'orissa': 'OD',
  'br': 'BR',
  'bihar': 'BR'
};

function findCountry(identifier) {
  if (!identifier) return null;
  const idStr = removeAccents(identifier);
  const lower = idStr.toLowerCase();

  if (COUNTRY_ALIASES[lower]) {
    const byAlias = Country.getCountryByCode(COUNTRY_ALIASES[lower]);
    if (byAlias) return byAlias;
  }

  if (idStr.length === 2) {
    const byCode = Country.getCountryByCode(idStr.toUpperCase());
    if (byCode) return byCode;
  }

  const all = Country.getAllCountries();
  const cleanCandidate = c => removeAccents(c.name).toLowerCase();
  const exact = all.find(c => cleanCandidate(c) === lower || c.isoCode.toLowerCase() === lower);
  if (exact) return exact;

  const stripped = lower.replace(/[^a-z0-9]/g, '');
  return all.find(c => cleanCandidate(c).replace(/[^a-z0-9]/g, '') === stripped || cleanCandidate(c).includes(lower)) || null;
}

function findState(countryIsoCode, identifier) {
  if (!countryIsoCode || !identifier) return null;
  const idStr = removeAccents(identifier);
  const states = State.getStatesOfCountry(countryIsoCode);
  if (!states || states.length === 0) return null;

  const lower = idStr.toLowerCase();

  if (countryIsoCode.toUpperCase() === 'IN' && STATE_ALIASES[lower]) {
    const byAlias = states.find(s => s.isoCode === STATE_ALIASES[lower]);
    if (byAlias) return byAlias;
  }

  if (idStr.length === 2) {
    const byCode = states.find(s => s.isoCode.toLowerCase() === lower);
    if (byCode) return byCode;
  }

  const cleanCandidate = s => removeAccents(s.name).toLowerCase();
  const exact = states.find(s => cleanCandidate(s) === lower || s.isoCode.toLowerCase() === lower);
  if (exact) return exact;

  const stripped = lower.replace(/[^a-z0-9]/g, '');
  return states.find(s => cleanCandidate(s).replace(/[^a-z0-9]/g, '') === stripped || cleanCandidate(s).includes(lower)) || null;
}

const getCountries = asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const allCountries = Country.getAllCountries();
  const countries = allCountries.map(c => ({
    name: removeAccents(c.name),
    isoCode: c.isoCode,
    flag: c.flag
  })).sort((a, b) => a.name.localeCompare(b.name));

  success(res, countries, 'Countries retrieved successfully');
});

const getStates = asyncHandler(async (req, res) => {
  const { countryCode, countryName } = req.query;
  const countryParam = countryCode || countryName;
  if (!countryParam) {
    return success(res, [], 'Country is required');
  }

  const country = findCountry(countryParam);
  if (!country) {
    return success(res, [], 'Country not found');
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  const allStates = State.getStatesOfCountry(country.isoCode);
  const states = (allStates || []).map(s => ({
    name: removeAccents(s.name),
    isoCode: s.isoCode,
    countryCode: s.countryCode
  })).sort((a, b) => a.name.localeCompare(b.name));

  success(res, states, 'States retrieved successfully');
});

const getCities = asyncHandler(async (req, res) => {
  const { countryCode, countryName, stateCode, stateName } = req.query;
  const countryParam = countryCode || countryName;
  const stateParam = stateCode || stateName;

  if (!countryParam || !stateParam) {
    return success(res, [], 'Country and State are required');
  }

  const country = findCountry(countryParam);
  if (!country) {
    return success(res, [], 'Country not found');
  }

  const state = findState(country.isoCode, stateParam);
  if (!state) {
    return success(res, [], 'State not found');
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  const allCities = City.getCitiesOfState(country.isoCode, state.isoCode) || [];
  const seen = new Set();
  const cities = [];
  allCities.forEach(c => {
    const cleanName = removeAccents(c.name);
    if (!seen.has(cleanName)) {
      seen.add(cleanName);
      cities.push({ name: cleanName, stateCode: c.stateCode, countryCode: c.countryCode });
    }
  });
  cities.sort((a, b) => a.name.localeCompare(b.name));

  success(res, cities, 'Cities retrieved successfully');
});

module.exports = {
  getCountries,
  getStates,
  getCities
};
