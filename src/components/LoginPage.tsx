import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, type User } from '@/lib/api';

interface Props {
  onLogin: (user: User, token: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(login, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-1)] flex items-center justify-center p-4 grid-bg">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <Icon name="Wind" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ВЭУ Система</h1>
          <p className="text-muted-foreground text-sm mt-1">Управление неисправностями</p>
        </div>

        <form onSubmit={handleSubmit} className="card-surface rounded-2xl p-6 space-y-4 border border-white/[0.07]">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Логин</label>
            <div className="relative">
              <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.07] transition-all"
                placeholder="Введите логин"
                value={login}
                onChange={e => setLogin(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Пароль</label>
            <div className="relative">
              <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? 'text' : 'password'}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500/60 focus:bg-white/[0.07] transition-all"
                placeholder="Введите пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 animate-fade-in">
              <Icon name="AlertCircle" size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 active:scale-95 transition-all disabled:opacity-70 mt-2"
          >
            {loading ? (
              <><Icon name="Loader2" size={16} className="animate-spin" /> Вход...</>
            ) : (
              <><Icon name="LogIn" size={16} /> Войти</>
            )}
          </button>
        </form>

        <div className="mt-4 card-surface rounded-xl p-3 border border-white/[0.05]">
          <div className="text-xs text-muted-foreground mb-2">Тестовые аккаунты:</div>
          <div className="space-y-1 text-xs font-mono-data">
            <div className="flex justify-between"><span className="text-white">admin</span><span className="text-muted-foreground">пароль: password</span></div>
            <div className="flex justify-between"><span className="text-white">ivanov</span><span className="text-muted-foreground">пароль: password</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
