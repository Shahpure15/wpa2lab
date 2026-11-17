// Step 3 — Deauthentication & Handshake Sniffing
import { useState, useRef } from 'react';
import { Zap, Shield, ArrowRight, Download, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { STEPS } from '../state/appState';
import { Card, SectionHeading, Button, Badge, Alert } from './ui';
import TopologySVG from './TopologySVG';

function BufferField({ label, value, color, mono = true }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 border-b text-xs last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <span className="font-medium shrink-0" style={{ color: 'var(--text-sub)' }}>{label}:</span>
      <span className={`break-all text-right ${mono ? 'font-mono' : ''}`} style={{ color: color || 'var(--text)' }}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function StepCapture() {
  const { state, setCaptured, advanceStep } = useApp();
  const [phase, setPhase]           = useState('idle'); // 'idle' | 'deauthing' | 'reconnecting' | 'captured' | 'blocked'
  const [topoStep, setTopoStep]     = useState(0);
  const [isDeauth, setIsDeauth]     = useState(false);
  const [clientStat, setClientStat] = useState('connected');
  const [logs, setLogs]             = useState([]);
  const timerRefs                   = useRef([]);

  const pmfOn  = state.pmfEnabled;
  const crypto = state.crypto;

  const addLog = (text, type = 'info') => {
    const time = (performance.now() / 1000).toFixed(3);
    setLogs(prev => [...prev, { text, type, time }]);
  };

  const delay = (ms) => new Promise(res => {
    const id = setTimeout(res, ms);
    timerRefs.current.push(id);
  });

  const injectDeauthAndCapture = async () => {
    setLogs([]);
    setTopoStep(0);
    setIsDeauth(true);

    if (pmfOn) {
      setPhase('blocked');
      addLog(`[TX] Attacker (${state.attackerMac}) -> STA (${state.staMac}) [802.11 Deauth Subtype 0x00C0, Reason: 7]`, 'danger');
      await delay(450);
      addLog('[BLOCKED] 802.11w PMF Active: Client rejected unsigned Deauthentication frame (Missing BIP MIC).', 'warn');
      addLog('[!] Connection maintained without interruption. Handshake NOT captured.', 'warn');
      setIsDeauth(false);
      return;
    }

    setPhase('deauthing');
    addLog(`[TX] Attacker (${state.attackerMac}) -> STA (${state.staMac}) Injecting Deauth burst (Reason 7: Class 3 frame)...`, 'danger');

    for (let i = 1; i <= 3; i++) {
      await delay(220);
      addLog(`[TX] Deauth frame #${i} transmitted on Channel 6.`, 'danger');
    }

    await delay(250);
    setClientStat('disconnected');
    setIsDeauth(false);
    addLog('[STATE] Client forcibly disconnected from BSSID.', 'warn');

    await delay(350);
    setClientStat('reconnecting');
    setPhase('reconnecting');
    addLog('[STATE] Client auto-reconnecting — 4-Way Handshake triggered.', 'info');

    // Run EAPOL Handshake sequence
    for (let s = 1; s <= 4; s++) {
      await delay(480);
      setTopoStep(s);
      if (s === 1) {
        addLog(`[SNIFF] EAPOL Msg 1 captured: ANonce (${crypto.aNonceHex.slice(0, 16)}...)`, 'info');
      } else if (s === 2) {
        addLog(`[SNIFF] EAPOL Msg 2 captured: SNonce + MIC (${crypto.micHex.slice(0, 16)}...) [KEY VERIFIER]`, 'danger');
      } else if (s === 3) {
        addLog('[SNIFF] EAPOL Msg 3: AP confirms pairwise key and wraps GTK.', 'info');
      } else if (s === 4) {
        addLog('[SNIFF] EAPOL Msg 4: Handshake ACK complete. Client re-authorized.', 'success');
      }
    }

    await delay(300);
    setClientStat('connected');
    setPhase('captured');
    addLog('[SUCCESS] Complete 4-Way Handshake captured into memory buffer.', 'success');

    // Store in global state
    setCaptured({
      ssid:      state.ssid,
      apMac:     state.apMac,
      staMac:    state.staMac,
      aNonceHex: crypto.aNonceHex,
      sNonceHex: crypto.sNonceHex,
      micHex:    crypto.micHex,
      eapolHex:  crypto.eapolHex,
      isWpa3:    state.wpa3Enabled,
    });
  };

  const captured = state.capturedHandshake;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in flex flex-col gap-6">

      {/* Top Split: Topology with Attacker + Attack Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Topology Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <SectionHeading
              title="RF Link &amp; Attacker Node"
              sub="Promiscuous RF monitor-mode interface (wlan0mon) sniffing target link"
              badge={
                <Badge variant={phase === 'captured' ? 'success' : phase === 'blocked' ? 'warn' : 'accent'}>
                  {phase === 'captured' ? 'Handshake Sniffed' : phase === 'blocked' ? 'Protected by PMF' : 'Listening'}
                </Badge>
              }
            />

            <TopologySVG
              step={topoStep}
              clientStatus={clientStat}
              showAttacker={true}
              isDeauthing={isDeauth}
              pmfBlocked={pmfOn}
            />
          </div>

          <div className="mt-4 pt-3 border-t text-xs flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-sub)' }}>Attacker Interface:</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--danger)' }}>
              {state.attackerMac} (Channel 6)
            </span>
          </div>
        </Card>

        {/* Attack Execution Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <SectionHeading
              icon={<Zap size={18} />}
              title="Deauthentication Injection"
              sub="Spoof raw 802.11 management frames to force reconnection"
            />

            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-sub)' }}>
              Legacy 802.11 management frames (Deauth / Disassoc) lack cryptographic authentication.
              An attacker spoofing the AP's BSSID can transmit Reason Code 7 frames, causing the client to drop off and immediately re-authenticate.
            </p>

            {/* Main Injection Button */}
            <Button
              variant="danger"
              size="lg"
              onClick={injectDeauthAndCapture}
              disabled={phase === 'deauthing' || phase === 'reconnecting'}
              className="w-full justify-center shadow-sm"
            >
              <Zap size={15} />
              <span>
                {phase === 'deauthing' ? 'Transmitting Deauth Burst…' :
                 phase === 'reconnecting' ? 'Sniffing 4-Way Handshake…' :
                 phase === 'captured' ? 'Re-Inject Deauth & Sniff' :
                 '⚡ Inject Deauth & Capture Handshake'}
              </span>
            </Button>
          </div>

          {/* Real-time packet log */}
          <div
            className="mt-4 rounded-lg border overflow-y-auto text-[11px] font-mono p-2.5 flex flex-col gap-1"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)', maxHeight: 150, minHeight: 110 }}
          >
            {logs.length === 0 ? (
              <span className="text-center my-auto" style={{ color: 'var(--text-muted)' }}>
                Click "Inject Deauth" above to start sniffing
              </span>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>{l.time}s</span>
                  <span
                    style={{
                      color: l.type === 'danger' ? 'var(--danger)' :
                             l.type === 'warn' ? 'var(--warn)' :
                             l.type === 'success' ? 'var(--success)' :
                             'var(--text)',
                    }}
                  >
                    {l.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Captured Handshake Buffer Card */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading
            icon={<Download size={18} />}
            title="Captured Handshake Buffer"
            sub="Extracted 802.11i cryptographic parameters ready for offline dictionary cracking"
            badge={
              captured ? (
                <Badge variant="success">EAPOL M1/M2 Captured</Badge>
              ) : (
                <Badge variant="muted">Buffer Empty</Badge>
              )
            }
          />
        </div>

        {!captured ? (
          <div
            className="rounded-lg border-2 border-dashed p-8 text-center flex flex-col items-center justify-center gap-2"
            style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
          >
            <Download size={24} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-sub)' }}>
              No handshake captured yet. Click "Inject Deauth &amp; Capture" above to sniff traffic.
            </span>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
            <BufferField label="Target SSID" value={captured.ssid} mono={false} />
            <BufferField label="AP BSSID" value={captured.apMac} />
            <BufferField label="Client Station" value={captured.staMac} />
            <BufferField label="ANonce (Authenticator 32B)" value={captured.aNonceHex} color="var(--accent)" />
            <BufferField label="SNonce (Supplicant 32B)" value={captured.sNonceHex} color="#a855f7" />
            <BufferField label="Captured Target MIC (16B)" value={captured.micHex} color="var(--danger)" />
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-5 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => advanceStep(STEPS.CRACK)}
            disabled={!captured}
          >
            <span>Proceed to Step 4: Offline Dictionary Crack</span>
            <ArrowRight size={15} />
          </Button>
        </div>
      </Card>

    </div>
  );
}
