import { useState, useEffect } from 'react';
import { currentLang, t } from '../lib/i18n';
import { getConfig } from '../lib/api';
import { faqFor } from '../lib/faq';




export default function FAQPage() {
  const tr = t();
  const [open, setOpen] = useState<number | null>(0);
  const [feePercent, setFeePercent] = useState(3);

  useEffect(() => {
    getConfig().then(c => {
      if (typeof c?.platform_fee_percent === 'number') setFeePercent(c.platform_fee_percent);
    }).catch(() => {});
  }, []);

  const net = +(10 * (1 - feePercent / 100)).toFixed(2);
  const items = faqFor(currentLang()).map(item => ({
    q: item.q,
    a: item.a.replace('{fee}', String(feePercent)).replace('{net}', String(net)),
  }));

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {tr.faq}
      </h1>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{item.q}</span>
              <svg
                viewBox="0 0 24 24"
                className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {open === i && (
              <p className="px-4 pb-4 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
