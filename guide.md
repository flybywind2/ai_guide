네, 6개 문서를 모두 SQLite3 기반으로 다시 작성하겠습니다.

---

# 📄 1. PRD (Product Requirements Document)

## 1.1 제품 개요

### 제품명
**AI Literacy Workflow Guide**

### 비전
삼성전자 DS부문 비개발자 임직원이 "어디서부터 시작해야 할지 모르겠다"는 문제를 해결하고, 개인의 목표와 상황에 맞는 맞춤형 AI 활용/개발 경로를 제공하는 인터랙티브 가이드 시스템

### 핵심 가치 제안
| 가치 | 설명 |
|------|------|
| **경로 기반 학습** | Twine 스타일의 Story/Passage 구조로 동적 분기 제공 |
| **단계별 안내** | LLM 단순 활용부터 ML/DL 개발까지 전 스펙트럼 커버 |
| **상태 기억** | 직전 Passage 기반 맥락 인식 네비게이션 |
| **자기주도형** | 사용자가 원하는 깊이까지 탐색 가능 |
| **시각적 편집** | 관리자가 Twine 스타일로 콘텐츠 구조 편집 |

---

## 1.2 목표 및 성공 지표

### 비즈니스 목표
| 목표 | 측정 지표 | 목표값 (MVP+3개월) |
|------|----------|-------------------|
| AI 활용 저변 확대 | 월간 활성 사용자(MAU) | 500명+ |
| 실무 적용 연결 | AI 과제 적용 전환율 | 20%+ |
| 자원 신청 활성화 | 가이드 통한 자원신청 건수 | 월 30건+ |

### 제품 목표
| 목표 | 측정 지표 | 목표값 |
|------|----------|--------|
| 사용성 | Story 완주율 | 60%+ |
| 재방문 | 주간 재방문율 | 40%+ |
| 콘텐츠 품질 | Passage별 평균 체류시간 | 2분+ |

---

## 1.3 타겟 사용자

### Primary Persona: AI 활용 희망자
| 항목 | 내용 |
|------|------|
| 소속 | 삼성전자 DS부문 내부 임직원 |
| AI 리터러시 | 기초 이해 수준 (AI 개념은 알지만 실무 적용 경험 없음) |
| 니즈 | 사내 AI 서비스 사용법, 업무 효율화 도구 활용 |
| Pain Point | 어떤 툴이 있는지, 어떻게 시작하는지 모름 |

### Secondary Persona: AI 개발 희망자
| 항목 | 내용 |
|------|------|
| 소속 | 삼성전자 DS부문 내부 임직원 |
| AI 리터러시 | 기초~중급 (코딩 경험 있거나 배우려는 의지) |
| 니즈 | AI 과제 수행을 위한 자원 신청, 개발환경 구축, 구현 가이드 |
| Pain Point | 자원 받기 어려움, 체계적인 개발 가이드 부재 |

---

## 1.4 핵심 기능 요구사항

### 1.4.1 사용자 기능

#### F1. Story 기반 콘텐츠 탐색 [MVP 필수]
| ID | 기능 | 설명 |
|----|------|------|
| F1.1 | 목표 선택 | 최초 진입 시 목표 선택 화면 제공 (AI 활용 vs AI 개발) |
| F1.2 | 동적 분기 | 선택에 따른 Passage 경로 분기 |
| F1.3 | 조건부 네비게이션 | 직전 Passage 기반 다음 Passage 결정 |
| F1.4 | 순차 탐색 | 이전/다음 버튼으로 Passage 이동 |
| F1.5 | 경로 재선택 | 우측 하단에 경로 재선택 버튼 |

#### F2. 좌측 사이드바 - 목차 [MVP 필수]
| ID | 기능 | 설명 |
|----|------|------|
| F2.1 | 경로 목록 | 현재 Story 경로의 Passage 목록 표시 |
| F2.2 | 아코디언 | 섹션 접기/펼치기 |
| F2.3 | 최소화 | 사이드바 전체 최소화 토글 |
| F2.4 | 현재 위치 | 현재 Passage 하이라이트 표시 |

#### F3. 우측 사이드바 - 피드백 게시판 [MVP 필수]
| ID | 기능 | 설명 |
|----|------|------|
| F3.1 | 게시판 | 별도 피드백 게시판 페이지 |
| F3.2 | 익명 작성 | 익명으로 피드백 작성 가능 |
| F3.3 | 댓글 | 누구나 댓글/답변 작성 가능 |
| F3.4 | Passage 연결 | 특정 Passage 연결 또는 일반 게시 선택 |
| F3.5 | 최소화 | 사이드바 최소화 토글 |

#### F4. 상단 미니맵 [MVP 높음]
| ID | 기능 | 설명 |
|----|------|------|
| F4.1 | 시각화 | 전체 Story 축소판 시각화 |
| F4.2 | 현재 위치 | 현재 Passage 하이라이트 |
| F4.3 | 점프 | 노드 클릭 시 해당 Passage로 이동 |

#### F5. 북마크 [MVP 중간]
| ID | 기능 | 설명 |
|----|------|------|
| F5.1 | 저장 | Passage 단위 북마크 저장 |
| F5.2 | 목록 | 좌측 사이드바 상단에 북마크 목록 |
| F5.3 | 이동 | 북마크 클릭 시 바로 이동 |

#### F6. 이어보기 [MVP 높음]
| ID | 기능 | 설명 |
|----|------|------|
| F6.1 | 저장 | 마지막 방문 Passage 로컬 스토리지 저장 |
| F6.2 | 복원 | 재방문 시 이어보기 프롬프트 |

---

### 1.4.2 관리자 기능

#### F7. Story 에디터 (Twine 스타일) [MVP 필수]
| ID | 기능 | 설명 |
|----|------|------|
| F7.1 | 노드 관리 | Passage 추가/삭제/수정 |
| F7.2 | 연결선 | Passage 간 Link 설정 |
| F7.3 | 드래그 배치 | 드래그앤드롭 시각적 배치 |
| F7.4 | 분기 조건 | Link 조건 설정 (직전 Passage, 사용자 선택) |
| F7.5 | 저장/불러오기 | Story 저장 및 불러오기 |

#### F8. Passage 콘텐츠 편집기 [MVP 필수]
| ID | 기능 | 설명 |
|----|------|------|
| F8.1 | WYSIWYG | 리치 텍스트 에디터 |
| F8.2 | 이미지 | 이미지 업로드 기능 |
| F8.3 | 메타정보 | Passage 제목, 설명, 태그 편집 |

#### F9. 권한 관리 [MVP 중간]
| ID | 기능 | 설명 |
|----|------|------|
| F9.1 | 3단계 권한 | 슈퍼관리자 / 콘텐츠편집자 / 뷰어 |
| F9.2 | 슈퍼관리자 | 전체 기능 + 권한 부여 |
| F9.3 | 콘텐츠편집자 | Story 및 Passage 편집 |
| F9.4 | 뷰어 | 읽기 전용 (미리보기) |

#### F10. 통계 대시보드 [MVP 중간]
| ID | 기능 | 설명 |
|----|------|------|
| F10.1 | 방문자 | 일별/주별 방문자 수 |
| F10.2 | 조회수 | Passage별 조회수/체류시간 |
| F10.3 | 완주율 | Story 경로별 완주율 |
| F10.4 | 이탈 분석 | 이탈 지점 분석 |
| F10.5 | 피드백 | 피드백 현황 요약 |

---

## 1.5 콘텐츠 구조

### Story 1: AI 서비스 활용 경로
```
[시작]
    │
    ▼
[필요한 서비스 유형 선택]
    │
    ├──▶ [사내 AI 서비스 사용법]
    │        ├──▶ [서비스 A 가이드]
    │        ├──▶ [서비스 B 가이드]
    │        └──▶ [서비스 C 가이드]
    │
    └──▶ [환경 구축/설치/신청]
             └──▶ [상세 가이드들...]
```

### Story 2: AI 개발 경로
```
[시작]
    │
    ▼
[AI 과제 성격 선택]
    │
    ▼
[개발 목적 선택]
    │
    ├──▶ [자원신청/개발환경 구축]
    ├──▶ [데이터 수집 및 준비]
    └──▶ [구현 가이드 선택]
             ├──▶ [업무 Assistant 개발]
             ├──▶ [Agent 개발]
             └──▶ [ML/DL 모델 구현]
```

---

