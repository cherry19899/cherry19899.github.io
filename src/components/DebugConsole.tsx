import { useState, useEffect, useRef } from 'react';

// TEMPORARY on-screen console for Pi Browser debugging (no chrome://inspect there).
// Remove after verifying.
type Line = { t: string; msg: string };

export default function DebugConsole() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const push = (t: string, args: any[]) => {
      const msg = args.map(a => {
        try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
      }).join(' ');
      setLines(l => [...l.slice(-200), { t, msg }]);
    };
    // Replay anything logged before this component mounted — main.tsx's
    // inset-detection runs first and has nowhere else to put its result.
    const early = (window as any).__earlyLogs as [string, any[]][] | undefined;
    if (early) { early.forEach(([t, a]) => push(t, a)); delete (window as any).__earlyLogs; }
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = (...a: any[]) => { push('log', a); orig.log(...a); };
    console.warn = (...a: any[]) => { push('warn', a); orig.warn(...a); };
    console.error = (...a: any[]) => { push('error', a); orig.error(...a); };
    const onErr = (e: ErrorEvent) => push('error', ['window.onerror:', e.message]);
    const onRej = (e: PromiseRejectionEvent) => push('error', ['unhandledrejection:', String(e.reason)]);
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    (window as any).__dbg = (...a: any[]) => push('log', a);
    return () => {
      console.log = orig.log; console.warn = orig.warn; console.error = orig.error;
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [lines]);

  const color = (t: string) => t === 'error' ? '#f87171' : t === 'warn' ? '#fbbf24' : '#a7f3d0';

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 2147483647, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', padding: 6 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ pointerEvents: 'auto', background: '#111', color: '#a7f3d0', border: '1px solid #333', borderRadius: 8, fontSize: 12, padding: '4px 10px', fontFamily: 'monospace' }}
        >
          {open ? '▼ console' : `▲ console (${lines.length})`}
        </button>
        {open && (
          <button
            onClick={() => setLines([])}
            style={{ pointerEvents: 'auto', marginLeft: 6, background: '#111', color: '#f87171', border: '1px solid #333', borderRadius: 8, fontSize: 12, padding: '4px 10px', fontFamily: 'monospace' }}
          >clear</button>
        )}
      </div>
      {open && (
        <div ref={box} style={{ pointerEvents: 'auto', maxHeight: '40vh', overflowY: 'auto', background: 'rgba(0,0,0,0.92)', color: '#eee', fontFamily: 'monospace', fontSize: 11, padding: 8, lineHeight: 1.4 }}>
          {lines.length === 0 ? <div style={{ opacity: 0.5 }}>— no logs —</div> :
            lines.map((l, i) => <div key={i} style={{ color: color(l.t), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>[{l.t}] {l.msg}</div>)}
        </div>
      )}
    </div>
  );
}
