import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, Badge, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface FeedPostData {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    headline: string;
    slug: string;
  };
  content: string;
  skills?: string[];
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

interface FeedPostProps {
  post: FeedPostData;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
}

export function FeedPost({ post, onLike, onBookmark }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(post.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80"
    >
      {/* Author header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link to={`/p/${post.author.slug}`}>
            <Avatar 
              src={post.author.avatar} 
              alt={post.author.name}
              name={post.author.name}
              size="md" 
              className="ring-2 ring-background"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link 
                to={`/p/${post.author.slug}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {post.author.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {post.author.headline}
            </p>
          </div>
        </div>
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mt-3">
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        
        {/* Skills tags */}
        {post.skills && post.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* Image */}
        {post.image && (
          <div className="mt-3 overflow-hidden rounded-xl">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Engagement stats */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        {likesCount > 0 && (
          <span>{likesCount} me gusta</span>
        )}
        {post.comments > 0 && (
          <span>{post.comments} comentarios</span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              isLiked 
                ? 'text-red-500 hover:bg-red-500/10' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
            <span className="hidden sm:inline">Me gusta</span>
          </button>
          
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Comentar</span>
          </button>
          
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </div>

        <button
          onClick={handleBookmark}
          className={cn(
            'rounded-lg p-2 transition-all',
            isBookmarked 
              ? 'text-primary hover:bg-primary/10' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
        </button>
      </div>
    </motion.article>
  );
}

export function FeedPostSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
