import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { FAULTS, type FaultSeverity } from '@/data/mockData';

const severityIcon: Record<FaultSeverity, string> = {
  critical: 'AlertOctagon',
  warning: 'AlertTriangle',
  info: 'Info',
  resolved: 'CheckCircle',
};

const severityColor: Record<FaultSeverity, string> = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-cyan-400',
  resolved: 'text-green-400',
};

const severityBg: Record<FaultSeverity, string> = {
  critical: 'bg-red-500/10 border-red-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  info: 'bg-cyan-500/10 border-cyan-500/20',
  resolved: 'bg-green-500/10 border-green-500/20',
};

const severityLabel: Record<FaultSeverity, string> = {
  critical: 'Критическая',
  warning: 'Предупреждение',
  info: 'Информация',
  resolved: 'Устранена',
};

export default function History() {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-17');
  const [wtuFilter, setWtuFilter] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  const filtered = useMemo(() => {
    return FAULTS
      .filter(f => {
        const d = new Date(f.createdAt);
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        const matchDate = d >= from && d <= to;
        const matchWtu = !wtuFilter || f.wtuName.toLowerCase().includes(wtuFilter.toLowerCase());
        return matchDate && matchWtu;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [dateFrom, dateTo, wtuFilter]);

  const byDay = useMemo(() => {
    const groups: Record<string, typeof FAULTS> = {};
    filtered.forEach(f => {
      const day = f.createdAt.slice(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day].push(f);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">История неисправностей</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} событий за выбранный период</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-all">
          <Icon name="Archive" size={16} />
          Архив
        </button>
      </div>

      {/* Filters */}
      <div className="card-surface rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">С:</label>
          <input
            type="date"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">По:</label>
          <input
            type="date"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500/50 transition-all w-40"
            placeholder="Фильтр ВЭУ..."
            value={wtuFilter}
            onChange={e => setWtuFilter(e.target.value)}
          />
        </div>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setViewMode('timeline')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
          >
            <Icon name="AlignLeft" size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
          >
            <Icon name="Table" size={16} />
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div className="space-y-6">
          {byDay.map(([day, faults]) => (
            <div key={day} className="animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-sm font-semibold text-white">
                  {new Date(day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="flex-1 h-px bg-white/5"></div>
                <div className="text-xs text-muted-foreground font-mono-data">{faults.length} событий</div>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-white/5">
                {faults.map((fault, i) => (
                  <div key={fault.id} className={`relative flex gap-4 p-3 rounded-xl border transition-all hover:bg-white/[0.02] cursor-pointer ${severityBg[fault.severity]}`}
                    style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-[var(--surface-1)] bg-current flex-shrink-0"
                      style={{ color: fault.severity === 'critical' ? '#f87171' : fault.severity === 'warning' ? '#fbbf24' : fault.severity === 'info' ? '#22d3ee' : '#4ade80' }}>
                    </div>
                    <div className={`mt-0.5 flex-shrink-0 ${severityColor[fault.severity]}`}>
                      <Icon name={severityIcon[fault.severity]} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-xs font-mono-data font-bold ${severityColor[fault.severity]}`}>{fault.wtuName}</span>
                        <span className="text-xs text-muted-foreground">{fault.code}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${severityBg[fault.severity]} ${severityColor[fault.severity]}`}>
                          {severityLabel[fault.severity]}
                        </span>
                      </div>
                      <div className="text-sm text-white/80">{fault.title}</div>
                      {fault.assignee && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Icon name="User" size={10} />
                          {fault.assignee}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono-data text-muted-foreground flex-shrink-0">
                      {new Date(fault.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-surface rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Дата/Время', 'ВЭУ', 'Неисправность', 'Уровень', 'Исполнитель', 'Код'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(fault => (
                <tr key={fault.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono-data text-muted-foreground whitespace-nowrap">
                    {new Date(fault.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono-data font-bold text-white">{fault.wtuName}</td>
                  <td className="px-4 py-3 text-sm text-white/80 max-w-xs truncate">{fault.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${severityBg[fault.severity]} ${severityColor[fault.severity]}`}>
                      {severityLabel[fault.severity]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fault.assignee || '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono-data text-cyan-400">{fault.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
