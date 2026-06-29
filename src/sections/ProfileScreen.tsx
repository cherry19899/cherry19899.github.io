import React, { useState, useEffect, useRef } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getReviewStats, updateUser } from '../lib/api';
import StarRating from '../components/StarRating';
import BuyConnectsModal from '../components/BuyConnectsModal';

interface User {
  uid: string;
  username: string;
  role?: string;
  bio?: string;
  skills?: string;
  avatar?: string;
  kyc?: boolean;
}

interface ProfileScreenProps {
  t: TFunction;
  user: User;
  theme: string;
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenFaq: () => void;
  onOpenTerms: () => void;
  onOpenPortfolio: () => void;
  onOpenApplications: () => void;
  onLoginAdmin?: () => void;
  onNavigate?: (tab: string) => void;
  onUserUpdate?: (user: User) => void;
}

export default function ProfileScreen({
  t, user, theme, onToggleTheme, onLogout, onOpenFaq, onOpenTerms,
  onOpenPortfolio, onOpenApplications, onUserUpdate,
}: ProfileScreenProps) {
  const [reviewStats, setReviewStats] = useState({ total: 0, avg: 0 });
  const [showBuyConnects, setShowBuyConnects] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [saving, setSaving] = useState(false);
  const [connects, setConnects] = useState(() =>
    parseInt(localStorage.getItem('workpro_connects') || '0')
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.uid) {
      getReviewStats(user.uid).then(d => setReviewStats(d || { total: 0, avg: 0 })).catch(() => {});
    }
    const handleStorage = () => {
      setConnects(parseInt(localStorage.getItem('workpro_connects') || '0'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user?.uid]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      setAvatarPreview(base64);
      updateUser({ avatar: base64 }).then(d => {
        if (d?.user) {
          const merged = { ...user, avatar: base64 };
          localStorage.setItem('workpro_user', JSON.stringify(merged));
          onUserUpdate?.(merged);
        }
      }).catch(() => {});
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const d = await updateUser({ bio, skills });
      const merged = { ...user, bio, skills, ...(d?.user || {}) };
      localStorage.setItem('workpro_user', JSON.stringify(merged));
      onUserUpdate?.(merged);
      setEditMode(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in px-4 pt-2 pb-20 space-y-3 overflow-y-auto">
      {/* Profile card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 p-4 space-y-3">
        {/* Avatar */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-full overflow-hidden bg-emerald-500/30 flex items-center justify-center text-2xl font-black relative group"
            >
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <span>{(user?.username || '?')[0].toUpperCase()}</span>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                📷
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">@{user?.username}</span>
              {user?.kyc && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">KYC ✓</span>
              )}
              {reviewStats.total > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                  {t('risingTalent')}
                </span>
              )}
            </div>
            {reviewStats.total > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <StarRating value={reviewStats.avg} size={12} />
                <span className="text-xs text-muted-foreground">({reviewStats.total})</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setEditMode(e => !e)}
            className="text-xs text-emerald-500 font-semibold"
          >
            {editMode ? t('cancel') : t('edit')}
          </button>
        </div>

        {/* Bio */}
        {editMode ? (
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder={t('bioPlaceholder')}
            rows={3}
            className="w-full rounded-xl bg-card border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {bio || t('noBio')}
          </p>
        )}

        {/* Skills */}
        {editMode ? (
          <input
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder={t('skillsPlaceholder')}
            className="w-full rounded-xl bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        ) : skills ? (
          <div className="flex flex-wrap gap-1.5">
            {skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                {s}
              </span>
            ))}
          </div>
        ) : null}

        {editMode && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-60"
          >
            {saving ? t('saving') : t('saveProfile')}
          </button>
        )}
      </div>

      {/* Connects card */}
      <div
        className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setShowBuyConnects(true)}
      >
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Connects</p>
          <p className="text-2xl font-black mt-0.5">{connects}</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-bold">
          {t('buyConnects')}
        </button>
      </div>

      {/* Menu items */}
      {[
        { icon: '🗂', label: t('portfolio'), action: onOpenPortfolio },
        { icon: '📋', label: t('myApplications'), action: onOpenApplications },
        { icon: '❓', label: t('faq'), action: onOpenFaq },
        { icon: '📄', label: t('terms'), action: onOpenTerms },
      ].map(({ icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border text-left"
        >
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
          <svg className="ml-auto w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      ))}

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border text-left"
      >
        <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
        <span className="text-sm font-medium">{theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
        <div className="ml-auto w-10 h-6 rounded-full bg-emerald-500 relative">
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-0.5' : 'left-4'}`} />
        </div>
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full p-4 rounded-2xl bg-card border border-destructive/30 text-destructive text-sm font-semibold text-left flex items-center gap-4"
      >
        <span className="text-xl">🚪</span>
        {t('logout')}
      </button>

      {showBuyConnects && (
        <BuyConnectsModal
          t={t}
          onClose={() => setShowBuyConnects(false)}
          onSuccess={qty => {
            setConnects(c => c + qty);
          }}
        />
      )}
    </div>
  );
}
