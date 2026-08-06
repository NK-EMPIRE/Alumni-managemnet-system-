/* ============================================================
   FULL-PAGE WHATSAPP-STYLE CHAT APPLICATION
   - WhatsApp styling & layout (bubbles, checkmarks, date chips)
   - Read Receipts (Blue Double Ticks ✓✓ when seen)
   - Avatars beside every message bubble
   - WhatsApp Member Profile Modal (view user profile, role, dept, & DM)
   - Channel-scoped @mentions (Global: all members, Team: team members)
   - Excludes current logged-in user from @mention candidates
   - User online & last seen status tracking
   ============================================================ */
(function () {
  var _activeChannel = 'global'; // 'global', 'team', or 'private_USERID'
  var _privateTargetUser = null; // { id, name, role, department, email, last_seen, is_online }
  var _currentUserId = null;
  var _currentUserName = 'Me';
  var _currentUserInitial = 'M';
  var _chatPollTimer = null;
  var _heartbeatTimer = null;
  var _channelMentionUsers = []; // Cached candidates for active channel

  // Instantly decode JWT to get userId without waiting for /me API
  function decodeJwtPayload(token) {
    try {
      var parts = token.split('.');
      if (parts.length < 2) return null;
      var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var pad = base64.length % 4;
      if (pad) base64 += '===='.slice(pad);
      return JSON.parse(atob(base64));
    } catch (e) { return null; }
  }

  // Avatar color generator based on user ID or string
  var AVATAR_COLORS = [
    'linear-gradient(135deg, #2563EB, #1D4ED8)',
    'linear-gradient(135deg, #10B981, #047857)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    'linear-gradient(135deg, #EC4899, #BE185D)',
    'linear-gradient(135deg, #06B6D4, #0E7490)',
    'linear-gradient(135deg, #6366F1, #4338CA)'
  ];

  function getAvatarGradient(id) {
    var num = parseInt(id, 10) || 0;
    return AVATAR_COLORS[num % AVATAR_COLORS.length];
  }

  window.initWhatsAppChatPage = function () {
    var chatContainer = document.getElementById('chatPageApp');
    if (!chatContainer) return;

    renderChatLayout(chatContainer);
    loadCurrentUserAndContacts();
    switchChatChannel('global');

    if (!_chatPollTimer) {
      _chatPollTimer = setInterval(pollNewChatMessages, 750);
    }
    if (!_heartbeatTimer) {
      sendChatHeartbeat();
      _heartbeatTimer = setInterval(sendChatHeartbeat, 30000);
    }
  };

  function sendChatHeartbeat() {
    var token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/v1/chat/heartbeat', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(function () {});
  }

  function renderChatLayout(container) {
    container.innerHTML = `
      <div class="whatsapp-app-container" style="display:flex;height:calc(100vh - var(--navbar-height, 64px));width:100%;margin:0;background:#fff;border-radius:0;overflow:hidden;border:none;box-shadow:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;position:relative;">
        
        <!-- Left Sidebar: Channels & Private Chats -->
        <div class="chat-sidebar-left" style="width:340px;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;">
          
          <!-- User Profile Header -->
          <div class="chat-profile-header" style="padding:16px 18px;background:linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%);color:#fff;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg, #6366F1, #8B5CF6);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#fff;box-shadow:0 0 0 2px #A5B4FC, 0 4px 12px rgba(99,102,241,0.5);" id="chatSelfAvatar">ME</div>
              <div class="chat-self-info">
                <div style="font-weight:700;font-size:0.95rem;color:#F8FAFC;" id="chatSelfName">My Profile</div>
                <div style="font-size:0.75rem;color:#34D399;display:flex;align-items:center;gap:5px;margin-top:2px;" id="chatSelfRole">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;box-shadow:0 0 8px #10B981;"></span> Online
                </div>
              </div>
            </div>
            <!-- Sidebar Close Toggle Button -->
            <button onclick="event.stopPropagation(); toggleChatSidebarCollapse();" id="chatSidebarToggleBtn" title="Close Sidebar" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:34px;height:34px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.95rem;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <i class="fas fa-outdent"></i>
            </button>
          </div>

          <!-- Search Bar -->
          <div class="chat-search-bar-container" style="padding:14px 16px;background:transparent;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="position:relative;">
              <i class="fas fa-search" style="position:absolute;left:14px;top:11px;color:#94A3B8;font-size:0.88rem;"></i>
              <input type="text" id="chatSearchInput" placeholder="Search channels or contacts..." oninput="filterChatChannels()" style="width:100%;padding:9px 12px 9px 38px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;font-size:0.85rem;color:#fff;outline:none;box-sizing:border-box;transition:all 0.2s;" onfocus="this.style.borderColor='#818CF8';this.style.background='rgba(255,255,255,0.12)';" onblur="this.style.borderColor='rgba(255,255,255,0.12)';this.style.background='rgba(255,255,255,0.07)';">
            </div>
          </div>

          <!-- Channel List -->
          <div style="flex:1;overflow-y:auto;padding:10px 0;" id="chatChannelsList">
            
            <div class="chat-channel-item active" id="chan-global" title="Global Channel" onclick="switchChatChannel('global')" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
              <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg, #3B82F6, #1D4ED8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;flex-shrink:0;box-shadow:0 4px 12px rgba(37,99,235,0.4);">
                <i class="fas fa-globe"></i>
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="font-weight:700;font-size:0.9rem;display:flex;justify-content:space-between;align-items:center;">
                  <span>Global Channel</span>
                  <span style="font-size:0.68rem;color:#10B981;font-weight:700;background:rgba(16,185,129,0.2);padding:2px 8px;border-radius:10px;" id="time-global">● Live</span>
                </div>
                <div style="font-size:0.78rem;opacity:0.75;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">All System Members</div>
              </div>
            </div>

            <div class="chat-channel-item" id="chan-team" title="My Team Channel" onclick="switchChatChannel('team')" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
              <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg, #10B981, #047857);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;flex-shrink:0;box-shadow:0 4px 12px rgba(16,185,129,0.4);">
                <i class="fas fa-users"></i>
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="font-weight:700;font-size:0.9rem;display:flex;justify-content:space-between;align-items:center;">
                  <span>My Team Channel</span>
                  <span style="font-size:0.68rem;color:#818CF8;font-weight:700;background:rgba(99,102,241,0.2);padding:2px 8px;border-radius:10px;" id="time-team">Team</span>
                </div>
                <div style="font-size:0.78rem;opacity:0.75;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Assigned Team Communication</div>
              </div>
            </div>

            <div class="chat-section-label" style="padding:16px 20px 8px;font-size:0.72rem;font-weight:800;color:#818CF8;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-comments" style="font-size:0.8rem;"></i> Direct Messages
            </div>
            <div id="chatPrivateList">
              <div style="padding:14px 16px;color:#94A3B8;font-size:0.82rem;text-align:center;">Loading contacts...</div>
            </div>

          </div>
        </div>

        <!-- Right Main: Active Messaging Screen -->
        <div class="chat-main-right" style="flex:1;display:flex;flex-direction:column;background:#F8FAFC;position:relative;">
          
          <!-- Chat Header -->
          <div style="padding:14px 22px;background:#FFFFFF;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;z-index:10;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.02);" id="chatHeaderBar" onclick="handleHeaderProfileClick()">
            <div style="display:flex;align-items:center;gap:12px;">
              <!-- Sidebar Open/Close Toggle Button on Main Header -->
              <button onclick="event.stopPropagation(); toggleChatSidebarCollapse();" id="chatMainSidebarToggleBtn" title="Toggle Channels & Contacts Sidebar" style="background:#EEF2FF;border:none;color:#4F46E5;width:38px;height:38px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;transition:all 0.2s;margin-right:2px;" onmouseover="this.style.background='#E0E7FF'" onmouseout="this.style.background='#EEF2FF'">
                <i class="fas fa-bars"></i>
              </button>
              <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg, #4F46E5, #3B82F6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.15rem;font-weight:700;box-shadow:0 4px 12px rgba(79,70,229,0.3);" id="chatHeaderIcon">
                <i class="fas fa-globe"></i>
              </div>
              <div>
                <h3 style="margin:0;font-size:1.05rem;font-weight:700;color:#0F172A;" id="chatHeaderTitle">Global Channel</h3>
                <div style="font-size:0.78rem;color:#10B981;margin-top:2px;font-weight:600;" id="chatHeaderSubtitle">● All Members & Admins</div>
              </div>
            </div>
            <div style="font-size:0.8rem;color:#4F46E5;font-weight:600;background:#EEF2FF;padding:6px 16px;border-radius:20px;" id="chatHeaderActionInfo"><i class="fas fa-info-circle"></i> View Info</div>
          </div>

          <!-- Message Feed Area with Ultra-Premium Wallpaper -->
          <div id="chatMessagesArea" class="chat-feed-wallpaper" style="flex:1;padding:20px 28px;overflow-y:auto;display:flex;flex-direction:column;gap:14px;">
            <div style="text-align:center;color:#94A3B8;font-size:0.85rem;padding:20px;">Loading chat messages...</div>
          </div>

          <!-- Mention Auto-Complete Popup -->
          <div id="mentionDropdown" style="display:none;position:absolute;bottom:75px;left:20px;background:#fff;border:1px solid #CBD5E1;border-radius:14px;box-shadow:0 12px 35px rgba(0,0,0,0.18);width:400px;max-width:90%;max-height:320px;overflow-y:auto;z-index:1000;"></div>

          <!-- Input Box Area -->
          <div style="padding:14px 24px;background:#FFFFFF;border-top:1px solid #E2E8F0;position:relative;z-index:10;box-shadow:0 -4px 20px rgba(0,0,0,0.03);" class="chat-input-bar">
            <form onsubmit="handleSendWhatsAppMessage(event)" style="display:flex;gap:12px;align-items:center;">
              <input type="text" id="chatMessageInput" placeholder="Type a message... (Use @ to mention members)" oninput="handleChatInputTyping(this)" style="flex:1;padding:12px 20px;border:1.5px solid #E2E8F0;border-radius:24px;outline:none;font-size:0.93rem;background:#F1F5F9;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03);transition:all 0.2s;" onfocus="this.style.borderColor='#4F46E5';this.style.background='#fff';this.style.boxShadow='0 0 0 3.5px rgba(79,70,229,0.15)';" onblur="this.style.borderColor='#E2E8F0';this.style.background='#F1F5F9';this.style.boxShadow='none';">
              <button type="submit" class="chat-send-btn" style="width:46px;height:46px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);border:none;box-shadow:0 4px 14px rgba(79,70,229,0.38);cursor:pointer;">
                <i class="fas fa-paper-plane" style="color:#fff;font-size:1.05rem;"></i>
              </button>
            </form>
          </div>

        </div>

        <!-- WhatsApp User Profile Modal / Drawer Overlay -->
        <div id="userProfileModal" style="display:none;position:absolute;top:0;right:0;width:340px;height:100%;background:#fff;border-left:1px solid #CBD5E1;box-shadow:-6px 0 25px rgba(0,0,0,0.15);z-index:2000;flex-direction:column;transition:transform 0.3s ease-in-out;">
          <div style="padding:16px 20px;background:linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%);color:#fff;display:flex;align-items:center;justify-content:space-between;">
            <div style="font-weight:700;font-size:0.95rem;">Member Profile</div>
            <button onclick="closeUserProfileModal()" style="background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer;">✕</button>
          </div>
          <div style="padding:24px 20px;text-align:center;flex:1;overflow-y:auto;background:#F8FAFC;">
            <div id="modalUserAvatar" style="width:84px;height:84px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:700;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,0.18);">U</div>
            <h3 style="margin:0 0 6px;font-size:1.15rem;font-weight:700;color:#0F172A;" id="modalUserName">Member Name</h3>
            <div style="display:inline-block;padding:4px 12px;border-radius:12px;background:#EEF2FF;color:#4338CA;font-size:0.75rem;font-weight:700;margin-bottom:16px;" id="modalUserRole">Role</div>

            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:18px;text-align:left;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <div style="margin-bottom:12px;">
                <div style="font-size:0.72rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Department</div>
                <div style="font-size:0.88rem;color:#1E293B;font-weight:600;" id="modalUserDept">Department Name</div>
              </div>
              <div style="margin-bottom:12px;">
                <div style="font-size:0.72rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Email Address</div>
                <div style="font-size:0.85rem;color:#1E293B;" id="modalUserEmail">email@example.com</div>
              </div>
              <div>
                <div style="font-size:0.72rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Status</div>
                <div style="font-size:0.82rem;margin-top:2px;" id="modalUserStatus">● Online</div>
              </div>
            </div>

            <button id="modalDmBtn" onclick="handleModalStartDm()" style="width:100%;padding:12px;border-radius:24px;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);color:#fff;border:none;font-weight:700;font-size:0.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
              <i class="fas fa-comment-alt"></i> Direct Message
            </button>
          </div>
        </div>

      </div>
    `;
  }

  function loadCurrentUserAndContacts() {
    var token = localStorage.getItem('token');
    if (!token) return;

    // Instantly decode JWT for userId — no API wait
    var payload = decodeJwtPayload(token);
    if (payload && (payload.userId || payload.id || payload.sub)) {
      _currentUserId = payload.userId || payload.id || payload.sub;
    }

    // Load current user profile from /auth/me for full name/role
    fetch('/api/v1/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success && res.data) {
          var me = res.data;
          _currentUserId = me.user_id || me.id;
          var name = me.first_name ? (me.first_name + ' ' + (me.last_name || '')) : 'User';
          _currentUserName = name;
          _currentUserInitial = (me.first_name || 'U').charAt(0).toUpperCase();
          if (document.getElementById('chatSelfAvatar')) document.getElementById('chatSelfAvatar').innerText = _currentUserInitial;
          if (document.getElementById('chatSelfName')) document.getElementById('chatSelfName').innerText = name;
          if (document.getElementById('chatSelfRole')) {
            document.getElementById('chatSelfRole').innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;box-shadow:0 0 8px #10B981;"></span> ' + (me.role || 'User');
          }
        }
      }).catch(function (err) { console.error(err); });

    // Load DM contact list
    fetch('/api/v1/chat/contacts', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success && Array.isArray(res.data)) {
          renderPrivateContacts(res.data);
        } else {
          renderPrivateContacts([]);
        }
      })
      .catch(function () {
        var list = document.getElementById('chatPrivateList');
        if (list) list.innerHTML = '<div style="padding:10px 16px;color:#94A3B8;font-size:0.8rem;text-align:center;">No direct contacts</div>';
      });
  }

  function formatLastSeenText(lastSeenUtc, isOnline) {
    if (isOnline) return '<span style="color:#10B981;font-weight:600;">● Online</span>';
    if (!lastSeenUtc) return '<span style="color:#94A3B8;">Offline</span>';
    var d = new Date(lastSeenUtc);
    if (isNaN(d.getTime())) return '<span style="color:#94A3B8;">Offline</span>';

    var now = new Date();
    var isToday = d.toDateString() === now.toDateString();
    var yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    var isYesterday = d.toDateString() === yesterday.toDateString();

    var timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (isToday) {
      return 'Last seen today at ' + timeStr;
    } else if (isYesterday) {
      return 'Last seen yesterday at ' + timeStr;
    } else {
      return 'Last seen ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' at ' + timeStr;
    }
  }

  function renderPrivateContacts(users) {
    var list = document.getElementById('chatPrivateList');
    if (!list) return;

    if (users.length === 0) {
      list.innerHTML = '<div style="padding:10px 16px;color:#94A3B8;font-size:0.8rem;text-align:center;">No contacts found</div>';
      return;
    }

    var html = '';
    users.forEach(function (u) {
      var uName = u.first_name ? (u.first_name + ' ' + (u.last_name || '')) : (u.username || 'User');
      var uId = u.user_id;
      var isOnline = (u.is_online === 1 || u.is_online === true);
      var statusText = isOnline ? 'Online' : (u.role_name || 'Member');
      var gradient = getAvatarGradient(uId);

      html += `
        <div class="chat-channel-item" id="chan-private_${uId}" title="${escapeHtml(uName)} (${escapeHtml(statusText)})" onclick="switchChatChannel('private_${uId}', { id:${uId}, name:'${uName.replace(/'/g, "\\'")}', role:'${u.role_name || 'Member'}', department:'${u.department || ''}', email:'${u.email || ''}', last_seen:'${u.last_seen || ''}', is_online:${isOnline} })" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
          <div style="position:relative;width:40px;height:40px;border-radius:50%;background:${gradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.25);">
            ${uName.charAt(0).toUpperCase()}
            ${isOnline ? '<span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:#10B981;border:2px solid #0F172A;box-shadow:0 0 6px #10B981;"></span>' : ''}
          </div>
          <div style="flex:1;overflow:hidden;">
            <div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(uName)}</div>
            <div style="font-size:0.75rem;opacity:0.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(statusText)}</div>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
    if (_activeChannel) {
      document.querySelectorAll('.chat-channel-item').forEach(function (el) { el.classList.remove('active'); });
      var activeEl = document.getElementById('chan-' + _activeChannel);
      if (activeEl) activeEl.classList.add('active');
    }
    filterChatChannels();
  }

  window.switchChatChannel = function (channel, targetUser) {
    _activeChannel = channel;
    _privateTargetUser = targetUser || null;

    document.querySelectorAll('.chat-channel-item').forEach(function (el) { el.classList.remove('active'); });
    var targetEl = document.getElementById('chan-' + channel);
    if (targetEl) targetEl.classList.add('active');

    var headerTitle = document.getElementById('chatHeaderTitle');
    var headerSub = document.getElementById('chatHeaderSubtitle');
    var headerIcon = document.getElementById('chatHeaderIcon');
    var input = document.getElementById('chatMessageInput');

    if (channel === 'global') {
      if (headerTitle) headerTitle.innerText = 'Global Channel';
      if (headerSub) headerSub.innerText = '● All Members & Admins';
      if (headerIcon) { headerIcon.style.background = '#2563EB'; headerIcon.innerHTML = '<i class="fas fa-globe"></i>'; }
      if (input) input.placeholder = 'Type a message... (Use @ to mention all system members)';
    } else if (channel === 'team') {
      if (headerTitle) headerTitle.innerText = 'My Team Channel';
      if (headerSub) headerSub.innerText = '● Assigned Team Discussion';
      if (headerIcon) { headerIcon.style.background = '#10B981'; headerIcon.innerHTML = '<i class="fas fa-users"></i>'; }
      if (input) input.placeholder = 'Type a message... (Use @ to mention team members)';
    } else if (channel.startsWith('private_') && targetUser) {
      if (headerTitle) headerTitle.innerText = targetUser.name || 'Private Chat';
      if (headerSub) headerSub.innerHTML = formatLastSeenText(targetUser.last_seen, targetUser.is_online);
      if (headerIcon) {
        headerIcon.style.background = getAvatarGradient(targetUser.id);
        headerIcon.innerText = (targetUser.name || 'P').charAt(0).toUpperCase();
      }
      if (input) input.placeholder = 'Message ' + targetUser.name + '...';
    }

    preloadMentionUsers();
    loadMessagesForCurrentChannel();
  };

  window.handleHeaderProfileClick = function () {
    if (_activeChannel.startsWith('private_') && _privateTargetUser) {
      openUserProfileModal(_privateTargetUser);
    }
  };

  var _modalTargetUser = null;
  window.openUserProfileModal = function (user) {
    if (!user) return;
    _modalTargetUser = user;
    var modal = document.getElementById('userProfileModal');
    if (!modal) return;

    var name = user.name || (user.first_name ? (user.first_name + ' ' + (user.last_name || '')) : 'User');
    var avatarEl = document.getElementById('modalUserAvatar');
    var nameEl = document.getElementById('modalUserName');
    var roleEl = document.getElementById('modalUserRole');
    var deptEl = document.getElementById('modalUserDept');
    var emailEl = document.getElementById('modalUserEmail');
    var statusEl = document.getElementById('modalUserStatus');
    var dmBtn = document.getElementById('modalDmBtn');

    if (avatarEl) {
      avatarEl.style.background = getAvatarGradient(user.id || user.user_id);
      avatarEl.innerText = name.charAt(0).toUpperCase();
    }
    if (nameEl) nameEl.innerText = name;
    if (roleEl) roleEl.innerText = user.role || user.role_name || 'Member';
    if (deptEl) deptEl.innerText = user.department || 'General';
    if (emailEl) emailEl.innerText = user.email || 'N/A';
    if (statusEl) statusEl.innerHTML = formatLastSeenText(user.last_seen, user.is_online);

    if (dmBtn) {
      if (_currentUserId && parseInt(user.id || user.user_id, 10) === parseInt(_currentUserId, 10)) {
        dmBtn.style.display = 'none';
      } else {
        dmBtn.style.display = 'flex';
      }
    }

    modal.style.display = 'flex';
  };

  window.closeUserProfileModal = function () {
    var modal = document.getElementById('userProfileModal');
    if (modal) modal.style.display = 'none';
  };

  window.handleModalStartDm = function () {
    if (_modalTargetUser) {
      var uId = _modalTargetUser.id || _modalTargetUser.user_id;
      var uName = _modalTargetUser.name || (_modalTargetUser.first_name + ' ' + (_modalTargetUser.last_name || ''));
      switchChatChannel('private_' + uId, {
        id: uId,
        name: uName,
        role: _modalTargetUser.role || _modalTargetUser.role_name || 'Member',
        department: _modalTargetUser.department || '',
        email: _modalTargetUser.email || '',
        last_seen: _modalTargetUser.last_seen || '',
        is_online: _modalTargetUser.is_online
      });
      closeUserProfileModal();
    }
  };

  function preloadMentionUsers() {
    var token = localStorage.getItem('token');
    if (!token) return;
    var chType = _activeChannel.startsWith('private') ? 'global' : _activeChannel;

    fetch('/api/v1/chat/mention-users?channelType=' + chType, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success && Array.isArray(res.data)) {
          _channelMentionUsers = res.data.filter(function (u) {
            return !_currentUserId || (parseInt(u.user_id, 10) !== parseInt(_currentUserId, 10));
          });
        }
      })
      .catch(function () { _channelMentionUsers = []; });
  }

  function loadMessagesForCurrentChannel() {
    var feed = document.getElementById('chatMessagesArea');
    if (!feed) return;

    var token = localStorage.getItem('token');
    if (!token) return;

    var endpoint = '/api/v1/chat/messages?channelType=global';
    if (_activeChannel === 'team') {
      endpoint = '/api/v1/chat/messages?channelType=team';
    } else if (_activeChannel.startsWith('private_') && _privateTargetUser) {
      endpoint = '/api/v1/chat/messages?channelType=private&recipientId=' + _privateTargetUser.id;
    }

    fetch(endpoint, { headers: { 'Authorization': 'Bearer ' + token } })
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

  var _lastMsgsSignature = '';

  function renderMessageFeed(msgs) {
    var feed = document.getElementById('chatMessagesArea');
    if (!feed) return;

    var sig = _activeChannel + '_' + msgs.length + '_' + (msgs.length ? (msgs[msgs.length - 1].id || msgs[msgs.length - 1].message_id || msgs[msgs.length - 1].created_at || '') : '');
    if (_lastMsgsSignature === sig && feed.children.length > 0 && !feed.querySelector('.optimistic-bubble')) {
      return;
    }
    _lastMsgsSignature = sig;

    if (msgs.length === 0) {
      feed.innerHTML = '<div style="text-align:center;color:#64748B;font-size:0.85rem;padding:30px;background:rgba(255,255,255,0.75);border-radius:12px;margin:auto;">No messages yet. Send a message to start the conversation!</div>';
      return;
    }

    var html = '';
    var lastDateStr = '';

    msgs.forEach(function (m) {
      var rawText = m.message_text || m.content || '';
      var isAlumniAlert = rawText.indexOf('ALUMNI_ALERT::') === 0;
      var isMe = (_currentUserId && parseInt(m.user_id, 10) === parseInt(_currentUserId, 10)) || m.is_me || m.isMe;
      var senderName = m.sender_name || m.username || 'User';
      var senderId = m.user_id;
      var d = m.created_at ? new Date(m.created_at) : new Date();
      var gradient = getAvatarGradient(senderId);
      
      // Date Separator Chip
      var dateHeader = formatDateHeader(d);
      if (dateHeader !== lastDateStr) {
        html += `<div style="text-align:center;margin:12px 0 6px;"><span style="background:#FFFFFF;color:#64748B;font-size:0.72rem;font-weight:700;padding:4px 12px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);letter-spacing:0.5px;">${dateHeader}</span></div>`;
        lastDateStr = dateHeader;
      }

      var h = d.getHours();
      var m2 = d.getMinutes();
      var ampm = h >= 12 ? 'pm' : 'am';
      var h12 = h % 12 || 12;
      var timeStr = h12 + ':' + (m2 < 10 ? '0' + m2 : m2) + ' ' + ampm;

      // Read receipt status checkmark (Vibrant Emerald Double Tick if seen/read!)
      var isRead = (m.is_read === 1 || m.is_read === true);
      var tickIcon = isRead
        ? '<i class="fas fa-check-double" style="color:#34D399;margin-left:4px;font-size:0.75rem;" title="Seen"></i>'
        : '<i class="fas fa-check-double" style="color:rgba(255,255,255,0.6);margin-left:4px;font-size:0.75rem;" title="Delivered"></i>';

      // WhatsApp message bubble styling with Avatars
      if (isAlumniAlert) {
        // ── ALUMNI ALERT CARD ──
        var cardHtml = buildAlumniAlertCard(rawText, isMe, timeStr, tickIcon);
        var myGrad2 = getAvatarGradient(_currentUserId || senderId);
        var myInit2 = _currentUserInitial || senderName.charAt(0).toUpperCase();
        if (isMe) {
          html += `
            <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;justify-content:flex-end;">
              <div>${cardHtml}</div>
              <div style="width:36px;height:36px;border-radius:50%;background:${myGrad2};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,0.18);" title="You">${myInit2}</div>
            </div>`;
        } else {
          html += `
            <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;">
              <div onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })" style="width:36px;height:36px;border-radius:50%;background:${gradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.18);" title="Click to view profile">
                ${senderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-size:0.75rem;font-weight:700;color:#2563EB;margin-bottom:4px;padding:0 2px;cursor:pointer;display:flex;align-items:center;gap:6px;" onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })">
                  <span>${escapeHtml(senderName)}</span> &bull; <span style="background:#DBEAFE;color:#1E40AF;padding:1px 8px;border-radius:10px;font-size:0.68rem;">${escapeHtml(m.sender_role || 'Member')}</span>
                </div>
                ${cardHtml}
              </div>
            </div>`;
        }
      } else if (isMe) {
        // ── MY NORMAL BUBBLE (Vibrant Indigo-Blue Gradient) ──
        var myGradient = getAvatarGradient(_currentUserId || senderId);
        var myInitial = _currentUserInitial || senderName.charAt(0).toUpperCase();
        html += `
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:8px;justify-content:flex-end;">
            <div style="display:flex;flex-direction:column;align-items:flex-end;">
              <div style="display:inline-block;max-width:65vw;padding:9px 15px 7px;border-radius:18px 18px 4px 18px;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);color:#FFFFFF;box-shadow:0 4px 14px rgba(79,70,229,0.28);font-size:0.92rem;line-height:1.5;word-break:break-word;">
                <span style="display:block;">${escapeHtmlMessage(rawText)}</span>
                <span style="display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:4px;white-space:nowrap;">
                  <span style="font-size:0.68rem;color:#E0E7FF;">${timeStr}</span>
                  ${tickIcon}
                </span>
              </div>
            </div>
            <!-- Own Avatar on the right -->
            <div style="width:36px;height:36px;border-radius:50%;background:${myGradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,0.18);" title="You">
              ${myInitial}
            </div>
          </div>
        `;
      } else {
        // ── THEIR NORMAL BUBBLE (Crisp White Card) ──
        var rolePillBg = '#DBEAFE';
        var rolePillColor = '#1E40AF';
        var roleText = m.sender_role || 'Member';
        if (roleText.toLowerCase().includes('leader')) { rolePillBg = '#EDE9FE'; rolePillColor = '#5B21B6'; }
        else if (roleText.toLowerCase().includes('admin')) { rolePillBg = '#FEF3C7'; rolePillColor = '#92400E'; }

        html += `
          <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:8px;">
            <!-- Sender Avatar Badge (Clickable for Profile Card) -->
            <div onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })" style="width:36px;height:36px;border-radius:50%;background:${gradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.18);" title="Click to view profile">
              ${senderName.charAt(0).toUpperCase()}
            </div>
            
            <div style="display:flex;flex-direction:column;align-items:flex-start;">
              <div onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })" style="font-size:0.75rem;font-weight:700;color:#0F172A;margin-bottom:4px;padding:0 4px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;">
                <span>${escapeHtml(senderName)}</span> &bull; <span style="background:${rolePillBg};color:${rolePillColor};padding:1px 8px;border-radius:10px;font-size:0.68rem;font-weight:700;">${escapeHtml(roleText)}</span>
              </div>
              <div style="display:inline-block;max-width:65vw;padding:9px 14px 7px;border-radius:18px 18px 18px 4px;background:#FFFFFF;color:#0F172A;box-shadow:0 4px 14px rgba(15,23,42,0.06);border:1px solid #F1F5F9;font-size:0.92rem;line-height:1.5;word-break:break-word;">
                <span style="display:block;">${escapeHtmlMessage(rawText)}</span>
                <span style="display:flex;align-items:center;justify-content:flex-end;margin-top:4px;white-space:nowrap;">
                  <span style="font-size:0.68rem;color:#94A3B8;">${timeStr}</span>
                </span>
              </div>
            </div>
          </div>
        `;
      }
    });

    feed.innerHTML = html;
    feed.scrollTop = feed.scrollHeight;
  }

  function formatDateHeader(dateObj) {
    var now = new Date();
    var isToday = dateObj.toDateString() === now.toDateString();
    var yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    var isYesterday = dateObj.toDateString() === yesterday.toDateString();

    if (isToday) return 'TODAY';
    if (isYesterday) return 'YESTERDAY';
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeHtmlMessage(str) {
    var safe = escapeHtml(str);
    return safe.replace(/@([a-zA-Z0-9_\s]+)/g, '<span style="background:rgba(99,102,241,0.18);color:#4338CA;font-weight:700;padding:2px 8px;border-radius:6px;box-shadow:0 1px 3px rgba(99,102,241,0.15);">@$1</span>');
  }
  /* Global store for alumni card copy data keyed by unique card id */
  window._alumniCardData = window._alumniCardData || {};

  window.copyAlumniCard = function(cid, btn) {
    var d = window._alumniCardData[cid]; if (!d) return;
    var txt = d.text || '';
    function done() { if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Copied!'; setTimeout(function() { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000); } }
    if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done); }
    else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
  };

  window.openAlumniLinkedin = function(cid) {
    var d = window._alumniCardData[cid]; if (!d || !d.linkedin) return;
    var url = d.linkedin.indexOf('http') === 0 ? d.linkedin : 'https://' + d.linkedin;
    window.open(url, '_blank');
  };

  /* Build the special Alumni Alert card HTML */
  function buildAlumniAlertCard(msgText, isMe, timeStr, tickIcon) {
    var jsonStr = msgText.substring('ALUMNI_ALERT::'.length);
    var d;
    try { d = JSON.parse(jsonStr); } catch(e) { d = { name: 'Alumni Detail' }; }

    var tags = [];
    if (d.company)     tags.push('<span style="background:#DBEAFE;color:#1E40AF;padding:4px 10px;border-radius:12px;font-size:0.72rem;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(30,64,175,0.1);">Company: ' + escapeHtml(d.company) + '</span>');
    if (d.designation) tags.push('<span style="background:#D1FAE5;color:#065F46;padding:4px 10px;border-radius:12px;font-size:0.72rem;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(6,95,70,0.1);">Role: ' + escapeHtml(d.designation) + '</span>');
    if (d.department)  tags.push('<span style="background:#EDE9FE;color:#4C1D95;padding:4px 10px;border-radius:12px;font-size:0.72rem;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(76,29,149,0.1);">Dept: ' + escapeHtml(d.department) + '</span>');
    if (d.batch)       tags.push('<span style="background:#FEF3C7;color:#92400E;padding:4px 10px;border-radius:12px;font-size:0.72rem;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(146,64,14,0.1);">Batch: ' + escapeHtml(d.batch) + '</span>');

    var rows = [];
    if (d.company)     rows.push(['Company',     d.company]);
    if (d.designation) rows.push(['Role / Title', d.designation]);
    if (d.department)  rows.push(['Department',   d.department]);
    if (d.regNo)       rows.push(['Reg No',       d.regNo]);
    if (d.location)    rows.push(['Location',     d.location]);
    if (d.phone)       rows.push(['Phone',        d.phone]);
    if (d.email)       rows.push(['Email',        d.email]);
    if (d.notes)       rows.push(['Notes',        d.notes]);

    var copyLines = ['Alumni Detail Found', 'Name: ' + (d.name || '')];
    if (d.regNo)       copyLines.push('Reg No: '      + d.regNo);
    if (d.department)  copyLines.push('Dept: '         + d.department);
    if (d.batch)       copyLines.push('Batch: '        + d.batch);
    if (d.company)     copyLines.push('Company: '      + d.company);
    if (d.designation) copyLines.push('Designation: '  + d.designation);
    if (d.location)    copyLines.push('Location: '     + d.location);
    if (d.phone)       copyLines.push('Phone: '        + d.phone);
    if (d.email)       copyLines.push('Email: '        + d.email);
    if (d.linkedin)    copyLines.push('LinkedIn: '     + d.linkedin);
    if (d.notes)       copyLines.push('Notes: '        + d.notes);

    var cid = 'acd_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
    window._alumniCardData[cid] = { text: copyLines.join('\n'), linkedin: d.linkedin || '' };

    var rowsHtml = rows.map(function(r) {
      return '<div style="display:flex;justify-content:space-between;font-size:0.78rem;padding:6px 0;border-bottom:1px solid #F1F5F9;">' +
        '<span style="color:#64748B;font-weight:600;">' + escapeHtml(r[0]) + '</span>' +
        '<span style="color:#0F172A;font-weight:600;text-align:right;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(r[1]) + '</span>' +
      '</div>';
    }).join('');

    var linkedinBtn = d.linkedin
      ? '<button onclick="openAlumniLinkedin(\'' + cid + '\')" style="flex:1;padding:9px 12px;border:none;border-radius:10px;background:linear-gradient(135deg, #0A66C2, #004182);color:#fff;font-size:0.78rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(10,102,194,0.3);transition:transform 0.15s;" onmouseover="this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.transform=\'none\'"><i class="fab fa-linkedin"></i> LinkedIn</button>'
      : '';

    return '<div style="width:300px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,0.12);border:1px solid #E2E8F0;">' +
      '<div style="background:linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%);padding:14px 16px;display:flex;align-items:center;gap:12px;">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg, #EC4899, #8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;flex-shrink:0;box-shadow:0 4px 12px rgba(236,72,153,0.4);"><i class="fas fa-user-graduate"></i></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;font-size:0.92rem;color:#F8FAFC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(d.name || 'Alumni') + (d.regNo ? ' <span style="font-weight:400;opacity:0.75;font-size:0.8rem;">(' + escapeHtml(d.regNo) + ')</span>' : '') + '</div>' +
          '<div style="font-size:0.72rem;color:#34D399;margin-top:2px;font-weight:600;">&#127891; Alumni Detail Found</div>' +
        '</div>' +
      '</div>' +
      (tags.length ? '<div style="padding:12px 14px 6px;display:flex;flex-wrap:wrap;gap:6px;background:#F8FAFC;">' + tags.join('') + '</div>' : '') +
      (rows.length ? '<div style="padding:6px 14px 8px;">' + rowsHtml + '</div>' : '') +
      '<div style="padding:10px 14px 14px;display:flex;gap:10px;">' +
        '<button onclick="copyAlumniCard(\'' + cid + '\',this)" style="flex:1;padding:9px 12px;border:1.5px solid #CBD5E1;border-radius:10px;background:#F8FAFC;color:#334155;font-size:0.78rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.15s;" onmouseover="this.style.background=\'#EEF2FF\';this.style.borderColor=\'#818CF8\';" onmouseout="this.style.background=\'#F8FAFC\';this.style.borderColor=\'#CBD5E1\';"><i class="fas fa-copy"></i> Copy</button>' +
        linkedinBtn +
      '</div>' +
      '<div style="padding:2px 14px 10px;display:flex;align-items:center;justify-content:flex-end;gap:4px;background:#FAFAFA;">' +
        '<span style="font-size:0.68rem;color:#94A3B8;">' + timeStr + '</span>' +
        (isMe ? tickIcon : '') +
      '</div>' +
    '</div>';
  }

  function appendOptimisticMessage(msgText) {
    var feed = document.getElementById('chatMessagesArea');
    if (!feed) return;

    var d = new Date();
    var h = d.getHours();
    var m2 = d.getMinutes();
    var ampm = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 || 12;
    var timeStr = h12 + ':' + (m2 < 10 ? '0' + m2 : m2) + ' ' + ampm;
    var myGradient = getAvatarGradient(_currentUserId || 0);
    var myInitial = _currentUserInitial || 'M';

    var bubbleHtml = `
      <div class="optimistic-bubble" style="display:flex;align-items:flex-end;gap:10px;margin-bottom:8px;justify-content:flex-end;opacity:0.95;">
        <div style="display:flex;flex-direction:column;align-items:flex-end;">
          <div style="display:inline-block;max-width:65vw;padding:9px 15px 7px;border-radius:18px 18px 4px 18px;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);color:#FFFFFF;box-shadow:0 4px 14px rgba(79,70,229,0.28);font-size:0.92rem;line-height:1.5;word-break:break-word;">
            <span style="display:block;">${escapeHtmlMessage(msgText)}</span>
            <span style="display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:4px;white-space:nowrap;">
              <span style="font-size:0.68rem;color:#E0E7FF;">${timeStr}</span>
              <i class="fas fa-check" style="color:rgba(255,255,255,0.7);margin-left:4px;font-size:0.75rem;" title="Sending..."></i>
            </span>
          </div>
        </div>
        <div style="width:36px;height:36px;border-radius:50%;background:${myGradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,0.18);" title="You">
          ${myInitial}
        </div>
      </div>
    `;

    feed.insertAdjacentHTML('beforeend', bubbleHtml);
    feed.scrollTop = feed.scrollHeight;
  }

  window.handleSendWhatsAppMessage = function (e) {
    e.preventDefault();
    var input = document.getElementById('chatMessageInput');
    if (!input || !input.value.trim()) return;

    var msg = input.value.trim();
    input.value = '';

    // Render message instantly (0ms delay!)
    appendOptimisticMessage(msg);
    _lastMsgsSignature = ''; // Reset signature so server response syncs cleanly

    var token = localStorage.getItem('token');
    if (!token) return;

    var bodyObj = { messageText: msg, channelType: 'global' };
    if (_activeChannel === 'team') {
      bodyObj.channelType = 'team';
    } else if (_activeChannel.startsWith('private_') && _privateTargetUser) {
      bodyObj.channelType = 'private';
      bodyObj.recipientId = _privateTargetUser.id;
    }

    fetch('/api/v1/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(bodyObj)
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
      var charBefore = lastAt > 0 ? val[lastAt - 1] : ' ';
      
      if (charBefore === ' ' || charBefore === '\n' || lastAt === 0) {
        var filtered = _channelMentionUsers.filter(function (u) {
          var name = (u.first_name + ' ' + (u.last_name || '')).trim();
          return name.toLowerCase().indexOf(query) !== -1;
        });

        if (filtered.length > 0) {
          var labelText = (_activeChannel === 'team') ? 'Mention Team Member' : 'Mention System Member';
          var html = '<div style="padding:10px 16px;font-size:0.75rem;font-weight:700;color:#64748B;background:#F8FAFC;border-bottom:1px solid #E2E8F0;sticky:top;">' + labelText + '</div>';
          
          filtered.slice(0, 10).forEach(function (u) {
            var name = (u.first_name + ' ' + (u.last_name || '')).trim();
            var role = u.role_name || u.department || 'Member';
            var gradient = getAvatarGradient(u.user_id);
            html += '<div onclick="selectMentionUser(\'' + name.replace(/'/g, "\\'") + '\', ' + lastAt + ')" style="padding:11px 16px;font-size:0.88rem;cursor:pointer;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;gap:12px;transition:background 0.15s;" onmouseover="this.style.background=\'#F1F5F9\'" onmouseout="this.style.background=\'#fff\'">'
              + '<div style="width:36px;height:36px;border-radius:50%;background:' + gradient + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;">' + name.charAt(0).toUpperCase() + '</div>'
              + '<div style="flex:1;overflow:hidden;"><div style="font-weight:600;font-size:0.92rem;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(name) + '</div><div style="font-size:0.75rem;color:#64748B;margin-top:2px;">' + escapeHtml(role) + '</div></div>'
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
      var before = (atIndex !== undefined && atIndex >= 0) ? val.substring(0, atIndex) : val.replace(/@\S*$/, '');
      input.value = before + '@' + name + ' ';
      input.focus();
    }
    if (dropdown) dropdown.style.display = 'none';
  };

  var _lastContactsPollTime = 0;

  function pollNewChatMessages() {
    var sectionChat = document.getElementById('section-chat');
    if (sectionChat && sectionChat.style.display !== 'none') {
      loadMessagesForCurrentChannel();

      var now = Date.now();
      if (now - _lastContactsPollTime > 4000) {
        _lastContactsPollTime = now;
        var token = localStorage.getItem('token');
        if (token) {
          fetch('/api/v1/chat/contacts', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function (r) { return r.json(); })
            .then(function (res) {
              if (res && res.success && Array.isArray(res.data)) {
                renderPrivateContacts(res.data);
              }
            }).catch(function () {});
        }
      }
    }
  }

  window.filterChatChannels = function () {
    var q = (document.getElementById('chatSearchInput') ? document.getElementById('chatSearchInput').value : '').toLowerCase();
    document.querySelectorAll('.chat-channel-item').forEach(function (item) {
      var text = item.innerText.toLowerCase();
      item.style.display = text.includes(q) ? 'flex' : 'none';
    });
  };

  window.toggleChatSidebarCollapse = function () {
    var sidebar = document.querySelector('.chat-sidebar-left');
    var appContainer = document.querySelector('.whatsapp-app-container');
    if (!sidebar) return;

    var isCollapsed = sidebar.classList.toggle('collapsed');
    if (appContainer) appContainer.classList.toggle('sidebar-collapsed', isCollapsed);

    var toggleBtn = document.getElementById('chatSidebarToggleBtn');
    var mainToggleBtn = document.getElementById('chatMainSidebarToggleBtn');

    if (isCollapsed) {
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-indent"></i>';
        toggleBtn.title = 'Open Sidebar';
      }
      if (mainToggleBtn) {
        mainToggleBtn.style.background = '#6366F1';
        mainToggleBtn.style.color = '#FFFFFF';
        mainToggleBtn.title = 'Open Sidebar';
      }
    } else {
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-outdent"></i>';
        toggleBtn.title = 'Close Sidebar';
      }
      if (mainToggleBtn) {
        mainToggleBtn.style.background = '#EEF2FF';
        mainToggleBtn.style.color = '#4338CA';
        mainToggleBtn.title = 'Close Sidebar';
      }
    }
  };
})();
