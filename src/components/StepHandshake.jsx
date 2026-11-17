// Step 2 — 4-Way Handshake & Key Derivation Inspector + Animated Derivation Pipeline
import { useState, useEffect, useRef } from 'react';
import { Play, FastForward, RotateCcw, RefreshCw, ArrowRight, ArrowDown, ChevronRight, Activity } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { STEPS } from '../state/appState';
import { deriveAll } from '../crypto/engine';
import { Card, SectionHeading, Button, HexBlock, Badge, Alert } from './ui';
import TopologySVG from './TopologySVG';

const EAPOL_STEPS = [
  { step: 1, dir: '→', label: 'Message 1', name: 'ANonce Delivery', sub: 'AP → STA: 32B ANonce (MIC = 0)' },
  { step: 2, dir: '←', label: 'Message 2', name: 'SNonce + MIC',    sub: 'STA → AP: 32B SNonce + 16B HMAC MIC 🔑' },
  { step: 3, dir: '→', label: 'Message 3', name: 'GTK + Install',   sub: 'AP → STA: Wrapped GTK (KEK) + Install Flag' },
  { step: 4, dir: '←', label: 'Message 4', name: 'ACK Confirm',     sub: 'STA → AP: Final Confirmed ACK (802.1X Port Open)' },
];

const STAGE_THEORY = {
  0: {
    title: 'Pre-Handshake State',
    text: 'Both AP and STA know the Pre-Shared Key (PSK). They execute PBKDF2-HMAC-SHA1 with 4096 rounds using the SSID as salt to derive the 256-bit Pairwise Master Key (PMK).',
    formula: 'PMK = PBKDF2(HMAC-SHA1, Passphrase, SSID, 4096, 256)',
  },
  1: {
    title: 'EAPOL Msg 1 · ANonce (AP → STA)',
    text: 'The Access Point transmits a fresh, randomly generated 32-byte ANonce to the Supplicant. Because no session keys exist yet, the MIC field is zeroed. The client now possesses all five inputs to derive the PTK.',
    formula: 'Frame = [Type: EAPOL-Key, Descriptor: RSN, Replay: 1, ANonce, MIC: 0x00...00]',
  },
  2: {
    title: 'EAPOL Msg 2 · SNonce + MIC (VULNERABILITY ANCHOR)',
    text: 'The Client generates its 32-byte SNonce, derives the 512-bit PTK via PRF-512, and responds with SNonce plus a 16-byte HMAC-SHA1 MIC computed using KCK. ANY PASSIVE OBSERVER SNIFFING M1 AND M2 CAN NOW TEST CANDIDATE PASSWORDS 100% OFFLINE.',
    formula: 'PTK = PRF-512(PMK, "Pairwise key expansion", Min/Max(MACs) ‖ Min/Max(Nonces))\nMIC = HMAC-SHA1(KCK, EAPOL_Payload_Zeroed_MIC)[0..15]',
  },
  3: {
    title: 'EAPOL Msg 3 · GTK Delivery (AP → STA)',
    text: 'The AP verifies the Client MIC using its own derived KCK, confirms mutual knowledge of the PMK, and delivers the Group Temporal Key (GTK) encrypted under KEK for multicast/broadcast traffic.',
    formula: 'Wrapped_GTK = NIST_AES_Key_Wrap(KEK, GTK) | MIC = HMAC-SHA1(KCK, Msg3)',
  },
  4: {
    title: 'EAPOL Msg 4 · Handshake Complete (STA → AP)',
    text: 'The Client confirms installation of the Temporal Key (TK) and GTK. The AP transitions the 802.1X Controlled Port from UNAUTHORIZED to AUTHORIZED. All future unicast frames are encrypted with AES-128-CCMP.',
    formula: 'Port_State = AUTHORIZED | Encryption = AES-128-CCMP (CTR with CBC-MAC)',
  },
};

