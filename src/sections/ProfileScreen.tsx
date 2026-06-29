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
  balance_pi?: number;
  available?: boolean;
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
  onOpenOffers: () => void;
  onOpenAdmin?: () => void;
  onNavigate?: (tab: string) => void;
  onUserUpdate?: (user: User) => void;
}

export default function ProfileScreen({
  t, user, theme, onToggleTheme, onLogout, onOpenFaq, onOpenTerms,
  onOpenPortfolio, onOpenApplications, onOpenOffers, onOpenAdmin, onUserUpdate,
}: ProfileScreenProps) {
  const [reviewStats, setReviewStats] = useState({ total: 0, avg: 0 });
  const [showBuyConnects, setShowBuyConnects] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(user?.available !== false);
  const [connects, setConnects] = useState(() =>
    parseInt(localStorage.getItem('workpro_connects') || '0')
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';
  const balance = (user?.balance_pi ?? 0).toFixed(2);

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
      updateUser({ avatar: base64 }).then(() => {
        const merged = { ...user, avatar: base64 };
        localStorage.setItem('workpro_user', JSON.stringify(merged));
        onUserUpdate?.(merged);
      }).catch(() => {});
    };
    reader.readAsDataURL(file);
  };

  const toggleAvailable = () => {
    const next = !available;
    setAvailable(next);
    const merged = { ...user, available: next };
    localStorage.setItem('workpro_user', JSON.stringify(merged));
    onUserUpdate?.(merged);
    updateUser({ available: next }).catch(() => {});
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
    <div className="animate-fade-in px-4 pt-3 pb-24 space-y-3 overflow-y-auto max-w-lg mx-auto">
      {/* Profile gradient card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full overflow-hidden bg-emerald-500/30 flex items-center justify-center text-3xl font-black relative group"
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-black text-xl truncate">{user?.username}</h2>
              {reviewStats.total > 0 ? (
                <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-semibold flex items-center gap-1">
                  ★ {t('risingTalent')}
                </span>
              ) : user?.kyc ? (
                <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-semibold">KYC ✓</span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              {isAdmin && <span className="font-semibold text-foreground">{t('admin')}</span>}
              {isAdmin && <span>·</span>}
              <span className={`inline-block w-2 h-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {available ? t('available') : t('busy')}
            </p>
            {reviewStats.total > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <StarRating value={reviewStats.avg} size={13} />
                <span className="text-xs text-muted-foreground">({reviewStats.total})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-stat cards row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border border-border p-3 text-center flex flex-col items-center">
          <p className="text-2xl font-black text-emerald-500">{connects}</p>
          <p className="text-xs text-muted-foreground">{t('connects')}</p>
          <button
            onClick={() => setShowBuyConnects(true)}
            className="mt-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold"
          >
            {t('buy')}
          </button>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3 text-center flex flex-col justify-center">
          <p className="text-2xl font-black text-emerald-500">{balance} π</p>
          <p className="text-xs text-muted-foreground">{t('balance')}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3 text-center flex flex-col justify-center">
          <p className="text-2xl font-black">{reviewStats.total || '—'}</p>
          <p className="text-xs text-muted-foreground">{reviewStats.total} {t('reviews')}</p>
        </div>
      </div>

      {/* О себе (bio) card */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">{t('about')}</h3>
          <button
            onClick={() => setEditMode(e => !e)}
            className="text-xs px-3 py-1 rounded-lg border border-emerald-500/40 text-emerald-500 font-semibold"
          >
            {editMode ? t('cancel') : t('edit')}
          </button>
        </div>

        {editMode ? (
          <>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder={t('bioPlaceholder')}
              rows={3}
              className="w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <input
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder={t('skillsPlaceholder')}
              className="w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-60"
            >
              {saving ? t('saving') : t('saveProfile')}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{bio || t('noBio')}</p>
            {skills && (
              <div className="flex flex-wrap gap-1.5">
                {skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Settings list */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        {/* Availability toggle */}
        <Row icon="🕐" label={t('availability')}>
          <button
            onClick={toggleAvailable}
            className={`w-11 h-6 rounded-full relative transition-colors ${available ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${available ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </Row>

        {/* Direct offers */}
        <RowButton icon="✈️" label={t('directOffers')} onClick={onOpenOffers}>
          <span className="text-emerald-500 text-sm font-medium">{t('view')} →</span>
        </RowButton>

        {/* Theme */}
        <Row icon={theme === 'dark' ? '🌙' : '☀️'} label={theme === 'dark' ? t('darkMode') : t('lightMode')}>
          <button
            onClick={onToggleTheme}
            className={`w-11 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-0.5' : 'left-[22px]'}`} />
          </button>
        </Row>

        {/* Language (changed in header) */}
        <Row icon="🌐" label={t('language')}>
          <span className="text-xs text-muted-foreground">{t('changeInHeader')}</span>
        </Row>

        {/* Portfolio */}
        <RowButton icon="🗂" label={t('portfolio')} onClick={onOpenPortfolio} chevron />

        {/* My applications */}
        <RowButton icon="📋" label={t('myApplications')} onClick={onOpenApplications} chevron />

        {/* Admin (only admins) */}
        {isAdmin && onOpenAdmin && (
          <RowButton icon="⭐" label={t('admin')} onClick={onOpenAdmin} chevron />
        )}

        {/* FAQ */}
        <RowButton icon="❓" label={t('faq')} onClick={onOpenFaq} chevron />

        {/* Terms */}
        <RowButton icon="📄" label={t('terms')} onClick={onOpenTerms} chevron />
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full p-4 rounded-2xl bg-card border border-destructive/30 text-destructive text-sm font-semibold flex items-center gap-4"
      >
        <span className="text-xl">🚪</span>
        {t('logout')}
      </button>

      {showBuyConnects && (
        <BuyConnectsModal
          t={t}
          onClose={() => setShowBuyConnects(false)}
          onSuccess={qty => setConnects(c => c + qty)}
        />
      )}
    </div>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 p-4">
      <span className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-lg shrink-0">{icon}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      {children}
    </div>
  );
}

function RowButton({ icon, label, onClick, chevron, children }: {
  icon: string; label: string; onClick: () => void; chevron?: boolean; children?: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 text-left active:bg-muted/50 transition-colors">
      <span className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-lg shrink-0">{icon}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      {children}
      {chevron && (
        <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
}
