import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X, Camera, Video, RotateCcw } from 'lucide-react';
import { validateAttachment, ALLOWED_MIME_TYPES, type AttachmentCategory } from '@/shared/lib/chatAttachments';
import { toast } from 'sonner';

/* ── MediaDevices availability ──────────────────────────────────────────────
   navigator.mediaDevices only exists in secure contexts (HTTPS or localhost).
   Accessing it via an IP address over HTTP returns undefined and crashes.
────────────────────────────────────────────────────────────────────────────── */
function getMediaDevices(): MediaDevices | null {
  return typeof navigator !== 'undefined' && navigator.mediaDevices
    ? navigator.mediaDevices
    : null;
}

const INSECURE_MSG =
  'La cámara y el micrófono requieren una conexión segura (HTTPS). ' +
  'Accede desde localhost o configura HTTPS para usar esta función.';

/* ── Audio recorder modal ─────────────────────────────────────────────────── */
export function AudioRecorderModal({
  onSend,
  onCancel,
}: {
  onSend: (file: File) => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<'requesting' | 'recording' | 'preview' | 'error'>('requesting');
  const [errorMsg, setErrorMsg] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const startRecording = useCallback(async () => {
    const md = getMediaDevices();
    if (!md) {
      setErrorMsg(INSECURE_MSG);
      setState('error');
      return;
    }
    setState('requesting');
    try {
      const stream = await md.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: 'audio/webm' });
        setBlob(b);
        stream.getTracks().forEach(t => t.stop());
        setState('preview');
      };
      mr.start();
      mediaRef.current = mr;
      setState('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setErrorMsg(
        denied
          ? 'Acceso al micrófono denegado. Permite el permiso en el ícono de la barra de direcciones del navegador.'
          : 'No se pudo acceder al micrófono. Verifica que el dispositivo esté disponible.',
      );
      setState('error');
    }
  }, []);

  // Start on mount
  useEffect(() => {
    startRecording();
    return () => { stopStream(); mediaRef.current?.stop(); };
  }, []);

  const stopRec = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
  };

  const handleSend = () => {
    if (!blob) return;
    onSend(new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' }));
  };

  const handleCancel = () => {
    stopStream();
    try { mediaRef.current?.stop(); } catch { /* already stopped */ }
    onCancel();
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-xs rounded-3xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Grabar audio</h3>
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-5">
          {state === 'requesting' && (
            <p className="text-sm text-muted-foreground text-center">
              Esperando permiso de micrófono...
            </p>
          )}

          {state === 'error' && (
            <div className="text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20 mx-auto">
                <Mic className="h-7 w-7 text-rose-400" />
              </div>
              <p className="text-sm font-medium text-foreground">Sin acceso al micrófono</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {state === 'recording' && (
            <>
              <div className="flex items-center gap-1 h-10">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-rose-400"
                    animate={{ height: [6, 8 + (i % 4) * 8, 6] }}
                    transition={{ duration: 0.5 + i * 0.07, repeat: Infinity, repeatType: 'reverse' }}
                  />
                ))}
              </div>
              <p className="text-2xl font-mono font-bold text-foreground tabular-nums">{fmt(seconds)}</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={stopRec}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-4 ring-rose-500/30"
              >
                <Square className="h-5 w-5 fill-current" />
              </motion.button>
              <p className="text-xs text-muted-foreground">Toca el cuadrado para detener</p>
            </>
          )}

          {state === 'preview' && blob && (
            <>
              <audio controls className="w-full rounded-xl" style={{ height: 40 }}>
                <source src={URL.createObjectURL(blob)} type="audio/webm" />
              </audio>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => { setBlob(null); setSeconds(0); startRecording(); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Repetir
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30"
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Camera modal ─────────────────────────────────────────────────────────── */
export function CameraModal({
  onSend,
  onCancel,
}: {
  onSend: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [camState, setCamState] = useState<'requesting' | 'live' | 'error'>('requesting');
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startStream = useCallback(async (mode: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCamState('requesting');
    const md = getMediaDevices();
    if (!md) {
      setErrorMsg(INSECURE_MSG);
      setCamState('error');
      return;
    }
    try {
      const stream = await md.getUserMedia({ video: { facingMode: mode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamState('live');
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setErrorMsg(
        denied
          ? 'Acceso a la cámara denegado. Permite el permiso en el ícono de la barra de direcciones del navegador.'
          : 'No se pudo acceder a la cámara. Verifica que el dispositivo esté disponible.',
      );
      setCamState('error');
    }
  }, []);

  useEffect(() => {
    startStream('environment');
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    setPhoto(c.toDataURL('image/jpeg', 0.92));
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const handleSend = () => {
    if (!photo) return;
    const base64 = photo.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    onSend(new File([bytes], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  };

  const handleCancel = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCancel();
  };

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    setPhoto(null);
    startStream(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <h3 className="text-sm font-bold text-foreground">Tomar foto</h3>
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative bg-black min-h-[200px] flex items-center justify-center">
          {camState === 'requesting' && !photo && (
            <p className="text-sm text-white/60 p-6 text-center">
              Esperando permiso de cámara...
            </p>
          )}
          {camState === 'error' && !photo && (
            <div className="text-center p-6 space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 ring-1 ring-sky-500/20 mx-auto">
                <Camera className="h-7 w-7 text-sky-400" />
              </div>
              <p className="text-sm font-medium text-white">Sin acceso a la cámara</p>
              <p className="text-xs text-white/60 leading-relaxed">{errorMsg}</p>
            </div>
          )}
          <video
            ref={videoRef}
            className={camState === 'live' && !photo ? 'w-full' : 'hidden'}
            playsInline
            muted
          />
          {camState === 'live' && !photo && (
            <button
              onClick={flipCamera}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              title="Cambiar cámara"
            >
              <Video className="h-4 w-4" />
            </button>
          )}
          {photo && <img src={photo} alt="Foto capturada" className="w-full" />}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex items-center justify-center gap-4 px-4 py-4">
          {camState === 'live' && !photo && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={takePhoto}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl ring-4 ring-white/20"
            >
              <Camera className="h-6 w-6 text-gray-900" />
            </motion.button>
          )}
          {photo && (
            <>
              <button
                onClick={() => { setPhoto(null); startStream(facingMode); }}
                className="rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Repetir
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30"
              >
                <Send className="h-4 w-4" />
                Enviar
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Attachment file picker (no submenu) ─────────────────────────────────────
   The page renders this component and passes a ref callback so the Paperclip
   button can directly trigger the file input on user gesture, bypassing the
   popup blocker that prevents .click() inside useEffect.
────────────────────────────────────────────────────────────────────────────── */

const ACCEPT = Object.keys(ALLOWED_MIME_TYPES).join(',');

interface Props {
  /** Expose a trigger function to the parent so the Paperclip button calls it directly */
  triggerRef: React.MutableRefObject<(() => void) | null>;
  onFile: (file: File, category: AttachmentCategory) => void;
}

export function AttachmentFilePicker({ triggerRef, onFile }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    triggerRef.current = () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    };
    return () => { triggerRef.current = null; };
  }, [triggerRef]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateAttachment(file);
    if (!result.valid) { toast.error(result.error); return; }
    onFile(file, result.category!);
  };

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={handleChange}
    />
  );
}

/* ── Legacy AttachmentMenu kept for compat (unused submenu logic stripped) ── */
interface LegacyProps {
  open: boolean;
  onClose: () => void;
  onFile: (file: File, category: AttachmentCategory) => void;
  onLocation: () => void;
}

export function AttachmentMenu({ open: _open, onClose: _onClose, onFile, onLocation: _onLocation }: LegacyProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateAttachment(file);
    if (!result.valid) { toast.error(result.error); return; }
    onFile(file, result.category!);
  };

  // Called directly from the Paperclip button onClick in the page
  useEffect(() => {
    if (_open) {
      _onClose();
    }
  }, [_open, _onClose]);

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={handleChange}
    />
  );
}
