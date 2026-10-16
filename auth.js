// auth.js — sign up / log in with Supabase Auth. Used by login.html.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var mode = 'in';            // 'in' | 'up'
  var sb = null;
  var NEXT = 'index.html';    // where to go after logging in

  function say(text, cls) { var m = $('msg'); m.textContent = text || ''; m.className = 'msg ' + (cls || ''); }
  function hint(el, text, cls) { el.textContent = text; el.className = 'hint ' + (cls || ''); }

  function setMode(m) {
    mode = m;
    $('tabin').setAttribute('aria-selected', m === 'in');
    $('tabup').setAttribute('aria-selected', m === 'up');
    $('rowuser').hidden = m !== 'up';
    $('forgot').hidden = m !== 'in';
    $('go').textContent = m === 'in' ? 'Log in' : 'Create account';
    $('pw').autocomplete = m === 'in' ? 'current-password' : 'new-password';
    hint($('pwhint'), m === 'up' ? 'At least 8 characters.' : '');
    say('');
  }

  async function init() {
    try {
      var r = await fetch('/api/config');
      var cfg = await r.json();
      if (!cfg.url || !cfg.anonKey) throw new Error('missing config');
      sb = window.supabase.createClient(cfg.url, cfg.anonKey);
    } catch (e) {
      say('Login is not configured yet (missing Supabase settings).', 'bad');
      $('go').disabled = true;
      return;
    }
    var s = await sb.auth.getSession();
    if (s.data && s.data.session) location.replace(NEXT);
  }

  // live username check (debounced)
  var t = null;
  $('username').addEventListener('input', function () {
    var v = this.value.trim();
    clearTimeout(t);
    if (!v) return hint($('userhint'), '3–20 letters, numbers or underscores.');
    if (!/^[A-Za-z0-9_]{3,20}$/.test(v)) return hint($('userhint'), 'Use 3–20 letters, numbers or underscores.', 'bad');
    hint($('userhint'), 'Checking…');
    t = setTimeout(async function () {
      if (!sb) return;
      var r = await sb.rpc('username_available', { name: v });
      if ($('username').value.trim() !== v) return;
      if (r.error) return hint($('userhint'), '');
      hint($('userhint'), r.data ? 'Available' : 'Already taken', r.data ? 'ok' : 'bad');
    }, 350);
  });

  $('tabin').onclick = function () { setMode('in'); };
  $('tabup').onclick = function () { setMode('up'); };
  $('showpw').onclick = function () {
    var p = $('pw'); var show = p.type === 'password';
    p.type = show ? 'text' : 'password'; this.textContent = show ? 'Hide' : 'Show';
  };

  $('forgot').onclick = async function () {
    var email = $('email').value.trim();
    if (!email) return say('Enter your email above first.', 'bad');
    var r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/login.html' });
    say(r.error ? r.error.message : 'If that email has an account, a reset link is on its way.', r.error ? 'bad' : 'ok');
  };

  $('form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!sb) return;
    var email = $('email').value.trim(), pw = $('pw').value, username = $('username').value.trim();
    if (!email || !pw) return say('Enter your email and password.', 'bad');
    $('go').disabled = true; say('');
    try {
      if (mode === 'up') {
        if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw new Error('Pick a username: 3–20 letters, numbers or underscores.');
        if (pw.length < 8) throw new Error('Password must be at least 8 characters.');
        var r = await sb.auth.signUp({
          email: email, password: pw,
          options: { data: { username: username }, emailRedirectTo: location.origin + '/' + NEXT }
        });
        if (r.error) {
          if (/database error|username|duplicate|unique/i.test(r.error.message)) throw new Error('That username is already taken.');
          throw r.error;
        }
        if (r.data.session) location.replace(NEXT);
        else say('Check your email for a confirmation link, then log in.', 'ok');
      } else {
        var l = await sb.auth.signInWithPassword({ email: email, password: pw });
        if (l.error) throw new Error(/confirm/i.test(l.error.message) ? 'Confirm your email first (check your inbox).' : 'Wrong email or password.');
        location.replace(NEXT);
      }
    } catch (err) { say(err.message, 'bad'); }
    $('go').disabled = false;
  });

  setMode('in');
  init();
})();
