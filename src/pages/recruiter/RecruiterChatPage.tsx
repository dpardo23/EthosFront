import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Paperclip, ArrowLeft, Check, CheckCheck,
  MessageSquare, Trash2, X, Image, Music, Video, FileText,
  Info, Search, Smile, Mic, Camera,
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { supabase, setSupabaseAuth } from '@/lib/supabase';
import { useAuthStore, useNotificationsStore } from '@/store';
import { Avatar } from '@/shared/ui';
import { AttachmentBubble } from '@/shared/ui/AttachmentBubble';
import { AttachmentFilePicker, AudioRecorderModal, CameraModal } from '@/shared/ui/AttachmentMenu';
import { ChatContactPanel } from '@/shared/ui/ChatContactPanel';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import {
  formatBytes, type AttachmentCategory,
} from '@/shared/lib/chatAttachments';
import type { RealtimeChannel } from '@supabase/supabase-js';
import api from '@/shared/api/api';

interface ChatContact {
  chat_id: string;
  other_profile_id: string;
  other_name: string;
  other_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread: number;
}

interface Message {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  attachment_type: AttachmentCategory | null;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  deleted_at: string | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function AttachmentTypeIcon({ type }: { type: AttachmentCategory }) {
  switch (type) {
    case 'image': return <Image className="h-4 w-4 text-indigo-400 shrink-0" />;
    case 'audio': return <Music className="h-4 w-4 text-indigo-400 shrink-0" />;
    case 'video': return <Video className="h-4 w-4 text-indigo-400 shrink-0" />;
    default:      return <FileText className="h-4 w-4 text-indigo-400 shrink-0" />;
  }
}

/* ── WhatsApp-style typing indicator ── */
function TypingIndicator({ avatarUrl, name }: { avatarUrl?: string | null; name?: string }) {
  return (
    <div className="flex items-end gap-2 justify-start px-1">
      <div className="shrink-0">
        <Avatar
          src={avatarUrl ?? undefined}
          alt={name ?? ''}
          fallback={name ?? '?'}
          className="h-6 w-6 rounded-full border border-border/50"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 6 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted/90 backdrop-blur-sm px-4 py-3 shadow-sm border border-border/30"
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-indigo-400"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ── Chat list item ── */
function ChatListItem({ chat, isActive, onClick }: {
  chat: ChatContact; isActive: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 3, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/8 border border-indigo-500/25 shadow-md shadow-indigo-500/10'
          : 'hover:bg-muted/50 border border-transparent hover:border-border/40',
      )}
    >
      <div className="relative shrink-0">
        <div className={cn(
          'rounded-full p-0.5',
          isActive ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-transparent',
        )}>
          <Avatar
            src={chat.other_avatar ?? undefined}
            alt={chat.other_name}
            fallback={chat.other_name}
            className="h-11 w-11 rounded-full border-2 border-card shadow-sm"
          />
        </div>
        {chat.unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white ring-2 ring-card shadow-lg shadow-indigo-500/40"
          >
            {chat.unread > 9 ? '9+' : chat.unread}
          </motion.span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className={cn(
            'truncate text-sm',
            chat.unread > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground/90',
          )}>{chat.other_name}</p>
          {chat.last_message_at && (
            <span className={cn(
              'shrink-0 text-[10px]',
              chat.unread > 0 ? 'text-indigo-400 font-semibold' : 'text-muted-foreground',
            )}>{formatDate(chat.last_message_at)}</span>
          )}
        </div>
        <p className={cn(
          'mt-0.5 truncate text-[12px]',
          chat.unread > 0 ? 'text-foreground/80 font-medium' : 'text-muted-foreground',
        )}>
          {chat.last_message ?? 'Inicia la conversación'}
        </p>
      </div>
    </motion.button>
  );
}

/* ── Dialogs ── */
function DeleteConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20">
          <Trash2 className="h-7 w-7 text-rose-400" />
        </div>
        <h3 className="text-base font-semibold text-foreground">¿Eliminar conversación?</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Solo se eliminará de tu vista. El profesional conservará su historial.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel}
            className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-2xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30">
            Eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeleteMessageDialog({ onConfirm, onCancel }: { onConfirm: (forAll: boolean) => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl"
      >
        <h3 className="text-base font-semibold text-foreground">Eliminar mensaje</h3>
        <p className="mt-2 text-sm text-muted-foreground">¿Para quién deseas eliminar este mensaje?</p>
        <div className="mt-5 space-y-2">
          <button onClick={() => onConfirm(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3.5 text-left text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors">
            <Trash2 className="h-4 w-4 shrink-0" />
            Eliminar para todos
          </button>
          <button onClick={onCancel}
            className="w-full rounded-2xl border border-border py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Message bubble ── */
function MessageBubble({ msg, isMine, onDelete }: {
  msg: Message; isMine: boolean; onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  if (msg.deleted_at) {
    return (
      <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
        <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-muted/40 border border-border/30 text-[11px] italic text-muted-foreground/70">
          <X className="h-3 w-3" /> Mensaje eliminado
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 280 }}
      className={cn('group flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <AnimatePresence>
        {showActions && isMine && (
          <motion.button
            key="del"
            initial={{ opacity: 0, scale: 0.6, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            onClick={() => onDelete(msg.message_id)}
            className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 backdrop-blur-sm text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors shadow-sm border border-border/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className={cn(
        'relative max-w-[72%] rounded-2xl px-4 py-2.5 shadow-md',
        isMine
          ? 'rounded-br-sm bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-500/20'
          : 'rounded-bl-sm bg-card/90 backdrop-blur-sm text-foreground border border-border/50 shadow-black/5',
      )}>
        {isMine && (
          <div className="absolute inset-0 rounded-2xl rounded-br-sm bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        )}
        {msg.attachment_url && (
          <AttachmentBubble url={msg.attachment_url} type={msg.attachment_type} isMine={isMine} />
        )}
        {msg.content && (
          <p className="relative text-sm leading-relaxed break-words">{msg.content}</p>
        )}
        <div className={cn('mt-1 flex items-center gap-1', isMine ? 'justify-end' : 'justify-start')}>
          <span className={cn('text-[10px]', isMine ? 'text-white/50' : 'text-muted-foreground/60')}>
            {formatTime(msg.created_at)}
          </span>
          {isMine && (
            msg.is_read
              ? <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
              : <Check className="h-3.5 w-3.5 text-white/50" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Decorative background shapes ── */
function ChatBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.04, 0.07, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500"
        style={{ filter: 'blur(60px)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-500"
        style={{ filter: 'blur(50px)' }}
      />
      <motion.div
        animate={{ y: [-10, 10, -10], opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-400"
        style={{ filter: 'blur(40px)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, rgb(99,102,241) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
}

/* ── Empty state ── */
function EmptyConversation() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden">
      <ChatBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
        className="relative z-10 flex flex-col items-center gap-4 text-center px-8"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 shadow-xl shadow-indigo-500/10 border border-indigo-500/20"
          >
            <MessageSquare className="h-12 w-12 text-indigo-400/80" />
          </motion.div>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
              className="absolute h-2 w-2 rounded-full bg-indigo-400"
              style={{
                right: i === 0 ? '-8px' : i === 1 ? '-16px' : '-6px',
                top: i === 0 ? '8px' : i === 1 ? '24px' : '40px',
              }}
            />
          ))}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Tus conversaciones</p>
          <p className="mt-1.5 text-sm text-muted-foreground/80 max-w-xs leading-relaxed">
            Selecciona un chat de la lista para comenzar a conversar
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RecruiterChatPage() {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { profile, isAuthResolved } = useAuthStore();
  const { addNotification } = useNotificationsStore();

  const [chats, setChats] = useState<ChatContact[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(chatId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentCategory, setAttachmentCategory] = useState<AttachmentCategory | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);

  const [emojiOpen, setEmojiOpen] = useState(false);
  const [directAudio, setDirectAudio] = useState(false);
  const [directCamera, setDirectCamera] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStaleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deletedChatsRef = useRef<Set<string>>(new Set());
  const attachTriggerRef = useRef<(() => void) | null>(null);

  const filteredChats = chats.filter(c =>
    !searchQuery.trim() || c.other_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearAttachment = useCallback(() => {
    if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    setAttachmentFile(null);
    setAttachmentCategory(null);
    setAttachmentPreviewUrl(null);
  }, [attachmentPreviewUrl]);

  const handleAttachFile = useCallback((file: File, category: AttachmentCategory) => {
    if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    setAttachmentFile(file);
    setAttachmentCategory(category);
    setAttachmentPreviewUrl(category === 'image' ? URL.createObjectURL(file) : null);
  }, [attachmentPreviewUrl]);

  const handleLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocalización no disponible'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setText(prev => prev ? `${prev} ${url}` : url);
      },
      () => toast.error('No se pudo obtener la ubicación'),
    );
  }, []);

  const sendTyping = useCallback(async () => {
    if (!activeChatId || !profile?.id || !supabase) return;
    await supabase.rpc('upsert_typing', { p_chat_id: activeChatId, p_user_id: profile.id });
  }, [activeChatId, profile?.id]);

  const clearTyping = useCallback(async () => {
    if (!activeChatId || !profile?.id || !supabase) return;
    // Reset ref synchronously so next keystroke re-triggers sendTyping immediately
    isTypingRef.current = false;
    await supabase.rpc('clear_typing', { p_chat_id: activeChatId, p_user_id: profile.id });
  }, [activeChatId, profile?.id]);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    if (!val.trim()) { clearTyping(); return; }
    if (!isTypingRef.current) { isTypingRef.current = true; sendTyping(); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { clearTyping(); }, 2500);
  }, [sendTyping, clearTyping]);

  const loadChats = useCallback(async () => {
    if (!profile?.id || !supabase) return;
    const sb = supabase;
    setLoadingChats(true);
    try {
      const { data, error } = await sb.rpc('get_chat_list', { p_company_id: profile.id });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const enriched: ChatContact[] = await Promise.all(
        rows.map(async (chat) => {
          const [lastMsgRes, unreadRes] = await Promise.all([
            sb.rpc('get_last_message', { p_chat_id: chat.chat_id }),
            sb.rpc('get_unread_count', { p_chat_id: chat.chat_id, p_user_id: profile.id }),
          ]);
          const lastMsg = (lastMsgRes.data as any[])?.[0] ?? null;
          return {
            chat_id: chat.chat_id,
            other_profile_id: chat.basic_profile_id,
            other_name: [chat.first_name, chat.last_name].filter(Boolean).join(' ') || 'Perfil',
            other_avatar: chat.avatar_url ?? null,
            last_message: lastMsg?.content ?? null,
            last_message_at: lastMsg?.created_at ?? chat.updated_at,
            unread: (unreadRes.data as number) ?? 0,
          };
        })
      );
      setChats(enriched);
    } catch { /* silent */ }
    finally { setLoadingChats(false); }
  }, [profile?.id]);

  useEffect(() => { loadChats(); }, [loadChats]);

  const loadMessages = useCallback(async (cid: string, freshChat = false) => {
    if (!supabase) return;
    const sb = supabase;
    setLoadingMsgs(true);
    setMessages([]);
    try {
      if (freshChat) {
        setLoadingMsgs(false);
        return;
      }
      const { data, error } = await sb.rpc('get_messages', {
        p_chat_id: cid,
        p_viewer_id: profile?.id ?? null,
      });
      if (error) throw error;
      setMessages((data ?? []) as Message[]);
      if (profile?.id) {
        await sb.rpc('mark_messages_read', { p_chat_id: cid, p_reader_id: profile.id });
        setChats(prev => prev.map(c => c.chat_id === cid ? { ...c, unread: 0 } : c));
      }
    } catch { toast.error('Error al cargar mensajes'); }
    finally { setLoadingMsgs(false); }
  }, [profile?.id]);

  useEffect(() => {
    if (!activeChatId || !supabase || !isAuthResolved) return;
    const sb = supabase;
    const token = sessionStorage.getItem('ethoshub_access_token');
    if (token && !token.startsWith('mock-')) setSupabaseAuth(token);

    const isFresh = deletedChatsRef.current.has(activeChatId);
    loadMessages(activeChatId, isFresh);

    if (channelRef.current) sb.removeChannel(channelRef.current);
    if (typingChannelRef.current) sb.removeChannel(typingChannelRef.current);

    const msgChannel = sb.channel(`chat:${activeChatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'core', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.chat_id !== activeChatId) return;
        setMessages(prev => prev.find(m => m.message_id === newMsg.message_id) ? prev : [...prev, newMsg]);
        if (newMsg.sender_id !== profile?.id) {
          // Mark read immediately and clear badge since we're actively in this chat
          sb.rpc('mark_messages_read', { p_chat_id: activeChatId, p_reader_id: profile!.id });
          setChats(prev => prev.map(c => c.chat_id === activeChatId
            ? { ...c, last_message: newMsg.content, last_message_at: newMsg.created_at, unread: 0 }
            : c));
          const sender = chats.find(c => c.chat_id === activeChatId);
          addNotification({ type: 'message', title: 'Nuevo mensaje',
            message: sender ? `${sender.other_name}: ${newMsg.content.slice(0, 60)}` : newMsg.content.slice(0, 60) });
        } else {
          // Own message: just update last_message in list
          setChats(prev => prev.map(c => c.chat_id === activeChatId
            ? { ...c, last_message: newMsg.content, last_message_at: newMsg.created_at }
            : c));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'core', table: 'chat_messages' }, (payload) => {
        const updated = payload.new as Message;
        if (updated.chat_id !== activeChatId) return;
        // This fires when is_read changes — updates read receipt checkmarks in realtime
        setMessages(prev => prev.map(m => m.message_id === updated.message_id ? { ...m, is_read: updated.is_read, deleted_at: updated.deleted_at } : m));
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') loadMessages(activeChatId, deletedChatsRef.current.has(activeChatId)); });

    const typingChannel = sb.channel(`typing-rec:${activeChatId}`)
      .on('postgres_changes', { event: '*', schema: 'core', table: 'chat_typing' }, (payload) => {
        const row = (payload.new ?? payload.old) as any;
        if (!row || row.chat_id !== activeChatId || row.user_id === profile?.id) return;
        if (payload.eventType === 'DELETE') {
          setOtherIsTyping(false);
        } else {
          setOtherIsTyping(true);
          if (typingStaleRef.current) clearTimeout(typingStaleRef.current);
          typingStaleRef.current = setTimeout(() => setOtherIsTyping(false), 4000);
        }
      })
      .subscribe();

    channelRef.current = msgChannel;
    typingChannelRef.current = typingChannel;

    return () => {
      sb.removeChannel(msgChannel);
      sb.removeChannel(typingChannel);
      channelRef.current = null;
      typingChannelRef.current = null;
      clearTyping();
    };
  }, [activeChatId, loadMessages, profile?.id, isAuthResolved]);

  useEffect(() => {
    if (!activeChatId) return;
    setActiveContact(chats.find(c => c.chat_id === activeChatId) ?? null);
  }, [activeChatId, chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherIsTyping]);

  useEffect(() => {
    if (activeChatId) navigate(`/recruiter/chat/${activeChatId}`, { replace: true });
    else navigate('/recruiter/chat', { replace: true });
  }, [activeChatId, navigate]);

  const handleSend = useCallback(async () => {
    if (!activeChatId || !profile?.id || (!text.trim() && !attachmentFile) || !supabase) return;
    setSending(true);
    clearTyping();
    try {
      let attachmentUrl: string | null = null;
      let attachmentType: AttachmentCategory | null = null;

      if (attachmentFile && attachmentCategory) {
        const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `chat/${activeChatId}/${Date.now()}-${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from('attachments').upload(path, attachmentFile, { contentType: attachmentFile.type });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
        attachmentType = attachmentCategory;
      }

      const { data: apiResp } = await api.post<{ data: Message }>('/v1/messages', {
        chatId: activeChatId, content: text.trim(), attachmentType, attachmentUrl,
      });
      const sent = apiResp.data;
      if (sent) setMessages(prev => prev.find(m => m.message_id === sent.message_id) ? prev : [...prev, sent]);
      setText('');
      clearAttachment();
    } catch { toast.error('Error al enviar mensaje'); }
    finally { setSending(false); }
  }, [activeChatId, profile?.id, text, attachmentFile, attachmentCategory, clearAttachment, clearTyping]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!profile?.id || !supabase) return;
    try {
      const { error } = await supabase.rpc('delete_message', { p_message_id: messageId, p_sender_id: profile.id });
      if (error) throw error;
      setMessages(prev => prev.map(m => m.message_id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m));
      toast.success('Mensaje eliminado');
    } catch { toast.error('Error al eliminar'); }
    finally { setDeletingMessageId(null); }
  }, [profile?.id]);

  const handleDeleteChat = useCallback(async () => {
    if (!activeChatId || !profile?.id || !supabase) return;
    try {
      const { error } = await supabase.rpc('delete_chat', { p_chat_id: activeChatId, p_company_id: profile.id });
      if (error) throw error;
      deletedChatsRef.current.add(activeChatId);
      setChats(prev => prev.filter(c => c.chat_id !== activeChatId));
      setActiveChatId(null);
      setMessages([]);
      setShowPanel(false);
      toast.success('Conversación eliminada de tu vista');
    } catch { toast.error('Error al eliminar chat'); }
    finally { setDeletingChat(false); }
  }, [activeChatId, profile?.id]);

  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((groups, msg) => {
    const date = formatDate(msg.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === date) { last.msgs.push(msg); }
    else { groups.push({ date, msgs: [msg] }); }
    return groups;
  }, []);

  return (
    <>
      <AnimatePresence>
        {deletingChat && (
          <DeleteConfirmDialog onConfirm={handleDeleteChat} onCancel={() => setDeletingChat(false)} />
        )}
        {deletingMessageId && (
          <DeleteMessageDialog
            onConfirm={() => handleDeleteMessage(deletingMessageId)}
            onCancel={() => setDeletingMessageId(null)}
          />
        )}
        {directAudio && (
          <AudioRecorderModal
            onSend={(file) => { setDirectAudio(false); handleAttachFile(file, 'audio'); }}
            onCancel={() => setDirectAudio(false)}
          />
        )}
        {directCamera && (
          <CameraModal
            onSend={(file) => { setDirectCamera(false); handleAttachFile(file, 'image'); }}
            onCancel={() => setDirectCamera(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-[calc(100vh-112px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* ── Chat list sidebar ── */}
        <div className={cn(
          'flex flex-col border-r border-border/60',
          activeChatId ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80',
        )}>
          {/* Sidebar header */}
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-gradient-to-r from-indigo-500/8 to-transparent px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 shadow-sm">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Mensajes</h2>
            {chats.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-500/15 px-1.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-500/20"
              >
                {chats.length}
              </motion.span>
            )}
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-border/40">
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 ring-1 ring-border/30 focus-within:ring-indigo-500/30 transition-all">
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar candidato..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
            {loadingChats ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
                    <div className="h-2.5 w-20 animate-pulse rounded-full bg-muted/60" />
                  </div>
                </div>
              ))
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted shadow-sm"
                >
                  <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
                </motion.div>
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? 'Sin resultados' : 'Sin conversaciones aún'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60 leading-relaxed">
                  {searchQuery ? 'Prueba con otro nombre' : 'Inicia un chat desde Buscar Talento'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredChats.map((chat, i) => (
                  <motion.div
                    key={chat.chat_id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: 'spring', damping: 25, stiffness: 300 }}
                  >
                    <ChatListItem
                      chat={chat}
                      isActive={chat.chat_id === activeChatId}
                      onClick={() => { setActiveChatId(chat.chat_id); setActiveContact(chat); setShowPanel(false); }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Conversation area ── */}
        <div className={cn('flex flex-1 flex-col min-w-0', !activeChatId && 'hidden md:flex')}>
          {!activeChatId ? (
            <EmptyConversation />
          ) : (
            <>
              {/* ── Topbar ── */}
              <div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-sm px-4">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                <button
                  onClick={() => setActiveChatId(null)}
                  className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                {activeContact && (
                  <button
                    onClick={() => setShowPanel(p => !p)}
                    className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity"
                  >
                    <div className="relative shrink-0">
                      <div className="rounded-full p-0.5 bg-gradient-to-br from-indigo-400/50 to-indigo-600/30">
                        <Avatar
                          src={activeContact.other_avatar ?? undefined}
                          alt={activeContact.other_name}
                          fallback={activeContact.other_name}
                          className="h-9 w-9 rounded-full border-2 border-card shadow-sm"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-bold text-foreground">{activeContact.other_name}</p>
                      <AnimatePresence mode="wait">
                        {otherIsTyping ? (
                          <motion.div key="typing" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            className="flex items-center gap-1">
                            <span className="text-[11px] font-medium text-emerald-400">escribiendo</span>
                            <div className="flex gap-0.5">
                              {[0, 1, 2].map(i => (
                                <motion.span key={i} className="h-1 w-1 rounded-full bg-emerald-400"
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.p key="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="text-[11px] text-muted-foreground/70">toca para ver perfil</motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPanel(p => !p)}
                    title="Ver perfil"
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                      showPanel
                        ? 'bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <Info className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeletingChat(true)}
                    title="Eliminar chat"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* ── Messages + panel ── */}
              <div className="flex flex-1 min-h-0">
                <div className="flex flex-1 flex-col min-w-0">
                  {/* Messages scroll area */}
                  <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    <ChatBackground />

                    {loadingMsgs ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        <p className="text-xs text-muted-foreground/60">Cargando mensajes...</p>
                      </div>
                    ) : (
                      <div className="relative z-10 space-y-1">
                        {groupedMessages.map(group => (
                          <div key={group.date}>
                            <div className="my-5 flex items-center gap-3">
                              <div className="flex-1 border-t border-border/30" />
                              <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="shrink-0 rounded-full bg-muted/80 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm border border-border/30"
                              >
                                {group.date}
                              </motion.span>
                              <div className="flex-1 border-t border-border/30" />
                            </div>
                            <div className="space-y-2">
                              {group.msgs.map(msg => (
                                <MessageBubble
                                  key={msg.message_id}
                                  msg={msg}
                                  isMine={msg.sender_id === profile?.id}
                                  onDelete={(id) => setDeletingMessageId(id)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <AnimatePresence>
                      {otherIsTyping && (
                        <motion.div
                          key="typing-indicator"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="relative z-10 pt-2"
                        >
                          <TypingIndicator
                            avatarUrl={activeContact?.other_avatar}
                            name={activeContact?.other_name}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                  </div>

                  {/* Attachment preview bar */}
                  <AnimatePresence>
                    {attachmentFile && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/60 bg-indigo-500/5"
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          {attachmentCategory === 'image' && attachmentPreviewUrl ? (
                            <img src={attachmentPreviewUrl} alt="Preview" className="h-12 w-12 rounded-xl object-cover shrink-0 ring-2 ring-indigo-500/30 shadow-sm" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 shrink-0 ring-1 ring-indigo-500/20">
                              <AttachmentTypeIcon type={attachmentCategory!} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">{attachmentFile.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatBytes(attachmentFile.size)}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={clearAttachment}
                            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input bar */}
                  <div className="relative">
                    {/* Emoji picker */}
                    <AnimatePresence>
                      {emojiOpen && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-30"
                            onClick={() => setEmojiOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 8 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                            className="absolute bottom-[calc(100%+4px)] right-0 z-40"
                          >
                            <Picker
                              data={data}
                              locale="es"
                              theme="dark"
                              onEmojiSelect={(emoji: any) => {
                                setText(prev => prev + emoji.native);
                                inputRef.current?.focus();
                              }}
                            />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                    <motion.div
                      animate={inputFocused ? { borderColor: 'rgba(99,102,241,0.3)' } : {}}
                      className="flex shrink-0 items-center gap-2 border-t border-border/60 bg-card/90 backdrop-blur-sm px-4 py-3"
                    >
                      {/* Attach button */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => attachTriggerRef.current?.()}
                          title="Adjuntar archivo"
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
                            attachmentFile
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-md shadow-indigo-500/20'
                              : 'border-border/60 text-muted-foreground hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5',
                          )}
                        >
                          <Paperclip className="h-4 w-4" />
                        </motion.button>
                        <AttachmentFilePicker
                          triggerRef={attachTriggerRef}
                          onFile={handleAttachFile}
                        />
                      </div>

                      {/* Text input */}
                      <div className="relative flex-1">
                        <input
                          ref={inputRef}
                          className="w-full rounded-2xl border border-border/60 bg-muted/50 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-indigo-500/50 focus:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                          placeholder="Escribe un mensaje..."
                          value={text}
                          onChange={e => handleTextChange(e.target.value)}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        />
                        <button
                          onClick={() => setEmojiOpen(p => !p)}
                          className={cn(
                            'absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                            emojiOpen ? 'text-indigo-400' : 'text-muted-foreground/40 hover:text-muted-foreground',
                          )}
                          title="Emojis"
                        >
                          <Smile className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Mic shortcut */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDirectAudio(true)}
                        title="Grabar audio"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:border-rose-500/40 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                      >
                        <Mic className="h-4 w-4" />
                      </motion.button>

                      {/* Camera shortcut */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDirectCamera(true)}
                        title="Tomar foto"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/5 transition-all"
                      >
                        <Camera className="h-4 w-4" />
                      </motion.button>

                      {/* Send */}
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        animate={text.trim() || attachmentFile
                          ? { scale: 1, opacity: 1 }
                          : { scale: 0.95, opacity: 0.6 }}
                        onClick={handleSend}
                        disabled={sending || (!text.trim() && !attachmentFile)}
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200',
                          text.trim() || attachmentFile
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/40'
                            : 'bg-muted text-muted-foreground border border-border/60',
                        )}
                      >
                        {sending
                          ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          : <Send className="h-4 w-4" />
                        }
                      </motion.button>
                    </motion.div>
                  </div>
                </div>

                {/* Contact panel */}
                <AnimatePresence>
                  {showPanel && activeContact && (
                    <ChatContactPanel
                      profileId={activeContact.other_profile_id}
                      contactType="basic"
                      onClose={() => setShowPanel(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
