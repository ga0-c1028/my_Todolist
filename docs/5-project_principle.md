# my_Todolist 프로젝트 구조 설계 원칙

## 버전 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|---|---|---|---|
| 1.0 | 2026-08-26 | gayoung.rho | 프로젝트 구조 설계 원칙 최초 작성 |
| 1.1 | 2026-08-26 | gayoung.rho | 프론트엔드 디렉토리 구조를 Feature-Sliced Design(FSD)으로 재설계 |
| 1.2 | 2026-08-27 | gayoung.rho | 실제 백엔드 구현과의 정합성을 맞추기 위해 갱신: 헬스 라우트 파일명(`health.js`), `schemas/` 실제 파일명(복수형 4개), `db/` 하위 마이그레이션·시드 스크립트 미작성 사실 반영, BR-2 소유권 검증을 서비스 계층 단일 검증으로 명확화, Swagger UI(`/api-docs`, 비운영 환경 한정) 절 추가 |

## 0. 개요 및 목적

본 문서는 인증 기반 개인 할일 관리 웹앱 "my_Todolist"의 프로젝트 구조 설계 원칙을 정의한다. `docs/1-domain_definition.md`의 엔티티(User/Category/Todo)와 비즈니스 규칙(BR-1~BR-11), `docs/2-prd.md`의 기술 스택(프론트엔드 React 19 + TypeScript + Zustand + TanStack Query, 백엔드 Node.js + JavaScript + Express + `pg`, DB PostgreSQL 17)과 비기능 요구사항(NFR-01~05), `docs/3-user_scenario.md`의 사용자 흐름, `docs/4-wireframe.md`의 화면 구성(W-01~W-06)을 근거로, 2일·1인 개발이라는 제약 안에서 바로 적용 가능한 디렉토리 구조와 코딩 컨벤션을 제시하는 것을 목적으로 한다. ORM(Prisma 등)을 사용하지 않는다는 제약(PRD 7.2절)에 맞춰, 데이터 접근 계층과 마이그레이션 관리 방식도 함께 규정한다.

## 1. 최상위 공통 원칙

프론트엔드·백엔드 모두에 적용되는 원칙이다. 2일·1인 개발이라는 일정상, 이론적으로 이상적인 구조보다 "지금 필요한 만큼만, 하지만 나중에 갈아엎지 않아도 되는 최소한의 구조"를 기준으로 삼는다.

| 원칙 | 내용 | 이유 |
|---|---|---|
| 관심사 분리 | UI/상태/서버통신, 라우팅/비즈니스로직/DB접근처럼 역할이 다른 코드는 서로 다른 파일·폴더에 둔다. | 1인 개발이라도 코드가 뒤섞이면 디버깅 시간이 늘어나며, 이는 2일 일정에서 가장 큰 리스크다. |
| 단일 책임 | 하나의 함수·모듈은 하나의 이유로만 변경되어야 한다(예: 상태 판단 로직과 API 요청 로직을 한 함수에 섞지 않는다). | 도메인 정의서 5장의 상태 판단 규칙처럼 재사용되는 로직은 한 곳에서만 수정 가능해야 버그를 줄일 수 있다. |
| 명시적 의존성 | 모듈 간 의존은 import/함수 인자로 명시하고, 전역 변수나 암묵적 공유 상태에 의존하지 않는다. | 짧은 개발 기간에 사이드 이펙트로 인한 디버깅 시간을 낭비하지 않기 위함이다. |
| 설정과 코드 분리 | DB 접속 정보, JWT 비밀키, CORS 허용 오리진 등은 환경변수(`.env`)로 분리하고 코드에 하드코딩하지 않는다. | 배포 환경 전환과 보안 사고 예방(비밀키 노출 방지)에 필수적이다. |
| 과설계 금지 | DDD 레이어드 아키텍처, CQRS, 이벤트 소싱 등 엔터프라이즈급 패턴은 도입하지 않는다. 최소한의 계층 분리(라우터/컨트롤러/서비스/데이터접근, UI/상태/서버상태/API클라이언트)만 유지한다. | 규모에 맞지 않는 구조는 2일 일정에서 완성도를 오히려 낮춘다. |
| 실용적 재사용 | 동일 로직이 3회 이상 반복될 때만 공통 함수·헬퍼로 추출한다. 1~2회 사용되는 코드를 미리 추상화하지 않는다. | 과도한 사전 추상화는 유지보수 비용을 늘리고 개발 속도를 떨어뜨린다(YAGNI). |

