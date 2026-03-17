import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import LoginPage from '@/components/LoginPage';
import AddFaultForm from '@/components/AddFaultForm';
import FaultsList from '@/components/FaultsList';
import StatsView from '@/components/StatsView';
import { type User } from '@/lib/api';

const NAV = [
  { id: 'add', label: 'Добавить', icon: 'PlusCircle' },
  { id: 'list', label: 'История', icon: 'ClipboardList' },
  { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
];

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState('add');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setSection('add');
  };

  const handleLogout = async () => {
    const { api } = await import('@/lib/api');
    await api.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleFaultAdded = () => {
    setRefreshKey(k => k + 1);
    setSection('list');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[var(--surface-1)] flex flex-col font-golos">
      {/* Header */}
      <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 bg-[var(--surface-2)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon name="Wind" size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-white leading-none">ВЭУ Система</div>
            <div className="text-[10px] text-muted-foreground">57 установок</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <span>{user.name}</span>
            {user.role === 'admin' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">Адм</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            <Icon name="LogOut" size={15} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="border-b border-white/[0.06] bg-[var(--surface-2)]/60 flex-shrink-0">
        <div className="flex px-4 sm:px-6">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                section === item.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-muted-foreground hover:text-white'
              }`}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 grid-bg">
        <div key={section} className="max-w-3xl mx-auto animate-fade-in">
          {section === 'add' && <AddFaultForm user={user} onSuccess={handleFaultAdded} />}
          {section === 'list' && <FaultsList user={user} refreshKey={refreshKey} />}
          {section === 'stats' && <StatsView />}
        </div>
      </main>
    </div>
  );
}
