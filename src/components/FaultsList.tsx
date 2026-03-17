import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { api, type Fault, type FaultPhoto, type User } from '@/lib/api';

const SEV_LABEL: Record<string, string> = { critical: 'Критическая', warning: 'Предупреждение', info: 'Информация' };
const SEV_STYLE: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
};
const ST_LABEL: Record<string, string> = { open: 'Открыта', in_progress: 'В работе', resolved: 'Устранена' };
const ST_STYLE: Record<string, string> = {
  open: 'bg-red-500/10 text-red-300',
  in_progress: 'bg-amber-500/10 text-amber-300',
  resolved: 'bg-green-500/10 text-green-300',
};

function PhotoModal({ photos, startIdx, onClose }: { photos: FaultPhoto[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
        <img src={photos[idx].url} alt={photos[idx].filename} className="w-full max-h-[80vh] object-contain rounded-2xl" />
        <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
          <Icon name="X" size={16} />
        </button>
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
            >
              <Icon name="ChevronLeft" size={20} />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % photos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
            >
              <Icon name="ChevronRight" size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/70 font-mono-data bg-black/50 px-2 py-1 rounded-full">
              {idx + 1} / {photos.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FaultCard({ fault, user, onStatusChange }: { fault: Fault; user: User; onStatusChange: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [photos, setPhotos] = useState<FaultPhoto[]>([]);
  const [photoModal, setPhotoModal] = useState<{ idx: number } | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadPhotos = useCallback(async () => {
    if (photos.length > 0 || fault.photo_count === 0) return;
    setLoadingPhotos(true);
    try {
      const res = await api.getPhotos(fault.id);
      setPhotos(res.photos);
    } finally {
      setLoadingPhotos(false);
    }
  }, [fault.id, fault.photo_count, photos.length]);

  const handleExpand = () => {
    if (!expanded) loadPhotos();
    setExpanded(p => !p);
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await api.updateStatus(fault.id, newStatus, user);
      onStatusChange();
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className={`card-surface rounded-2xl border overflow-hidden transition-all ${
      fault.severity === 'critical' ? 'border-red-500/20' :
      fault.severity === 'warning' ? 'border-amber-500/15' : 'border-white/[0.06]'
    }`}>
      {photoModal && photos.length > 0 && (
        <PhotoModal photos={photos} startIdx={photoModal.idx} onClose={() => setPhotoModal(null)} />
      )}

      <div className="p-4 cursor-pointer" onClick={handleExpand}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-mono-data text-sm font-bold text-white">
                ВЭУ-{String(fault.turbine_id).padStart(2, '0')}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${SEV_STYLE[fault.severity]}`}>
                {SEV_LABEL[fault.severity]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${ST_STYLE[fault.status]}`}>
                {ST_LABEL[fault.status]}
              </span>
            </div>
            <div className="text-sm text-white font-medium">{fault.title}</div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="User" size={11} />
                {fault.author_name || '—'}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Clock" size={11} />
                {new Date(fault.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              {fault.photo_count > 0 && (
                <span className="flex items-center gap-1 text-cyan-400/70">
                  <Icon name="Camera" size={11} />
                  {fault.photo_count} фото
                </span>
              )}
            </div>
          </div>
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.05] px-4 pb-4 pt-3 space-y-3 animate-fade-in">
          {fault.description && (
            <p className="text-sm text-white/70 leading-relaxed">{fault.description}</p>
          )}

          {/* Photos */}
          {fault.photo_count > 0 && (
            <div>
              {loadingPhotos ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Loader2" size={13} className="animate-spin" /> Загружаю фото...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-500/40 transition-all hover:scale-105"
                      onClick={() => setPhotoModal({ idx })}
                    >
                      <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status change for admin */}
          {user.role === 'admin' && fault.status !== 'resolved' && (
            <div className="flex gap-2 pt-1">
              {fault.status === 'open' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updatingStatus}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25 transition-all disabled:opacity-50"
                >
                  Взять в работу
                </button>
              )}
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={updatingStatus}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25 transition-all disabled:opacity-50"
              >
                {updatingStatus ? <Icon name="Loader2" size={12} className="animate-spin" /> : 'Отметить устранённой'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  user: User;
  refreshKey: number;
}

export default function FaultsList({ user, refreshKey }: Props) {
  const [faults, setFaults] = useState<Fault[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [turbineFilter, setTurbineFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: PER_PAGE, offset: (page - 1) * PER_PAGE };
      if (turbineFilter) params.turbine_id = turbineFilter;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.getFaults(params, user);
      setFaults(res.faults);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [turbineFilter, severityFilter, statusFilter, page, refreshKey, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [turbineFilter, severityFilter, statusFilter]);

  const handleExport = () => {
    const url = api.getExportUrl(turbineFilter ? parseInt(turbineFilter) : undefined);
    window.open(url, '_blank');
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">История неисправностей</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} записей</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 text-sm font-medium hover:bg-green-500/25 transition-all"
        >
          <Icon name="Download" size={15} />
          Выгрузить CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
          value={turbineFilter}
          onChange={e => setTurbineFilter(e.target.value)}
        >
          <option value="">Все турбины</option>
          {Array.from({ length: 57 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>ВЭУ-{String(n).padStart(2, '0')}</option>
          ))}
        </select>

        <select
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
        >
          <option value="">Все уровни</option>
          <option value="critical">Критическая</option>
          <option value="warning">Предупреждение</option>
          <option value="info">Информация</option>
        </select>

        <select
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="open">Открыта</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Устранена</option>
        </select>

        <button onClick={load} className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Icon name="Loader2" size={20} className="animate-spin" />
          Загружаю...
        </div>
      ) : faults.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Icon name="ClipboardX" size={40} className="mx-auto mb-3 opacity-30" />
          <div>Неисправностей не найдено</div>
        </div>
      ) : (
        <div className="space-y-3">
          {faults.map(fault => (
            <FaultCard key={fault.id} fault={fault} user={user} onStatusChange={load} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
            <Icon name="ChevronLeft" size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${p === page ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
