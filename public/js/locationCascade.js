(function (window) {
  'use strict';

  var _cachedCountries = null;

  function createSearchableSelect(element, defaultPlaceholder) {
    if (!element) return null;

    var existingWrapper = element.nextElementSibling;
    if (existingWrapper && existingWrapper.classList.contains('custom-searchable-select')) {
      existingWrapper.remove();
    }

    element.style.display = 'none';

    var wrapper = document.createElement('div');
    wrapper.className = 'custom-searchable-select';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.innerHTML = '<span class="select-value">' + (element.value || defaultPlaceholder || 'Select...') + '</span><i class="fas fa-chevron-down select-arrow"></i>';
    wrapper.appendChild(trigger);

    var dropdown = document.createElement('div');
    dropdown.className = 'select-dropdown';

    var searchWrap = document.createElement('div');
    searchWrap.className = 'select-search-wrap';
    searchWrap.innerHTML = '<i class="fas fa-search select-search-icon"></i><input type="text" class="select-search-input" placeholder="Type to search..." autocomplete="off">';
    dropdown.appendChild(searchWrap);

    var optionsList = document.createElement('div');
    optionsList.className = 'select-options-list';
    dropdown.appendChild(optionsList);

    wrapper.appendChild(dropdown);
    element.parentNode.insertBefore(wrapper, element.nextSibling);

    var searchInput = searchWrap.querySelector('.select-search-input');
    var valueSpan = trigger.querySelector('.select-value');
    var _items = [];
    var _placeholder = defaultPlaceholder || 'Select...';
    var _selectedVal = element.value || '';

    function renderList(filterQuery) {
      optionsList.innerHTML = '';
      var q = (filterQuery || '').toLowerCase().trim();
      var count = 0;

      // Default blank option
      var emptyOpt = document.createElement('div');
      emptyOpt.className = 'select-option' + (!_selectedVal ? ' selected' : '');
      emptyOpt.textContent = _placeholder;
      emptyOpt.addEventListener('click', function (e) {
        e.stopPropagation();
        selectValue('');
      });
      optionsList.appendChild(emptyOpt);

      _items.forEach(function (item) {
        var val = typeof item === 'string' ? item : item.name;
        if (!val) return;
        if (q && val.toLowerCase().indexOf(q) === -1) return;

        count++;
        var opt = document.createElement('div');
        opt.className = 'select-option' + (val === _selectedVal ? ' selected' : '');
        opt.textContent = val;
        opt.addEventListener('click', function (e) {
          e.stopPropagation();
          selectValue(val);
        });
        optionsList.appendChild(opt);
      });

      if (q) {
        var customOpt = document.createElement('div');
        customOpt.className = 'select-option highlighted';
        customOpt.textContent = 'Use "' + filterQuery + '"';
        customOpt.addEventListener('click', function (e) {
          e.stopPropagation();
          selectValue(filterQuery);
        });
        optionsList.appendChild(customOpt);
      }
    }

    function isNativeSelect() {
      return element && element.tagName && String(element.tagName).toLowerCase() === 'select' && 'options' in element;
    }

    function ensureNativeOption(val) {
      if (!val || !isNativeSelect()) return;
      var found = Array.prototype.some.call(element.options, function (o) { return o.value === val; });
      if (!found) {
        var opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        element.appendChild(opt);
      }
    }

    function syncNativeOptions(items) {
      if (!isNativeSelect()) return;
      element.innerHTML = '';
      (Array.isArray(items) ? items : []).forEach(function (item) {
        var val = typeof item === 'string' ? item : item.name;
        if (!val) return;
        var opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        element.appendChild(opt);
      });
      if (_selectedVal) {
        ensureNativeOption(_selectedVal);
        element.value = _selectedVal;
      }
    }

    function setNativeValue(val) {
      _selectedVal = val || '';
      ensureNativeOption(_selectedVal);
      element.value = _selectedVal;
    }

    function selectValue(val) {
      setNativeValue(val);
      valueSpan.textContent = _selectedVal || _placeholder;
      wrapper.classList.remove('open');
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (element.disabled) {
        wrapper.classList.add('disabled');
        return;
      }
      wrapper.classList.remove('disabled');

      document.querySelectorAll('.custom-searchable-select.open').forEach(function (el) {
        if (el !== wrapper) el.classList.remove('open');
      });

      wrapper.classList.toggle('open');
      if (wrapper.classList.contains('open')) {
        searchInput.value = '';
        renderList('');
        setTimeout(function () { searchInput.focus(); }, 50);
      }
    });

    searchInput.addEventListener('input', function () {
      renderList(this.value);
    });

    searchInput.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
      }
    });

    return {
      wrapper: wrapper,
      setItems: function (items, placeholder) {
        _items = Array.isArray(items) ? items : [];
        if (placeholder) _placeholder = placeholder;
        if (!_selectedVal) valueSpan.textContent = _placeholder;
        syncNativeOptions(_items);
        renderList(searchInput.value);
      },
      setValue: function (val) {
        setNativeValue(val);
        valueSpan.textContent = _selectedVal || _placeholder;
        renderList('');
      },
      setPlaceholder: function (ph) {
        if (ph) {
          _placeholder = ph;
          if (!_selectedVal) valueSpan.textContent = _placeholder;
        }
      },
      setDisabled: function (bool) {
        element.disabled = !!bool;
        if (element.disabled) wrapper.classList.add('disabled');
        else wrapper.classList.remove('disabled');
      }
    };
  }

  function initLocationCascade(countryElOrId, stateElOrId, cityElOrId, options) {
    options = options || {};
    var countryEl = typeof countryElOrId === 'string' ? document.getElementById(countryElOrId) : countryElOrId;
    var stateEl = typeof stateElOrId === 'string' ? document.getElementById(stateElOrId) : stateElOrId;
    var cityEl = typeof cityElOrId === 'string' ? document.getElementById(cityElOrId) : cityElOrId;

    if (!countryEl) return null;

    var isFilter = !!options.isFilter;
    var countryPlaceholder = isFilter ? 'All Countries' : 'Select Country';
    var statePlaceholder = isFilter ? 'All States' : 'Select State';
    var cityPlaceholder = isFilter ? 'All Cities / Districts' : 'Select District / City';

    var initialCountry = (countryEl.value || '').trim();
    var countryCtrl = createSearchableSelect(countryEl, countryPlaceholder);
    var stateCtrl = stateEl ? createSearchableSelect(stateEl, initialCountry ? statePlaceholder : (isFilter ? 'All States' : 'Select Country First')) : null;
    var cityCtrl = cityEl ? createSearchableSelect(cityEl, initialCountry ? cityPlaceholder : (isFilter ? 'All Cities / Districts' : 'Select Country First')) : null;

    if (stateCtrl) stateCtrl.setDisabled(!initialCountry);
    if (cityCtrl) cityCtrl.setDisabled(!initialCountry);

    var _lastCountryVal = initialCountry;
    var _lastStateVal = stateEl ? (stateEl.value || '').trim() : '';

    function loadCountries(selectedCountry) {
      countryCtrl.setItems([], 'Loading Countries...');
      countryCtrl.setDisabled(true);

      var promise = _cachedCountries ? Promise.resolve(_cachedCountries) : API.getCountries();
      return promise.then(function (res) {
        var countries = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
        _cachedCountries = countries;
        countryCtrl.setItems(countries, countryPlaceholder);
        countryCtrl.setDisabled(false);

        if (selectedCountry) {
          countryCtrl.setValue(selectedCountry);
          _lastCountryVal = selectedCountry;
        }
      }).catch(function () {
        countryCtrl.setItems([], 'Failed to load countries');
        countryCtrl.setDisabled(false);
      });
    }

    function loadStates(countryVal, selectedState) {
      if (!stateCtrl) return Promise.resolve();
      _lastCountryVal = countryVal || '';

      if (!countryVal) {
        stateCtrl.setPlaceholder(isFilter ? 'All States' : 'Select Country First');
        stateCtrl.setItems([], isFilter ? 'All States' : 'Select Country First');
        stateCtrl.setValue('');
        stateCtrl.setDisabled(true);
        loadCities('', '', '');
        return Promise.resolve();
      }

      stateCtrl.setPlaceholder(statePlaceholder);
      stateCtrl.setItems([], 'Loading States...');
      stateCtrl.setDisabled(false);

      return API.getStates(countryVal).then(function (res) {
        var states = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
        if (states.length === 0) {
          stateCtrl.setItems([], isFilter ? 'All States' : 'No states available');
        } else {
          stateCtrl.setItems(states, statePlaceholder);
        }
        stateCtrl.setDisabled(stateEl ? stateEl.disabled : false);

        if (selectedState) {
          stateCtrl.setValue(selectedState);
          _lastStateVal = selectedState;
        }
      }).catch(function () {
        stateCtrl.setItems([], 'Error loading states');
        stateCtrl.setDisabled(stateEl ? stateEl.disabled : false);
      });
    }

    function loadCities(countryVal, stateVal, selectedCity) {
      if (!cityCtrl) return Promise.resolve();
      _lastStateVal = stateVal || '';

      if (!countryVal) {
        cityCtrl.setPlaceholder(isFilter ? 'All Cities / Districts' : 'Select Country First');
        cityCtrl.setItems([], isFilter ? 'All Cities / Districts' : 'Select Country First');
        cityCtrl.setValue('');
        cityCtrl.setDisabled(true);
        return Promise.resolve();
      }

      cityCtrl.setPlaceholder(cityPlaceholder);
      cityCtrl.setItems([], 'Loading Cities...');
      cityCtrl.setDisabled(false);

      return API.getCities(countryVal, stateVal || '').then(function (res) {
        var cities = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
        if (cities.length === 0) {
          cityCtrl.setItems([], isFilter ? 'All Cities / Districts' : 'No cities available');
        } else {
          cityCtrl.setItems(cities, cityPlaceholder);
        }
        cityCtrl.setDisabled(cityEl ? cityEl.disabled : false);

        if (selectedCity) {
          cityCtrl.setValue(selectedCity);
        }
      }).catch(function () {
        cityCtrl.setItems([], 'Error loading cities');
        cityCtrl.setDisabled(cityEl ? cityEl.disabled : false);
      });
    }

    countryEl.addEventListener('change', function () {
      var val = countryEl.value.trim();
      _lastCountryVal = val;
      _lastStateVal = '';
      if (stateCtrl) {
        stateCtrl.setPlaceholder(val ? statePlaceholder : (isFilter ? 'All States' : 'Select Country First'));
        stateCtrl.setValue('');
        stateCtrl.setItems([], val ? 'Loading States...' : (isFilter ? 'All States' : 'Select Country First'));
        stateCtrl.setDisabled(!val);
      }
      if (cityCtrl) {
        cityCtrl.setPlaceholder(val ? cityPlaceholder : (isFilter ? 'All Cities / Districts' : 'Select Country First'));
        cityCtrl.setValue('');
        cityCtrl.setItems([], val ? cityPlaceholder : (isFilter ? 'All Cities / Districts' : 'Select Country First'));
        cityCtrl.setDisabled(!val);
      }
      if (val) {
        loadStates(val).then(function () {
          if (options.onCountryChange) options.onCountryChange(val);
        });
      } else {
        if (options.onCountryChange) options.onCountryChange('');
      }
    });

    if (stateEl) {
      stateEl.addEventListener('change', function () {
        var countryVal = countryEl.value.trim();
        var stateVal = stateEl.value.trim();
        _lastStateVal = stateVal;
        if (cityCtrl) {
          cityCtrl.setValue('');
          cityCtrl.setItems([], stateVal ? 'Loading Cities...' : (isFilter ? 'All Cities / Districts' : 'Select State First'));
        }
        if (countryVal && stateVal) {
          loadCities(countryVal, stateVal).then(function () {
            if (options.onStateChange) options.onStateChange(stateVal);
          });
        } else {
          if (options.onStateChange) options.onStateChange('');
        }
      });
    }

    if (cityEl) {
      cityEl.addEventListener('change', function () {
        if (options.onCityChange) options.onCityChange(cityEl.value.trim());
      });
    }

    loadCountries(initialCountry).then(function () {
      if (initialCountry) {
        var initialSt = stateEl ? (stateEl.value || '').trim() : '';
        return loadStates(initialCountry, initialSt).then(function () {
          if (initialCountry && initialSt) {
            var initialCt = cityEl ? (cityEl.value || '').trim() : '';
            return loadCities(initialCountry, initialSt, initialCt);
          }
        });
      }
    });

    return {
      countryCtrl: countryCtrl,
      stateCtrl: stateCtrl,
      cityCtrl: cityCtrl,
      setValues: function (countryVal, stateVal, cityVal) {
        countryVal = (countryVal || '').trim();
        stateVal = (stateVal || '').trim();
        cityVal = (cityVal || '').trim();

        if (countryCtrl) countryCtrl.setValue(countryVal);
        if (stateCtrl) {
          stateCtrl.setValue(stateVal);
          stateCtrl.setDisabled(!countryVal);
          if (countryVal && !stateVal) stateCtrl.setItems([], statePlaceholder);
        }
        if (cityCtrl) {
          cityCtrl.setValue(cityVal);
          cityCtrl.setDisabled(!countryVal);
          if (countryVal && !cityVal) cityCtrl.setItems([], cityPlaceholder);
        }

        if (!countryVal) {
          if (stateCtrl) { stateCtrl.setItems([], isFilter ? 'All States' : 'Select Country First'); stateCtrl.setValue(''); stateCtrl.setDisabled(true); }
          if (cityCtrl) { cityCtrl.setItems([], isFilter ? 'All Cities / Districts' : 'Select State First'); cityCtrl.setValue(''); cityCtrl.setDisabled(true); }
          return Promise.resolve();
        }

        return loadCountries(countryVal).then(function () {
          if (countryVal) return loadStates(countryVal, stateVal);
        }).then(function () {
          if (stateCtrl) stateCtrl.setDisabled(stateEl ? stateEl.disabled : false);
          if (countryVal && stateVal) return loadCities(countryVal, stateVal, cityVal);
        }).then(function () {
          if (cityCtrl) cityCtrl.setDisabled(cityEl ? cityEl.disabled : false);
        }).catch(function () {
          if (stateCtrl) stateCtrl.setDisabled(stateEl ? stateEl.disabled : false);
          if (cityCtrl) cityCtrl.setDisabled(cityEl ? cityEl.disabled : false);
        });
      },
      reset: function () {
        countryCtrl.setValue('');
        _lastCountryVal = '';
        _lastStateVal = '';
        if (stateCtrl) {
          stateCtrl.setItems([], isFilter ? 'All States' : 'Select Country First');
          stateCtrl.setValue('');
          stateCtrl.setDisabled(true);
        }
        if (cityCtrl) {
          cityCtrl.setItems([], isFilter ? 'All Cities / Districts' : 'Select State First');
          cityCtrl.setValue('');
          cityCtrl.setDisabled(true);
        }
      }
    };
  }

  window.initLocationCascade = initLocationCascade;

})(window);
