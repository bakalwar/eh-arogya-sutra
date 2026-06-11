import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import client from '../../api/client';

const inputCls =
  'w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-eh-gold/40 focus:outline-none';

function formatIfBlock(ifBlock = {}) {
  const parts = [];
  const c = ifBlock || {};
  if (c.bp_systolic_gte != null) parts.push(`BP systolic ≥ ${c.bp_systolic_gte}`);
  if (c.bp_systolic_gt != null) parts.push(`BP systolic > ${c.bp_systolic_gt}`);
  if (c.bp_systolic_lte != null) parts.push(`BP systolic ≤ ${c.bp_systolic_lte}`);
  if (c.bp_systolic_lt != null) parts.push(`BP systolic < ${c.bp_systolic_lt}`);
  if (c.bp_diastolic_gte != null) parts.push(`BP diastolic ≥ ${c.bp_diastolic_gte}`);
  if (c.bp_diastolic_lte != null) parts.push(`BP diastolic ≤ ${c.bp_diastolic_lte}`);
  if (c.polarity_in?.length) parts.push(`Polarity: ${c.polarity_in.join(', ')}`);
  if (c.phase_in?.length) parts.push(`Phase: ${c.phase_in.join(', ')}`);
  if (c.temperament_in?.length) parts.push(`Temperament: ${c.temperament_in.join(', ')}`);
  if (c.symptoms_any?.length) parts.push(`Symptoms (any): ${c.symptoms_any.slice(0, 3).join(' · ')}`);
  if (c.symptoms_all?.length) parts.push(`Symptoms (all): ${c.symptoms_all.join(' · ')}`);
  return parts.length ? parts.join(' · ') : '— (always if enabled)';
}

function formatThenBlock(then = {}) {
  const parts = [];
  const t = then || {};
  if (t.block_electricity?.length) parts.push(`Block: ${t.block_electricity.join(', ')}`);
  if (t.force_electricity) parts.push(`Force: ${t.force_electricity}`);
  if (t.prefer_electricity?.length) parts.push(`Prefer: ${t.prefer_electricity.join(', ')}`);
  if (t.force_potency) parts.push(`Potency: ${t.force_potency}`);
  if (t.set_potency_max) parts.push(`Max potency: ${t.set_potency_max}`);
  if (t.set_potency_min) parts.push(`Min potency: ${t.set_potency_min}`);
  return parts.length ? parts.join(' · ') : '—';
}

