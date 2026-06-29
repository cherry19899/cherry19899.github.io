import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { 
  LogOut, 
  Edit3, 
  Star, 
  Briefcase, 
  Award,
  Save,
  X,
  Loader2,
  Plus
} from 'lucide-react';

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/api/me', {
        display_name: form.name,
        bio: form.bio,
        skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
      });
      setUser(data);
      localStorage.setItem('workpro_user', JSON.stringify(data));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const connects = (user as any).balance_connects ?? (user as any).connects ?? 0;

  return (
    <div className="p-4 pb-safe">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 
                        flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-emerald-500/20 mb-3">
          {(user.name || user.username)?.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white">{user.name || user.username}</h2>
        <p className="text-slate-400 text-sm">@{user.username}</p>

        {/* Stats */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-400">{connects}</p>
            <p className="text-xs text-slate-500">Connects</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{(user as any).total_jobs_completed || 0}</p>
            <p className="text-xs text-slate-500">Jobs Done</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{(user as any).total_jobs_posted || 0}</p>
            <p className="text-xs text-slate-500">Posted</p>
          </div>
        </div>
      </div>

      {/* Connects Card */}
      <div className="card mb-4 bg-gradient-to-r from-emerald-500/10 to-emerald-700/10 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Award size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Connects Balance</p>
              <p className="text-sm text-slate-400">{connects} available</p>
            </div>
          </div>
          <button className="btn-primary text-sm py-2 px-4">
            Buy More
          </button>
        </div>
      </div>

      {/* Bio */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Edit3 size={16} className="text-emerald-400" />
            About
          </h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-emerald-400">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Display name"
              className="input"
            />
            <textarea
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
              placeholder="Tell about yourself..."
              className="input h-24 resize-none"
            />
            <input
              type="text"
              value={form.skills}
              onChange={e => setForm({...form, skills: e.target.value})}
              placeholder="Skills (comma separated)"
              className="input"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <X size={16} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-slate-300 text-sm">{user.bio || 'No bio yet'}</p>
            {user.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {user.skills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={logout} className="w-full btn-danger flex items-center justify-center gap-2">
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  );
}