## 1.6 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 플랫폼 | 데스크톱 웹 브라우저 (Chrome, Edge 우선) |
| 디스플레이 | 라이트 모드 전용 |
| 인증 | 자체 로그인 시스템 (MVP), 추후 SSO 연동 고려 |
| 데이터베이스 | SQLite3 (파일 기반, MVP 적합) |
| 데이터 보관 | 로그 데이터 1년 보관 |
| 배포 | 사내 서버 (보안 절차 준수) |
| 동시 접속 | 100명 이하 (SQLite3 제약) |

---

## 1.7 MVP 우선순위 매트릭스

| 우선순위 | 기능 | 필수 여부 |
|---------|------|----------|
| 1 | 사용자 Story/Passage 탐색 | ✅ 필수 |
| 2 | 좌측 목차 사이드바 | ✅ 필수 |
| 3 | 우측 피드백 게시판 | ✅ 필수 |
| 4 | 관리자 Story 에디터 (Twine 스타일) | ✅ 필수 |
| 5 | 관리자 Passage 콘텐츠 편집기 | ✅ 필수 |
| 6 | 이어보기 | ⭐ 높음 |
| 7 | 상단 미니맵 | ⭐ 높음 |
| 8 | 북마크 | 🔹 중간 |
| 9 | 관리자 통계 대시보드 | 🔹 중간 |
| 10 | 로그인/회원가입 | ✅ 필수 |

---

## 1.8 향후 로드맵 (Post-MVP)

### Phase 2 (MVP+1~2개월)
- SSO 연동
- 고급 통계 분석
- 검색 기능
- PostgreSQL 마이그레이션 (사용자 증가 시)

### Phase 3 (MVP+3~4개월)
- AI 챗봇 도우미 연동
- 학습 인증/배지 시스템
- 모바일 반응형

---

# 📄 2. TRD (Technical Requirements Document)

## 2.1 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    React Application                         ││
│  │  ┌───────────┬──────────────┬───────────────────────────┐  ││
│  │  │  Zustand  │    React     │    Local Storage          │  ││
│  │  │  (State)  │   Router     │  (User Session State)     │  ││
│  │  └───────────┴──────────────┴───────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (HTTPS)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Server (FastAPI)                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      FastAPI App                             ││
│  │  ┌───────────┬──────────────┬───────────────────────────┐  ││
│  │  │   Auth    │    Story     │      Passage              │  ││
│  │  │  Router   │   Router     │      Router               │  ││
│  │  └───────────┴──────────────┴───────────────────────────┘  ││
│  │  ┌───────────┬──────────────┬───────────────────────────┐  ││
│  │  │ Analytics │   Feedback   │       Admin               │  ││
│  │  │  Router   │   Router     │      Router               │  ││
│  │  └───────────┴──────────────┴───────────────────────────┘  ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │              Story Engine (Twine-inspired)           │   ││
│  │  │    - Passage Navigation Logic                        │   ││
│  │  │    - Conditional Branching Evaluator                 │   ││
│  │  │    - State Memory (Previous Passage Tracking)        │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQLAlchemy + aiosqlite
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SQLite3 Database                             │
│                       (./data/app.db)                            │
│  ┌───────────┬──────────────┬───────────────────────────────┐  │
│  │   users   │   stories    │       passages                │  │
│  └───────────┴──────────────┴───────────────────────────────┘  │
│  ┌───────────┬──────────────┬───────────────────────────────┐  │
│  │   links   │  bookmarks   │       feedback                │  │
│  └───────────┴──────────────┴───────────────────────────────┘  │
│  ┌───────────┬──────────────┐                                   │
│  │visit_logs │  images      │                                   │
│  └───────────┴──────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.2 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.x | UI 프레임워크 |
| TypeScript | 5.x | 타입 안정성 |
| Vite | 5.x | 빌드 도구 |
| Zustand | 4.x | 전역 상태 관리 |
| React Router | 6.x | 라우팅 |
| React Flow | 11.x | Twine 스타일 시각적 Story 에디터 |
| TipTap | 2.x | WYSIWYG 에디터 |
| Tailwind CSS | 3.x | 스타일링 |
| Axios | 1.x | HTTP 클라이언트 |
| DOMPurify | 3.x | HTML Sanitization |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Python | 3.11+ | 런타임 |
| FastAPI | 0.109+ | 웹 프레임워크 |
| Uvicorn | 0.27+ | ASGI 서버 |
| SQLAlchemy | 2.0+ | ORM |
| aiosqlite | 0.19+ | 비동기 SQLite 드라이버 |
| Alembic | 1.13+ | DB 마이그레이션 |
| Pydantic | 2.x | 데이터 검증 |
| python-jose | 3.x | JWT 토큰 |
| passlib[bcrypt] | 1.7+ | 비밀번호 해싱 |
| python-multipart | 0.0.6+ | 파일 업로드 |
| aiofiles | 23.0+ | 비동기 파일 처리 |

### Database
| 기술 | 버전 | 용도 |
|------|------|------|
| SQLite3 | 3.x | 메인 데이터베이스 (파일 기반) |

### DevOps
| 기술 | 용도 |
|------|------|
| Docker | 컨테이너화 |
| Docker Compose | 로컬 개발 환경 |
| Nginx | 리버스 프록시 (배포 시) |

---

## 2.3 프로젝트 구조

```
ai-literacy-guide/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Button, Card, Modal, Input
│   │   │   ├── layout/           # Header, Sidebar, Footer, Layout
│   │   │   ├── passage/          # PassageView, PassageNav, LinkButtons
│   │   │   ├── editor/           # StoryEditor, PassageEditor, NodeTypes
│   │   │   ├── minimap/          # Minimap
│   │   │   └── feedback/         # FeedbackList, FeedbackForm, FeedbackItem
│   │   ├── pages/
│   │   │   ├── auth/             # LoginPage, RegisterPage
│   │   │   ├── story/            # StorySelectPage, PassagePage
│   │   │   └── admin/            # Dashboard, StoryEditorPage, StatsPage
│   │   ├── hooks/                # useAuth, useStory, usePassage
│   │   ├── stores/               # authStore, storyStore, uiStore
│   │   ├── services/             # api.ts, authService, storyService
│   │   ├── types/                # story.ts, user.ts, feedback.ts
│   │   ├── utils/                # helpers, constants
│   │   └── styles/               # globals.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI 앱 진입점
│   │   ├── config.py             # 환경설정
│   │   ├── database.py           # DB 연결 설정
│   │   ├── models/               # SQLAlchemy 모델
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── story.py
│   │   │   ├── passage.py
│   │   │   ├── link.py
│   │   │   ├── feedback.py
│   │   │   ├── bookmark.py
│   │   │   └── analytics.py
│   │   ├── schemas/              # Pydantic 스키마
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── story.py
│   │   │   ├── passage.py
│   │   │   ├── link.py
│   │   │   ├── feedback.py
│   │   │   └── analytics.py
│   │   ├── routers/              # API 라우터
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── stories.py
│   │   │   ├── passages.py
│   │   │   ├── feedback.py
│   │   │   ├── bookmarks.py
│   │   │   └── admin.py
│   │   ├── services/             # 비즈니스 로직
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── story_engine.py   # Twine 스타일 네비게이션 엔진
│   │   │   ├── story_service.py
│   │   │   └── analytics_service.py
│   │   ├── core/                 # 핵심 유틸리티
│   │   │   ├── __init__.py
│   │   │   ├── security.py       # JWT, 비밀번호 해싱
│   │   │   └── dependencies.py   # 의존성 주입
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   ├── alembic/                  # DB 마이그레이션
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── data/                     # SQLite DB 파일 저장
│   ├── uploads/                  # 업로드 파일 저장
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_story_engine.py
│   │   └── conftest.py
│   ├── requirements.txt
│   ├── alembic.ini
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── TASKS.md
```

---

## 2.4 핵심 개념 (Twine 기반)

### 용어 정의
| 용어 | 설명 |
|------|------|
| **Story** | 하나의 완전한 학습 경로 (예: "AI 활용 가이드", "AI 개발 가이드") |
| **Passage** | Story 내의 개별 콘텐츠 페이지 (노드) |
| **Link** | Passage 간 연결선, 조건부 분기 가능 |
| **Start Passage** | Story의 시작점 |
| **Story Engine** | 조건부 분기를 처리하는 네비게이션 엔진 |

### 분기 조건 타입
| 타입 | 설명 | 예시 |
|------|------|------|
| `always` | 항상 이동 가능 | 기본 다음 버튼 |
| `previous_passage` | 직전 Passage가 특정 ID일 때만 | "AI 활용" 선택 후에만 표시 |
| `user_selection` | 사용자가 선택할 수 있는 옵션 | 여러 선택지 버튼 |

