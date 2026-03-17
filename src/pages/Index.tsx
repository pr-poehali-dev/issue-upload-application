import { useState } from 'react';
import Icon from '@/components/ui/icon';
import Dashboard from '@/components/Dashboard';
import Registry from '@/components/Registry';
import History from '@/components/History';
import MapView from '@/components/MapView';
import Reports from '@/components/Reports';
import Settings from '@/components/Settings';
import { STATS } from '@/data/mockData';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'registry', label: 'Реестр', icon: 'ClipboardList' },
  { id: 'history', label: 'История', icon: 'History' },
  { id: 'map', label: 'Карта ВЭУ', icon: 'Map' },
  { id: 'reports', label: 'Отчёты', icon: 'FileBarChart' },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'registry': return <Registry />;
      case 'history': return <History />;
      case 'map': return <MapView />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-1)] flex font-golos">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 transition-all duration-300 flex flex-col border-r border-white/[0.06] bg-[var(--surface-2)]`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/[0.06]">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Icon name="Wind" size={16} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-none">ВЭУ Система</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">57 установок</div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto">
              <Icon name="Wind" size={16} className="text-white" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group relative ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-muted-foreground hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-cyan-400"></div>
                )}
                <Icon name={item.icon} size={18} />
                {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}

                {item.id === 'registry' && STATS.criticalFaults > 0 && sidebarOpen && (
                  <span className="ml-auto text-[10px] font-mono-data font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400">
                    {STATS.criticalFaults}
                  </span>
                )}

                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-[var(--surface-3)] border border-white/10 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/[0.06] animate-fade-in">
            <div className="card-surface-3 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Онлайн</span>
                <span className="text-green-400 font-mono-data font-bold">{STATS.online}/57</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Критических</span>
                <span className="text-red-400 font-mono-data font-bold">{STATS.criticalFaults}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                  style={{ width: `${(STATS.online / 57) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="m-3 p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
        >
          <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={16} />
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[var(--surface-2)]/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-base font-semibold text-white">
              {NAV_ITEMS.find(n => n.id === activeSection)?.label}
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              / ВЭУ Система управления неисправностями
            </div>
          </div>

          <div className="flex items-center gap-3">
            {STATS.criticalFaults > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-pulse-slow">
                <Icon name="AlertTriangle" size={13} />
                {STATS.criticalFaults} критических
              </div>
            )}

            <button className="relative w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
              <Icon name="Bell" size={17} />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400"></div>
            </button>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/40 to-blue-600/30 flex items-center justify-center text-xs font-bold text-cyan-400 border border-cyan-500/20">
              АП
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 grid-bg">
          <div key={activeSection} className="animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
