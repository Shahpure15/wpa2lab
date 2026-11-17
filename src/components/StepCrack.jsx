// Step 4 — Offline Dictionary Attack Simulator
import { useState, useRef } from 'react';
import { Play, Square, RotateCcw, Terminal, CheckCircle, XCircle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { STEPS, DEFAULT_WORDLIST } from '../state/appState';
import { derivePMK, derivePTK, computeMIC, hexToBytes } from '../crypto/engine';
import { Card, SectionHeading, Button, ProgressBar, Badge, Alert } from './ui';

export default function StepCrack() {
  const { state, setCracker, advanceStep } = useApp();
  const captured = state.capturedHandshake;
  const wpa3On = state.wpa3Enabled;

  const [wordlistText, setWordlistText] = useState(DEFAULT_WORDLIST.join('\n'));
  const [cracker, setCrackerLocal] = useState({
    running: false, done: false, found: false,
    tested: 0, total: 0, currentWord: '',
    computedMic: '', crackedPass: '', elapsed: 0, speed: 0,
  });

  const stopRef = useRef(false);
  const startTs = useRef(0);

  const startCracking = async () => {
    const words = wordlistText.split('\n').map(w => w.trim()).filter(Boolean);
    if (!words.length || !captured || wpa3On) return;

    stopRef.current = false;
    startTs.current = performance.now();

    setCrackerLocal({
      running: true, done: false, found: false,
      tested: 0, total: words.length, currentWord: '', computedMic: '',
      crackedPass: '', elapsed: 0, speed: 0,
    });

    const apMacBytes = hexToBytes(captured.apMac);
    const staMacBytes = hexToBytes(captured.staMac);
    const aNonce = hexToBytes(captured.aNonceHex);
    const sNonce = hexToBytes(captured.sNonceHex);
    const eapolFrame = hexToBytes(captured.eapolHex);
    const targetMic = captured.micHex;

    for (let i = 0; i < words.length; i++) {
      if (stopRef.current) break;

      const word = words[i];

      // Genuine PBKDF2 (4096 rounds) via WebCrypto
      const candPmk = await derivePMK(word, captured.ssid);
      const candPtk = await derivePTK(candPmk, apMacBytes, staMacBytes, aNonce, sNonce);
      const candMic = await computeMIC(candPtk.kck, eapolFrame);

      const elapsed = (performance.now() - startTs.current) / 1000;
      const speed = Math.round((i + 1) / (elapsed || 0.001));

      setCrackerLocal(prev => ({
        ...prev,
        tested: i + 1,
        currentWord: word,
        computedMic: candMic.hex,
        elapsed,
        speed,
      }));

      // Match detection
      if (candMic.hex === targetMic) {
        setCrackerLocal(prev => ({
          ...prev,
          running: false,
          done: true,
          found: true,
          crackedPass: word,
        }));
        return;
      }

      // ~35ms delay to make the WebCrypto scanning cadence visible to examiners
      await new Promise(r => setTimeout(r, 35));
    }

    // Exhausted
    setCrackerLocal(prev => ({
      ...prev,
      running: false,
      done: true,
      found: false,
    }));
  };

  const stopCracking = () => {
    stopRef.current = true;
    setCrackerLocal(prev => ({ ...prev, running: false }));
  };

  const resetCracker = () => {
    stopRef.current = true;
    setCrackerLocal({
      running: false, done: false, found: false,
      tested: 0, total: 0, currentWord: '', computedMic: '',
      crackedPass: '', elapsed: 0, speed: 0,
    });
  };

  const pct = cracker.total > 0 ? Math.round((cracker.tested / cracker.total) * 100) : 0;
  const targetMic = captured?.micHex || '';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in flex flex-col gap-6">

      {/* WPA3 Locked Notice */}
      {wpa3On && (
        <Card className="border-amber-500/40 bg-amber-500/10 text-amber-300">
          <div className="flex items-start gap-3">
            <ShieldAlert size={22} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-amber-200">OFFLINE DICTIONARY ATTACK IMPOSSIBLE (WPA3-SAE Active)</h3>
              <p className="text-xs text-amber-300/90 leading-relaxed mt-1">
                WPA3-SAE uses the Dragonfly key exchange (RFC 7664) with ephemeral Diffie-Hellman keys over NIST P-256.
                No static password verifier or reusable MIC is transmitted over the air. An attacker is limited to online guessing (~5 attempts/sec with AP rate-limiting).
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Cracking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Wordlist Editor Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <SectionHeading
              icon={<Terminal size={18} />}
              title="Dictionary Wordlist"
              sub="Each candidate is tested via genuine PBKDF2-HMAC-SHA1 + PRF-512"
              badge={
                <Badge variant="muted">
                  {wordlistText.split('\n').filter(Boolean).length} Words
                </Badge>
              }
            />

            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px]" style={{ color: 'var(--text-sub)' }}>
                Target password "password123" is at index 18:
              </span>
              <button
                type="button"
                onClick={() => setWordlistText(DEFAULT_WORDLIST.join('\n'))}
                className="text-xs hover:underline font-medium"
                style={{ color: 'var(--accent)' }}
              >
                Reset Default List
              </button>
            </div>

            <textarea
              rows={9}
              value={wordlistText}
              onChange={e => setWordlistText(e.target.value)}
              className="w-full rounded-lg border p-3 text-xs font-mono outline-none resize-none"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
              }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button
              variant={cracker.running ? 'ghost' : 'danger'}
              size="md"
              onClick={startCracking}
              disabled={cracker.running || wpa3On || !captured}
              className="flex-1 justify-center shadow-sm"
            >
              <Play size={14} />
              <span>
                {cracker.running ? 'Cracking in Progress…' :
                  cracker.done ? 'Restart Attack' :
                    '▶ Start Offline Crack'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={stopCracking}
              disabled={!cracker.running}
            >
              <Square size={14} />
              <span>Stop</span>
            </Button>
            <Button variant="ghost" size="md" onClick={resetCracker} title="Reset telemetry">
              <RotateCcw size={14} />
            </Button>
          </div>
        </Card>

        {/* Live Cracking Telemetry Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <SectionHeading
              title="Cracking Telemetry"
              sub="Real-time cryptographic hash verification feedback"
              badge={
                cracker.running ? (
                  <Badge variant="danger">Scanning</Badge>
                ) : cracker.found ? (
                  <Badge variant="success">Key Found</Badge>
                ) : (
                  <Badge variant="muted">Ready</Badge>
                )
              }
            />

            {/* Progress Bar & Rate */}
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-sub)' }}>
                <span>Tested: {cracker.tested} / {cracker.total} words</span>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                  {cracker.speed} guesses/sec ({cracker.elapsed.toFixed(1)}s)
                </span>
              </div>
              <ProgressBar
                value={cracker.tested}
                max={cracker.total}
                color={cracker.found ? 'var(--success)' : 'var(--danger)'}
              />
              <div className="text-right text-[11px] font-mono font-bold" style={{ color: 'var(--text-sub)' }}>
                {pct}% Complete
              </div>
            </div>

            {/* Live Comparison Box */}
            <div
              className="rounded-lg border p-3.5 flex flex-col gap-2.5 font-mono text-xs"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            >
              <div>
                <span className="text-[10px] uppercase font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Testing Candidate:
                </span>
                <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {cracker.currentWord || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Candidate Computed MIC:
                </span>
                <span
                  className="hex-value select-all font-bold"
                  style={{
                    color: cracker.computedMic === targetMic && cracker.computedMic
                      ? 'var(--success)'
                      : cracker.running ? 'var(--danger)' : 'var(--text-sub)',
                  }}
                >
                  {cracker.computedMic || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Captured Target MIC:
                </span>
                <span className="hex-value select-all font-bold" style={{ color: 'var(--danger)' }}>
                  {targetMic || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Success or Exhaustion Banner */}
          {cracker.done && cracker.found && (
            <div
              className="mt-4 rounded-lg border-2 p-3.5 animate-fade-in"
              style={{ borderColor: 'var(--success)', background: 'var(--success-subtle)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={17} style={{ color: 'var(--success)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--success)' }}>[✓] KEY RECOVERED!</span>
              </div>
              <div className="font-mono text-base font-bold my-1" style={{ color: 'var(--text)' }}>
                "{cracker.crackedPass}"
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-sub)' }}>
                Verified via HMAC-SHA1 MIC match in {cracker.elapsed.toFixed(2)}s ({cracker.tested} candidates tested @ {cracker.speed} guesses/sec).
              </p>
            </div>
          )}

          {cracker.done && !cracker.found && (
            <div
              className="mt-4 rounded-lg border-2 p-3.5 animate-fade-in"
              style={{ borderColor: 'var(--warn)', background: 'var(--warn-subtle)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <XCircle size={17} style={{ color: 'var(--warn)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--warn)' }}>[✗] WORDLIST EXHAUSTED</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>
                Key not found in wordlist. The high-entropy passphrase successfully resisted offline dictionary attack.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Continue to Step 5 */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={() => advanceStep(STEPS.DEFENSE)}
        >
          <span>Proceed to Step 5: PMF &amp; WPA3 Defense</span>
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
