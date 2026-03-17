import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { STATS, FAULTS, WTU_LIST } from '@/data/mockData';

const severityColor = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-cyan-400',
  resolved: 'text-green-400',
};

const severityBg = {
  critical: 'bg-red-500/10 border-red-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  info: 'bg-cyan-500/10 border-cyan-500/20',
  resolved: 'bg-green-500/10 border-green-500/20',
};

const severityLabel = {
  critical: 'Критическая',
  warning: 'Предупреждение',
  info: 'Информация',
  resolved: 'Устранена',
};

const statusWtuColor: Record<string, string> = {
  online: 'bg-green-400',
  fault: 'bg-red-400 animate-pulse',
  offline: 'bg-gray-500',
  maintenance: 'bg-amber-400',
};

const faultsByCategory = () => {
  const cats: Record<string, number> = {};
  FAULTS.forEach(f => {
    cats[f.category] = (cats[f.category] || 0) + 1;
  });
  return Object.entries(cats).sort((a, b) => b[1] - a[1]);
};

const topFaultWTUs = () => {
  const counts: Record<number, number> = {};
  FAULTS.filter(f => f.status !== 'resolved').forEach(f => {
    counts[f.wtuId] = (counts[f.wtuId] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 7)
    .map(([id, count]) => ({ id: Number(id), name: `ВЭУ-${String(id).padStart(2, '0')}`, count: Number(count) }));
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sub?: string;
  delay?: number;
}

function StatCard({ label, value, icon, color, sub, delay = 0 }: StatCardProps) {
  return (
    <div
      className="card-surface rounded-2xl p-5 flex flex-col gap-3 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div className={`text-3xl font-bold font-mono-data ${color.replace('bg-', 'text-').replace('/20', '').replace('/15', '')}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const recentFaults = FAULTS
    .filter(f => filter === 'all' ? true : f.severity === filter)
    .filter(f => f.status !== 'archived')
    .slice(0, 8);

  const catData = faultsByCategory();
  const maxCat = Math.max(...catData.map(c => c[1]));
  const topWTUs = topFaultWTUs();
  const maxWtu = Math.max(...topWTUs.map(w => w.count));

  const powerMW = (STATS.totalPower / 1000).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Главный дашборд</h1>
          <p className="text-muted-foreground text-sm mt-1">Мониторинг 57 ВЭУ в реальном времени</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Онлайн
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Установок онлайн" value={STATS.online} icon="Wifi" color="bg-green-500/15 text-green-400" sub={`из ${STATS.totalWTU} установок`} delay={0} />
        <StatCard label="Критических" value={STATS.criticalFaults} icon="AlertTriangle" color="bg-red-500/15 text-red-400" sub="требуют срочного внимания" delay={80} />
        <StatCard label="Открытых заявок" value={STATS.openFaults} icon="ClipboardList" color="bg-amber-500/15 text-amber-400" sub="в обработке" delay={160} />
        <StatCard label="Выработка МВт" value={powerMW} icon="Zap" color="bg-cyan-500/15 text-cyan-400" sub="суммарная мощность" delay={240} />
      </div>

      {/* WTU Status Row */}
      <div className="card-surface rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-white">Статус ВЭУ</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {[
              { key: 'online', label: 'Работает', color: 'bg-green-400' },
              { key: 'fault', label: 'Неисправность', color: 'bg-red-400' },
              { key: 'maintenance', label: 'ТО', color: 'bg-amber-400' },
              { key: 'offline', label: 'Выкл.', color: 'bg-gray-500' },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                {s.label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {WTU_LIST.map(wtu => (
            <div
              key={wtu.id}
              className="relative group"
              title={`${wtu.name}: ${wtu.status === 'online' ? 'Работает' : wtu.status === 'fault' ? 'Неисправность' : wtu.status === 'maintenance' ? 'ТО' : 'Выключена'}`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-mono-data font-bold cursor-pointer transition-all hover:scale-125 hover:z-10 ${
                wtu.status === 'online' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                wtu.status === 'fault' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                wtu.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-gray-700/40 text-gray-500 border border-gray-600/30'
              }`}>
                {wtu.id}
              </div>
              {wtu.status === 'fault' && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Faults */}
        <div className="lg:col-span-2 card-surface rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-white">Последние неисправности</span>
            <div className="flex gap-1">
              {(['all', 'critical', 'warning'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filter === f
                      ? f === 'all' ? 'bg-cyan-500/20 text-cyan-400' : f === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Все' : f === 'critical' ? 'Критические' : 'Предупреждения'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {recentFaults.map((fault, idx) => (
              <div
                key={fault.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:bg-white/[0.02] cursor-pointer ${severityBg[fault.severity]}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  fault.severity === 'critical' ? 'bg-red-400' :
                  fault.severity === 'warning' ? 'bg-amber-400' :
                  fault.severity === 'info' ? 'bg-cyan-400' : 'bg-green-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono-data font-bold ${severityColor[fault.severity]}`}>{fault.wtuName}</span>
                    <span className="text-xs text-muted-foreground">{fault.code}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${severityBg[fault.severity]} ${severityColor[fault.severity]}`}>
                      {severityLabel[fault.severity]}
                    </span>
                  </div>
                  <div className="text-sm text-white/80 mt-0.5 truncate">{fault.title}</div>
                </div>
                <div className="text-[11px] text-muted-foreground flex-shrink-0">
                  {new Date(fault.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* By category */}
          <div className="card-surface rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="font-semibold text-white mb-4">По категориям</div>
            <div className="space-y-3">
              {catData.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{cat}</span>
                    <span className="font-mono-data text-cyan-400 font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top WTU by faults */}
          <div className="card-surface rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '450ms' }}>
            <div className="font-semibold text-white mb-4">Топ ВЭУ по числу неисправностей</div>
            <div className="space-y-2">
              {topWTUs.map((wtu, idx) => (
                <div key={wtu.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                  <span className="text-sm font-mono-data text-white/80 w-14">{wtu.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-700"
                      style={{ width: `${(wtu.count / maxWtu) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono-data text-amber-400 font-bold w-4">{wtu.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
