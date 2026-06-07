import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { portfolioService } from '@/shared/services/portfolioService';
import { exportPortfolioToHtml } from '@/shared/lib/exportPortfolioToHtml';
import { exportPortfolioToPdf } from '@/shared/lib/exportPortfolioToPdf';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

/**
 * Button component that triggers PDF export of the public portfolio page using exportPortfolioToPdf.
 */
interface ExportPortfolioButtonProps {
  className?: string;
}

export function ExportPortfolioButton({ className }: ExportPortfolioButtonProps) {
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [loadingPdf, setLoadingPdf]   = useState(false);

  const handleExportHtml = async () => {
    setLoadingHtml(true);
    try {
      const profile = await portfolioService.exportPortfolio();
      exportPortfolioToHtml(profile);
      toast.success('Portafolio exportado como HTML');
    } catch {
      toast.error('No se pudo exportar el portafolio');
    } finally {
      setLoadingHtml(false);
    }
  };

  const handleExportPdf = async () => {
    setLoadingPdf(true);
    toast.info('Generando PDF…', { duration: 2500 });
    try {
      const profile = await portfolioService.exportPortfolio();
      await exportPortfolioToPdf(profile);
      toast.success('PDF descargado correctamente');
    } catch {
      toast.error('No se pudo generar el PDF');
    } finally {
      setLoadingPdf(false);
    }
  };

  const btnBase = cn(
    'flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium',
    'text-muted-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={handleExportHtml}
        disabled={loadingHtml || loadingPdf}
        className={cn(btnBase, 'hover:border-violet-500/30 hover:text-violet-600')}
        title="Descargar portafolio como HTML sin conexión"
      >
        {loadingHtml
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" />}
        Exportar HTML
      </button>

      <button
        onClick={handleExportPdf}
        disabled={loadingPdf || loadingHtml}
        className={cn(btnBase, 'hover:border-rose-500/30 hover:text-rose-600')}
        title="Descargar portafolio como PDF"
      >
        {loadingPdf
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <FileText className="h-3.5 w-3.5" />}
        Exportar PDF
      </button>
    </div>
  );
}