## 2. 의존성/레이어 원칙

### 2.1 프론트엔드 레이어 (FSD: Feature-Sliced Design)

프론트엔드 디렉토리 구조는 Feature-Sliced Design(FSD)을 적용한다. 계층(layer)은 `app → pages → widgets → features → entities → shared`이며, 각 계층 내부는 도메인·기능 단위의 슬라이스(slice)로 나뉘고, 슬라이스 내부는 다시 `ui`(컴포넌트) / `model`(상태·훅) / `api`(서버 통신) / `lib`(순수 함수) 세그먼트로 나뉜다.

| 레이어 | 역할 | 참조 가능 | 참조 불가 |
|---|---|---|---|
| app | 앱 진입점, 전역 프로바이더(QueryClientProvider), 라우터, 전역 스타일 | 하위 모든 레이어 | 없음(최상위) |
| pages | 화면 단위 조합(와이어프레임 W-01~W-06). widgets/features/entities를 배치만 한다 | widgets, features, entities, shared | 다른 page를 참조하지 않는다 |
| widgets | 여러 feature/entity를 묶은 완성된 UI 블록(공통 헤더, 필터 바 등) | features, entities, shared | pages를 참조하지 않는다 |
| features | 사용자 행위 단위 기능(로그인, 할일 등록, 필터 변경 등). Zustand 스토어와 TanStack Query의 useMutation은 이 레이어에 둔다 | entities, shared | widgets, pages를 참조하지 않으며 다른 feature를 직접 참조하지 않는다 |
| entities | 도메인 엔티티(User/Category/Todo) 단위 모델·타입·조회용 TanStack Query 훅·API 함수 | shared | features 이상 상위 레이어를 참조하지 않으며 다른 entity를 직접 참조하지 않는다 |
| shared | 특정 도메인에 속하지 않는 공통 자원(API 클라이언트 인스턴스, UI 키트, 유틸, 환경설정) | 없음(최하위) | 상위 모든 레이어를 참조하지 않는다 |

- 의존 방향은 위 표의 순서대로 상위 → 하위 단방향으로만 허용한다. 하위 레이어가 상위 레이어를 import하는 역방향 의존은 금지한다.
- 같은 레이어 내에서 슬라이스끼리(예: `features/todo-create`가 `features/todo-delete`를 직접 참조) 서로 참조하는 것은 원칙적으로 금지한다. 꼭 필요하면 상위 레이어(widgets)에서 두 슬라이스를 조합한다.
- 각 슬라이스는 `index.ts`를 공개 API(public API)로 두고, 다른 슬라이스는 슬라이스 내부 파일이 아니라 반드시 이 `index.ts`를 통해서만 import한다. 내부 구현을 임의로 바꿔도 외부 영향이 없도록 하기 위함이다.
- 서버에서 오는 데이터(Todo, Category 목록 등)는 entities 레이어의 TanStack Query 훅이 관리하고, 로그인 상태·필터 선택값 같은 클라이언트 전용 상태만 Zustand가 관리한다(사용자 인증 정보는 `entities/user`, 할일 목록 필터 선택값은 `features/todo-filter`에 둔다). 두 상태를 혼용해 저장하면 동기화 버그가 발생하기 쉽기 때문이다.

### 2.2 백엔드 레이어 (라우터 → 컨트롤러 → 서비스 → 데이터접근(pg))

| 레이어 | 역할 | 참조 가능 | 참조 불가 |
|---|---|---|---|
| 라우터(routes) | URL·HTTP 메서드와 컨트롤러 매핑, 인증 미들웨어 적용 | 컨트롤러, 미들웨어 | 서비스·데이터접근 계층을 직접 호출하지 않는다 |
| 컨트롤러(controllers) | 요청/응답 처리(req/res), 입력 유효성 검증 호출, 서비스 계층 호출, HTTP 상태 코드 결정 | 서비스 | pg 쿼리를 직접 작성하지 않는다(데이터접근 계층을 거친다) |
| 서비스(services) | 비즈니스 로직(BR-1~BR-11 규칙 구현: 소유권 검증, 상태 계산, 기본 카테고리 처리 등), 트랜잭션 경계 관리 | 데이터접근(repositories) | req/res 객체를 참조하지 않는다(Express에 비의존적으로 유지) |
| 데이터접근(repositories/db) | `pg.Pool`을 이용한 파라미터화 SQL 실행, 결과 행(row)을 반환 | `pg` 라이브러리, DB 커넥션 풀 | 비즈니스 로직(BR 규칙 판단)을 포함하지 않는다 — 순수 CRUD만 담당 |