function RuleToggle({ enabled, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
        enabled
          ? 'border-eh-mint/50 bg-eh-mint/30'
          : 'border-white/15 bg-white/10'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          enabled ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

export default function AdminDynamicRules() {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState({ updatedAt: null, source: null, ruleCount: 0, enabledCount: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [extractAllowed, setExtractAllowed] = useState(false);
  const [bookChunks, setBookChunks] = useState(0);
  const [bookPages, setBookPages] = useState(0);
  const [gateMessageHi, setGateMessageHi] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadRules = useCallback(async () => {
    setErr('');
    setLoading(true);
    try {
      const { data } = await client.get('/api/book-rag/dynamic-rules');
      if (!data.success) throw new Error(data.message || 'Failed to load rules');
      const d = data.data || {};
      setRules(d.rules || []);
      setMeta({
        updatedAt: d.updatedAt,
        source: d.source,
        ruleCount: d.ruleCount ?? (d.rules || []).length,
        enabledCount: d.enabledCount ?? (d.rules || []).filter((r) => r.enabled !== false).length
      });
      setExtractAllowed(!!d.extractionAllowed);
      setBookChunks(d.bookChunks ?? 0);
      setBookPages(d.bookPageFiles ?? 0);
      setGateMessageHi(d.message_hi || '');
    } catch (e) {
      const m = e.response?.data?.message || e.message || 'Could not load rules';
      setErr(m);
      if (e.response?.status === 403) {
        setErr('Admin login required — sign in as admin or super admin.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((r) => {
      if (filter === 'enabled' && r.enabled === false) return false;
      if (filter === 'disabled' && r.enabled !== false) return false;
      if (!q) return true;
      const blob = [
        r.id,
        r.rationale_hi,
        r.then?.note_hi,
        formatIfBlock(r.if),
        formatThenBlock(r.then),
        r.source
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rules, filter, search]);

  async function toggleRule(rule, nextEnabled) {
    setBusyId(rule.id);
    setErr('');
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: nextEnabled } : r)));
    try {
      const { data } = await client.patch(`/api/book-rag/dynamic-rules/${encodeURIComponent(rule.id)}`, {
        enabled: nextEnabled
      });
      if (!data.success) throw new Error(data.message);
      setMsg(nextEnabled ? `Enabled: ${rule.id}` : `Disabled: ${rule.id}`);
      if (data.data?.updatedAt) {
        setMeta((m) => ({
          ...m,
          updatedAt: data.data.updatedAt,
          enabledCount: rules.filter((r) =>
            r.id === rule.id ? nextEnabled : r.enabled !== false
          ).length + (nextEnabled && rule.enabled === false ? 0 : 0)
        }));
      }
      await loadRules();
    } catch (e) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r)));
      setErr(e.response?.data?.message || e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function enableAll(enable) {
    if (!filtered.length) return;
    if (!window.confirm(`${enable ? 'Enable' : 'Disable'} ${filtered.length} visible rule(s)?`)) return;
    setBusyId('__bulk__');
    setErr('');
    try {
      const { data } = await client.patch('/api/book-rag/dynamic-rules', {
        updates: filtered.map((r) => ({ id: r.id, enabled: enable }))
      });
      if (!data.success) throw new Error(data.message);
      setMsg(data.message);
      await loadRules();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function runGenerateRules() {
    if (!extractAllowed) {
      setErr(
        'Ollama extraction locked until full textbook ingest. Add chapters via Books or ingest:book-batch, then set EH_RULE_EXTRACT_ALLOW=1 in .env.'
      );
      return;
    }
    const query = window.prompt(
      'Book search query for Ollama extraction (Hindi/English):',
      'रक्तचाप विद्युत पोटेंसी ध्रुवता'
    );
    if (query == null) return;
    setGenerating(true);
    setErr('');
    setMsg('Extracting rules from textbook via local Ollama…');
    try {
      const { data } = await client.post('/api/book-rag/generate-rules', {
        query: query.trim() || 'रक्तचाप विद्युत',
        append: true
      });
      if (!data.success) throw new Error(data.message);
      setMsg(
        `Added ${data.data?.extractedCount ?? 0} rule(s). Total: ${data.data?.totalRules ?? '—'}`
      );
      await loadRules();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
      setMsg('');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-eh-gold/80">Admin</p>
          <h1 className="mt-1 font-display text-xl font-semibold text-white">
            ⚡ Dynamic Clinical Rules
          </h1>
          <p className="mt-1 text-sm text-white/40 max-w-xl">
            AI-generated IF/THEN laws from the textbook — potency locks, electricity blocks. Toggle
            without editing JSON.
          </p>
        </div>
        <NavLink
          to="/admin"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition"
        >
          ← Admin Panel
        </NavLink>
      </div>

      {!extractAllowed ? (
        <div className="rounded-xl border border-eh-gold/30 bg-eh-gold/[0.08] px-4 py-4 space-y-2">
          <p className="text-sm font-medium text-eh-gold">
            Phase 1 — Ingest only (Ollama extraction waiting)
          </p>
          <p className="text-xs text-white/55 leading-relaxed">
            {gateMessageHi ||
              'बाकी अध्याय ingest करें। अभी Count Mattei सीड नियम सारांश इंजन में चालू हैं। पूरी पुस्तक के बाद .env में EH_RULE_EXTRACT_ALLOW=1 करें।'}
          </p>
          <p className="text-[10px] text-white/35 font-mono">
            Book index: {bookChunks} chunks · {bookPages} page files · batch: npm run ingest:book-batch
          </p>
          <NavLink
            to="/admin/books"
            className="inline-block text-xs text-eh-mint no-underline hover:underline"
          >
            → Books & OCR (single-page ingest)
          </NavLink>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="text-[10px] uppercase tracking-wider text-white/35">Total rules</div>
          <div className="font-display text-2xl text-white mt-1">{meta.ruleCount}</div>
        </div>
        <div className="rounded-xl border border-eh-mint/20 bg-eh-mint/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-eh-mint/80">Enabled</div>
          <div className="font-display text-2xl text-eh-mint mt-1">{meta.enabledCount}</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 md:col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-white/35">Last updated</div>
          <div className="text-sm text-white/70 mt-1 font-mono">
            {meta.updatedAt ? new Date(meta.updatedAt).toLocaleString('hi-IN') : '—'}
          </div>
          <div className="text-[10px] text-white/30 mt-1 truncate">Source: {meta.source || 'builtin'}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search id, Hindi note, BP, RE, D10…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} max-w-xs`}
        />
        <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'enabled', label: 'Enabled' },
            { id: 'disabled', label: 'Disabled' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 transition ${
                filter === f.id
                  ? 'bg-eh-gold/20 text-eh-gold'
                  : 'bg-black/20 text-white/50 hover:text-white/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={loadRules}
          disabled={loading}
          className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white disabled:opacity-40"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => enableAll(true)}
          disabled={!!busyId || !filtered.length}
          className="rounded-xl border border-eh-mint/30 bg-eh-mint/10 px-4 py-2 text-xs text-eh-mint disabled:opacity-40"
        >
          Enable visible
        </button>
        <button
          type="button"
          onClick={() => enableAll(false)}
          disabled={!!busyId || !filtered.length}
          className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 hover:text-white disabled:opacity-40"
        >
          Disable visible
        </button>
        <button
          type="button"
          onClick={runGenerateRules}
          disabled={generating || !extractAllowed}
          title={
            extractAllowed
              ? 'Run full-book Ollama extraction'
              : 'Locked until EH_RULE_EXTRACT_ALLOW=1 after full ingest'
          }
          className="ml-auto rounded-xl border border-eh-gold/40 bg-eh-gold/15 px-4 py-2 text-xs font-semibold text-eh-gold disabled:opacity-40"
        >
          {generating
            ? 'Ollama extracting…'
            : extractAllowed
              ? '+ Extract from book (Ollama)'
              : '+ Extract (locked — full book pending)'}
        </button>
      </div>

      {msg ? (
        <div className="rounded-xl border border-eh-mint/25 bg-eh-mint/5 px-4 py-3 text-sm text-eh-mint">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {err}
        </div>
      ) : null}

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-white/40">Loading rules…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-white/40">
            No rules match this filter. Run Ollama extraction or check admin login.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 w-16">On</th>
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">IF (conditions)</th>
                  <th className="px-4 py-3">THEN (action)</th>
                  <th className="px-4 py-3 w-14">Pri</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rule) => {
                  const on = rule.enabled !== false;
                  return (
                    <tr
                      key={rule.id}
                      className={`border-b border-white/[0.04] transition ${
                        on ? 'bg-transparent' : 'bg-black/20 opacity-75'
                      }`}
                    >
                      <td className="px-4 py-4 align-top">
                        <RuleToggle
                          enabled={on}
                          disabled={busyId === rule.id || busyId === '__bulk__'}
                          onChange={(next) => toggleRule(rule, next)}
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-mono text-xs text-eh-gold2 break-all">{rule.id}</div>
                        {rule.rationale_hi ? (
                          <p className="mt-2 text-xs text-white/45 leading-relaxed">{rule.rationale_hi}</p>
                        ) : null}
                        {rule.source ? (
                          <p className="mt-1 text-[10px] text-white/25">{rule.source}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-white/65 leading-relaxed max-w-xs">
                        {formatIfBlock(rule.if)}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-white/65 leading-relaxed max-w-xs">
                        <div>{formatThenBlock(rule.then)}</div>
                        {rule.then?.note_hi ? (
                          <p className="mt-2 text-white/40 italic">{rule.then.note_hi}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top text-center font-mono text-white/50">
                        {rule.priority ?? 50}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/25 text-center">
        Changes save to <span className="font-mono">backend/data/dynamicEhRules.json</span> — summary
        engine applies enabled rules on every case.
      </p>
    </div>
  );
}