---

## 2.5 Pydantic 스키마

### Story 스키마
```python
# app/schemas/story.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PassageType(str, Enum):
    START = "start"
    CONTENT = "content"
    BRANCH = "branch"
    END = "end"

class LinkConditionType(str, Enum):
    ALWAYS = "always"
    PREVIOUS_PASSAGE = "previous_passage"
    USER_SELECTION = "user_selection"

# ===== Passage =====
class PassageBase(BaseModel):
    name: str
    content: Optional[str] = ""
    passage_type: PassageType = PassageType.CONTENT
    tags: List[str] = []
    position_x: float = 0
    position_y: float = 0
    width: float = 100
    height: float = 100

class PassageCreate(PassageBase):
    story_id: str

class PassageUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    passage_type: Optional[PassageType] = None
    tags: Optional[List[str]] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

class PassageResponse(PassageBase):
    id: str
    story_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ===== Link =====
class LinkBase(BaseModel):
    name: Optional[str] = None
    condition_type: LinkConditionType = LinkConditionType.ALWAYS
    condition_value: Optional[str] = None
    link_order: int = 0

class LinkCreate(LinkBase):
    story_id: str
    source_passage_id: str
    target_passage_id: str

class LinkUpdate(BaseModel):
    name: Optional[str] = None
    condition_type: Optional[LinkConditionType] = None
    condition_value: Optional[str] = None
    link_order: Optional[int] = None

class LinkResponse(LinkBase):
    id: str
    story_id: str
    source_passage_id: str
    target_passage_id: str

    class Config:
        from_attributes = True

# ===== Story =====
class StoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    zoom: float = 1.0
    tags: List[str] = []

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_passage_id: Optional[str] = None
    is_active: Optional[bool] = None
    zoom: Optional[float] = None
    tags: Optional[List[str]] = None

class StoryResponse(StoryBase):
    id: str
    start_passage_id: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StoryWithPassages(StoryResponse):
    """에디터용 전체 데이터"""
    passages: List[PassageResponse] = []
    links: List[LinkResponse] = []

# ===== Navigation Context =====
class PassageWithContext(BaseModel):
    """사용자 탐색 시 컨텍스트 포함"""
    passage: PassageResponse
    available_links: List[LinkResponse]
    previous_passage_id: Optional[str]
    is_end: bool

class NavigationRequest(BaseModel):
    link_id: str
    previous_passage_id: Optional[str] = None
```

---

## 2.6 Story Engine

```python
# app/services/story_engine.py
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.story import Story
from app.models.passage import Passage
from app.models.link import Link
from app.schemas.story import LinkConditionType, PassageWithContext

class StoryEngine:
    """
    Twine 스타일 Story 네비게이션 엔진
    - 조건부 분기 처리
    - 직전 Passage 기반 동적 라우팅
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_start_passage(self, story_id: str) -> Optional[Passage]:
        """Story의 시작 Passage 반환"""
        # 1. Story의 start_passage_id 확인
        result = await self.db.execute(
            select(Story).where(Story.id == story_id)
        )
        story = result.scalar_one_or_none()
        
        if story and story.start_passage_id:
            result = await self.db.execute(
                select(Passage).where(Passage.id == story.start_passage_id)
            )
            return result.scalar_one_or_none()
        
        # 2. start_passage_id가 없으면 type이 'start'인 것 찾기
        result = await self.db.execute(
            select(Passage).where(
                Passage.story_id == story_id,
                Passage.passage_type == "start"
            )
        )
        return result.scalar_one_or_none()
    
    async def get_available_links(
        self,
        passage_id: str,
        previous_passage_id: Optional[str] = None
    ) -> List[Link]:
        """현재 Passage에서 이동 가능한 Link 목록 (조건 평가 후)"""
        result = await self.db.execute(
            select(Link)
            .where(Link.source_passage_id == passage_id)
            .order_by(Link.link_order)
        )
        all_links = result.scalars().all()
        
        valid_links = []
        for link in all_links:
            if self._evaluate_condition(link, previous_passage_id):
                valid_links.append(link)
        
        return valid_links
    
    def _evaluate_condition(
        self,
        link: Link,
        previous_passage_id: Optional[str]
    ) -> bool:
        """Link 조건 평가"""
        if link.condition_type == LinkConditionType.ALWAYS.value:
            return True
        
        if link.condition_type == LinkConditionType.PREVIOUS_PASSAGE.value:
            return previous_passage_id == link.condition_value
        
        if link.condition_type == LinkConditionType.USER_SELECTION.value:
            return True  # 사용자 선택은 항상 표시
        
        return False
    
    async def get_passage_with_context(
        self,
        passage_id: str,
        previous_passage_id: Optional[str] = None
    ) -> Optional[PassageWithContext]:
        """Passage와 네비게이션 컨텍스트 함께 반환"""
        result = await self.db.execute(
            select(Passage).where(Passage.id == passage_id)
        )
        passage = result.scalar_one_or_none()
        
        if not passage:
            return None
        
        available_links = await self.get_available_links(
            passage_id,
            previous_passage_id
        )
        
        is_end = (
            passage.passage_type == "end" or 
            len(available_links) == 0
        )
        
        return PassageWithContext(
            passage=passage,
            available_links=available_links,
            previous_passage_id=previous_passage_id,
            is_end=is_end
        )
    
    async def navigate(
        self,
        current_passage_id: str,
        link_id: str
    ) -> Optional[Passage]:
        """Link를 통해 다음 Passage로 이동"""
        result = await self.db.execute(
            select(Link).where(
                Link.id == link_id,
                Link.source_passage_id == current_passage_id
            )
        )
        link = result.scalar_one_or_none()
        
        if not link:
            return None
        
        result = await self.db.execute(
            select(Passage).where(Passage.id == link.target_passage_id)
        )
        return result.scalar_one_or_none()
```

---

## 2.7 API 엔드포인트

### 인증 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 (JWT 발급) |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### Story API (사용자)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/stories` | 활성 Story 목록 |
| GET | `/api/stories/{id}` | Story 상세 |
| GET | `/api/stories/{id}/start` | 시작 Passage 조회 |

### Passage API (사용자)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/passages/{id}` | Passage + 컨텍스트 조회 |
| POST | `/api/passages/{id}/navigate` | 다음 Passage로 이동 |

### Feedback API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/feedback` | 피드백 목록 |
| POST | `/api/feedback` | 피드백 작성 |
| POST | `/api/feedback/{id}/reply` | 답변 작성 |
| DELETE | `/api/feedback/{id}` | 피드백 삭제 |

### Bookmark API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/bookmarks` | 내 북마크 목록 |
| POST | `/api/bookmarks/{passage_id}` | 북마크 추가 |
| DELETE | `/api/bookmarks/{passage_id}` | 북마크 삭제 |

### Admin API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/admin/stories` | 전체 Story 목록 |
| POST | `/api/admin/stories` | Story 생성 |
| GET | `/api/admin/stories/{id}` | Story 전체 데이터 (에디터용) |
| PUT | `/api/admin/stories/{id}` | Story 정보 수정 |
| PUT | `/api/admin/stories/{id}/full` | Story 전체 저장 |
| DELETE | `/api/admin/stories/{id}` | Story 삭제 |
| POST | `/api/admin/passages` | Passage 생성 |
| PUT | `/api/admin/passages/{id}` | Passage 수정 |
| DELETE | `/api/admin/passages/{id}` | Passage 삭제 |
| POST | `/api/admin/links` | Link 생성 |
| PUT | `/api/admin/links/{id}` | Link 수정 |
| DELETE | `/api/admin/links/{id}` | Link 삭제 |
| POST | `/api/admin/upload/image` | 이미지 업로드 |
| GET | `/api/admin/users` | 사용자 목록 |
| PUT | `/api/admin/users/{id}/role` | 권한 변경 |
| GET | `/api/admin/stats/overview` | 통계 개요 |
| GET | `/api/admin/stats/passages` | Passage별 통계 |

---

## 2.8 Database 설정

### database.py
```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

# 데이터 디렉토리 생성
DATABASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATABASE_DIR, exist_ok=True)

# SQLite 데이터베이스 URL
DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_DIR}/app.db"

# 비동기 엔진
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False}
)

# 세션 팩토리
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base 클래스
Base = declarative_base()

# 의존성 주입
async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
```

