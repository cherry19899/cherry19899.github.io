import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../lib/api';
import { useToastCtx } from '../App';
import { CATEGORIES } from '../lib/constants';

export default function PostJobPage() {
  const nav = useNavigate();
  const { toast } = useToastCtx();
  const [form, setForm] = useState({
    title: '', description: '', budget: '', category: 'development',
    skills: '', deadline: '', is_urgent: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const budget = Number(form.budget) || 0;
  const platformFee = budget * 0.02;
  const total = budget + platformFee;

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    if (!form.description.trim()) { toast('Description is required', 'error'); return; }
    if (!budget || budget < 1) { toast('Budget must be at least 1 Pi', 'error'); return; }
    if (budget > 10000) { toast('Budget cannot exceed 10,000 Pi', 'error'); return; }
    setSaving(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      const data = await createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        budget,
        category: form.category,
        skills,
        is_urgent: form.is_urgent,
      });
      toast('Job posted!', 'success');
      nav(data?.id ? `/job/${data.id}` : '/');
    } catch (e: any) {
      toast(e.message || 'Failed to post job', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-lg text-gray-900">Post a Job</h1>
      </div>

      <div className="space-y-4">
        <Field label="Job Title *">
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Build a Pi Network dApp"
            maxLength={120}
            className="input-base"
          />
        </Field>

        <Field label="Description *">
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe what needs to be done, requirements, timeline…"
            rows={5}
            className="input-base resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget (Pi) *">
            <input
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
              type="number"
              min="1"
              max="10000"
              placeholder="e.g. 50"
              className="input-base"
            />
          </Field>

          <Field label="Deadline">
            <input
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              type="date"
              className="input-base"
            />
          </Field>
        </div>

        <Field label="Category">
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="input-base"
          >
            {CATEGORIES.filter(c => c.key !== 'all').map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Skills (comma-separated)">
          <input
            value={form.skills}
            onChange={e => set('skills', e.target.value)}
            placeholder="e.g. React, TypeScript, Node.js"
            className="input-base"
          />
        </Field>

        {/* Attach Photos */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center gap-2 text-gray-400">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="text-sm">Attach Photos — Add</span>
        </div>

        {/* Summary card */}
        {budget > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Budget</span>
              <span>{budget} π</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Platform fee (2%)</span>
              <span>{platformFee.toFixed(2)} π</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Стоимость отклика</span>
              <span>1 connect</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-emerald-500">{total.toFixed(2)} π</span>
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => set('is_urgent', !form.is_urgent)}
            className={`w-12 h-6 rounded-full relative transition-colors ${form.is_urgent ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${form.is_urgent ? 'left-[22px]' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-gray-700">Mark as urgent</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base transition-colors disabled:opacity-60 shadow-lg shadow-emerald-500/30"
        >
          {saving ? 'Posting…' : 'Post a Job'}
        </button>
      </div>
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
