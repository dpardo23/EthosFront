import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, MapPin, Briefcase, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { Avatar, EmptyState } from '@/shared/ui';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

interface LikedProfile {
  like_id: string;
  basic_profile_id: string;
  slug: string | null;
  created_at: string;
  full_name: string;
  professional_title: string | null;
  location: string | null;
  photo_url: string | null;
  availability_status: string | null;
  seniority: string | null;
}

function getStatusDot(status: string | null) {
  if (!status) return 'bg-muted-foreground/40';
  const s = status.toLowerCase();
  if (s.includes('disponible')) return 'bg-emerald-400';
  if (s.includes('ocupado')) return 'bg-red-400';
  return 'bg-amber-400';
}

function LikedCard({
  item,
  onUnlike,
  onChat,
}: {
  item: LikedProfile;
  onUnlike: (likeId: string, basicProfileId: string) => void;
  onChat: (basicProfileId: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]"
    >
      {/* Remove like button */}
      <button
        onClick={() => onUnlike(item.like_id, item.basic_profile_id)}
        title="Quitar me gusta"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar
            src={item.photo_url ?? undefined}
            alt={item.full_name}
            fallback={item.full_name}
            className="h-12 w-12 shrink-0 rounded-full border border-border"
          />
          <span className={cn('absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card', getStatusDot(item.availability_status))} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-foreground">{item.full_name}</h3>
          <p className="truncate text-[12px] text-violet-500">{item.professional_title ?? 'Sin título'}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.seniority && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {item.seniority}
          </span>
        )}
        {item.location && (
          <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.location}
          </span>
        )}
      </div>

      {/* Like date */}
      <p className="mt-3 flex-1 text-[11px] text-muted-foreground/60">
        Guardado el {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Actions */}
      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        <button
          onClick={() => onChat(item.basic_profile_id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-500"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          onClick={() => item.slug && navigate(`/p/${item.slug}`)}
          disabled={!item.slug}
          className="flex flex-1 items-center justify-center rounded-xl bg-violet-600 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ver perfil
        </button>
      </div>
    </motion.div>
  );
}

export default function RecruiterLikesPage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [likes, setLikes] = useState<LikedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLikes = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase!
        .rpc('get_company_likes_full', { p_company_id: profile.id });

      if (error) throw error;

      const mapped: LikedProfile[] = (data ?? []).map((row: any) => ({
        like_id: row.like_id,
        basic_profile_id: row.basic_profile_id,
        slug: row.slug ?? null,
        created_at: row.created_at,
        full_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Perfil sin nombre',
        professional_title: null,
        location: row.location ?? null,
        photo_url: row.avatar_url ?? null,
        availability_status: row.availability_status ?? null,
        seniority: row.seniority ?? null,
      }));
      setLikes(mapped);
    } catch {
      toast.error('Error al cargar tus perfiles guardados');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadLikes(); }, [loadLikes]);

  const handleUnlike = useCallback(async (likeId: string, basicProfileId: string) => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase!
        .rpc('remove_like', { p_company_id: profile.id, p_basic_id: basicProfileId });
      if (error) throw error;
      setLikes(prev => prev.filter(l => l.like_id !== likeId));
      toast.success('Me gusta eliminado');
    } catch {
      toast.error('Error al eliminar me gusta');
    }
  }, [profile?.id]);

  const handleChat = useCallback(async (basicProfileId: string) => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase!
        .rpc('upsert_chat', { p_company_id: profile.id, p_basic_id: basicProfileId });
      if (error) throw error;
      navigate(`/recruiter/chat/${data}`);
    } catch {
      toast.error('No se pudo abrir el chat');
    }
  }, [profile?.id, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-rose-500">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <span className="text-sm font-medium uppercase tracking-wider">Talento Guardado</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Mis Perfiles Favoritos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {likes.length} {likes.length === 1 ? 'perfil guardado' : 'perfiles guardados'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[220px] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : likes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16">
          <EmptyState
            title="Sin favoritos aún"
            description="Usa el ❤️ en las tarjetas de Buscar Talento para guardar perfiles aquí."
            icon={Briefcase}
          />
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence>
            {likes.map(item => (
              <LikedCard key={item.like_id} item={item} onUnlike={handleUnlike} onChat={handleChat} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
