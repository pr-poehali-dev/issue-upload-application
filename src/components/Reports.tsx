import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { STATS, FAULTS, WTU_LIST } from '@/data/mockData';

const REPORT_TYPES = [
  {
    id: 'summary',
    title: 'Сводный отчёт',
    description: 'Общая статистика по всем ВЭУ за период',
    icon: 'BarChart3',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 'critical',
    title: 'Критические неисправности',
    description: 'Детальный список критических событий',
    icon: 'AlertOctagon',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    id: 'wtu',
    title: 'По установке',
    description: 'История и статистика конкретной ВЭУ',
    icon: 'Wind',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    id: 'analytics',
    title: 'Аналитика частоты',
    description: 'Частота неисправностей по категориям и установкам',
    icon: 'TrendingUp',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
];

const catFreq = () => {
  const cats: Record<string, { total: number; critical: number; warning: number }> = {};
  FAULTS.forEach(f => {
    if (!cats[f.category]) cats[f.category] = { total: 0, critical: 0, warning: 0 };
    cats[f.category].total++;
    if (f.severity === 'critical') cats[f.category].critical++;
    if (f.severity === 'warning') cats[f.category].warning++;
  });
  return Object.entries(cats).sort((a, b) => b[1].total - a[1].total);
};

const wtuFreq = () => {
  const counts: Record<number, number> = {};
  FAULTS.forEach(f => { counts[f.wtuId] = (counts[f.wtuId] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 10)
    .map(([id, count]) => ({ id: Number(id), name: `ВЭУ-${String(id).padStart(2, '0')}`, count: Number(count) }));
};

export default function Reports() {
  const [selectedType, setSelectedType] = useState('summary');
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-17');
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 1800);
  };

  const cats = catFreq();
  const maxCat = Math.max(...cats.map(c => c[1].total));
  const wtus = wtuFreq();
  const maxWtu = Math.max(...wtus.map(w => w.count));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Отчёты и аналитика</h1>
          <p className="text-muted-foreground text-sm mt-1">Генерация и выгрузка отчётов по неисправностям</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Report type picker + config */}
        <div className="space-y-4">
          <div className="card-surface rounded-2xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Тип отчёта</div>
            <div className="space-y-2">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.id}
                  onClick={() => setSelectedType(rt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedType === rt.id ? rt.bg : 'border-white/5 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${selectedType === rt.id ? rt.color : 'text-muted-foreground'}`}>
                      <Icon name={rt.icon} size={18} />
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${selectedType === rt.id ? 'text-white' : 'text-white/70'}`}>{rt.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{rt.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="card-surface rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white">Параметры</div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">С даты</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">По дату</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Формат</label>
              <div className="flex gap-1">
                {(['pdf', 'xlsx', 'csv'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium font-mono-data uppercase transition-all ${
                      format === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-muted-foreground hover:text-white border border-transparent'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 active:scale-95 transition-all disabled:opacity-70"
            >
              {downloading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Формирую отчёт...
                </>
              ) : (
                <>
                  <Icon name="Download" size={16} />
                  Выгрузить отчёт
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview / Analytics */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Всего событий', value: STATS.totalFaults, color: 'text-cyan-400' },
              { label: 'Критических', value: STATS.criticalFaults, color: 'text-red-400' },
              { label: 'Устранено', value: STATS.resolvedToday, color: 'text-green-400' },
              { label: 'ВЭУ с неисправн.', value: WTU_LIST.filter(w => w.faultsCount > 0).length, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="card-surface rounded-xl p-3 text-center">
                <div className={`text-2xl font-bold font-mono-data ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Frequency by category */}
          <div className="card-surface rounded-2xl p-5">
            <div className="font-semibold text-white mb-4 flex items-center gap-2">
              <Icon name="BarChart3" size={16} className="text-cyan-400" />
              Частота по категориям
            </div>
            <div className="space-y-3">
              {cats.map(([cat, data]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/80">{cat}</span>
                    <div className="flex gap-3 text-xs font-mono-data">
                      <span className="text-red-400">Крит: {data.critical}</span>
                      <span className="text-amber-400">Пред: {data.warning}</span>
                      <span className="text-white font-bold">{data.total}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                    <div
                      className="h-full bg-red-500/60 transition-all duration-700"
                      style={{ width: `${(data.critical / maxCat) * 100}%` }}
                    ></div>
                    <div
                      className="h-full bg-amber-500/60 transition-all duration-700"
                      style={{ width: `${(data.warning / maxCat) * 100}%` }}
                    ></div>
                    <div
                      className="h-full bg-cyan-500/30 transition-all duration-700"
                      style={{ width: `${((data.total - data.critical - data.warning) / maxCat) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500/60"></div>Критические</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-500/60"></div>Предупреждения</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-cyan-500/30"></div>Прочие</div>
            </div>
          </div>

          {/* Top WTU frequency */}
          <div className="card-surface rounded-2xl p-5">
            <div className="font-semibold text-white mb-4 flex items-center gap-2">
              <Icon name="TrendingUp" size={16} className="text-amber-400" />
              ТОП-10 ВЭУ по количеству неисправностей
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {wtus.map((wtu, idx) => (
                <div key={wtu.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4 font-mono-data">{idx + 1}</span>
                  <span className="text-sm font-mono-data font-bold text-white w-16">{wtu.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-700"
                      style={{ width: `${(wtu.count / maxWtu) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono-data text-amber-400 w-4 text-right">{wtu.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