- 의존 방향은 `라우터 → 컨트롤러 → 서비스 → 데이터접근`의 단방향으로 고정한다. 상위 레이어를 건너뛰어 호출하는 것(예: 컨트롤러에서 pg 쿼리 직접 실행)은 금지한다.
- 소유자 기반 접근 제어(BR-2)는 서비스 계층에서 명시적으로 검증한다: 리소스를 `id`로 조회한 뒤 `user_id`가 요청자와 일치하는지 확인해 불일치 시 403을, 리소스 자체가 없으면 404를 반환한다. 목록 조회(`GET /api/todos`, `GET /api/categories`)는 데이터접근 계층에서도 `WHERE user_id = $1` 조건을 사용해 처음부터 본인 소유 행만 조회한다. 단건 조회·수정·삭제(`:id` 경로)의 데이터접근 계층 쿼리 자체에는 `user_id` 조건을 추가하지 않는다 — 서비스 계층 검증이 항상 그 앞에서 먼저 실행되므로 안전하지만, 데이터접근 계층 자체는 소유권을 모르는 순수 CRUD로 유지한다.
- ORM 미사용 제약에 따라 데이터접근 계층에서 반복되는 쿼리 패턴은 공통 쿼리 헬퍼 함수로 추출해 중복을 최소화한다(PRD 7.4절 근거).

## 3. 코드/네이밍 원칙

### 3.1 공통
- 파일명: React 컴포넌트 파일은 `PascalCase.tsx`(예: `TodoList.tsx`), 그 외 로직 파일(훅, 유틸, 서비스, 라우터 등)은 `kebab-case` 또는 `camelCase.js/ts`로 통일한다(본 프로젝트는 `camelCase`를 기본으로 한다. 예: `todoService.js`, `useAuthStore.ts`).
- 함수명: 동사로 시작하는 `camelCase`를 사용한다(예: `getTodoStatus`, `createTodo`, `verifyOwnership`). 이유가 이름에서 드러나지 않는 약어는 사용하지 않는다.
- 변수명: 의미가 명확한 `camelCase`를 사용하며, 불리언 값은 `is/has/should` 접두사를 붙인다(예: `isCompleted`, `hasDefaultCategory`).
- 상수: `UPPER_SNAKE_CASE`를 사용한다(예: `ACCESS_TOKEN_EXPIRES_IN`).

### 3.2 TypeScript 타입/인터페이스 (프론트엔드)
- 도메인 엔티티를 나타내는 타입은 도메인 정의서의 엔티티명을 그대로 따르는 `PascalCase`를 사용한다(예: `User`, `Category`, `Todo`).
- 파생 상태(도메인 정의서 5장)는 문자열 리터럴 유니온 타입으로 정의한다: `type TodoStatus = 'completed' | 'overdue' | 'notStarted' | 'inProgress'`.
- API 요청/응답 전용 타입은 `~Request`, `~Response` 접미사를 붙인다(예: `CreateTodoRequest`, `LoginResponse`).
- `interface`는 확장 가능한 객체 구조(엔티티, props)에, `type`은 유니온·교차 타입에 사용하는 것을 기본 규칙으로 하되, 팀 내(1인 개발이므로 본인 내) 일관성만 지키면 충분하다.

