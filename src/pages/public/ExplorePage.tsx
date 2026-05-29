import { ArrowUpRight, Briefcase, MapPin, Search, Shield, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Button } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { mockUsers } from '@/shared/mocks/data';

const featuredProfiles = mockUsers
  .filter((user) => user.role === 'professional')
  .slice(0, 3)
  .map((user, index) => ({
    ...user,
    headline:
      index === 0
        ? 'Construyendo productos web escalables con foco en performance y claridad.'
        : index === 1
        ? 'Interfaces y experiencias de producto con criterio visual y accesibilidad.'
        : 'Arquitecturas backend limpias, servicios confiables y despliegues sostenibles.',
    stats:
      index === 0
        ? ['18k vistas', '12 proyectos', '3 recomendaciones']
        : index === 1
        ? ['9.6k vistas', '8 casos destacados', 'Sistema de diseno']
        : ['7.2k vistas', 'APIs y microservicios', 'Alta disponibilidad'],
  }));

export default function ExplorePage() {
  const { isAuthenticated } = useAuthStore();
  const isGuest = !isAuthenticated;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
        <div className="relative px-5 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Descubrir talento
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Explora perfiles profesionales antes de desbloquearlos.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Descubre talento, trayectoria y potencial desde una vista previa cuidada. Los
                  perfiles muestran contexto general y se desbloquean por completo cuando el usuario
                  crea su cuenta o inicia sesion.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Users className="mr-1 h-3 w-3" />
                  Preview de perfiles
                </Badge>
                <Badge variant="outline">Modo invitado protegido</Badge>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border bg-background/85 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Acceso completo con cuenta</p>
                  <p className="text-sm text-muted-foreground">
                    Crea tu cuenta para ver la informacion real de los perfiles.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  'Ver experiencia y proyectos sin difuminado',
                  'Acceder a contacto, links y recomendaciones',
                  'Entrar al flujo completo del producto',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground">
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/login" className="mt-5 inline-flex">
                <Button>Crear cuenta o iniciar sesion</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isGuest && (
        <div className="mt-6 rounded-[1.75rem] border border-primary/20 bg-primary/5 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-foreground">Vista de invitado activa</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Los perfiles se muestran sombreados para no exponer la informacion completa. Para
                desbloquearlos, entra al login y crea tu cuenta si todavia no tienes una.
              </p>
            </div>
            <Link to="/login" className="shrink-0">
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Ir al login / crear cuenta
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {featuredProfiles.map((profile) => (
          <div key={profile.id} className="relative overflow-hidden rounded-[1.75rem]">
            <div
              className={
                isGuest
                  ? 'pointer-events-none select-none blur-[7px] saturate-[0.85] opacity-80'
                  : ''
              }
            >
              <article className="h-full rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-foreground">{profile.name}</h2>
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                        Profesional
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">{profile.profession}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        Portafolio publico
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-muted-foreground">{profile.headline}</p>

                <div className="mt-5 grid gap-2">
                  {profile.stats.map((item) => (
                    <div key={item} className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Perfil disponible</span>
                  <Link to={`/p/${profile.slug}`}>
                    <Button variant="outline" size="sm">
                      {isGuest ? 'Ver preview' : 'Ver perfil'}
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </article>
            </div>

            {isGuest && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/38 p-4">
                <div className="w-full max-w-xs rounded-[1.5rem] border border-border bg-card/95 p-5 text-center shadow-xl backdrop-blur">
                  <p className="text-base font-semibold text-foreground">
                    Perfil bloqueado para invitados
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Crea tu cuenta o inicia sesión para ver la informacion completa del perfil y
                    navegarlo sin sombreado.
                  </p>
                  <Link to="/login" className="mt-4 inline-flex">
                    <Button>Crear cuenta para desbloquear</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
