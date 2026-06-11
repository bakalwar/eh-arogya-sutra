import { useMemo, useState } from 'react';
import {
  ANATOMY_GROUPS,
  ANATOMY_PARTS,
  ANATOMY_SVG_ZONES,
  partById,
  SERIES_NAMES
} from '../data/anatomyRegions';
import {
  buildPrabhavitSummary,
  deriveMedicineHints,
  POLARITY_NEGATIVE,
  POLARITY_POSITIVE,
  SEVERITY_LEVELS
} from '../utils/anatomyMapping';

const BODY_OUTLINE = (
  <g className="anatomy-outline" fill="none" stroke="rgba(74,155,84,0.55)" strokeWidth="1.2">
    <ellipse cx="120" cy="42" rx="32" ry="30" />
    <path d="M 88 72 Q 120 95 152 72 L 148 108 Q 120 118 92 108 Z" />
    <path d="M 70 115 Q 120 125 170 115 L 175 195 Q 120 210 65 195 Z" />
    <path d="M 82 205 Q 120 215 158 205 L 162 320 Q 120 335 78 320 Z" />
    <line x1="120" y1="95" x2="120" y2="330" strokeDasharray="3 3" opacity="0.35" />
    <path d="M 70 120 L 42 200 L 38 300" />
    <path d="M 170 120 L 198 200 L 202 300" />
    <path d="M 95 330 L 88 420" />
    <path d="M 145 330 L 152 420" />
    <line x1="88" y1="420" x2="152" y2="420" />
  </g>
);

function zoneFill(mark) {
  if (!mark) return 'rgba(255,255,255,0.04)';
  if (mark.polarity === POLARITY_NEGATIVE) return 'rgba(41,128,185,0.45)';
  return 'rgba(192,57,43,0.45)';
}

function zoneStroke(mark, selected) {
  if (selected) return '#e8c46a';
  if (mark?.polarity === POLARITY_NEGATIVE) return '#5dade2';
  if (mark?.polarity === POLARITY_POSITIVE) return '#e74c3c';
  return 'rgba(201,150,58,0.25)';
}

export default function AnatomyView({ value = {}, onChange, compact = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const markings = value;

  const selected = selectedId ? partById(selectedId) : null;
  const selectedMark = selectedId ? markings[selectedId] : null;

  const prabhavit = useMemo(() => buildPrabhavitSummary(markings), [markings]);
  const hints = useMemo(() => deriveMedicineHints(markings), [markings]);

  function setMark(partId, patch) {
    const next = { ...markings };
    if (!patch) {
      delete next[partId];
    } else {
      next[partId] = { ...next[partId], ...patch };
    }
    onChange?.(next);
  }

  function applyPolarity(polarity) {
    if (!selectedId) return;
    setMark(selectedId, {
      polarity,
      severity: markings[selectedId]?.severity || 'moderate'
    });
  }

  function applySeverity(severity) {
    if (!selectedId || !markings[selectedId]) return;
    setMark(selectedId, { ...markings[selectedId], severity });
  }

  function clearSelected() {
    if (selectedId) setMark(selectedId, null);
  }

  return (
    <div className={`flex flex-col gap-4 ${compact ? '' : 'lg:flex-row'}`}>
      <div className={`shrink-0 ${compact ? 'mx-auto' : ''}`}>
        <svg
          viewBox="0 0 240 480"
          className={`mx-auto ${compact ? 'h-[280px] w-[140px]' : 'h-[420px] w-[210px]'}`}
          role="img"
          aria-label="Interactive human body anatomy"
        >
          {BODY_OUTLINE}
          {ANATOMY_PARTS.map((part) => {
            const z = ANATOMY_SVG_ZONES[part.id];
            if (!z) return null;
            const mark = markings[part.id];
            const isSel = selectedId === part.id;
            return (
              <ellipse
                key={part.id}
                cx={z.cx}
                cy={z.cy}
                rx={z.rx}
                ry={z.ry}
                fill={zoneFill(mark)}
                stroke={zoneStroke(mark, isSel)}
                strokeWidth={isSel ? 2.5 : 1.2}
                className="cursor-pointer transition-all hover:opacity-90"
                onClick={() => setSelectedId(part.id)}
              >
                <title>{part.label}</title>
              </ellipse>
            );
          })}
          <text x="120" y="468" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">
            Tap region · 🔴 Positive · 🔵 Negative
          </text>
        </svg>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-white/45">
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-red-600 align-middle" /> Positive
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-sky-600 align-middle" /> Negative
          </span>
        </div>
      </div>

      {!compact && (
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl border border-eh-gold/20 bg-eh-card/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-eh-gold2">
              {selected ? selected.label : 'Select a body part'}
            </h3>
            {selected ? (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="mb-2 text-xs text-white/50">Polarity (Rog prakruti)</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyPolarity(POLARITY_POSITIVE)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium ${
                        selectedMark?.polarity === POLARITY_POSITIVE
                          ? 'bg-red-600 text-white ring-2 ring-eh-gold'
                          : 'border border-red-500/40 bg-red-500/15 text-red-200'
                      }`}
                    >
                      🔴 Positive
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPolarity(POLARITY_NEGATIVE)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium ${
                        selectedMark?.polarity === POLARITY_NEGATIVE
                          ? 'bg-sky-600 text-white ring-2 ring-eh-gold'
                          : 'border border-sky-500/40 bg-sky-500/15 text-sky-200'
                      }`}
                    >
                      🔵 Negative
                    </button>
                    <button
                      type="button"
                      onClick={clearSelected}
                      className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {selectedMark && (
                  <div>
                    <p className="mb-2 text-xs text-white/50">Severity</p>
                    <div className="flex gap-1 rounded-xl bg-black/30 p-1">
                      {SEVERITY_LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => applySeverity(lvl)}
                          className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize ${
                            selectedMark.severity === lvl
                              ? 'bg-eh-gold text-eh-bg'
                              : 'text-white/55 hover:bg-white/5'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-white/40">
                  Suggested: {(selected.series || []).map((s) => SERIES_NAMES[s]).join(' · ')}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/45">Click head, chest, abdomen, spine, limbs, or lymph on the diagram.</p>
            )}
          </div>

          {Object.keys(markings).length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-eh-mint">Prabhavit Ang</h3>
              <ul className="space-y-1">
                {prabhavit.map((line) => (
                  <li key={line} className="text-sm font-medium text-eh-gold2">
                    {line}
                  </li>
                ))}
              </ul>
              {hints.length > 0 && (
                <p className="text-xs text-white/50">
                  Medicine lines: {hints.map((h) => h.label).join(' + ')}
                </p>
              )}
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-white/55">
                {Object.entries(markings).map(([id, m]) => {
                  const p = partById(id);
                  const pol = m.polarity === POLARITY_NEGATIVE ? '🔵' : '🔴';
                  return (
                    <li key={id}>
                      {pol} {p?.label} — {m.severity}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {ANATOMY_GROUPS.map((g) => (
              <span
                key={g.id}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40"
              >
                {g.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
