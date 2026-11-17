// Shared UI Primitives — Clean, accessible, and theme-aware
import { Check, AlertCircle, Info, Copy } from 'lucide-react';
import { useState } from 'react';

// ── Card ──────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border p-6 transition-theme shadow-sm ${className}`}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {children}
    </div>
  );
}

// ── Section Heading ───────────────────────────────────────────────
export function SectionHeading({ icon, title, sub, badge }) {
  return (
    <div className="mb-5 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div
              className="p-1.5 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {icon}
            </div>
          )}
          <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
        </div>
        {badge}
      </div>
      {sub && (
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-sub)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────
export function Input({ label, hint, error, mono, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium tracking-wide flex justify-between" style={{ color: 'var(--text-sub)' }}>
          <span>{label}</span>
          {hint && !error && <span className="text-[11px] opacity-75 font-normal">{hint}</span>}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none
          transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
          ${mono ? 'font-mono' : ''}
          ${error ? 'border-red-500' : ''}
        `}
        style={{
          background: 'var(--surface2)',
          borderColor: error ? 'var(--danger)' : 'var(--border)',
          color: 'var(--text)',
        }}
      />
      {error && <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', disabled, className = '', ...props }) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 select-none";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm font-semibold shadow-sm",
  };

  const getStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--accent)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          background: 'var(--danger)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'warn':
        return {
          background: 'var(--warn)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        };
      case 'ghost':
        return {
          background: 'var(--surface2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        };
      case 'subtle':
        return {
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
          border: '1px solid var(--accent)',
        };
      default:
        return {
          background: 'var(--accent)',
          color: '#ffffff',
          border: '1px solid transparent',
        };
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={getStyle()}
    >
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────
export function Badge({ children, variant = 'accent', size = 'sm' }) {
  const getColors = () => {
    switch (variant) {
      case 'accent':
        return { background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' };
      case 'danger':
        return { background: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)' };
      case 'warn':
        return { background: 'var(--warn-subtle)', color: 'var(--warn)', border: '1px solid var(--warn)' };
      case 'success':
        return { background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)' };
      case 'muted':
      default:
        return { background: 'var(--surface2)', color: 'var(--text-sub)', border: '1px solid var(--border)' };
    }
  };

  const c = getColors();
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide"
      style={c}
    >
      {children}
    </span>
  );
}

// ── Hex Display Box ───────────────────────────────────────────────
export function HexBlock({ label, value, bytes, copyable = true, color = 'var(--text)' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className="rounded-lg p-3 border transition-all"
      style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-sub)' }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {bytes && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
              {bytes}B
            </span>
          )}
          {copyable && value && (
            <button
              onClick={handleCopy}
              className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded hover:opacity-100 opacity-60 transition"
              style={{ background: 'var(--bg)', color: copied ? 'var(--success)' : 'var(--text-sub)' }}
              title="Copy to clipboard"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>
      <div className="hex-value select-all font-mono" style={{ color: value ? color : 'var(--text-muted)' }}>
        {value || 'Computing / Waiting for step…'}
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
      <div
        className="h-full rounded-full transition-all duration-75"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────
export function Toggle({ checked, onChange, label, sub }) {
  return (
    <label className="flex items-start gap-3.5 cursor-pointer select-none">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <div
          className="w-10 h-5 rounded-full transition-colors duration-200"
          style={{ background: checked ? 'var(--warn)' : 'var(--border)' }}
        />
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {label}
        </div>
        {sub && <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-sub)' }}>{sub}</div>}
      </div>
    </label>
  );
}

// ── Alert Callout ─────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const styles = {
    info:    { border: 'var(--accent)', text: 'var(--accent)', bg: 'var(--accent-subtle)' },
    danger:  { border: 'var(--danger)', text: 'var(--danger)', bg: 'var(--danger-subtle)' },
    warn:    { border: 'var(--warn)',   text: 'var(--warn)',   bg: 'var(--warn-subtle)' },
    success: { border: 'var(--success)',text: 'var(--success)',bg: 'var(--success-subtle)' },
  };
  const current = styles[type] || styles.info;
  const icons = {
    info: <Info size={16} className="shrink-0 mt-0.5" />,
    danger: <AlertCircle size={16} className="shrink-0 mt-0.5" />,
    warn: <AlertCircle size={16} className="shrink-0 mt-0.5" />,
    success: <Check size={16} className="shrink-0 mt-0.5" />,
  };

  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border p-3.5 text-xs leading-relaxed"
      style={{
        borderColor: current.border,
        color: 'var(--text)',
        background: current.bg,
      }}
    >
      <span style={{ color: current.text }}>{icons[type]}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
