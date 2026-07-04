import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { currentLang } from '../lib/i18n';
import { getStoredUser } from '../lib/api';
import {
  getPortfolio, savePortfolio, addPortfolioItem, deletePortfolioItem,
} from '../lib/api';
import { toast } from '../components/Toast';

interface PortfolioHeader {
  headline?: string; summary?: string; experience_years?: number;
  website?: string; github?: string; linkedin?: string;
}
interface PortfolioItem {
  id: number; title: string; description?: string; image_url?: string;
  category?: string; tags?: string; created_at: string;
}

export default function PortfolioPage() {
  const ru = currentLang() === 'ru';
  const { id } = useParams();
  const me = getStoredUser();
  const userId = id || me?.uid || '';
  const isOwner = !id || id === me?.uid;

  const [owner, setOwner] = useState<any>(null);
  const [header, setHeader] = useState<PortfolioHeader>({});
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editHeader, setEditHeader] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hForm, setHForm] = useState<PortfolioHeader>({});
  const [iForm, setIForm] = useState({ title: '', description: '', image_url: '', tags: '' });

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    getPortfolio(userId)
      .then((d: any) => {
        setOwner(d.owner || null);
        setHeader(d.portfolio || {});
        setItems(d.items || []);
      })
      .catch((e: any) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const saveHeader = async () => {
    setSaving(true);
    try {
      await savePortfolio(hForm);
      toast(ru ? 'Портфолио сохранено ✅' : 'Portfolio saved ✅', 'success');
      setEditHeader(false);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const addItem = async () => {
    if (!iForm.title.trim()) { toast(ru ? 'Укажите название' : 'Title required', 'error'); return; }
    setSaving(true);
    try {
      await addPortfolioItem(iForm);
      toast(ru ? 'Работа добавлена ✅' : 'Item added ✅', 'success');
      setIForm({ title: '', description: '', image_url: '', tags: '' });
      setShowAdd(false);
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const removeItem = async (itemId: number) => {
    try {
      await deletePortfolioItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast(ru ? 'Удалено' : 'Deleted', 'info');
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400';

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen space-y-4">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              🖼 {ru ? 'Портфолио' : 'Portfolio'}{owner ? ` — @${owner.username}` : ''}
            </h1>
            {header.headline
              ? <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{header.headline}</p>
              : isOwner && <p className="text-xs text-gray-400 mt-1">{ru ? 'Добавьте заголовок — его видят заказчики' : 'Add a headline — clients see it'}</p>}
          </div>
          {isOwner && (
            <button
              onClick={() => { setHForm(header); setEditHeader(!editHeader); }}
              className="text-xs font-semibold text-emerald-500 shrink-0 py-1 px-2"
            >
              {editHeader ? (ru ? 'Отмена' : 'Cancel') : '✏️ ' + (ru ? 'Изменить' : 'Edit')}
            </button>
          )}
        </div>
        {header.summary && !editHeader && (
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{header.summary}</p>
        )}
        {!editHeader && (header.experience_years || header.website || header.github) ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {!!header.experience_years && (
              <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                💼 {header.experience_years} {ru ? 'лет опыта' : 'yrs exp'}
              </span>
            )}
            {header.website && <a href={header.website} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-500 px-2.5 py-1 rounded-full">🌐 {ru ? 'Сайт' : 'Website'}</a>}
            {header.github && <a href={header.github} target="_blank" rel="noreferrer" className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-full">GitHub</a>}
          </div>
        ) : null}

        {editHeader && (
          <div className="space-y-2 pt-2">
            <input className={inputCls} placeholder={ru ? 'Заголовок (например: Веб-разработчик)' : 'Headline (e.g. Web developer)'}
              value={hForm.headline || ''} onChange={e => setHForm({ ...hForm, headline: e.target.value })} maxLength={200} />
            <textarea className={inputCls} rows={3} placeholder={ru ? 'О себе и своих навыках' : 'About you and your skills'}
              value={hForm.summary || ''} onChange={e => setHForm({ ...hForm, summary: e.target.value })} maxLength={2000} />
            <input className={inputCls} type="number" min={0} max={80} placeholder={ru ? 'Лет опыта' : 'Years of experience'}
              value={hForm.experience_years || ''} onChange={e => setHForm({ ...hForm, experience_years: parseInt(e.target.value) || 0 })} />
            <input className={inputCls} placeholder={ru ? 'Сайт (https://…)' : 'Website (https://…)'}
              value={hForm.website || ''} onChange={e => setHForm({ ...hForm, website: e.target.value })} />
            <input className={inputCls} placeholder="GitHub (https://github.com/…)"
              value={hForm.github || ''} onChange={e => setHForm({ ...hForm, github: e.target.value })} />
            <button onClick={saveHeader} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-60">
              {saving ? '⏳' : (ru ? 'Сохранить' : 'Save')}
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm">
          {ru ? 'Работы' : 'Work'} ({items.length})
        </h2>
        {isOwner && (
          <button onClick={() => setShowAdd(!showAdd)} className="text-xs font-bold text-emerald-500 py-1 px-2">
            {showAdd ? (ru ? 'Отмена' : 'Cancel') : '+ ' + (ru ? 'Добавить работу' : 'Add work')}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm p-4 space-y-2">
          <input className={inputCls} placeholder={ru ? 'Название работы *' : 'Work title *'}
            value={iForm.title} onChange={e => setIForm({ ...iForm, title: e.target.value })} maxLength={500} />
          <textarea className={inputCls} rows={3} placeholder={ru ? 'Описание: что сделали, какой результат' : 'Description: what you did, the result'}
            value={iForm.description} onChange={e => setIForm({ ...iForm, description: e.target.value })} maxLength={3000} />
          <input className={inputCls} placeholder={ru ? 'Ссылка на картинку или проект (https://…)' : 'Image or project link (https://…)'}
            value={iForm.image_url} onChange={e => setIForm({ ...iForm, image_url: e.target.value })} />
          <input className={inputCls} placeholder={ru ? 'Теги через запятую (дизайн, лого)' : 'Tags, comma-separated'}
            value={iForm.tags} onChange={e => setIForm({ ...iForm, tags: e.target.value })} />
          <button onClick={addItem} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-60">
            {saving ? '⏳' : (ru ? 'Добавить' : 'Add')}
          </button>
        </div>
      )}

      {items.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-5xl mb-3">🖼</span>
          <p className="font-semibold text-gray-900 dark:text-white">
            {ru ? 'Пока нет работ' : 'No work items yet'}
          </p>
          {isOwner && (
            <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
              {ru ? 'Добавьте лучшие проекты — заказчики видят портфолио при выборе исполнителя' : 'Add your best projects — clients see your portfolio when hiring'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              {item.image_url && /^https?:\/\//.test(item.image_url) && (
                <img src={item.image_url} alt="" className="w-full max-h-44 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white leading-snug flex-1">{item.title}</h3>
                  {isOwner && (
                    <button onClick={() => removeItem(item.id)} className="text-red-400 text-xs shrink-0 py-1 px-1">🗑</button>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
                )}
                {item.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                      <span key={i} className="text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
