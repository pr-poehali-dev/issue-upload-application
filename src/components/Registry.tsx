import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { FAULTS, type Fault, type FaultSeverity, type FaultStatus } from '@/data/mockData';

const severityLabel: Record<FaultSeverity, string> = {
  critical: 'Критическая',
  warning: 'Предупреждение',
  info: 'Информация',
  resolved: 'Устранена',
};

const statusLabel: Record<FaultStatus, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  resolved: 'Устранена',
  archived: 'В архиве',
};

const severityStyle: Record<FaultSeverity, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  info: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
  resolved: 'bg-green-500/15 text-green-400 border border-green-500/25',
};

const statusStyle: Record<FaultStatus, string> = {
  open: 'bg-red-500/10 text-red-300',
  in_progress: 'bg-amber-500/10 text-amber-300',
  resolved: 'bg-green-500/10 text-green-300',
  archived: 'bg-gray-500/10 text-gray-400',
};

function FaultDetailModal({ fault, onClose }: { fault: Fault; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div
        className="relative card-surface rounded-2xl p-6 w-full max-w-lg animate-fade-in border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${severityStyle[fault.severity]}`}>
                {severityLabel[fault.severity]}
              </span>
              <span className="text-xs text-muted-foreground font-mono-data">{fault.code}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{fault.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors ml-4">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Установка', value: fault.wtuName },
            { label: 'Статус', value: statusLabel[fault.status] },
            { label: 'Категория', value: fault.category },
            { label: 'Ответственный', value: fault.assignee || '—' },
            { label: 'Создана', value: new Date(fault.createdAt).toLocaleString('ru-RU') },
            { label: 'Обновлена', value: new Date(fault.updatedAt).toLocaleString('ru-RU') },
          ].map(item => (
            <div key={item.label} className="card-surface-3 rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className="text-sm font-medium text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="card-surface-3 rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1">Описание</div>
          <div className="text-sm text-white/80">{fault.description}</div>
        </div>
      </div>
    </div>
  );
}

export default function Registry() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const filtered = useMemo(() => {
    return FAULTS.filter(f => {
      const matchSearch = search === '' ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.wtuName.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severityFilter === 'all' || f.severity === severityFilter;
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [search, severityFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-5 animate-fade-in">
      {selectedFault && <FaultDetailModal fault={selectedFault} onClose={() => setSelectedFault(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Реестр неисправностей</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} записей</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 text-sm font-medium hover:bg-cyan-500/25 transition-all">
          <Icon name="Plus" size={16} />
          Добавить неисправность
        </button>
      </div>

      {/* Filters */}
      <div className="card-surface rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
            placeholder="Поиск по названию, установке, коду..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
          value={severityFilter}
          onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
        >
          <option value="all">Все уровни</option>
          <option value="critical">Критическая</option>
          <option value="warning">Предупреждение</option>
          <option value="info">Информация</option>
          <option value="resolved">Устранена</option>
        </select>
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">Все статусы</option>
          <option value="open">Открыта</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Устранена</option>
          <option value="archived">В архиве</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Код</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">ВЭУ</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Неисправность</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Уровень</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Статус</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Категория</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Дата</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((fault, idx) => (
                <tr
                  key={fault.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedFault(fault)}
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono-data text-xs text-cyan-400">{fault.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono-data text-sm font-bold text-white">{fault.wtuName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white/80 line-clamp-1 max-w-xs">{fault.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${severityStyle[fault.severity]}`}>
                      {severityLabel[fault.severity]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusStyle[fault.status]}`}>
                      {statusLabel[fault.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{fault.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground font-mono-data">
                      {new Date(fault.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-muted-foreground">
              Стр. {page} из {totalPages} ({filtered.length} записей)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                <Icon name="ChevronLeft" size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      p === page ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