### config.py
```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # 앱
    APP_NAME: str = "AI Literacy Workflow Guide"
    DEBUG: bool = True
    
    # 데이터베이스
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24시간
    
    # 파일 업로드
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
```

---

## 2.9 Local Storage 스키마

```typescript
interface LocalStorageSchema {
  // 인증 토큰
  auth_token: string;
  
  // 마지막 방문 정보 (이어보기)
  last_visit: {
    storyId: string;
    passageId: string;
    timestamp: number;
  };
  
  // 직전 Passage ID (Story Engine용)
  previous_passage_id: string;
  
  // 네비게이션 히스토리 (뒤로가기/목차용)
  navigation_history: string[];  // passageId 배열
  
  // UI 상태
  ui_preferences: {
    leftSidebarCollapsed: boolean;
    rightSidebarCollapsed: boolean;
    editorZoom: number;
  };
}
```

---

## 2.10 requirements.txt

```
# Web Framework
fastapi>=0.109.0
uvicorn[standard]>=0.27.0

# Database (SQLite)
sqlalchemy>=2.0.0
aiosqlite>=0.19.0
alembic>=1.13.0

# Authentication
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4

# Validation
pydantic>=2.0.0
pydantic-settings>=2.0.0
email-validator>=2.0.0

# File Upload
python-multipart>=0.0.6
aiofiles>=23.0.0

# Utilities
python-dotenv>=1.0.0

# Development
pytest>=7.0.0
pytest-asyncio>=0.21.0
httpx>=0.25.0
black>=23.0.0
ruff>=0.1.0
```

---

## 2.11 Docker 설정

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/app.db
      - DEBUG=true
      - SECRET_KEY=dev-secret-key
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
    command: npm run dev -- --host
    depends_on:
      - backend
```

### backend/Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### frontend/Dockerfile
```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

---

## 2.12 SQLite3 주의사항

| 항목 | 내용 |
|------|------|
| 동시성 | 쓰기 작업 시 파일 잠금, 동시 접속 100명 이하 권장 |
| Boolean | INTEGER (0/1) 사용 |
| JSON | TEXT로 저장, Python에서 json.loads/dumps |
| ENUM | CHECK 제약조건 또는 앱 레벨 검증 |
| Auto Timestamp | ON UPDATE 미지원, 앱에서 처리 |
| 백업 | `cp data/app.db data/app.db.backup` |
| 확장성 | 사용자 증가 시 PostgreSQL 마이그레이션 고려 |

---

# 📄 3. User Flow

## 3.1 사용자 메인 플로우

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           사용자 메인 플로우                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────┐
                              │  시작   │
                              └────┬────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │로그인됨?│
                              └────┬────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
                  [예]                         [아니오]
                    │                             │
                    │                             ▼
                    │                      ┌─────────────┐
                    │                      │로그인/회원가입│
                    │                      └──────┬──────┘
                    │                             │
                    ◀─────────────────────────────┘
                    │
                    ▼
             ┌─────────────┐
             │ 이어보기    │
             │ 데이터 있음?│
             └──────┬──────┘
                    │
         ┌─────────┴─────────┐
         ▼                   ▼
       [예]               [아니오]
         │                   │
         ▼                   │
  ┌─────────────┐            │
  │"이어서 볼까요?"│           │
  │   모달      │            │
  └──────┬──────┘            │
         │                   │
    ┌────┴────┐              │
    ▼         ▼              │
 [이어보기] [처음부터]         │
    │         │              │
    │         └──────────────┤
    │                        │
    ▼                        ▼
┌─────────┐           ┌─────────────┐
│마지막   │           │  Story      │
│Passage  │           │  선택 화면  │
└────┬────┘           └──────┬──────┘
     │                       │
     │                ┌──────┴──────┐
     │                ▼             ▼
     │         ┌─────────┐   ┌─────────┐
     │         │AI 활용  │   │AI 개발  │
     │         │ Story   │   │ Story   │
     │         └────┬────┘   └────┬────┘
     │              │             │
     │              └──────┬──────┘
     │                     │
     └─────────────────────┤
                           │
                           ▼
                  ┌─────────────────┐
                  │   Passage 표시   │◀─────────────────┐
                  │                 │                   │
                  │ ┌─────────────┐ │                   │
                  │ │   콘텐츠    │ │                   │
                  │ └─────────────┘ │                   │
                  │                 │                   │
                  │ ┌─────────────┐ │                   │
                  │ │ Link 버튼들 │ │                   │
                  │ │(다음 선택지)│ │                   │
                  │ └─────────────┘ │                   │
                  └────────┬────────┘                   │
                           │                           │
          ┌────────────────┼────────────────┐          │
          ▼                ▼                ▼          │
     ┌─────────┐     ┌─────────┐      ┌─────────┐     │
     │  이전   │     │Link 선택│      │  경로   │     │
     │  버튼   │     │ (다음)  │      │ 재선택  │     │
     └────┬────┘     └────┬────┘      └────┬────┘     │
          │               │                │          │
          ▼               ▼                ▼          │
     ┌─────────┐    ┌──────────┐    ┌─────────────┐   │
     │이전     │    │다음      │    │Story 선택   │   │
     │Passage  │    │Passage   │    │화면으로     │   │
     └────┬────┘    └────┬─────┘    └─────────────┘   │
          │              │                            │
          └──────────────┴────────────────────────────┘
```

---

## 3.2 Story 분기 상세 플로우

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Story 분기 로직                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   Story 선택    │
                         │   (시작점)      │
                         └────────┬────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
           ┌─────────────┐               ┌─────────────┐
           │ "AI 서비스  │               │ "AI 과제를  │
           │  활용하기"  │               │  개발하고   │
           │             │               │  싶어요"    │
           └──────┬──────┘               └──────┬──────┘
                  │                             │
                  ▼                             ▼
           ┌─────────────┐               ┌─────────────┐
           │ 서비스 유형 │               │ 과제 성격   │
           │   선택      │               │   선택      │
           └──────┬──────┘               └──────┬──────┘
                  │                             │
           ┌──────┴──────┐               ┌──────┴──────┐
           ▼             ▼               ▼             ▼
      ┌─────────┐  ┌─────────┐     ┌─────────┐  ┌─────────┐
      │사내     │  │환경     │     │업무     │  │ML/DL    │
      │서비스   │  │구축     │     │자동화   │  │모델     │
      │사용법   │  │가이드   │     │Agent    │  │개발     │
      └────┬────┘  └────┬────┘     └────┬────┘  └────┬────┘
           │            │               │            │
           ▼            ▼               ▼            ▼
      ┌─────────┐  ┌─────────┐     ┌─────────┐  ┌─────────┐
      │서비스 A │  │설치     │     │자원신청 │  │데이터   │
      │가이드   │  │가이드   │     │가이드   │  │준비     │
      └─────────┘  └─────────┘     └─────────┘  └─────────┘
           :            :               :            :
         [상세 Passage들...]         [상세 Passage들...]


    ※ Link 조건 예시:
    ┌────────────────────────────────────────────────────────────┐
    │ condition_type: "previous_passage"                         │
    │ condition_value: "ai-usage-selection"                      │
    │ → "AI 활용하기"를 선택한 사용자에게만 이 Link 표시          │
    └────────────────────────────────────────────────────────────┘
```

---

## 3.3 관리자 플로우

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           관리자 플로우                                       │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │관리자 로그인│
                              └──────┬──────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ 관리자      │
                              │ 대시보드    │
                              └──────┬──────┘
                                     │
         ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
         ▼           ▼           ▼       ▼           ▼           ▼
    ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐
    │ Story   ││ Passage ││ 통계    ││ 피드백  ││ 사용자  ││ 설정    │
    │ 목록    ││ 목록    ││ 보기    ││ 관리    ││ 권한    ││         │
    └────┬────┘└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘
         │
         ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                   Story 에디터 (Twine 스타일)                │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │                                                      │   │
    │  │    [Start]──────▶[Passage A]──────▶[Passage B]      │   │
    │  │                        │                             │   │
    │  │                        ▼                             │   │
    │  │                  [Passage C]──────▶[End]             │   │
    │  │                                                      │   │
    │  │  ※ React Flow 기반 드래그앤드롭 에디터               │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                             │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
    │  │ + Passage    │  │ + Link       │  │   저장       │      │
    │  │   추가       │  │   연결       │  │              │      │
    │  └──────────────┘  └──────────────┘  └──────────────┘      │
    └─────────────────────────────────────────────────────────────┘
                                     │
                                     │ Passage 더블클릭
                                     ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                   Passage 콘텐츠 편집기                       │
    │  ┌─────────────────────────────────────────────────────┐   │
    │  │  제목: [________________]                            │   │
    │  │  타입: [content ▼]                                   │   │
    │  │  태그: [tag1, tag2, ...]                             │   │
    │  │                                                      │   │
    │  │  ┌────────────────────────────────────────────────┐ │   │
    │  │  │  WYSIWYG 에디터 (TipTap)                        │ │   │
    │  │  │                                                 │ │   │
    │  │  │  Bold  Italic  Image  Link  Code  ...          │ │   │
    │  │  │  ─────────────────────────────────────────     │ │   │
    │  │  │                                                 │ │   │
    │  │  │  콘텐츠를 여기에 작성...                         │ │   │
    │  │  │                                                 │ │   │
    │  │  └────────────────────────────────────────────────┘ │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                             │
    │  ┌──────────────┐  ┌──────────────┐                        │
    │  │    저장      │  │    취소      │                        │
    │  └──────────────┘  └──────────────┘                        │
    └─────────────────────────────────────────────────────────────┘
