// Network Topology SVG — Clean vector topology with animated packet flows
import { useEffect, useRef, useState } from 'react';

const AP_X  = 90;   const AP_Y  = 65;
const STA_X = 410;  const STA_Y = 65;
const ATK_X = 250;  const ATK_Y = 160;

const MSG_CONFIG = {
  1: { label: 'Msg 1: ANonce',        from: [AP_X, AP_Y],  to: [STA_X, STA_Y], color: '#3b82f6' },
  2: { label: 'Msg 2: SNonce + MIC',  from: [STA_X, STA_Y],to: [AP_X, AP_Y],   color: '#8b5cf6' },
  3: { label: 'Msg 3: GTK + MIC',     from: [AP_X, AP_Y],  to: [STA_X, STA_Y], color: '#3b82f6' },
  4: { label: 'Msg 4: ACK',           from: [STA_X, STA_Y],to: [AP_X, AP_Y],   color: '#10b981' },
  deauth: { label: 'Deauth (Reason 7)', from: [ATK_X, ATK_Y], to: [STA_X, STA_Y], color: '#ef4444' },
};

export default function TopologySVG({
  step = 0,
  clientStatus = 'connected',
  showAttacker = false,
  isDeauthing = false,
  pmfBlocked = false,
}) {
  const [packet, setPacket] = useState(null);
  const animRef = useRef(null);

  // Trigger packet animation when step or deauth changes
  useEffect(() => {
    let cfg = null;
    if (isDeauthing) {
      cfg = MSG_CONFIG.deauth;
    } else if (step >= 1 && step <= 4) {
      cfg = MSG_CONFIG[step];
    } else {
      setPacket(null);
      return;
    }

    const [fromX, fromY] = cfg.from;
    const [toX, toY]     = cfg.to;
    let startTime = null;
    const duration = 460;

    function frame(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      // If PMF is blocked, halt and bounce at shield (x=370)
      if (pmfBlocked && isDeauthing && progress >= 0.75) {
        setPacket({ x: 360, y: 80, label: 'DROPPED (BIP)', color: '#f59e0b', blocked: true });
        setTimeout(() => setPacket(null), 700);
        return;
      }

      const curX = fromX + (toX - fromX) * ease;
      const curY = fromY + (toY - fromY) * ease;
      setPacket({ x: curX, y: curY, label: cfg.label, color: cfg.color });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setTimeout(() => setPacket(null), 250);
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [step, isDeauthing, pmfBlocked]);

  const staColor = clientStatus === 'disconnected' ? 'var(--danger)'
                 : clientStatus === 'reconnecting'  ? 'var(--warn)'
                 : 'var(--success)';

  const height = showAttacker ? 210 : 135;

  return (
    <div className="w-full relative overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
      <svg viewBox={`0 0 500 ${height}`} className="w-full h-auto select-none" style={{ maxHeight: height }}>
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="subtleGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="var(--border)" opacity="0.6" />
          </pattern>
        </defs>

        <rect width="500" height={height} fill="url(#subtleGrid)" />

        {/* ── Link AP <-> STA ── */}
        <line
          x1={AP_X} y1={AP_Y} x2={STA_X} y2={STA_Y}
          stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4"
        />

        {/* ── Attacker Links (When Attacker is shown) ── */}
        {showAttacker && (
          <>
            {/* Sniffing lines */}
            <line
              x1={ATK_X} y1={ATK_Y} x2={AP_X + 25} y2={AP_Y + 25}
              stroke="var(--danger)" strokeWidth="1" strokeDasharray="3 3" opacity="0.35"
            />
            <line
              x1={ATK_X} y1={ATK_Y} x2={STA_X - 25} y2={STA_Y + 25}
              stroke="var(--danger)" strokeWidth="1" strokeDasharray="3 3" opacity="0.35"
            />
          </>
        )}

        {/* ── Access Point Node (AP) ── */}
        <g transform={`translate(${AP_X}, ${AP_Y})`} className="cursor-default">
          {/* Beacon pulse */}
          <circle cx="0" cy="0" r="32" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.15" />
          <circle cx="0" cy="0" r="24" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
          {/* Real Vector Router / Wifi Icon */}
          <path
            d="M -9 -4 A 14 14 0 0 1 9 -4 M -6 0 A 9 9 0 0 1 6 0 M -2 4 A 3 3 0 0 1 2 4"
            fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
          />
          <text y="38" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
            Access Point
          </text>
          <text y="49" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="var(--text-sub)">
            Authenticator
          </text>
        </g>

        {/* ── Client Node (STA) ── */}
        <g transform={`translate(${STA_X}, ${STA_Y})`} className="cursor-default">
          <circle cx="0" cy="0" r="24" fill="var(--surface)" stroke={staColor} strokeWidth="1.5" />
          {/* Real Vector Laptop Icon */}
          <rect x="-8" y="-7" width="16" height="11" rx="1.5" fill="none" stroke={staColor} strokeWidth="1.5" />
          <path d="M -12 7 L 12 7" stroke={staColor} strokeWidth="2" strokeLinecap="round" />
          <text y="38" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
            Client (STA)
          </text>
          <text y="49" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="600" fill={staColor}>
            {clientStatus.toUpperCase()}
          </text>
        </g>

        {/* ── PMF Shield (in front of STA when active) ── */}
        {pmfBlocked && (
          <g transform={`translate(${STA_X - 45}, ${STA_Y})`} className="animate-shield-deflect">
            <circle cx="0" cy="0" r="14" fill="var(--surface)" stroke="var(--warn)" strokeWidth="1.5" />
            <path
              d="M -5 -5 L 5 -5 L 5 0 C 5 4 0 7 0 7 C 0 7 -5 4 -5 0 Z"
              fill="none" stroke="var(--warn)" strokeWidth="1.5" strokeLinejoin="round"
            />
            <text y="22" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--warn)">
              802.11w
            </text>
          </g>
        )}

        {/* ── Attacker Node (When visible) ── */}
        {showAttacker && (
          <g transform={`translate(${ATK_X}, ${ATK_Y})`} className="cursor-default">
            <circle cx="0" cy="0" r="22" fill="var(--surface)" stroke="var(--danger)" strokeWidth="1.5" />
            {/* Terminal / Hacker Icon */}
            <path
              d="M -7 -4 L -3 0 L -7 4 M 1 4 L 7 4"
              fill="none" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            />
            <text y="34" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--danger)">
              Attacker (wlan0mon)
            </text>
            <text y="44" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill="var(--text-sub)">
              Monitor Mode
            </text>
          </g>
        )}

        {/* ── Animated Packet Pill ── */}
        {packet && (
          <g transform={`translate(${packet.x}, ${packet.y})`}>
            <rect
              x="-50" y="-12" width="100" height="24" rx="12"
              fill={packet.color} opacity="0.95"
            />
            <text
              y="4" textAnchor="middle" fontSize="9.5" fill="#ffffff" fontWeight="700" fontFamily="monospace"
            >
              {packet.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
