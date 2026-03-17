import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { api, type Stats } from '@/lib/api';

export default function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Icon name="Loader2" size={20} className="animate-spin" />
        Загружаю статистику...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Icon name="AlertCircle" size={32} className="mx-auto mb-2 opacity-30" />
        Не удалось загрузить статистику
      </div>
    );
  }

  const { totals, by_turbine, by_day } = stats;
  const maxTurbine = Math.max(...by_turbine.map(t => t.total), 1);
  const maxDay = Math.max(...by_day.map(d => d.count), 1);

  const top10 = by_turbine.slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Статистика</h1>
        <p className="text-muted-foreground text-sm mt-1">Аналитика по неисправностям всех ВЭУ</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Всего неисправностей', value: totals.total, icon: 'ClipboardList', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Критических', value: totals.critical, icon: 'AlertOctagon', color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Открытых', value: totals.open, icon: 'Clock', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Устранено', value: totals.resolved, icon: 'CheckCircle', color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map((item, i) => (
          <div key={item.label} className="card-surface rounded-2xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                <Icon name={item.icon} size={15} />
              </div>
            </div>
            <div className={`text-3xl font-bold font-mono-data ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top turbines */}
        <div className="card-surface rounded-2xl p-5">
          <div className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="BarChart3" size={16} className="text-cyan-400" />
            Топ-10 ВЭУ по неисправностям
          </div>
          {top10.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Нет данных</div>
          ) : (
            <div className="space-y-2.5">
              {top10.map((t, idx) => (
                <div key={t.turbine_id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4 font-mono-data">{idx + 1}</span>
                      <span className="font-mono-data font-bold text-white">ВЭУ-{String(t.turbine_id).padStart(2, '0')}</span>
                      {t.critical > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">
                          {t.critical} крит.
                        </span>
                      )}
                    </div>
                    <span className="font-mono-data text-white font-bold">{t.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(t.total / maxTurbine) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By day */}
        <div className="card-surface rounded-2xl p-5">
          <div className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="TrendingUp" size={16} className="text-amber-400" />
            Динамика по дням
          </div>
          {by_day.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Нет данных</div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {by_day.slice(0, 14).map(d => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono-data w-20 flex-shrink-0">
                    {new Date(d.day).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                      style={{ width: `${(d.count / maxDay) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono-data text-amber-400 font-bold w-5 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Severity breakdown */}
      <div className="card-surface rounded-2xl p-5">
        <div className="font-semibold text-white mb-4">Распределение по серьёзности</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Критические', value: totals.critical, total: totals.total, color: 'bg-red-500', textColor: 'text-red-400' },
            { label: 'Предупреждения', value: totals.warning, total: totals.total, color: 'bg-amber-500', textColor: 'text-amber-400' },
            { label: 'Информация', value: totals.info, total: totals.total, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
          ].map(item => {
            const pct = totals.total > 0 ? Math.round((item.value / totals.total) * 100) : 0;
            return (
              <div key={item.label} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={item.color.replace('bg-', '').includes('red') ? '#f87171' : item.color.includes('amber') ? '#fbbf24' : '#22d3ee'}
                      strokeWidth="3"
                      strokeDasharray={`${pct} ${100 - pct}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.7s ease' }}
                    />
                  </svg>
                  <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold font-mono-data ${item.textColor}`}>
                    {pct}%
                  </div>
                </div>
                <div className="text-sm text-white font-medium">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export */}
      <div className="card-surface rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">Выгрузить полный отчёт</div>
          <div className="text-xs text-muted-foreground mt-0.5">Все неисправности в формате CSV</div>
        </div>
        <button
          onClick={() => window.open(api.getExportUrl(), '_blank')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 text-sm font-medium hover:bg-green-500/25 transition-all"
        >
          <Icon name="FileDown" size={15} />
          Скачать CSV
        </button>
      </div>
    </div>
  );
}
