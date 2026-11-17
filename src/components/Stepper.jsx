import { Check, Lock, ChevronRight } from 'lucide-react';
import { STEPS } from '../state/appState';
import { useApp } from '../state/AppContext';

const STEP_META = [
  { id: STEPS.SETUP,     number: '01', label: 'Setup',     sub: 'Target Config' },
  { id: STEPS.HANDSHAKE, number: '02', label: 'Handshake', sub: '4-Way EAPOL' },
  { id: STEPS.CAPTURE,   number: '03', label: 'Capture',   sub: 'Deauth & Sniff' },
  { id: STEPS.CRACK,     number: '04', label: 'Crack',     sub: 'Dictionary Attack' },
  { id: STEPS.DEFENSE,   number: '05', label: 'Defense',   sub: 'PMF & WPA3' },
  { id: STEPS.TOOLS,     number: '06', label: 'Tools',     sub: 'Real-World Mapping' },
];

export default function Stepper() {
  const { state, jumpStep } = useApp();
  const { activeStep, completedSteps } = state;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-3 select-none">
      <nav className="flex items-center justify-between gap-2 sm:gap-4">
        {STEP_META.map((step, idx) => {
          const isDone   = completedSteps.has(step.id);
          const isActive = activeStep === step.id;
          const isLocked = !isDone && !isActive;
          const canClick = isDone || isActive;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none min-w-0">
              {/* Step Button */}
              <button
                type="button"
                onClick={() => canClick && jumpStep(step.id)}
                disabled={isLocked}
                className={`
                  flex items-center gap-2.5 py-1.5 px-3 rounded-lg text-left transition-all w-full
                  ${isActive ? 'shadow-sm' : ''}
                  ${canClick ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-40'}
                `}
                style={{
                  background: isActive
                    ? 'var(--surface2)'
                    : isDone
                    ? 'transparent'
                    : 'transparent',
                  border: isActive
                    ? '1px solid var(--accent)'
                    : '1px solid transparent',
                }}
                title={isLocked ? `Complete Step ${idx} first to unlock` : `Jump to Step ${idx + 1}`}
              >
                {/* Number / Status Badge */}
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                  `}
                  style={{
                    background: isDone
                      ? 'var(--success)'
                      : isActive
                      ? 'var(--accent)'
                      : 'var(--surface2)',
                    color: isDone || isActive ? '#ffffff' : 'var(--text-muted)',
                    border: isDone || isActive ? '1px solid transparent' : '1px solid var(--border)',
                  }}
                >
                  {isDone ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : isLocked ? (
                    <Lock size={12} />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step Details */}
                <div className="hidden md:block truncate">
                  <div
                    className="text-xs font-semibold leading-tight truncate"
                    style={{
                      color: isActive
                        ? 'var(--text)'
                        : isDone
                        ? 'var(--text)'
                        : 'var(--text-muted)',
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    className="text-[11px] font-mono leading-none mt-0.5 truncate"
                    style={{
                      color: isActive
                        ? 'var(--accent)'
                        : isDone
                        ? 'var(--success)'
                        : 'var(--text-muted)',
                    }}
                  >
                    {step.sub}
                  </div>
                </div>
              </button>

              {/* Connecting Line / Arrow */}
              {idx < STEP_META.length - 1 && (
                <div className="hidden sm:flex items-center justify-center mx-1 text-slate-600 shrink-0">
                  <div
                    className="h-[1px] w-4 sm:w-6 lg:w-8 transition-colors"
                    style={{
                      background: isDone ? 'var(--success)' : 'var(--border)',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
