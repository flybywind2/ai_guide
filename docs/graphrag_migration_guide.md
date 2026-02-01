# GraphRAG 챗봇 기능 마이그레이션 가이드

> **중요**: 이 가이드는 회사 환경의 데이터를 안전하게 보호하면서 GraphRAG 기반 AI 챗봇 기능을 추가하는 방법을 설명합니다.

## 목차
1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [Step 1: 백업 (필수)](#step-1-백업-필수)
4. [Step 2: DB 스키마 마이그레이션](#step-2-db-스키마-마이그레이션)
5. [Step 3: 임베딩 생성](#step-3-임베딩-생성)
6. [Step 4: 챗봇 API 구현](#step-4-챗봇-api-구현)
7. [Step 5: 프론트엔드 통합](#step-5-프론트엔드-통합)
8. [문제 발생 시 복구](#문제-발생-시-복구)
9. [FAQ](#faq)

---

## 개요

### 추가되는 기능
- 🤖 GraphRAG 기반 AI 챗봇으로 가이드 내용 질문/답변
- 🔍 벡터 검색 + 그래프 탐색으로 정확한 답변 제공
- 📚 출처(Source) 표시로 신뢰도 향상
- 💡 컨텍스트 기반 관련 Passage 추천

### 변경 사항
- **기존 테이블 변경**: `passages` 테이블에 2개 컬럼 추가 (nullable)
- **새 테이블 추가**: `passage_similarities`, `chat_sessions`, `chat_messages`
- **선택적 테이블**: `entities`, `passage_entities` (고급 기능용)
- **기존 데이터**: **절대 변경 안 함** (새 컬럼은 NULL 허용)

### 안전성 보장
- ✅ 기존 passages 데이터 읽기만
- ✅ 새 컬럼은 nullable (기존 레코드 영향 없음)
- ✅ 롤백 가능
- ✅ 단계적 적용 (스키마 → 임베딩 → API 순서)

### 비용 고려사항
- OpenAI Embeddings API 사용 시 비용 발생
- 예상 비용: 1000개 Passage 기준 약 $0.50 ~ $1.00 (일회성)
- 대안: 오픈소스 모델 사용 (무료, 정확도 낮음)

---

## 사전 준비

### 필요한 도구
- [ ] 백업 저장용 USB 또는 외장 하드
- [ ] 개인 PC (로컬 테스트용)
- [ ] OpenAI API Key (또는 대체 임베딩 서비스)
- [ ] 최소 10GB 여유 공간

### 예상 소요 시간
- 백업: 5분
- 스키마 마이그레이션: 10분
- 임베딩 생성: 30분 ~ 2시간 (Passage 수에 따라)
- API 구현: 1시간
- 프론트엔드 통합: 30분
- **총 소요 시간: 약 2.5 ~ 4시간**

### 기술 스택
- **임베딩**: OpenAI `text-embedding-3-small` (또는 `all-MiniLM-L6-v2`)
- **벡터 검색**: SQLite + numpy (간단한 구현) 또는 ChromaDB (고급)
- **LLM**: OpenAI GPT-4 또는 GPT-4o-mini
- **백엔드**: FastAPI + LangChain (선택적)

---

## Step 1: 백업 (필수)

### 1.1 회사 컴퓨터에서 DB 백업

```bash
# 백업 스크립트 실행
cd D:\Python\ai_guide\backend
scripts\backup_db.bat

# 또는 수동 백업
$date = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item data\app.db -Destination backups\app_before_graphrag_$date.db
```

### 1.2 백업 검증

```bash
# 백업 파일 확인
dir backups\app_before_graphrag_*.db

# 파일 크기가 원본과 동일한지 확인
dir data\app.db
```

### 1.3 백업 복사 (안전을 위해)

```bash
# USB에 백업
copy backups\app_before_graphrag_*.db E:\backups\

# 로컬 PC로 가져오기 (테스트용)
# USB 또는 네트워크로 복사
```

**✅ 체크포인트 1**: 백업 파일이 2곳 이상에 있는지 확인

---

## Step 2: DB 스키마 마이그레이션

### 2.1 마이그레이션 파일 생성

로컬 PC에서 먼저 테스트합니다.

```bash
cd backend

# 가상환경 활성화
venv\Scripts\activate

# Alembic 마이그레이션 생성
alembic revision -m "Add GraphRAG support"
```

### 2.2 마이그레이션 스크립트 작성

생성된 파일 (예: `alembic/versions/xxxx_add_graphrag_support.py`)을 열고 수정:

```python
"""Add GraphRAG support

Revision ID: xxxx
Revises: yyyy
Create Date: 2026-01-31

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None


def upgrade():
    # 1. passages 테이블에 임베딩 컬럼 추가 (nullable)
    op.add_column('passages',
        sa.Column('embedding', sa.LargeBinary(), nullable=True))
    op.add_column('passages',
        sa.Column('embedding_model', sa.String(50), nullable=True))

    # 2. 벡터 유사도 테이블 생성
    op.create_table('passage_similarities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('passage_a_id', sa.Integer(), sa.ForeignKey('passages.id'), nullable=False),
        sa.Column('passage_b_id', sa.Integer(), sa.ForeignKey('passages.id'), nullable=False),
        sa.Column('similarity_score', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_similarity_score', 'passage_similarities', ['similarity_score'])

    # 3. 챗봇 세션 테이블 생성
    op.create_table('chat_sessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 4. 챗봇 메시지 테이블 생성
    op.create_table('chat_messages',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('chat_sessions.id'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),  # 'user' or 'assistant'
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sources', sa.Text(), nullable=True),  # JSON array of passage IDs
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_session_id', 'chat_messages', ['session_id'])


def downgrade():
    # 역순으로 삭제
    op.drop_index('idx_session_id')
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
    op.drop_index('idx_similarity_score')
    op.drop_table('passage_similarities')

    # passages 테이블 컬럼 삭제
    op.drop_column('passages', 'embedding_model')
    op.drop_column('passages', 'embedding')
```

### 2.3 테스트 DB에 적용

```bash
# 테스트 DB 복사
copy E:\backups\app_before_graphrag_20260131.db data\app_test.db

# 환경 변수 설정 (.env 파일 수정)
# DATABASE_URL=sqlite+aiosqlite:///./data/app_test.db

# 또는 임시로
set DATABASE_URL=sqlite+aiosqlite:///./data/app_test.db

# 마이그레이션 실행
alembic upgrade head

# 예상 출력:
# INFO  [alembic.runtime.migration] Running upgrade yyyy -> xxxx, Add GraphRAG support
```

### 2.4 데이터 무결성 검증

```bash
sqlite3 data/app_test.db

-- 1. Passages 개수 확인 (변경 전과 동일)
SELECT COUNT(*) FROM passages;

-- 2. 새 컬럼 확인 (모두 NULL)
SELECT id, name, embedding, embedding_model FROM passages LIMIT 5;

-- 3. 새 테이블 확인
.schema passage_similarities
.schema chat_sessions
.schema chat_messages

-- 4. 종료
.exit
```

**✅ 체크포인트 2**: 기존 Passage 개수 동일, 새 테이블 생성 확인

---

## Step 3: 임베딩 생성

### 3.1 임베딩 생성 스크립트 작성

`backend/scripts/generate_embeddings.py` 생성:

```python
"""
Passage 임베딩 생성 스크립트
- OpenAI text-embedding-3-small 사용
- 배치 처리로 비용 최적화
- 진행 상황 표시
"""
import asyncio
import os
import pickle
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from openai import AsyncOpenAI

from app.models.story import Passage
from app.core.config import settings

# OpenAI 클라이언트
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# DB 연결
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def generate_embedding(text: str) -> list[float]:
    """텍스트를 임베딩으로 변환"""
    response = await client.embeddings.create(
        input=text,
        model="text-embedding-3-small"  # 저렴하고 빠름
    )
    return response.data[0].embedding


async def process_passage(session: AsyncSession, passage: Passage):
    """개별 Passage 임베딩 생성"""
    # 이미 임베딩이 있으면 스킵
    if passage.embedding is not None:
        return False

    # 텍스트 준비 (제목 + 내용)
    text = f"{passage.name}\n\n{passage.content}"

    # 임베딩 생성
    embedding = await generate_embedding(text)

    # 바이너리로 저장 (pickle)
    passage.embedding = pickle.dumps(embedding)
    passage.embedding_model = "text-embedding-3-small"

    return True


async def main():
    """모든 Passage 임베딩 생성"""
    async with AsyncSessionLocal() as session:
        # 모든 Passage 조회
        result = await session.execute(select(Passage))
        passages = result.scalars().all()

        print(f"총 {len(passages)}개 Passage 발견")

        processed = 0
        for i, passage in enumerate(passages, 1):
            try:
                if await process_passage(session, passage):
                    processed += 1
                    print(f"[{i}/{len(passages)}] {passage.name} - 완료")
                else:
                    print(f"[{i}/{len(passages)}] {passage.name} - 스킵 (이미 존재)")

                # 10개마다 커밋
                if i % 10 == 0:
                    await session.commit()
                    print(f">>> {i}개 처리 완료, DB 저장")

            except Exception as e:
                print(f"[ERROR] {passage.name}: {e}")
                continue

        # 최종 커밋
        await session.commit()
        print(f"\n완료! 총 {processed}개 임베딩 생성")


if __name__ == "__main__":
    asyncio.run(main())
```

### 3.2 임베딩 생성 실행

```bash
# .env 파일에 OpenAI API Key 추가
# OPENAI_API_KEY=sk-...

cd backend

# 스크립트 실행
python scripts/generate_embeddings.py

# 예상 출력:
# 총 150개 Passage 발견
# [1/150] AI란 무엇인가 - 완료
# [2/150] 머신러닝 기초 - 완료
# ...
# >>> 10개 처리 완료, DB 저장
# ...
# 완료! 총 150개 임베딩 생성
```

**⚠️ 주의사항:**
- OpenAI API 비용 발생 (text-embedding-3-small: $0.00002/1K tokens)
- 150개 Passage, 평균 500 단어 → 약 $0.50 ~ $1.00
- 인터넷 연결 필요
- 처리 시간: 30분 ~ 1시간 (API 속도 제한)

### 3.3 임베딩 생성 확인

```bash
sqlite3 data/app_test.db

-- 임베딩이 생성된 Passage 개수
SELECT COUNT(*) FROM passages WHERE embedding IS NOT NULL;

-- 샘플 확인
SELECT id, name, embedding_model, LENGTH(embedding) as embedding_size
FROM passages
WHERE embedding IS NOT NULL
LIMIT 5;

.exit
```

**✅ 체크포인트 3**: 모든 Passage에 임베딩 생성 완료

---

## Step 4: 챗봇 API 구현

### 4.1 벡터 검색 유틸리티 작성

`backend/app/services/vector_search.py` 생성:

```python
"""
벡터 검색 서비스
- 코사인 유사도 기반 검색
- SQLite + numpy로 간단하게 구현
"""
import pickle
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.story import Passage


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """코사인 유사도 계산"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


async def search_similar_passages(
    session: AsyncSession,
    query_embedding: list[float],
    top_k: int = 5,
    story_id: int | None = None
) -> list[tuple[Passage, float]]:
    """
    쿼리 임베딩과 유사한 Passage 검색

    Args:
        session: DB 세션
        query_embedding: 쿼리 임베딩 벡터
        top_k: 반환할 최대 개수
        story_id: 특정 Story로 필터링 (선택)

    Returns:
        [(Passage, 유사도 점수), ...] 리스트
    """
    # 임베딩이 있는 Passage만 조회
    stmt = select(Passage).where(Passage.embedding.isnot(None))
    if story_id:
        stmt = stmt.where(Passage.story_id == story_id)

    result = await session.execute(stmt)
    passages = result.scalars().all()

    # 유사도 계산
    query_vec = np.array(query_embedding)
    similarities = []

    for passage in passages:
        passage_vec = np.array(pickle.loads(passage.embedding))
        score = cosine_similarity(query_vec, passage_vec)
        similarities.append((passage, score))

    # 유사도 높은 순으로 정렬
    similarities.sort(key=lambda x: x[1], reverse=True)

    return similarities[:top_k]
```

### 4.2 GraphRAG 검색 서비스 작성

`backend/app/services/graphrag_search.py` 생성:

```python
"""
GraphRAG 기반 검색
- 벡터 검색 + 그래프 탐색
- Link 관계 따라가며 컨텍스트 확장
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.story import Passage, Link
from app.services.vector_search import search_similar_passages


async def graphrag_search(
    session: AsyncSession,
    query_embedding: list[float],
    top_k: int = 3,
    expand_links: bool = True,
    story_id: int | None = None
) -> list[Passage]:
    """
    GraphRAG 검색: 벡터 검색 + 그래프 확장

    Args:
        session: DB 세션
        query_embedding: 쿼리 임베딩
        top_k: 초기 검색 결과 수
        expand_links: Link 따라가며 확장할지 여부
        story_id: 특정 Story로 필터링

    Returns:
        관련 Passage 리스트 (중복 제거됨)
    """
    # 1. 벡터 검색으로 초기 후보 찾기
    initial_results = await search_similar_passages(
        session, query_embedding, top_k, story_id
    )

    passages_set = {passage.id: passage for passage, _ in initial_results}

    if not expand_links:
        return list(passages_set.values())

    # 2. 그래프 확장: Link 따라가기
    for passage, score in initial_results:
        # 현재 Passage에서 나가는 Link들
        stmt = select(Link).where(Link.source_passage_id == passage.id)
        result = await session.execute(stmt)
        links = result.scalars().all()

        for link in links:
            # 연결된 Passage 추가
            target_stmt = select(Passage).where(Passage.id == link.target_passage_id)
            target_result = await session.execute(target_stmt)
            target_passage = target_result.scalar_one_or_none()

            if target_passage and target_passage.id not in passages_set:
                passages_set[target_passage.id] = target_passage

    return list(passages_set.values())
```

### 4.3 챗봇 라우터 작성

`backend/app/routers/chatbot.py` 생성:

```python
"""
GraphRAG 챗봇 API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from openai import AsyncOpenAI
import os

from app.core.dependencies import get_db, get_current_user_optional
from app.models.user import User
from app.models.story import ChatSession, ChatMessage
from app.services.graphrag_search import graphrag_search

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

# OpenAI 클라이언트
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatRequest(BaseModel):
    message: str
    story_id: int | None = None
    session_id: int | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]  # [{"id": 1, "name": "...", "url": "..."}]
    session_id: int


@router.post("/", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional)
):
    """
    GraphRAG 기반 챗봇 질문/답변
    """
    # 1. 쿼리 임베딩 생성
    query_embedding_response = await client.embeddings.create(
        input=req.message,
        model="text-embedding-3-small"
    )
    query_embedding = query_embedding_response.data[0].embedding

    # 2. GraphRAG 검색
    relevant_passages = await graphrag_search(
        db,
        query_embedding,
        top_k=3,
        expand_links=True,
        story_id=req.story_id
    )

    if not relevant_passages:
        raise HTTPException(
            status_code=404,
            detail="관련된 가이드 내용을 찾을 수 없습니다."
        )

    # 3. 컨텍스트 구성
    context_parts = []
    for passage in relevant_passages:
        context_parts.append(f"## {passage.name}\n\n{passage.content}")

    context = "\n\n---\n\n".join(context_parts)

    # 4. LLM 답변 생성
    response = await client.chat.completions.create(
        model="gpt-4o-mini",  # 또는 gpt-4
        messages=[
            {
                "role": "system",
                "content": "당신은 삼성DS AI 활용 가이드 전문가입니다. 제공된 컨텍스트를 기반으로 정확하고 친절하게 답변하세요."
            },
            {
                "role": "user",
                "content": f"컨텍스트:\n\n{context}\n\n질문: {req.message}"
            }
        ],
        temperature=0.7,
        max_tokens=1000
    )

    answer = response.choices[0].message.content

    # 5. 출처 정보
    sources = [
        {
            "id": p.id,
            "name": p.name,
            "url": f"/story/{p.story_id}/passage/{p.passage_number}"
        }
        for p in relevant_passages
    ]

    # 6. 세션 저장 (선택적)
    # TODO: ChatSession, ChatMessage 모델 생성 및 저장

    return ChatResponse(
        answer=answer,
        sources=sources,
        session_id=req.session_id or 0
    )
```

### 4.4 main.py에 라우터 등록

`backend/app/main.py` 또는 `main2.py` 수정:

```python
# 기존 import들...
from app.routers import chatbot

# 라우터 등록
app.include_router(chatbot.router)
```

### 4.5 서버 재시작 및 테스트

```bash
# 서버 재시작
uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload

# API 문서 확인
# http://localhost:8080/docs
# /api/chat 엔드포인트 확인

# 테스트 요청 (PowerShell)
$body = @{
    message = "AI 개발을 위해 Python을 배워야 하는 이유는?"
    story_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/chat" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**✅ 체크포인트 4**: 챗봇 API 정상 작동, 답변 및 출처 반환

---

## Step 5: 프론트엔드 통합

### 5.1 챗봇 UI 컴포넌트 작성

`frontend/src/components/chatbot/ChatbotWidget.tsx` 생성:

```typescript
import React, { useState } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: number; name: string; url: string }[];
}

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat', { message: input });
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* 챗봇 창 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50">
          {/* 헤더 */}
          <div className="bg-purple-600 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold">AI 가이드 챗봇</h3>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? 'text-right' : ''}>
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300 text-sm">
                      <p className="font-semibold mb-1">출처:</p>
                      {msg.sources.map((source) => (
                        <a
                          key={source.id}
                          href={source.url}
                          className="block text-purple-600 hover:underline"
                        >
                          {source.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-gray-500 italic">답변 생성 중...</div>
            )}
          </div>

          {/* 입력창 */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="궁금한 내용을 질문하세요..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

### 5.2 App.tsx에 챗봇 추가

```typescript
// frontend/src/App.tsx
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';

function App() {
  return (
    <>
      {/* 기존 라우터 등... */}
      <ChatbotWidget />
    </>
  );
}
```

### 5.3 프론트엔드 빌드 및 배포

```bash
cd frontend

# 빌드
npm run build

# main2.py로 서빙되므로 자동 반영됨
```

**✅ 체크포인트 5**: 프론트엔드에서 챗봇 위젯 표시, 질문/답변 작동

---

## 문제 발생 시 복구

### 시나리오 1: 마이그레이션 실패

```bash
# 1. 서버 중지
# Ctrl+C

# 2. DB 복구
cd backend
copy backups\app_before_graphrag_*.db data\app.db

# 3. 마이그레이션 롤백
alembic downgrade -1

# 4. 서버 재시작
uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload
```

### 시나리오 2: 임베딩 생성 실패

```bash
# 임베딩 생성 스크립트는 재실행 가능 (이미 생성된 것은 스킵)
python scripts/generate_embeddings.py

# 또는 특정 Passage만 재생성
# 스크립트 수정 필요
```

### 시나리오 3: API 비용 과다

OpenAI 대신 무료 모델 사용:

```python
# sentence-transformers 설치
pip install sentence-transformers

# generate_embeddings.py 수정
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(text: str) -> list[float]:
    return model.encode(text).tolist()
```

---

## FAQ

### Q1. GraphRAG가 일반 RAG보다 좋은 이유는?
**A**: GraphRAG는 벡터 검색 + 그래프 탐색을 결합합니다. Passage 간 Link 관계를 활용하여 더 풍부한 컨텍스트를 제공하고, 다단계 추론이 가능합니다.

### Q2. 기존 데이터가 손실될 수 있나요?
**A**: 아니요. 새 컬럼은 nullable로 추가되며, 기존 데이터는 절대 변경하지 않습니다.

### Q3. OpenAI 없이 구현 가능한가요?
**A**: 네. 오픈소스 모델(sentence-transformers, Ollama)로 무료 구현 가능합니다. 다만 정확도는 낮을 수 있습니다.

### Q4. 임베딩 생성은 얼마나 걸리나요?
**A**: OpenAI API 기준 100개 Passage당 약 5~10분. 1000개면 1~2시간 정도 소요됩니다.

### Q5. 챗봇이 잘못된 답변을 할 수 있나요?
**A**: 네. LLM 특성상 "환각(hallucination)" 가능성이 있습니다. 출처(Source)를 표시하여 신뢰도를 높입니다.

### Q6. 성능에 영향이 있나요?
**A**: 벡터 검색은 Passage 수가 많을수록 느려집니다. 1000개 이하는 문제없지만, 그 이상이면 ChromaDB 등 전문 벡터 DB 권장합니다.

### Q7. 롤백이 가능한가요?
**A**: 네. `alembic downgrade -1` 명령으로 언제든 되돌릴 수 있습니다.

### Q8. Passage가 업데이트되면 임베딩도 다시 생성해야 하나요?
**A**: 네. Passage 내용이 변경되면 임베딩도 재생성해야 합니다. 자동화 로직을 추가할 수 있습니다.

---

## 체크리스트

### 사전 준비
- [ ] 백업 디렉토리 생성
- [ ] OpenAI API Key 발급
- [ ] 개인 PC 환경 구성
- [ ] USB/외장하드 준비

### 백업
- [ ] 회사 DB 백업 완료
- [ ] USB에 백업 복사
- [ ] 백업 파일 크기 확인
- [ ] 로컬 PC로 복사

### 스키마 마이그레이션
- [ ] 마이그레이션 파일 생성
- [ ] 마이그레이션 내용 검토
- [ ] 테스트 DB에 적용
- [ ] 데이터 무결성 검증

### 임베딩 생성
- [ ] 임베딩 생성 스크립트 작성
- [ ] .env에 API Key 설정
- [ ] 임베딩 생성 실행
- [ ] 임베딩 생성 확인

### API 구현
- [ ] 벡터 검색 유틸리티 작성
- [ ] GraphRAG 검색 서비스 작성
- [ ] 챗봇 라우터 작성
- [ ] main.py에 라우터 등록
- [ ] API 테스트

### 프론트엔드
- [ ] 챗봇 위젯 컴포넌트 작성
- [ ] App.tsx에 위젯 추가
- [ ] 프론트엔드 빌드
- [ ] 챗봇 UI 테스트

### 회사 적용
- [ ] 최종 백업 생성
- [ ] 서버 중지
- [ ] 코드 업데이트
- [ ] 마이그레이션 적용
- [ ] 임베딩 생성
- [ ] 서버 재시작
- [ ] 실제 환경 테스트

### 완료
- [ ] 모든 기능 정상 작동
- [ ] 백업 파일 보관 확인
- [ ] 팀원들에게 공지

---

## 다음 단계

GraphRAG 챗봇 완료 후:

1. **고급 기능 추가**
   - 엔티티 추출 (entities 테이블)
   - 커뮤니티 탐지 (MS GraphRAG)
   - 다국어 지원 (multilingual embeddings)

2. **성능 최적화**
   - ChromaDB/Pinecone 도입
   - 캐싱 레이어 추가
   - 배치 검색 최적화

3. **사용자 경험 개선**
   - 대화 히스토리 저장
   - 피드백 수집 (좋아요/싫어요)
   - 추천 질문 표시

4. **모니터링**
   - 질문/답변 로그
   - 성공률 추적
   - 비용 모니터링

---

**마지막 확인**: 문제가 생기면 언제든 백업으로 복구할 수 있습니다. 단계별로 천천히 진행하세요!