### 3.3 DB 테이블/컬럼 (PostgreSQL)
- 테이블명: 복수형 `snake_case`를 사용한다(예: `users`, `categories`, `todos`).
- 컬럼명: `snake_case`를 사용하며, 도메인 정의서의 속성명을 그대로 매핑한다(예: `user_id`, `category_id`, `is_completed`, `completed_at`, `start_date`, `end_date`, `created_at`, `updated_at`).
- 외래키 컬럼명은 `참조테이블_단수형_id` 형태로 통일한다(예: `todos.user_id → users.id`, `todos.category_id → categories.id`).
- 기본키는 모든 테이블에서 `id`로 통일한다(타입은 `UUID` 또는 `BIGSERIAL` 중 하나를 프로젝트 전체에서 일관되게 선택한다).
- 서버(JavaScript/SQL)와 클라이언트(TypeScript) 간 명명 규칙 차이(`snake_case` ↔ `camelCase`)는 백엔드 응답 직렬화 단계(컨트롤러 또는 서비스 계층)에서 `camelCase`로 변환해 API 응답을 반환함으로써 흡수한다. 이유는 프론트엔드가 DB 컬럼명을 직접 알 필요가 없도록 계층 간 경계를 명확히 하기 위함이다.

### 3.4 API 엔드포인트 네이밍
- REST 리소스 기준 복수형 명사와 소유 관계를 반영한 경로를 사용한다(예: `POST /api/auth/login`, `GET /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/categories/:id`).
- HTTP 메서드로 행위를 표현하고, 경로에는 동사를 넣지 않는다(예: `POST /api/todos/:id/complete` 대신 `PATCH /api/todos/:id`로 `isCompleted` 필드를 갱신하는 방식을 우선 검토한다).

## 4. 테스트/품질 원칙

2일·1인 개발 일정을 고려해, 전 구간 커버리지 목표(예: 라인 커버리지 80% 이상)를 두지 않는다. 대신 **오류 발생 시 파급 범위가 크거나 보안·데이터 정합성에 직결되는 핵심 로직만** 선별해 단위 테스트를 작성한다.

| 우선순위 | 테스트 대상 | 근거 |
|---|---|---|
| 필수 | 할일 상태 판단 로직(`getTodoStatus`: 완료/기한초과/시작 전/진행중, 도메인 정의서 5장) | 4가지 상태를 조회 시점에 계산하는 파생 로직으로, 오류 시 목록 필터링(FR-09) 전체가 왜곡된다. |
| 필수 | 소유권 검증 로직(BR-2: 본인 데이터만 접근 가능, 403 처리) | 인가 실패는 보안 사고로 직결되며 SC-09의 핵심 검증 대상이다. |
| 필수 | 날짜 유효성 검증(BR-6: 종료일자 ≥ 시작일자) | 데이터 정합성(NFR-04)에 직결되며 SC-10의 핵심 검증 대상이다. |
| 필수 | 기본 카테고리 처리 로직(BR-3, BR-4, BR-5: 미지정 시 기본 지정, 기본 카테고리 삭제 불가, 삭제 시 할일 이관) | 카테고리 삭제 시 할일 유실 여부가 걸린 로직으로 SC-02의 핵심 검증 대상이다. |
| 필수 | JWT 인증/인가 미들웨어(BR-1: 미인증 401, 토큰 재발급 예외) | 전체 API의 진입 관문으로 오류 시 전 기능이 영향을 받는다. |
| 권장(여유 시) | 회원가입/로그인 시 이메일 중복(BR-9)·로그인 실패 공통 메시지(BR-11) 검증 | SC-08, SC-11 예외 흐름의 핵심 규칙이나, 위 필수 항목 대비 우선순위가 낮다. |
| 생략 가능 | UI 컴포넌트 스냅샷 테스트, E2E 자동화 테스트 | 1인 개발·2일 일정에서 수동 시나리오 점검(3-user_scenario.md의 SC-01~SC-11)으로 대체한다. |

- 테스트 도구는 백엔드는 Node.js 기본 테스트 러너(`node:test`) 또는 최소 설정의 경량 프레임워크를, 프론트엔드는 핵심 유틸 함수(상태 계산 등) 위주로 Vitest를 사용하는 것을 권장한다. 별도 설정 없이 기존 스택에서 바로 사용 가능한 도구를 우선한다.
- 테스트는 서비스 계층(비즈니스 로직)을 대상으로 작성하고, 컨트롤러·라우터·DB 통합 테스트는 시간이 남을 때만 추가한다. 이유는 서비스 계층이 BR 규칙을 담고 있어 회귀 발생 시 영향이 가장 크기 때문이다.
- 배포 전 최소 기준: 위 "필수" 항목이 통과하고, `docs/3-user_scenario.md`의 SC-01(End-to-End)을 수동으로 1회 재현해 정상 동작을 확인한다.

