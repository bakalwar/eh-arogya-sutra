'use client';

import { useMemo, useState } from 'react';
import { BODY_SITES, groupBodySites, searchBodySites } from '../../lib/case/bodySites';
import type { BodySiteInput } from '../../lib/case/types';
import { ValidatedField } from './ValidatedField';

export function BodySiteSelector({
  value,
  onChange,
  error,
}: {
  value: BodySiteInput;
  onChange: (next: BodySiteInput) => void;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const sites = useMemo(() => searchBodySites(query), [query]);
  const grouped = useMemo(() => groupBodySites(sites), [sites]);
  const selected = BODY_SITES.filter((s) => value.siteIds.includes(s.id));

  function toggle(id: string) {
    const siteIds = value.siteIds.includes(id)
      ? value.siteIds.filter((x) => x !== id)
      : [...value.siteIds, id];
    onChange({ ...value, siteIds });
  }

  return (
    <fieldset className="ehas2-fieldset">
      <legend>Affected body sites</legend>
      <p className="ehas2-field__hint">
        Accessible text selector — no diagnostic claim. Visual body map not required in Phase 1C-B.
      </p>
      <ValidatedField id="body-site-search" label="Search body sites" error={error}>
        <input
          id="body-site-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search region or site"
        />
      </ValidatedField>
      {selected.length > 0 ? (
        <div className="ehas2-chip-row" aria-label="Selected sites">
          {selected.map((site) => (
            <button
              key={site.id}
              type="button"
              className="ehas2-chip"
              onClick={() => toggle(site.id)}
              aria-pressed="true"
            >
              {site.label} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="ehas2-site-groups">
        {Object.entries(grouped).map(([region, list]) => (
          <div key={region}>
            <h4>{region}</h4>
            <ul className="ehas2-check-list">
              {list.map((site) => (
                <li key={site.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={value.siteIds.includes(site.id)}
                      onChange={() => toggle(site.id)}
                    />{' '}
                    {site.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <ValidatedField id="laterality" label="Laterality (where relevant)">
        <select
          id="laterality"
          value={value.laterality}
          onChange={(e) =>
            onChange({
              ...value,
              laterality: e.target.value as BodySiteInput['laterality'],
            })
          }
        >
          <option value="">Not specified</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="bilateral">Bilateral</option>
          <option value="na">Not applicable</option>
        </select>
      </ValidatedField>
      <ValidatedField id="site-free-text" label="Optional clarification">
        <input
          id="site-free-text"
          value={value.freeText}
          onChange={(e) => onChange({ ...value, freeText: e.target.value })}
        />
      </ValidatedField>
    </fieldset>
  );
}
