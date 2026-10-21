// shim.js — gives the Studio page the same storage/AI/download calls it used inside Claude,
// backed by Supabase (login, database, image storage) and /api/generate (AI).
(function () {
  var cfg, sb, session, uid, ready;

  async function boot() {
    cfg = await (await fetch('/api/config')).json();
    sb = window.supabase.createClient(cfg.url, cfg.anonKey);
    var s = await sb.auth.getSession();
    session = s.data && s.data.session;
    if (!session) { location.replace('landing.html'); return new Promise(function () {}); }
    uid = session.user.id;
    document.documentElement.classList.add('authed');
    window.addEventListener('DOMContentLoaded', showUser);
    if (document.readyState !== 'loading') showUser();
    // refresh token on change
    sb.auth.onAuthStateChange(function (_e, sess) { session = sess || session; });
  }
  ready = boot();

  async function showUser() {
    var w = document.getElementById('whoami'), b = document.getElementById('logout');
    if (b) b.onclick = async function () { await sb.auth.signOut(); location.replace('login.html'); };
    if (!w) return;
    var name = session.user.email;
    try {
      var r = await sb.from('profiles').select('username').eq('id', uid).maybeSingle();
      if (r.data && r.data.username) name = '@' + r.data.username;
    } catch (e) {}
    w.textContent = name;
    window.stockspotAuth = {
      email: session.user.email,
      created: session.user.created_at,
      setUsername: async function (u) {
        if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) return 'Use 3 to 20 letters, numbers or underscores.';
        var cur = window.stockspotAuth.username || '';
        if (u.toLowerCase() !== cur.toLowerCase()) {
          var av = await sb.rpc('username_available', { name: u });
          if (av.error) return 'Could not check that name.';
          if (!av.data) return 'That username is taken.';
        }
        var r = await sb.from('profiles').update({ username: u }).eq('id', uid);
        if (r.error) return r.error.message.indexOf('duplicate') > -1 ? 'That username is taken.' : 'Could not change it.';
        window.stockspotAuth.username = u;
        var w = document.getElementById('whoami'); if (w) w.textContent = '@' + u;
        return '';
      },
      username: name.charAt(0) === '@' ? name.slice(1) : '',
      logout: async function () { await sb.auth.signOut(); location.replace('login.html'); },
      setPassword: async function (pw) { var r = await sb.auth.updateUser({ password: pw }); return r.error ? r.error.message : ''; }
    };
  }

  function split(path) { var i = path.lastIndexOf('/'); return { parent: i < 0 ? '' : path.slice(0, i), id: path.slice(i + 1) }; }
  function snap(row) { return { id: row ? row.id : '', exists: !!row, data: function () { return row ? row.data : undefined; } }; }

  var db = {
    doc: function (path) {
      var p = split(path);
      return {
        get: async function () {
          var r = await sb.from('docs').select('id,data').eq('user_id', uid).eq('parent', p.parent).eq('id', p.id).maybeSingle();
          if (r.error) throw r.error;
          return snap(r.data);
        },
        set: async function (data) {
          var r = await sb.from('docs').upsert({ user_id: uid, parent: p.parent, id: p.id, data: data, updated_at: new Date().toISOString() });
          if (r.error) throw r.error;
        },
        delete: async function () {
          var r = await sb.from('docs').delete().eq('user_id', uid).eq('parent', p.parent).eq('id', p.id);
          if (r.error) throw r.error;
        }
      };
    },
    collection: function (path) {
      return {
        get: async function () {
          var r = await sb.from('docs').select('id,data').eq('user_id', uid).eq('parent', path).limit(5000);
          if (r.error) throw r.error;
          return { docs: (r.data || []).map(snap) };
        }
      };
    }
  };

  var assets = {
    upload: async function (blob, opts) {
      var id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      var r = await sb.storage.from('images').upload(uid + '/' + id, blob, { contentType: (opts && opts.type) || blob.type || 'image/jpeg' });
      if (r.error) throw r.error;
      return { id: id };
    }
  };

  async function sample(prompt, opts) {
    opts = opts || {};
    var tok = (await sb.auth.getSession()).data.session.access_token;
    var res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
      body: JSON.stringify({ prompt: prompt }),
      signal: opts.signal
    });
    if (!res.ok) {
      var e = new Error('generate failed'); e.code = res.status === 429 ? 'rate_limited' : 'failed'; throw e;
    }
    var reader = res.body.getReader(), dec = new TextDecoder(), text = '';
    for (;;) {
      var x = await reader.read();
      if (x.done) break;
      text += dec.decode(x.value, { stream: true });
      if (opts.onText) opts.onText({ text: text });
    }
    return { text: text };
  }

  var downloads = {
    save: async function (o) {
      var blob = (o.data instanceof Blob) ? o.data : new Blob([o.data], { type: /\.html$/.test(o.filename) ? 'text/html' : /\.json$/.test(o.filename) ? 'application/json' : 'text/markdown' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = o.filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }
  };

  // ---- social: shared wall, comments, notifications, public profiles ----
  function pickName(map, id) { var p = map[id]; return p ? { id: id, username: p.username, avatar_url: p.avatar_url || '' } : { id: id, username: 'unknown', avatar_url: '' }; }
  async function namesFor(ids) {
    ids = Array.from(new Set(ids.filter(Boolean))); var map = {};
    if (!ids.length) return map;
    var r = await sb.from('profiles').select('id,username,avatar_url').in('id', ids);
    (r.data || []).forEach(function (p) { map[p.id] = p; });
    return map;
  }
  window.stockspotSocial = {
    uid: function () { return uid; },
    profileByName: async function (name) {
      await ready;
      var r = await sb.from('profiles').select('id,username,bio,avatar_url,created_at').ilike('username', String(name).replace(/[_%\\]/g, '\\$&')).maybeSingle();
      return r.data || null;
    },
    myProfile: async function () { await ready; var r = await sb.from('profiles').select('id,username,bio,avatar_url,created_at').eq('id', uid).maybeSingle(); return r.data || null; },
    updateMyProfile: async function (f) { await ready; var r = await sb.from('profiles').update(f).eq('id', uid); return r.error ? r.error.message : ''; },
    uploadImage: async function (blob) {
      await ready; var id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
      var r = await sb.storage.from('images').upload(uid + '/' + id, blob, { contentType: blob.type || 'image/jpeg' });
      if (r.error) throw r.error;
      return cfg.url + '/storage/v1/object/public/images/' + uid + '/' + id;
    },
    wall: async function (ownerId) {
      await ready;
      var r = await sb.from('ss_wall_posts').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(100);
      if (r.error) throw r.error;
      var posts = r.data || [], ids = posts.map(function (p) { return p.id; }), com = [];
      if (ids.length) { var c = await sb.from('ss_wall_comments').select('*').in('post_id', ids).order('created_at', { ascending: true }); com = c.data || []; }
      var names = await namesFor(posts.map(function (p) { return p.author_id; }).concat(com.map(function (c) { return c.author_id; })));
      return posts.map(function (p) {
        return { id: p.id, owner_id: p.owner_id, author: pickName(names, p.author_id), text: p.text, imgs: p.imgs || [], ts: new Date(p.created_at).getTime(),
          comments: com.filter(function (c) { return c.post_id === p.id; }).map(function (c) { return { id: c.id, author: pickName(names, c.author_id), text: c.text, ts: new Date(c.created_at).getTime() }; }) };
      });
    },
    addPost: async function (ownerId, text, imgs, ts) {
      await ready; var row = { owner_id: ownerId, author_id: uid, text: text || '', imgs: imgs || [] };
      if (ts) row.created_at = new Date(ts).toISOString();
      var r = await sb.from('ss_wall_posts').insert(row).select().single(); if (r.error) throw r.error; return r.data;
    },
    delPost: async function (id) { await ready; var r = await sb.from('ss_wall_posts').delete().eq('id', id); if (r.error) throw r.error; },
    addComment: async function (postId, text) { await ready; var r = await sb.from('ss_wall_comments').insert({ post_id: postId, author_id: uid, text: text }).select().single(); if (r.error) throw r.error; return r.data; },
    delComment: async function (id) { await ready; var r = await sb.from('ss_wall_comments').delete().eq('id', id); if (r.error) throw r.error; },
    notifs: async function () {
      await ready; var r = await sb.from('ss_notifications').select('*').order('created_at', { ascending: false }).limit(60); if (r.error) throw r.error;
      var rows = r.data || [], names = await namesFor(rows.map(function (n) { return n.actor_id; }));
      return rows.map(function (n) { return { id: n.id, type: n.type, post_id: n.post_id, snippet: n.snippet || '', read: n.read, ts: new Date(n.created_at).getTime(), actor: pickName(names, n.actor_id) }; });
    },
    unread: async function () { await ready; var r = await sb.from('ss_notifications').select('id', { count: 'exact', head: true }).eq('read', false); return r.count || 0; },
    postOwner: async function (postId) { await ready; var r = await sb.from('ss_wall_posts').select('owner_id').eq('id', postId).maybeSingle(); if (!r.data) return null; var n = await namesFor([r.data.owner_id]); return pickName(n, r.data.owner_id); },
    markRead: async function (ids) { await ready; var q = sb.from('ss_notifications').update({ read: true }).eq('read', false); if (ids && ids.length) q = q.in('id', ids); var r = await q; return r.error ? r.error.message : ''; }
  };

  window.blobUrl = function (id) {
    return cfg ? cfg.url + '/storage/v1/object/public/images/' + uid + '/' + id : '';
  };

  window.claude = {
    use: async function (name) {
      await ready;
      if (name === 'db') return db;
      if (name === 'assets') return assets;
      if (name === 'sample') return sample;
      if (name === 'downloads') return downloads;
      throw new Error('unknown capability');
    }
  };
})();
