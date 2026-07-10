(function () {
  'use strict';

  var API_BASE = window.WEKAMP_API_BASE || 'https://api.kampd.com';
  var storageKey = 'wekamp.web.session';
  var session = readSession();
  var pendingRedirect = null;

  function readSession() {
    try { return JSON.parse(window.localStorage.getItem(storageKey) || '{}'); } catch (_) { return {}; }
  }

  function saveSession(next) {
    session = Object.assign({}, session, next);
    window.localStorage.setItem(storageKey, JSON.stringify(session));
    updateAuthenticatedNav();
  }

  function clearSession() {
    session = {};
    window.localStorage.removeItem(storageKey);
    updateAuthenticatedNav();
  }

  function isSignedIn() {
    return Boolean(session.accessToken && session.idToken);
  }

  function updateAuthenticatedNav() {
    var signedIn = isSignedIn();
    document.querySelectorAll('[data-authenticated-nav]').forEach(function (item) {
      item.hidden = !signedIn;
    });
    document.querySelectorAll('[data-guest-nav]').forEach(function (item) {
      item.hidden = signedIn;
    });
  }

  function deviceHeaders() {
    return {
      'Content-Type': 'application/json',
      'Device-Identity': 'wekamp-web',
      'Device': 'web',
      'Device-Model': navigator.userAgent.slice(0, 80),
      'System': 'web',
      'System-Version': navigator.userAgent,
    };
  }

  function authHeaders() {
    var headers = deviceHeaders();
    if (session.accessToken && session.idToken) {
      headers.Authorization = session.accessToken;
      headers.idToken = session.idToken;
    }
    if (session.userId) headers['User-Identity'] = session.userId;
    return headers;
  }

  async function request(path, options, retry) {
    var config = options || {};
    var headers = Object.assign({}, authHeaders(), config.headers || {});
    var response;
    try {
      response = await fetch(API_BASE + path, Object.assign({}, config, { headers: headers }));
    } catch (_) {
      var originHint = window.location.protocol === 'file:'
        ? ' Serve the website over HTTP/HTTPS; browsers block API calls from file:// previews.'
        : ' Confirm that the API CORS changes are deployed.';
      throw new Error('WeKamp could not reach the sign-in service.' + originHint);
    }
    var body = {};
    try { body = await response.json(); } catch (_) {}

    if ((response.status === 401 || response.status === 403) && !retry && session.refreshToken && session.username) {
      var refreshed = await refreshSession();
      if (refreshed) return request(path, options, true);
    }
    if (!response.ok) {
      var message = body && body.status && (body.status.message || body.status.msg);
      throw new Error(message || 'WeKamp could not load this surface.');
    }
    return body;
  }

  async function refreshSession() {
    try {
      var response = await fetch(API_BASE + '/signin/v1/refresh', {
        method: 'POST', headers: deviceHeaders(),
        body: JSON.stringify({ refreshToken: session.refreshToken, username: session.username }),
      });
      var body = await response.json();
      var payload = body.payload || body;
      if (!response.ok || !payload.accessToken || !payload.idToken) throw new Error('refresh failed');
      saveSession({ accessToken: payload.accessToken, idToken: payload.idToken, refreshToken: payload.refreshToken || session.refreshToken });
      return true;
    } catch (_) {
      clearSession();
      return false;
    }
  }

  async function initiateSignIn(username) {
    var body = await request('/signin/v1/initiate', { method: 'POST', body: JSON.stringify({ username: username }) });
    var payload = body.payload || {};
    return { session: payload.session || '', sessionId: payload.sessionId || '', retryIn: payload.retryIn || 60 };
  }

  async function verifySignIn(username, otp, transaction) {
    var body = await request('/signin/v1/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionId: transaction.sessionId, session: transaction.session, username: username, code: otp }),
    });
    var payload = body.payload || {};
    if (!payload.accessToken || !payload.idToken) throw new Error('Sign in did not return a valid session.');
    var tokenClaims = decodeJwt(payload.idToken);
    saveSession({ username: username, accessToken: payload.accessToken, idToken: payload.idToken, refreshToken: payload.refreshToken || '', userId: tokenClaims['custom:userId'] || tokenClaims.userId || tokenClaims.user_id || '' });
    await hydrateProfile();
  }

  async function hydrateProfile() {
    var body = await request('/user/v1/profile');
    var payload = body.payload || body;
    var profile = payload.user || {};
    if (profile.id) saveSession({ userId: profile.id, profile: profile });
  }

  function openAuthModal(redirect) {
    pendingRedirect = redirect || null;
    var modal = document.querySelector('[data-auth-modal]');
    if (!modal) return;
    if (modal.resetAuth) modal.resetAuth();
    modal.hidden = false;
    modal.querySelector('[data-auth-phone]').focus();
  }

  function closeAuthModal() {
    var modal = document.querySelector('[data-auth-modal]');
    if (modal) modal.hidden = true;
  }

  function installAuthModal() {
    var modal = document.querySelector('[data-auth-modal]');
    if (!modal) return;
    var phone = modal.querySelector('[data-auth-phone]');
    var otp = modal.querySelector('[data-auth-otp]');
    var submit = modal.querySelector('[data-auth-submit]');
    var message = modal.querySelector('[data-auth-message]');
    var title = modal.querySelector('[data-auth-title]');
    var copy = modal.querySelector('[data-auth-copy]');
    var transaction = null;
    var step = 'phone';

    function resetAuth() {
      step = 'phone';
      transaction = null;
      modal.classList.remove('is-otp');
      phone.value = '';
      otp.value = '';
      submit.textContent = 'Send code';
      message.textContent = '';
      message.classList.remove('is-success');
      if (title) title.textContent = 'Sign in to WeKamp';
      if (copy) copy.textContent = 'Use the phone number connected to your WeKamp profile. We will send a one-time code.';
    }
    modal.resetAuth = resetAuth;

    modal.querySelector('[data-auth-close]').addEventListener('click', closeAuthModal);
    modal.addEventListener('click', function (event) { if (event.target === modal) closeAuthModal(); });
    modal.querySelector('[data-auth-switch]').addEventListener('click', function () { resetAuth(); phone.focus(); });
    submit.addEventListener('click', async function () {
      message.textContent = '';
      submit.disabled = true;
      try {
        if (step === 'phone') {
          transaction = await initiateSignIn(phone.value.trim());
          if (!transaction.session || !transaction.sessionId) throw new Error('We could not start sign in. Check the phone number and try again.');
          step = 'otp'; modal.classList.add('is-otp'); submit.textContent = 'Verify and open WeKamp'; otp.focus();
          if (title) title.textContent = 'Check your phone';
          if (copy) copy.textContent = 'Enter the one-time code we sent to your phone to open your private Kamp surfaces.';
          message.classList.add('is-success'); message.textContent = 'Code sent. Enter the one-time code to continue.';
        } else {
          await verifySignIn(phone.value.trim(), otp.value.trim(), transaction);
          closeAuthModal();
          var destination = pendingRedirect;
          pendingRedirect = null;
          if (destination) window.location.href = destination;
          else window.location.reload();
        }
      } catch (error) {
        message.classList.remove('is-success'); message.textContent = error.message;
      } finally { submit.disabled = false; }
    });
  }

  function installSignInLinks() {
    updateAuthenticatedNav();
    document.querySelectorAll('a[href="#signin"], a.nav-signin').forEach(function (link) {
      link.addEventListener('click', function (event) { event.preventDefault(); openAuthModal(); });
    });
    document.querySelectorAll('[data-auth-signout]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        clearSession();
        window.location.href = 'index.html';
      });
    });
    document.querySelectorAll('a[href="feed.html"], a[href="events.html"]').forEach(function (link) {
      if (isSignedIn()) return;
      link.addEventListener('click', function (event) { event.preventDefault(); openAuthModal(link.getAttribute('href')); });
    });
  }

  function installPrivateGate() {
    var page = document.body.getAttribute('data-private-page');
    if (!page) return;
    var content = document.querySelector('[data-private-content]');
    var gate = document.querySelector('[data-auth-gate]');
    if (isSignedIn()) { if (gate) gate.hidden = true; if (content) content.hidden = false; return; }
    if (content) content.hidden = true;
    if (gate) gate.hidden = false;
    var gateButton = gate && gate.querySelector('[data-gate-signin]');
    if (gateButton) gateButton.addEventListener('click', function () { openAuthModal(window.location.pathname.split('/').pop()); });
  }

  function renderLiveFeed(cards) {
    var target = document.querySelector('#live-feed-list');
    if (!target || !Array.isArray(cards) || !cards.length) return;
    target.innerHTML = cards.slice(0, 6).map(function (card) {
      var association = card.association || {};
      var title = card.title || card.caption || 'Kamp update';
      var description = card.description || card.caption || 'Open this update in your Kamp.';
      var image = card.thumbnail || (card.media && card.media[0] && card.media[0].url) || '';
      return '<article class="feed-card"><div class="feed-card__meta"><strong>' + escapeHtml(association.displayName || association.title || 'Kamp update') + '</strong><span>' + escapeHtml(formatDate(card.createdAt)) + '</span></div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(description) + '</p>' + (image ? '<img class="feed-card__image" src="' + escapeAttr(image) + '" alt="">' : '') + '<div class="feed-card__actions"><span>' + Number(card.views || 0) + ' views</span><span>' + Number((card.reactions && card.reactions.comments) || card.comments || 0) + ' comments</span><span>Open Kamp</span></div></article>';
    }).join('');
  }

  async function loadLiveFeed() {
    if (!document.querySelector('#live-feed-list') || !isSignedIn()) return;
    try {
      var body = await request('/home/v1/trail/card?page=1&limit=6');
      renderLiveFeed((body.payload && body.payload.data) || body.data || []);
    } catch (_) { /* Keep the reviewed static preview when the API is unavailable. */ }
  }

  function renderLiveEvents(events) {
    var target = document.querySelector('#live-event-list');
    if (!target || !Array.isArray(events) || !events.length) return;
    target.innerHTML = events.slice().sort(function (a, b) { return new Date(a.startsAt) - new Date(b.startsAt); }).map(function (event) {
      var date = new Date(event.startsAt);
      var chips = [event.kampTitle, event.locationName, event.viewerRsvpStatus || event.rsvpCount ? ((event.viewerRsvpStatus || event.rsvpCount) + (event.rsvpCount ? ' going' : '')) : 'Open'];
      return '<article class="event-card"><div class="event-date"><strong>' + date.getDate() + '</strong><span>' + date.toLocaleString(undefined, { month: 'short' }) + '</span></div><div><h3>' + escapeHtml(event.title || 'Kamp event') + '</h3><p>' + escapeHtml(event.description || 'Open event details and RSVP context.') + '</p><div class="event-meta">' + chips.filter(Boolean).map(function (chip) { return '<span>' + escapeHtml(String(chip)) + '</span>'; }).join('') + '</div></div><a class="product-button product-button--solid" href="feed.html">Open context</a></article>';
    }).join('');
  }

  async function loadLiveEvents() {
    var target = document.querySelector('#live-event-list');
    if (!target || !isSignedIn() || !session.userId) return;
    try {
      var body = await request('/kamp/v1/user/' + encodeURIComponent(session.userId) + '/events');
      var payload = body.payload || body;
      renderLiveEvents(payload.events || payload.data || (Array.isArray(payload) ? payload : []));
    } catch (_) { /* Keep the reviewed static preview when the API is unavailable. */ }
  }

  function formatDate(value) { var date = new Date(value); return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function decodeJwt(token) {
    try {
      var segment = String(token).split('.')[1];
      if (!segment) return {};
      var normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    } catch (_) { return {}; }
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (character) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]; }); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }

  window.WeKampWeb = { openSignIn: openAuthModal, signOut: function () { clearSession(); window.location.href = 'index.html'; }, isSignedIn: isSignedIn };
  /*
  installAuthModal();
  installSignInLinks();
  var sessionReady = isSignedIn() && !session.userId ? hydrateProfile().catch(function () {}) : Promise.resolve();
  installPrivateGate();
  sessionReady.then(function () {
    loadLiveFeed();
    loadLiveEvents();
  });
  */
})();
