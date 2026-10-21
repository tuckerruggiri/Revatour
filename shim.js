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
      var r = await sb.from('ss_wall_posts').select('*').eq('owner_id', ownerId).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(100);
      if (r.error) throw r.error;
      var posts = r.data || [], ids = posts.map(function (p) { return p.id; }), com = [], likes = [], reps = [], origs = {};
      var hide = {};
      try { var m1 = await sb.from('ss_mutes').select('target_id'); var m2 = await sb.from('ss_blocks').select('target_id');
        (m1.data || []).concat(m2.data || []).forEach(function (x) { hide[x.target_id] = 1; }); } catch (e) {}
      if (ids.length) {
        var c = await sb.from('ss_wall_comments').select('*').in('post_id', ids).order('created_at', { ascending: true }); com = c.data || [];
        try { var l = await sb.from('ss_wall_likes').select('post_id,user_id').in('post_id', ids); likes = l.data || []; } catch (e) {}
        try { var rp = await sb.from('ss_wall_posts').select('id,repost_of,author_id').in('repost_of', ids); reps = rp.data || []; } catch (e) {}
      }
      var oids = posts.map(function (p) { return p.repost_of; }).filter(Boolean);
      if (oids.length) { var o = await sb.from('ss_wall_posts').select('*').in('id', oids); (o.data || []).forEach(function (x) { origs[x.id] = x; }); }
      var names = await namesFor(posts.map(function (p) { return p.author_id; }).concat(com.map(function (c) { return c.author_id; })).concat(Object.keys(origs).map(function (k) { return origs[k].author_id; })));
      return posts.filter(function (p) { return p.author_id === uid || !hide[p.author_id]; }).map(function (p) {
        var ps = likes.filter(function (x) { return x.post_id === p.id; }), rr = reps.filter(function (x) { return x.repost_of === p.id; }), og = p.repost_of ? origs[p.repost_of] : null;
        return { id: p.id, owner_id: p.owner_id, author: pickName(names, p.author_id), text: p.text, imgs: p.imgs || [], ts: new Date(p.created_at).getTime(), pinned: !!p.pinned,
          likeCount: ps.length, liked: ps.some(function (x) { return x.user_id === uid; }),
          repostCount: rr.length, myRepost: (rr.filter(function (x) { return x.author_id === uid; })[0] || {}).id || '',
          orig: og ? { id: og.id, author: pickName(names, og.author_id), text: og.text, imgs: og.imgs || [], ts: new Date(og.created_at).getTime() } : null, isRepost: !!p.repost_of,
          comments: com.filter(function (c) { return c.post_id === p.id && (c.author_id === uid || !hide[c.author_id]); }).map(function (c) { return { id: c.id, author: pickName(names, c.author_id), text: c.text, ts: new Date(c.created_at).getTime() }; }) };
      });
    },
    like: async function (pid) { await ready; var r = await sb.from('ss_wall_likes').insert({ post_id: pid, user_id: uid }); if (r.error && r.error.code !== '23505') throw r.error; },
    unlike: async function (pid) { await ready; var r = await sb.from('ss_wall_likes').delete().eq('post_id', pid).eq('user_id', uid); if (r.error) throw r.error; },
    likers: async function (pid) { await ready; var r = await sb.from('ss_wall_likes').select('user_id,created_at').eq('post_id', pid).order('created_at', { ascending: false }).limit(200); if (r.error) throw r.error;
      var n = await namesFor((r.data || []).map(function (x) { return x.user_id; })); return (r.data || []).map(function (x) { return pickName(n, x.user_id); }); },
    repost: async function (pid) { await ready; var r = await sb.from('ss_wall_posts').insert({ owner_id: uid, author_id: uid, text: '', imgs: [], repost_of: pid }); if (r.error) throw r.error; },
    pin: async function (pid, pin) { await ready; var r = await sb.rpc('ss_pin_post', { pid: pid, pin: !!pin }); if (r.error) throw r.error; },
    mute: async function (id, on) { await ready; var r = on ? await sb.from('ss_mutes').upsert({ user_id: uid, target_id: id }) : await sb.from('ss_mutes').delete().eq('user_id', uid).eq('target_id', id); if (r.error) throw r.error; },
    block: async function (id, on) { await ready; var r = on ? await sb.from('ss_blocks').upsert({ user_id: uid, target_id: id }) : await sb.from('ss_blocks').delete().eq('user_id', uid).eq('target_id', id); if (r.error) throw r.error; },
    followInfo: async function (id) { await ready;
      var a = await sb.from('ss_follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', id);
      var b = await sb.from('ss_follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', id);
      var me = id === uid ? null : await sb.from('ss_follows').select('follower_id').eq('follower_id', uid).eq('followee_id', id).maybeSingle();
      return { followers: a.count || 0, following: b.count || 0, iFollow: !!(me && me.data) }; },
    follow: async function (id, on) { await ready;
      var r = on ? await sb.from('ss_follows').insert({ follower_id: uid, followee_id: id }) : await sb.from('ss_follows').delete().eq('follower_id', uid).eq('followee_id', id);
      if (r.error && r.error.code !== '23505') throw r.error; },
    followList: async function (id, kind) { await ready; var col = kind === 'followers' ? 'follower_id' : 'followee_id', by = kind === 'followers' ? 'followee_id' : 'follower_id';
      var r = await sb.from('ss_follows').select(col).eq(by, id).order('created_at', { ascending: false }).limit(200); if (r.error) throw r.error;
      var ids = (r.data || []).map(function (x) { return x[col]; }), n = await namesFor(ids); return ids.map(function (i) { return pickName(n, i); }); },
    feed: async function () { await ready;
      var f = await sb.from('ss_follows').select('followee_id').eq('follower_id', uid).limit(500); if (f.error) throw f.error;
      var ids = (f.data || []).map(function (x) { return x.followee_id; }); if (!ids.length) return { following: 0, posts: [] };
      var r = await sb.from('ss_wall_posts').select('*').in('author_id', ids).is('repost_of', null).order('created_at', { ascending: false }).limit(80); if (r.error) throw r.error;
      var rows = (r.data || []).filter(function (p) { return p.owner_id === p.author_id; }).slice(0, 30), n = await namesFor(rows.map(function (p) { return p.author_id; }));
      return { following: ids.length, posts: rows.map(function (p) { return { id: p.id, author: pickName(n, p.author_id), text: p.text, imgs: p.imgs || [], ts: new Date(p.created_at).getTime() }; }) }; },
    hidden: async function () { await ready; var m = await sb.from('ss_mutes').select('target_id'), b = await sb.from('ss_blocks').select('target_id');
      var mi = (m.data || []).map(function (x) { return x.target_id; }), bi = (b.data || []).map(function (x) { return x.target_id; }), n = await namesFor(mi.concat(bi));
      return { mutes: mi.map(function (i) { return pickName(n, i); }), blocks: bi.map(function (i) { return pickName(n, i); }) }; },
    report: async function (pid, reason) { await ready; var r = await sb.from('ss_reports').insert({ reporter_id: uid, post_id: pid, reason: reason || '' }); if (r.error) throw r.error; },
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
    trending: async function () {
      await ready; var since = new Date(Date.now() - 7 * 864e5).toISOString();
      var r = await sb.from('ss_wall_posts').select('text').gte('created_at', since).limit(500); if (r.error) throw r.error;
      var c = {}; (r.data || []).forEach(function (p) { var seen = {}; String(p.text || '').replace(/\$([A-Z]{1,5})(?![A-Za-z0-9])/g, function (m, x) { if (!seen[x]) { seen[x] = 1; c[x] = (c[x] || 0) + 1; } }); });
      return Object.keys(c).map(function (k) { return { sym: k, n: c[k] }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 10);
    },
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
