import React, { useState, useEffect, useRef, useCallback } from 'react';
import { t } from '../lib/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { getChatMessages, getChatRoom, sendMessage, uploadChatFile, fetchAttachmentBlobUrl } from '../lib/api';
import { toast } from '../components/Toast';
import { API_BASE } from '../lib/constants';
import { useAppCtx } from '../App';
import { getToken } from '../lib/api';
import BottomNav from '../components/BottomNav';

interface Msg {
  id: number | string;
  content: string;
  sender_uid?: string;
  sender_id?: string;
  sender_username?: string;
  sender_name?: string;
  created_at: string;
  pending?: boolean;
}

function formatTime(d: string) {
  const date = new Date(d);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoomPage() {
  const tr = t();
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAppCtx();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [peer, setPeer] = useState<{ name: string; avatar?: string } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file || !id) return;
    if (file.size > 5 * 1024 * 1024) { toast(tr.fileMax5mb, 'error'); return; }
    setUploading(true);
    try {
      const res: any = await uploadChatFile(id, file);
      // Socket usually delivers it, but append defensively (deduped by id).
      if (res?.message) {
        setMsgs(prev => prev.some(m => m.id === res.message.id)
          ? prev
          : [...prev, { ...res.message, content: res.message.message || res.message.content || '' }]);
      }
    } catch (err: any) {
      toast(err.message || 'Upload failed', 'error');
    } finally { setUploading(false); }
  };

  // Load history
  useEffect(() => {
    if (!id) return;
    getChatMessages(id)
      .then((d: any) => setMsgs((d?.messages || d || []).map((m: any) => ({ ...m, content: m.content || m.message || '' }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Load room to show the other participant (avatar + name) in the header
  useEffect(() => {
    if (!id || !user) return;
    getChatRoom(id)
      .then((d: any) => {
        const r = d?.room || d;
        if (!r) return;
        setRoom(r);
        // viewer_is_client comes from the server, which normalises the id — the
        // raw comparison here would mislabel a user whose id spelling differs.
        const iAmClient = r.viewer_is_client ?? (String(r.client_id) === String(user.uid));
        setPeer({
          name: (iAmClient ? r.freelancer_username : r.client_username) || 'user',
          avatar: iAmClient ? r.freelancer_avatar : r.client_avatar,
        });
      })
      .catch(() => {});
  }, [id, user?.uid]);

  // Socket.io
  useEffect(() => {
    if (!id || !user) return;
    const token = getToken();
    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', id);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (raw: any) => {
      const msg: Msg = { ...raw, content: raw.content || raw.message || '' };
      setMsgs(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit('leave', id);
      socket.disconnect();
    };
  }, [id, user?.uid]);

  // Scroll to bottom on new msg
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = useCallback(async () => {
    const content = text.trim();
    if (!content || !id || sending) return;
    setText('');
    setSending(true);

    // Optimistic
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimistic: Msg = {
      id: tempId,
      content,
      sender_uid: user?.uid || '',
      sender_username: user?.username,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMsgs(prev => [...prev, optimistic]);

    try {
      const res = await sendMessage(id, content);
      const raw = res?.message || res;
      const msg: Msg = { ...raw, content: raw.content || raw.message || content, pending: false };
      setMsgs(prev => prev.map(m => m.id === tempId ? msg : m));
    } catch {
      setMsgs(prev => prev.filter(m => m.id !== tempId));
      setText(content);
    } finally { setSending(false); }
  }, [text, id, sending, user]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      {/* Custom header with back + room info */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <button
            onClick={() => nav('/chat')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          {/* Peer avatar */}
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center shrink-0 overflow-hidden text-white font-bold text-sm">
            {peer?.avatar
              ? <img src={peer.avatar} className="w-full h-full object-cover" alt="" />
              : (peer?.name || '·')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{peer ? `@${peer.name}` : 'Chat'}</p>
            <p className="text-white/70 text-xs flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-300' : 'bg-white/40'}`} />
              {connected ? tr.live : tr.connecting}
            </p>
          </div>
        </div>
      </div>

      {/* Job context — the client asked for a way to hire without leaving the
          conversation to hunt for the job page. The hire itself is a Pi payment
          orchestrated on the job screen; duplicating that flow here would mean
          two copies of the most delicate code in the app, so this takes the
          client straight to it instead. */}
      {room?.viewer_is_client && room?.pending_application_id && room?.job_status === 'open' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 dark:text-white font-semibold truncate">{room.job_title}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{room.job_budget} π</p>
            </div>
            <button
              onClick={() => nav(`/job/${room.job_id}?applicant=${room.pending_application_id}`)}
              className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold"
            >
              {tr.hire}
            </button>
          </div>
        </div>
      )}

      {/* Messages. This screen renders its own BottomNav rather than going
          through AppLayout's `pb-nav` wrapper, so pb-36 (9rem — composer plus
          nav at their OLD static heights) is the only thing keeping the last
          message from sitting under them. It needs the same +var(--wp-bottom-
          inset) term as the composer and nav below, or the newest message(s)
          land underneath on a device where the nav grows taller. */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-[calc(9rem+var(--wp-bottom-inset))]">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <span className="text-4xl mb-3">👋</span>
            <p className="text-gray-500 dark:text-slate-400 text-sm">{tr.sayHello}</p>
          </div>
        ) : (
          msgs.map(m => {
            const mine = (m.sender_uid || m.sender_id) === user?.uid;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mr-2 self-end text-xs font-bold text-emerald-600 overflow-hidden">
                    {peer?.avatar
                      ? <img src={peer.avatar} className="w-full h-full object-cover" alt="" />
                      : (m.sender_username || m.sender_name || peer?.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="max-w-xs space-y-0.5">
                  {!mine && (m.sender_username || m.sender_name || peer?.name) && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 ml-1">@{m.sender_username || m.sender_name || peer?.name}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    mine
                      ? `bg-emerald-500 text-white rounded-br-sm ${m.pending ? 'opacity-60' : ''}`
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm'
                  }`}>
                    <MessageBody content={m.content} mine={mine} />
                  </div>
                  <p className={`text-[10px] text-gray-400 dark:text-slate-500 ${mine ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTime(m.created_at)}
                    {mine && m.pending && ' · sending…'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>

      {/* Input bar. Anchored at 4rem (BottomNav's own height) plus the same
          --wp-bottom-inset the nav's padding uses, so it stays sat exactly on
          top of the nav instead of sliding under it when the nav grows taller
          on a device that has no real safe-area inset. A static `bottom-16`
          here once left this box painted over by BottomNav on those devices —
          the composer was still there, just invisible and untappable. */}
      <div className="fixed bottom-[calc(4rem+var(--wp-bottom-inset))] left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-4 py-3 max-w-lg mx-auto">
        <div className="flex gap-2 items-center">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Attach file"
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-slate-400 shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
          >
            {uploading
              ? <span className="w-4 h-4 border-2 border-gray-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
              : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>}
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder={tr.messagePlaceholder}
            className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

// Renders a chat message: plain text, or a tappable attachment for
// "📎 filename|/api/chat/attachments/:id" bodies (fetched with auth → blob URL).
function MessageBody({ content, mine }: { content: string; mine: boolean }) {
  const tr = t();
  const [busy, setBusy] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const isAtt = content.startsWith('📎 ') && content.includes('|/api/chat/attachments/');
  const sep = isAtt ? content.indexOf('|') : -1;
  const name = isAtt ? content.slice(2, sep).trim() : '';
  const path = isAtt ? content.slice(sep + 1) : '';
  const isImage = isAtt && /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(name);

  // Auto-load images inline (attachment endpoint needs auth → blob URL).
  useEffect(() => {
    if (!isImage) return;
    let revoked: string | null = null;
    fetchAttachmentBlobUrl(path).then(u => { revoked = u; setImgUrl(u); }).catch(() => {});
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, [path, isImage]);

  if (!isAtt) return <>{content}</>;

  if (isImage) {
    return imgUrl
      ? <img src={imgUrl} alt={name} className="rounded-lg max-w-[200px] max-h-[240px] object-cover" />
      : <span className="opacity-70">🖼️ {name}…</span>;
  }

  const open = async () => {
    setBusy(true);
    try {
      const url = await fetchAttachmentBlobUrl(path);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { toast(tr.failedOpenAttachment, 'error'); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={open} disabled={busy} className={`flex items-center gap-1.5 underline break-all text-left ${mine ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
      📎 {name}{busy ? ' …' : ''}
    </button>
  );
}
