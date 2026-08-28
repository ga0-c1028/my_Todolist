import type { TodoStatus } from './types';

function toDateOnly(value: string | Date): string {
  if (!(value instanceof Date)) return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodoStatus(startDate: string, endDate: string, isCompleted: boolean): TodoStatus {
  if (isCompleted) return 'completed';
  const today = toDateOnly(new Date());
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (end < today) return 'overdue';
  if (today < start) return 'notStarted';
  return 'inProgress';
}
