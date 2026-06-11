/* global fetch, EventSource */
(function () {
  var pollFallbackMs = 60000;
  var apiBase = '';
  var es = null;

  function esc(s) {
    if (s == null) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function useApi() {
    return location.protocol === 'http:' || location.protocol === 'https:';
  }

  function apiUrl(path) {
    if (useApi()) return (apiBase || '') + path;
    return null;
  }

  function renderMerged(data) {
    var linksEl = document.getElementById('links-grid');
    var logEl = document.getElementById('log-list');
    var autoEl = document.getElementById('auto-log-list');
    var meta = document.getElementById('updated-meta');
    var prog = document.getElementById('progress-line');
    if (!data) return;

    if (data.updatedAt) {
      try {
        meta.textContent =
          'work-log.json — ' +
          new Date(data.updatedAt).toLocaleString() +
          (data.live && data.live.sseClients ? ' · SSE: ' + data.live.sseClients : '');
      } catch (e) {
        meta.textContent = 'work-log.json — ' + data.updatedAt;
      }
    }

    if (prog && data.live && data.live.progressHint) {
      var h = data.live.progressHint;
      prog.textContent =
        'Diary entries: ' +
        h.diaryEntries +
        ' · Auto snapshots (repo): ' +
        h.autoSnapshots +
        (data.live.recentChanges && data.live.recentChanges.length
          ? ' · Live buffer: ' + data.live.recentChanges.length + ' change(s)'
          : '');
    }

    linksEl.innerHTML = (data.links || [])
      .map(function (L) {
        return (
          '<div class="card"><h2>' +
          esc(L.label) +
          '</h2><p><a href="' +
          esc(L.url) +
          '" target="_blank" rel="noopener">' +
          esc(L.url) +
          '</a></p>' +
          (L.note ? '<p style="margin-top:8px">' + esc(L.note) + '</p>' : '') +
          '</div>'
        );
      })
      .join('');

    logEl.innerHTML = (data.entries || [])
      .map(function (e) {
        return (
          '<li><div class="d">' +
          esc(e.date) +
          '</div><div class="t">' +
          esc(e.title) +
          '</div><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.65)">' +
          esc(e.detail) +
          '</p></li>'
        );
      })
      .join('');

    if (autoEl) {
      var auto = data.autoLog || [];
      autoEl.innerHTML = auto.length
        ? auto
            .slice()
            .reverse()
            .map(function (a) {
              return (
                '<li style="border-left-color:#c9963a"><div class="d">' +
                esc(a.at) +
                '</div><div class="t">' +
                esc(a.summary) +
                '</div><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55)">' +
                esc((a.paths || []).join(', ')) +
                '</p></li>'
              );
            })
            .join('')
        : '<li><p style="margin:0;color:rgba(255,255,255,0.35)">Abhi koi auto snapshot nahi — code save karte hi yahan dikhega.</p></li>';
    }

    renderLivePanel(data.live);
  }

  function renderLivePanel(live) {
    var agentEl = document.getElementById('agent-now');
    var filesEl = document.getElementById('live-files');
    if (!live) return;
    if (agentEl && Object.prototype.hasOwnProperty.call(live, 'agentNow')) {
      agentEl.textContent = live.agentNow || '(khaali — agent-now.txt ya npm run agent:now)';
    }
    if (filesEl && live.recentChanges) {
      var rows = live.recentChanges || [];
      filesEl.innerHTML = rows.length
        ? rows
            .slice()
            .reverse()
            .map(function (r) {
              return (
                '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">' +
                '<span style="color:var(--gold2)">' +
                esc(r.at && r.at.slice(11, 19)) +
                '</span> · <code style="color:var(--mint);font-size:11px">' +
                esc(r.path) +
                '</code></div>'
              );
            })
            .join('')
        : '<p style="margin:0;color:rgba(255,255,255,0.35)">Koi file change abhi capture nahi hua.</p>';
    }
  }

  function loadLog() {
    var u = apiUrl('/eh-arogya/api/log');
    if (u) {
      fetch(u, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then(renderMerged)
        .catch(function () {
          loadFileFallback();
        });
      return;
    }
    loadFileFallback();
  }

  function loadFileFallback() {
    fetch('./data/work-log.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(function (d) {
        d.live = d.live || {};
        renderMerged(d);
      })
      .catch(function () {
        document.getElementById('log-list').innerHTML =
          '<li><p style="margin:0;color:#e74c3c">Data load fail. Server par kholen: http://localhost:5000/eh-arogya/</p></li>';
      });
  }

  function connectSse() {
    var u = apiUrl('/eh-arogya/api/stream');
    if (!u || typeof EventSource === 'undefined') return;
    try {
      es = new EventSource(u);
      es.onmessage = function (ev) {
        try {
          var msg = JSON.parse(ev.data);
          if (msg.type === 'log_refresh') loadLog();
          else if (msg.type === 'agent_now') {
            var el = document.getElementById('agent-now');
            if (el) el.textContent = msg.line || '(khaali)';
          }           else if (msg.type === 'repo_change' && msg.recent) {
            renderLivePanel({ recentChanges: msg.recent });
          } else if (msg.type === 'hello' && msg.merged) {
            renderLivePanel(msg.merged);
          }
        } catch (e) {
          /* ignore */
        }
      };
      es.onerror = function () {
        /* browser reconnects */
      };
    } catch (e) {
      /* SSE fail */
    }
  }

  var pill = document.getElementById('live-pill');
  if (pill && useApi()) {
    pill.textContent = '● LIVE (SSE)';
  }

  loadLog();
  connectSse();
  setInterval(loadLog, pollFallbackMs);
})();
