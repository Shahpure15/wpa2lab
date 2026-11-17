// Main App Layout — 2-tier clean header with spacious stepper
import { useState } from 'react';
import { Moon, Sun, ShieldCheck, RotateCcw, AlertTriangle, Key, Shield, Unlock } from 'lucide-react';
import { AppProvider, useApp } from './state/AppContext';
import { STEPS } from './state/appState';
import Stepper from './components/Stepper';
import CompletedSummaryStrip from './components/CompletedSummaryStrip';
import StepSetup from './components/StepSetup';
import StepHandshake from './components/StepHandshake';
import StepCapture from './components/StepCapture';
import StepCrack from './components/StepCrack';
import StepDefense   from './components/StepDefense';
import StepTools     from './components/StepTools';

function LabContent() {
  const { state } = useApp();
  const { activeStep } = state;

  return (
    <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
      <CompletedSummaryStrip />
      {activeStep === STEPS.SETUP     && <StepSetup     />}
      {activeStep === STEPS.HANDSHAKE && <StepHandshake />}
      {activeStep === STEPS.CAPTURE   && <StepCapture   />}
      {activeStep === STEPS.CRACK     && <StepCrack     />}
      {activeStep === STEPS.DEFENSE   && <StepDefense   />}
      {activeStep === STEPS.TOOLS     && <StepTools     />}
    </main>
  );
}

function HeaderBar({ theme, toggleTheme }) {
  const { state, setField, resetFrom, jumpStep } = useApp();

  const loadScenario = (type) => {
    if (type === 'weak') {
      setField('ssid', 'MITAOE_WiFi_Lab');
      setField('passphrase', 'password123');
      setField('pmfEnabled', false);
      setField('wpa3Enabled', false);
      resetFrom(STEPS.SETUP);
    } else if (type === 'strong') {
      setField('ssid', 'MITAOE_WiFi_Lab');
      setField('passphrase', 'X9#mK2$vLp8@qR5!wZ');
      setField('pmfEnabled', false);
      setField('wpa3Enabled', false);
      resetFrom(STEPS.SETUP);
    } else if (type === 'defense') {
      setField('pmfEnabled', true);
      setField('wpa3Enabled', true);
      jumpStep(STEPS.DEFENSE);
    }
  };

  return (
    <div
      className="border-b transition-theme"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Tier 1: Top Brand & Utility Bar */}
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
                WPA2 Handshake &amp; Attack Lab
              </span>
              <span
                className="hidden sm:inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded"
                style={{ background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}
              >
                IEEE 802.11i
              </span>
            </div>
          </div>
        </div>

        {/* Center: Scenario Shortcuts */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-medium mr-1" style={{ color: 'var(--text-muted)' }}>
            Scenarios:
          </span>
          <button
            type="button"
            onClick={() => loadScenario('weak')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition hover:opacity-85"
            style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
            title="Load weak password scenario (password123)"
          >
            <Unlock size={12} />
            <span>1. Weak PSK</span>
          </button>
          <button
            type="button"
            onClick={() => loadScenario('strong')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition hover:opacity-85"
            style={{ background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}
            title="Load high entropy 18-char password"
          >
            <Key size={12} />
            <span>2. Strong PSK</span>
          </button>
          <button
            type="button"
            onClick={() => loadScenario('defense')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition hover:opacity-85"
            style={{ background: 'var(--warn-subtle)', color: 'var(--warn)', border: '1px solid var(--warn)' }}
            title="Active 802.11w PMF + WPA3 Defense"
          >
            <Shield size={12} />
            <span>3. WPA3 Defense</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live WebCrypto</span>
          </span>

          <button
            type="button"
            onClick={() => resetFrom(STEPS.SETUP)}
            className="p-1.5 rounded-lg border hover:opacity-80 transition"
            style={{ borderColor: 'var(--border)', color: 'var(--text-sub)', background: 'var(--surface2)' }}
            title="Restart Lab from Step 1"
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border hover:opacity-80 transition"
            style={{ borderColor: 'var(--border)', color: 'var(--text-sub)', background: 'var(--surface2)' }}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Tier 2: Dedicated Horizontal Stepper Bar */}
      <div
        className="border-t"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}
      >
        <Stepper />
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch { }
  }

  return (
    <div
      data-theme={theme}
      className="min-h-screen flex flex-col transition-theme"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <AppProvider>
        <header className="sticky top-0 z-30 shadow-sm">
          <HeaderBar theme={theme} toggleTheme={toggleTheme} />
        </header>

        <LabContent />

        {/* Clean Footer */}
        <footer
          className="border-t py-3 px-4 text-center text-[11px] tracking-wide"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          EDUCATIONAL SIMULATION &bull; REAL WEBCRYPTO ENGINE (PBKDF2-HMAC-SHA1 &bull; PRF-512 &bull; HMAC-SHA1 MIC) &bull; NO LIVE RF/PACKET CAPTURE
        </footer>
      </AppProvider>
    </div>
  );
}

export default App;
