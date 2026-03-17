import { useState } from 'react';
import Icon from '@/components/ui/icon';

const USERS = [
  { id: 1, name: 'Петров Алексей Владимирович', email: 'petrov@wind-energy.ru', role: 'admin', status: 'active', lastLogin: '2026-03-17T09:12:00' },
  { id: 2, name: 'Сидоров Константин Михайлович', email: 'sidorov@wind-energy.ru', role: 'engineer', status: 'active', lastLogin: '2026-03-16T18:44:00' },
  { id: 3, name: 'Иванова Елена Николаевна', email: 'ivanova@wind-energy.ru', role: 'engineer', status: 'active', lastLogin: '2026-03-15T11:20:00' },
  { id: 4, name: 'Козлов Дмитрий Сергеевич', email: 'kozlov@wind-energy.ru', role: 'viewer', status: 'inactive', lastLogin: '2026-03-10T08:05:00' },
  { id: 5, name: 'Новиков Павел Александрович', email: 'novikov@wind-energy.ru', role: 'engineer', status: 'active', lastLogin: '2026-03-17T07:30:00' },
];

const roleLabel: Record<string, string> = {
  admin: 'Администратор',
  engineer: 'Инженер',
  viewer: 'Наблюдатель',
};

const roleStyle: Record<string, string> = {
  admin: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  engineer: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  viewer: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
};

const TABS = [
  { id: 'users', label: 'Пользователи', icon: 'Users' },
  { id: 'notifications', label: 'Уведомления', icon: 'Bell' },
  { id: 'system', label: 'Система', icon: 'Settings' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');
  const [notifSettings, setNotifSettings] = useState({
    emailCritical: true,
    emailWarning: false,
    smsСritical: true,
    telegramAll: false,
    autoAssign: true,
    dailyReport: true,
  });

  const toggleNotif = (key: keyof typeof notifSettings) => {
    setNotifSettings(p => ({ ...p, [key]: !p[key] }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-1">Управление пользователями, правами и системными параметрами</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 card-surface rounded-2xl p-1.5 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Icon name={tab.icon} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{USERS.length} пользователей</div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 text-sm font-medium hover:bg-cyan-500/25 transition-all">
              <Icon name="UserPlus" size={15} />
              Добавить пользователя
            </button>
          </div>

          <div className="card-surface rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Пользователь', 'Email', 'Роль', 'Последний вход', 'Статус', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USERS.map(user => (
                  <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                          {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="text-sm text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${roleStyle[user.role]}`}>
                        {roleLabel[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono-data text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${user.status === 'active' ? 'text-green-400' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                        {user.status === 'active' ? 'Активен' : 'Неактивен'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-muted-foreground hover:text-white transition-colors">
                        <Icon name="MoreVertical" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Roles info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { role: 'admin', label: 'Администратор', desc: 'Полный доступ ко всем функциям системы, управление пользователями', icon: 'Shield' },
              { role: 'engineer', label: 'Инженер', desc: 'Просмотр и редактирование неисправностей, формирование отчётов', icon: 'Wrench' },
              { role: 'viewer', label: 'Наблюдатель', desc: 'Просмотр данных без возможности редактирования', icon: 'Eye' },
            ].map(r => (
              <div key={r.role} className={`p-4 rounded-xl border ${roleStyle[r.role].includes('cyan') ? 'bg-cyan-500/5 border-cyan-500/15' : r.role === 'engineer' ? 'bg-amber-500/5 border-amber-500/15' : 'bg-gray-500/5 border-gray-500/15'}`}>
                <div className={`flex items-center gap-2 mb-2 font-medium text-sm ${roleStyle[r.role].split(' ')[1]}`}>
                  <Icon name={r.icon} size={15} />
                  {r.label}
                </div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-surface rounded-2xl p-5">
            <div className="font-semibold text-white mb-4">Правила уведомлений</div>
            <div className="space-y-3">
              {[
                { key: 'emailCritical' as const, label: 'Email при критических неисправностях', sub: 'Мгновенная отправка на все адреса администраторов' },
                { key: 'emailWarning' as const, label: 'Email при предупреждениях', sub: 'Отправка сводки раз в час' },
                { key: 'smsСritical' as const, label: 'SMS при критических неисправностях', sub: 'Отправка на номера ответственных' },
                { key: 'telegramAll' as const, label: 'Telegram-уведомления', sub: 'Все события в телеграм-канал' },
                { key: 'autoAssign' as const, label: 'Автоназначение исполнителя', sub: 'Автоматически назначать ответственного по категории' },
                { key: 'dailyReport' as const, label: 'Ежедневный отчёт', sub: 'Отправка сводки каждый день в 08:00' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                  <div>
                    <div className="text-sm text-white font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                  </div>
                  <button
                    onClick={() => toggleNotif(item.key)}
                    className={`relative w-11 h-6 rounded-full transition-all ${notifSettings[item.key] ? 'bg-cyan-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifSettings[item.key] ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Версия системы', value: '1.0.0-beta', icon: 'Tag' },
              { label: 'База данных', value: 'PostgreSQL 15.3', icon: 'Database' },
              { label: 'Последнее обновление', value: '2026-03-17', icon: 'RefreshCw' },
              { label: 'Статус сервера', value: 'Онлайн', icon: 'Server', ok: true },
            ].map(item => (
              <div key={item.label} className="card-surface rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                  <Icon name={item.icon} size={18} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className={`text-sm font-medium font-mono-data ${item.ok ? 'text-green-400' : 'text-white'}`}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-surface rounded-2xl p-5">
            <div className="font-semibold text-white mb-4">Параметры системы</div>
            <div className="space-y-4">
              {[
                { label: 'Интервал опроса данных', placeholder: '60', unit: 'сек' },
                { label: 'Порог критической вибрации', placeholder: '12.5', unit: 'мм/с' },
                { label: 'Макс. температура генератора', placeholder: '85', unit: '°C' },
                { label: 'Порог критической мощности', placeholder: '500', unit: 'кВт' },
              ].map(param => (
                <div key={param.label} className="flex items-center gap-4">
                  <label className="text-sm text-white/80 flex-1">{param.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-right w-24 font-mono-data focus:outline-none focus:border-cyan-500/50 transition-all"
                      defaultValue={param.placeholder}
                    />
                    <span className="text-xs text-muted-foreground w-8">{param.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 px-5 py-2 rounded-xl bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-all">
              Сохранить настройки
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