```

---

## 3.4 Link 조건 설정 플로우

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Link 조건 설정                                       │
└─────────────────────────────────────────────────────────────────────────────┘

    [Passage A] ─────────────────────▶ [Passage B]
                        │
                        │ Link 클릭
                        ▼
              ┌─────────────────────────────────────┐
              │         Link 설정 모달              │
              │                                     │
              │  Link 이름: [다음으로_________]     │
              │                                     │
              │  조건 타입:                         │
              │  ○ always (항상)                   │
              │  ○ previous_passage (직전 기반)    │
              │  ○ user_selection (사용자 선택)    │
              │                                     │
              │  ─────────────────────────────────  │
              │                                     │
              │  [previous_passage 선택 시]         │
              │  조건 Passage: [Passage 선택 ▼]     │
              │                                     │
              │  ─────────────────────────────────  │
              │                                     │
              │  순서: [0]                          │
              │                                     │
              │  ┌─────────┐  ┌─────────┐          │
              │  │  저장   │  │  취소   │          │
              │  └─────────┘  └─────────┘          │
              └─────────────────────────────────────┘
```

---

# 📄 4. Database Design

## 4.1 ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ERD 다이어그램                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ password         │
│ name             │
│ role             │──────────────────────────────────────┐
│ created_at       │                                      │
│ updated_at       │                                      │
│ last_login       │                                      │
└────────┬─────────┘                                      │
         │                                                │
         │ 1:N                                            │
         ▼                                                │
┌──────────────────┐       1:N        ┌──────────────────┐│
│     stories      │─────────────────▶│    passages      ││
├──────────────────┤                  ├──────────────────┤│
│ id (PK)          │                  │ id (PK)          ││
│ name             │                  │ story_id (FK)    │◀┘
│ description      │                  │ name             │
│ start_passage_id │─ ─ ─ ─ ─ ─ ─ ─ ▶│ content          │
│ is_active        │                  │ passage_type     │
│ zoom             │                  │ tags             │
│ tags             │                  │ position_x       │
│ created_by (FK)  │◀─────────────────│ position_y       │
│ created_at       │                  │ width            │
│ updated_at       │                  │ height           │
└────────┬─────────┘                  │ created_at       │
         │                            │ updated_at       │
         │ 1:N                        └────────┬─────────┘
         ▼                                     │
┌──────────────────┐                           │
│      links       │◀──────────────────────────┤ 1:N (source)
├──────────────────┤                           │
│ id (PK)          │◀──────────────────────────┘ 1:N (target)
│ story_id (FK)    │
│ source_passage_id│
│ target_passage_id│
│ name             │
│ condition_type   │
│ condition_value  │
│ link_order       │
└──────────────────┘


┌──────────────────┐                  ┌──────────────────┐
│    bookmarks     │                  │     feedback     │
├──────────────────┤                  ├──────────────────┤
│ id (PK)          │                  │ id (PK)          │
│ user_id (FK)     │──┐               │ user_id (FK)     │──┐
│ passage_id (FK)  │──┼───────────────│ passage_id (FK)  │──┼──▶ passages
│ created_at       │  │               │ content          │  │
└──────────────────┘  │               │ is_anonymous     │  │
                      │               │ parent_id (FK)   │──┼──▶ feedback (self)
                      │               │ created_at       │  │
                      │               │ updated_at       │  │
                      │               └──────────────────┘  │
                      │                                     │
                      └────────────────────────────────────▶│ users
                                                            │
┌──────────────────┐                  ┌──────────────────┐  │
│   visit_logs     │                  │     images       │  │
├──────────────────┤                  ├──────────────────┤  │
│ id (PK)          │                  │ id (PK)          │  │
│ user_id (FK)     │──────────────────│ filename         │  │
│ story_id (FK)    │                  │ original_name    │  │
│ passage_id (FK)  │                  │ mime_type        │  │
│ prev_passage_id  │                  │ size_bytes       │  │
│ duration_seconds │                  │ uploaded_by (FK) │──┘
│ created_at       │                  │ created_at       │
└──────────────────┘                  └──────────────────┘
```

---

## 4.2 테이블 스키마

### users
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('super_admin', 'editor', 'viewer', 'user')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### stories
```sql
CREATE TABLE stories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_passage_id TEXT,
    is_active INTEGER DEFAULT 1,
    zoom REAL DEFAULT 1.0,
    tags TEXT DEFAULT '[]',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_stories_active ON stories(is_active);
