import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  ChevronRight,
  Plus,
  Pencil,
  Calendar,
  Building2,
  FileText,
} from 'lucide-react';
import { Button, Card } from '@/shared/ui';
import type { AcademicRecord } from '@/shared/types';
import { AcademicRecordModal } from './AcademicRecordModal';

// Mock data for demonstration
const initialRecords: AcademicRecord[] = [
  {
    id: '1',
    userId: 'user-1',
    institutionName: 'Universidad Nacional Autonoma de Mexico',
    degree: 'Licenciatura en Ingenieria de Software',
    fieldOfStudy: 'Ingenieria de Software',
    startDate: '2016-08-01',
    endDate: '2020-06-30',
    isCurrent: false,
    description: 'Especializacion en desarrollo de sistemas distribuidos y arquitectura de software. Proyecto de tesis sobre microservicios.',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    userId: 'user-1',
    institutionName: 'Platzi',
    degree: 'Diplomado en Cloud Computing',  
    fieldOfStudy: 'AWS & DevOps',
    startDate: '2021-03-01',
    endDate: '2021-09-15',
    isCurrent: false,
    description: 'Certificacion profesional en AWS Solutions Architect y practicas DevOps.',
    credentialUrl: 'https://platzi.com/certificado/123',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export function FormacionCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [records, setRecords] = useState<AcademicRecord[]>(initialRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcademicRecord | null>(null);

  const handleAddRecord = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: AcademicRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (record: Omit<AcademicRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingRecord) {
      // Update existing record
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? { ...r, ...record, updatedAt: new Date().toISOString() }
            : r
        )
      );
    } else {
      // Add new record
      const newRecord: AcademicRecord = {
        ...record,
        id: crypto.randomUUID(),
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRecords((prev) => [newRecord, ...prev]);
    }
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Card
        className={`cursor-pointer p-5 transition-all duration-300 sm:p-6 ${
          isExpanded ? 'ring-2 ring-primary/30' : 'hover:border-primary/30'
        }`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">Formacion</h2>
            <p className="text-sm text-muted-foreground">
              Trayectoria academica y certificaciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {records.length}
              </span>
            )}
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && records.length > 0 && (
          <div className="mt-4">
            <div
              className="space-y-2"
              style={{
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              }}
            >
              {records.slice(0, 2).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2"
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {record.degree}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {record.institutionName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-5 space-y-4">
                {/* Add Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRecord}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Trayectoria
                </Button>

                {/* Records List */}
                <div className="space-y-3">
                  {records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="group relative rounded-2xl border border-border bg-background/70 p-4 transition-all hover:border-primary/30"
                    >
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEditRecord(record)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground opacity-0 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                        aria-label="Editar registro"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                          <GraduationCap className="h-6 w-6" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 pr-8">
                          <h3 className="text-base font-semibold text-foreground">
                            {record.degree}
                          </h3>

                          <div className="mt-1 flex items-center gap-2 text-sm text-primary">
                            <Building2 className="h-4 w-4" />
                            <span>{record.institutionName}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {formatDate(record.startDate)} -{' '}
                                {record.isCurrent ? 'Presente' : record.endDate ? formatDate(record.endDate) : ''}
                              </span>
                            </div>
                            {record.fieldOfStudy && (
                              <span className="rounded-full bg-muted px-2 py-0.5">
                                {record.fieldOfStudy}
                              </span>
                            )}
                          </div>

                          {record.description && (
                            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                              {record.description}
                            </p>
                          )}

                          {record.credentialUrl && (
                            <a
                              href={record.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Ver certificado
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {records.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No hay registros academicos. Agrega tu primera trayectoria.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Academic Record Modal */}
      <AcademicRecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        onSave={handleSaveRecord}
        onDelete={editingRecord ? () => handleDeleteRecord(editingRecord.id) : undefined}
      />
    </>
  );
}
