/* ============================================================
   UNIVERSAL RIGHT-SIDE PANEL CHAT WIDGET - FULLY SELF-CONTAINED
   All styles are inline to avoid conflicts with Tailwind CSS / styles.css
   ============================================================ */
(function () {
    var _activeTab = 'global';
    var _lastGlobalId = 0;
    var _lastTeamId = 0;
    var _panelIsOpen = false;
    var _unreadGlobal = 0;
    var _unreadTeam = 0;
    var _pollInterval = null;
    var _currentUserId = null;
    var _initialized = false;

    // Dark theme palette
    var DK = {
        bg:          '#0f172a',
        surface:     '#1e293b',
        border:      '#334155',
        textPrimary: '#f1f5f9',
        textMuted:   '#94a3b8',
        accent:      '#3b82f6',
        accentHover: '#2563eb',
        badgeRed:    '#ef4444'
    };

    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function $(id) { return document.getElementById(id); }

    function css(el, styles) {
        for (var k in styles) { el.style[k] = styles[k]; }
    }

    function showToast(msg, isError) {
        var old = document.getElementById('cpToast');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var toast = document.createElement('div');
        toast.id = 'cpToast';
        var bg = isError
            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
            : 'linear-gradient(135deg,#10b981,#059669)';
        var icon = isError ? '✕' : '✓';
        toast.innerHTML = '<span style="font-size:16px;margin-right:8px">' + icon + '</span>' + msg;
        css(toast, {
            position: 'fixed', bottom: '100px', right: '28px',
            background: bg, color: '#fff',
            padding: '12px 20px', borderRadius: '12px',
            fontSize: '14px', fontWeight: '600', fontFamily: 'sans-serif',
            zIndex: '2147483647',
            boxShadow: isError ? '0 6px 20px rgba(239,68,68,.4)' : '0 6px 20px rgba(16,185,129,.4)',
            opacity: '0', transform: 'translateY(10px)',
            transition: 'opacity .3s ease, transform .3s ease',
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none', maxWidth: '280px'
        });
        document.body.appendChild(toast);
        setTimeout(function () { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 15);
        setTimeout(function () {
            toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)';
            setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
        }, 2500);
    }

    function init() {
        if (_initialized) return;
        _initialized = true;
        var token = localStorage.getItem('token');
        if (token) {
            try { var p = JSON.parse(atob(token.split('.')[1])); _currentUserId = p.userId || p.id; } catch (e) {}
        }
        buildDOM();
        if (token) {
            fetchMessages('global', true);
            fetchMessages('team', true);
            startPoll();
        } else {
            var body = $('cpBody');
            if (body) body.innerHTML = '<div style="text-align:center;padding:40px 16px;color:' + DK.textMuted + ';font-size:14px;font-family:sans-serif"><div style="font-size:32px;margin-bottom:12px">💬</div>Sign in to join the conversation</div>';
        }
    }

    function buildDOM() {
        if ($('cpFloatBtn')) return;

        var style = document.createElement('style');
        style.id = 'cpStyles';
        style.textContent = [
            '@keyframes cpSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}',
            '@keyframes cpFadeIn{from{opacity:0}to{opacity:1}}',
            '@keyframes cpBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}',
            '#cpBody::-webkit-scrollbar{width:6px}',
            '#cpBody::-webkit-scrollbar-track{background:#0f172a}',
            '#cpBody::-webkit-scrollbar-thumb{background:#334155;border-radius:6px}'
        ].join('');
        document.head.appendChild(style);

        var floatBtn = document.createElement('button');
        floatBtn.id = 'cpFloatBtn';
        floatBtn.title = 'Open Chat Panel';
        floatBtn.innerHTML = '💬';
        floatBtn.onclick = togglePanel;
        css(floatBtn, {
            position: 'fixed', bottom: '24px', right: '24px',
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            color: '#fff', border: 'none', fontSize: '28px',
            boxShadow: '0 8px 24px rgba(37,99,235,.5)',
            cursor: 'pointer', zIndex: '2147483647',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .2s, box-shadow .2s, opacity .25s',
            fontFamily: 'sans-serif', lineHeight: '1',
            opacity: '1', pointerEvents: 'auto'
        });
        floatBtn.onmouseenter = function () { this.style.transform = 'scale(1.1)'; };
        floatBtn.onmouseleave = function () { this.style.transform = 'scale(1)'; };
        document.body.appendChild(floatBtn);

        var badge = document.createElement('span');
        badge.id = 'cpTotalBadge';
        css(badge, {
            position: 'absolute', top: '-4px', right: '-4px',
            background: DK.badgeRed, color: '#fff', fontSize: '11px',
            fontWeight: '700', padding: '2px 7px', borderRadius: '12px',
            border: '2px solid #fff', display: 'none', fontFamily: 'sans-serif'
        });
        floatBtn.style.position = 'fixed';
        floatBtn.appendChild(badge);

        var backdrop = document.createElement('div');
        backdrop.id = 'cpBackdrop';
        backdrop.onclick = togglePanel;
        css(backdrop, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(5,10,20,.65)', backdropFilter: 'blur(4px)',
            zIndex: '2147483645', opacity: '0', pointerEvents: 'none',
            transition: 'opacity .3s'
        });
        document.body.appendChild(backdrop);

        var panel = document.createElement('div');
        panel.id = 'cpPanel';
        css(panel, {
            position: 'fixed', top: '0', right: '0',
            width: '380px', maxWidth: '100vw', height: '100vh',
            background: DK.bg, zIndex: '2147483646',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,.55)',
            transform: 'translateX(100%)',
            transition: 'transform .35s cubic-bezier(.16,1,.3,1)',
            fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased'
        });
        document.body.appendChild(panel);

        var header = document.createElement('div');
        css(header, {
            background: DK.surface,
            borderBottom: '1px solid ' + DK.border,
            padding: '16px 20px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            flexShrink: '0'
        });

        var titleArea = document.createElement('div');
        css(titleArea, { display: 'flex', alignItems: 'center', gap: '12px' });

        var icon = document.createElement('div');
        css(icon, {
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'rgba(59,130,246,.25)', color: '#60a5fa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: '0'
        });
        icon.textContent = '💬';

        var titleGroup = document.createElement('div');
        var titleText = document.createElement('div');
        titleText.id = 'cpTitle';
        titleText.textContent = 'Global Information Feed';
        css(titleText, { fontSize: '16px', fontWeight: '700', color: DK.textPrimary, fontFamily: 'sans-serif' });
        var subtitleText = document.createElement('div');
        subtitleText.id = 'cpSubtitle';
        subtitleText.textContent = 'Public announcements & site updates';
        css(subtitleText, { fontSize: '12px', color: DK.textMuted, marginTop: '2px', fontFamily: 'sans-serif' });
        titleGroup.appendChild(titleText);
        titleGroup.appendChild(subtitleText);
        titleArea.appendChild(icon);
        titleArea.appendChild(titleGroup);

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.title = 'Close Panel';
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

        var tabBar = document.createElement('div');
        css(tabBar, {
            display: 'flex', background: DK.surface,
            padding: '8px 10px', gap: '6px', flexShrink: '0',
            borderBottom: '1px solid ' + DK.border
        });

        var tabGlobal = document.createElement('button');
        tabGlobal.id = 'cpTabGlobal';
        tabGlobal.innerHTML = '🌐 Global <span id="cpBadgeGlobal" style="background:#ef4444;color:#fff;font-size:11px;padding:1px 6px;border-radius:10px;font-weight:700;display:none;margin-left:4px">0</span>';
        css(tabGlobal, {
            flex: '1', padding: '9px 8px', border: 'none', borderRadius: '8px',
            background: DK.accent, color: '#ffffff', fontWeight: '700',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'sans-serif',
            boxShadow: '0 2px 8px rgba(59,130,246,.35)', transition: 'all .2s'
        });
        tabGlobal.onclick = function () { switchTab('global'); };

        var tabTeam = document.createElement('button');
        tabTeam.id = 'cpTabTeam';
        tabTeam.innerHTML = '👥 Team <span id="cpBadgeTeam" style="background:#ef4444;color:#fff;font-size:11px;padding:1px 6px;border-radius:10px;font-weight:700;display:none;margin-left:4px">0</span>';
        css(tabTeam, {
            flex: '1', padding: '9px 8px', border: 'none', borderRadius: '8px',
            background: 'transparent', color: DK.textMuted, fontWeight: '600',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all .2s'
        });
        tabTeam.onclick = function () { switchTab('team'); };

        tabBar.appendChild(tabGlobal);
        tabBar.appendChild(tabTeam);

        var msgBody = document.createElement('div');
        msgBody.id = 'cpBody';
        css(msgBody, {
            flex: '1', overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            background: DK.bg
        });
        msgBody.innerHTML = '<div style="text-align:center;padding:30px;color:' + DK.textMuted + ';font-size:14px;font-family:sans-serif"><div style="font-size:24px;margin-bottom:8px">⏳</div>Loading messages...</div>';

        var footer = document.createElement('div');
        css(footer, {
            padding: '12px 14px', background: DK.surface,
            borderTop: '1px solid ' + DK.border, display: 'flex',
            alignItems: 'center', gap: '8px', flexShrink: '0'
        });

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'cpInput';
        input.placeholder = 'Share information with everyone...';
        input.onkeydown = function (e) { if (e.key === 'Enter') sendMsg(); };
        css(input, {
            flex: '1', border: '1px solid ' + DK.border, borderRadius: '10px',
            padding: '10px 14px', fontSize: '14px', outline: 'none',
            background: DK.bg, fontFamily: 'sans-serif',
            color: DK.textPrimary, boxSizing: 'border-box'
        });
        input.onfocus = function () { css(this, { border: '1px solid ' + DK.accent, background: '#0d1726', boxShadow: '0 0 0 3px rgba(59,130,246,.2)' }); };
        input.onblur  = function () { css(this, { border: '1px solid ' + DK.border,  background: DK.bg,     boxShadow: 'none' }); };

        var sendBtn = document.createElement('button');
        sendBtn.innerHTML = '&#10148;';
        sendBtn.title = 'Send Message';
        sendBtn.onclick = sendMsg;
        css(sendBtn, {
            width: '42px', height: '42px', borderRadius: '10px',
            background: DK.accent, color: '#fff', border: 'none',
            fontSize: '18px', cursor: 'pointer', flexShrink: '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s, transform .1s', fontFamily: 'sans-serif'
        });
        sendBtn.onmouseenter = function () { css(this, { background: DK.accentHover, transform: 'scale(1.05)' }); };
        sendBtn.onmouseleave = function () { css(this, { background: DK.accent,      transform: 'scale(1)' }); };

        footer.appendChild(input);
        footer.appendChild(sendBtn);

        panel.appendChild(header);
        panel.appendChild(tabBar);
        panel.appendChild(msgBody);
        panel.appendChild(footer);
    }

    function togglePanel() {
        var panel    = $('cpPanel');
        var backdrop = $('cpBackdrop');
        var floatBtn = $('cpFloatBtn');
        if (!panel) return;

        _panelIsOpen = !_panelIsOpen;
        if (_panelIsOpen) {
            panel.style.willChange = 'transform';
            panel.style.transform = 'translateX(0)';
            if (backdrop) { backdrop.style.opacity = '1'; backdrop.style.pointerEvents = 'auto'; }
            if (floatBtn) { floatBtn.style.display = 'none'; floatBtn.style.pointerEvents = 'none'; }
            if (_activeTab === 'global') _unreadGlobal = 0;
            if (_activeTab === 'team')   _unreadTeam   = 0;
            updateBadges();
            var token = localStorage.getItem('token');
            if (token) fetchMessages(_activeTab, true);
            // After animation completes, reset will-change so text renders sharply
            setTimeout(function () {
                panel.style.willChange = 'auto';
                var i = $('cpInput'); if (i) i.focus();
            }, 400);
        } else {
            panel.style.willChange = 'transform';
            panel.style.transform = 'translateX(100%)';
            if (backdrop) { backdrop.style.opacity = '0'; backdrop.style.pointerEvents = 'none'; }
            if (floatBtn) { floatBtn.style.display = 'flex'; floatBtn.style.pointerEvents = 'auto'; }
            setTimeout(function () { panel.style.willChange = 'auto'; }, 400);
        }
    }
    window.toggleChatPanel = togglePanel;

    function switchTab(channel) {
        if (_activeTab === channel) return;
        _activeTab = channel;
        var tabG  = $('cpTabGlobal');
        var tabT  = $('cpTabTeam');
        var title = $('cpTitle');
        var sub   = $('cpSubtitle');
        var inp   = $('cpInput');

        if (channel === 'global') {
            if (tabG) css(tabG, { background: DK.accent, color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,.35)', fontWeight: '700' });
            if (tabT) css(tabT, { background: 'transparent', color: DK.textMuted, boxShadow: 'none', fontWeight: '600' });
            if (title) title.textContent = 'Global Information Feed';
            if (sub)   sub.textContent   = 'Public announcements & site updates';
            if (inp)   inp.placeholder   = 'Share information with everyone...';
            _unreadGlobal = 0;
        } else {
            if (tabT) css(tabT, { background: DK.accent, color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,.35)', fontWeight: '700' });
            if (tabG) css(tabG, { background: 'transparent', color: DK.textMuted, boxShadow: 'none', fontWeight: '600' });
            if (title) title.textContent = 'Team Workspace';
            if (sub)   sub.textContent   = 'Internal team discussion & chat';
            if (inp)   inp.placeholder   = 'Type a message to team members...';
            _unreadTeam = 0;
        }
        updateBadges();
        var token = localStorage.getItem('token');
        if (token) fetchMessages(channel, true);
    }
    window.switchChatTab = switchTab;

    function updateBadges() {
        var bg    = $('cpBadgeGlobal');
        var bt    = $('cpBadgeTeam');
        var total = $('cpTotalBadge');
        if (bg) { bg.textContent = _unreadGlobal; bg.style.display = _unreadGlobal > 0 ? 'inline' : 'none'; }
        if (bt) { bt.textContent = _unreadTeam;   bt.style.display = _unreadTeam   > 0 ? 'inline' : 'none'; }
        var t = _unreadGlobal + _unreadTeam;
        if (total) { total.textContent = t > 99 ? '99+' : t; total.style.display = (t > 0 && !_panelIsOpen) ? 'inline' : 'none'; }
    }

    function fetchMessages(channel, isInitial) {
        var token = localStorage.getItem('token');
        if (!token) return;
        var lastId = channel === 'global' ? _lastGlobalId : _lastTeamId;
        var url = '/api/v1/chat/messages?channelType=' + channel + '&limit=50';
        if (!isInitial && lastId > 0) url += '&sinceId=' + lastId;
        fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (!res || !res.success || !Array.isArray(res.data)) return;
                var data = res.data;
                if (data.length > 0) {
                    if (_activeTab === channel) renderMessages(data, isInitial);
                    var newest = data[data.length - 1];
                    if (newest && newest.message_id) {
                        if (channel === 'global' && newest.message_id > _lastGlobalId) _lastGlobalId = newest.message_id;
                        if (channel === 'team'   && newest.message_id > _lastTeamId)   _lastTeamId   = newest.message_id;
                    }
                    if (!isInitial) {
                        var fromOthers = data.filter(function (m) {
                            return !_currentUserId || parseInt(m.user_id, 10) !== parseInt(_currentUserId, 10);
                        }).length;
                        if (fromOthers > 0 && !_panelIsOpen) {
                            if (channel === 'global') _unreadGlobal += fromOthers;
                            else                      _unreadTeam   += fromOthers;
                            updateBadges();
                        }
                    }
                } else if (isInitial && _activeTab === channel) {
                    var body = $('cpBody');
                    if (body) body.innerHTML = '<div style="text-align:center;padding:40px 16px;color:' + DK.textMuted + ';font-size:14px;font-family:sans-serif"><div style="font-size:32px;margin-bottom:8px">💬</div>No messages yet. Start the conversation!</div>';
                }
            })
            .catch(function () {});
    }

    function renderMessages(messages, isInitial) {
        var body = $('cpBody');
        if (!body) return;
        if (isInitial) body.innerHTML = '';
        messages.forEach(function (msg) {
            var isMine = _currentUserId && parseInt(msg.user_id, 10) === parseInt(_currentUserId, 10);
            var item = document.createElement('div');
            css(item, {
                display: 'flex', flexDirection: 'column', maxWidth: '82%',
                alignSelf:  isMine ? 'flex-end'  : 'flex-start',
                alignItems: isMine ? 'flex-end'  : 'flex-start'
            });
            if (!isMine) {
                var senderRow = document.createElement('div');
                senderRow.style.cssText = 'font-size:12px;color:' + DK.textMuted + ';margin-bottom:3px;display:flex;align-items:center;gap:6px;font-family:sans-serif';
                var name = document.createElement('span');
                name.textContent = msg.sender_name || 'User';
                senderRow.appendChild(name);
                if (msg.sender_role) {
                    var pill = document.createElement('span');
                    pill.textContent = msg.sender_role;
                    pill.style.cssText = 'background:#1e3a5f;color:#93c5fd;font-size:10px;padding:1px 7px;border-radius:4px;font-weight:700;text-transform:uppercase;font-family:sans-serif;letter-spacing:.5px';
                    senderRow.appendChild(pill);
                }
                item.appendChild(senderRow);
            }
            var bubble = document.createElement('div');
            bubble.textContent = msg.message_text;
            css(bubble, {
                padding: '10px 14px',
                borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word',
                background: isMine ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : DK.surface,
                color: isMine ? '#fff' : DK.textPrimary,
                border: isMine ? 'none' : '1px solid ' + DK.border,
                boxShadow: isMine ? '0 2px 8px rgba(59,130,246,.3)' : '0 1px 4px rgba(0,0,0,.25)',
                fontFamily: 'sans-serif'
            });
            var timeDiv = document.createElement('div');
            timeDiv.textContent = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            timeDiv.style.cssText = 'font-size:11px;color:' + DK.textMuted + ';margin-top:4px;font-family:sans-serif';
            item.appendChild(bubble);
            item.appendChild(timeDiv);
            body.appendChild(item);
        });
        body.scrollTop = body.scrollHeight;
    }

    function sendMsg() {
        var input = $('cpInput');
        if (!input) return;
        var text = (input.value || '').trim();
        if (!text) return;
        var token = localStorage.getItem('token');
        if (!token) { showToast('Please sign in to send messages.', true); return; }
        input.value = '';
        fetch('/api/v1/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ messageText: text, channelType: _activeTab })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.success && res.data) {
                    renderMessages([res.data], false);
                    if (_activeTab === 'global' && res.data.message_id > _lastGlobalId) _lastGlobalId = res.data.message_id;
                    if (_activeTab === 'team'   && res.data.message_id > _lastTeamId)   _lastTeamId   = res.data.message_id;
                    showToast('Message sent! 🚀', false);
                } else {
                    showToast('Failed to send message.', true);
                }
            })
            .catch(function () { showToast('Network error. Try again.', true); });
    }
    window.sendChatMessage = sendMsg;

    function startPoll() {
        if (_pollInterval) clearInterval(_pollInterval);
        _pollInterval = setInterval(function () { fetchMessages(_activeTab, false); }, 4000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
