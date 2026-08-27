const test = require('node:test');
const assert = require('node:assert/strict');

const { getTodoStatus, toDateOnly } = require('./todoStatus');

// ---- toDateOnly ----

test('toDateOnly는 Date 객체를 YYYY-MM-DD 문자열로 변환한다', () => {
  const result = toDateOnly(new Date('2026-03-15T09:00:00Z'));
  assert.equal(result, '2026-03-15');
});

test('toDateOnly는 문자열을 그대로 통과시킨다', () => {
  assert.equal(toDateOnly('2026-03-15'), '2026-03-15');
});

// ---- getTodoStatus ----

test('getTodoStatus는 isCompleted가 true이면 completed를 반환한다', () => {
  assert.equal(getTodoStatus('2020-01-01', '2020-01-02', true), 'completed');
});

test('getTodoStatus는 isCompleted가 true이면 endDate가 아무리 과거여도 completed가 우선한다', () => {
  assert.equal(getTodoStatus('2000-01-01', '2000-01-02', true), 'completed');
});

test('getTodoStatus는 endDate가 오늘보다 이전이면 overdue를 반환한다', () => {
  const today = toDateOnly(new Date());
  assert.equal(getTodoStatus('2000-01-01', '2000-01-02', false), 'overdue');
  assert.notEqual('2000-01-02', today);
});

test('getTodoStatus는 endDate가 오늘이면 overdue가 아니다(경계값)', () => {
  const today = toDateOnly(new Date());
  const result = getTodoStatus(today, today, false);
  assert.notEqual(result, 'overdue');
});

test('getTodoStatus는 startDate가 오늘보다 미래이면 notStarted를 반환한다', () => {
  const future = '2999-01-01';
  assert.equal(getTodoStatus(future, future, false), 'notStarted');
});

test('getTodoStatus는 startDate가 오늘이면 notStarted가 아니다(경계값)', () => {
  const today = toDateOnly(new Date());
  const result = getTodoStatus(today, today, false);
  assert.notEqual(result, 'notStarted');
});

test('getTodoStatus는 시작~종료 사이에 오늘이 포함되면 inProgress를 반환한다', () => {
  const today = toDateOnly(new Date());
  assert.equal(getTodoStatus(today, today, false), 'inProgress');
});

test('getTodoStatus는 문자열 날짜 입력에도 동작한다', () => {
  assert.equal(getTodoStatus('2000-01-01', '2000-01-02', false), 'overdue');
});

test('getTodoStatus는 Date 객체 날짜 입력에도 동작한다', () => {
  const start = new Date('2000-01-01T00:00:00Z');
  const end = new Date('2000-01-02T00:00:00Z');
  assert.equal(getTodoStatus(start, end, false), 'overdue');
});
