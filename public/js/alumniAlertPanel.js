/* ================================================================
   ALUMNI ALERT PANEL v2
   - Graduation cap icon in navbar opens a slide panel
   - Panel has an EMPTY FORM to type alumni details manually
   - "Send to Global Chat" posts a formatted alumni card message
   - Chat renders it as a special card with Copy + Open LinkedIn
   - Chat toast pops up on new messages from others
   ================================================================ */
(function () {
  var _lastSeenMsgId = 0;
  var COLORS = ['#2563EB','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#6366F1'];
  function ac(id) { return COLORS[(parseInt(id,10)||0) % COLORS.length]; }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── TOAST ── */
  function injectToast() {
    if (document.getElementById('chatToastContainer')) return;
    var el = document.createElement('div');
    el.id = 'chatToastContainer';
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column-reverse;gap:10px;pointer-events:none;';
    document.body.appendChild(el);
  }

  function showToast(name, text, initial, color) {
    var c = document.getElementById('chatToastContainer'); if (!c) return;
    var t = document.createElement('div');
    t.style.cssText = 'display:flex;align-items:center;gap:12px;background:#1E293B;color:#fff;padding:12px 16px;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,0.28);min-width:260px;max-width:340px;pointer-events:all;cursor:pointer;transform:translateX(120%);transition:transform 0.35s cubic-bezier(.4,0,.2,1);font-family:system-ui,sans-serif;';
    t.innerHTML =
      '<div style="width:40px;height:40px;border-radius:50%;background:'+color+';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;">'+esc(initial)+'</div>'+
      '<div style="flex:1;overflow:hidden;"><div style="font-weight:700;font-size:0.82rem;color:#F8FAFC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(name)+'</div><div style="font-size:0.78rem;color:#94A3B8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">'+esc(text)+'</div></div>'+
      '<i class="fas fa-comment-alt" style="color:#00a884;font-size:1rem;flex-shrink:0;"></i>';
    t.onclick = function() { rmToast(t); };
    c.appendChild(t);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.style.transform='translateX(0)'; }); });
    setTimeout(function(){ rmToast(t); }, 5000);
  }
  function rmToast(t) {
    if (!t || !t.parentNode) return;
    t.style.transform = 'translateX(120%)';
    setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 350);
  }

  /* ── CHAT TOAST POLLING ── */
  function pollToasts() {
    var token = localStorage.getItem('token'); if (!token) return;
    var myId = null;
    try { var p=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); myId=p.userId||p.id||p.sub; } catch(e) {}
    var url = '/api/v1/chat/messages?channelType=global&limit=5' + (_lastSeenMsgId > 0 ? '&sinceId=' + _lastSeenMsgId : '');
    fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res || !res.success || !Array.isArray(res.data)) return;
        res.data.forEach(function(m) {
          if (m.message_id > _lastSeenMsgId) _lastSeenMsgId = m.message_id;
          var cs = document.getElementById('section-chat');
          var visible = cs && cs.classList.contains('active') && cs.style.display !== 'none';
          if (myId && parseInt(m.user_id,10) !== parseInt(myId,10) && !visible) {
            var nm = m.sender_name || 'Someone';
            var preview = m.message_text || '';
            if (preview.indexOf('ALUMNI_ALERT::') === 0) preview = '\uD83C\uDF93 Alumni Detail Found';
            showToast(nm, preview, nm.charAt(0).toUpperCase(), ac(m.user_id));
          }
        });
      }).catch(function() {});
  }

  /* ── PANEL TOGGLE ── */
  window.toggleAlumniAlertPanel = function(e) {
    if (e) e.stopPropagation();
    var p = document.getElementById('alumniAlertSidePanel'); if (!p) return;
    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
  };

  /* ── SEND FORM TO GLOBAL CHAT ── */
  window.submitAlumniAlertForm = function() {
    var get = function(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var name = get('aaf_name');
    if (!name) { alert('Alumni Name is required!'); return; }

    var token = localStorage.getItem('token'); if (!token) return;

    var country = get('aaf_country');
    var state = get('aaf_state');
    var city = get('aaf_city');
    var locationStr = [city, state, country].filter(Boolean).join(', ');

    // Build structured payload encoded as special marker so chat can render card
    var payload = {
      name:        name,
      regNo:       get('aaf_regno'),
      department:  get('aaf_dept'),
      batch:       get('aaf_batch'),
      company:     get('aaf_company'),
      designation: get('aaf_desig'),
      country:     country,
      state:       state,
      city:        city,
      location:    locationStr,
      phone:       get('aaf_phone'),
      email:       get('aaf_email'),
      linkedin:    get('aaf_linkedin'),
      notes:       get('aaf_notes')
    };

    // Prefix with marker so chatPage.js can render it as a card
    var msgText = 'ALUMNI_ALERT::' + JSON.stringify(payload);

    var btn = document.getElementById('aaf_submitBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'; }

    fetch('/api/v1/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ messageText: msgText, channelType: 'global' })
    })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (res && res.success) {
        // Clear form
        ['aaf_name','aaf_regno','aaf_dept','aaf_batch','aaf_company','aaf_desig','aaf_phone','aaf_email','aaf_linkedin','aaf_notes'].forEach(function(id) {
          var el = document.getElementById(id); if (el) el.value = '';
        });
        if (window._aafLocationCascade) {
          window._aafLocationCascade.reset();
        }
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send to Global Chat'; }
        // Close panel
        var p = document.getElementById('alumniAlertSidePanel');
        if (p) p.style.display = 'none';
        showToast('Global Chat', '\uD83C\uDF93 Alumni detail shared!', '\u2713', '#10B981');
      } else {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send to Global Chat'; }
      }
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send to Global Chat'; }
    });
  };

  /* ── INJECT NAVBAR ICON ── */
  function injectNavIcon() {
    if (document.getElementById('alumniAlertNavBtn')) return;
    var container = document.querySelector('.navbar-right') || document.querySelector('.topbar-right');
    if (!container) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;';
    wrap.innerHTML =
      '<button id="alumniAlertNavBtn" onclick="toggleAlumniAlertPanel(event)" title="Report Alumni Detail Found" ' +
        'style="background:none;border:none;cursor:pointer;font-size:1.15rem;color:#F59E0B;position:relative;padding:4px 6px;">' +
        '<i class="fas fa-graduation-cap"></i>' +
      '</button>';
    var first = container.firstChild;
    if (first) container.insertBefore(wrap, first); else container.appendChild(wrap);
  }

  /* ── INJECT SIDE PANEL (FORM) ── */
  var fieldStyle = 'width:100%;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:0.85rem;font-family:system-ui,sans-serif;outline:none;background:#fff;color:#0F172A;box-sizing:border-box;transition:border-color 0.2s;';
  var labelStyle = 'display:block;font-size:0.75rem;font-weight:700;color:#475569;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.4px;';
  var groupStyle = 'margin-bottom:14px;';

  function field(id, label, placeholder, type) {
    return '<div style="' + groupStyle + '">' +
      '<label style="' + labelStyle + '">' + label + '</label>' +
      '<input id="' + id + '" type="' + (type||'text') + '" placeholder="' + placeholder + '" ' +
        'style="' + fieldStyle + '" ' +
        'onfocus="this.style.borderColor=\'#2563EB\'" onblur="this.style.borderColor=\'#E2E8F0\'">' +
    '</div>';
  }

  function injectSidePanel() {
    if (document.getElementById('alumniAlertSidePanel')) return;
    var p = document.createElement('div');
    p.id = 'alumniAlertSidePanel';
    p.style.cssText = 'display:none;position:fixed;top:0;right:0;width:400px;max-width:96vw;height:100vh;background:#F8FAFC;border-left:1px solid #E2E8F0;box-shadow:-6px 0 30px rgba(0,0,0,0.14);z-index:9999;flex-direction:column;font-family:system-ui,sans-serif;';
    p.innerHTML =
      // Header
      '<div style="padding:16px 20px;background:linear-gradient(135deg,#1E293B,#0F172A);color:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:38px;height:38px;border-radius:10px;background:rgba(245,158,11,0.18);display:flex;align-items:center;justify-content:center;">' +
            '<i class="fas fa-graduation-cap" style="color:#F59E0B;font-size:1.1rem;"></i>' +
          '</div>' +
          '<div>' +
            '<div style="font-weight:700;font-size:0.95rem;">Alumni Detail Found</div>' +
            '<div style="font-size:0.72rem;color:#94A3B8;margin-top:2px;">Fill details &amp; send to Global Chat</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="toggleAlumniAlertPanel()" style="background:rgba(255,255,255,0.08);border:none;color:#CBD5E1;font-size:0.85rem;cursor:pointer;padding:6px 10px;border-radius:8px;" title="Close">&#10005;</button>' +
      '</div>' +

      // Form body
      '<div style="flex:1;overflow-y:auto;padding:20px;">' +
        '<div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:10px 14px;margin-bottom:18px;display:flex;gap:8px;align-items:flex-start;">' +
          '<i class="fas fa-info-circle" style="color:#D97706;margin-top:2px;flex-shrink:0;"></i>' +
          '<p style="margin:0;font-size:0.78rem;color:#92400E;line-height:1.5;">Enter the alumni details below. Clicking <b>Send to Global Chat</b> will share a formatted card visible to all members.</p>' +
        '</div>' +

        field('aaf_name',    'Alumni Name *',   'e.g. Karthik Rajan') +
        field('aaf_regno',   'Reg / Roll No',   'e.g. 2046446') +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          field('aaf_dept',  'Department',      'e.g. CSE') +
          field('aaf_batch', 'Batch / Year',    'e.g. 2021') +
        '</div>' +

        field('aaf_company', 'Company / Organisation', 'e.g. Infosys') +
        field('aaf_desig',   'Designation / Role',    'e.g. Software Engineer') +

        '<div style="background:#F1F5F9;padding:12px;border-radius:10px;border:1px solid #E2E8F0;margin-bottom:14px;">' +
          '<div style="font-size:0.72rem;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">' +
            '<i class="fas fa-map-marker-alt"></i> Cascading Location Details' +
          '</div>' +
          '<div style="' + groupStyle + '">' +
            '<label style="' + labelStyle + '">Country</label>' +
            '<select id="aaf_country" style="' + fieldStyle + '"></select>' +
          '</div>' +
          '<div style="' + groupStyle + '">' +
            '<label style="' + labelStyle + '">State</label>' +
            '<select id="aaf_state" style="' + fieldStyle + '"></select>' +
          '</div>' +
          '<div>' +
            '<label style="' + labelStyle + '">City / District</label>' +
            '<select id="aaf_city" style="' + fieldStyle + '"></select>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          field('aaf_phone', 'Phone',  'e.g. +91 9800000000', 'tel') +
          field('aaf_email', 'Email',  'e.g. name@gmail.com',  'email') +
        '</div>' +

        field('aaf_linkedin', 'LinkedIn URL', 'https://linkedin.com/in/...', 'url') +

        '<div style="' + groupStyle + '">' +
          '<label style="' + labelStyle + '">Additional Notes</label>' +
          '<textarea id="aaf_notes" placeholder="Any extra details..." rows="3" ' +
            'style="' + fieldStyle + 'resize:vertical;" ' +
            'onfocus="this.style.borderColor=\'#2563EB\'" onblur="this.style.borderColor=\'#E2E8F0\'"></textarea>' +
        '</div>' +
      '</div>' +

      // Footer
      '<div style="padding:14px 20px;background:#fff;border-top:1px solid #E2E8F0;flex-shrink:0;">' +
        '<button id="aaf_submitBtn" onclick="submitAlumniAlertForm()" ' +
          'style="width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(37,99,235,0.3);transition:opacity 0.2s;" ' +
          'onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">' +
          '<i class="fas fa-paper-plane"></i> Send to Global Chat' +
        '</button>' +
      '</div>';

    document.body.appendChild(p);

    if (typeof initLocationCascade === 'function') {
      window._aafLocationCascade = initLocationCascade('aaf_country', 'aaf_state', 'aaf_city');
    }

    // Close on outside click
    document.addEventListener('click', function(e) {
      var panel = document.getElementById('alumniAlertSidePanel');
      var btn   = document.getElementById('alumniAlertNavBtn');
      if (panel && panel.style.display === 'flex' && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
        panel.style.display = 'none';
      }
    });
  }

  /* ── INIT ── */
  function init() {
    injectToast();
    injectNavIcon();
    injectSidePanel();
    // Seed last msg id, then poll
    var token = localStorage.getItem('token');
    if (token) {
      fetch('/api/v1/chat/messages?channelType=global&limit=1', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            _lastSeenMsgId = res.data[res.data.length - 1].message_id || 0;
          }
          setInterval(pollToasts, 5000);
        }).catch(function() { setInterval(pollToasts, 5000); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
