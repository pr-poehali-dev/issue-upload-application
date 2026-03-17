const AUTH_URL = 'https://functions.poehali.dev/16f61262-94f1-41d5-9ec0-a23bbf2e0dfd';
const FAULTS_URL = 'https://functions.poehali.dev/6803665d-dc53-4369-b4a5-39012c843779';
const UPLOAD_URL = 'https://functions.poehali.dev/328c02a5-0d78-47bd-a88e-fdc336aef030';

export interface User {
  id: number;
  name: string;
  login: string;
  role: 'admin' | 'worker';
}

export interface Fault {
  id: number;
  turbine_id: number;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'in_progress' | 'resolved';
  author_name: string;
  created_at: string;
  updated_at: string;
  photo_count: number;
}

export interface FaultPhoto {
  id: number;
  url: string;
  filename: string;
  uploaded_at: string;
}

export interface Stats {
  totals: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    open: number;
    in_progress: number;
    resolved: number;
  };
  by_turbine: { turbine_id: number; total: number; critical: number; resolved: number }[];
  by_day: { day: string; count: number }[];
}

function getHeaders(user?: User | null): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) h['X-Auth-Token'] = token;
  if (user) h['X-User-Id'] = String(user.id);
  return h;
}

export const api = {
  async login(login: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка входа');
    return data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: { 'X-Auth-Token': token },
    });
  },

  async getFaults(params: Record<string, string | number> = {}, user?: User | null): Promise<{ faults: Fault[]; total: number }> {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    const res = await fetch(`${FAULTS_URL}/${qs ? '?' + qs : ''}`, { headers: getHeaders(user) });
    return res.json();
  },

  async createFault(data: { turbine_id: number; title: string; description: string; severity: string }, user: User): Promise<{ id: number }> {
    const res = await fetch(`${FAULTS_URL}/`, {
      method: 'POST',
      headers: getHeaders(user),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Ошибка создания');
    return json;
  },

  async updateStatus(faultId: number, status: string, user: User): Promise<void> {
    await fetch(`${FAULTS_URL}/${faultId}/status`, {
      method: 'PUT',
      headers: getHeaders(user),
      body: JSON.stringify({ status }),
    });
  },

  async getStats(): Promise<Stats> {
    const res = await fetch(`${FAULTS_URL}/stats`);
    return res.json();
  },

  async uploadPhotos(faultId: number, photos: { data: string; filename: string; content_type: string }[], user: User): Promise<{ urls: { url: string; filename: string }[] }> {
    const res = await fetch(`${UPLOAD_URL}/${faultId}`, {
      method: 'POST',
      headers: getHeaders(user),
      body: JSON.stringify({ photos }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Ошибка загрузки');
    return json;
  },

  async getPhotos(faultId: number): Promise<{ photos: FaultPhoto[] }> {
    const res = await fetch(`${UPLOAD_URL}/${faultId}`);
    return res.json();
  },

  getExportUrl(turbineId?: number): string {
    const qs = turbineId ? `?turbine_id=${turbineId}` : '';
    return `${FAULTS_URL}/export${qs}`;
  },
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
