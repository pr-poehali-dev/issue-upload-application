export type FaultSeverity = 'critical' | 'warning' | 'info' | 'resolved';
export type FaultStatus = 'open' | 'in_progress' | 'resolved' | 'archived';

export interface Fault {
  id: string;
  wtuId: number;
  wtuName: string;
  title: string;
  description: string;
  severity: FaultSeverity;
  status: FaultStatus;
  category: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignee?: string;
  code: string;
}

export interface WTU {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'fault' | 'offline' | 'maintenance';
  power: number;
  faultsCount: number;
  lastCheck: string;
}

export const WTU_LIST: WTU[] = Array.from({ length: 57 }, (_, i) => {
  const id = i + 1;
  const statuses: Array<'online' | 'fault' | 'offline' | 'maintenance'> = ['online', 'online', 'online', 'fault', 'online', 'maintenance', 'online', 'fault', 'offline'];
  const status = statuses[id % statuses.length];
  return {
    id,
    name: `ВЭУ-${String(id).padStart(2, '0')}`,
    lat: 55.5 + (id * 0.07 % 1.5),
    lng: 37.2 + (id * 0.09 % 2.0),
    status,
    power: status === 'online' ? Math.round(1200 + Math.random() * 800) : status === 'fault' ? Math.round(200 + Math.random() * 600) : 0,
    faultsCount: status === 'fault' ? Math.floor(Math.random() * 5) + 1 : status === 'maintenance' ? Math.floor(Math.random() * 3) : 0,
    lastCheck: `2026-03-${String(Math.floor(Math.random() * 17) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
  };
});

const FAULT_TITLES = [
  'Вибрация главного вала превышает норму',
  'Перегрев генератора',
  'Отказ системы ориентации на ветер',
  'Утечка масла в редукторе',
  'Сбой системы управления лопастями',
  'Превышение скорости вращения ротора',
  'Неисправность инвертора',
  'Обрыв цепи измерения температуры',
  'Ошибка датчика скорости ветра',
  'Неисправность тормозной системы',
  'Сигнал вибрации у основания башни',
  'Сбой системы смазки',
  'Отключение защиты от перегрузки',
  'Нарушение изоляции кабеля',
  'Ошибка коммуникации с SCADA',
];

const CATEGORIES = ['Механика', 'Электрика', 'Управление', 'Гидравлика', 'Связь'];
const ASSIGNEES = ['Петров А.В.', 'Сидоров К.М.', 'Иванова Е.Н.', 'Козлов Д.С.', 'Новиков П.А.'];
const SEVERITIES: FaultSeverity[] = ['critical', 'warning', 'info', 'resolved'];
const STATUSES: FaultStatus[] = ['open', 'in_progress', 'resolved', 'archived'];

export const FAULTS: Fault[] = Array.from({ length: 120 }, (_, i) => {
  const id = i + 1;
  const wtuId = (id % 57) + 1;
  const severity = SEVERITIES[id % SEVERITIES.length];
  const status: FaultStatus = severity === 'resolved' ? 'resolved' : STATUSES[id % STATUSES.length];
  const day = String(Math.floor(i % 17) + 1).padStart(2, '0');
  const hour = String(Math.floor(i % 24)).padStart(2, '0');
  return {
    id: `F-${String(id).padStart(4, '0')}`,
    wtuId,
    wtuName: `ВЭУ-${String(wtuId).padStart(2, '0')}`,
    title: FAULT_TITLES[id % FAULT_TITLES.length],
    description: `Зафиксировано автоматической системой мониторинга. Требуется проверка узла на объекте ${wtuId}.`,
    severity,
    status,
    category: CATEGORIES[id % CATEGORIES.length],
    createdAt: `2026-03-${day}T${hour}:${String(id % 60).padStart(2, '0')}:00`,
    updatedAt: `2026-03-${day}T${String((Number(hour) + 1) % 24).padStart(2, '0')}:00:00`,
    resolvedAt: status === 'resolved' ? `2026-03-${day}T${String((Number(hour) + 3) % 24).padStart(2, '0')}:00:00` : undefined,
    assignee: ASSIGNEES[id % ASSIGNEES.length],
    code: `ERR-${String(1000 + (id * 17) % 900)}`,
  };
});

export const STATS = {
  totalWTU: 57,
  online: WTU_LIST.filter(w => w.status === 'online').length,
  fault: WTU_LIST.filter(w => w.status === 'fault').length,
  offline: WTU_LIST.filter(w => w.status === 'offline').length,
  maintenance: WTU_LIST.filter(w => w.status === 'maintenance').length,
  totalFaults: FAULTS.length,
  openFaults: FAULTS.filter(f => f.status === 'open').length,
  criticalFaults: FAULTS.filter(f => f.severity === 'critical').length,
  resolvedToday: FAULTS.filter(f => f.status === 'resolved').length,
  totalPower: WTU_LIST.reduce((s, w) => s + w.power, 0),
};