CREATE INDEX idx_stories_created_by ON stories(created_by);
```

### passages
```sql
CREATE TABLE passages (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT DEFAULT '',
    passage_type TEXT DEFAULT 'content' CHECK(passage_type IN ('start', 'content', 'branch', 'end')),
    tags TEXT DEFAULT '[]',
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    width REAL DEFAULT 100,
    height REAL DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_passages_story ON passages(story_id);
CREATE INDEX idx_passages_type ON passages(passage_type);
```

### links
```sql
CREATE TABLE links (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    source_passage_id TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
    target_passage_id TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
    name TEXT,
    condition_type TEXT DEFAULT 'always' CHECK(condition_type IN ('always', 'previous_passage', 'user_selection')),
    condition_value TEXT,
    link_order INTEGER DEFAULT 0
);

CREATE INDEX idx_links_story ON links(story_id);
CREATE INDEX idx_links_source ON links(source_passage_id);
CREATE INDEX idx_links_target ON links(target_passage_id);
```

### bookmarks
```sql
CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    passage_id TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, passage_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
```

### feedback
```sql
CREATE TABLE feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    passage_id TEXT REFERENCES passages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous INTEGER DEFAULT 0,
    parent_id TEXT REFERENCES feedback(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_feedback_passage ON feedback(passage_id);
CREATE INDEX idx_feedback_parent ON feedback(parent_id);
CREATE INDEX idx_feedback_user ON feedback(user_id);
```

### visit_logs
```sql
CREATE TABLE visit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
    passage_id TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
    previous_passage_id TEXT,
    duration_seconds INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_visit_logs_user ON visit_logs(user_id);
CREATE INDEX idx_visit_logs_passage ON visit_logs(passage_id);
CREATE INDEX idx_visit_logs_story ON visit_logs(story_id);
CREATE INDEX idx_visit_logs_created ON visit_logs(created_at);
```

### images
```sql
CREATE TABLE images (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_images_uploaded_by ON images(uploaded_by);
```

---

## 4.3 SQLAlchemy 모델

### models/user.py
```python
from sqlalchemy import Column, String, Text
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), default="user")  # super_admin, editor, viewer, user
    created_at = Column(String(26), default=now_iso)
    updated_at = Column(String(26), default=now_iso, onupdate=now_iso)
    last_login = Column(String(26), nullable=True)
```

### models/story.py
```python
from sqlalchemy import Column, String, Text, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

class Story(Base):
    __tablename__ = "stories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_passage_id = Column(String(36), nullable=True)
    is_active = Column(Integer, default=1)
    zoom = Column(Float, default=1.0)
    tags = Column(Text, default="[]")
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(String(26), default=now_iso)
    updated_at = Column(String(26), default=now_iso, onupdate=now_iso)
    
    passages = relationship("Passage", back_populates="story", cascade="all, delete-orphan")
    links = relationship("Link", back_populates="story", cascade="all, delete-orphan")
```

### models/passage.py
```python
from sqlalchemy import Column, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

class Passage(Base):
    __tablename__ = "passages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    story_id = Column(String(36), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    content = Column(Text, default="")
    passage_type = Column(String(20), default="content")  # start, content, branch, end
    tags = Column(Text, default="[]")
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    width = Column(Float, default=100)
    height = Column(Float, default=100)
    created_at = Column(String(26), default=now_iso)
    updated_at = Column(String(26), default=now_iso, onupdate=now_iso)
    
    story = relationship("Story", back_populates="passages")
```

### models/link.py
```python
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Link(Base):
    __tablename__ = "links"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    story_id = Column(String(36), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    source_passage_id = Column(String(36), ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
    target_passage_id = Column(String(36), ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=True)
    condition_type = Column(String(20), default="always")  # always, previous_passage, user_selection
    condition_value = Column(String(36), nullable=True)
    link_order = Column(Integer, default=0)
    
    story = relationship("Story", back_populates="links")
    source_passage = relationship("Passage", foreign_keys=[source_passage_id])
    target_passage = relationship("Passage", foreign_keys=[target_passage_id])
```

---

# 📄 5. Design System

## 5.1 Color Palette

### Primary Colors
```css
:root {
  /* Primary - Purple */
  --primary-50: #F5F3FF;
  --primary-100: #EDE9FE;
  --primary-200: #DDD6FE;
  --primary-300: #C4B5FD;
  --primary-400: #A78BFA;
  --primary-500: #8B5CF6;
  --primary-600: #7C3AED;
  --primary-700: #6D28D9;
  --primary-800: #5B21B6;
  --primary-900: #4C1D95;
  
  /* Primary Shortcuts */
  --primary-main: #7C3AED;     /* primary-600 */
  --primary-light: #A78BFA;    /* primary-400 */
  --primary-dark: #5B21B6;     /* primary-800 */
}
```

### Neutral Colors
```css
:root {
  /* Neutral - Gray */
  --neutral-50: #FAFAFA;
  --neutral-100: #F5F5F5;
  --neutral-200: #E5E5E5;
  --neutral-300: #D4D4D4;
  --neutral-400: #A3A3A3;
  --neutral-500: #737373;
  --neutral-600: #525252;
  --neutral-700: #404040;
  --neutral-800: #262626;
  --neutral-900: #171717;
  
  /* Shortcuts */
  --neutral-light: #E5E5E5;
  --neutral-dark: #171717;
  --white: #FFFFFF;
  --black: #000000;
}
```

### Semantic Colors
```css
:root {
  /* Success - Green */
  --success-light: #D1FAE5;
  --success-main: #10B981;
  --success-dark: #047857;
  
  /* Warning - Yellow */
  --warning-light: #FEF3C7;
  --warning-main: #F59E0B;
  --warning-dark: #B45309;
  
  /* Error - Red */
  --error-light: #FEE2E2;
  --error-main: #EF4444;
  --error-dark: #B91C1C;
  
  /* Info - Blue */
  --info-light: #DBEAFE;
  --info-main: #3B82F6;
  --info-dark: #1D4ED8;
}
```

### Background Colors
```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAFA;
  --bg-tertiary: #F5F3FF;    /* primary-50 기반 */
  --bg-elevated: #FFFFFF;
}
```

### Text Colors
```css
:root {
  --text-primary: #171717;    /* neutral-900 */
  --text-secondary: #525252;  /* neutral-600 */
  --text-tertiary: #737373;   /* neutral-500 */
  --text-disabled: #A3A3A3;   /* neutral-400 */
  --text-inverse: #FFFFFF;
  --text-link: #7C3AED;       /* primary-600 */
}
```

---

## 5.2 Typography

### Font Family
```css
:root {
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}
```

### Font Scale
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `text-xs` | 12px | 400 | 1.5 | Caption, 작은 레이블 |
| `text-sm` | 14px | 400 | 1.5 | 보조 텍스트 |
| `text-base` | 16px | 400 | 1.6 | 본문 |
| `text-lg` | 18px | 500 | 1.5 | 강조 본문 |
| `text-xl` | 20px | 600 | 1.4 | 소제목 (H4) |
| `text-2xl` | 24px | 600 | 1.3 | 제목 (H3) |
| `text-3xl` | 30px | 700 | 1.2 | 섹션 제목 (H2) |
| `text-4xl` | 36px | 700 | 1.2 | 페이지 제목 (H1) |

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

---

## 5.3 Spacing

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

---

## 5.4 Layout

### Layout Variables
```css
:root {
  /* Header */
  --header-height: 64px;
  
  /* Minimap */
  --minimap-height: 120px;
  
  /* Sidebar */
  --sidebar-left-width: 280px;
  --sidebar-left-collapsed: 60px;
  --sidebar-right-width: 320px;
  --sidebar-right-collapsed: 48px;
  
  /* Content */
  --content-max-width: 800px;
  --content-padding: var(--space-8);
  
  /* Footer Navigation */
  --footer-nav-height: 72px;
}
```

### Layout Structure
```
┌────────────────────────────────────────────────────────────────────────┐
│                         Header (64px)                                   │
│  ┌──────────┐                                          ┌────────────┐  │
│  │   Logo   │           AI Literacy Guide              │   User     │  │
│  └──────────┘                                          └────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                         Minimap (120px)                                 │
│     [●]────[○]────[○]────[○]────[○]                                    │
│      ↑ current                                                          │
├──────────┬─────────────────────────────────────────────┬───────────────┤
│          │                                             │               │
│  Left    │              Main Content                   │    Right      │
│  Sidebar │                                             │    Sidebar    │
│  (280px) │           (flex: 1, max 800px)              │    (320px)    │
│          │                                             │               │
│ ┌──────┐ │    ┌─────────────────────────────────┐     │  ┌─────────┐  │
│ │북마크│ │    │                                 │     │  │ 피드백  │  │
│ └──────┘ │    │      Passage Content            │     │  │ 게시판  │  │
│ ┌──────┐ │    │                                 │     │  │         │  │
│ │ 목차 │ │    │                                 │     │  │         │  │
│ │      │ │    │                                 │     │  │         │  │
│ │ ▸ 1  │ │    └─────────────────────────────────┘     │  └─────────┘  │
│ │ ▸ 2  │ │                                             │               │
│ │ ▾ 3  │ │                                             │               │
│ │   3.1│ │                                             │               │
│ │   3.2│ │                                             │               │
│ └──────┘ │                                             │               │
│          │                                             │               │
├──────────┴─────────────────────────────────────────────┴───────────────┤
│                    Navigation Footer (72px)                             │
│          ┌──────────┐                    ┌──────────┐  ┌─────────────┐ │
│          │  ← 이전  │                    │  다음 →  │  │ 경로 재선택 │ │
│          └──────────┘                    └──────────┘  └─────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5.5 Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--primary-main);
  color: var(--text-inverse);
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: var(--neutral-300);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--primary-main);
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--primary-main);
  border-radius: 8px;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--primary-50);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: 6px;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-ghost:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}
```

### Cards

```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-elevated {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
```

### Input

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--neutral-300);
  border-radius: 8px;
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: all 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-main);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.input::placeholder {
  color: var(--text-disabled);
}
```

### Sidebar Navigation

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.nav-item:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-50);
  color: var(--primary-main);
  font-weight: var(--font-medium);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--primary-main);
  border-radius: 0 2px 2px 0;
}
```

### Passage Node (Minimap / Editor)

```css
.passage-node {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--neutral-200);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.passage-node:hover {
  transform: scale(1.2);
  background: var(--primary-200);
}

.passage-node.visited {
  background: var(--primary-300);
}

.passage-node.current {
  background: var(--primary-main);
  border-color: var(--primary-200);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
}

.passage-node.start {
  background: var(--success-main);
}

.passage-node.end {
  background: var(--error-main);
}

.passage-node.branch {
  background: var(--warning-main);
}
```

### Link Edge (Editor)

```css
.link-edge {
  stroke: var(--neutral-300);
  stroke-width: 2;
  fill: none;
  transition: stroke 0.2s ease;
}

.link-edge:hover {
  stroke: var(--primary-main);
}

.link-edge.selected {
  stroke: var(--primary-main);
  stroke-width: 3;
}
```

### Feedback Item

```css
.feedback-item {
  padding: var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  background: var(--bg-primary);
}

.feedback-item .author {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-bottom: var(--space-2);
}

.feedback-item .content {
  font-size: var(--text-base);
  color: var(--text-primary);
  line-height: var(--leading-relaxed);
}

