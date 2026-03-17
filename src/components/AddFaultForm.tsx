import { useState, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { api, fileToBase64, type User } from '@/lib/api';

interface Props {
  user: User;
  onSuccess: () => void;
}

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Критическая', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  { value: 'warning', label: 'Предупреждение', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  { value: 'info', label: 'Информация', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' },
];

interface PhotoPreview {
  file: File;
  preview: string;
  name: string;
}

export default function AddFaultForm({ user, onSuccess }: Props) {
  const [turbineId, setTurbineId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoPreview[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview, name: file.name });
    });
    setPhotos(p => [...p, ...newPhotos].slice(0, 10));
  }, []);

  const removePhoto = (idx: number) => {
    setPhotos(p => p.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!turbineId) { setError('Выберите турбину'); return; }
    if (!title.trim()) { setError('Введите заголовок'); return; }

    setLoading(true);
    try {
      const { id: faultId } = await api.createFault({
        turbine_id: parseInt(turbineId),
        title: title.trim(),
        description: description.trim(),
        severity,
      }, user);

      if (photos.length > 0) {
        const photoData = await Promise.all(photos.map(async p => ({
          data: await fileToBase64(p.file),
          filename: p.name,
          content_type: p.file.type,
        })));
        await api.uploadPhotos(faultId, photoData, user);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTurbineId('');
        setTitle('');
        setDescription('');
        setSeverity('warning');
        setPhotos([]);
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <Icon name="CheckCircle" size={32} className="text-green-400" />
        </div>
        <div className="text-xl font-bold text-white mb-1">Неисправность добавлена</div>
        <div className="text-muted-foreground text-sm">Запись сохранена в системе</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Добавить неисправность</h1>
        <p className="text-muted-foreground text-sm mt-1">Заполните форму и приложите фотографии</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Turbine + Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Номер турбины *</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              value={turbineId}
              onChange={e => setTurbineId(e.target.value)}
              required
            >
              <option value="">— Выберите ВЭУ —</option>
              {Array.from({ length: 57 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>ВЭУ-{String(n).padStart(2, '0')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Серьёзность *</label>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    severity === opt.value ? `${opt.bg} ${opt.color}` : 'border-white/10 text-muted-foreground hover:text-white bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Заголовок *</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
            placeholder="Кратко опишите неисправность..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Описание</label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all resize-none"
            placeholder="Подробное описание: что произошло, при каких условиях, что уже сделано..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Фотографии (до 10 штук)</label>
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragOver ? 'border-cyan-500/60 bg-cyan-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />
            <Icon name="Camera" size={28} className="mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm text-white/70">Нажмите или перетащите фото</div>
            <div className="text-xs text-muted-foreground mt-1">PNG, JPG, HEIC — до 10 МБ каждое</div>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
              {photos.map((p, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                  <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                      className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center text-white"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white/70 px-1 py-0.5 truncate">
                    {p.name}
                  </div>
                </div>
              ))}
              {photos.length < 10 && (
                <div
                  className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-white/20 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Icon name="Plus" size={20} className="text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 animate-fade-in">
            <Icon name="AlertCircle" size={15} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cyan-500 text-black font-bold text-sm hover:bg-cyan-400 active:scale-[0.99] transition-all disabled:opacity-70"
        >
          {loading ? (
            <><Icon name="Loader2" size={16} className="animate-spin" /> Сохраняю...</>
          ) : (
            <><Icon name="Send" size={16} /> Отправить неисправность</>
          )}
        </button>
      </form>
    </div>
  );
}
