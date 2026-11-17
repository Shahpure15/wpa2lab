// Step 5 — Security Defense Mechanisms: 802.11w PMF & WPA3-SAE
import { useState } from 'react';
import { ShieldCheck, Lock, Shield, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { STEPS } from '../state/appState';
import { Card, SectionHeading, Toggle, Badge, Button } from './ui';

const VIVA_QA = [
  {
    q: '1. Why HMAC-SHA1 and not SHA-256 for the MIC?',
    a: 'IEEE 802.11i was finalized in 2004 when SHA-1 was the standard cryptographic hash function. SHA-256 was standardized later; WPA2-PSK Key Descriptor Version 2 mandated HMAC-SHA1-128 for hardware compatibility across early Wi-Fi silicon. Modern standards (IEEE 802.11ac/ax and WPA3) transitioned to SHA-256 and SHA-384.',
  },
  {
    q: '2. Why is the SSID used as the PBKDF2 salt?',
    a: 'Salting PBKDF2 with the network SSID binds the derived Pairwise Master Key (PMK) uniquely to that specific network name. This prevents precomputed rainbow table attacks (such as the Church of WiFi tables) across different access points, forcing an attacker to recompute all 4,096 PBKDF2 iterations per candidate password for each target SSID.',
  },
  {
    q: '3. Why exactly 4096 iterations?',
    a: 'In 2004, 4,096 iterations of HMAC-SHA1 struck a deliberate engineering compromise between authentication latency on low-power embedded access points (~100–300ms) and computational cost for attackers. While reasonable for embedded CPUs two decades ago, modern consumer GPUs compute millions of WPA2 PBKDF2 hashes per second, making 4,096 rounds insufficient against dictionary attacks today.',
  },
  {
    q: '4. What happens if two clients connect to the AP simultaneously?',
    a: 'Each client undergoes an independent 4-way handshake with unique nonces (ANonce and SNonce) and distinct MAC addresses. Because the PRF-512 input concatenates Min/Max(MACs) with Min/Max(Nonces), both clients derive entirely unique pairwise session keys (KCK, KEK, TK), preventing either client from eavesdropping on or decrypting the other\'s unicast traffic.',
  },
  {
    q: '5. Why is the GTK separate from the PTK?',
    a: 'The PTK encrypts point-to-point unicast traffic between a single station and the AP, ensuring client isolation. The Group Temporal Key (GTK) is a shared symmetric key used exclusively for broadcast and multicast frames (such as ARP and DHCP) so all associated clients can receive and decrypt network-wide transmissions from the AP.',
  },
  {
    q: '6. Can WPA3 be silently downgraded to WPA2 (transition mode risk)?',
    a: 'Yes. In WPA3 "Transition Mode" (WPA2/WPA3-Personal mixed), the AP broadcasts support for both SAE and WPA2-PSK. An active rogue AP or jamming attack can spoof a WPA2-only beacon, coercing dual-mode clients to fall back to the legacy 4-way handshake, exposing them to deauthentication and offline dictionary cracking. Only pure "WPA3-Personal Only" mode mandates SAE and PMF unconditionally.',
  },
  {
    q: '7. Is PMF alone sufficient security without WPA3?',
    a: 'No. Protected Management Frames (802.11w) only authenticate management frames (Deauth, Disassoc) to stop rogue disconnection attacks. They do not alter the underlying WPA2 4-way handshake. If an attacker passively sniffs a natural, legitimate client reconnection (without deauthing), the EAPOL Message 2 MIC remains fully vulnerable to offline dictionary cracking.',
  },
  {
    q: '8. What\'s a realistic crack success rate outside a curated lab wordlist?',
    a: 'Against arbitrary residential networks, standard dictionary attacks (like rockyou.txt with ~14 million words) succeed roughly 30–50% of the time against weak human-chosen passphrases. However, against high-entropy passwords (e.g., random 14+ alphanumeric characters or random passphrases), offline dictionary cracking has effectively a 0% success rate even on multi-GPU cracking clusters due to the exponential keyspace.',
  },
];

export default function StepDefense() {
  const { state, setField, jumpStep, advanceStep } = useApp();
  const [vivaOpen, setVivaOpen] = useState(false);
  const pmfOn  = state.pmfEnabled;
  const wpa3On = state.wpa3Enabled;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in flex flex-col gap-6">

      <Card>
        <SectionHeading
          icon={<ShieldCheck size={18} />}
          title="Step 5 · Cryptographic Security Defenses"
          sub="Enable modern Wi-Fi security standards to neutralize deauthentication and offline dictionary attacks."
          badge={
            pmfOn || wpa3On ? (
              <Badge variant="warn">Defenses Active</Badge>
            ) : (
              <Badge variant="muted">Legacy WPA2 Vulnerable</Badge>
            )
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Defense 1: 802.11w PMF */}
          <div
            className="rounded-xl border-2 p-5 transition-all flex flex-col justify-between"
            style={{
              borderColor: pmfOn ? 'var(--warn)' : 'var(--border)',
              background: pmfOn ? 'var(--warn-subtle)' : 'var(--surface2)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: pmfOn ? 'var(--warn)' : 'var(--border)', color: pmfOn ? '#ffffff' : 'var(--text-muted)' }}
                  >
                    <Shield size={16} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    802.11w PMF
                  </span>
                </div>
                {pmfOn && <Badge variant="warn">Active</Badge>}
              </div>

              <Toggle
                checked={pmfOn}
                onChange={v => setField('pmfEnabled', v)}
                label="Protected Management Frames"
                sub="Cryptographically signs Deauth &amp; Disassoc frames using BIP (AES-128-CMAC / IGTK)"
              />

              <div className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>
                {pmfOn ? (
                  <p className="font-mono text-[11px] p-2.5 rounded border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--warn)' }}>
                    [BLOCK EFFECT] Spoofed deauth frames lack valid BIP MIC and are dropped at the MAC layer. Attackers cannot force client disconnection.
                  </p>
                ) : (
                  <p>
                    Without PMF, management frames are transmitted in unauthenticated plaintext. Anyone can spoof the BSSID and disconnect clients.
                  </p>
                )}
              </div>
            </div>

            {pmfOn && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => jumpStep(STEPS.CAPTURE)}
                  className="w-full justify-center"
                >
                  <ArrowLeft size={13} />
                  <span>Test Deauth Block in Step 3</span>
                </Button>
              </div>
            )}
          </div>

          {/* Defense 2: WPA3-SAE Dragonfly */}
          <div
            className="rounded-xl border-2 p-5 transition-all flex flex-col justify-between"
            style={{
              borderColor: wpa3On ? 'var(--warn)' : 'var(--border)',
              background: wpa3On ? 'var(--warn-subtle)' : 'var(--surface2)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: wpa3On ? 'var(--warn)' : 'var(--border)', color: wpa3On ? '#ffffff' : 'var(--text-muted)' }}
                  >
                    <Lock size={16} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    WPA3-SAE (Dragonfly)
                  </span>
                </div>
                {wpa3On && <Badge variant="warn">Active</Badge>}
              </div>

              <Toggle
                checked={wpa3On}
                onChange={v => setField('wpa3Enabled', v)}
                label="Dragonfly Zero-Knowledge Handshake"
                sub="Replaces static PSK with ephemeral Diffie-Hellman (P-256) per-session key derivation"
              />

              <div className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>
                {wpa3On ? (
                  <p className="font-mono text-[11px] p-2.5 rounded border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--warn)' }}>
                    [BLOCK EFFECT] Sniffed frames contain only ephemeral elliptic curve commitments. No static password hash is exposed to offline dictionary attacks.
                  </p>
                ) : (
                  <p>
                    WPA2-PSK exposes deterministic HMAC-SHA1 MIC tags in EAPOL Msg 2, allowing attackers to test dictionary words completely offline.
                  </p>
                )}
              </div>
            </div>

            {wpa3On && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => jumpStep(STEPS.CRACK)}
                  className="w-full justify-center"
                >
                  <ArrowLeft size={13} />
                  <span>Verify Lockout in Step 4</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Attack Surface Comparison Matrix — Clean Colored Dots (No Emojis) */}
        <div className="rounded-lg border overflow-hidden mt-2" style={{ borderColor: 'var(--border)' }}>
          <div className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider" style={{ background: 'var(--surface2)', color: 'var(--text-sub)' }}>
            Attack Surface Mitigation Comparison
          </div>
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <th className="py-2 px-3">Vector</th>
                <th className="py-2 px-3">WPA2 Legacy</th>
                <th className="py-2 px-3">+ 802.11w PMF</th>
                <th className="py-2 px-3">+ WPA3-SAE</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              <tr>
                <td className="py-2.5 px-3 font-medium font-sans" style={{ color: 'var(--text)' }}>Deauth Flooding (Reason 7)</td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--danger)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--danger)' }} />
                  Vulnerable
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--success)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--success)' }} />
                  Blocked (BIP)
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--success)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--success)' }} />
                  Blocked (Mandatory)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium font-sans" style={{ color: 'var(--text)' }}>EAPOL Handshake Sniffing</td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--danger)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--danger)' }} />
                  Exposes MIC
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--warn)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--warn)' }} />
                  Prevented Disconnect
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--success)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--success)' }} />
                  Zero Knowledge
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium font-sans" style={{ color: 'var(--text)' }}>Offline Dictionary Cracking</td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--danger)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--danger)' }} />
                  Feasible (GPU)
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--warn)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--warn)' }} />
                  Feasible If Captured
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--success)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--success)' }} />
                  Impossible (PFS)
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium font-sans" style={{ color: 'var(--text)' }}>Forward Secrecy (PFS)</td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--danger)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--danger)' }} />
                  None
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--danger)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--danger)' }} />
                  None
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--success)' }}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--success)' }} />
                  Full (ECDH P-256)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Collapsible Viva Prep Panel (Requirement 5) */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setVivaOpen(o => !o)}
            className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                Viva / Exam Preparation Questions (8 Technical Deep Dives)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: 'var(--text-sub)' }}>
                {vivaOpen ? 'Hide Q&A' : 'Expand Q&A'}
              </span>
              {vivaOpen ? <ChevronUp size={16} style={{ color: 'var(--text-sub)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-sub)' }} />}
            </div>
          </button>

          {vivaOpen && (
            <div className="mt-3 flex flex-col gap-3 animate-fade-in">
              {VIVA_QA.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border p-3.5 transition-colors"
                  style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
                >
                  <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--accent)' }}>
                    {item.q}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-sub)' }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proceed to Step 6: Real-World Tools */}
        <div className="mt-5 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => advanceStep(STEPS.TOOLS)}
          >
            <span>Proceed to Step 6: Real-World Tools</span>
            <ArrowRight size={15} />
          </Button>
        </div>
      </Card>

    </div>
  );
}