.feedback-item .reply {
  margin-top: var(--space-3);
  margin-left: var(--space-4);
  padding-left: var(--space-4);
  border-left: 2px solid var(--primary-200);
}
```

### Modal

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: var(--space-6);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-4);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
```

---

## 5.6 Shadows

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

---

## 5.7 Border Radius

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

---

## 5.8 Transitions

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## 5.9 Icons

| Category | Icons | Library |
|----------|-------|---------|
| Navigation | Home, ChevronLeft, ChevronRight, Menu | Lucide React |
| Actions | Plus, Edit, Trash, Save, X | Lucide React |
| Status | Check, AlertCircle, Info, HelpCircle | Lucide React |
| Content | Bookmark, MessageSquare, Search, Settings | Lucide React |
| User | User, LogOut, Shield | Lucide React |
| Editor | Move, Link, Unlink, Eye | Lucide React |

---

## 5.10 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        'content': '800px',
      },
    },
  },
  plugins: [],
};
```

---

# 📄 6. TASKS.md

```markdown
# AI Literacy Workflow Guide - MVP Development Tasks

## 프로젝트 정보
- **목표 기간**: 30일
- **백엔드**: Python FastAPI + SQLite3
- **프론트엔드**: React + TypeScript + Vite
- **참고 시스템**: Twine (twinejs)
- **핵심 개념**: Story, Passage, Link

---

## 📅 Week 1 (Day 1-7): 프로젝트 셋업 & 핵심 구조

### Day 1-2: 환경 설정

#### Backend 초기화
- [ ] 프로젝트 폴더 구조 생성
- [ ] `requirements.txt` 작성
- [ ] FastAPI 앱 기본 설정 (`app/main.py`)
- [ ] 환경 설정 (`app/config.py`)
- [ ] SQLite + SQLAlchemy 설정 (`app/database.py`)
- [ ] Alembic 초기화 및 설정
- [ ] 초기 마이그레이션 생성

#### Frontend 초기화
- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] Tailwind CSS 설치 및 설정
- [ ] 기본 폴더 구조 생성
- [ ] ESLint, Prettier 설정

#### DevOps
- [ ] `docker-compose.yml` 작성
- [ ] Backend Dockerfile 작성
- [ ] Frontend Dockerfile 작성
- [ ] `.env.example` 파일 생성
- [ ] `.gitignore` 설정

### Day 3-4: 인증 시스템

#### Backend
- [ ] User 모델 생성 (`models/user.py`)
- [ ] User 스키마 생성 (`schemas/user.py`)
- [ ] 비밀번호 해싱 유틸 (`core/security.py`)
- [ ] JWT 토큰 생성/검증 (`core/security.py`)
- [ ] Auth 서비스 (`services/auth_service.py`)
- [ ] Auth 라우터 (`routers/auth.py`)
  - [ ] POST `/api/auth/register`
  - [ ] POST `/api/auth/login`
  - [ ] GET `/api/auth/me`
- [ ] 인증 의존성 (`core/dependencies.py`)
- [ ] 권한 체크 미들웨어

#### Frontend
- [ ] API 클라이언트 설정 (`services/api.ts`)
- [ ] Auth Store 생성 (`stores/authStore.ts`)
- [ ] 로그인 페이지 UI
- [ ] 회원가입 페이지 UI
- [ ] Protected Route 컴포넌트

### Day 5-7: 레이아웃 & 기본 UI

#### Design System 적용
- [ ] CSS Variables 설정 (`styles/variables.css`)
- [ ] Tailwind 커스텀 설정
- [ ] 공통 컴포넌트: Button
- [ ] 공통 컴포넌트: Input
- [ ] 공통 컴포넌트: Card
- [ ] 공통 컴포넌트: Modal

#### Layout 컴포넌트
- [ ] MainLayout 컴포넌트
- [ ] Header 컴포넌트
- [ ] LeftSidebar 컴포넌트 (접기/펼치기)
- [ ] RightSidebar 컴포넌트 (접기/펼치기)
- [ ] NavigationFooter 컴포넌트
- [ ] UI Store 생성 (사이드바 상태)

**✅ Week 1 마일스톤**: 로그인/회원가입 동작, 기본 레이아웃 렌더링

---

## 📅 Week 2 (Day 8-14): Story Engine & Passage 탐색

### Day 8-10: 데이터 모델 & API

#### Backend Models
- [ ] Story 모델 (`models/story.py`)
- [ ] Passage 모델 (`models/passage.py`)
- [ ] Link 모델 (`models/link.py`)
- [ ] Alembic 마이그레이션 생성/적용

#### Backend Schemas
- [ ] Story 스키마 (`schemas/story.py`)
- [ ] Passage 스키마 (`schemas/passage.py`)
- [ ] Link 스키마 (`schemas/link.py`)
- [ ] PassageWithContext 스키마

#### Story Engine
- [ ] StoryEngine 클래스 (`services/story_engine.py`)
  - [ ] `get_start_passage()`
  - [ ] `get_available_links()`
  - [ ] `_evaluate_condition()`
  - [ ] `get_passage_with_context()`
  - [ ] `navigate()`

#### API 엔드포인트
- [ ] Stories 라우터 (`routers/stories.py`)
  - [ ] GET `/api/stories`
  - [ ] GET `/api/stories/{id}`
  - [ ] GET `/api/stories/{id}/start`
- [ ] Passages 라우터 (`routers/passages.py`)
  - [ ] GET `/api/passages/{id}`
  - [ ] POST `/api/passages/{id}/navigate`

### Day 11-12: 사용자 Passage 탐색 UI

#### Frontend
- [ ] Story 타입 정의 (`types/story.ts`)
- [ ] Story Store 생성 (`stores/storyStore.ts`)
- [ ] Story 서비스 (`services/storyService.ts`)
- [ ] StorySelectPage (목표 선택 화면)
- [ ] PassagePage (콘텐츠 표시)
- [ ] PassageContent 컴포넌트 (HTML 렌더링, DOMPurify)
- [ ] LinkButtons 컴포넌트 (다음 선택지)
- [ ] NavigationFooter 이전/다음 버튼 연결
- [ ] 경로 재선택 버튼
- [ ] React Router 설정
  - [ ] `/stories` - 목록
  - [ ] `/story/:storyId` - 시작
  - [ ] `/story/:storyId/passage/:passageId` - Passage 보기

### Day 13-14: 좌측 사이드바 (목차)

#### Backend
- [ ] 네비게이션 히스토리 기반 목차 조회 API

#### Frontend
- [ ] TableOfContents 컴포넌트
- [ ] 아코디언 UI
- [ ] 현재 Passage 하이라이트
- [ ] 클릭 시 해당 Passage로 이동
- [ ] 사이드바 최소화 상태 localStorage 저장

**✅ Week 2 마일스톤**: 샘플 데이터로 Story/Passage 탐색 동작, 조건부 분기 확인

---

## 📅 Week 3 (Day 15-21): 관리자 기능

### Day 15-17: Twine 스타일 Story 에디터

#### Frontend
- [ ] React Flow 설치 및 설정
- [ ] 커스텀 노드 타입 정의
  - [ ] StartNode (초록)
  - [ ] ContentNode (기본)
  - [ ] BranchNode (노랑)
  - [ ] EndNode (빨강)
- [ ] 커스텀 엣지 컴포넌트
- [ ] StoryEditorPage
- [ ] 노드 추가 기능
- [ ] 노드 삭제 기능
- [ ] 노드 드래그 이동
- [ ] 엣지(Link) 연결 드래그 생성
- [ ] 엣지 삭제 기능
- [ ] Link 조건 설정 모달
  - [ ] condition_type 선택
  - [ ] condition_value 입력
- [ ] 에디터 줌/팬 기능
- [ ] 저장 버튼

#### Backend Admin API
- [ ] Admin 라우터 (`routers/admin.py`)
  - [ ] GET `/api/admin/stories`
  - [ ] POST `/api/admin/stories`
  - [ ] GET `/api/admin/stories/{id}` (전체 데이터)
  - [ ] PUT `/api/admin/stories/{id}`
  - [ ] PUT `/api/admin/stories/{id}/full` (전체 저장)
  - [ ] DELETE `/api/admin/stories/{id}`
  - [ ] POST `/api/admin/passages`
  - [ ] PUT `/api/admin/passages/{id}`
  - [ ] DELETE `/api/admin/passages/{id}`
  - [ ] POST `/api/admin/links`
  - [ ] PUT `/api/admin/links/{id}`
  - [ ] DELETE `/api/admin/links/{id}`

### Day 18-19: Passage 콘텐츠 편집기

