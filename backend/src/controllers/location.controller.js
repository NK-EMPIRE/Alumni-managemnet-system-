const { Country, State, City } = require('country-state-city');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

function findCountry(identifier) {
  if (!identifier) return null;
  const idStr = String(identifier).trim();
  if (idStr.length === 2) {
    const byCode = Country.getCountryByCode(idStr.toUpperCase());
    if (byCode) return byCode;
  }
  const all = Country.getAllCountries();
  const lower = idStr.toLowerCase();
  return all.find(c => c.name.toLowerCase() === lower || c.isoCode.toLowerCase() === lower) || null;
}

function findState(countryIsoCode, identifier) {
  if (!countryIsoCode || !identifier) return null;
  const idStr = String(identifier).trim();
  const states = State.getStatesOfCountry(countryIsoCode);
  if (!states || states.length === 0) return null;
  const lower = idStr.toLowerCase();
  return states.find(s => s.isoCode.toLowerCase() === lower || s.name.toLowerCase() === lower) || null;
}

const getCountries = asyncHandler(async (req, res) => {
  const allCountries = Country.getAllCountries();
  const countries = allCountries.map(c => ({
    name: c.name,
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

  const allStates = State.getStatesOfCountry(country.isoCode);
  const states = (allStates || []).map(s => ({
    name: s.name,
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

  const allCities = City.getCitiesOfState(country.isoCode, state.isoCode) || [];
  const seen = new Set();
  const cities = [];
  allCities.forEach(c => {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      cities.push({ name: c.name, stateCode: c.stateCode, countryCode: c.countryCode });
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
