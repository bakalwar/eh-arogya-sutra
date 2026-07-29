'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  FEEDBACK_CATEGORIES,
  FeedbackCategory,
  FeedbackModerationService,
  type FeedbackCategoryName,
} from '@ehas2/management-contracts';
import { DoctorShell } from '../shell/DoctorShell';
import { PreviewModeBanner } from '../entry/PreviewModeBanner';
import { DEMO_DOCTOR_NAME, UI_PREVIEW_SESSION_LABEL } from '../../lib/authPreview';
import { Button } from '../ui/Button';
import { PageHeader, Surface } from '../ui/Primitives';

type FormState = {
  category: FeedbackCategoryName;
  rating: string;
  title: string;
  description: string;
  affectedFeatureOrPage: string;
  problemOrSuggestion: 'problem' | 'suggestion' | 'other';
  reproducibility: 'always' | 'sometimes' | 'once' | 'unknown';
  screenshotConsent: boolean;
  contactPermission: boolean;
  publicTestimonialConsent: boolean;
};

const INITIAL: FormState = {
  category: FeedbackCategory.Suggestion,
  rating: '',
  title: '',
  description: '',
  affectedFeatureOrPage: '/dashboard',
  problemOrSuggestion: 'suggestion',
  reproducibility: 'unknown',
  screenshotConsent: false,
  contactPermission: false,
  publicTestimonialConsent: false,
};

export function DoctorFeedbackForm({ currentPath }: { currentPath: string }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [clientError, setClientError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'validated' | 'not_connected'>('idle');
  const [moderationNote, setModerationNote] = useState<string | null>(null);
  const moderator = useMemo(() => new FeedbackModerationService(), []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setClientError(null);
    setModerationNote(null);

    const draft = {
      category: form.category,
      rating: form.rating ? (Number(form.rating) as 1 | 2 | 3 | 4 | 5) : null,
      title: form.title,
      description: form.description,
      affectedFeatureOrPage: form.affectedFeatureOrPage,
      problemOrSuggestion: form.problemOrSuggestion,
      reproducibility: form.reproducibility,
      screenshotConsent: form.screenshotConsent,
      contactPermission: form.contactPermission,
      publicTestimonialConsent: form.publicTestimonialConsent,
      diagnostics: {
        routeTemplate: '/feedback',
        appVersion: null,
        browserDeviceClass: null,
      },
    };

    const result = moderator.moderate(draft);
    if (result.decision === 'REJECTED_WITH_REASON' || result.decision === 'SPAM_REJECTED') {
      setClientError(`${result.reasonCode}: ${result.auditNote}`);
      setSubmitState('idle');
      return;
    }

    setModerationNote(
      `${result.status} (${result.reasonCode}). Transmission remains NOT_CONNECTED.`,
    );
    setSubmitState('not_connected');
    // Intentionally no network call — feedback transmission is not connected.
  }

  return (
    <DoctorShell currentPath={currentPath}>
      <PreviewModeBanner message={`${UI_PREVIEW_SESSION_LABEL} · ${DEMO_DOCTOR_NAME}`} />
      <div className="ehas2-dashboard-grid">
        <PageHeader
          title="Feedback & Support"
          description="Share problems, suggestions, or appreciation. Positive wording is not required. Feedback is not transmitted in this phase."
        />

        <Surface>
          <form className="ehas2-auth-actions" onSubmit={handleSubmit} noValidate>
            <div className="ehas2-field">
              <label htmlFor="fb-category">Feedback category</label>
              <select
                id="fb-category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as FeedbackCategoryName }))
                }
              >
                {FEEDBACK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ehas2-field">
              <label htmlFor="fb-rating">Rating (optional)</label>
              <select
                id="fb-rating"
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              >
                <option value="">No rating</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div className="ehas2-field">
              <label htmlFor="fb-title">Title</label>
              <input
                id="fb-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={120}
                required
              />
            </div>

            <div className="ehas2-field">
              <label htmlFor="fb-description">Description</label>
              <textarea
                id="fb-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={2000}
                required
              />
              <p className="ehas2-field__hint">
                Do not include clinical notes, prescription contents, uploaded report text, OTP, or
                phone numbers.
              </p>
            </div>

            <div className="ehas2-field">
              <label htmlFor="fb-feature">Affected feature / page</label>
              <input
                id="fb-feature"
                value={form.affectedFeatureOrPage}
                onChange={(e) => setForm((f) => ({ ...f, affectedFeatureOrPage: e.target.value }))}
                maxLength={200}
              />
            </div>

            <div className="ehas2-field">
              <label htmlFor="fb-kind">Problem or suggestion</label>
              <select
                id="fb-kind"
                value={form.problemOrSuggestion}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    problemOrSuggestion: e.target.value as FormState['problemOrSuggestion'],
                  }))
                }
              >
                <option value="problem">Problem occurred</option>
                <option value="suggestion">Suggestion</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="ehas2-field">
              <label htmlFor="fb-repro">Reproducibility</label>
              <select
                id="fb-repro"
                value={form.reproducibility}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    reproducibility: e.target.value as FormState['reproducibility'],
                  }))
                }
              >
                <option value="always">Always</option>
                <option value="sometimes">Sometimes</option>
                <option value="once">Once</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="ehas2-field">
              <label>
                <input
                  type="checkbox"
                  checked={form.screenshotConsent}
                  onChange={(e) => setForm((f) => ({ ...f, screenshotConsent: e.target.checked }))}
                />{' '}
                Optional screenshot consent (not uploaded now)
              </label>
            </div>

            <div className="ehas2-field">
              <label>
                <input
                  type="checkbox"
                  checked={form.contactPermission}
                  onChange={(e) => setForm((f) => ({ ...f, contactPermission: e.target.checked }))}
                />{' '}
                Allow support to contact me about this feedback
              </label>
            </div>

            <div className="ehas2-field">
              <label>
                <input
                  type="checkbox"
                  checked={form.publicTestimonialConsent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, publicTestimonialConsent: e.target.checked }))
                  }
                />{' '}
                Public testimonial consent (separate; off by default — never auto-published)
              </label>
            </div>

            {clientError ? (
              <p className="ehas2-field__error" role="alert">
                {clientError}
              </p>
            ) : null}

            {submitState === 'not_connected' ? (
              <p role="status">
                Feedback validated locally. Transmission is NOT_CONNECTED.
                {moderationNote ? ` ${moderationNote}` : ''}
              </p>
            ) : null}

            <div className="ehas2-dialog__actions">
              <Button type="submit" variant="primary">
                Submit feedback
              </Button>
            </div>
          </form>
        </Surface>
      </div>
    </DoctorShell>
  );
}