## 5. 설정/보안/운영 원칙

### 5.1 환경변수 관리
- DB 접속 정보(`DATABASE_URL` 또는 `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`/`PGPORT`), JWT 비밀키, 토큰 만료 시간, CORS 허용 오리진, 서버 포트는 모두 `.env` 파일과 `process.env`를 통해 관리하고 코드에 하드코딩하지 않는다.
- `.env`는 `.gitignore`에 포함해 저장소에 커밋하지 않으며, 대신 `.env.example`에 키 목록(값은 비움)만 커밋해 실행 환경을 재현할 수 있게 한다.

### 5.2 JWT 비밀키 및 토큰 관리 (PRD 7.2절, BR-1 근거)
- access_token과 refresh_token은 서로 다른 비밀키(`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)로 서명해, 한쪽 키가 노출되어도 다른 토큰까지 위조되지 않도록 한다.
- access_token은 단기 만료(예: 15분~1시간)로, refresh_token은 장기 만료(예: 7~14일)로 설정하며 만료 시간도 환경변수로 관리한다.
- refresh_token은 DB(`refresh_tokens` 테이블 또는 `users` 테이블의 해당 컬럼)에 저장해 로그아웃(FR-03) 시 무효화할 수 있도록 하며, 평문이 아닌 해시로 저장하는 것을 권장한다.
- access_token 만료로 인한 401 응답은 프론트엔드 API 클라이언트의 인터셉터에서 refresh_token으로 자동 재발급을 시도하고, refresh_token도 만료된 경우에만 로그인 화면으로 이동한다(4-wireframe.md 3.1절, SC-04 근거).

### 5.3 인증/인가 (BR-1, BR-2)
- BR-1에 따라 회원가입/로그인/토큰 재발급을 제외한 모든 API는 인증 미들웨어를 통과해야 하며, access_token이 없거나 유효하지 않으면 401을 반환한다.
- BR-2에 따라 리소스 소유자 확인은 서비스 계층에서 명시적으로 수행하고(요청자 ID와 리소스의 `user_id` 비교), 불일치 시 403을 반환한다. 조회 쿼리 자체도 `WHERE user_id = $1` 조건을 항상 포함해 이중으로 방어한다.
- 비밀번호는 해시(bcrypt 등)로 저장하며 평문으로 로그에 남기거나 응답에 포함하지 않는다(NFR-03).
- 로그인 실패 응답은 이메일 미존재와 비밀번호 불일치를 구분하지 않고 동일한 메시지로 통일한다(BR-11).

### 5.4 CORS
- 프론트엔드 개발 서버 및 배포 도메인만 `Access-Control-Allow-Origin` 허용 목록에 등록하고, 와일드카드(`*`)는 인증 쿠키/토큰을 다루는 API에서 사용하지 않는다.
- 허용 오리진 목록은 환경변수(`CORS_ORIGIN`)로 관리해 개발/운영 환경별로 다르게 설정한다.

### 5.5 SQL 인젝션 방지
- ORM을 사용하지 않으므로, 모든 SQL 실행은 `pg`의 파라미터화 쿼리(`$1, $2, ...` 플레이스홀더와 값 배열)를 반드시 사용하고, 문자열 템플릿으로 사용자 입력을 직접 SQL에 삽입하지 않는다(PRD 7.2절).
- 데이터접근 계층 외부(컨트롤러, 서비스)에서 원시 SQL을 작성하지 않도록 레이어 원칙(2.2절)을 강제해, SQL 작성 지점을 한곳으로 제한한다.

### 5.6 로깅 최소 기준
- 요청 단위 로그(HTTP 메서드, 경로, 상태 코드, 응답 시간)를 남기며, 비밀번호·토큰 원문 등 민감 정보는 로그에 남기지 않는다.
- 에러 발생 시 스택 트레이스는 서버 로그에만 남기고, 클라이언트 응답에는 노출하지 않는다(내부 구현 노출 방지).
- 별도의 로그 수집 인프라(ELK 등) 구축은 2일 일정상 범위를 벗어나므로, `console` 기반 출력 또는 경량 로깅 라이브러리(예: `pino`) 중 설정이 간단한 쪽을 선택해 표준 출력으로 남기는 수준을 최소 기준으로 한다.

### 5.7 헬스 체크
- `GET /api/health` 엔드포인트를 두어 서버 및 DB 커넥션 풀 상태를 간단히 확인할 수 있도록 한다(배포·운영 점검용 최소 기능).

### 5.8 API 문서(Swagger UI)
- `backend/swagger.json`(OpenAPI 3.0 스펙)을 `swagger-ui-express`로 서빙한다. `NODE_ENV`가 `production`이 아닐 때만 `GET /api-docs`에 마운트되며, 운영 환경에서는 자동으로 비활성화된다.

## 6. 프론트엔드 디렉토리 구조

Feature-Sliced Design(FSD) 기준으로 구성한다. 각 슬라이스 폴더는 `index.ts`로 공개 API를 노출하고, 다른 슬라이스는 이 파일을 통해서만 import한다(2.1절 원칙).

```
frontend/
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── app/                             # app 레이어: 진입점/전역 설정
    │   ├── main.tsx                       # ReactDOM 마운트, QueryClientProvider 설정
    │   ├── App.tsx                        # 최상위 컴포넌트, 라우터 렌더링
    │   ├── providers/
    │   │   └── QueryProvider.tsx            # TanStack Query 클라이언트 프로바이더
    │   ├── routes/
    │   │   └── router.tsx                   # 라우트-페이지 매핑, 인증 가드
    │   └── styles/
    │       └── global.css
    │
    ├── pages/                           # pages 레이어: 화면 단위(와이어프레임 W-01~W-06)
    │   ├── signup/
    │   │   ├── ui/SignupPage.tsx            # W-01, features/auth-signup 배치
    │   │   └── index.ts
    │   ├── login/
    │   │   ├── ui/LoginPage.tsx             # W-02, features/auth-login 배치
    │   │   └── index.ts
    │   ├── todo-list/
    │   │   ├── ui/TodoListPage.tsx          # W-03, widgets/todo-filter-bar + entities/todo 배치
    │   │   └── index.ts
    │   ├── todo-form/
    │   │   ├── ui/TodoFormPage.tsx          # W-04(등록/수정 공통), features/todo-create·todo-edit 배치
    │   │   └── index.ts
    │   ├── category-manage/
    │   │   ├── ui/CategoryManagePage.tsx    # W-05, features/category-manage 배치
    │   │   └── index.ts
    │   └── profile/
    │       ├── ui/ProfilePage.tsx           # W-06, features/profile-edit 배치
    │       └── index.ts
    │
    ├── widgets/                         # widgets 레이어: 여러 feature/entity를 조합한 UI 블록
    │   ├── app-header/
    │   │   ├── ui/AppHeader.tsx             # 공통 내비게이션(데스크톱/모바일), features/auth-logout 포함
    │   │   └── index.ts
    │   └── todo-filter-bar/
    │       ├── ui/TodoFilterBar.tsx         # 카테고리·상태 필터 UI, features/todo-filter 사용
    │       └── index.ts
    │
    ├── features/                        # features 레이어: 사용자 행위 단위 기능
    │   ├── auth-signup/
    │   │   ├── ui/SignupForm.tsx
    │   │   ├── model/useSignup.ts           # useMutation(entities/user API 호출)
    │   │   └── index.ts
    │   ├── auth-login/
    │   │   ├── ui/LoginForm.tsx
    │   │   ├── model/useLogin.ts            # useMutation, 성공 시 entities/user 스토어 갱신
    │   │   └── index.ts
    │   ├── auth-logout/
    │   │   ├── model/useLogout.ts
    │   │   └── index.ts
    │   ├── todo-create/
    │   │   ├── ui/TodoForm.tsx              # 제목/설명/카테고리/캘린더 입력 폼
    │   │   ├── model/useCreateTodo.ts
    │   │   └── index.ts
    │   ├── todo-edit/
    │   │   ├── model/useUpdateTodo.ts
    │   │   └── index.ts
    │   ├── todo-delete/
    │   │   ├── model/useDeleteTodo.ts
    │   │   └── index.ts
    │   ├── todo-toggle-complete/
    │   │   ├── model/useToggleComplete.ts   # 완료 처리/취소
    │   │   └── index.ts
    │   ├── todo-filter/
    │   │   ├── model/useTodoFilterStore.ts  # Zustand: 선택된 카테고리/상태 필터값
    │   │   └── index.ts
    │   ├── category-manage/
    │   │   ├── ui/CategoryForm.tsx
    │   │   ├── model/useCategoryMutations.ts # 생성/수정/삭제
    │   │   └── index.ts
    │   └── profile-edit/
    │       ├── ui/ProfileForm.tsx
    │       ├── model/useUpdateProfile.ts
    │       └── index.ts
    │
    ├── entities/                        # entities 레이어: 도메인 엔티티(User/Category/Todo)
    │   ├── user/
    │   │   ├── model/types.ts               # User, LoginRequest, LoginResponse
    │   │   ├── model/useAuthStore.ts        # Zustand: 로그인 여부, 사용자 정보, access_token 보관
    │   │   ├── api/userApi.ts               # 회원 정보 조회/수정 요청 함수
    │   │   └── index.ts
    │   ├── category/
    │   │   ├── model/types.ts               # Category, CreateCategoryRequest
    │   │   ├── api/categoryApi.ts
    │   │   ├── api/useCategoriesQuery.ts    # 카테고리 목록 조회(TanStack Query)
    │   │   └── index.ts
    │   └── todo/
    │       ├── model/types.ts               # Todo, TodoStatus, CreateTodoRequest
    │       ├── model/getTodoStatus.ts       # 상태 판단 로직(도메인 정의서 5장)
    │       ├── api/todoApi.ts
    │       ├── api/useTodosQuery.ts         # 할일 목록 조회(필터 파라미터 포함)
    │       ├── ui/TodoListItem.tsx
    │       ├── ui/TodoStatusBadge.tsx       # 상태 배지(완료/기한초과/시작 전/진행중)
    │       └── index.ts
    │
    └── shared/                          # shared 레이어: 도메인에 속하지 않는 공통 자원
        ├── api/
        │   └── client.ts                   # axios/fetch 인스턴스, 인터셉터(토큰 첨부, 401 재발급)
        ├── config/
        │   └── env.ts                      # import.meta.env 파싱
        ├── lib/
        │   └── validators.ts                # 이메일 형식, 비밀번호 규칙 등 순수 검증 함수
        └── ui/
            ├── Button.tsx
            ├── ConfirmDialog.tsx
            ├── ErrorMessage.tsx
            └── DateRangePicker.tsx          # 캘린더 UI(도메인 특정성 없는 범용 컴포넌트)
```

## 7. 백엔드 디렉토리 구조

ORM을 사용하지 않으므로, SQL 스키마는 순번이 붙은 `.sql` 마이그레이션 파일로 버전 관리하고, `db/migrate.js` 스크립트로 순차 적용한다(간단한 자체 마이그레이션 러너 또는 `node-pg-migrate` 같은 경량 도구 사용을 권장하되, 신규 의존성 추가가 부담되면 순번 SQL 파일을 수동 실행하는 방식도 허용한다).

```
backend/
├── .env.example
├── package.json
└── src/
    ├── app.js                      # Express 앱 생성, 미들웨어 등록
    ├── server.js                   # 서버 기동(app.listen), 진입점
    ├── config/
    │   ├── env.js                   # process.env 파싱 및 검증
    │   └── db.js                    # pg.Pool 생성 및 export(커넥션 풀링, NFR-01 근거)
    ├── routes/                     # 라우터 계층
    │   ├── index.js                  # 라우터 통합 등록
    │   ├── authRoutes.js              # /api/auth/*
    │   ├── todoRoutes.js              # /api/todos/*
    │   ├── categoryRoutes.js          # /api/categories/*
    │   ├── userRoutes.js              # /api/users/*
    │   └── health.js                  # /api/health
    ├── controllers/                # 컨트롤러 계층(req/res 처리)
    │   ├── authController.js
    │   ├── todoController.js
    │   ├── categoryController.js
    │   └── userController.js
    ├── services/                   # 서비스 계층(BR-1~BR-11 비즈니스 로직)
    │   ├── authService.js             # 회원가입/로그인/토큰 발급·재발급/로그아웃, BR-1, BR-9, BR-11
    │   ├── todoService.js             # 할일 CRUD, 상태 계산, BR-2, BR-3, BR-6, BR-7, BR-8
    │   ├── categoryService.js         # 카테고리 CRUD, 기본 카테고리 처리, BR-3, BR-4, BR-5
    │   └── userService.js             # 회원 정보 수정, BR-9, BR-10
    ├── repositories/               # 데이터접근 계층(pg 파라미터화 쿼리)
    │   ├── userRepository.js
    │   ├── categoryRepository.js
    │   ├── todoRepository.js
    │   └── refreshTokenRepository.js
    ├── middlewares/
    │   ├── authenticate.js           # access_token 검증, 미인증 시 401(BR-1)
    │   ├── errorHandler.js           # 표준화된 에러 응답 포맷 처리
    │   ├── validate.js               # 요청 스키마 유효성 검증(공통)
    │   └── requestLogger.js          # 요청 단위 로깅(5.6절)
    ├── utils/
    │   ├── todoStatus.js              # getTodoStatus(startDate, endDate, isCompleted) — 도메인 정의서 5장
    │   ├── jwt.js                     # access_token/refresh_token 서명·검증
    │   ├── password.js                # 비밀번호 해시/검증(bcrypt)
    │   └── ApiError.js                # 표준 에러 클래스(status, message)
    ├── schemas/                    # 요청 바디 유효성 검증 스키마(수동 검증 함수)
    │   ├── authSchemas.js
    │   ├── userSchemas.js
    │   ├── categorySchemas.js
    │   └── todoSchemas.js
    └── db/
        └── migrations/               # (예약된 디렉토리, 아래 참고)
```

- 2일 일정상 `db/migrate.js`/`db/seed.js`와 순번 SQL 마이그레이션 파일은 실제로 만들지 않았다. `docs/schema.sql` 단일 파일을 `psql`로 직접 적용하는 실용적 선택(DB-02 완료 조건에 명시된 대체 경로)을 그대로 따랐으며, `db/migrations/`는 향후 마이그레이션 도입 시를 대비한 빈 디렉토리로만 남아 있다.

- `repositories/`는 각 테이블에 대응하는 CRUD 및 조회 함수만 담당하며, 소유자 조건(`WHERE user_id = $1`)을 기본으로 포함한다.
- `services/`는 여러 `repositories`를 조합해 트랜잭션이 필요한 로직(예: 카테고리 삭제 시 할일 이관 BR-5)을 `pg.Pool.connect()`로 얻은 클라이언트에서 `BEGIN`/`COMMIT`/`ROLLBACK`으로 감싸 처리한다.
- 신규 테이블 추가나 컬럼 변경이 필요하면 `db/migrations/`에 순번이 이어지는 새 `.sql` 파일을 추가하고, 기존 파일은 수정하지 않는다(이미 적용된 마이그레이션은 불변으로 취급한다).

## 8. 문서 간 추적성

본 문서의 각 원칙은 아래 근거 문서와 연결된다.

| 원칙 | 근거 |
|---|---|
| 레이어 분리, 상태/서버상태 구분 | PRD 7.1절(프론트엔드 기술 스택) |
| 라우터-컨트롤러-서비스-데이터접근 분리, SQL 인젝션 방지 | PRD 7.2절, 7.4절(백엔드 기술 스택 및 아키텍처 함의) |
| 소유자 기반 접근 제어, 401/403 처리 | 도메인 정의서 BR-1, BR-2, PRD NFR-03 |
| 상태 판단 로직 테스트 우선순위 | 도메인 정의서 5장, PRD FR-08·FR-09 |
| JWT access_token/refresh_token 관리 | PRD 1.1절 버전 이력, 7.2절, 사용자 시나리오 SC-04 |
| 커넥션 풀링, 인덱스 | PRD NFR-01, 7.4절 |
| 화면-페이지 디렉토리 매핑 | 와이어프레임 2장(화면 목록 W-01~W-06) |
| 프론트엔드 FSD 레이어 구조 | PRD 7.1절(React 19 + TypeScript + Zustand + TanStack Query) |
