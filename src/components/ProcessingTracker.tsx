'use client';

import React from 'react';
import { PROCESSING_STEPS } from '@/types/domain';

interface ProcessingTrackerProps {
  /** Current step number (0 = not started, 1-6 = in progress, 7+ = done) */
  currentStep: number;
  /** "full" = confirmation page (shows step labels), "compact" = card embed */
  variant: 'full' | 'compact';
  /** Whether the processing has failed */
  failed?: boolean;
}

export default function ProcessingTracker({ currentStep, variant, failed }: ProcessingTrackerProps) {
  const totalSteps = PROCESSING_STEPS.length;
  const isComplete = currentStep > totalSteps;
  const effectiveStep = Math.min(currentStep, totalSteps);

  if (variant === 'full') {
    return (
      <div className="pt">
        {/* Segmented progress */}
        <div className="pt__segments">
          {PROCESSING_STEPS.map((s) => {
            const isDone = effectiveStep > s.step;
            const isActive = effectiveStep === s.step && !isComplete;

            return (
              <div
                key={s.step}
                className={`pt__seg ${isDone ? 'pt__seg--done' : ''} ${isActive ? 'pt__seg--active' : ''} ${failed && isActive ? 'pt__seg--failed' : ''}`}
              />
            );
          })}
        </div>

        {/* Step list — only shows completed + active */}
        <div className="pt__steps">
          {PROCESSING_STEPS.map((s) => {
            const isDone = effectiveStep > s.step;
            const isActive = effectiveStep === s.step && !isComplete && !failed;
            const isFailed = effectiveStep === s.step && failed;
            const isPending = effectiveStep < s.step;

            if (isPending) return null;

            return (
              <div
                key={s.step}
                className={`pt__row ${isDone ? 'pt__row--done' : ''} ${isActive ? 'pt__row--active' : ''} ${isFailed ? 'pt__row--failed' : ''}`}
              >
                <span className="pt__row-marker">
                  {isDone ? '✓' : isFailed ? '✗' : isActive ? '›' : '·'}
                </span>
                <span className="pt__row-label">{s.label}</span>
                <span className="pt__row-dots" />
                <span className="pt__row-status">
                  {isDone && 'OK'}
                  {isActive && <span className="pt__cursor" />}
                  {isFailed && 'ERRO'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt__footer">
          <span className="pt__counter">
            {failed ? `Falha na etapa ${effectiveStep}` : `Etapa ${effectiveStep} de ${totalSteps}`}
          </span>
          <span className="pt__est">~2 min</span>
        </div>
      </div>
    );
  }

  // ─── COMPACT VARIANT (card embed) ──────────────────────
  return (
    <div className="ptc">
      {/* Segment progress */}
      <div className="ptc__segments">
        {PROCESSING_STEPS.map((s) => {
          const isDone = effectiveStep > s.step;
          const isActive = effectiveStep === s.step && !isComplete;

          return (
            <div
              key={s.step}
              className={`ptc__seg ${isDone ? 'ptc__seg--done' : ''} ${isActive ? 'ptc__seg--active' : ''} ${failed && isActive ? 'ptc__seg--failed' : ''}`}
            />
          );
        })}
      </div>

      {/* Current step info */}
      <div className="ptc__info">
        <span className="ptc__step-text">
          {failed
            ? `Erro na etapa ${effectiveStep}`
            : effectiveStep > 0
              ? PROCESSING_STEPS.find(s => s.step === effectiveStep)?.label || 'Processando...'
              : 'Iniciando...'}
        </span>
        <span className="ptc__counter">
          {effectiveStep}/{totalSteps}
        </span>
      </div>

      {/* Active pulse */}
      {!isComplete && !failed && (
        <div className="ptc__pulse" />
      )}
    </div>
  );
}
