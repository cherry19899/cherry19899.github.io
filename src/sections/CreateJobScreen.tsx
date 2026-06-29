import React, { useState, useRef } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { createJob } from '../lib/api';

interface CreateJobScreenProps {
  t: TFunction;
  onBack: () => void;
}

const CATEGORIES = [
  { key: 'development', label: 'Dev' },
  { key: 'design', label: 'Design' },
  { key: 'writing', label: 'Writing' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'translation', label: 'Translate' },
  { key: 'data', label: 'Data' },
  { key: 'va', label: 'VA' },
  { key: 'other', label: 'Other' },
];

export default function CreateJobScreen({ t, onBack }: CreateJobScreenProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('development');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('100');
  const [skills, setSkills] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        setImages(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) { alert(t('fillAllFields')); return; }
    const budgetNum = parseFloat(budget);
    if (!budgetNum || budgetNum <= 0) { alert(t('invalidBudget') || 'Budget must be > 0'); return; }

    setSubmitting(true);
    try {
      await createJob({
        title,
        category,
        description,
        budget: budgetNum,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        images,
        deadline: deadline || undefined,
      });
      // deduct connect
      const cur = parseInt(localStorage.getItem('workpro_connects') || '0');
      if (cur > 0) localStorage.setItem('workpro_connects', String(cur - 1));
      alert(t('jobPosted'));
      onBack();
    } catch (err: any) {
      alert(err.message || t('failedToPost'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base">{t('createJob')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('jobTitle')}
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="напр. Нужен React разработчик"
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('category')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  category === c.key
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('description')}
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Опишите требования к проекту..."
            rows={5}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>

        {/* Budget + Deadline */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('budget')} (π)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('deadline')}
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('skills')}
          </label>
          <input
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="React, TypeScript, Node.js..."
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Image upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('attachPhotos')}
          </label>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground"
          >
            + {t('addPhoto')}
          </button>
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} className="w-16 h-16 rounded-lg object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl font-bold bg-emerald-500 text-white text-base disabled:opacity-60"
        >
          {submitting ? t('saving') : t('postJob')}
        </button>
      </form>
    </div>
  );
}
