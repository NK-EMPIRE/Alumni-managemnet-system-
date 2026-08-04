/* ============================================================
   FULL-PAGE WHATSAPP-STYLE CHAT APPLICATION
   ============================================================ */
(function () {
  var _activeChannel = 'global'; // 'global', 'team', or 'private_USERID'
  var _privateTargetUser = null;
  var _lastGlobalId = 0;
  var _lastTeamId = 0;
  var _lastPrivateId = 0;
  var _chatPollTimer = null;
  var _mentionUsers = [];

  window.initWhatsAppChatPage = function () {
    var chatContainer = document.getElementById('chatPageApp');
    if (!chatContainer) return;

    renderChatLayout(chatContainer);
    loadChatChannels();
    switchChatChannel('global');

    if (!_chatPollTimer) {
      _chatPollTimer = setInterval(pollNewChatMessages, 3000);
    }
  };

  function renderChatLayout(container) {
    container.innerHTML = `
      <div class="whatsapp-app-container" style="display:flex;height:calc(100vh - 120px);background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Left Sidebar: Channels & Private Chats -->
        <div class="chat-sidebar-left" style="width:320px;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;">
          
          <!-- User Profile Header -->
          <div style="padding:16px;background:#0F172A;color:#fff;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:38px;height:38px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;" id="chatSelfAvatar">ME</div>
              <div>
                <div style="font-weight:600;font-size:0.9rem;" id="chatSelfName">My Profile</div>
                <div style="font-size:0.72rem;color:#94A3B8;" id="chatSelfRole">Online</div>
              </div>
            </div>
          </div>

          <!-- Channel Search Bar -->
          <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #E2E8F0;">
            <div style="position:relative;">
              <i class="fas fa-search" style="position:absolute;left:12px;top:10px;color:#94A3B8;font-size:0.85rem;"></i>
              <input type="text" id="chatSearchInput" placeholder="Search chats or members..." oninput="filterChatChannels()" style="width:100%;padding:8px 12px 8px 34px;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:20px;font-size:0.85rem;outline:none;">
            </div>
          </div>

          <!-- Channel List -->
          <div style="flex:1;overflow-y:auto;padding:8px 0;" id="chatChannelsList">
            
            <div class="chat-channel-item active" id="chan-global" onclick="switchChatChannel('global')" style="padding:12px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;border-bottom:1px solid #F1F5F9;transition:background 0.2s;">
              <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg, #3B82F6, #1D4ED8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;">
                <i class="fas fa-globe"></i>
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:0.9rem;color:#0F172A;display:flex;justify-content:space-between;">
                  <span>Global Channel</span>
                  <span style="font-size:0.7rem;color:#94A3B8;" id="time-global">Live</span>
                </div>
                <div style="font-size:0.8rem;color:#64748B;margin-top:2px;">All System Members</div>
              </div>
            </div>

            <div class="chat-channel-item" id="chan-team" onclick="switchChatChannel('team')" style="padding:12px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;border-bottom:1px solid #F1F5F9;transition:background 0.2s;">
              <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg, #10B981, #047857);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;">
                <i class="fas fa-users"></i>
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:0.9rem;color:#0F172A;display:flex;justify-content:space-between;">
                  <span>My Team Channel</span>
                  <span style="font-size:0.7rem;color:#94A3B8;" id="time-team">Team</span>
                </div>
                <div style="font-size:0.8rem;color:#64748B;margin-top:2px;">Assigned Team Communication</div>
              </div>
            </div>

            <div style="padding:12px 16px 6px;font-size:0.75rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">Direct Messages</div>
            <div id="chatPrivateList">
              <div style="padding:12px 16px;color:#94A3B8;font-size:0.8rem;text-align:center;">Loading contacts...</div>
            </div>

          </div>
        </div>

        <!-- Right Main: Active Messaging Screen -->
        <div class="chat-main-right" style="flex:1;display:flex;flex-direction:column;background:#F8FAFC;">
          
          <!-- Chat Header -->
          <div style="padding:14px 20px;background:#fff;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;" id="chatHeaderBar">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;border-radius:50%;background:#2563EB;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;" id="chatHeaderIcon">
                <i class="fas fa-globe"></i>
              </div>
              <div>
                <h3 style="margin:0;font-size:1rem;font-weight:700;color:#0F172A;" id="chatHeaderTitle">Global Channel</h3>
                <span style="font-size:0.78rem;color:#10B981;" id="chatHeaderSubtitle">● Active Community Chat</span>
              </div>
            </div>
          </div>

          <!-- Message Feed Area -->
          <div id="chatMessagesArea" style="flex:1;padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;background:#F1F5F9;">
            <div style="text-align:center;color:#94A3B8;font-size:0.85rem;padding:20px;">Loading chat messages...</div>
          </div>

          <!-- Input Box Area -->
          <div style="padding:14px 20px;background:#fff;border-top:1px solid #E2E8F0;position:relative;">
            
            <!-- Mention Dropdown -->
            <div id="mentionDropdown" style="display:none;position:absolute;bottom:70px;left:20px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.15);width:260px;max-height:180px;overflow-y:auto;z-index:100;"></div>

            <form onsubmit="handleSendWhatsAppMessage(event)" style="display:flex;gap:10px;align-items:center;">
              <input type="text" id="chatMessageInput" placeholder="Type a message... (Use @ to mention team members)" oninput="handleChatInputTyping(this)" style="flex:1;padding:12px 16px;border:1px solid #CBD5E1;border-radius:24px;outline:none;font-size:0.92rem;background:#F8FAFC;">
              <button type="submit" class="btn btn-primary" style="width:44px;height:44px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;background:#2563EB;border:none;">
                <i class="fas fa-paper-plane" style="color:#fff;font-size:1rem;"></i>
              </button>
            </form>
          </div>

        </div>

      </div>
    `;
  }

  window.switchChatChannel = function (channel, targetUser) {
    _activeChannel = channel;
    _privateTargetUser = targetUser || null;

    document.querySelectorAll('.chat-channel-item').forEach(function (el) { el.style.background = 'transparent'; });
    var targetEl = document.getElementById('chan-' + channel);
    if (targetEl) targetEl.style.background = '#E2E8F0';

    var headerTitle = document.getElementById('chatHeaderTitle');
    var headerSub = document.getElementById('chatHeaderSubtitle');
    var headerIcon = document.getElementById('chatHeaderIcon');

    if (channel === 'global') {
      if (headerTitle) headerTitle.innerText = 'Global Channel';
      if (headerSub) headerSub.innerText = '● All Members & Admins';
      if (headerIcon) headerIcon.innerHTML = '<i class="fas fa-globe"></i>';
    } else if (channel === 'team') {
      if (headerTitle) headerTitle.innerText = 'My Team Channel';
      if (headerSub) headerSub.innerText = '● Assigned Team Discussion';
      if (headerIcon) headerIcon.innerHTML = '<i class="fas fa-users"></i>';
    } else if (channel.startsWith('private_') && targetUser) {
      if (headerTitle) headerTitle.innerText = targetUser.name || 'Private Chat';
      if (headerSub) headerSub.innerText = '● ' + (targetUser.role || 'Member') + ' (' + (targetUser.department || 'Dept') + ')';
      if (headerIcon) headerIcon.innerHTML = (targetUser.name || 'P').charAt(0).toUpperCase();
    }

    loadMessagesForCurrentChannel();
  };

  function loadChatChannels() {
    // Load members list for DMs
    fetch('/api/v1/auth/me', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success && res.data) {
          var me = res.data;
          if (document.getElementById('chatSelfAvatar')) document.getElementById('chatSelfAvatar').innerText = (me.first_name || 'U').charAt(0).toUpperCase();
          if (document.getElementById('chatSelfName')) document.getElementById('chatSelfName').innerText = me.first_name + ' ' + (me.last_name || '');
          if (document.getElementById('chatSelfRole')) document.getElementById('chatSelfRole').innerText = me.role || 'User';
        }
      }).catch(function (err) { console.error(err); });

    // Load available users for DM
    fetch('/api/v1/users', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success) {
          var users = Array.isArray(res.data) ? res.data : (res.data.records || []);
          _mentionUsers = users;
          renderPrivateContacts(users);
        }
      }).catch(function () {
        var list = document.getElementById('chatPrivateList');
        if (list) list.innerHTML = '<div style="padding:10px 16px;color:#94A3B8;font-size:0.8rem;">No active direct contacts</div>';
      });
  }

  function renderPrivateContacts(users) {
    var list = document.getElementById('chatPrivateList');
    if (!list) return;

    if (users.length === 0) {
      list.innerHTML = '<div style="padding:10px 16px;color:#94A3B8;font-size:0.8rem;">No contacts found</div>';
      return;
    }

    var html = '';
    users.forEach(function (u) {
      var uName = u.first_name ? (u.first_name + ' ' + (u.last_name || '')) : (u.username || 'User');
      var uId = u.user_id;
      html += `
        <div class="chat-channel-item" id="chan-private_${uId}" onclick="switchChatChannel('private_${uId}', { id:${uId}, name:'${uName.replace(/'/g, "\\'")}', role:'${u.role_name || u.role || 'User'}', department:'${u.department || ''}' })" style="padding:10px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background 0.2s;">
          <div style="width:36px;height:36px;border-radius:50%;background:#E2E8F0;color:#334155;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">
            ${uName.charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;overflow:hidden;">
            <div style="font-weight:600;font-size:0.85rem;color:#1E293B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${uName}</div>
            <div style="font-size:0.75rem;color:#64748B;">${u.role_name || u.role || 'User'}</div>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
  }

  function loadMessagesForCurrentChannel() {
    var feed = document.getElementById('chatMessagesArea');
    if (!feed) return;

    feed.innerHTML = '<div style="text-align:center;color:#94A3B8;font-size:0.85rem;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';

    var endpoint = '/api/v1/chat/global';
    if (_activeChannel === 'team') endpoint = '/api/v1/chat/team';

    fetch(endpoint, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success) {
          var msgs = res.data || [];
          renderMessageFeed(msgs);
        } else {
          feed.innerHTML = '<div style="text-align:center;color:#EF4444;font-size:0.85rem;padding:20px;">Failed to load messages</div>';
        }
      })
      .catch(function () {
        feed.innerHTML = '<div style="text-align:center;color:#94A3B8;font-size:0.85rem;padding:20px;">Start of chat history</div>';
      });
  }

  function renderMessageFeed(msgs) {
    var feed = document.getElementById('chatMessagesArea');
    if (!feed) return;

    if (msgs.length === 0) {
      feed.innerHTML = '<div style="text-align:center;color:#94A3B8;font-size:0.85rem;padding:20px;">No messages yet. Send a message to start the conversation!</div>';
      return;
    }

    var html = '';
    msgs.forEach(function (m) {
      var isMe = m.is_me || m.isMe || false;
      var senderName = m.sender_name || m.username || 'User';
      var timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

      html += `
        <div style="display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'};margin-bottom:8px;">
          <div style="font-size:0.75rem;color:#64748B;margin-bottom:2px;padding:0 4px;">${senderName} • ${m.sender_role || 'Member'}</div>
          <div style="max-width:70%;padding:10px 14px;border-radius:16px;background:${isMe ? '#2563EB' : '#FFFFFF'};color:${isMe ? '#FFFFFF' : '#1E293B'};box-shadow:0 1px 3px rgba(0,0,0,0.05);border:${isMe ? 'none' : '1px solid #E2E8F0'};font-size:0.9rem;line-height:1.4;">
            ${escapeHtmlMessage(m.message_text || m.content || '')}
            <div style="font-size:0.68rem;opacity:0.8;text-align:right;margin-top:4px;">${timeStr} ${isMe ? '<i class="fas fa-check-double" style="margin-left:4px;"></i>' : ''}</div>
          </div>
        </div>
      `;
    });

    feed.innerHTML = html;
    feed.scrollTop = feed.scrollHeight;
  }

  function escapeHtmlMessage(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/@([a-zA-Z0-9_\s]+)/g, '<span style="color:#F59E0B;font-weight:600;">@$1</span>');
  }

  window.handleSendWhatsAppMessage = function (e) {
    e.preventDefault();
    var input = document.getElementById('chatMessageInput');
    if (!input || !input.value.trim()) return;

    var msg = input.value.trim();
    input.value = '';

    var endpoint = (_activeChannel === 'team') ? '/api/v1/chat/team' : '/api/v1/chat/global';

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      body: JSON.stringify({ message: msg })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success) {
          loadMessagesForCurrentChannel();
        }
      })
      .catch(function (err) { console.error('Send message error:', err); });
  };

  window.handleChatInputTyping = function (input) {
    var val = input.value;
    var dropdown = document.getElementById('mentionDropdown');
    if (!dropdown) return;

    var lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      var query = val.substring(lastAt + 1).toLowerCase();
      // Only show if @ comes after whitespace or is at start (not already part of a word before)
      var charBefore = lastAt > 0 ? val[lastAt - 1] : ' ';
      if (charBefore === ' ' || charBefore === '\n' || lastAt === 0) {
        var filtered = _mentionUsers.filter(function (u) {
          var name = u.first_name ? (u.first_name + ' ' + (u.last_name || '')) : (u.username || '');
          return name.toLowerCase().indexOf(query) !== -1;
        });

        if (filtered.length > 0) {
          var html = '<div style="padding:6px 12px;font-size:0.75rem;font-weight:700;color:#64748B;">Mention Team Member</div>';
          filtered.slice(0, 8).forEach(function (u) {
            var name = u.first_name ? (u.first_name + ' ' + (u.last_name || '')) : u.username;
            var role = u.role_name || u.role || 'Member';
            html += '<div onclick="selectMentionUser(\'' + name.replace(/'/g, "\\'") + '\', ' + lastAt + ')" style="padding:8px 12px;font-size:0.85rem;cursor:pointer;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;gap:8px;" onmouseover="this.style.background=\'#F8FAFC\'" onmouseout="this.style.background=\'#fff\'">'
              + '<div style="width:28px;height:28px;border-radius:50%;background:#DBEAFE;color:#2563EB;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.78rem;flex-shrink:0;">' + name.charAt(0).toUpperCase() + '</div>'
              + '<div><div style="font-weight:600;color:#1E293B;">' + name + '</div><div style="font-size:0.72rem;color:#64748B;">' + role + '</div></div>'
              + '</div>';
          });
          dropdown.innerHTML = html;
          dropdown.style.display = 'block';
        } else {
          dropdown.style.display = 'none';
        }
      } else {
        dropdown.style.display = 'none';
      }
    } else {
      dropdown.style.display = 'none';
    }
  };

  window.selectMentionUser = function (name, atIndex) {
    var input = document.getElementById('chatMessageInput');
    var dropdown = document.getElementById('mentionDropdown');
    if (input) {
      var val = input.value;
      // Replace from the @ symbol onwards with the selected name
      var before = (atIndex !== undefined && atIndex >= 0) ? val.substring(0, atIndex) : val.replace(/@\S*$/, '');
      input.value = before + '@' + name + ' ';
      input.focus();
    }
    if (dropdown) dropdown.style.display = 'none';
  };

  function pollNewChatMessages() {
    var sectionChat = document.getElementById('section-chat');
    if (sectionChat && sectionChat.style.display !== 'none') {
      loadMessagesForCurrentChannel();
    }
  }

  window.filterChatChannels = function () {
    var q = (document.getElementById('chatSearchInput') ? document.getElementById('chatSearchInput').value : '').toLowerCase();
    document.querySelectorAll('.chat-channel-item').forEach(function (item) {
      var text = item.innerText.toLowerCase();
      item.style.display = text.includes(q) ? 'flex' : 'none';
    });
  };

})();
