import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTodoStatus } from './getTodoStatus';

describe('getTodoStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('isCompleted가 true이면 항상 completed를 반환한다', () => {
    expect(getTodoStatus('2020-01-01', '2020-01-02', true)).toBe('completed');
  });

  it('isCompleted가 true이면 endDate가 과거여도 completed가 우선한다', () => {
    expect(getTodoStatus('2000-01-01', '2000-01-02', true)).toBe('completed');
  });

  it('endDate가 오늘보다 이전이면 overdue를 반환한다', () => {
    expect(getTodoStatus('2026-01-01', '2026-01-14', false)).toBe('overdue');
  });

  it('endDate가 오늘이면 overdue가 아니다(경계값)', () => {
    expect(getTodoStatus('2026-01-15', '2026-01-15', false)).not.toBe('overdue');
  });

  it('startDate가 오늘보다 미래이면 notStarted를 반환한다', () => {
    expect(getTodoStatus('2026-01-16', '2026-01-20', false)).toBe('notStarted');
  });

  it('startDate가 오늘이면 notStarted가 아니다(경계값)', () => {
    expect(getTodoStatus('2026-01-15', '2026-01-15', false)).not.toBe('notStarted');
  });

  it('오늘이 시작~종료 사이에 포함되면 inProgress를 반환한다', () => {
    expect(getTodoStatus('2026-01-10', '2026-01-20', false)).toBe('inProgress');
  });
});