#### Frontend
- [ ] TipTap 에디터 설치 및 설정
- [ ] PassageEditorModal 컴포넌트
- [ ] WYSIWYG 툴바 (Bold, Italic, Heading, List, Link, Code)
- [ ] 이미지 업로드 버튼
- [ ] Passage 메타정보 편집 (이름, 타입, 태그)
- [ ] 노드 더블클릭 → 편집 모달 열기

#### Backend
- [ ] 이미지 업로드 API
  - [ ] POST `/api/admin/upload/image`
  - [ ] 이미지 저장 (`uploads/` 디렉토리)
  - [ ] Image 모델 및 저장
- [ ] Static 파일 서빙 설정

### Day 20-21: 관리자 대시보드

#### Frontend
- [ ] 관리자 라우트 보호 (role 체크)
- [ ] AdminLayout 컴포넌트
- [ ] AdminDashboard 페이지
- [ ] Story 목록 페이지
- [ ] 사용자 목록 페이지 (슈퍼관리자)
- [ ] 사용자 권한 변경 UI

#### Backend
- [ ] GET `/api/admin/users`
- [ ] PUT `/api/admin/users/{id}/role`

**✅ Week 3 마일스톤**: 관리자가 Twine 스타일로 Story 생성/편집 가능

---

## 📅 Week 4 (Day 22-28): 부가 기능

### Day 22-23: 피드백 게시판

#### Backend
- [ ] Feedback 모델 (`models/feedback.py`)
- [ ] Feedback 스키마 (`schemas/feedback.py`)
- [ ] Feedback 라우터 (`routers/feedback.py`)
  - [ ] GET `/api/feedback`
  - [ ] POST `/api/feedback`
  - [ ] POST `/api/feedback/{id}/reply`
  - [ ] DELETE `/api/feedback/{id}`

#### Frontend
- [ ] Feedback Store (`stores/feedbackStore.ts`)
- [ ] FeedbackList 컴포넌트
- [ ] FeedbackItem 컴포넌트
- [ ] FeedbackForm 컴포넌트
- [ ] 익명 작성 옵션
- [ ] Passage 연결 옵션
- [ ] 답변 스레드 UI
- [ ] RightSidebar에 피드백 섹션 통합

### Day 24-25: 이어보기 & 북마크

#### 이어보기
- [ ] localStorage에 마지막 방문 정보 저장
- [ ] 재방문 시 이어보기 모달

#### 북마크 Backend
- [ ] Bookmark 모델 (`models/bookmark.py`)
- [ ] Bookmark 라우터 (`routers/bookmarks.py`)
  - [ ] GET `/api/bookmarks`
  - [ ] POST `/api/bookmarks/{passage_id}`
  - [ ] DELETE `/api/bookmarks/{passage_id}`

#### 북마크 Frontend
- [ ] Bookmark Store
- [ ] 북마크 추가/삭제 버튼 (Passage 상단)
- [ ] LeftSidebar 상단 북마크 목록

### Day 26-27: 상단 미니맵

#### Frontend
- [ ] Minimap 컴포넌트
- [ ] 현재 Story의 전체 구조 축소 표시
- [ ] 현재 위치 하이라이트
- [ ] 방문한 Passage 표시 (색상 변경)
- [ ] 노드 클릭 시 해당 Passage로 점프
- [ ] 미니맵 토글 기능

### Day 28: 통계 대시보드 (기본)

#### Backend
- [ ] VisitLog 모델 (`models/analytics.py`)
- [ ] 방문 로그 기록 로직 (Passage 조회 시)
- [ ] Analytics 라우터 (`routers/analytics.py`)
  - [ ] GET `/api/admin/stats/overview`
  - [ ] GET `/api/admin/stats/passages`

#### Frontend
- [ ] StatsPage 페이지
- [ ] 일별 방문자 차트 (간단한 바 차트)
- [ ] Passage별 조회수 테이블

**✅ Week 4 마일스톤**: 모든 MVP 기능 구현 완료

---

## 📅 Week 5 (Day 29-30): QA & 배포 준비

### Day 29: 테스트 & 버그 수정

- [ ] 전체 User Flow 테스트
  - [ ] 회원가입 → 로그인 → Story 선택 → Passage 탐색
  - [ ] 분기 조건 동작 확인
  - [ ] 이어보기 동작 확인
- [ ] 관리자 Flow 테스트
  - [ ] Story 생성 → Passage 추가 → Link 연결 → 저장
  - [ ] Passage 콘텐츠 편집
  - [ ] 이미지 업로드
- [ ] 피드백 기능 테스트
- [ ] 북마크 기능 테스트
- [ ] 크로스 브라우저 테스트 (Chrome, Edge)
- [ ] 버그 수정
- [ ] 이해관계자 리뷰

### Day 30: 배포 준비

- [ ] 프로덕션 빌드 테스트
- [ ] 환경 변수 정리 및 문서화
- [ ] 배포 가이드 문서 작성
- [ ] Docker 이미지 빌드 확인
- [ ] 초기 샘플 Story/Passage 데이터 준비
- [ ] README.md 업데이트

---

## 📁 최종 폴더 구조

```
ai-literacy-guide/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Modal.tsx
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── LeftSidebar.tsx
│   │   │   │   ├── RightSidebar.tsx
│   │   │   │   └── NavigationFooter.tsx
│   │   │   ├── passage/
│   │   │   │   ├── PassageContent.tsx
│   │   │   │   ├── LinkButtons.tsx
│   │   │   │   └── TableOfContents.tsx
│   │   │   ├── editor/
│   │   │   │   ├── StoryEditor.tsx
│   │   │   │   ├── PassageEditorModal.tsx
│   │   │   │   ├── LinkConditionModal.tsx
│   │   │   │   └── nodes/
│   │   │   │       ├── StartNode.tsx
│   │   │   │       ├── ContentNode.tsx
│   │   │   │       ├── BranchNode.tsx
│   │   │   │       └── EndNode.tsx
│   │   │   ├── minimap/
│   │   │   │   └── Minimap.tsx
│   │   │   └── feedback/
│   │   │       ├── FeedbackList.tsx
│   │   │       ├── FeedbackItem.tsx
│   │   │       └── FeedbackForm.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── story/
│   │   │   │   ├── StorySelectPage.tsx
│   │   │   │   └── PassagePage.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── StoryListPage.tsx
│   │   │       ├── StoryEditorPage.tsx
│   │   │       ├── UserListPage.tsx
│   │   │       └── StatsPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useStory.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── storyStore.ts
│   │   │   ├── feedbackStore.ts
│   │   │   └── uiStore.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── storyService.ts
│   │   │   └── feedbackService.ts
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── story.ts
│   │   │   └── feedback.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── story.py
│   │   │   ├── passage.py
│   │   │   ├── link.py
│   │   │   ├── bookmark.py
│   │   │   ├── feedback.py
│   │   │   └── analytics.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── story.py
│   │   │   ├── passage.py
│   │   │   ├── link.py
│   │   │   ├── feedback.py
│   │   │   └── analytics.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── stories.py
│   │   │   ├── passages.py
│   │   │   ├── bookmarks.py
│   │   │   ├── feedback.py
│   │   │   └── admin.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── story_engine.py
│   │   │   ├── story_service.py
│   │   │   └── analytics_service.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── data/
│   │   └── app.db
│   ├── uploads/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   └── test_story_engine.py
│   ├── requirements.txt
│   ├── alembic.ini
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── TASKS.md
```

---

## ✅ 완료 체크리스트

### MVP 필수 기능
- [ ] 사용자 Story/Passage 탐색
- [ ] 좌측 목차 사이드바
- [ ] 우측 피드백 게시판
- [ ] 관리자 Story 에디터 (Twine 스타일)
- [ ] 관리자 Passage 콘텐츠 편집기
- [ ] 로그인/회원가입

### MVP 높은 우선순위
- [ ] 이어보기
- [ ] 상단 미니맵

### MVP 중간 우선순위
- [ ] 북마크
- [ ] 관리자 통계 대시보드

---

## 🚧 리스크 & 대응

| 리스크 | 확률 | 대응 |
|--------|------|------|
| React Flow 복잡도 | 중 | 기본 기능만 사용, 고급 기능 후순위 |
| TipTap 에디터 커스터마이징 | 중 | 기본 확장만 사용 |
| SQLite 동시성 제약 | 저 | MVP 규모에서는 문제없음 |
| 콘텐츠 준비 부족 | 중 | 샘플 데이터로 MVP, 실 콘텐츠 병행 |
```