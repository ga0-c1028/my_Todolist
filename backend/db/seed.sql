-- 로컬 개발용 시드 데이터
-- 근거: docs/8-plan.md DB-03, 도메인 정의서 5장(할일 상태 판단 규칙)
-- 테스트 계정 1개, 카테고리(기본 포함) 2개, 4가지 상태(시작 전/진행중/완료/기한초과)를 각 1건씩 생성한다.
-- 기준일: 2026-08-26 (오늘)

WITH new_user AS (
    INSERT INTO users (email, password_hash, name)
    VALUES ('test@example.com', 'seed_placeholder_hash', '테스트유저')
    RETURNING id
),
default_cat AS (
    INSERT INTO categories (user_id, name, is_default)
    SELECT id, '기본', true FROM new_user
    RETURNING id, user_id
),
work_cat AS (
    INSERT INTO categories (user_id, name, is_default)
    SELECT user_id, '업무', false FROM default_cat
    RETURNING id, user_id
)
INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed, completed_at)
SELECT user_id, id, '시작 전 할일', DATE '2026-09-01', DATE '2026-09-05', false, NULL::timestamptz FROM work_cat
UNION ALL
SELECT user_id, id, '진행중 할일', DATE '2026-08-20', DATE '2026-08-30', false, NULL::timestamptz FROM work_cat
UNION ALL
SELECT user_id, id, '완료된 할일', DATE '2026-08-10', DATE '2026-08-15', true, TIMESTAMPTZ '2026-08-14 10:00:00+09' FROM work_cat
UNION ALL
SELECT user_id, id, '기한초과 할일', DATE '2026-08-01', DATE '2026-08-10', false, NULL::timestamptz FROM work_cat;
