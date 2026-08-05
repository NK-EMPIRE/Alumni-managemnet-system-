/* ============================================================
   TYPEAHEAD AUTOCOMPLETE CONTROLLER FOR MODALS & FORMS
   ============================================================ */

(function () {
  var suggestionDebounce = null;

  var FIELDS_CONFIG = [
    { id: 'fieldDesignation', field: 'designation', listId: 'dlDesignation' },
    { id: 'fieldCompany', field: 'company', listId: 'dlCompany' },
    { id: 'fieldCity', field: 'city', listId: 'dlCity' },
    { id: 'fieldState', field: 'state', listId: 'dlState' },
    { id: 'fieldCountry', field: 'country', listId: 'dlCountry' }
  ];

  function ensureDatalist(listId) {
    var dl = document.getElementById(listId);
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = listId;
      document.body.appendChild(dl);
    }
    return dl;
  }

  function handleTypeaheadInput(inputEl, field, listId) {
    var val = inputEl.value.trim();
    if (!val || val.length < 1) return;

    clearTimeout(suggestionDebounce);
    suggestionDebounce = setTimeout(function () {
      if (typeof API === 'undefined' || !API.getSuggestions) return;

      API.getSuggestions(field, val)
        .then(function (res) {
          if (res && res.success && Array.isArray(res.data)) {
            var dl = ensureDatalist(listId);
            inputEl.setAttribute('list', listId);
            dl.innerHTML = '';
            res.data.forEach(function (suggestion) {
              var opt = document.createElement('option');
              opt.value = suggestion;
              dl.appendChild(opt);
            });
          }
        })
        .catch(function (err) {
          console.error('Error fetching autocomplete suggestions for ' + field + ':', err);
        });
    }, 250);
  }

  function initTypeaheadAutocomplete() {
    FIELDS_CONFIG.forEach(function (cfg) {
      var inputs = document.querySelectorAll('#' + cfg.id);
      inputs.forEach(function (input) {
        input.setAttribute('autocomplete', 'off');
        input.addEventListener('input', function () {
          handleTypeaheadInput(input, cfg.field, cfg.listId);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypeaheadAutocomplete);
  } else {
    initTypeaheadAutocomplete();
  }

  window.initTypeaheadAutocomplete = initTypeaheadAutocomplete;
})();
