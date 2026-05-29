import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/shared/ui';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <FileQuestion className="h-24 w-24 text-muted-foreground" />
      <h1 className="mt-6 text-3xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Página no encontrada</p>
      <p className="mt-1 text-sm text-muted-foreground">
        La página que buscas no existe o ha sido movida.
      </p>
      <div className="mt-6 flex gap-4">
        <Link to="/">
          <Button variant="outline">Ir al inicio</Button>
        </Link>
        <Link to="/explorar">
          <Button>Explorar portafolios</Button>
        </Link>
      </div>
    </div>
  );
}
