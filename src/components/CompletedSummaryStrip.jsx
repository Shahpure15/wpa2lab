// Completed step summary ribbon — clean, compact, non-intrusive
import { useApp } from '../state/AppContext';
import { STEPS } from '../state/appState';
import { ChevronRight, Edit3 } from 'lucide-react';

export default function CompletedSummaryStrip() {
  const { state, jumpStep } = useApp();
  const { completedSteps, activeStep } = state;

  if (completedSteps.size === 0) return null;

  return (
    <div
      className="mb-6 rounded-lg border p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm transition-all"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        <span className="font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Active Session:
        </span>

        {/* Step 1 summary */}
        {completedSteps.has(STEPS.SETUP) && (
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span style={{ color: 'var(--text)' }}>{state.ssid}</span>
            <span style={{ color: 'var(--text-muted)' }}>({state.apMac})</span>
          </div>
        )}

        {/* Step 2 summary */}
        {completedSteps.has(STEPS.HANDSHAKE) && (
          <div className="flex items-center gap-1.5 font-mono">
            <span className="opacity-40">/</span>
            <span style={{ color: 'var(--text-sub)' }}>MIC:</span>
            <span style={{ color: 'var(--accent)' }}>
              {state.crypto.micHex ? `${state.crypto.micHex.slice(0, 12)}…` : 'Derived'}
            </span>
          </div>
        )}

        {/* Step 3 summary */}
        {completedSteps.has(STEPS.CAPTURE) && state.capturedHandshake && (
          <div className="flex items-center gap-1.5 font-mono">
            <span className="opacity-40">/</span>
            <span className="font-semibold text-rose-500">Handshake Captured</span>
          </div>
        )}
      </div>

      {/* Edit / Quick Jump Button */}
      {activeStep > STEPS.SETUP && (
        <button
          type="button"
          onClick={() => jumpStep(STEPS.SETUP)}
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded hover:opacity-100 opacity-75 transition"
          style={{ background: 'var(--surface2)', color: 'var(--text-sub)' }}
          title="Return to Setup to modify parameters"
        >
          <Edit3 size={12} />
          <span>Edit Config</span>
        </button>
      )}
    </div>
  );
}
