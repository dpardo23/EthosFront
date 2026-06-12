import { useEffect, useRef, useState } from 'react';
import {
  Mail, Send, Search, X, Bold, Italic, Underline, List, Link2, Eraser, Eye, PenLine,
} from 'lucide-react';
import { Avatar, Badge, Button, ConfirmDialog, Tabs, EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  adminEmailService,
  adminProfileService,
  type AdminProfileItem,
} from '@/shared/services/adminService';

/**
 * Admin outbox: compose rich HTML emails for profiles with live preview and
 * real delivery through the backend SMTP service.
 */
const SEARCH_DEBOUNCE_MS = 350;
const MAX_RECIPIENTS = 100;

interface Recipient {
  email: string;
  name: string | null;
}

export default function AdminEmailPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<AdminProfileItem[]>([]);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [activeTab, setActiveTab] = useState('redactar');
  const [confirmSend, setConfirmSend] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = searchInput.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const page = await adminProfileService.search({ search: query, status: 'active' }, 0, 6);
        setSuggestions(page.items);
      } catch {
        setSuggestions([]);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const addRecipient = (item: AdminProfileItem) => {
    setRecipients((current) => {
      if (current.some((recipient) => recipient.email === item.email) || current.length >= MAX_RECIPIENTS) {
        return current;
      }
      return [...current, { email: item.email, name: item.fullName }];
    });
    setSearchInput('');
    setSuggestions([]);
  };

  const removeRecipient = (email: string) => {
    setRecipients((current) => current.filter((recipient) => recipient.email !== email));
  };

  const syncEditor = () => {
    setBodyHtml(editorRef.current?.innerHTML ?? '');
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditor();
  };

  const handleInsertLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) exec('createLink', url);
  };

  const bodyIsEmpty = !bodyHtml.replace(/<[^>]*>/g, '').trim();
  const canSend = recipients.length > 0 && subject.trim().length > 0 && !bodyIsEmpty;

  const handleSend = async () => {
    setIsSending(true);
    setFeedback(null);
    try {
      const outcome = await adminEmailService.send({
        recipients: recipients.map((recipient) => recipient.email),
        subject: subject.trim(),
        bodyHtml,
      });
      setFeedback({ kind: 'success', text: `Correo enviado a ${outcome.queued} profiles.` });
      setConfirmSend(false);
      setRecipients([]);
      setSubject('');
      setBodyHtml('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      setActiveTab('redactar');
    } catch {
      setFeedback({ kind: 'error', text: 'No se pudo enviar el correo. Revisa el backend SMTP.' });
    } finally {
      setIsSending(false);
    }
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Negrita', action: () => exec('bold') },
    { icon: Italic, label: 'Cursiva', action: () => exec('italic') },
    { icon: Underline, label: 'Subrayado', action: () => exec('underline') },
    { icon: List, label: 'Lista', action: () => exec('insertUnorderedList') },
    { icon: Link2, label: 'Enlace', action: handleInsertLink },
    { icon: Eraser, label: 'Limpiar formato', action: () => exec('removeFormat') },
  ];

  return (
    <div className="flex h-full max-w-full flex-col gap-4 overflow-x-hidden p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
            Email
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Bandeja de salida · SMTP contacto.bytebusters@gmail.com
          </p>
        </div>
        <Button
          size="sm"
          disabled={!canSend || isSending}
          onClick={() => setConfirmSend(true)}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700"
        >
          <Send className="mr-2 h-4 w-4" />
          {isSending ? 'Enviando…' : `Enviar (${recipients.length})`}
        </Button>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-2 text-xs',
            feedback.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
          )}
        >
          {feedback.text}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Destinatarios ({recipients.length}/{MAX_RECIPIENTS})
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {recipients.map((recipient) => (
            <span
              key={recipient.email}
              className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-2.5 pr-1.5 text-xs dark:border-violet-500/20 dark:bg-violet-500/10"
            >
              <span className="text-violet-700 dark:text-violet-300">{recipient.name || recipient.email}</span>
              <button
                onClick={() => removeRecipient(recipient.email)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-violet-400 hover:bg-violet-200 hover:text-violet-700 dark:hover:bg-violet-500/20"
                aria-label={`Quitar ${recipient.email}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar profile por nombre o email…"
              className="h-9 w-full rounded-lg border border-transparent bg-transparent pl-8 pr-3 text-sm text-black outline-none transition-colors focus:border-violet-500 dark:text-white"
            />
            {suggestions.length > 0 && (
              <div className="absolute left-0 top-10 z-20 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
                {suggestions.map((item) => (
                  <button
                    key={item.profileId}
                    onClick={() => addRecipient(item)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-violet-50 dark:hover:bg-violet-500/10"
                  >
                    <Avatar src={item.avatarUrl ?? undefined} alt={item.fullName ?? item.email} fallback={item.fullName ?? item.email} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-black dark:text-white">{item.fullName || '—'}</span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{item.email}</span>
                    </span>
                    <Badge variant="secondary" className="border-0 bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                      {item.role === 'professional' ? 'Profesional' : 'Reclutador'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Asunto</label>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={150}
          placeholder="Asunto del correo…"
          className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-black outline-none transition-colors focus:border-violet-500 dark:border-white/10 dark:text-white"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            tabs={[
              { id: 'redactar', label: 'Redactar', icon: <PenLine className="h-4 w-4" /> },
              { id: 'preview', label: 'Vista previa', icon: <Eye className="h-4 w-4" /> },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          {activeTab === 'redactar' && (
            <div className="flex items-center gap-1">
              {toolbarButtons.map((button) => (
                <button
                  key={button.label}
                  onClick={button.action}
                  title={button.label}
                  aria-label={button.label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-violet-100 hover:text-violet-600 dark:text-gray-400 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                >
                  <button.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'redactar' ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={syncEditor}
            data-placeholder="Escribe el contenido del correo…"
            className={cn(
              'min-h-[220px] flex-1 overflow-y-auto rounded-lg border border-gray-200 p-4 text-sm text-black outline-none transition-colors focus:border-violet-500 dark:border-white/10 dark:text-white',
              '[&:empty]:before:pointer-events-none [&:empty]:before:text-gray-400 [&:empty]:before:content-[attr(data-placeholder)]',
            )}
          />
        ) : bodyIsEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={Mail} title="Sin contenido" description="Redacta el correo para ver la previsualización." />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rounded-lg bg-[#0a0a14] p-6">
            <div className="mx-auto max-w-[560px] overflow-hidden rounded-2xl border border-white/10">
              <div className="bg-gradient-to-br from-violet-800 via-violet-600 to-purple-500 px-8 py-7 text-center">
                <span className="inline-block rounded-2xl bg-white/10 px-5 py-2 text-lg font-extrabold text-white">
                  Ethos<span className="text-purple-200">Hub</span>
                </span>
                <h2 className="mt-3 text-lg font-bold text-white">{subject || '(Sin asunto)'}</h2>
              </div>
              <div className="bg-[#0e0e1c] px-8 py-7">
                <div
                  className="text-sm leading-relaxed text-white/80 [&_a]:text-violet-400 [&_li]:ml-4 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
                <p className="mt-7 text-center text-xs text-white/30">
                  Este correo será enviado por el equipo de EthosHub.
                </p>
              </div>
              <div className="border-t border-white/5 bg-[#07070f] px-8 py-4 text-center">
                <p className="text-xs text-white/25">© 2026 EthosHub · Todos los derechos reservados</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmSend}
        onClose={() => setConfirmSend(false)}
        onConfirm={handleSend}
        loading={isSending}
        title="Enviar correo"
        message={`Se enviará "${subject.trim()}" a ${recipients.length} profiles a través del SMTP configurado. ¿Confirmas el envío?`}
        confirmLabel="Enviar"
      />
    </div>
  );
}
