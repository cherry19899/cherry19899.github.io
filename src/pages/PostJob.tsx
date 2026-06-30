import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../lib/api';
import { toast } from '../components/Toast';
import { CATEGORIES } from '../lib/constants';

export default function PostJobPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', budget: '', category: 'development',
    skills: '', deadline: '', is_urgent: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const budget = Number(form.budget) || 0;
  const fee = +(budget * 0.02).toFixed(2);
  const total = +(budget + fee).toFixed(2);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    if (!form.description.trim()) { toast('Description is required', 'error'); return; }
    if (!budget || budget < 1) { toast('Budget ≥ 1 Pi', 'error'); return; }
    setSaving(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      const data = await createJob({
        title: form.title.trim(), description: form.description.trim(),
        budget, category: form.category, skills, is_urgent: form.is_urgent,
      });
      toast('Job posted!', 'success');
      nav(data?.id ? `/job/${data.id}` : '/');
    } catch (e: any) {
      toast(e.message || 'Failed to post job', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg mx-auto w-full p-4 pb-8 space-y-4 animate-fade-in">

        <Field label="Job Title *">
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Build a Pi Network dApp" maxLength={120} className="field-input" />
        </Field>

        <Field label="Description *">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe what needs to be done…" rows={5} className="field-input resize-none" />
        </Field>

        <Field label="Category">
          <select value={form.category} onChange={e => set('category', e.target.value)} className="field-input">
            {CATEGORIES.filter(c => c.key !== 'all').map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget (π) *">
            <input value={form.budget} onChange={e => set('budget', e.target.value)}
              type="number" min="1" placeholder="e.g. 50" className="field-input" />
          </Field>
          <Field label="Deadline">
            <input value={form.deadline} onChange={e => set('deadline', e.target.value)}
              type="date" className="field-input" />
          </Field>
        </div>

        <Field label="Skills (comma-separated)">
          <input value={form.skills} onChange={e => set('skills', e.target.value)}
            placeholder="e.g. React, Node.js" className="field-input" />
        </Field>

        {/* Attach Photos */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center gap-2 text-gray-400 cursor-pointer hover:border-emerald-300 transition-colors">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="text-sm">Attach Photos · Add</span>
        </div>

        {/* Summary */}
        {budget > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 text-sm">
            <Row label="Budget" value={`${budget} π`} />
            <Row label={`Platform fee (2%)`} value={`${fee} π`} muted />
            <Row label="Стоимость отклика" value="1 connect" muted />
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-emerald-500">{total} π</span>
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
          <span className="text-sm text-gray-700">Mark as urgent</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/30 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Posting…' : 'Post a Job'}
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
