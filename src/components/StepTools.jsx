// Step 6 — Real-World Tooling Reference
import { Wrench, Terminal, Cpu, FileCode, Database, ArrowLeft } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { STEPS } from '../state/appState';
import { Card, SectionHeading, Badge, Button } from './ui';

const TOOL_MAPPINGS = [
  {
    tool: 'airodump-ng',
    suite: 'aircrack-ng suite',
    category: 'Handshake Capture',
    whatItDoes: 'Puts wireless card into RF monitor mode, hops channels, and captures raw 802.11 frames to a pcap/cap file upon client association or reauthentication.',
    labDifference: 'The lab uses deterministic WebCrypto buffers in browser memory without requiring RF hardware or a physical monitor-mode network interface.',
  },
  {
    tool: 'aireplay-ng --deauth',
    suite: 'aircrack-ng suite',
    category: 'Deauth Injection',
    whatItDoes: 'Injects forged 802.11 management frames (Deauth subtype 0x00C0, Reason 7) with the AP\'s BSSID as source address, forcing client reconnection.',
    labDifference: 'The lab executes a simulated state transition and SVG coordinate animation; no live radio frequency frames are broadcast.',
  },
  {
    tool: 'hcxpcapngtool',
    suite: 'hcxtools suite',
    category: 'Capture Conversion',
    whatItDoes: 'Extracts the relevant 4-way handshake EAPOL frames (ANonce, SNonce, MACs, MIC) from .cap / .pcapng files into the modern Hashcat .hc22000 format.',
    labDifference: 'The lab extracts these 5 parameters directly into a JavaScript state object without disk I/O or pcap parser overhead.',
  },
  {
    tool: 'hashcat -m 22000 / aircrack-ng',
    suite: 'hashcat / aircrack-ng',
    category: 'Offline Cracking',
    whatItDoes: 'Calculates PBKDF2(pass, SSID, 4096) -> PRF-512 -> HMAC-SHA1 MIC across billions of dictionary candidates, accelerated by GPU SIMD pipelines.',
    labDifference: 'The lab runs the exact same mathematical formula via native window.crypto.subtle on CPU at ~30 guesses/sec for visible inspection.',
  },
  {
    tool: 'rockyou.txt / SecLists',
    suite: 'Password Wordlists',
    category: 'Wordlists',
    whatItDoes: 'Massive collections of real-world breached passwords (rockyou.txt contains ~14.3 million entries; SecLists contains rule-based variations).',
    labDifference: 'The lab runs a curated 28-word demonstration dictionary with "password123" at position 18 to demonstrate mismatch cadence and match detection.',
  },
];

export default function StepTools() {
  const { jumpStep } = useApp();

  return (
    <div className="max-w-4xl mx-auto animate-fade-in flex flex-col gap-6">
      <Card>
        <SectionHeading
          icon={<Wrench size={18} />}
          title="Step 6 · Real-World Tooling &amp; Industry Mapping"
          sub="How the cryptographic mechanisms demonstrated in this lab map directly to industry penetration testing utilities."
          badge={<Badge variant="accent">Reference Matrix</Badge>}
        />

        <div className="overflow-x-auto rounded-lg border mt-2" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                <th className="py-2.5 px-3.5 font-semibold uppercase tracking-wider w-36">Tool</th>
                <th className="py-2.5 px-3.5 font-semibold uppercase tracking-wider w-36">Category</th>
                <th className="py-2.5 px-3.5 font-semibold uppercase tracking-wider">What It Does</th>
                <th className="py-2.5 px-3.5 font-semibold uppercase tracking-wider">How This Lab Differs</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {TOOL_MAPPINGS.map((item, idx) => (
                <tr key={idx} className="transition-colors hover:bg-slate-900/10" style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                  <td className="py-3 px-3.5 align-top">
                    <div className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{item.tool}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.suite}</div>
                  </td>
                  <td className="py-3 px-3.5 align-top font-medium" style={{ color: 'var(--text)' }}>
                    {item.category}
                  </td>
                  <td className="py-3 px-3.5 align-top leading-relaxed" style={{ color: 'var(--text-sub)' }}>
                    {item.whatItDoes}
                  </td>
                  <td className="py-3 px-3.5 align-top leading-relaxed font-mono text-[11px]" style={{ color: 'var(--text-sub)' }}>
                    {item.labDifference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footnote on WPA3 research */}
        <div className="mt-4 p-3 rounded-lg border text-xs leading-relaxed" style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-sub)' }}>
          <span className="font-semibold" style={{ color: 'var(--warn)' }}>WPA3 Vulnerability Research Footnote:</span>{' '}
          While WPA3-SAE eliminates offline dictionary attacks, historical research such as the <em>Dragonblood</em> disclosure (CVE-2019-9494) demonstrated side-channel timing leaks and cache-based resource exhaustion in early implementations of the Hunting-and-Pecking curve algorithm, which were subsequently addressed by RFC 8446 and modern hash-to-curve standards.
        </div>

        {/* Navigation back */}
        <div className="mt-5 pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
          <Button
            variant="outline"
            size="md"
            onClick={() => jumpStep(STEPS.DEFENSE)}
          >
            <ArrowLeft size={14} />
            <span>Back to Step 5: Defense</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => jumpStep(STEPS.SETUP)}
          >
            <span>Restart Lab (Step 1)</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
