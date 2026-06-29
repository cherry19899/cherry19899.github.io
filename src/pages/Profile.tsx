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
      const { data } = await api.post(`/api/users/${user?.id}`, {
        name: form.name,
        bio: form.bio,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setUser(data);
      localStorage.setItem('workpro_user', JSON.stringify(data));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

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
            <p className="text-xl font-bold text-emerald-400">{user.connects}</p>
            <p className="text-xs text-slate-500">Connects</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">0</p>
            <p className="text-xs text-slate-500">Jobs Done</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">0</p>
            <p className="text-xs text-slate-500">Reviews</p>
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
              <p className="text-sm text-slate-400">{user.connects} available</p>
            </div>
          </div>
          <button className="btn-primary text-sm py-2 px-4">
            Buy More
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing ? (
        <div className="card space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Edit Profile</h3>
            <button onClick={() => setEditing(false)} className="p-1 rounded-lg bg-slate-700 text-slate-400">
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="label">Display Name</label>
            <input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="input"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
              className="input h-24 resize-none"
              placeholder="Tell clients about yourself..."
            />
          </div>

          <div>
            <label className="label">Skills (comma separated)</label>
            <input
              value={form.skills}
              onChange={e => setForm({...form, skills: e.target.value})}
              className="input"
              placeholder="React, Node.js, Design..."
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">About</h3>
            <button 
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg bg-slate-700 text-emerald-400"
            >
              <Edit3 size={16} />
            </button>
          </div>

          {user.bio ? (
            <p className="text-slate-300 text-sm">{user.bio}</p>
          ) : (
            <p className="text-slate-500 text-sm italic">No bio yet</p>
          )}

          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Portfolio Placeholder */}
      <div className="card mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Portfolio</h3>
          <button className="p-2 rounded-lg bg-slate-700 text-emerald-400">
            <Plus size={16} />
          </button>
        </div>
        <p className="text-slate-500 text-sm text-center py-4">No projects yet</p>
      </div>

      {/* Reviews Placeholder */}
      <div className="card mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Reviews</h3>
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={14} fill="currentColor" />
            <span className="text-sm font-medium">0.0</span>
          </div>
        </div>
        <p className="text-slate-500 text-sm text-center py-4">No reviews yet</p>
      </div>

      {/* Logout */}
      <button 
        onClick={logout}
        className="w-full mt-6 btn-danger flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  );
}