export default function StepHandshake() {
  const { state, setCrypto, setHandshakeStep, advanceStep, regenNonces } = useApp();
  const [loading, setLoading] = useState(false);
  const autoTimerRef = useRef(null);

  // Derivation Pipeline Animation State (5 stages)
  const [pipelineStage, setPipelineStage] = useState(0); // 0 = start, 1..5 = revealed
  const [activeStage, setActiveStage] = useState(0);     // which stage is currently pulsing
  const pipelineTimers = useRef([]);

  const crypto = state.crypto;
  const step   = state.handshakeStep;

  // Staggered reveal function
  const triggerPipelineAnimation = () => {
    pipelineTimers.current.forEach(clearTimeout);
    pipelineTimers.current = [];
    setPipelineStage(0);
    setActiveStage(0);

    for (let s = 1; s <= 5; s++) {
      const t = setTimeout(() => {
        setPipelineStage(s);
        setActiveStage(s);
        setTimeout(() => setActiveStage(0), 450);
      }, (s - 1) * 400);
      pipelineTimers.current.push(t);
    }
  };

  // Recalculate full WebCrypto state whenever inputs change
  useEffect(() => {
    setLoading(true);
    deriveAll({
      ssid:       state.ssid,
      passphrase: state.passphrase,
      apMac:      state.apMac,
      staMac:     state.staMac,
      aNonce:     state._aNonce,
      sNonce:     state._sNonce,
    }).then(res => {
      setCrypto(res);
      setLoading(false);
      triggerPipelineAnimation();
    }).catch(err => {
      console.error('Crypto calculation error:', err);
      setLoading(false);
    });

    return () => {
      pipelineTimers.current.forEach(clearTimeout);
    };
  }, [state.ssid, state.passphrase, state.apMac, state.staMac, state._aNonce, state._sNonce]);

  const handleNextStep = () => {
    const next = step < 4 ? step + 1 : 1;
    setHandshakeStep(next);
  };

  const handleAutoPlay = () => {
    clearInterval(autoTimerRef.current);
    let s = 1;
    setHandshakeStep(s);
    autoTimerRef.current = setInterval(() => {
      s++;
      if (s > 4) {
        clearInterval(autoTimerRef.current);
        return;
      }
      setHandshakeStep(s);
    }, 650);
  };

  const handleReset = () => {
    clearInterval(autoTimerRef.current);
    setHandshakeStep(0);
  };

  const theory = STAGE_THEORY[step] || STAGE_THEORY[0];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in flex flex-col gap-6">

      {/* Top Split: Interactive Topology + Protocol Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Topology Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <SectionHeading
              title="802.11 RF Topology"
              sub="Live EAPOL frame traversal between Authenticator and Supplicant"
              badge={
                <Badge variant={step === 2 ? 'danger' : 'accent'}>
                  {step === 0 ? 'Idle' : `Msg ${step} Active`}
                </Badge>
              }
            />

            <TopologySVG
              step={step}
              clientStatus={step === 4 ? 'connected' : step > 0 ? 'reconnecting' : 'connected'}
              showAttacker={false}
            />

            {/* Stepper Message Selector */}
            <div className="mt-4 grid grid-cols-4 gap-1.5 font-mono text-xs">
              {EAPOL_STEPS.map(m => (
                <button
                  key={m.step}
                  type="button"
                  onClick={() => setHandshakeStep(m.step)}
                  className="py-1.5 px-1 rounded-md text-center transition font-semibold border"
                  style={{
                    background: step === m.step ? 'var(--accent)' : 'var(--surface2)',
                    borderColor: step === m.step ? 'var(--accent)' : 'var(--border)',
                    color: step === m.step ? '#ffffff' : 'var(--text-sub)',
                  }}
                >
                  Msg {m.step}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button variant="primary" size="sm" onClick={handleNextStep} className="flex-1">
              <Play size={13} />
              <span>Step Next</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAutoPlay}>
              <FastForward size={13} />
              <span>Auto-Play</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} title="Reset sequence">
              <RotateCcw size={13} />
            </Button>
            <Button variant="ghost" size="sm" onClick={regenNonces} title="Generate new random 32B nonces">
              <RefreshCw size={13} />
              <span>Nonces</span>
            </Button>
          </div>
        </Card>

        {/* Theory & State Inspector Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <SectionHeading
              title={theory.title}
              sub="Protocol state transition & cryptographic mechanics"
            />

            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-sub)' }}>
              {theory.text}
            </p>

            {/* Derivation Formula Box */}
            <div
              className="rounded-lg p-3 border font-mono text-[11px] leading-relaxed mb-4 whitespace-pre-wrap select-all"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--accent)' }}
            >
              {theory.formula}
            </div>
          </div>

          {step === 2 && (
            <Alert type="danger">
              <strong>Sniffing Window:</strong> This frame exposes SNonce and the 16-byte MIC.
              In Step 3, we inject a deauth frame to sniff this exact frame into our cracking buffer.
            </Alert>
          )}
          {step !== 2 && (
            <Alert type="info">
              Click <strong>"Step Next"</strong> or <strong>"Auto-Play"</strong> to advance through the 4-way key exchange.
            </Alert>
          )}
        </Card>
      </div>

      {/* ── ANIMATED DERIVATION PIPELINE (Requirement 3) ── */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <SectionHeading
            icon={<Activity size={18} />}
            title="Cryptographic Derivation Pipeline"
            sub="Sequential derivation stages from pre-shared credentials to frame integrity authentication"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerPipelineAnimation}
            className="shrink-0"
            title="Replay visual derivation pipeline sequence"
          >
            <RotateCcw size={12} />
            <span>Replay Derivation</span>
          </Button>
        </div>

        {/* 5 Connected Stages Container */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 items-stretch mt-3">

          {/* Stage 1: Passphrase + SSID */}
          <div
            className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${activeStage === 1 ? 'pipeline-stage-active' : ''}`}
            style={{
              borderColor: activeStage === 1 ? 'var(--accent)' : pipelineStage >= 1 ? 'var(--border)' : 'var(--border-subtle)',
              background: activeStage === 1 ? 'var(--accent-subtle)' : 'var(--surface2)',
              opacity: pipelineStage >= 1 ? 1 : 0.35,
            }}
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-sub)' }}>
                <span>1. Inputs</span>
                <Badge variant="muted">PSK + Salt</Badge>
              </div>
              <div className="text-xs font-mono font-bold truncate" style={{ color: 'var(--text)' }}>
                {pipelineStage >= 1 ? state.passphrase : '••••••••'}
              </div>
              <div className="text-[10px] font-mono truncate opacity-75 mt-0.5" style={{ color: 'var(--text-sub)' }}>
                salt: {pipelineStage >= 1 ? state.ssid : '••••'}
              </div>
            </div>
            <div className="text-[10px] font-mono mt-3 pt-2 border-t text-center font-medium" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
              Passphrase &amp; SSID
            </div>
          </div>

          {/* Stage 2: PMK */}
          <div
            className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${activeStage === 2 ? 'pipeline-stage-active' : ''}`}
            style={{
              borderColor: activeStage === 2 ? 'var(--accent)' : pipelineStage >= 2 ? 'var(--border)' : 'var(--border-subtle)',
              background: activeStage === 2 ? 'var(--accent-subtle)' : 'var(--surface2)',
              opacity: pipelineStage >= 2 ? 1 : 0.35,
            }}
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-sub)' }}>
                <span>2. PMK</span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--accent)' }}>256b</span>
              </div>
              <div className="text-[11px] font-mono font-bold break-all leading-tight" style={{ color: 'var(--accent)' }}>
                {pipelineStage >= 2 && crypto.pmkHex ? `${crypto.pmkHex.slice(0, 16)}…` : 'Computing…'}
              </div>
            </div>
            <div className="text-[9px] font-mono mt-3 pt-2 border-t text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>
              PBKDF2-HMAC-SHA1 &times; 4096
            </div>
          </div>

          {/* Stage 3: PTK (512-bit) */}
          <div
            className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${activeStage === 3 ? 'pipeline-stage-active' : ''}`}
            style={{
              borderColor: activeStage === 3 ? 'var(--accent)' : pipelineStage >= 3 ? 'var(--border)' : 'var(--border-subtle)',
              background: activeStage === 3 ? 'var(--accent-subtle)' : 'var(--surface2)',
              opacity: pipelineStage >= 3 ? 1 : 0.35,
            }}
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-sub)' }}>
                <span>3. PTK</span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-sub)' }}>512b</span>
              </div>
              <div className="text-[11px] font-mono font-bold break-all leading-tight" style={{ color: 'var(--text)' }}>
                {pipelineStage >= 3 && crypto.kckHex && crypto.kekHex ? `${crypto.kckHex.slice(0, 8)}${crypto.kekHex.slice(0, 8)}…` : 'Awaiting…'}
              </div>
            </div>
            <div className="text-[9px] font-mono mt-3 pt-2 border-t text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>
              PRF-512 (MACs + Nonces)
            </div>
          </div>

          {/* Stage 4: Key Split (KCK, KEK, TK) */}
          <div
            className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${activeStage === 4 ? 'pipeline-stage-active' : ''}`}
            style={{
              borderColor: activeStage === 4 ? 'var(--accent)' : pipelineStage >= 4 ? 'var(--border)' : 'var(--border-subtle)',
              background: activeStage === 4 ? 'var(--accent-subtle)' : 'var(--surface2)',
              opacity: pipelineStage >= 4 ? 1 : 0.35,
            }}
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-sub)' }}>
                <span>4. Slices</span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-sub)' }}>3x128b</span>
              </div>
              <div className="text-[10px] font-mono leading-tight space-y-0.5">
                <div style={{ color: 'var(--accent)' }}>KCK: {pipelineStage >= 4 && crypto.kckHex ? `${crypto.kckHex.slice(0, 6)}…` : '…'}</div>
                <div style={{ color: 'var(--text-sub)' }}>KEK: {pipelineStage >= 4 && crypto.kekHex ? `${crypto.kekHex.slice(0, 6)}…` : '…'}</div>
                <div style={{ color: 'var(--text-sub)' }}>TK:  {pipelineStage >= 4 && crypto.tkHex ? `${crypto.tkHex.slice(0, 6)}…` : '…'}</div>
              </div>
            </div>
            <div className="text-[9px] font-mono mt-3 pt-2 border-t text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>
              slice [0:16]/[16:32]/[32:48]
            </div>
          </div>

          {/* Stage 5: EAPOL Msg 2 MIC */}
          <div
            className={`rounded-lg border-2 p-3 flex flex-col justify-between transition-all ${activeStage === 5 ? 'pipeline-stage-active' : ''}`}
            style={{
              borderColor: activeStage === 5 ? 'var(--accent)' : pipelineStage >= 5 ? 'var(--danger)' : 'var(--border-subtle)',
              background: activeStage === 5 ? 'var(--accent-subtle)' : pipelineStage >= 5 ? 'var(--danger-subtle)' : 'var(--surface2)',
              opacity: pipelineStage >= 5 ? 1 : 0.35,
            }}
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--danger)' }}>
                <span>5. Target MIC</span>
                <Badge variant="danger">128b</Badge>
              </div>
              <div className="text-[11px] font-mono font-bold break-all leading-tight" style={{ color: 'var(--danger)' }}>
                {pipelineStage >= 5 && crypto.micHex ? `${crypto.micHex.slice(0, 16)}…` : 'Awaiting…'}
              </div>
            </div>
            <div className="text-[9px] font-mono mt-3 pt-2 border-t text-center font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
              HMAC-SHA1 + truncate[0:16]
            </div>
          </div>

        </div>
      </Card>

      {/* Bottom Full-Width Card: Live Cryptographic Derivations */}
      <Card>
        <SectionHeading
          title="Cryptographic Derivation Inspector"
          sub="Deterministic IEEE 802.11i WebCrypto calculations computed directly in your browser"
          badge={
            loading ? (
              <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-sub)' }}>
                <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin border-amber-600" />
                <span>Deriving…</span>
              </span>
            ) : (
              <Badge variant="success">Derived via WebCrypto</Badge>
            )
          }
        />

        <div className="flex flex-col gap-4">
          {/* Top Row: PMK + Nonces */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <HexBlock
              label="PMK (Pairwise Master Key)"
              value={crypto.pmkHex}
              bytes={32}
              color="var(--accent)"
            />
            <HexBlock
              label="ANonce (Authenticator Nonce)"
              value={crypto.aNonceHex}
              bytes={32}
              color="var(--text)"
            />
            <HexBlock
              label="SNonce (Supplicant Nonce)"
              value={crypto.sNonceHex}
              bytes={32}
              color="var(--text)"
            />
          </div>

          {/* Middle Row: PTK Key Slices */}
          <div className="rounded-lg border p-3.5" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-sub)' }}>
              PTK Hierarchy Split (IEEE 802.11i PRF-512 &bull; 384 Bits Used)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
                <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>KCK [0..15] &bull; 128-bit</div>
                <div className="text-[10px] mt-0.5 opacity-80" style={{ color: 'var(--accent)' }}>Key Confirmation &bull; Used for MIC</div>
                <div className="hex-value mt-1.5 text-xs font-mono" style={{ color: 'var(--accent)' }}>{crypto.kckHex}</div>
              </div>
              <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>KEK [16..31] &bull; 128-bit</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-sub)' }}>Key Encryption &bull; Encrypts GTK</div>
                <div className="hex-value mt-1.5 text-xs font-mono" style={{ color: 'var(--text-sub)' }}>{crypto.kekHex}</div>
              </div>
              <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>TK [32..47] &bull; 128-bit</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-sub)' }}>Temporal Key &bull; AES-CCMP Data</div>
                <div className="hex-value mt-1.5 text-xs font-mono" style={{ color: 'var(--text-sub)' }}>{crypto.tkHex}</div>
              </div>
            </div>
          </div>

          {/* Bottom Target: EAPOL Msg 2 MIC */}
          <div className="rounded-lg border-2 p-3.5 transition-all" style={{ borderColor: 'var(--danger)', background: 'var(--danger-subtle)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>
                Target EAPOL Msg 2 MIC (128-bit / 16 Bytes)
              </span>
              <Badge variant="danger">Target Authentication Tag</Badge>
            </div>
            <div className="hex-value text-sm font-bold tracking-wider font-mono select-all" style={{ color: 'var(--danger)' }}>
              {crypto.micHex}
            </div>
            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-sub)' }}>
              Formula: <code>HMAC-SHA1(KCK, EAPOL_Payload_Zeroed_MIC)[0..15]</code>.
              This tag authenticates the Supplicant and confirms mutual knowledge of the PMK.
            </p>
          </div>
        </div>

        {/* Continue to Step 3 */}
        <div className="mt-5 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => advanceStep(STEPS.CAPTURE)}
            disabled={loading || !crypto.micHex}
          >
            <span>Proceed to Step 3: Deauth &amp; Capture</span>
            <ArrowRight size={15} />
          </Button>
        </div>
      </Card>

    </div>
  );
}
