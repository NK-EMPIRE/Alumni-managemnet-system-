/* Group Chat Workspace Widget JS */
(function () {
    var _chatLastMessageId = 0;
    var _chatIsOpen = false;
    var _chatUnreadCount = 0;
    var _chatPollingInterval = null;
    var _currentUserId = null;

    // Base64 notification sound (subtle soft chime)
    var _notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFb3WFiYmHhYaEhISAgICAfn5+fn19fXx8fHx7e3t7enp6enp5eXl5eHh4eHd3d3d2dnZ2dnU1NTU0NDQ0NDMzMzMyMjIyMTExMTAwMDAvLy8vLi4uLi0tLS0sLCwsKysrKyoqKiopKSkpKCgoKCgmJiYmJSUlJSUkICAgICE');

    function initWorkspaceChat() {
        var token = localStorage.getItem('token');
        if (!token) return;

        try {
            var payload = JSON.parse(atob(token.split('.')[1]));
            _currentUserId = payload.userId || payload.id;
        } catch (e) { }

        injectChatDOM();
        fetchMessages(true);
        startPolling();
    }

    function injectChatDOM() {
        if (document.getElementById('chatLauncherBtn')) return;

        // Launcher Button
        var btn = document.createElement('button');
        btn.id = 'chatLauncherBtn';
        btn.className = 'chat-launcher-btn';
        btn.title = 'Open Workspace Group Chat';
        btn.innerHTML = '<i class="fas fa-comments"></i><span class="chat-badge" id="chatUnreadBadge">0</span>';
        btn.onclick = toggleChatWidget;
        document.body.appendChild(btn);

        // Container
        var container = document.createElement('div');
        container.id = 'chatWidgetContainer';
        container.className = 'chat-widget-container';
        container.innerHTML =
            '<div class="chat-header">' +
            '  <div class="chat-header-title"><i class="fas fa-users" style="color:#60A5FA;"></i> Faculty Workspace Chat</div>' +
            '  <div class="chat-header-actions">' +
            '    <button class="chat-header-btn" onclick="window.toggleChatWidget()" title="Minimize"><i class="fas fa-minus"></i></button>' +
            '  </div>' +
            '</div>' +
            '<div class="chat-messages-body" id="chatMessagesBody">' +
            '  <div style="text-align:center;color:#94A3B8;padding:20px;font-size:0.8rem;"><i class="fas fa-spinner fa-spin"></i> Loading workspace messages...</div>' +
            '</div>' +
            '<div class="chat-footer">' +
            '  <input type="text" id="chatInputText" class="chat-input" placeholder="Type a message to faculty team..." onkeypress="if(event.key===\'Enter\')window.sendChatMessage()">' +
            '  <button class="chat-send-btn" onclick="window.sendChatMessage()" title="Send"><i class="fas fa-paper-plane"></i></button>' +
            '</div>';

        document.body.appendChild(container);
    }

    window.toggleChatWidget = function () {
        var container = document.getElementById('chatWidgetContainer');
        if (!container) return;
        _chatIsOpen = !_chatIsOpen;
        if (_chatIsOpen) {
            container.classList.add('open');
            _chatUnreadCount = 0;
            updateUnreadBadge();
            scrollToBottom();
            var input = document.getElementById('chatInputText');
            if (input) input.focus();
        } else {
            container.classList.remove('open');
        }
    };

    function updateUnreadBadge() {
        var badge = document.getElementById('chatUnreadBadge');
        if (!badge) return;
        if (_chatUnreadCount > 0 && !_chatIsOpen) {
            badge.textContent = _chatUnreadCount > 99 ? '99+' : _chatUnreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    function playNotificationSound() {
        try {
            _notificationSound.play().catch(function () { });
        } catch (e) { }
    }

    function fetchMessages(isInitial) {
        var token = localStorage.getItem('token');
        if (!token) return;

        var url = '/api/v1/chat/messages?limit=50';
        if (!isInitial && _chatLastMessageId > 0) {
            url += '&sinceId=' + _chatLastMessageId;
        }

        fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(function (r) { return r.json(); }).then(function (res) {
            if (res && res.success && Array.isArray(res.data)) {
                if (res.data.length > 0) {
                    renderMessages(res.data, isInitial);
                    var newest = res.data[res.data.length - 1];
                    if (newest && newest.message_id > _chatLastMessageId) {
                        _chatLastMessageId = newest.message_id;
                    }
                } else if (isInitial) {
                    var body = document.getElementById('chatMessagesBody');
                    if (body) body.innerHTML = '<div style="text-align:center;color:#94A3B8;padding:20px;font-size:0.8rem;"><i class="fas fa-comments" style="font-size:1.5rem;display:block;margin-bottom:6px;"></i> Welcome to Faculty Workspace Chat!</div>';
                }
            }
        }).catch(function (err) { });
    }

    function renderMessages(messages, isInitial) {
        var body = document.getElementById('chatMessagesBody');
        if (!body) return;

        if (isInitial) {
            body.innerHTML = '';
        }

        var newMessagesFromOthers = 0;

        messages.forEach(function (msg) {
            var isSentByMe = _currentUserId && (parseInt(msg.user_id, 10) === parseInt(_currentUserId, 10));
            if (!isSentByMe && !isInitial) {
                newMessagesFromOthers++;
            }

            var row = document.createElement('div');
            row.className = 'chat-msg-row ' + (isSentByMe ? 'sent' : 'received');

            var senderInfo = (msg.sender_name || 'User') + (msg.sender_role ? ' (' + msg.sender_role + ')' : '');
            var timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            var html = '';
            if (!isSentByMe) {
                html += '<div class="chat-msg-sender">' + escapeHtml(senderInfo) + '</div>';
            }
            html += '<div class="chat-msg-bubble">' + escapeHtml(msg.message_text) + '</div>';
            html += '<div class="chat-msg-time">' + timeStr + '</div>';

            row.innerHTML = html;
            body.appendChild(row);
        });

        if (newMessagesFromOthers > 0 && !_chatIsOpen) {
            _chatUnreadCount += newMessagesFromOthers;
            updateUnreadBadge();
            playNotificationSound();
        }

        scrollToBottom();
    }

    function scrollToBottom() {
        var body = document.getElementById('chatMessagesBody');
        if (body) {
            body.scrollTop = body.scrollHeight;
        }
    }

    window.sendChatMessage = function () {
        var input = document.getElementById('chatInputText');
        if (!input) return;
        var text = input.value ? input.value.trim() : '';
        if (!text) return;

        var token = localStorage.getItem('token');
        if (!token) return;

        input.value = '';

        fetch('/api/v1/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ messageText: text })
        }).then(function (r) { return r.json(); }).then(function (res) {
            if (res && res.success && res.data) {
                renderMessages([res.data], false);
                if (res.data.message_id > _chatLastMessageId) {
                    _chatLastMessageId = res.data.message_id;
                }
            }
        }).catch(function (err) { });
    };

    function startPolling() {
        if (_chatPollingInterval) clearInterval(_chatPollingInterval);
        _chatPollingInterval = setInterval(function () {
            fetchMessages(false);
        }, 4000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkspaceChat);
    } else {
        initWorkspaceChat();
    }
})();
