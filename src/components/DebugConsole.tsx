import React, { useEffect, useRef, useState } from 'react';

// TEMPORARY debug console — remove after diagnosing the language-picker issue.
// Captures console.log/warn/error, window errors, and manual __dbg() calls,
// and shows them in a collapsible on-screen overlay (works in Pi Browser where
// there is no devtools console).

type Line = { t: number; kind: string; msg: string };

export default function DebugConsole() {
  const [open, setOpen] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const buf = useRef<Line[]>([]);

  useEffect(() => {
    const push = (kind: string, args: any[]) => {
      const msg = args
        .map(a => {
          try { return typeof a === 'string' ? a : JSON.stringify(a); }
          catch { return String(a); }
        })
        .join(' ');
      buf.current = [...buf.current.slice(-80), { t: Date.now(), kind, msg }];
      setLines(buf.current);
    };

    const orig = {
      log: console.log, warn: console.warn, error: console.error,
    };
    console.log = (...a: any[]) => { push('log', a); orig.log(...a); };
    console.warn = (...a: any[]) => { push('warn', a); orig.warn(...a); };
    console.error = (...a: any[]) => { push('error', a); orig.error(...a); };

    const onErr = (e: ErrorEvent) => push('window.onerror', [e.message, e.filename + ':' + e.lineno]);
    const onRej = (e: PromiseRejectionEvent) => push('unhandledrejection', [String(e.reason)]);
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);

    (window as any).__dbg = (...a: any[]) => push('dbg', a);
    push('dbg', ['debug console ready']);

    return () => {
      console.log = orig.log; console.warn = orig.warn; console.error = orig.error;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999, pointerEvents: 'none', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 4 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ pointerEvents: 'auto', background: '#111', color: '#0f0', border: '1px solid #0f0', borderRadius: 6, fontSize: 11, padding: '2px 8px' }}
        >
          {open ? 'DBG ▲' : `DBG ▼ (${lines.length})`}
        </button>
      </div>
      {open && (
        <div style={{ pointerEvents: 'auto', margin: '0 4px', maxHeight: '32vh', overflowY: 'auto', background: 'rgba(0,0,0,0.9)', color: '#0f0', fontSize: 10, lineHeight: 1.3, padding: 6, borderRadius: 6, border: '1px solid #0a0' }}>
          {lines.length === 0 && <div>(no logs yet — tap something)</div>}
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.kind === 'error' || l.kind.includes('error') || l.kind === 'unhandledrejection' ? '#f66' : l.kind === 'warn' ? '#fd6' : '#6f6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              [{l.kind}] {l.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
