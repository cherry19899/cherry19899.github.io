import React from 'react';
import { TFunction } from '../hooks/useTranslation';

interface TermsScreenProps {
  t: TFunction;
  onBack: () => void;
}

export default function TermsScreen({ t, onBack }: TermsScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base">{t('terms')}</h1>
      </div>

      <div className="p-6 space-y-6 pb-8 prose prose-invert max-w-none">
        <section className="space-y-2">
          <h2 className="font-bold text-base">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing Work Pro, you agree to be bound by these Terms of Service and all applicable laws.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">2. Platform Fee</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Work Pro charges a 2% platform fee on all completed escrow transactions. This fee is deducted from the payment before release to the freelancer.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">3. Escrow Service</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Work Pro provides an escrow service backed by Pi Network blockchain. Funds are locked until the client confirms job completion. All escrow transactions are final once released.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">4. User Conduct</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Users must not post fraudulent jobs, misrepresent their identity, or engage in any activity that violates Pi Network's community standards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">5. Connects</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connects are non-refundable credits used to apply for jobs. Each application costs 1 Connect. Unused Connects do not expire.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">6. Dispute Resolution</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In case of a dispute, contact Work Pro support. Admins may freeze escrow funds pending investigation. Work Pro's decision in disputes is final.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">7. Privacy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect your Pi Network username and public profile data. We do not sell your data to third parties. Payments are processed through Pi Network's infrastructure.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">Last updated: June 2026</p>
      </div>
    </div>
  );
}
