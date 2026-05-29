import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/shared/ui';

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <ShieldX className="h-24 w-24 text-destructive" />
      <h1 className="mt-6 text-3xl font-bold text-foreground">Acceso Denegado</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        No tienes permisos para acceder a esta página.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Contacta al administrador si crees que esto es un error.
      </p>
      <div className="mt-6 flex gap-4">
        <Link to="/dashboard">
          <Button variant="outline">Ir al Dashboard</Button>
        </Link>
        <Link to="/login">
          <Button>Cambiar de cuenta</Button>
        </Link>
      </div>
    </div>
  );
}
