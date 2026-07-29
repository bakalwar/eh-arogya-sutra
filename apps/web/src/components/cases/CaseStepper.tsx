'use client';

import Link from 'next/link';
import { CASE_STEPS, type CaseStepId } from '../../lib/case/types';

export function CaseStepper({
  current,
  hrefForStep,
}: {
  current: CaseStepId;
  hrefForStep: (step: CaseStepId) => string;
}) {
  const currentIndex = CASE_STEPS.findIndex((s) => s.id === current);
  return (
    <nav aria-label="New case steps" className="ehas2-stepper">
      <ol>
        {CASE_STEPS.map((step, index) => {
          const status =
            index === currentIndex ? 'current' : index < currentIndex ? 'done' : 'upcoming';
          return (
            <li key={step.id} aria-current={status === 'current' ? 'step' : undefined}>
              <Link href={hrefForStep(step.id)} className={`ehas2-step ehas2-step--${status}`}>
                <span className="ehas2-step__index">{index + 1}</span>
                <span>{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
