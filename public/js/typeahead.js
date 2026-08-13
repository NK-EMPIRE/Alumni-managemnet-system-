/* ============================================================
   FLOATING INTERACTIVE TYPEAHEAD OVERLAY WITH ADD OPTION
   ============================================================ */

(function () {
  var suggestionDebounce = null;
  var activeOverlay = null;
  var activeInput = null;

  var FIELDS_CONFIG = [
    { id: 'fieldDesignation', field: 'designation' },
    { id: 'fieldCompany', field: 'company' }
  ];

  function removeActiveOverlay() {
    if (activeOverlay && activeOverlay.parentNode) {
      activeOverlay.parentNode.removeChild(activeOverlay);
    }
    activeOverlay = null;
    activeInput = null;
  }

  function createOverlay(inputEl, field, suggestions, query) {
    removeActiveOverlay();

    var rect = inputEl.getBoundingClientRect();
    var overlay = document.createElement('div');
    overlay.className = 'typeahead-floating-menu';
    overlay.style.cssText = [
      'position: absolute',
      'top: ' + (window.scrollY + rect.bottom + 4) + 'px',
      'left: ' + (window.scrollX + rect.left) + 'px',
      'width: ' + rect.width + 'px',
      'max-height: 280px',
      'overflow-y: auto',
      'overscroll-behavior: contain',
      'background: #ffffff',
      'border: 1px solid #CBD5E1',
      'border-radius: 8px',
      'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
      'z-index: 999999',
      'font-family: inherit',
      'font-size: 13px'
    ].join(';');

    var exactFound = false;
    var cleanQuery = query.trim();

    if (suggestions && suggestions.length > 0) {
      suggestions.forEach(function (item) {
        if (item.toLowerCase() === cleanQuery.toLowerCase()) {
          exactFound = true;
        }

        var row = document.createElement('div');
        row.style.cssText = 'padding: 8px 12px; cursor: pointer; color: #1E293B; border-bottom: 1px solid #F1F5F9;';
        row.innerHTML = '<span>' + item + '</span>';
        row.onmouseover = function () { row.style.background = '#F1F5F9'; };
        row.onmouseout = function () { row.style.background = '#ffffff'; };
        row.onmousedown = function (e) {
          e.preventDefault();
          inputEl.value = item;
          removeActiveOverlay();
        };
        overlay.appendChild(row);
      });
    }

    // If exact match not in suggestions, display "Add [typed input]" option
    if (!exactFound && cleanQuery.length > 0) {
      var addRow = document.createElement('div');
      addRow.style.cssText = 'padding: 9px 12px; cursor: pointer; color: #2563EB; font-weight: 600; background: #EFF6FF; border-top: 1px solid #DBEAFE;';
      addRow.innerHTML = '<i class="fas fa-plus-circle" style="margin-right: 6px;"></i> Add "' + cleanQuery.replace(/"/g, '&quot;') + '" as new ' + field;
      addRow.onmouseover = function () { addRow.style.background = '#DBEAFE'; };
      addRow.onmouseout = function () { addRow.style.background = '#EFF6FF'; };
      addRow.onmousedown = function (e) {
        e.preventDefault();
        inputEl.value = cleanQuery;
        removeActiveOverlay();

        if (typeof API !== 'undefined' && API.addSuggestion) {
          API.addSuggestion(field, cleanQuery)
            .then(function () {
              if (window.Toast && window.Toast.success) {
                window.Toast.success('Added', '"' + cleanQuery + '" saved to autocomplete dictionary.');
              }
            })
            .catch(function (err) {
              console.error('Error adding suggestion:', err);
            });
        }
      };
      overlay.appendChild(addRow);
    }

    document.body.appendChild(overlay);
    activeOverlay = overlay;
    activeInput = inputEl;
  }

  function handleInput(inputEl, field) {
    var val = inputEl.value.trim();

    clearTimeout(suggestionDebounce);
    suggestionDebounce = setTimeout(function () {
      if (typeof API === 'undefined' || !API.getSuggestions) return;

      API.getSuggestions(field, val)
        .then(function (res) {
          if (res && res.success) {
            createOverlay(inputEl, field, res.data || [], val);
          }
        })
        .catch(function (err) {
          console.error('Error fetching suggestions:', err);
        });
    }, 150);
  }

  function initTypeaheadAutocomplete() {
    FIELDS_CONFIG.forEach(function (cfg) {
      var inputs = document.querySelectorAll('#' + cfg.id);
      inputs.forEach(function (input) {
        input.setAttribute('autocomplete', 'off');
        input.addEventListener('input', function () {
          handleInput(input, cfg.field);
        });
        input.addEventListener('focus', function () {
          handleInput(input, cfg.field);
        });
        input.addEventListener('click', function () {
          handleInput(input, cfg.field);
        });
        input.addEventListener('blur', function () {
          setTimeout(removeActiveOverlay, 200);
        });
      });
    });
  }

  window.addEventListener('resize', removeActiveOverlay);
  window.addEventListener('scroll', function (e) {
    if (activeOverlay && activeOverlay.contains(e.target)) {
      return; // Allow internal menu scrolling
    }
    removeActiveOverlay();
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypeaheadAutocomplete);
  } else {
    initTypeaheadAutocomplete();
  }

  window.initTypeaheadAutocomplete = initTypeaheadAutocomplete;
})();
