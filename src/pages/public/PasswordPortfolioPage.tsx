import { Link, useParams } from 'react-router-dom';

export default function PasswordPortfolioPage() {
  const { slug } = useParams();

  return (
    <section className="mx-auto max-w-md space-y-4 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Portafolio protegido</h1>
        <p className="text-sm text-muted-foreground">
          La pantalla de acceso por contrasena no estaba incluida. Quedo una version temporal para
          que la ruta `/p/{slug}/password` exista.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Portafolio: <span className="font-medium text-foreground">{slug ?? 'sin slug'}</span>
        </p>
        <div className="mt-4">
          <Link
            to={slug ? `/p/${slug}` : '/explorar'}
            className="text-sm font-medium text-primary hover:underline"
          >
            Continuar
          </Link>
        </div>
      </div>
    </section>
  );
}
