/* ============================================================
   FULL-PAGE WHATSAPP-STYLE CHAT APPLICATION (COMPACT & EMBEDDED)
   - Compact Layout fitting seamlessly inside the page layout
   - Fixed placement inside main content area (no right/bottom overflow)
   - Adaptive Smart Polling (2s when active, 12s when backgrounded)
   - Edit & Delete options for OWN messages ONLY (other users cannot edit/delete)
   - Message Reactions (👍, ❤️, 😂, 😮, 😢, 🔥) with active counts & toggle
   - Auto-resizing textarea with Enter to send & Shift+Enter for new line
   - Keyboard Navigation for @mentions (Arrow Up/Down, Enter/Tab to select)
   - Dynamic Unread Message Badges per contact and channel
   - WhatsApp Member Profile Modal (view user profile, role, dept, & DM)
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
  var _mentionNavIndex = -1; // Keyboard nav index for mention dropdown
  var _unreadCounts = {}; // { 'global': 0, 'team': 0, 'private_123': 0 }
  var _lastSeenMsgIds = {}; // { 'global': 105, 'team': 88, 'private_123': 42 }
  var _lastMsgsSignature = '';
  var _lastContactsPollTime = 0;
  var _modalTargetUser = null;
  var _userHasScrolledUp = false;
  var _activeReactionPopoverMsgId = null;

  // Persistent reactions store per message: { [msgId]: { '👍': [userId1, userId2], '❤️': [userId3] } }
  var _messageReactions = {};
  try {
    var savedReactions = localStorage.getItem('chat_message_reactions_store');
    if (savedReactions) _messageReactions = JSON.parse(savedReactions) || {};
  } catch (e) {}

  function saveReactionsStore() {
    try {
      localStorage.setItem('chat_message_reactions_store', JSON.stringify(_messageReactions));
    } catch (e) {}
  }

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

  try {
    var savedIds = localStorage.getItem('chat_last_seen_msg_ids');
    if (savedIds) _lastSeenMsgIds = JSON.parse(savedIds) || {};
  } catch(e) {}

  function saveLastSeenMsgId(channel, maxMsgId) {
    if (!channel || !maxMsgId) return;
    _lastSeenMsgIds[channel] = Math.max(_lastSeenMsgIds[channel] || 0, maxMsgId);
    try {
      localStorage.setItem('chat_last_seen_msg_ids', JSON.stringify(_lastSeenMsgIds));
    } catch(e) {}
  }

  window.initWhatsAppChatPage = function () {
    var chatContainer = document.getElementById('chatPageApp');
    if (!chatContainer) return;

    renderChatLayout(chatContainer);
    loadCurrentUserAndContacts();
    switchChatChannel('global');
    setupSmartPolling();

    if (!_heartbeatTimer) {
      sendChatHeartbeat();
      _heartbeatTimer = setInterval(sendChatHeartbeat, 30000);
    }
  };

  function setupSmartPolling() {
    if (_chatPollTimer) clearInterval(_chatPollTimer);
    
    var pollInterval = document.hidden ? 12000 : 2000;
    _chatPollTimer = setInterval(pollNewChatMessages, pollInterval);

    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  function handleVisibilityChange() {
    setupSmartPolling();
    if (!document.hidden) {
      pollNewChatMessages();
    }
  }

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
      <div class="whatsapp-app-container" style="display:flex;height:100%;max-height:100%;width:100%;max-width:100%;margin:0;background:#fff;border-radius:0;overflow:hidden;border:none;box-shadow:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;position:relative;box-sizing:border-box;">
        
        <!-- Left Sidebar: Channels & Private Chats (Compact 250px) -->
        <div class="chat-sidebar-left" style="width:250px;min-width:250px;max-width:250px;flex-shrink:0;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
          
          <!-- User Profile Header -->
          <div class="chat-profile-header" style="padding:12px 14px;background:linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%);color:#fff;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 12px rgba(0,0,0,0.15);flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg, #6366F1, #8B5CF6);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;box-shadow:0 0 0 2px #A5B4FC, 0 4px 12px rgba(99,102,241,0.5);flex-shrink:0;" id="chatSelfAvatar">ME</div>
              <div class="chat-self-info" style="min-width:0;">
                <div style="font-weight:700;font-size:0.88rem;color:#F8FAFC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="chatSelfName">My Profile</div>
                <div style="font-size:0.72rem;color:#34D399;display:flex;align-items:center;gap:4px;margin-top:1px;" id="chatSelfRole">
                  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10B981;box-shadow:0 0 6px #10B981;"></span> Online
                </div>
              </div>
            </div>
            <!-- Sidebar Close Toggle Button -->
            <button onclick="event.stopPropagation(); toggleChatSidebarCollapse();" id="chatSidebarToggleBtn" title="Close Sidebar" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:30px;height:30px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.85rem;transition:all 0.2s;flex-shrink:0;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <i class="fas fa-outdent"></i>
            </button>
          </div>

          <!-- Search Bar -->
          <div class="chat-search-bar-container" style="padding:10px 12px;background:transparent;border-bottom:1px solid rgba(0,0,0,0.06);flex-shrink:0;">
            <div style="position:relative;">
              <i class="fas fa-search" style="position:absolute;left:12px;top:10px;color:#94A3B8;font-size:0.8rem;"></i>
              <input type="text" id="chatSearchInput" placeholder="Search channels..." oninput="filterChatChannels()" style="width:100%;padding:7px 10px 7px 32px;background:rgba(0,0,0,0.03);border:1px solid rgba(0,0,0,0.08);border-radius:18px;font-size:0.8rem;color:#0F172A;outline:none;box-sizing:border-box;transition:all 0.2s;" onfocus="this.style.borderColor='#818CF8';this.style.background='#fff';" onblur="this.style.borderColor='rgba(0,0,0,0.08)';this.style.background='rgba(0,0,0,0.03)';">
            </div>
          </div>

          <!-- Channel List -->
          <div style="flex:1;overflow-y:auto;padding:6px 0;" id="chatChannelsList">
            
            <div class="chat-channel-item active" id="chan-global" title="Global Channel" onclick="switchChatChannel('global')" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;">
              <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg, #3B82F6, #1D4ED8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.95rem;flex-shrink:0;box-shadow:0 3px 8px rgba(37,99,235,0.35);">
                <i class="fas fa-globe"></i>
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="font-weight:700;font-size:0.84rem;display:flex;justify-content:space-between;align-items:center;">
                  <span>Global Channel</span>
                  <span id="badge-global" class="chat-unread-badge" style="display:none;">0</span>
                  <span style="font-size:0.65rem;color:#10B981;font-weight:700;background:rgba(16,185,129,0.2);padding:1px 6px;border-radius:8px;" id="time-global">Live</span>
                </div>
                <div style="font-size:0.72rem;opacity:0.75;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">All System Members</div>
              </div>
            </div>

            <div class="chat-channel-item" id="chan-team" title="My Team Channel" onclick="switchChatChannel('team')" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;">
              <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg, #10B981, #047857);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.95rem;flex-shrink:0;box-shadow:0 3px 8px rgba(16,185,129,0.35);">
                <i class="fas fa-users"></i>
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="font-weight:700;font-size:0.84rem;display:flex;justify-content:space-between;align-items:center;">
                  <span>My Team Channel</span>
                  <span id="badge-team" class="chat-unread-badge" style="display:none;">0</span>
                  <span style="font-size:0.65rem;color:#818CF8;font-weight:700;background:rgba(99,102,241,0.2);padding:1px 6px;border-radius:8px;" id="time-team">Team</span>
                </div>
                <div style="font-size:0.72rem;opacity:0.75;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Assigned Team</div>
              </div>
            </div>

            <div class="chat-section-label" style="padding:12px 14px 6px;font-size:0.68rem;font-weight:800;color:#818CF8;text-transform:uppercase;letter-spacing:0.8px;display:flex;align-items:center;gap:5px;">
              <i class="fas fa-comments" style="font-size:0.75rem;"></i> Direct Messages
            </div>
            <div id="chatPrivateList">
              <div style="padding:10px 14px;color:#94A3B8;font-size:0.78rem;text-align:center;">Loading contacts...</div>
            </div>

          </div>
        </div>

        <!-- Right Main: Active Messaging Screen -->
        <div class="chat-main-right" style="flex:1;min-width:0;width:100%;display:flex;flex-direction:column;background:#F8FAFC;position:relative;overflow:hidden;box-sizing:border-box;">
          
          <!-- Compact Chat Header -->
          <div style="padding:10px 18px;background:#FFFFFF;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;z-index:10;cursor:pointer;box-shadow:0 1px 6px rgba(0,0,0,0.02);flex-shrink:0;" id="chatHeaderBar" onclick="handleHeaderProfileClick()">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <button onclick="event.stopPropagation(); toggleChatSidebarCollapse();" id="chatMainSidebarToggleBtn" title="Toggle Channels & Contacts Sidebar" style="background:#EEF2FF;border:none;color:#4F46E5;width:34px;height:34px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.9rem;transition:all 0.2s;margin-right:2px;flex-shrink:0;" onmouseover="this.style.background='#E0E7FF'" onmouseout="this.style.background='#EEF2FF'">
                <i class="fas fa-bars"></i>
              </button>
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg, #4F46E5, #3B82F6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700;box-shadow:0 3px 8px rgba(79,70,229,0.3);flex-shrink:0;" id="chatHeaderIcon">
                <i class="fas fa-globe"></i>
              </div>
              <div style="min-width:0;">
                <h3 style="margin:0;font-size:0.95rem;font-weight:700;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="chatHeaderTitle">Global Channel</h3>
                <div style="font-size:0.72rem;color:#10B981;margin-top:1px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" id="chatHeaderSubtitle">● All Members & Admins</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <div style="font-size:0.75rem;color:#4F46E5;font-weight:600;background:#EEF2FF;padding:4px 12px;border-radius:16px;display:flex;align-items:center;gap:5px;" id="chatHeaderActionInfo"><i class="fas fa-info-circle"></i> Info</div>
            </div>
          </div>

          <!-- Message Feed Area with Ultra-Premium Wallpaper -->
          <div id="chatMessagesArea" class="chat-feed-wallpaper" style="flex:1;min-height:0;width:100%;padding:14px 20px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;box-sizing:border-box;">
            <div style="text-align:center;color:#94A3B8;font-size:0.82rem;padding:16px;">Loading chat messages...</div>
          </div>

          <!-- Scroll-To-Bottom Floating Button -->
          <button id="chatScrollBottomBtn" class="chat-scroll-bottom-btn" onclick="scrollToChatBottom(true)">
            <i class="fas fa-arrow-down"></i> Scroll to latest
          </button>

          <!-- Mention Auto-Complete Popup -->
          <div id="mentionDropdown" style="display:none;position:absolute;bottom:65px;left:18px;background:#fff;border:1px solid #CBD5E1;border-radius:12px;box-shadow:0 10px 28px rgba(0,0,0,0.16);width:360px;max-width:90%;max-height:280px;overflow-y:auto;z-index:1000;"></div>

          <!-- Compact Input Box Area -->
          <div style="padding:10px 18px;background:#FFFFFF;border-top:1px solid #E2E8F0;position:relative;z-index:10;box-shadow:0 -3px 15px rgba(0,0,0,0.02);flex-shrink:0;width:100%;box-sizing:border-box;" class="chat-input-bar">
            <form onsubmit="handleSendWhatsAppMessage(event)" style="display:flex;gap:10px;align-items:flex-end;width:100%;">
              <textarea id="chatMessageInput" class="chat-textarea" rows="1" placeholder="Type a message... (Press Enter to send, Shift+Enter for new line, @ to mention)" oninput="handleChatInputTyping(this)" onkeydown="handleChatInputKeydown(event)"></textarea>
              
              <button type="submit" class="chat-send-btn" style="width:40px;height:40px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);border:none;box-shadow:0 3px 10px rgba(79,70,229,0.35);cursor:pointer;flex-shrink:0;">
                <i class="fas fa-paper-plane" style="color:#fff;font-size:0.95rem;"></i>
              </button>
            </form>
          </div>

        </div>

        <!-- WhatsApp User Profile Modal / Drawer Overlay -->
        <div id="userProfileModal" style="display:none;position:absolute;top:0;right:0;width:300px;height:100%;background:#fff;border-left:1px solid #CBD5E1;box-shadow:-6px 0 25px rgba(0,0,0,0.15);z-index:2000;flex-direction:column;transition:transform 0.3s ease-in-out;">
          <div style="padding:14px 18px;background:linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%);color:#fff;display:flex;align-items:center;justify-content:space-between;">
            <div style="font-weight:700;font-size:0.9rem;">Member Profile</div>
            <button onclick="closeUserProfileModal()" style="background:none;border:none;color:#fff;font-size:1rem;cursor:pointer;">✕</button>
          </div>
          <div style="padding:20px 16px;text-align:center;flex:1;overflow-y:auto;background:#F8FAFC;">
            <div id="modalUserAvatar" style="width:72px;height:72px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:700;color:#fff;box-shadow:0 5px 15px rgba(0,0,0,0.15);">U</div>
            <h3 style="margin:0 0 4px;font-size:1.05rem;font-weight:700;color:#0F172A;" id="modalUserName">Member Name</h3>
            <div style="display:inline-block;padding:3px 10px;border-radius:10px;background:#EEF2FF;color:#4338CA;font-size:0.72rem;font-weight:700;margin-bottom:14px;" id="modalUserRole">Role</div>

            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:14px;text-align:left;margin-bottom:14px;box-shadow:0 2px 6px rgba(0,0,0,0.03);">
              <div style="margin-bottom:10px;">
                <div style="font-size:0.68rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Department</div>
                <div style="font-size:0.84rem;color:#1E293B;font-weight:600;" id="modalUserDept">Department Name</div>
              </div>
              <div style="margin-bottom:10px;">
                <div style="font-size:0.68rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Email Address</div>
                <div style="font-size:0.82rem;color:#1E293B;" id="modalUserEmail">email@example.com</div>
              </div>
              <div>
                <div style="font-size:0.68rem;font-weight:700;color:#94A3B8;text-transform:uppercase;">Status</div>
                <div style="font-size:0.78rem;margin-top:1px;" id="modalUserStatus">● Online</div>
              </div>
            </div>

            <button id="modalDmBtn" onclick="handleModalStartDm()" style="width:100%;padding:10px;border-radius:20px;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);color:#fff;border:none;font-weight:700;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(79,70,229,0.3);">
              <i class="fas fa-comment-alt"></i> Direct Message
            </button>
          </div>
        </div>

      </div>
    `;

    var feed = document.getElementById('chatMessagesArea');
    if (feed) {
      feed.addEventListener('scroll', handleChatFeedScroll);
    }
  }

  function handleChatFeedScroll() {
    var feed = document.getElementById('chatMessagesArea');
    var btn = document.getElementById('chatScrollBottomBtn');
    if (!feed || !btn) return;

    var distanceToBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
    if (distanceToBottom > 150) {
      _userHasScrolledUp = true;
      btn.classList.add('show');
    } else {
      _userHasScrolledUp = false;
      btn.classList.remove('show');
    }
  }

  window.scrollToChatBottom = function(smooth) {
    var feed = document.getElementById('chatMessagesArea');
    if (!feed) return;
    feed.scrollTo({
      top: feed.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    _userHasScrolledUp = false;
    var btn = document.getElementById('chatScrollBottomBtn');
    if (btn) btn.classList.remove('show');
  };

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.chat-reaction-popover') && !e.target.closest('.chat-msg-reaction-btn')) {
      closeReactionPopover();
    }
    var dropdown = document.getElementById('mentionDropdown');
    if (dropdown && !dropdown.contains(e.target) && e.target.id !== 'chatMessageInput') {
      dropdown.style.display = 'none';
    }
  });

  function closeReactionPopover() {
    var existing = document.querySelector('.chat-reaction-popover');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    _activeReactionPopoverMsgId = null;
  }

  window.toggleReactionPicker = function(msgId, btnEl, event) {
    if (event) event.stopPropagation();

    if (_activeReactionPopoverMsgId === msgId) {
      closeReactionPopover();
      return;
    }

    closeReactionPopover();
    _activeReactionPopoverMsgId = msgId;

    var wrapper = btnEl.closest('.chat-msg-wrapper') || btnEl.parentNode;
    if (!wrapper) return;

    var popover = document.createElement('div');
    popover.className = 'chat-reaction-popover';
    
    var emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
    var html = '';
    emojis.forEach(function(em) {
      html += `<span class="chat-reaction-emoji" onclick="event.stopPropagation(); selectMessageReaction('${msgId}', '${em}')">${em}</span>`;
    });
    popover.innerHTML = html;

    wrapper.style.position = 'relative';
    wrapper.appendChild(popover);
  };

  window.selectMessageReaction = function(msgId, emoji) {
    closeReactionPopover();
    if (!msgId || !_currentUserId) return;

    if (!_messageReactions[msgId]) {
      _messageReactions[msgId] = {};
    }
    if (!_messageReactions[msgId][emoji]) {
      _messageReactions[msgId][emoji] = [];
    }

    var userList = _messageReactions[msgId][emoji];
    var uidStr = String(_currentUserId);
    var idx = userList.indexOf(uidStr);

    if (idx !== -1) {
      userList.splice(idx, 1);
      if (userList.length === 0) delete _messageReactions[msgId][emoji];
    } else {
      userList.push(uidStr);
    }

    saveReactionsStore();
    loadMessagesForCurrentChannel();
  };

  // Edit and Delete Message Handlers (Strictly scoped to own messages)
  window.startEditChatMessage = function(msgIdKey) {
    var bubbleEl = document.getElementById('msg-text-' + msgIdKey);
    if (!bubbleEl) return;

    var currentRaw = bubbleEl.dataset.rawText || bubbleEl.innerText || '';
    
    var editFormHtml = `
      <div class="inline-edit-box" style="margin-top:4px;">
        <textarea id="edit-input-${msgIdKey}" style="width:100%;padding:6px 10px;border:1.5px solid #818CF8;border-radius:10px;font-size:0.85rem;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box;background:#fff;color:#0F172A;">${escapeHtml(currentRaw)}</textarea>
        <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px;">
          <button type="button" onclick="cancelEditChatMessage('${msgIdKey}')" style="padding:4px 10px;border:1px solid #CBD5E1;background:#fff;color:#64748B;border-radius:6px;font-size:0.72rem;font-weight:600;cursor:pointer;">Cancel</button>
          <button type="button" onclick="saveEditChatMessage('${msgIdKey}')" style="padding:4px 10px;border:none;background:#4F46E5;color:#fff;border-radius:6px;font-size:0.72rem;font-weight:700;cursor:pointer;">Save</button>
        </div>
      </div>
    `;
    bubbleEl.dataset.originalHtml = bubbleEl.innerHTML;
    bubbleEl.innerHTML = editFormHtml;
    var ta = document.getElementById('edit-input-' + msgIdKey);
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  };

  window.cancelEditChatMessage = function(msgIdKey) {
    var bubbleEl = document.getElementById('msg-text-' + msgIdKey);
    if (bubbleEl && bubbleEl.dataset.originalHtml) {
      bubbleEl.innerHTML = bubbleEl.dataset.originalHtml;
    }
  };

  window.saveEditChatMessage = function(msgIdKey) {
    var input = document.getElementById('edit-input-' + msgIdKey);
    if (!input || !input.value.trim()) return;

    var newText = input.value.trim();
    var token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/v1/chat/messages/' + msgIdKey, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ messageText: newText })
    })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res && res.success) {
          _lastMsgsSignature = '';
          loadMessagesForCurrentChannel();
        } else {
          alert(res.message || 'Failed to edit message');
        }
      })
      .catch(function(err) { console.error('Edit error:', err); });
  };

  window.deleteChatMessage = function(msgIdKey) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    var token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/v1/chat/messages/' + msgIdKey, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res && res.success) {
          _lastMsgsSignature = '';
          loadMessagesForCurrentChannel();
        } else {
          alert(res.message || 'Failed to delete message');
        }
      })
      .catch(function(err) { console.error('Delete error:', err); });
  };

  function loadCurrentUserAndContacts() {
    var token = localStorage.getItem('token');
    if (!token) return;

    var payload = decodeJwtPayload(token);
    if (payload && (payload.userId || payload.id || payload.sub)) {
      _currentUserId = payload.userId || payload.id || payload.sub;
    }

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
            document.getElementById('chatSelfRole').innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10B981;box-shadow:0 0 6px #10B981;"></span> ' + (me.role || 'User');
          }
        }
      }).catch(function (err) { console.error(err); });

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
        if (list) list.innerHTML = '<div style="padding:10px 14px;color:#94A3B8;font-size:0.78rem;text-align:center;">No direct contacts</div>';
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
      list.innerHTML = '<div style="padding:10px 14px;color:#94A3B8;font-size:0.78rem;text-align:center;">No contacts found</div>';
      return;
    }

    var html = '';
    users.forEach(function (u) {
      var uName = u.first_name ? (u.first_name + ' ' + (u.last_name || '')) : (u.username || 'User');
      var uId = u.user_id;
      var isOnline = (u.is_online === 1 || u.is_online === true);
      var statusText = isOnline ? 'Online' : (u.role_name || 'Member');
      var gradient = getAvatarGradient(uId);
      var chanKey = 'private_' + uId;
      var unread = _unreadCounts[chanKey] || 0;

      html += `
        <div class="chat-channel-item" id="chan-${chanKey}" title="${escapeHtml(uName)} (${escapeHtml(statusText)})" onclick="switchChatChannel('${chanKey}', { id:${uId}, name:'${uName.replace(/'/g, "\\'")}', role:'${u.role_name || 'Member'}', department:'${u.department || ''}', email:'${u.email || ''}', last_seen:'${u.last_seen || ''}', is_online:${isOnline} })" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;">
          <div style="position:relative;width:34px;height:34px;border-radius:50%;background:${gradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
            ${uName.charAt(0).toUpperCase()}
            ${isOnline ? '<span style="position:absolute;bottom:0;right:0;width:8px;height:8px;border-radius:50%;background:#10B981;border:2px solid #0F172A;box-shadow:0 0 4px #10B981;"></span>' : ''}
          </div>
          <div style="flex:1;overflow:hidden;">
            <div style="font-weight:600;font-size:0.82rem;display:flex;justify-content:space-between;align-items:center;">
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(uName)}</span>
              <span id="badge-${chanKey}" class="chat-unread-badge" style="${unread > 0 ? '' : 'display:none;'}">${unread}</span>
            </div>
            <div style="font-size:0.72rem;opacity:0.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(statusText)}</div>
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

    _unreadCounts[channel] = 0;
    var activeBadge = document.getElementById('badge-' + channel);
    if (activeBadge) activeBadge.style.display = 'none';

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
      if (input) input.placeholder = 'Type a message... (Press Enter to send, @ to mention members)';
    } else if (channel === 'team') {
      if (headerTitle) headerTitle.innerText = 'My Team Channel';
      if (headerSub) headerSub.innerText = '● Assigned Team Discussion';
      if (headerIcon) { headerIcon.style.background = '#10B981'; headerIcon.innerHTML = '<i class="fas fa-users"></i>'; }
      if (input) input.placeholder = 'Type a message... (Press Enter to send, @ to mention team members)';
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
          feed.innerHTML = '<div style="text-align:center;color:#EF4444;font-size:0.82rem;padding:16px;">Failed to load messages</div>';
        }
      })
      .catch(function () {
        feed.innerHTML = '<div style="text-align:center;color:#94A3B8;font-size:0.82rem;padding:16px;">Start of chat history</div>';
      });
  }

  function renderMessageFeed(msgs) {
    var feed = document.getElementById('chatMessagesArea');
    if (!feed) return;

    var maxMsgId = 0;
    msgs.forEach(function(m) {
      var mid = m.message_id || m.id || 0;
      if (mid > maxMsgId) maxMsgId = mid;
    });

    if (maxMsgId > 0) {
      saveLastSeenMsgId(_activeChannel, maxMsgId);
    }

    var reactionSig = JSON.stringify(_messageReactions);
    var sig = _activeChannel + '_' + msgs.length + '_' + maxMsgId + '_' + reactionSig.length;
    if (_lastMsgsSignature === sig && feed.children.length > 0 && !feed.querySelector('.optimistic-bubble')) {
      return;
    }
    _lastMsgsSignature = sig;

    if (msgs.length === 0) {
      feed.innerHTML = '<div style="text-align:center;color:#64748B;font-size:0.82rem;padding:24px;background:rgba(255,255,255,0.85);border-radius:12px;margin:auto;box-shadow:0 3px 10px rgba(0,0,0,0.03);">No messages yet. Send a message to start the conversation!</div>';
      return;
    }

    var html = '';
    var lastDateStr = '';

    msgs.forEach(function (m) {
      var msgIdKey = String(m.message_id || m.id || ('tmp_' + Math.random()));
      var rawText = m.message_text || m.content || '';
      var isAlumniAlert = rawText.indexOf('ALUMNI_ALERT::') === 0;
      var isMe = (_currentUserId && parseInt(m.user_id, 10) === parseInt(_currentUserId, 10)) || m.is_me || m.isMe;
      var senderName = m.sender_name || m.username || 'User';
      var senderId = m.user_id;
      var d = m.created_at ? new Date(m.created_at) : new Date();
      var gradient = getAvatarGradient(senderId);
      
      var dateHeader = formatDateHeader(d);
      if (dateHeader !== lastDateStr) {
        html += `<div style="text-align:center;margin:10px 0 4px;"><span style="background:#FFFFFF;color:#64748B;font-size:0.68rem;font-weight:700;padding:3px 12px;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);letter-spacing:0.4px;">${dateHeader}</span></div>`;
        lastDateStr = dateHeader;
      }

      var h = d.getHours();
      var m2 = d.getMinutes();
      var ampm = h >= 12 ? 'pm' : 'am';
      var h12 = h % 12 || 12;
      var timeStr = h12 + ':' + (m2 < 10 ? '0' + m2 : m2) + ' ' + ampm;

      var isRead = (m.is_read === 1 || m.is_read === true);
      var tickIcon = isRead
        ? '<i class="fas fa-check-double" style="color:#34D399;margin-left:4px;font-size:0.72rem;" title="Seen"></i>'
        : '<i class="fas fa-check-double" style="color:rgba(255,255,255,0.6);margin-left:4px;font-size:0.72rem;" title="Delivered"></i>';

      var reactionsObj = _messageReactions[msgIdKey] || {};
      var reactionsHtml = '';
      var reactionKeys = Object.keys(reactionsObj);
      if (reactionKeys.length > 0) {
        reactionsHtml += '<div class="chat-reactions-row">';
        reactionKeys.forEach(function(em) {
          var uList = reactionsObj[em] || [];
          if (uList.length > 0) {
            var hasReacted = _currentUserId && uList.includes(String(_currentUserId));
            reactionsHtml += `<span class="chat-reaction-pill ${hasReacted ? 'user-reacted' : ''}" onclick="event.stopPropagation(); selectMessageReaction('${msgIdKey}', '${em}')">${em} ${uList.length}</span>`;
          }
        });
        reactionsHtml += '</div>';
      }

      var reactionBtnHtml = `<button type="button" class="chat-msg-reaction-btn" title="React to message" onclick="toggleReactionPicker('${msgIdKey}', this, event)">🙂</button>`;

      // Action buttons: Edit and Delete options ONLY for OWN messages
      var myActionsGroupHtml = `
        <div class="chat-msg-actions-group">
          <button type="button" class="chat-msg-action-btn edit-btn" title="Edit message" onclick="startEditChatMessage('${msgIdKey}')"><i class="fas fa-pen"></i></button>
          <button type="button" class="chat-msg-action-btn delete-btn" title="Delete message" onclick="deleteChatMessage('${msgIdKey}')"><i class="fas fa-trash-alt"></i></button>
          ${reactionBtnHtml}
        </div>
      `;

      var otherActionsGroupHtml = `
        <div class="chat-msg-actions-group">
          ${reactionBtnHtml}
        </div>
      `;

      if (isAlumniAlert) {
        var cardHtml = buildAlumniAlertCard(rawText, isMe, timeStr, tickIcon);
        var myGrad2 = getAvatarGradient(_currentUserId || senderId);
        var myInit2 = _currentUserInitial || senderName.charAt(0).toUpperCase();
        if (isMe) {
          html += `
            <div class="chat-msg-wrapper" style="justify-content:flex-end;">
              ${myActionsGroupHtml}
              <div>
                ${cardHtml}
                ${reactionsHtml}
              </div>
              <div style="width:32px;height:32px;border-radius:50%;background:${myGrad2};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;box-shadow:0 3px 8px rgba(0,0,0,0.15);" title="You">${myInit2}</div>
            </div>`;
        } else {
          html += `
            <div class="chat-msg-wrapper" style="justify-content:flex-start;">
              <div onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })" style="width:32px;height:32px;border-radius:50%;background:${gradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,0.15);" title="Click to view profile">
                ${senderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-size:0.72rem;font-weight:700;color:#2563EB;margin-bottom:3px;padding:0 2px;cursor:pointer;display:flex;align-items:center;gap:5px;" onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })">
                  <span>${escapeHtml(senderName)}</span> &bull; <span style="background:#DBEAFE;color:#1E40AF;padding:1px 6px;border-radius:8px;font-size:0.65rem;">${escapeHtml(m.sender_role || 'Member')}</span>
                </div>
                ${cardHtml}
                ${reactionsHtml}
              </div>
              ${otherActionsGroupHtml}
            </div>`;
        }
      } else if (isMe) {
        var myGradient = getAvatarGradient(_currentUserId || senderId);
        var myInitial = _currentUserInitial || senderName.charAt(0).toUpperCase();
        html += `
          <div class="chat-msg-wrapper" style="justify-content:flex-end;">
            ${myActionsGroupHtml}
            <div style="display:flex;flex-direction:column;align-items:flex-end;">
              <div style="display:inline-block;max-width:65vw;padding:8px 14px 6px;border-radius:16px 16px 4px 16px;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);color:#FFFFFF;box-shadow:0 3px 12px rgba(79,70,229,0.25);font-size:0.88rem;line-height:1.45;word-break:break-word;">
                <div id="msg-text-${msgIdKey}" data-raw-text="${escapeHtml(rawText)}"><span style="display:block;white-space:pre-wrap;">${escapeHtmlMessage(rawText)}</span></div>
                <span style="display:flex;align-items:center;justify-content:flex-end;gap:3px;margin-top:3px;white-space:nowrap;">
                  <span style="font-size:0.65rem;color:#E0E7FF;">${timeStr}</span>
                  ${tickIcon}
                </span>
              </div>
              ${reactionsHtml}
            </div>
            <div style="width:32px;height:32px;border-radius:50%;background:${myGradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;box-shadow:0 3px 8px rgba(0,0,0,0.15);" title="You">
              ${myInitial}
            </div>
          </div>
        `;
      } else {
        var rolePillBg = '#DBEAFE';
        var rolePillColor = '#1E40AF';
        var roleText = m.sender_role || 'Member';
        if (roleText.toLowerCase().includes('leader')) { rolePillBg = '#EDE9FE'; rolePillColor = '#5B21B6'; }
        else if (roleText.toLowerCase().includes('admin')) { rolePillBg = '#FEF3C7'; rolePillColor = '#92400E'; }

        html += `
          <div class="chat-msg-wrapper" style="justify-content:flex-start;">
            <div onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })" style="width:32px;height:32px;border-radius:50%;background:${gradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,0.15);" title="Click to view profile">
              ${senderName.charAt(0).toUpperCase()}
            </div>
            
            <div style="display:flex;flex-direction:column;align-items:flex-start;">
              <div onclick="openUserProfileModal({ id:${senderId}, name:'${senderName.replace(/'/g, "\\'")}', role:'${m.sender_role || 'Member'}', department:'${m.sender_department || ''}', email:'${m.sender_email || ''}' })" style="font-size:0.72rem;font-weight:700;color:#0F172A;margin-bottom:3px;padding:0 3px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;">
                <span>${escapeHtml(senderName)}</span> &bull; <span style="background:${rolePillBg};color:${rolePillColor};padding:1px 6px;border-radius:8px;font-size:0.65rem;font-weight:700;">${escapeHtml(roleText)}</span>
              </div>
              <div style="display:inline-block;max-width:65vw;padding:8px 13px 6px;border-radius:16px 16px 16px 4px;background:#FFFFFF;color:#0F172A;box-shadow:0 3px 10px rgba(15,23,42,0.05);border:1px solid #F1F5F9;font-size:0.88rem;line-height:1.45;word-break:break-word;">
                <div id="msg-text-${msgIdKey}" data-raw-text="${escapeHtml(rawText)}"><span style="display:block;white-space:pre-wrap;">${escapeHtmlMessage(rawText)}</span></div>
                <span style="display:flex;align-items:center;justify-content:flex-end;margin-top:3px;white-space:nowrap;">
                  <span style="font-size:0.65rem;color:#94A3B8;">${timeStr}</span>
                </span>
              </div>
              ${reactionsHtml}
            </div>
            ${otherActionsGroupHtml}
          </div>
        `;
      }
    });

    feed.innerHTML = html;
    
    if (!_userHasScrolledUp) {
      scrollToChatBottom(false);
    }
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
    return safe.replace(/@([a-zA-Z0-9_\s]+)/g, '<span style="background:rgba(99,102,241,0.18);color:#4338CA;font-weight:700;padding:2px 6px;border-radius:5px;box-shadow:0 1px 3px rgba(99,102,241,0.12);">@$1</span>');
  }

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

  function buildAlumniAlertCard(msgText, isMe, timeStr, tickIcon) {
    var jsonStr = msgText.substring('ALUMNI_ALERT::'.length);
    var d;
    try { d = JSON.parse(jsonStr); } catch(e) { d = { name: 'Alumni Detail' }; }

    var tags = [];
    if (d.company)     tags.push('<span style="background:#DBEAFE;color:#1E40AF;padding:3px 8px;border-radius:10px;font-size:0.68rem;font-weight:700;white-space:nowrap;">Company: ' + escapeHtml(d.company) + '</span>');
    if (d.designation) tags.push('<span style="background:#D1FAE5;color:#065F46;padding:3px 8px;border-radius:10px;font-size:0.68rem;font-weight:700;white-space:nowrap;">Role: ' + escapeHtml(d.designation) + '</span>');
    if (d.department)  tags.push('<span style="background:#EDE9FE;color:#4C1D95;padding:3px 8px;border-radius:10px;font-size:0.68rem;font-weight:700;white-space:nowrap;">Dept: ' + escapeHtml(d.department) + '</span>');
    if (d.batch)       tags.push('<span style="background:#FEF3C7;color:#92400E;padding:3px 8px;border-radius:10px;font-size:0.68rem;font-weight:700;white-space:nowrap;">Batch: ' + escapeHtml(d.batch) + '</span>');

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
      return '<div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:4px 0;border-bottom:1px solid #F1F5F9;">' +
        '<span style="color:#64748B;font-weight:600;">' + escapeHtml(r[0]) + '</span>' +
        '<span style="color:#0F172A;font-weight:600;text-align:right;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(r[1]) + '</span>' +
      '</div>';
    }).join('');

    var linkedinBtn = d.linkedin
      ? '<button onclick="openAlumniLinkedin(\'' + cid + '\')" style="flex:1;padding:7px 10px;border:none;border-radius:8px;background:linear-gradient(135deg, #0A66C2, #004182);color:#fff;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;box-shadow:0 2px 8px rgba(10,102,194,0.25);"><i class="fab fa-linkedin"></i> LinkedIn</button>'
      : '';

    return '<div style="width:260px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.1);border:1px solid #E2E8F0;">' +
      '<div style="background:linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%);padding:10px 12px;display:flex;align-items:center;gap:10px;">' +
        '<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg, #EC4899, #8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.95rem;flex-shrink:0;box-shadow:0 3px 8px rgba(236,72,153,0.35);"><i class="fas fa-user-graduate"></i></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;font-size:0.85rem;color:#F8FAFC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(d.name || 'Alumni') + (d.regNo ? ' <span style="font-weight:400;opacity:0.75;font-size:0.75rem;">(' + escapeHtml(d.regNo) + ')</span>' : '') + '</div>' +
          '<div style="font-size:0.68rem;color:#34D399;margin-top:1px;font-weight:600;">&#127891; Alumni Detail Found</div>' +
        '</div>' +
      '</div>' +
      (tags.length ? '<div style="padding:8px 10px 4px;display:flex;flex-wrap:wrap;gap:4px;background:#F8FAFC;">' + tags.join('') + '</div>' : '') +
      (rows.length ? '<div style="padding:4px 10px 6px;">' + rowsHtml + '</div>' : '') +
      '<div style="padding:8px 10px 10px;display:flex;gap:8px;">' +
        '<button onclick="copyAlumniCard(\'' + cid + '\',this)" style="flex:1;padding:7px 10px;border:1px solid #CBD5E1;border-radius:8px;background:#F8FAFC;color:#334155;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;"><i class="fas fa-copy"></i> Copy</button>' +
        linkedinBtn +
      '</div>' +
      '<div style="padding:2px 10px 8px;display:flex;align-items:center;justify-content:flex-end;gap:3px;background:#FAFAFA;">' +
        '<span style="font-size:0.65rem;color:#94A3B8;">' + timeStr + '</span>' +
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
      <div class="chat-msg-wrapper optimistic-bubble" style="justify-content:flex-end;opacity:0.95;">
        <div style="display:flex;flex-direction:column;align-items:flex-end;">
          <div style="display:inline-block;max-width:65vw;padding:8px 14px 6px;border-radius:16px 16px 4px 16px;background:linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%);color:#FFFFFF;box-shadow:0 3px 12px rgba(79,70,229,0.25);font-size:0.88rem;line-height:1.45;word-break:break-word;">
            <span style="display:block;white-space:pre-wrap;">${escapeHtmlMessage(msgText)}</span>
            <span style="display:flex;align-items:center;justify-content:flex-end;gap:3px;margin-top:3px;white-space:nowrap;">
              <span style="font-size:0.65rem;color:#E0E7FF;">${timeStr}</span>
              <i class="fas fa-check" style="color:rgba(255,255,255,0.7);margin-left:4px;font-size:0.72rem;" title="Sending..."></i>
            </span>
          </div>
        </div>
        <div style="width:32px;height:32px;border-radius:50%;background:${myGradient};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;box-shadow:0 3px 8px rgba(0,0,0,0.15);" title="You">
          ${myInitial}
        </div>
      </div>
    `;

    feed.insertAdjacentHTML('beforeend', bubbleHtml);
    scrollToChatBottom(true);
  }

  function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 110) + 'px';
  }

  window.handleSendWhatsAppMessage = function (e) {
    if (e) e.preventDefault();
    var input = document.getElementById('chatMessageInput');
    if (!input || !input.value.trim()) return;

    var msg = input.value.trim();
    input.value = '';
    autoResizeTextarea(input);

    var dropdown = document.getElementById('mentionDropdown');
    if (dropdown) dropdown.style.display = 'none';

    appendOptimisticMessage(msg);
    _lastMsgsSignature = '';

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

  window.handleChatInputKeydown = function (e) {
    var dropdown = document.getElementById('mentionDropdown');
    var isDropdownOpen = dropdown && dropdown.style.display !== 'none';

    if (isDropdownOpen) {
      var items = dropdown.querySelectorAll('.mention-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _mentionNavIndex = (_mentionNavIndex + 1) % items.length;
        updateMentionNavHighlight(items);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        _mentionNavIndex = (_mentionNavIndex - 1 + items.length) % items.length;
        updateMentionNavHighlight(items);
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (_mentionNavIndex >= 0 && items[_mentionNavIndex]) {
          items[_mentionNavIndex].click();
        } else if (items.length > 0) {
          items[0].click();
        }
        return;
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWhatsAppMessage(e);
    }
  };

  function updateMentionNavHighlight(items) {
    items.forEach(function(el, idx) {
      if (idx === _mentionNavIndex) {
        el.classList.add('active-nav');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('active-nav');
      }
    });
  }

  window.handleChatInputTyping = function (input) {
    autoResizeTextarea(input);
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
          var html = '<div style="padding:8px 14px;font-size:0.72rem;font-weight:700;color:#64748B;background:#F8FAFC;border-bottom:1px solid #E2E8F0;position:sticky;top:0;z-index:2;">' + labelText + '</div>';
          
          _mentionNavIndex = 0;
          filtered.slice(0, 10).forEach(function (u, idx) {
            var name = (u.first_name + ' ' + (u.last_name || '')).trim();
            var role = u.role_name || u.department || 'Member';
            var gradient = getAvatarGradient(u.user_id);
            var activeClass = idx === 0 ? ' active-nav' : '';

            html += '<div class="mention-item' + activeClass + '" onclick="selectMentionUser(\'' + name.replace(/'/g, "\\'") + '\', ' + lastAt + ')" style="padding:9px 14px;font-size:0.84rem;cursor:pointer;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;gap:10px;transition:background 0.15s;">'
              + '<div style="width:32px;height:32px;border-radius:50%;background:' + gradient + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">' + name.charAt(0).toUpperCase() + '</div>'
              + '<div style="flex:1;overflow:hidden;"><div style="font-weight:600;font-size:0.85rem;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(name) + '</div><div style="font-size:0.72rem;color:#64748B;margin-top:1px;">' + escapeHtml(role) + '</div></div>'
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
      autoResizeTextarea(input);
      input.focus();
    }
    if (dropdown) dropdown.style.display = 'none';
  };

  function pollNewChatMessages() {
    var sectionChat = document.getElementById('section-chat');
    if (sectionChat && sectionChat.style.display !== 'none') {
      loadMessagesForCurrentChannel();

      var now = Date.now();
      if (now - _lastContactsPollTime > 5000) {
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
    if (appContainer) appContainer.classList.toggle('chat-sidebar-collapsed', isCollapsed);

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
