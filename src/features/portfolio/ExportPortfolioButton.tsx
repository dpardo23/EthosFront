import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { portfolioService } from '@/shared/services/portfolioService';
import { exportPortfolioToHtml } from '@/shared/lib/exportPortfolioToHtml';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface ExportPortfolioButtonProps {
  className?: string;
}

export function ExportPortfolioButton({ className }: ExportPortfolioButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const profile = await portfolioService.exportPortfolio();
      exportPortfolioToHtml(profile);
      toast.success('Portafolio exportado correctamente');
    } catch {
      toast.error('No se pudo exportar el portafolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium',
        'text-muted-foreground hover:border-violet-500/30 hover:text-violet-600 transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      title="Descargar portafolio como HTML sin conexión"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Download className="h-3.5 w-3.5" />}
      Exportar HTML
    </button>
  );
}
