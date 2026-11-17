// Step 1 — Setup: Target Network Configuration
import { useState } from 'react';
import { Network, Eye, EyeOff, Key, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { STEPS } from '../state/appState';
import { isValidMac } from '../crypto/engine';
import { Card, SectionHeading, Input, Button, Alert, Badge } from './ui';

function validateSetup({ ssid, passphrase, apMac, staMac, attackerMac }) {
  const errors = {};
  if (!ssid.trim()) errors.ssid = 'SSID is required';
  if (passphrase.length < 8) errors.passphrase = 'Must be at least 8 characters (IEEE 802.11i)';
  if (!isValidMac(apMac)) errors.apMac = 'Invalid format (use AA:BB:CC:11:22:33)';
  if (!isValidMac(staMac)) errors.staMac = 'Invalid format (use DE:AD:BE:EF:44:55)';
  if (!isValidMac(attackerMac)) errors.attackerMac = 'Invalid format (use 13:37:BA:AD:F0:0D)';
  return errors;
}

export default function StepSetup() {
  const { state, setField, advanceStep, resetFrom } = useApp();
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({});

  const fields = {
    ssid: state.ssid,
    passphrase: state.passphrase,
    apMac: state.apMac,
    staMac: state.staMac,
    attackerMac: state.attackerMac,
  };

  const errors = validateSetup(fields);
  const isValid = Object.keys(errors).length === 0;

  function handleChange(key, value) {
    setField(key, value);
    setTouched(t => ({ ...t, [key]: true }));
    if (state.completedSteps.has(STEPS.SETUP)) {
      resetFrom(STEPS.SETUP);
    }
  }

  function handleContinue() {
    setTouched({ ssid: true, passphrase: true, apMac: true, staMac: true, attackerMac: true });
    if (isValid) advanceStep(STEPS.HANDSHAKE);
  }

  const loadScenario = (type) => {
    if (type === 'weak') {
      setField('ssid', 'MITAOE_WiFi_Lab');
      setField('passphrase', 'password123');
      setField('apMac', 'AA:BB:CC:11:22:33');
      setField('staMac', 'DE:AD:BE:EF:44:55');
      setTouched({});
    } else {
      setField('ssid', 'MITAOE_WiFi_Lab');
      setField('passphrase', 'X9#mK2$vLp8@qR5!wZ');
      setField('apMac', 'AA:BB:CC:11:22:33');
      setField('staMac', 'DE:AD:BE:EF:44:55');
      setTouched({});
    }
  };

  const getEntropy = (pass) => {
    if (!pass || pass.length < 8) return { label: 'Too Short', color: 'var(--danger)' };
    if (pass === 'password123' || pass.length < 12) return { label: 'Weak (Common Dict)', color: 'var(--danger)' };
    if (pass.length < 16) return { label: 'Moderate', color: 'var(--warn)' };
    return { label: 'High Entropy (Resistant)', color: 'var(--success)' };
  };

  const entropy = getEntropy(state.passphrase);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in flex flex-col gap-6">
      <Card>
        <SectionHeading
          icon={<Network size={18} />}
          title="Step 1 · Target Network Parameters"
          sub="Configure the target 802.11 Access Point, client station, and attacker interfaces."
          badge={<Badge variant="accent">Config Stage</Badge>}
        />

        <div className="flex flex-col gap-5">
          {/* Preset Buttons */}
          <div className="p-3.5 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <div className="text-xs">
              <span className="font-semibold block" style={{ color: 'var(--text)' }}>Preset Lab Scenarios</span>
              <span style={{ color: 'var(--text-sub)' }}>Quickly test weak vs high-entropy configurations:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadScenario('weak')}
                className="px-2.5 py-1.5 rounded text-xs font-semibold border transition hover:opacity-85"
                style={{
                  background: state.passphrase === 'password123' ? 'var(--danger)' : 'transparent',
                  color: state.passphrase === 'password123' ? '#fff' : 'var(--danger)',
                  borderColor: 'var(--danger)',
                }}
              >
                Weak ("password123")
              </button>
              <button
                type="button"
                onClick={() => loadScenario('strong')}
                className="px-2.5 py-1.5 rounded text-xs font-semibold border transition hover:opacity-85"
                style={{
                  background: state.passphrase === 'X9#mK2$vLp8@qR5!wZ' ? 'var(--success)' : 'transparent',
                  color: state.passphrase === 'X9#mK2$vLp8@qR5!wZ' ? '#fff' : 'var(--success)',
                  borderColor: 'var(--success)',
                }}
              >
                Strong (18-char)
              </button>
            </div>
          </div>

          {/* SSID Input */}
          <Input
            label="Target SSID (Network Name & Salt)"
            hint="Acts as PBKDF2 salt — changing SSID completely alters the resulting PMK"
            placeholder="MITAOE_WiFi_Lab"
            value={state.ssid}
            onChange={e => handleChange('ssid', e.target.value)}
            error={touched.ssid && errors.ssid}
          />

          {/* Passphrase Input with Eye */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--text-sub)' }}>
              <span>WPA2 Passphrase (Pre-Shared Key)</span>
              <span className="text-[11px] font-mono font-semibold" style={{ color: entropy.color }}>
                {entropy.label}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={state.passphrase}
                onChange={e => handleChange('passphrase', e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm font-mono outline-none transition-all focus:border-[var(--accent)]"
                style={{
                  background: 'var(--surface2)',
                  borderColor: (touched.passphrase && errors.passphrase) ? 'var(--danger)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-3 opacity-60 hover:opacity-100 transition"
                style={{ color: 'var(--text-sub)' }}
                title={showPass ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {touched.passphrase && errors.passphrase && (
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>{errors.passphrase}</p>
            )}
          </div>

          {/* MAC Addresses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="AP BSSID (AA MAC)"
              hint="Authenticator MAC"
              mono
              placeholder="AA:BB:CC:11:22:33"
              value={state.apMac}
              onChange={e => handleChange('apMac', e.target.value.toUpperCase())}
              error={touched.apMac && errors.apMac}
            />
            <Input
              label="Client MAC (STA / SPA)"
              hint="Supplicant MAC"
              mono
              placeholder="DE:AD:BE:EF:44:55"
              value={state.staMac}
              onChange={e => handleChange('staMac', e.target.value.toUpperCase())}
              error={touched.staMac && errors.staMac}
            />
            <Input
              label="Attacker MAC"
              hint="wlan0mon RF interface"
              mono
              placeholder="13:37:BA:AD:F0:0D"
              value={state.attackerMac}
              onChange={e => handleChange('attackerMac', e.target.value.toUpperCase())}
              error={touched.attackerMac && errors.attackerMac}
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleContinue}
              className="w-full justify-center"
              disabled={!isValid}
            >
              <span>Continue to 4-Way Handshake</span>
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </Card>

      <Alert type="info">
        <strong>Next Step:</strong> The cryptographic engine will run genuine <code>PBKDF2-HMAC-SHA1</code> (4096 iterations)
        to derive the 256-bit Pairwise Master Key (PMK), then simulate the 4-way EAPOL key exchange.
      </Alert>
    </div>
  );
}
