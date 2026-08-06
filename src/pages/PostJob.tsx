import React, { useState, useEffect } from 'react';
import { useDraft } from '../hooks/useDraft';
import { showInterstitial } from '../lib/ads';
import Spinner from '../components/Spinner';
import { t, connectsLabel } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';
import { createJob, getConfig } from '../lib/api';
import { toast } from '../components/Toast';
import { CATEGORIES } from '../lib/constants';
import { POST_JOB_COST } from '../lib/connects';
import { useAppCtx } from '../App';

export default function PostJobPage() {
  const tr = t();
  const nav = useNavigate();
  const { user, updateUser } = useAppCtx();
  const myConnects = user?.balance_connects ?? 0;
  const canAfford = myConnects >= POST_JOB_COST;
  // Survives a session drop: people spend minutes writing a description and
  // Pi Browser expires without warning.
  const [form, setForm, clearDraft] = useDraft('post_job', {
    title: '', description: '', budget: '', category: 'development',
    skills: '', deadline: '', is_urgent: false, image: '',
  });
  const [saving, setSaving] = useState(false);
  const [feePercent, setFeePercent] = useState(3);

  useEffect(() => {
    getConfig().then(c => {
      if (typeof c?.platform_fee_percent === 'number') setFeePercent(c.platform_fee_percent);
    }).catch(() => {});
  }, []);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast(tr.imageFilesOnly, 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast(tr.imageMax5mb, 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => set('image', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const budget = Number(form.budget) || 0;
  const fee = +(budget * (feePercent / 100)).toFixed(2);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast(tr.titleRequired, 'error'); return; }
    if (!form.description.trim()) { toast(tr.descRequired, 'error'); return; }
    if (!budget || budget < 1) { toast(tr.budgetMin, 'error'); return; }
    if (!canAfford) { toast(tr.notEnoughConnects, 'error'); return; }
    setSaving(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      const data = await createJob({
        title: form.title.trim(), description: form.description.trim(),
        budget, category: form.category, skills, is_urgent: form.is_urgent,
        ...(form.deadline ? { deadline: form.deadline } : {}),
        ...(form.image ? { images: [form.image] } : {}),
      });
      // Optimistically reflect the connect the server deducted.
      updateUser({ balance_connects: Math.max(0, myConnects - POST_JOB_COST) });
      clearDraft();
      toast(tr.jobPosted, 'success');
      const newId = data?.job?.id || data?.id;
      // A natural break: the job is already created and the user is between
      // tasks. Deliberately awaited but never allowed to block — if there is no
      // inventory or the ad network is missing, showInterstitial resolves
      // immediately and navigation proceeds either way.
      await showInterstitial();
      nav(newId ? `/job/${newId}` : '/');
    } catch (e: any) {
      toast(e.message || 'Failed to post job', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg mx-auto w-full p-4 pb-8 space-y-4 animate-fade-in">

        <Field label={`${tr.jobTitle} *`}>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder={tr.titlePlaceholder} maxLength={120} className="field-input" />
        </Field>

        <Field label={`${tr.description} *`}>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder={tr.jobDescPlaceholder} rows={5} className="field-input resize-none" />
        </Field>

        <Field label={tr.category}>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="field-input">
            {CATEGORIES.filter(c => c.key !== 'all').map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`${tr.budget} (π) *`}>
            <input value={form.budget} onChange={e => set('budget', e.target.value)}
              type="number" min="1" placeholder={tr.budgetPlaceholder} className="field-input" />
          </Field>
          <Field label={tr.deadline}>
            <input value={form.deadline} onChange={e => set('deadline', e.target.value)}
              type="date" className="field-input" />
          </Field>
        </div>

        <Field label={tr.skills}>
          <input value={form.skills} onChange={e => set('skills', e.target.value)}
            placeholder={tr.skillsPlaceholder} className="field-input" />
        </Field>

        {/* Attach Photo */}
        {form.image ? (
          <div className="relative rounded-2xl overflow-hidden">
            <img src={form.image} alt="" className="w-full max-h-56 object-cover" />
            <button
              type="button"
              onClick={() => set('image', '')}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-lg"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center gap-2 text-gray-400 cursor-pointer hover:border-emerald-300 transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span className="text-sm">{tr.attachPhoto}</span>
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        )}

        {/* Connects cost */}
        <div className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${canAfford ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          <span className="font-semibold">⚡ {tr.costOneConnect}</span>
          <span className="text-xs">{myConnects} {connectsLabel(myConnects)}</span>
        </div>

        {/* Summary — employer pays the budget when hiring; the platform fee is
            deducted from the freelancer's payout, not added on top. */}
        {budget > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 text-sm">
            <Row label={tr.budget} value={`${budget} π`} />
            <Row label={`${tr.platformFee} (${feePercent}%)`} value={`−${fee} π`} muted />
            <Row label={`${tr.costOneConnect}`} value={`${POST_JOB_COST}`} muted />
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span className="text-gray-900">{tr.youPay}</span>
              <span className="text-emerald-500">{budget} π</span>
            </div>
          </div>
        )}

        {/* Urgent toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            onClick={() => set('is_urgent', !form.is_urgent)}
            className={`w-12 h-6 rounded-full relative transition-colors ${form.is_urgent ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_urgent ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-gray-700">{tr.markAsUrgent}</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={saving || !canAfford}
          className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/30 disabled:opacity-60 transition-colors"
        >
          {saving ? <Spinner /> : !canAfford ? tr.notEnoughConnects : tr.postJob}
        </button>
      <style>{`
        .field-input { width:100%; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:0.75rem; padding:0.625rem 0.875rem; font-size:0.875rem; color:#1f2937; outline:none; }
        .field-input:focus { border-color:#10b981; }
        .field-input::placeholder { color:#9ca3af; }
      `}</style>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? 'text-gray-400' : 'text-gray-700'}>{label}</span>
      <span className={muted ? 'text-gray-500' : 'text-gray-900'}>{value}</span>
    </div>
  );
}
