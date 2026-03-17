import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { WTU_LIST, FAULTS, type WTU } from '@/data/mockData';

const statusLabel: Record<string, string> = {
  online: 'Работает',
  fault: 'Неисправность',
  offline: 'Отключена',
  maintenance: 'ТО',
};

const statusColor: Record<string, string> = {
  online: 'text-green-400',
  fault: 'text-red-400',
  offline: 'text-gray-400',
  maintenance: 'text-amber-400',
};

const statusBg: Record<string, string> = {
  online: 'bg-green-500/15 border-green-500/25',
  fault: 'bg-red-500/15 border-red-500/25',
  offline: 'bg-gray-500/15 border-gray-500/25',
  maintenance: 'bg-amber-500/15 border-amber-500/25',
};

const statusDot: Record<string, string> = {
  online: 'bg-green-400',
  fault: 'bg-red-400',
  offline: 'bg-gray-500',
  maintenance: 'bg-amber-400',
};

function WtuCard({ wtu, onClick, selected }: { wtu: WTU; onClick: () => void; selected: boolean }) {
  const faults = FAULTS.filter(f => f.wtuId === wtu.id && f.status !== 'resolved' && f.status !== 'archived');
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
        selected ? 'border-cyan-500/50 bg-cyan-500/10' : `${statusBg[wtu.status]} hover:border-white/20`
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono-data text-sm font-bold text-white">{wtu.name}</span>
        <div className={`w-2 h-2 rounded-full ${statusDot[wtu.status]} ${wtu.status === 'fault' ? 'animate-pulse' : ''}`}></div>
      </div>
      <div className={`text-xs font-medium ${statusColor[wtu.status]}`}>{statusLabel[wtu.status]}</div>
      {wtu.power > 0 && (
        <div className="text-xs text-muted-foreground mt-1 font-mono-data">{wtu.power} кВт</div>
      )}
      {faults.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
          <Icon name="AlertCircle" size={11} />
          {faults.length} неиспр.
        </div>
      )}
    </div>
  );
}

export default function MapView() {
  const [selectedWtu, setSelectedWtu] = useState<WTU | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = WTU_LIST.filter(w => filterStatus === 'all' || w.status === filterStatus);

  const faultsForSelected = selectedWtu
    ? FAULTS.filter(f => f.wtuId === selectedWtu.id && f.status !== 'archived')
    : [];

  const minLat = Math.min(...WTU_LIST.map(w => w.lat));
  const maxLat = Math.max(...WTU_LIST.map(w => w.lat));
  const minLng = Math.min(...WTU_LIST.map(w => w.lng));
  const maxLng = Math.max(...WTU_LIST.map(w => w.lng));

  const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 90 + 5;
  const toY = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat)) * 90 + 5;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Карта ВЭУ</h1>
          <p className="text-muted-foreground text-sm mt-1">Расположение 57 ветровых электроустановок</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'online', 'fault', 'maintenance', 'offline'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === s
                  ? s === 'all' ? 'bg-cyan-500/20 text-cyan-400' :
                    s === 'online' ? 'bg-green-500/20 text-green-400' :
                    s === 'fault' ? 'bg-red-500/20 text-red-400' :
                    s === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-gray-500/20 text-gray-400'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {s === 'all' ? 'Все' : statusLabel[s]}
              <span className="ml-1 font-mono-data">
                ({s === 'all' ? WTU_LIST.length : WTU_LIST.filter(w => w.status === s).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 card-surface rounded-2xl overflow-hidden" style={{ height: '520px' }}>
          <div className="relative w-full h-full grid-bg">
            {/* Decorative grid labels */}
            <div className="absolute top-3 left-3 text-xs text-muted-foreground/40 font-mono-data">ВЭУ КАРТА · 57 ОБЪЕКТОВ</div>

            {/* WTU dots */}
            {WTU_LIST.map(wtu => {
              const x = toX(wtu.lng);
              const y = toY(wtu.lat);
              const isSelected = selectedWtu?.id === wtu.id;
              const isFiltered = filterStatus !== 'all' && wtu.status !== filterStatus;
              return (
                <div
                  key={wtu.id}
                  className="absolute cursor-pointer group"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  onClick={() => setSelectedWtu(wtu === selectedWtu ? null : wtu)}
                >
                  {/* Pulse ring for faults */}
                  {wtu.status === 'fault' && !isFiltered && (
                    <div className="absolute inset-0 w-5 h-5 -m-1 rounded-full bg-red-500/20 animate-ping"></div>
                  )}
                  <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                    isFiltered ? 'opacity-20' : ''
                  } ${
                    isSelected ? 'scale-150 border-cyan-400' : 'border-white/20 hover:scale-125'
                  } ${
                    wtu.status === 'online' ? 'bg-green-400' :
                    wtu.status === 'fault' ? 'bg-red-400' :
                    wtu.status === 'maintenance' ? 'bg-amber-400' : 'bg-gray-500'
                  }`}></div>

                  {/* Tooltip */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-[var(--surface-3)] border border-white/10 text-xs text-white whitespace-nowrap z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <div className="font-mono-data font-bold">{wtu.name}</div>
                    <div className={statusColor[wtu.status]}>{statusLabel[wtu.status]}</div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-3 right-3 card-surface rounded-xl p-3 space-y-1.5">
              {[
                { status: 'online', label: 'Работает' },
                { status: 'fault', label: 'Неисправность' },
                { status: 'maintenance', label: 'ТО' },
                { status: 'offline', label: 'Отключена' },
              ].map(s => (
                <div key={s.status} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${statusDot[s.status]}`}></div>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {selectedWtu ? (
            <div className="card-surface rounded-2xl p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-lg">{selectedWtu.name}</span>
                <button onClick={() => setSelectedWtu(null)} className="text-muted-foreground hover:text-white">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className={`text-sm font-medium mb-3 ${statusColor[selectedWtu.status]}`}>
                {statusLabel[selectedWtu.status]}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="card-surface-3 rounded-xl p-2.5">
                  <div className="text-xs text-muted-foreground">Мощность</div>
                  <div className="text-sm font-mono-data font-bold text-cyan-400">{selectedWtu.power} кВт</div>
                </div>
                <div className="card-surface-3 rounded-xl p-2.5">
                  <div className="text-xs text-muted-foreground">Неисправностей</div>
                  <div className="text-sm font-mono-data font-bold text-red-400">{selectedWtu.faultsCount}</div>
                </div>
              </div>
              {faultsForSelected.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Активные неисправности:</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {faultsForSelected.slice(0, 5).map(f => (
                      <div key={f.id} className={`p-2 rounded-lg text-xs border ${
                        f.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                        f.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                        'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                      }`}>
                        <div className="font-medium truncate">{f.title}</div>
                        <div className="text-muted-foreground font-mono-data mt-0.5">{f.code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card-surface rounded-2xl p-4 text-center text-muted-foreground text-sm py-8">
              <Icon name="MapPin" size={32} className="mx-auto mb-2 opacity-30" />
              Выберите ВЭУ на карте
            </div>
          )}

          {/* Scrollable list */}
          <div className="card-surface rounded-2xl p-3 max-h-72 overflow-y-auto">
            <div className="text-xs text-muted-foreground mb-2 px-1">
              {filterStatus === 'all' ? 'Все установки' : statusLabel[filterStatus]}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(wtu => (
                <WtuCard
                  key={wtu.id}
                  wtu={wtu}
                  onClick={() => setSelectedWtu(wtu === selectedWtu ? null : wtu)}
                  selected={selectedWtu?.id === wtu.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
