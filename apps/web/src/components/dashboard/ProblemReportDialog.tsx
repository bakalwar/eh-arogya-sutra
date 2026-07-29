'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { createLocalSupportId } from '../../lib/authPreview';

export function ProblemReportDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('ui');
  const [description, setDescription] = useState('');
  const [pageAction, setPageAction] = useState('Dashboard');
  const [screenshotConsent, setScreenshotConsent] = useState(false);
  const [supportId, setSupportId] = useState('SUP-PREV-PENDING');
  const titleId = useId();
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    setSupportId(createLocalSupportId());
  }, []);

  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Intentionally no-op — support service not connected; do not persist/transmit.
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Report a Problem
      </Button>
      {open ? (
        <div className="ehas2-dialog-backdrop" role="presentation">
          <div className="ehas2-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <h2 id={titleId}>Report a Problem</h2>
            <p role="status">Support service is not connected in this preview.</p>
            <form className="ehas2-auth-actions" onSubmit={handleSubmit}>
              <div className="ehas2-field">
                <label htmlFor="problem-category">Problem category</label>
                <select
                  id="problem-category"
                  ref={firstFieldRef}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="ui">User interface</option>
                  <option value="performance">Performance</option>
                  <option value="access">Access / login preview</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="ehas2-field">
                <label htmlFor="problem-page">Affected page / action</label>
                <input
                  id="problem-page"
                  value={pageAction}
                  onChange={(e) => setPageAction(e.target.value)}
                />
              </div>
              <div className="ehas2-field">
                <label htmlFor="problem-description">Short description</label>
                <textarea
                  id="problem-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="ehas2-field">
                <label>
                  <input
                    type="checkbox"
                    checked={screenshotConsent}
                    onChange={(e) => setScreenshotConsent(e.target.checked)}
                  />{' '}
                  I consent to attach a screenshot later (not uploaded now)
                </label>
              </div>
              <p>
                Preview support ID: <strong>{supportId}</strong>
              </p>
              <p>
                Privacy defaults: patient names, symptoms, reports, prescriptions, phone numbers,
                tokens, and browser storage are not attached.
              </p>
              <div className="ehas2-dialog__actions">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="submit" variant="primary" disabled>
                  Submit (NOT_CONNECTED)
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
