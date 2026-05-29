import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Check, TrendingUp } from 'lucide-react';
import { Avatar, Badge, Button, Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface SuggestedTalentData {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  slug: string;
  skills: string[];
  mutualConnections: number;
  isFollowing: boolean;
}

interface SuggestedTalentCardProps {
  talent: SuggestedTalentData;
  onFollow?: (talentId: string) => void;
}

function SuggestedTalentCard({ talent, onFollow }: SuggestedTalentCardProps) {
  const [isFollowing, setIsFollowing] = useState(talent.isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    setIsFollowing(!isFollowing);
    onFollow?.(talent.id);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
    >
      <Link to={`/p/${talent.slug}`}>
        <Avatar
          src={talent.avatar}
          alt={talent.name}
          name={talent.name}
          size="md"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/p/${talent.slug}`}
          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {talent.name}
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {talent.headline}
        </p>
        {talent.mutualConnections > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {talent.mutualConnections} conexiones en común
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {talent.skills.slice(0, 2).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
      <Button
        size="sm"
        variant={isFollowing ? 'outline' : 'primary'}
        className={cn(
          'h-8 px-3 text-xs',
          isFollowing && 'border-success text-success hover:border-destructive hover:text-destructive'
        )}
        onClick={handleFollow}
        disabled={isLoading}
      >
        {isFollowing ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            Siguiendo
          </>
        ) : (
          <>
            <UserPlus className="h-3 w-3 mr-1" />
            Seguir
          </>
        )}
      </Button>
    </motion.div>
  );
}

interface SuggestedTalentsProps {
  talents: SuggestedTalentData[];
  onFollow?: (talentId: string) => void;
  loading?: boolean;
}

export function SuggestedTalents({ talents, onFollow, loading }: SuggestedTalentsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-primary" />
            Talentos sugeridos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-primary" />
          Talentos sugeridos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {talents.map((talent) => (
          <SuggestedTalentCard
            key={talent.id}
            talent={talent}
            onFollow={onFollow}
          />
        ))}
        <Link
          to="/explorar"
          className="mt-2 block text-center text-sm font-medium text-primary hover:underline"
        >
          Ver más talento
        </Link>
      </CardContent>
    </Card>
  );
}

interface TrendingSkill {
  name: string;
  growth: number;
  posts: number;
}

interface TrendingSkillsProps {
  skills: TrendingSkill[];
}

export function TrendingSkills({ skills }: TrendingSkillsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-accent" />
          Skills en tendencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {skills.map((skill, index) => (
          <div
            key={skill.name}
            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                #{index + 1}
              </span>
              <div>
                <p className="font-medium text-foreground text-sm">{skill.name}</p>
                <p className="text-xs text-muted-foreground">{skill.posts} posts</p>
              </div>
            </div>
            <Badge variant="success" className="text-xs">
              +{skill.growth}%
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
