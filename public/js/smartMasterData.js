/**
 * Smart Master Data UI Engine for Alumni Update Modal & Analytics Dashboard.
 * Handles Employment Status toggles, Smart Taxonomies (Career Type -> Category -> Role Category),
 * Founder detection, and Cascading Locations (Country -> State -> District -> City).
 */

(function () {
  'use strict';

  var masterTaxonomies = null;
  var isFounderAutoDetected = false;

  window.initSmartMasterDataEngine = function () {
    loadTaxonomies();
    bindEmploymentStatusEvents();
    bindFounderDetectionEvents();
    bindCascadingLocationEvents();
  };

  function loadTaxonomies() {
    if (typeof API !== 'undefined' && API.getMasterTaxonomies) {
      API.getMasterTaxonomies()
        .then(function (res) {
          if (res && res.success && res.data) {
            masterTaxonomies = res.data;
            populateCareerCategoryOptions();
          }
        })
        .catch(function (err) {
          console.error('Error loading master taxonomies:', err);
        });
    }
  }

  function populateCareerCategoryOptions() {
    var catSelect = document.getElementById('fieldCareerCategory');
    if (!catSelect || !masterTaxonomies) return;

    var currentVal = catSelect.value;
    catSelect.innerHTML = '<option value="">Select Career Category</option>';
    if (masterTaxonomies.careerCategories) {
      masterTaxonomies.careerCategories.forEach(function (cat) {
        catSelect.innerHTML += '<option value="' + cat + '">' + cat + '</option>';
      });
    }
    if (currentVal) catSelect.value = currentVal;
  }

  window.onCareerCategoryChange = function () {
    var catSelect = document.getElementById('fieldCareerCategory');
    var roleSelect = document.getElementById('fieldRoleCategory');
    if (!catSelect || !roleSelect || !masterTaxonomies) return;

    var selectedCat = catSelect.value;
    roleSelect.innerHTML = '<option value="">Select Role Category</option>';

    if (selectedCat && masterTaxonomies.taxonomyMap && masterTaxonomies.taxonomyMap[selectedCat]) {
      masterTaxonomies.taxonomyMap[selectedCat].forEach(function (role) {
        roleSelect.innerHTML += '<option value="' + role + '">' + role + '</option>';
      });
    }
  };

  function bindEmploymentStatusEvents() {
    var statusSelect = document.getElementById('fieldEmploymentStatus');
    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        handleEmploymentStatusToggle(this.value);
      });
    }
  }

  function handleEmploymentStatusToggle(status) {
    var isNotWorking = (status === 'Not Working');
    var fieldsToDisable = [
      'fieldCompany',
      'fieldCity',
      'fieldRoleCategory',
      'fieldCareerCategory',
      'fieldDesignation'
    ];

    fieldsToDisable.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.disabled = isNotWorking;
        if (isNotWorking) {
          el.value = '';
          el.style.backgroundColor = '#F1F5F9';
          el.style.cursor = 'not-allowed';
        } else {
          el.style.backgroundColor = '#F8FAFC';
          el.style.cursor = 'text';
        }
      }
    });

    var companyReq = document.getElementById('errorCompany');
    var desReq = document.getElementById('errorDesignation');
    var cityReq = document.getElementById('errorCity');

    if (isNotWorking) {
      if (companyReq) companyReq.style.display = 'none';
      if (desReq) desReq.style.display = 'none';
      if (cityReq) cityReq.style.display = 'none';
    }
  }

  function bindFounderDetectionEvents() {
    var desInput = document.getElementById('fieldDesignation');
    if (desInput) {
      desInput.addEventListener('input', function () {
        var val = (this.value || '').toLowerCase();
        var founderKeywords = ['founder', 'co-founder', 'owner', 'managing partner', 'proprietor'];
        var isFounder = founderKeywords.some(function (kw) { return val.indexOf(kw) !== -1; });

        var typeSelect = document.getElementById('fieldCareerType');
        if (isFounder && typeSelect) {
          typeSelect.value = 'Entrepreneur';
          isFounderAutoDetected = true;
        }
      });
    }
  }

  function bindCascadingLocationEvents() {
    var countryEl = document.getElementById('fieldCountry');
    var stateEl = document.getElementById('fieldState');
    var districtEl = document.getElementById('fieldDistrict');
    var cityEl = document.getElementById('fieldCity');

    if (countryEl) {
      countryEl.addEventListener('change', function () {
        if (stateEl) stateEl.value = '';
        if (districtEl) districtEl.value = '';
        if (cityEl) cityEl.value = '';
        loadStatesForCountry(this.value);
      });
    }

    if (stateEl) {
      stateEl.addEventListener('change', function () {
        if (districtEl) districtEl.value = '';
        if (cityEl) cityEl.value = '';
        loadDistrictsForState(this.value);
      });
    }

    if (districtEl) {
      districtEl.addEventListener('change', function () {
        if (cityEl) cityEl.value = '';
        loadCitiesForDistrict(this.value);
      });
    }
  }

  function loadStatesForCountry(countryName) {
    if (!countryName || typeof API === 'undefined' || !API.getMasterCountries) return;
    API.getMasterCountries().then(function (res) {
      if (res && res.success && res.data) {
        var matched = res.data.find(function (c) { return c.name.toLowerCase() === countryName.toLowerCase(); });
        if (matched && API.getMasterStates) {
          API.getMasterStates(matched.id).then(function (sRes) {
            if (sRes && sRes.success && sRes.data) {
              populateDatalist('stateDatalist', sRes.data.map(function (s) { return s.name; }));
            }
          });
        }
      }
    });
  }

  function loadDistrictsForState(stateName) {
    if (!stateName || typeof API === 'undefined' || !API.getMasterStates) return;
    API.getMasterStates().then(function (res) {
      if (res && res.success && res.data) {
        var matched = res.data.find(function (s) { return s.name.toLowerCase() === stateName.toLowerCase(); });
        if (matched && API.getMasterDistricts) {
          API.getMasterDistricts(matched.id).then(function (dRes) {
            if (dRes && dRes.success && dRes.data) {
              populateDatalist('districtDatalist', dRes.data.map(function (d) { return d.name; }));
            }
          });
        }
      }
    });
  }

  function loadCitiesForDistrict(districtName) {
    if (!districtName || typeof API === 'undefined' || !API.getMasterDistricts) return;
    API.getMasterDistricts().then(function (res) {
      if (res && res.success && res.data) {
        var matched = res.data.find(function (d) { return d.name.toLowerCase() === districtName.toLowerCase(); });
        if (matched && API.getMasterCities) {
          API.getMasterCities(matched.id).then(function (cRes) {
            if (cRes && cRes.success && cRes.data) {
              populateDatalist('cityDatalist', cRes.data.map(function (c) { return c.name; }));
            }
          });
        }
      }
    });
  }

  function populateDatalist(elementId, items) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    items.forEach(function (item) {
      el.innerHTML += '<option value="' + item.replace(/"/g, '&quot;') + '">';
    });
  }

  // Auto-initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initSmartMasterDataEngine);
  } else {
    window.initSmartMasterDataEngine();
  }

})();
