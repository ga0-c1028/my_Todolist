require('dotenv').config();
const { pool } = require('../config/db');
const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const categoryRepository = require('../repositories/categoryRepository');
const todoRepository = require('../repositories/todoRepository');

const SEED_EMAIL = 'seed@example.com';
const SEED_PASSWORD = 'password1';
const SEED_NAME = '시드유저';
const WORK_CATEGORY_NAME = '업무';

function toDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function ensureSeedUser() {
  const existing = await userRepository.findByEmail(SEED_EMAIL);
  if (existing) {
    console.log('[seed] 기존 시드 계정 재사용:', SEED_EMAIL);
    return existing.id;
  }
  const user = await authService.signup({ email: SEED_EMAIL, password: SEED_PASSWORD, name: SEED_NAME });
  console.log('[seed] 시드 계정 생성:', SEED_EMAIL);
  return user.id;
}

async function ensureWorkCategory(userId) {
  const existing = await categoryRepository.findByUserAndName(userId, WORK_CATEGORY_NAME);
  if (existing) return existing;
  const created = await categoryRepository.create(userId, WORK_CATEGORY_NAME);
  console.log('[seed] 카테고리 생성:', WORK_CATEGORY_NAME);
  return created;
}

async function ensureTodo(userId, { title, categoryId, startDate, endDate, isCompleted }) {
  const existingTodos = await todoRepository.findAllByUser(userId);
  const existing = existingTodos.find((todo) => todo.title === title);
  if (existing) {
    console.log('[seed] 이미 존재, 스킵:', title);
    return;
  }

  const created = await todoRepository.create(userId, { categoryId, title, description: null, startDate, endDate });

  if (isCompleted) {
    await todoRepository.updateById(created.id, {
      categoryId,
      title,
      description: null,
      startDate,
      endDate,
      isCompleted: true,
      completedAt: new Date(),
    });
  }

  console.log('[seed] 할일 생성:', title);
}

async function main() {
  const userId = await ensureSeedUser();
  const defaultCategory = await categoryRepository.findDefaultByUser(userId);
  const workCategory = await ensureWorkCategory(userId);

  const today = new Date();

  // 도메인 정의서 5장 상태 판단 규칙(완료 > 기한초과 > 시작 전 > 진행중)에 맞춰
  // 날짜값을 오늘 기준으로 분산시켜 4가지 상태가 모두 나타나도록 한다.
  await ensureTodo(userId, {
    title: '(시드) 기한초과 할일',
    categoryId: defaultCategory.id,
    startDate: toDateOnly(addDays(today, -10)),
    endDate: toDateOnly(addDays(today, -3)),
    isCompleted: false,
  });

  await ensureTodo(userId, {
    title: '(시드) 진행중 할일',
    categoryId: workCategory.id,
    startDate: toDateOnly(addDays(today, -2)),
    endDate: toDateOnly(addDays(today, 5)),
    isCompleted: false,
  });

  await ensureTodo(userId, {
    title: '(시드) 완료된 할일',
    categoryId: defaultCategory.id,
    startDate: toDateOnly(addDays(today, -5)),
    endDate: toDateOnly(addDays(today, -1)),
    isCompleted: true,
  });

  await ensureTodo(userId, {
    title: '(시드) 시작 전 할일',
    categoryId: workCategory.id,
    startDate: toDateOnly(addDays(today, 5)),
    endDate: toDateOnly(addDays(today, 10)),
    isCompleted: false,
  });

  console.log('[seed] 완료. 로그인 계정:', SEED_EMAIL, '/', SEED_PASSWORD);
}

main()
  .catch((err) => {
    console.error('[seed] 실패:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
