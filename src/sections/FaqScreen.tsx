import React, { useState } from 'react';
import { TFunction } from '../hooks/useTranslation';

interface FaqScreenProps {
  t: TFunction;
  onBack: () => void;
}

const FAQ_ITEMS = [
  {
    q: 'What is Work Pro?',
    a: 'Work Pro is a freelance marketplace built on the Pi Network. You can find work, hire freelancers, and make payments using Pi cryptocurrency.',
  },
  {
    q: 'What are Connects?',
    a: 'Connects are credits used to apply for jobs. Each application costs 1 Connect. You can buy Connect packages with Pi.',
  },
  {
    q: 'How does Escrow work?',
    a: 'When a client hires a freelancer, Pi is locked in escrow. The funds are released only when the client marks the job as complete.',
  },
  {
    q: 'How do I get paid?',
    a: 'When your client releases the escrow, Pi is transferred to your wallet minus a 2% platform fee.',
  },
  {
    q: 'What is KYC?',
    a: 'KYC (Know Your Customer) is Pi Network\'s identity verification. Verified users get a KYC badge on their profile.',
  },
  {
    q: 'How do I apply for a job?',
    a: 'Open a job listing, tap "Apply Now", write your cover letter and proposed budget, then submit. This costs 1 Connect.',
  },
  {
    q: 'Can I post a job for free?',
    a: 'Yes! Posting jobs is free. You only pay when you hire a freelancer via escrow.',
  },
];

export default function FaqScreen({ t, onBack }: FaqScreenProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base">{t('faq')}</h1>
      </div>

      <div className="p-4 space-y-2 pb-8">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="rounded-xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-4 py-4 flex items-center justify-between gap-2"
            >
              <span className="font-medium text-sm">{item.q}</span>
              <svg
                className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
