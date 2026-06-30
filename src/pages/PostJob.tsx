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
    skills: '', is_urgent: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    if (!form.description.trim()) { toast('Description is required', 'error'); return; }
    const budget = Number(form.budget);
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
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-lg text-white">Post a Job</h1>
      </div>

      <div className="space-y-4">
        <Field label="Job title *">
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
        </div>

        <Field label="Skills (comma-separated)">
          <input
            value={form.skills}
            onChange={e => set('skills', e.target.value)}
            placeholder="e.g. React, TypeScript, Node.js"
            className="input-base"
          />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => set('is_urgent', !form.is_urgent)}
            className={`w-11 h-6 rounded-full relative transition-colors ${form.is_urgent ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.is_urgent ? 'left-[22px]' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-white">Mark as urgent</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base transition-colors disabled:opacity-60"
        >
          {saving ? 'Posting…' : 'Post Job'}
        </button>
      </div>

      <style>{`.input-base { width: 100%; background: rgb(30 41 59); border: 1px solid rgb(51 65 85); border-radius: 0.75rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; color: white; } .input-base:focus { outline: none; border-color: #10b981; } .input-base::placeholder { color: rgb(100 116 139); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
