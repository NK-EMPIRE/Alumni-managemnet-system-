/* ============================================================
   NOTIFICATIONS WIDGET — Self-contained, matches existing dark theme
   Polls every 30s + real-time via Socket.io new_notification event
   ============================================================ */
(function () {
  'use strict';

  var _initialized = false;
  var _currentUserId = null;
  var _unreadCount = 0;
  var _panelOpen = false;
  var _pollTimer = null;
  var _socket = null;

  // Reuse existing dark palette consistent with chat.js
  var DK = {
    bg:          '#0f172a',
    surface:     '#1e293b',
    border:      '#334155',
    textPrimary: '#f1f5f9',
    textMuted:   '#94a3b8',
    accent:      '#3b82f6',
    accentHover: '#2563eb',
    success:     '#10b981',
    danger:      '#ef4444',
    warning:     '#f59e0b'
  };

  function $(id) { return document.getElementById(id); }
  function css(el, styles) { for (var k in styles) el.style[k] = styles[k]; }
  function token() { return localStorage.getItem('token') || ''; }

  // ── Parse userId from JWT ────────────────────────────────────────────────────
  function parseUserId() {
    var t = token();
    if (!t) return null;
    try { return JSON.parse(atob(t.split('.')[1])).userId || null; } catch (e) { return null; }
  }

  // ── API helpers ──────────────────────────────────────────────────────────────
  function apiFetch(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(url, opts).then(function (r) { return r.json(); });
  }

  // ── Build DOM ────────────────────────────────────────────────────────────────
  function buildDOM() {
    if ($('ntfFloatBtn')) return;

    // Inject keyframe + scrollbar styles
    var style = document.createElement('style');
    style.id = 'ntfStyles';
    style.textContent = [
      '@keyframes ntfSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}',
      '@keyframes ntfBell{0%,100%{transform:rotate(0)}15%{transform:rotate(15deg)}30%{transform:rotate(-10deg)}45%{transform:rotate(8deg)}60%{transform:rotate(-5deg)}75%{transform:rotate(3deg)}}',
      '#ntfBody::-webkit-scrollbar{width:6px}',
      '#ntfBody::-webkit-scrollbar-track{background:#0f172a}',
      '#ntfBody::-webkit-scrollbar-thumb{background:#334155;border-radius:6px}'
    ].join('');
    document.head.appendChild(style);

    // Floating bell button
    var btn = document.createElement('button');
    btn.id = 'ntfFloatBtn';
    btn.title = 'Notifications';
    btn.innerHTML = '🔔';
    btn.onclick = togglePanel;
    css(btn, {
      position: 'fixed', bottom: '96px', right: '24px',
      width: '52px', height: '52px', borderRadius: '50%',
      background: 'linear-gradient(135deg,#1e293b,#0f172a)',
      color: '#fff', border: '2px solid #334155',
      fontSize: '22px', boxShadow: 'none',
      cursor: 'pointer', zIndex: '2147483646',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform .2s',
      fontFamily: 'sans-serif', lineHeight: '1'
    });
    btn.onmouseenter = function () { this.style.transform = 'scale(1.1)'; this.style.animation = 'ntfBell .5s ease'; };
    btn.onmouseleave = function () { this.style.transform = 'scale(1)'; this.style.animation = 'none'; };
    document.body.appendChild(btn);

    // Unread badge on the bell button
    var badge = document.createElement('span');
    badge.id = 'ntfBadge';
    css(badge, {
      position: 'absolute', top: '-4px', right: '-4px',
      background: DK.danger, color: '#fff', fontSize: '10px',
      fontWeight: '700', padding: '2px 6px', borderRadius: '12px',
      border: '2px solid #0f172a', display: 'none', fontFamily: 'sans-serif'
    });
    btn.style.position = 'fixed';
    btn.appendChild(badge);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.id = 'ntfBackdrop';
    backdrop.onclick = togglePanel;
    css(backdrop, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      background: 'transparent', backdropFilter: 'none',
      zIndex: '2147483644', opacity: '0', pointerEvents: 'none',
      transition: 'opacity .3s'
    });
    document.body.appendChild(backdrop);

    // Side panel
    var panel = document.createElement('div');
    panel.id = 'ntfPanel';
    css(panel, {
      position: 'fixed', top: '0', right: '0',
      width: '380px', maxWidth: '100vw', height: '100vh',
      background: DK.bg, zIndex: '2147483645',
      display: 'none', flexDirection: 'column',
      boxShadow: 'none', visibility: 'hidden',
      transform: 'translateX(100%)',
      transition: 'transform .35s cubic-bezier(.16,1,.3,1)',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      willChange: 'transform', backfaceVisibility: 'hidden'
    });
    document.body.appendChild(panel);

    // Panel header
    var header = document.createElement('div');
    css(header, {
      background: DK.surface, borderBottom: '1px solid ' + DK.border,
      padding: '16px 20px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', flexShrink: '0'
    });

    var titleArea = document.createElement('div');
    css(titleArea, { display: 'flex', alignItems: 'center', gap: '12px' });

    var iconDiv = document.createElement('div');
    css(iconDiv, {
      width: '38px', height: '38px', borderRadius: '10px',
      background: 'rgba(245,158,11,.2)', color: '#fbbf24',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '18px', flexShrink: '0'
    });
    iconDiv.textContent = '🔔';

    var titleGroup = document.createElement('div');
    var titleEl = document.createElement('div');
    titleEl.textContent = 'Notifications';
    css(titleEl, { fontSize: '16px', fontWeight: '700', color: DK.textPrimary, fontFamily: 'sans-serif' });
    var subtitleEl = document.createElement('div');
    subtitleEl.id = 'ntfSubtitle';
    subtitleEl.textContent = 'Loading...';
    css(subtitleEl, { fontSize: '12px', color: DK.textMuted, marginTop: '2px', fontFamily: 'sans-serif' });
    titleGroup.appendChild(titleEl);
    titleGroup.appendChild(subtitleEl);
    titleArea.appendChild(iconDiv);
    titleArea.appendChild(titleGroup);

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.onclick = togglePanel;
    css(closeBtn, {
      background: 'rgba(255,255,255,.08)', border: 'none',
      color: DK.textPrimary, width: '34px', height: '34px',
      borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', flexShrink: '0', transition: 'background .2s'
    });
    closeBtn.onmouseenter = function () { css(this, { background: 'rgba(239,68,68,.75)' }); };
    closeBtn.onmouseleave = function () { css(this, { background: 'rgba(255,255,255,.08)' }); };

    header.appendChild(titleArea);
    header.appendChild(closeBtn);

    // Message body
    var body = document.createElement('div');
    body.id = 'ntfBody';
    css(body, {
      flex: '1', overflowY: 'auto', padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      background: DK.bg
    });
    body.innerHTML = '<div style="text-align:center;padding:40px 16px;color:' + DK.textMuted + ';font-size:14px;font-family:sans-serif"><div style="font-size:28px;margin-bottom:8px">🔔</div>Loading notifications...</div>';

    panel.appendChild(header);
    panel.appendChild(body);
  }

  // ── Toggle panel open/close ──────────────────────────────────────────────────
  function togglePanel() {
    var panel    = $('ntfPanel');
    var backdrop = $('ntfBackdrop');
    var btn      = $('ntfFloatBtn');
    if (!panel) return;

    _panelOpen = !_panelOpen;
    if (_panelOpen) {
      panel.style.display = 'flex';
      panel.style.visibility = 'visible';
      panel.style.boxShadow = '-8px 0 40px rgba(0,0,0,.55)';
      panel.style.willChange = 'transform';
      panel.style.transform  = 'translateX(0)';
      if (backdrop) { backdrop.style.opacity = '1'; backdrop.style.pointerEvents = 'auto'; }
      if (btn) btn.style.display = 'none';
      fetchAndRender();
      setTimeout(function () { panel.style.willChange = 'auto'; }, 400);
    } else {
      panel.style.willChange = 'transform';
      panel.style.transform  = 'translateX(100%)';
      if (backdrop) { backdrop.style.opacity = '0'; backdrop.style.pointerEvents = 'none'; }
      if (btn) btn.style.display = 'none';
      setTimeout(function () {
        if (!_panelOpen) {
          panel.style.display = 'none';
          panel.style.visibility = 'hidden';
          panel.style.boxShadow = 'none';
        }
        panel.style.willChange = 'auto';
      }, 380);
    }
  }
  window.toggleNotificationsPanel = togglePanel;

  // ── Render notifications list ────────────────────────────────────────────────
  function renderNotifications(notifications) {
    var body = $('ntfBody');
    var subtitle = $('ntfSubtitle');
    if (!body) return;

    var unread = notifications.filter(function (n) { return !n.is_read; }).length;
    _unreadCount = unread;
    updateBadge();

    if (subtitle) {
      subtitle.textContent = notifications.length === 0
        ? 'No notifications'
        : (unread > 0 ? unread + ' unread' : 'All caught up ✓');
    }

    if (!notifications.length) {
      body.innerHTML = '<div style="text-align:center;padding:40px 16px;color:' + DK.textMuted + ';font-size:14px;font-family:sans-serif"><div style="font-size:36px;margin-bottom:12px">🔔</div>No notifications yet</div>';
      return;
    }

    body.innerHTML = '';

    notifications.forEach(function (n) {
      var card = document.createElement('div');
      css(card, {
        background: n.is_read ? DK.surface : 'rgba(59,130,246,.12)',
        border: '1px solid ' + (n.is_read ? DK.border : 'rgba(59,130,246,.3)'),
        borderRadius: '12px', padding: '14px', cursor: 'default',
        transition: 'background .2s'
      });

      // Status indicator dot
      var topRow = document.createElement('div');
      css(topRow, { display: 'flex', alignItems: 'flex-start', gap: '10px' });

      var dot = document.createElement('div');
      var dotColor = n.status === 'confirmed' ? DK.success : (n.status === 'dismissed' ? DK.textMuted : DK.warning);
      css(dot, {
        width: '8px', height: '8px', borderRadius: '50%',
        background: dotColor, flexShrink: '0', marginTop: '5px'
      });

      var content = document.createElement('div');
      css(content, { flex: '1', minWidth: '0' });

      var typeLabel = document.createElement('div');
      typeLabel.textContent = n.type === 'linkedin_match' ? '🔗 LinkedIn Profile Match' : '📢 Notification';
      css(typeLabel, {
        fontSize: '11px', fontWeight: '700', color: DK.accent,
        textTransform: 'uppercase', letterSpacing: '.5px',
        marginBottom: '4px', fontFamily: 'sans-serif'
      });

      var msgEl = document.createElement('div');
      msgEl.textContent = n.message_text;
      css(msgEl, { fontSize: '13px', color: DK.textPrimary, lineHeight: '1.45', fontFamily: 'sans-serif', marginBottom: '4px' });

      if (n.detected_url) {
        var urlEl = document.createElement('a');
        urlEl.href = n.detected_url;
        urlEl.target = '_blank';
        urlEl.rel = 'noopener noreferrer';
        urlEl.textContent = n.detected_url.length > 45 ? n.detected_url.slice(0, 42) + '...' : n.detected_url;
        css(urlEl, { fontSize: '11px', color: DK.accent, display: 'block', marginBottom: '6px', fontFamily: 'sans-serif', wordBreak: 'break-all' });
        content.appendChild(urlEl);
      }

      var timeEl = document.createElement('div');
      timeEl.textContent = n.sender_name
        ? 'From ' + n.sender_name + ' · ' + formatTime(n.created_at)
        : formatTime(n.created_at);
      css(timeEl, { fontSize: '11px', color: DK.textMuted, fontFamily: 'sans-serif', marginBottom: '8px' });

      content.appendChild(typeLabel);
      content.appendChild(msgEl);
      content.appendChild(timeEl);

      topRow.appendChild(dot);
      topRow.appendChild(content);
      card.appendChild(topRow);

      // Action buttons for pending linkedin_match
      if (n.type === 'linkedin_match' && n.status === 'pending') {
        var btnRow = document.createElement('div');
        css(btnRow, { display: 'flex', gap: '8px', marginTop: '10px' });

        var confirmBtn = document.createElement('button');
        confirmBtn.textContent = '✓ Yes, that\'s me';
        confirmBtn.dataset.id = n.notification_id;
        confirmBtn.onclick = function () { handleConfirm(parseInt(this.dataset.id, 10), card); };
        css(confirmBtn, {
          flex: '1', padding: '8px', border: 'none', borderRadius: '8px',
          background: DK.success, color: '#fff', fontSize: '12px',
          fontWeight: '700', cursor: 'pointer', fontFamily: 'sans-serif',
          transition: 'opacity .2s'
        });
        confirmBtn.onmouseenter = function () { this.style.opacity = '.85'; };
        confirmBtn.onmouseleave = function () { this.style.opacity = '1'; };

        var dismissBtn = document.createElement('button');
        dismissBtn.textContent = '✗ Not me';
        dismissBtn.dataset.id = n.notification_id;
        dismissBtn.onclick = function () { handleDismiss(parseInt(this.dataset.id, 10), card); };
        css(dismissBtn, {
          flex: '1', padding: '8px', border: '1px solid ' + DK.border,
          borderRadius: '8px', background: 'transparent', color: DK.textMuted,
          fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          fontFamily: 'sans-serif', transition: 'all .2s'
        });
        dismissBtn.onmouseenter = function () { this.style.borderColor = DK.danger; this.style.color = DK.danger; };
        dismissBtn.onmouseleave = function () { this.style.borderColor = DK.border; this.style.color = DK.textMuted; };

        btnRow.appendChild(confirmBtn);
        btnRow.appendChild(dismissBtn);
        card.appendChild(btnRow);
      } else if (n.status === 'confirmed') {
        var statusBadge = document.createElement('div');
        statusBadge.textContent = '✓ LinkedIn profile saved to your account';
        css(statusBadge, {
          fontSize: '11px', color: DK.success, marginTop: '8px',
          fontWeight: '600', fontFamily: 'sans-serif'
        });
        card.appendChild(statusBadge);
      } else if (n.status === 'dismissed') {
        var statusBadge2 = document.createElement('div');
        statusBadge2.textContent = '✗ Dismissed';
        css(statusBadge2, {
          fontSize: '11px', color: DK.textMuted, marginTop: '8px',
          fontFamily: 'sans-serif'
        });
        card.appendChild(statusBadge2);
      }

      // Mark as read when panel is opened
      if (!n.is_read) {
        apiFetch('/api/v1/notifications/' + n.notification_id + '/read', { method: 'PATCH' }).catch(function () {});
      }

      body.appendChild(card);
    });
  }

  // ── Action handlers ──────────────────────────────────────────────────────────
  function handleConfirm(notifId, card) {
    apiFetch('/api/v1/notifications/' + notifId + '/confirm', { method: 'POST' })
      .then(function (res) {
        if (res && res.success) {
          showToast('✓ LinkedIn profile saved to your account!', false);
          fetchAndRender();
        } else {
          showToast((res && res.message) || 'Action failed', true);
        }
      })
      .catch(function () { showToast('Network error', true); });
  }

  function handleDismiss(notifId, card) {
    apiFetch('/api/v1/notifications/' + notifId + '/dismiss', { method: 'POST' })
      .then(function (res) {
        if (res && res.success) {
          showToast('Notification dismissed', false);
          fetchAndRender();
        } else {
          showToast((res && res.message) || 'Action failed', true);
        }
      })
      .catch(function () { showToast('Network error', true); });
  }

  // ── Fetch notifications from API ─────────────────────────────────────────────
  function fetchAndRender() {
    if (!token()) return;
    apiFetch('/api/v1/notifications')
      .then(function (res) {
        if (res && res.success && Array.isArray(res.data)) {
          renderNotifications(res.data);
        }
      })
      .catch(function () {});
  }

  // ── Fetch only the unread count (for badge, background polling) ───────────────
  function fetchUnreadCount() {
    if (!token()) return;
    apiFetch('/api/v1/notifications')
      .then(function (res) {
        if (res && res.success && Array.isArray(res.data)) {
          _unreadCount = res.data.filter(function (n) { return !n.is_read; }).length;
          updateBadge();
        }
      })
      .catch(function () {});
  }

  // ── Badge update ─────────────────────────────────────────────────────────────
  function updateBadge() {
    var badge = $('ntfBadge');
    if (!badge) return;
    if (_unreadCount > 0 && !_panelOpen) {
      badge.textContent = _unreadCount > 99 ? '99+' : String(_unreadCount);
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Socket.io real-time listener ─────────────────────────────────────────────
  function connectSocket() {
    if (!_currentUserId) return;
    if (typeof io === 'undefined') return; // socket.io not loaded

    try {
      _socket = io({ transports: ['websocket', 'polling'] });
      _socket.on('connect', function () {
        _socket.emit('joinUser', { userId: _currentUserId });
      });
      _socket.on('new_notification', function (data) {
        // Increment badge and re-fetch if panel is open — no popup toast
        _unreadCount++;
        updateBadge();
        if (_panelOpen) fetchAndRender();
        // showToast suppressed: toasts appear too frequently; badge is sufficient
      });
    } catch (e) {
      // Socket.io not critical — polling will cover it
    }
  }

  // ── Toast (reuses same style as chat.js) ────────────────────────────────────
  function showToast(msg, isError) {
    var old = document.getElementById('ntfToast');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var toast = document.createElement('div');
    toast.id = 'ntfToast';
    var bg = isError ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)';
    toast.innerHTML = msg;
    css(toast, {
      position: 'fixed', bottom: '160px', right: '28px',
      background: bg, color: '#fff',
      padding: '12px 20px', borderRadius: '12px',
      fontSize: '13px', fontWeight: '600', fontFamily: 'sans-serif',
      zIndex: '2147483647', boxShadow: '0 6px 20px rgba(0,0,0,.3)',
      opacity: '0', transform: 'translateY(10px)',
      transition: 'opacity .3s ease, transform .3s ease',
      pointerEvents: 'none', maxWidth: '280px'
    });
    document.body.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 15);
    setTimeout(function () {
      toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)';
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
    }, 3000);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function formatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var now = new Date();
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return d.toLocaleDateString();
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _currentUserId = parseUserId();
    if (!_currentUserId) return; // Not logged in — don't show widget

    buildDOM();
    fetchUnreadCount();
    connectSocket();

    // Poll every 30 seconds as fallback
    _pollTimer = setInterval(fetchUnreadCount, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
