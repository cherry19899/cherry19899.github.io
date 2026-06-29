import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateJob } from '../hooks/useJobs';
import { ArrowLeft, Plus, X, Loader2, ImagePlus } from 'lucide-react';

const categories = ['Development', 'Design', 'Writing', 'Marketing', 'Other'];

export default function CreateJob() {
  const navigate = useNavigate();
  const createMutation = useCreateJob();
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    category: 'Development',
    location: '',
    deadline: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.budget) return;

    await createMutation.mutateAsync({
      ...form,
      budget: Number(form.budget),
      images: images.length > 0 ? images : undefined,
    });

    navigate('/my-jobs');
  };

  const addImage = () => {
    if (imageUrl.trim() && images.length < 5) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-slate-800 text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white">Post a Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="label">Job Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            placeholder="e.g. Build a React Website"
            className="input"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="label">Category *</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({...form, category: cat})}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  form.category === cat
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description *</label>
          <textarea
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            placeholder="Describe the project requirements, skills needed, deliverables..."
            className="input h-40 resize-none"
            required
          />
        </div>

        {/* Budget */}
        <div>
          <label className="label">Budget (Pi) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">π</span>
            <input
              type="number"
              value={form.budget}
              onChange={e => setForm({...form, budget: e.target.value})}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="input pl-8"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label">Location (optional)</label>
          <input
            type="text"
            value={form.location}
            onChange={e => setForm({...form, location: e.target.value})}
            placeholder="e.g. Remote, Warsaw, etc."
            className="input"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="label">Deadline (optional)</label>
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm({...form, deadline: e.target.value})}
            className="input"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Images */}
        <div>
          <label className="label">Images (optional, max 5)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Paste image URL..."
              className="input flex-1"
            />
            <button
              type="button"
              onClick={addImage}
              disabled={!imageUrl.trim() || images.length >= 5}
              className="btn-primary px-3"
            >
              <Plus size={18} />
            </button>
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="w-20 h-20 rounded-xl object-cover bg-slate-700" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
        >
          {createMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <ImagePlus size={20} />
          )}
          Post Job
        </button>
      </form>
    </div>
  );
}
