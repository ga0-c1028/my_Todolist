-- my_Todolist 데이터베이스 스키마 (PostgreSQL 17)
-- 근거: docs/7-erd.md
-- 생성 순서: users -> categories -> todos -> refresh_tokens (FK 의존 순서)

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() 사용을 위함

-- 4.1 users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(30) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 categories
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(20) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- 사용자별 '기본' 카테고리는 정확히 1개만 존재해야 한다(BR-4).
CREATE UNIQUE INDEX uq_categories_one_default_per_user
    ON categories(user_id)
    WHERE is_default = true;

-- 4.3 todos
CREATE TABLE todos (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title        VARCHAR(100) NOT NULL,
    description  TEXT,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_todos_end_date CHECK (end_date >= start_date)
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_category_id ON todos(category_id);

-- 4.4 refresh_tokens
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
