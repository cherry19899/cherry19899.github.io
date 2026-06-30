import React, { useState } from 'react';
import { updateUser as apiUpdateUser } from '../lib/api';
import { isPiBrowser, createPiPayment } from '../lib/pi';
import { useAppAuth, useToastCtx } from '../App';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAppAuth();
  const { toast } = useToastCtx();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [buyingConnects, setBuyingConnects] = useState(false);
  const [form, setForm] = useState({
    display_name: user?.username || '',
    bio: user?.bio || '',
    skills: typeof user?.skills === 'string' ? user.skills : (user?.skills as any)?.join(', ') || '',
  });

  const connects = user?.balance_connects ?? 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      const data = await apiUpdateUser({ display_name: form.display_name, bio: form.bio, skills });
      updateUser({ bio: form.bio, skills: form.skills });
      toast('Profile updated!', 'success');
      setEditing(false);
    } catch (e: any) {
      toast(e.message || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const handleBuyConnects = (qty: number, piCost: number) => {
    if (!isPiBrowser()) { toast('Open in Pi Browser to buy Connects', 'error'); return; }
    setBuyingConnects(true);
    createPiPayment(piCost, `Buy ${qty} Connects`, { type: 'buy_connects', qty }, {
      onCompleted: (_paymentId, _txid) => {
        updateUser({ balance_connects: connects + qty });
        toast(`Added ${qty} Connects!`, 'success');
        setBuyingConnects(false);
      },
      onCancelled: () => { setBuyingConnects(false); },
      onError: (e) => { toast(e.message || 'Payment failed', 'error'); setBuyingConnects(false); },
    });
  };

  if (!user) return null;

  const initial = (user.username || '?').charAt(0).toUpperCase();

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 space-y-4 animate-fade-in">
      {/* Avatar + Name */}
      <div className="text-center py-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-emerald-500/20 mb-3">
          {initial}
        </div>
        <h2 className="text-xl font-bold text-white">{user.username}</h2>
        <p className="text-slate-400 text-sm">@{user.username}</p>
        {user.role === 'admin' && (
          <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">Admin</span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Connects', connects, 'text-emerald-400'],
          ['Jobs Done', user.total_jobs_completed ?? 0, 'text-white'],
          ['Posted', user.total_jobs_posted ?? 0, 'text-white'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-slate-800 rounded-xl border border-slate-700 p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Connects card */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-700/10 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-white">Connects Balance</p>
            <p className="text-sm text-slate-400">{connects} available</p>
          </div>
          <span className="text-3xl">⚡</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[[10, 1], [50, 4], [100, 7]].map(([qty, pi]) => (
            <button
              key={qty}
              onClick={() => handleBuyConnects(qty, pi)}
              disabled={buyingConnects}
              className="py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-60"
            >
              {qty} for {pi}π
            </button>
          ))}
        </div>
        {!isPiBrowser() && (
          <p className="text-xs text-slate-500 mt-2 text-center">Open in Pi Browser to buy Connects</p>
        )}
      </div>

      {/* Bio / Profile edit */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">About</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-emerald-400 font-semibold">Edit</button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              value={form.display_name}
              onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
              placeholder="Display name"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell about yourself…"
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500"
            />
            <input
              value={form.skills}
              onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
              placeholder="Skills (comma-separated)"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-semibold">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-300 text-sm">{user.bio || 'No bio yet. Tap Edit to add one.'}</p>
            {user.skills && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(typeof user.skills === 'string' ? user.skills.split(',') : (user.skills as any[]))
                  .map((s: string) => s.trim()).filter(Boolean)
                  .map(s => (
                    <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300">{s}</span>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); }}
        className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors"
      >
        Log Out
      </button>
    </div>
  );
}
