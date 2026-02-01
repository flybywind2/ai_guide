# AI 활용 가이드 - 구현 작업 목록

> 작성일: 2026-01-31
> 우선순위: 1번(Edit History) → 3번(User Stories) → 2번(GraphRAG)

---

## 📌 Feature 1: Passage Edit History (위키 스타일)

**목표**: Passage 편집 이력 자동 저장 및 버전 되돌리기 기능
**복잡도**: ⭐⭐ (중간)
**예상 소요 시간**: 45분
**참고 문서**: `docs/migration_guide.md`

### Phase 1: 백업 및 준비 (5분)

- [ ] **백업 스크립트 실행**
  ```bash
  cd D:\Python\ai_guide\backend
  scripts\backup_db.bat
  ```
  - 파일: `backups/app_before_edit_history_{timestamp}.db`
  - USB에 추가 백업 복사

- [ ] **테스트 환경 준비**
  - 백업 DB를 `data/app_test.db`로 복사
  - `.env` 파일에 테스트 DB URL 설정 (선택)

### Phase 2: 데이터베이스 스키마 (10분)

- [ ] **PassageRevision 모델 생성**
  - 파일: `backend/app/models/story.py`
  - 추가 내용:
    ```python
    class PassageRevision(Base):
        __tablename__ = "passage_revisions"

        id = Column(Integer, primary_key=True)
        passage_id = Column(Integer, ForeignKey("passages.id"), nullable=False)
        revision_number = Column(Integer, nullable=False)  # 1, 2, 3, ...
        content = Column(Text, nullable=False)  # 이전 버전 콘텐츠
        edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
        edited_at = Column(DateTime, default=datetime.utcnow)
        change_summary = Column(String(200), nullable=True)  # "오타 수정", "내용 추가"

        # Relationships
        passage = relationship("Passage", back_populates="revisions")
        editor = relationship("User")
    ```
  - Passage 모델에 추가:
    ```python
    revisions = relationship("PassageRevision", back_populates="passage", order_by="PassageRevision.revision_number.desc()")
    ```

- [ ] **Alembic 마이그레이션 생성**
  ```bash
  cd backend
  alembic revision --autogenerate -m "Add passage revision history"
  ```
  - 생성된 파일 검토: `alembic/versions/xxxx_add_passage_revision_history.py`
  - **확인 사항**: `passages` 테이블 변경 없어야 함!

- [ ] **테스트 DB에 마이그레이션 적용**
  ```bash
  set DATABASE_URL=sqlite+aiosqlite:///./data/app_test.db
  alembic upgrade head
  ```

- [ ] **데이터 무결성 검증**
  ```bash
  sqlite3 data/app_test.db
  SELECT COUNT(*) FROM passages;  # 변경 전과 동일
  SELECT COUNT(*) FROM passage_revisions;  # 0
  .exit
  ```

### Phase 3: 백엔드 로직 구현 (15분)

- [ ] **Pydantic 스키마 추가**
  - 파일: `backend/app/schemas/story.py`
  ```python
  class PassageRevisionBase(BaseModel):
      revision_number: int
      content: str
      edited_by: int | None
      edited_at: datetime
      change_summary: str | None

  class PassageRevisionResponse(PassageRevisionBase):
      id: int
      passage_id: int

      class Config:
          from_attributes = True

  class PassageWithHistory(PassageResponse):
      revisions: list[PassageRevisionResponse] = []
  ```

- [ ] **Passage 업데이트 로직 수정**
  - 파일: `backend/app/routers/admin.py`
  - 엔드포인트: `PUT /api/admin/passages/{passage_id}`
  - 수정 내용:
    ```python
    from app.models.story import PassageRevision

    @router.put("/passages/{passage_id}")
    async def update_passage(
        passage_id: int,
        passage_update: PassageUpdate,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_content_editor)  # viewer도 가능
    ):
        # 1. 기존 Passage 조회
        result = await db.execute(
            select(Passage).where(Passage.id == passage_id)
        )
        passage = result.scalar_one_or_none()
        if not passage:
            raise HTTPException(404, "Passage not found")

        # 2. 현재 버전을 히스토리에 저장
        latest_revision = await db.execute(
            select(PassageRevision)
            .where(PassageRevision.passage_id == passage_id)
            .order_by(PassageRevision.revision_number.desc())
            .limit(1)
        )
        latest = latest_revision.scalar_one_or_none()
        next_revision_number = (latest.revision_number + 1) if latest else 1

        revision = PassageRevision(
            passage_id=passage_id,
            revision_number=next_revision_number,
            content=passage.content,  # 현재 내용 저장
            edited_by=user.id,
            edited_at=datetime.utcnow(),
            change_summary=passage_update.change_summary  # 선택적
        )
        db.add(revision)

        # 3. Passage 업데이트
        for key, value in passage_update.model_dump(exclude_unset=True).items():
            setattr(passage, key, value)

        await db.commit()
        await db.refresh(passage)

        return passage
    ```

- [ ] **히스토리 조회 API 추가**
  - 파일: `backend/app/routers/passages.py` 또는 `admin.py`
  ```python
  @router.get("/passages/{passage_id}/history", response_model=list[PassageRevisionResponse])
  async def get_passage_history(
      passage_id: int,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      """Passage 편집 히스토리 조회"""
      result = await db.execute(
          select(PassageRevision)
          .where(PassageRevision.passage_id == passage_id)
          .order_by(PassageRevision.revision_number.desc())
      )
      revisions = result.scalars().all()
      return revisions
  ```

- [ ] **버전 되돌리기 API 추가**
  ```python
  @router.post("/passages/{passage_id}/revert/{revision_number}")
  async def revert_passage(
      passage_id: int,
      revision_number: int,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_admin_user)  # admin/editor만
  ):
      """특정 버전으로 되돌리기"""
      # 1. 해당 revision 조회
      result = await db.execute(
          select(PassageRevision)
          .where(
              PassageRevision.passage_id == passage_id,
              PassageRevision.revision_number == revision_number
          )
      )
      revision = result.scalar_one_or_none()
      if not revision:
          raise HTTPException(404, "Revision not found")

      # 2. 현재 passage 조회
      passage_result = await db.execute(
          select(Passage).where(Passage.id == passage_id)
      )
      passage = passage_result.scalar_one_or_none()

      # 3. 현재 내용을 새 revision으로 저장 (되돌리기 전 백업)
      latest = await db.execute(
          select(PassageRevision)
          .where(PassageRevision.passage_id == passage_id)
          .order_by(PassageRevision.revision_number.desc())
          .limit(1)
      )
      latest_rev = latest.scalar_one_or_none()
      next_num = (latest_rev.revision_number + 1) if latest_rev else 1

      new_revision = PassageRevision(
          passage_id=passage_id,
          revision_number=next_num,
          content=passage.content,
          edited_by=user.id,
          edited_at=datetime.utcnow(),
          change_summary=f"Revert to revision #{revision_number}"
      )
      db.add(new_revision)

      # 4. Passage를 선택한 revision 내용으로 업데이트
      passage.content = revision.content

      await db.commit()
      await db.refresh(passage)

      return passage
  ```

### Phase 4: 프론트엔드 UI 구현 (10분)

- [ ] **히스토리 버튼 추가**
  - 파일: `frontend/src/components/passage/PassageView.tsx`
  - 위치: Edit 버튼 옆
  ```tsx
  import { History } from 'lucide-react';

  const [showHistory, setShowHistory] = useState(false);

  {canEdit && (
    <>
      <button onClick={() => setShowHistory(true)}>
        <History className="w-5 h-5" />
        History
      </button>
    </>
  )}
  ```

- [ ] **히스토리 모달 컴포넌트 생성**
  - 파일: `frontend/src/components/passage/PassageHistoryModal.tsx` (신규)
  ```tsx
  interface PassageHistoryModalProps {
    passageId: number;
    isOpen: boolean;
    onClose: () => void;
    onRevert: (revisionNumber: number) => void;
  }

  export const PassageHistoryModal: React.FC<PassageHistoryModalProps> = ({
    passageId, isOpen, onClose, onRevert
  }) => {
    const [revisions, setRevisions] = useState([]);

    useEffect(() => {
      if (isOpen) {
        api.get(`/passages/${passageId}/history`).then(res => {
          setRevisions(res.data);
        });
      }
    }, [isOpen, passageId]);

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <h2>Edit History</h2>
        <div className="space-y-4">
          {revisions.map(rev => (
            <div key={rev.id} className="border p-4">
              <div className="flex justify-between">
                <div>
                  <span className="font-bold">Revision #{rev.revision_number}</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(rev.edited_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => onRevert(rev.revision_number)}
                  className="text-purple-600 hover:underline"
                >
                  Revert to this
                </button>
              </div>
              {rev.change_summary && (
                <p className="text-sm text-gray-600 mt-1">{rev.change_summary}</p>
              )}
              <pre className="mt-2 bg-gray-100 p-2 text-xs overflow-x-auto">
                {rev.content.substring(0, 200)}...
              </pre>
            </div>
          ))}
        </div>
      </Modal>
    );
  };
  ```

- [ ] **Diff 뷰어 추가 (선택적)**
  - 라이브러리: `react-diff-viewer` 또는 `diff-match-patch`
  - 두 버전 비교 UI

### Phase 5: 테스트 (5분)

- [ ] **기능 테스트**
  ```bash
  # 서버 재시작
  uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload
  ```
  - [ ] Passage 편집 → 저장
  - [ ] 히스토리 버튼 클릭 → 이력 표시
  - [ ] 이전 버전 클릭 → 내용 미리보기
  - [ ] "Revert to this" 클릭 → 되돌리기 성공
  - [ ] DB 확인: `passage_revisions` 테이블에 레코드 생성

- [ ] **DB 확인**
  ```sql
  SELECT COUNT(*) FROM passage_revisions;  -- 편집 횟수만큼
  SELECT * FROM passage_revisions ORDER BY edited_at DESC LIMIT 5;
  ```

### Phase 6: 회사 환경 적용 (10분)

- [ ] **최종 백업**
  ```bash
  scripts\backup_db.bat
  copy backups\app_FINAL_*.db E:\
  ```

- [ ] **서버 중지**
- [ ] **코드 배포** (git pull 또는 수동 복사)
- [ ] **마이그레이션 적용**
  ```bash
  alembic upgrade head
  ```
- [ ] **데이터 검증**
  ```sql
  SELECT COUNT(*) FROM passages;  -- 변경 전과 동일
  .schema passage_revisions
  ```
- [ ] **서버 재시작**
- [ ] **실제 환경 테스트**

---

## 📌 Feature 3: User-Generated Stories (사용자 Story 생성 및 공유)

**목표**: Viewer가 자신의 Story를 생성/편집하고 다른 사용자와 공유할 수 있는 기능
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 1.5~2시간
**핵심 가치**: 공식 가이드 외에 사용자 간 지식 공유 활성화

### 개념 설계

**Story 타입 분류:**
- **Official Stories**: Admin/Editor가 관리하는 공식 가이드
- **User Stories**: Viewer 이상 사용자가 만든 개인/공유 Story

**권한 구조:**
| 역할 | Official Story | User Story (본인) | User Story (공유받음) |
|------|---------------|------------------|---------------------|
| Super Admin | 편집/삭제 | 편집/삭제 | 읽기/편집* |
| Editor | 편집 | 편집/삭제 | 읽기/편집* |
| Viewer | 읽기 | 편집/삭제 | 읽기/편집* |
| User | 읽기 | - | 읽기 |

*편집 권한이 부여된 경우만

**공유 옵션:**
- `private`: 본인만 볼 수 있음
- `shared`: 특정 사용자에게만 공유
- `public`: 모든 사용자가 볼 수 있음 (Community Stories)

### Phase 1: 백업 및 준비 (5분)

- [ ] **백업**
  ```bash
  cd D:\Python\ai_guide\backend
  scripts\backup_db.bat
  # 파일: backups/app_before_user_stories_{timestamp}.db
  ```

- [ ] **테스트 환경 준비**
  - 백업 DB를 `data/app_test.db`로 복사

### Phase 2: 데이터베이스 스키마 (15분)

- [ ] **Story 모델 확장**
  - 파일: `backend/app/models/story.py`
  ```python
  # Story 클래스에 추가
  owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = official
  is_official = Column(Boolean, default=False, nullable=False)
  visibility = Column(String(20), default="private", nullable=False)  # private, shared, public

  # Relationships
  owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_stories")
  shared_with = relationship("StoryShare", back_populates="story", cascade="all, delete-orphan")
  ```

- [ ] **User 모델 확장**
  ```python
  # User 클래스에 추가
  owned_stories = relationship("Story", foreign_keys="Story.owner_id", back_populates="owner")
  shared_stories = relationship("StoryShare", back_populates="user")
  ```

- [ ] **StoryShare 모델 생성** (신규)
  ```python
  class StoryShare(Base):
      __tablename__ = "story_shares"

      id = Column(Integer, primary_key=True)
      story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
      shared_with_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      permission = Column(String(20), default="read", nullable=False)  # read, write
      shared_by = Column(Integer, ForeignKey("users.id"), nullable=True)
      shared_at = Column(DateTime, default=datetime.utcnow)

      # Relationships
      story = relationship("Story", back_populates="shared_with")
      user = relationship("User", foreign_keys=[shared_with_user_id], back_populates="shared_stories")
      sharer = relationship("User", foreign_keys=[shared_by])
  ```

- [ ] **Alembic 마이그레이션 생성**
  ```bash
  cd backend
  alembic revision --autogenerate -m "Add user stories and sharing"
  ```
  - 생성된 파일 검토
  - 주의: 기존 Story 레코드의 `owner_id`는 NULL, `is_official`은 TRUE로 설정

- [ ] **데이터 마이그레이션 스크립트**
  - 마이그레이션 파일의 `upgrade()` 함수에 추가:
  ```python
  def upgrade():
      # 1. 새 컬럼 추가
      op.add_column('stories', sa.Column('owner_id', sa.Integer(), nullable=True))
      op.add_column('stories', sa.Column('is_official', sa.Boolean(), nullable=False, server_default='1'))
      op.add_column('stories', sa.Column('visibility', sa.String(20), nullable=False, server_default='private'))

      op.create_foreign_key('fk_story_owner', 'stories', 'users', ['owner_id'], ['id'])

      # 2. StoryShare 테이블 생성
      op.create_table('story_shares',
          sa.Column('id', sa.Integer(), primary_key=True),
          sa.Column('story_id', sa.Integer(), sa.ForeignKey('stories.id', ondelete='CASCADE'), nullable=False),
          sa.Column('shared_with_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
          sa.Column('permission', sa.String(20), nullable=False, server_default='read'),
          sa.Column('shared_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
          sa.Column('shared_at', sa.DateTime(), server_default=sa.func.now()),
      )
      op.create_index('idx_story_shares_user', 'story_shares', ['shared_with_user_id'])
      op.create_index('idx_story_shares_story', 'story_shares', ['story_id'])
  ```

- [ ] **테스트 DB에 적용**
  ```bash
  set DATABASE_URL=sqlite+aiosqlite:///./data/app_test.db
  alembic upgrade head
  ```

- [ ] **데이터 무결성 검증**
  ```sql
  sqlite3 data/app_test.db

  -- 기존 Story가 모두 official인지 확인
  SELECT id, name, is_official, owner_id FROM stories;
  -- is_official=1, owner_id=NULL이어야 함

  -- 새 테이블 확인
  .schema story_shares

  .exit
  ```

### Phase 3: 백엔드 로직 구현 (30분)

- [ ] **Pydantic 스키마 추가**
  - 파일: `backend/app/schemas/story.py`
  ```python
  class StoryShareBase(BaseModel):
      shared_with_user_id: int
      permission: str = "read"  # read or write

  class StoryShareCreate(StoryShareBase):
      pass

  class StoryShareResponse(StoryShareBase):
      id: int
      story_id: int
      shared_by: int | None
      shared_at: datetime

      class Config:
          from_attributes = True

  class StoryCreate(BaseModel):
      name: str
      description: str | None = None
      visibility: str = "private"  # private, shared, public
      # is_official은 서버에서 자동 설정 (False)

  class StoryResponse(BaseModel):
      id: int
      name: str
      description: str | None
      is_active: bool
      is_official: bool
      owner_id: int | None
      visibility: str
      created_at: datetime

      # 선택적 필드
      owner_name: str | None = None  # JOIN으로 가져옴
      is_shared_with_me: bool = False  # 현재 사용자와 공유됨 여부
      my_permission: str | None = None  # 내 권한 (read/write)

      class Config:
          from_attributes = True
  ```

- [ ] **Story 조회 로직 수정**
  - 파일: `backend/app/routers/stories.py`
  - 엔드포인트: `GET /api/stories`
  - 수정 내용:
  ```python
  from sqlalchemy.orm import joinedload

  @router.get("/", response_model=list[StoryResponse])
  async def get_stories(
      filter: str = "all",  # all, official, my, shared, public
      db: AsyncSession = Depends(get_db),
      user: User | None = Depends(get_current_user_optional)
  ):
      """
      Story 목록 조회
      - all: 모든 접근 가능한 Story
      - official: 공식 Story만
      - my: 내가 만든 Story (로그인 필요)
      - shared: 나와 공유된 Story (로그인 필요)
      - public: 공개된 사용자 Story
      """

      # 기본 쿼리: active한 Story만
      stmt = select(Story).where(Story.is_active == True)

      if filter == "official":
          stmt = stmt.where(Story.is_official == True)

      elif filter == "my":
          if not user:
              raise HTTPException(401, "Login required")
          stmt = stmt.where(Story.owner_id == user.id)

      elif filter == "shared":
          if not user:
              raise HTTPException(401, "Login required")
          # 나와 공유된 Story
          stmt = stmt.join(StoryShare).where(
              StoryShare.shared_with_user_id == user.id
          )

      elif filter == "public":
          stmt = stmt.where(
              Story.visibility == "public",
              Story.is_official == False
          )

      else:  # all
          # Official + 내 Story + 공유받은 Story + Public
          conditions = [Story.is_official == True]

          if user:
              conditions.append(Story.owner_id == user.id)
              conditions.append(
                  Story.id.in_(
                      select(StoryShare.story_id).where(
                          StoryShare.shared_with_user_id == user.id
                      )
                  )
              )

          conditions.append(Story.visibility == "public")
          stmt = stmt.where(or_(*conditions))

      # Owner 정보 JOIN
      stmt = stmt.options(joinedload(Story.owner))

      result = await db.execute(stmt)
      stories = result.unique().scalars().all()

      # Response 변환 (owner_name 추가)
      response = []
      for story in stories:
          story_dict = StoryResponse.model_validate(story).model_dump()
          story_dict["owner_name"] = story.owner.name if story.owner else "Official"

          # 공유 권한 확인
          if user and not story.is_official and story.owner_id != user.id:
              share = await db.execute(
                  select(StoryShare).where(
                      StoryShare.story_id == story.id,
                      StoryShare.shared_with_user_id == user.id
                  )
              )
              share_obj = share.scalar_one_or_none()
              if share_obj:
                  story_dict["is_shared_with_me"] = True
                  story_dict["my_permission"] = share_obj.permission

          response.append(story_dict)

      return response
  ```

- [ ] **User Story 생성 API**
  - 파일: `backend/app/routers/stories.py` 또는 새 라우터
  ```python
  @router.post("/my-stories", response_model=StoryResponse)
  async def create_my_story(
      story_data: StoryCreate,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      """사용자 Story 생성 (Viewer 이상)"""

      if user.role not in ["super_admin", "editor", "viewer"]:
          raise HTTPException(403, "Viewer role or higher required")

      # User Story 생성
      new_story = Story(
          name=story_data.name,
          description=story_data.description,
          owner_id=user.id,
          is_official=False,
          visibility=story_data.visibility,
          is_active=True
      )

      db.add(new_story)
      await db.commit()
      await db.refresh(new_story)

      return new_story
  ```

- [ ] **Story 편집 권한 체크 함수**
  ```python
  async def check_story_edit_permission(
      story: Story,
      user: User,
      db: AsyncSession
  ) -> bool:
      """Story 편집 권한 확인"""

      # 1. Super admin은 모든 Story 편집 가능
      if user.role == "super_admin":
          return True

      # 2. Official Story: Editor 이상
      if story.is_official:
          return user.role in ["editor", "super_admin"]

      # 3. User Story: Owner
      if story.owner_id == user.id:
          return True

      # 4. User Story: 공유받고 write 권한 있음
      share = await db.execute(
          select(StoryShare).where(
              StoryShare.story_id == story.id,
              StoryShare.shared_with_user_id == user.id,
              StoryShare.permission == "write"
          )
      )
      if share.scalar_one_or_none():
          return True

      return False

  # 기존 update_story, delete_story 등에 권한 체크 추가
  @router.put("/stories/{story_id}")
  async def update_story(
      story_id: int,
      story_update: StoryUpdate,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      story = await get_story_or_404(db, story_id)

      if not await check_story_edit_permission(story, user, db):
          raise HTTPException(403, "No permission to edit this story")

      # 업데이트 로직...
  ```

- [ ] **Story 공유 API**
  ```python
  @router.post("/stories/{story_id}/share", response_model=StoryShareResponse)
  async def share_story(
      story_id: int,
      share_data: StoryShareCreate,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      """Story를 다른 사용자와 공유"""

      # 1. Story 조회
      story = await get_story_or_404(db, story_id)

      # 2. Owner 확인
      if story.owner_id != user.id and user.role != "super_admin":
          raise HTTPException(403, "Only story owner can share")

      # 3. 대상 사용자 존재 확인
      target_user = await db.execute(
          select(User).where(User.id == share_data.shared_with_user_id)
      )
      if not target_user.scalar_one_or_none():
          raise HTTPException(404, "Target user not found")

      # 4. 이미 공유되었는지 확인
      existing = await db.execute(
          select(StoryShare).where(
              StoryShare.story_id == story_id,
              StoryShare.shared_with_user_id == share_data.shared_with_user_id
          )
      )
      if existing.scalar_one_or_none():
          raise HTTPException(400, "Already shared with this user")

      # 5. 공유 생성
      share = StoryShare(
          story_id=story_id,
          shared_with_user_id=share_data.shared_with_user_id,
          permission=share_data.permission,
          shared_by=user.id
      )

      db.add(share)
      await db.commit()
      await db.refresh(share)

      return share

  @router.delete("/stories/{story_id}/share/{user_id}")
  async def unshare_story(
      story_id: int,
      user_id: int,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      """공유 취소"""
      story = await get_story_or_404(db, story_id)

      if story.owner_id != user.id and user.role != "super_admin":
          raise HTTPException(403, "Only story owner can unshare")

      result = await db.execute(
          select(StoryShare).where(
              StoryShare.story_id == story_id,
              StoryShare.shared_with_user_id == user_id
          )
      )
      share = result.scalar_one_or_none()

      if not share:
          raise HTTPException(404, "Share not found")

      await db.delete(share)
      await db.commit()

      return {"message": "Share removed"}
  ```

### Phase 4: 프론트엔드 UI 구현 (30분)

- [ ] **Story 목록 페이지 탭 추가**
  - 파일: `frontend/src/pages/admin/StoryListPage.tsx` 또는 새 페이지
  ```tsx
  const [activeTab, setActiveTab] = useState<'official' | 'my' | 'shared' | 'public'>('official');

  // 탭 UI
  <div className="border-b mb-6">
    <nav className="flex space-x-8">
      <button
        onClick={() => setActiveTab('official')}
        className={activeTab === 'official' ? 'border-b-2 border-purple-600' : ''}
      >
        Official Stories
      </button>
      {isAuthenticated && (
        <>
          <button
            onClick={() => setActiveTab('my')}
            className={activeTab === 'my' ? 'border-b-2 border-purple-600' : ''}
          >
            My Stories
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={activeTab === 'shared' ? 'border-b-2 border-purple-600' : ''}
          >
            Shared with Me
          </button>
        </>
      )}
      <button
        onClick={() => setActiveTab('public')}
        className={activeTab === 'public' ? 'border-b-2 border-purple-600' : ''}
      >
        Community
      </button>
    </nav>
  </div>

  // API 호출
  useEffect(() => {
    const fetchStories = async () => {
      const res = await api.get(`/stories?filter=${activeTab}`);
      setStories(res.data);
    };
    fetchStories();
  }, [activeTab]);
  ```

- [ ] **Create My Story 버튼 및 모달**
  ```tsx
  {canCreateStory && (
    <button
      onClick={() => setShowCreateModal(true)}
      className="bg-purple-600 text-white px-4 py-2 rounded-lg"
    >
      <Plus className="w-5 h-5 inline mr-2" />
      Create My Story
    </button>
  )}

  <CreateStoryModal
    isOpen={showCreateModal}
    onClose={() => setShowCreateModal(false)}
    onCreated={() => {
      setShowCreateModal(false);
      // 목록 새로고침
    }}
  />
  ```

- [ ] **CreateStoryModal 컴포넌트**
  - 파일: `frontend/src/components/story/CreateStoryModal.tsx` (신규)
  ```tsx
  interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
  }

  export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
    isOpen, onClose, onCreated
  }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private');

    const handleCreate = async () => {
      await api.post('/my-stories', { name, description, visibility });
      onCreated();
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <h2>Create My Story</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Story Title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
          <option value="private">Private (Only me)</option>
          <option value="shared">Shared (Specific users)</option>
          <option value="public">Public (Everyone)</option>
        </select>
        <button onClick={handleCreate}>Create</button>
      </Modal>
    );
  };
  ```

- [ ] **Story Card에 Owner 표시**
  ```tsx
  <div className="story-card">
    <h3>{story.name}</h3>
    <p className="text-sm text-gray-500">
      {story.is_official ? (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Official</span>
      ) : (
        <span>by {story.owner_name}</span>
      )}
    </p>
    {story.is_shared_with_me && (
      <span className="text-xs text-green-600">
        Shared ({story.my_permission})
      </span>
    )}
  </div>
  ```

- [ ] **Share 버튼 및 모달**
  - Story 상세/편집 페이지에 추가
  ```tsx
  {canShare && (
    <button onClick={() => setShowShareModal(true)}>
      <Share2 className="w-5 h-5" />
      Share
    </button>
  )}

  <ShareStoryModal
    storyId={story.id}
    isOpen={showShareModal}
    onClose={() => setShowShareModal(false)}
  />
  ```

- [ ] **ShareStoryModal 컴포넌트**
  - 파일: `frontend/src/components/story/ShareStoryModal.tsx` (신규)
  ```tsx
  // 사용자 검색 → 선택 → 권한 설정 → 공유
  // 현재 공유된 사용자 목록 표시
  // 공유 취소 버튼
  ```

### Phase 5: 테스트 (15분)

- [ ] **기능 테스트**
  ```bash
  uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload
  ```
  - [ ] Viewer 로그인 → "Create My Story" 버튼 표시
  - [ ] Story 생성 (Private)
  - [ ] "My Stories" 탭에서 확인
  - [ ] Story 편집/삭제 가능
  - [ ] Share 버튼 클릭 → 사용자 선택 → 공유
  - [ ] 다른 사용자 로그인 → "Shared with Me" 탭에서 확인
  - [ ] Public Story 생성 → "Community" 탭에서 모든 사용자가 확인

- [ ] **권한 테스트**
  - [ ] User 로그인 → "Create My Story" 버튼 없음
  - [ ] Viewer가 만든 Story를 User가 보려고 시도 → 403
  - [ ] Public Story는 모든 사용자가 읽기 가능
  - [ ] Write 권한 공유 → 편집 가능 확인

- [ ] **DB 확인**
  ```sql
  SELECT id, name, is_official, owner_id, visibility FROM stories;
  SELECT * FROM story_shares;
  ```

### Phase 6: 회사 환경 적용 (10분)

- [ ] **최종 백업**
- [ ] **서버 중지**
- [ ] **코드 배포**
- [ ] **마이그레이션 적용**
  ```bash
  alembic upgrade head
  ```
- [ ] **데이터 검증**
  ```sql
  -- 기존 Story가 모두 official인지 확인
  SELECT COUNT(*) FROM stories WHERE is_official = 1;
  ```
- [ ] **서버 재시작**
- [ ] **실제 환경 테스트**

---

## 📌 Feature 2: GraphRAG 챗봇

**목표**: 벡터 검색 + 그래프 탐색 기반 AI 챗봇
**복잡도**: ⭐⭐⭐⭐ (높음)
**예상 소요 시간**: 2.5~4시간
**참고 문서**: `docs/graphrag_migration_guide.md`

### Phase 1: 백업 및 환경 설정 (10분)

- [ ] **백업**
  ```bash
  scripts\backup_db.bat
  # 파일: backups/app_before_graphrag_{timestamp}.db
  ```

- [ ] **OpenAI API Key 발급**
  - https://platform.openai.com/api-keys
  - `.env` 파일에 추가:
    ```
    OPENAI_API_KEY=sk-...
    ```

- [ ] **필요한 패키지 설치**
  ```bash
  cd backend
  pip install openai numpy
  # 선택: pip install sentence-transformers chromadb langchain
  ```

### Phase 2: 데이터베이스 스키마 (15분)

- [ ] **모델 추가**
  - 파일: `backend/app/models/story.py`
  ```python
  class PassageSimilarity(Base):
      __tablename__ = "passage_similarities"

      id = Column(Integer, primary_key=True)
      passage_a_id = Column(Integer, ForeignKey("passages.id"), nullable=False)
      passage_b_id = Column(Integer, ForeignKey("passages.id"), nullable=False)
      similarity_score = Column(Float, nullable=False)
      created_at = Column(DateTime, default=datetime.utcnow)

  class ChatSession(Base):
      __tablename__ = "chat_sessions"

      id = Column(Integer, primary_key=True)
      user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
      created_at = Column(DateTime, default=datetime.utcnow)
      updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

      messages = relationship("ChatMessage", back_populates="session")

  class ChatMessage(Base):
      __tablename__ = "chat_messages"

      id = Column(Integer, primary_key=True)
      session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
      role = Column(String(20), nullable=False)  # 'user' or 'assistant'
      content = Column(Text, nullable=False)
      sources = Column(Text, nullable=True)  # JSON array
      created_at = Column(DateTime, default=datetime.utcnow)

      session = relationship("ChatSession", back_populates="messages")
  ```

- [ ] **Passage 모델에 임베딩 컬럼 추가**
  ```python
  # Passage 클래스에 추가
  embedding = Column(LargeBinary, nullable=True)
  embedding_model = Column(String(50), nullable=True)
  ```

- [ ] **Alembic 마이그레이션 생성**
  ```bash
  alembic revision -m "Add GraphRAG support"
  ```
  - 생성된 파일 편집: `alembic/versions/xxxx_add_graphrag_support.py`
  - 내용: `docs/graphrag_migration_guide.md` Step 2.2 참고

- [ ] **테스트 DB에 적용**
  ```bash
  alembic upgrade head
  ```

- [ ] **검증**
  ```sql
  .schema passages  -- embedding, embedding_model 컬럼 추가
  .schema passage_similarities
  .schema chat_sessions
  .schema chat_messages
  ```

### Phase 3: 임베딩 생성 (30분~2시간)

- [ ] **임베딩 생성 스크립트 작성**
  - 파일: `backend/scripts/generate_embeddings.py`
  - 내용: `docs/graphrag_migration_guide.md` Step 3.1 참고

- [ ] **스크립트 실행**
  ```bash
  python scripts/generate_embeddings.py
  ```
  - 진행 상황 모니터링
  - 에러 발생 시 재실행 (이미 생성된 것은 스킵)

- [ ] **임베딩 생성 확인**
  ```sql
  SELECT COUNT(*) FROM passages WHERE embedding IS NOT NULL;
  -- 전체 Passage 개수와 동일해야 함
  ```

### Phase 4: 백엔드 서비스 구현 (45분)

- [ ] **벡터 검색 유틸리티**
  - 파일: `backend/app/services/vector_search.py` (신규)
  - 내용: `docs/graphrag_migration_guide.md` Step 4.1 참고
  - 함수: `cosine_similarity()`, `search_similar_passages()`

- [ ] **GraphRAG 검색 서비스**
  - 파일: `backend/app/services/graphrag_search.py` (신규)
  - 내용: `docs/graphrag_migration_guide.md` Step 4.2 참고
  - 함수: `graphrag_search()`

- [ ] **Pydantic 스키마**
  - 파일: `backend/app/schemas/chatbot.py` (신규)
  ```python
  class ChatRequest(BaseModel):
      message: str
      story_id: int | None = None
      session_id: int | None = None

  class ChatSource(BaseModel):
      id: int
      name: str
      url: str

  class ChatResponse(BaseModel):
      answer: str
      sources: list[ChatSource]
      session_id: int
  ```

- [ ] **챗봇 라우터**
  - 파일: `backend/app/routers/chatbot.py` (신규)
  - 내용: `docs/graphrag_migration_guide.md` Step 4.3 참고
  - 엔드포인트: `POST /api/chat`

- [ ] **main.py에 라우터 등록**
  ```python
  from app.routers import chatbot
  app.include_router(chatbot.router)
  ```

### Phase 5: API 테스트 (10분)

- [ ] **서버 재시작**
  ```bash
  uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload
  ```

- [ ] **API 문서 확인**
  - http://localhost:8080/docs
  - `/api/chat` 엔드포인트 확인

- [ ] **테스트 요청**
  ```powershell
  $body = @{
      message = "AI 개발을 위해 Python을 배워야 하는 이유는?"
      story_id = 1
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "http://localhost:8080/api/chat" `
      -Method Post `
      -Body $body `
      -ContentType "application/json"
  ```
  - 답변 생성 확인
  - 출처(sources) 반환 확인

### Phase 6: 프론트엔드 UI (30분)

- [ ] **API 서비스 함수 추가**
  - 파일: `frontend/src/services/api.ts`
  ```typescript
  export const chatWithBot = (message: string, storyId?: number) =>
    api.post('/chat', { message, story_id: storyId });
  ```

- [ ] **챗봇 위젯 컴포넌트**
  - 파일: `frontend/src/components/chatbot/ChatbotWidget.tsx` (신규)
  - 내용: `docs/graphrag_migration_guide.md` Step 5.1 참고
  - 기능:
    - 플로팅 버튼 (우측 하단)
    - 챗 창 토글
    - 메시지 입력/전송
    - 답변 표시 + 출처 링크

- [ ] **App.tsx에 위젯 추가**
  ```tsx
  import { ChatbotWidget } from './components/chatbot/ChatbotWidget';

  function App() {
    return (
      <>
        {/* 기존 라우터 */}
        <ChatbotWidget />
      </>
    );
  }
  ```

- [ ] **프론트엔드 빌드**
  ```bash
  cd frontend
  npm run build
  ```

### Phase 7: 통합 테스트 (15분)

- [ ] **브라우저 테스트**
  - http://localhost:8080
  - [ ] 챗봇 버튼 표시 확인 (우측 하단)
  - [ ] 버튼 클릭 → 챗 창 열림
  - [ ] 질문 입력 → 전송
  - [ ] 답변 생성 확인 (10~30초)
  - [ ] 출처 링크 클릭 → 해당 Passage로 이동

- [ ] **다양한 질문 테스트**
  - "AI란 무엇인가?"
  - "머신러닝과 딥러닝의 차이는?"
  - "Python으로 AI 개발하는 방법"
  - 존재하지 않는 내용 질문 → 에러 처리 확인

- [ ] **성능 확인**
  - 응답 시간 측정
  - 병목 구간 파악 (임베딩 생성, LLM 호출)

### Phase 8: 회사 환경 적용 (15분)

- [ ] **최종 백업**
  ```bash
  scripts\backup_db.bat
  copy backups\app_FINAL_*.db E:\
  ```

- [ ] **서버 중지**
- [ ] **코드 배포**
- [ ] **환경 변수 설정**
  - `.env`에 `OPENAI_API_KEY` 추가
- [ ] **마이그레이션 적용**
  ```bash
  alembic upgrade head
  ```
- [ ] **임베딩 생성**
  ```bash
  python scripts/generate_embeddings.py
  ```
- [ ] **서버 재시작**
- [ ] **실제 환경 테스트**

### Phase 9: 최적화 및 모니터링 (선택)

- [ ] **비용 모니터링**
  - OpenAI API 사용량 추적
  - 월 예산 설정

- [ ] **캐싱 추가**
  - 동일 질문 재사용
  - Redis 캐시 (선택)

- [ ] **ChromaDB 마이그레이션** (Passage 1000개 이상 시)
  - SQLite → ChromaDB
  - 벡터 검색 속도 개선

- [ ] **피드백 수집**
  - 좋아요/싫어요 버튼
  - 답변 품질 개선

---

## 📌 Feature 4: 태그 시스템

**목표**: Passage/Story를 태그로 분류하고 검색/필터링
**복잡도**: ⭐⭐ (중간)
**예상 소요 시간**: 1시간
**핵심 가치**: 콘텐츠 분류 및 빠른 탐색

### Phase 1: 백업 및 준비 (5분)

- [ ] **백업**
  ```bash
  scripts\backup_db.bat
  ```

### Phase 2: 데이터베이스 스키마 (10분)

- [ ] **Tag 모델 생성**
  - 파일: `backend/app/models/story.py`
  ```python
  class Tag(Base):
      __tablename__ = "tags"

      id = Column(Integer, primary_key=True)
      name = Column(String(50), unique=True, nullable=False)
      color = Column(String(20), nullable=True)  # UI 색상 (선택)
      created_at = Column(DateTime, default=datetime.utcnow)

      # Relationships
      passages = relationship("PassageTag", back_populates="tag")

  class PassageTag(Base):
      __tablename__ = "passage_tags"

      id = Column(Integer, primary_key=True)
      passage_id = Column(Integer, ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
      tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
      created_at = Column(DateTime, default=datetime.utcnow)

      # Relationships
      passage = relationship("Passage", back_populates="tags")
      tag = relationship("Tag", back_populates="passages")

  # Passage 모델에 추가
  tags = relationship("PassageTag", back_populates="passage")
  ```

- [ ] **Alembic 마이그레이션**
  ```bash
  alembic revision --autogenerate -m "Add tag system"
  alembic upgrade head
  ```

### Phase 3: 백엔드 구현 (20분)

- [ ] **Pydantic 스키마**
  ```python
  class TagBase(BaseModel):
      name: str
      color: str | None = None

  class TagResponse(TagBase):
      id: int
      created_at: datetime

  class PassageWithTags(PassageResponse):
      tags: list[TagResponse] = []
  ```

- [ ] **Tag API**
  - `GET /api/tags` - 모든 태그 목록
  - `POST /api/tags` - 태그 생성 (Admin/Editor)
  - `POST /api/passages/{id}/tags` - Passage에 태그 추가
  - `DELETE /api/passages/{id}/tags/{tag_id}` - 태그 제거

### Phase 4: 프론트엔드 (20분)

- [ ] **태그 입력 컴포넌트** (자동완성)
- [ ] **태그 표시 (배지 형태)**
- [ ] **태그 클릭 → 필터링**
- [ ] **태그 클라우드 (인기 태그)**

### Phase 5: 테스트 및 배포 (5분)

---

## 📌 Feature 5: 전문 검색 (Full-Text Search)

**목표**: Passage 내용 전체 텍스트 검색
**복잡도**: ⭐⭐ (중간)
**예상 소요 시간**: 1시간
**핵심 가치**: 정보 접근성 대폭 향상

### Phase 1: 백업 (5분)

### Phase 2: 검색 엔진 설정 (15분)

- [ ] **SQLite FTS5 활용**
  ```sql
  -- Virtual table 생성
  CREATE VIRTUAL TABLE passages_fts USING fts5(
      name,
      content,
      content='passages',
      content_rowid='id'
  );

  -- Trigger로 자동 동기화
  CREATE TRIGGER passages_ai AFTER INSERT ON passages BEGIN
      INSERT INTO passages_fts(rowid, name, content)
      VALUES (new.id, new.name, new.content);
  END;

  CREATE TRIGGER passages_ad AFTER DELETE ON passages BEGIN
      DELETE FROM passages_fts WHERE rowid = old.id;
  END;

  CREATE TRIGGER passages_au AFTER UPDATE ON passages BEGIN
      UPDATE passages_fts SET name = new.name, content = new.content
      WHERE rowid = new.id;
  END;
  ```

- [ ] **Alembic 마이그레이션**
  - Raw SQL 실행으로 FTS5 테이블 생성

### Phase 3: 백엔드 구현 (20분)

- [ ] **검색 API**
  ```python
  @router.get("/api/search", response_model=SearchResponse)
  async def search_passages(
      q: str,  # 검색어
      filter_story: int | None = None,
      filter_tags: list[str] | None = None,
      limit: int = 20,
      db: AsyncSession = Depends(get_db)
  ):
      """전문 검색"""
      # FTS5 쿼리
      stmt = text("""
          SELECT passages.*, rank
          FROM passages_fts
          JOIN passages ON passages.id = passages_fts.rowid
          WHERE passages_fts MATCH :query
          ORDER BY rank
          LIMIT :limit
      """)

      result = await db.execute(stmt, {"query": q, "limit": limit})
      # ...
  ```

### Phase 4: 프론트엔드 (15분)

- [ ] **헤더 검색창**
- [ ] **검색 결과 페이지**
- [ ] **하이라이트 표시**
- [ ] **필터 UI (Story, 태그)**

### Phase 5: 테스트 및 배포 (5분)

---

## 📌 Feature 6: 학습 진도 추적 (Progress Tracking)

**목표**: 사용자별 Story 완료율, 읽은 Passage 체크
**복잡도**: ⭐⭐ (중간)
**예상 소요 시간**: 1.5시간
**핵심 가치**: 학습 동기 부여, 효과 측정

### Phase 1: 백업 (5분)

### Phase 2: 데이터베이스 스키마 (15분)

- [ ] **UserProgress 모델**
  ```python
  class UserProgress(Base):
      __tablename__ = "user_progress"

      id = Column(Integer, primary_key=True)
      user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      passage_id = Column(Integer, ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
      completed = Column(Boolean, default=False)
      completed_at = Column(DateTime, nullable=True)
      visit_count = Column(Integer, default=0)
      last_visited_at = Column(DateTime, default=datetime.utcnow)

      # Unique constraint
      __table_args__ = (
          UniqueConstraint('user_id', 'passage_id', name='uq_user_passage'),
      )

      # Relationships
      user = relationship("User", back_populates="progress")
      passage = relationship("Passage")
  ```

- [ ] **Alembic 마이그레이션**

### Phase 3: 백엔드 구현 (30분)

- [ ] **진도 기록 API**
  - `POST /api/progress/visit/{passage_id}` - 방문 기록
  - `POST /api/progress/complete/{passage_id}` - 완료 체크
  - `GET /api/progress/story/{story_id}` - Story 진도율

- [ ] **통계 API (Admin용)**
  - `GET /api/admin/analytics/progress` - 전체 진도 통계

### Phase 4: 프론트엔드 (30분)

- [ ] **Progress Bar (Story 상단)**
  ```tsx
  <div className="progress-bar">
    <div className="fill" style={{width: `${progress}%`}}>
      {progress}% Complete
    </div>
  </div>
  ```

- [ ] **완료 체크박스 (Passage 하단)**
- [ ] **읽은 Passage 표시 (✅)**
- [ ] **대시보드 (내 진도)**

### Phase 5: 자동 추적 (10분)

- [ ] **Passage 조회 시 자동 visit 기록**
- [ ] **일정 시간 체류 시 자동 완료 (선택)**

### Phase 6: 테스트 및 배포 (10분)

---

## 📌 Feature 7: 관련 Passage 추천

**목표**: 현재 Passage와 관련된 다른 Passage 자동 추천
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 1시간
**전제 조건**: Feature 2 (GraphRAG) 완료 또는 Feature 4 (태그) 완료

### Phase 1: 추천 로직 선택

**옵션 A: 태그 기반 (간단)**
- 동일 태그를 가진 Passage 추천
- 태그 개수가 많을수록 우선순위 높음

**옵션 B: 벡터 유사도 기반 (정확)**
- GraphRAG 임베딩 활용
- 코사인 유사도 상위 N개

### Phase 2: 백엔드 구현 (30분)

- [ ] **추천 API**
  ```python
  @router.get("/api/passages/{passage_id}/recommendations")
  async def get_recommendations(
      passage_id: int,
      limit: int = 5,
      method: str = "tags",  # tags or vector
      db: AsyncSession = Depends(get_db)
  ):
      if method == "tags":
          # 태그 기반 추천
          # ...
      elif method == "vector":
          # 벡터 유사도 기반 (GraphRAG 필요)
          # ...
  ```

### Phase 3: 프론트엔드 (20분)

- [ ] **추천 컴포넌트 (사이드바 또는 하단)**
  ```tsx
  <div className="recommendations">
    <h3>Related Passages</h3>
    <ul>
      {recommendations.map(passage => (
        <li key={passage.id}>
          <Link to={`/passage/${passage.id}`}>
            {passage.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
  ```

### Phase 4: 테스트 및 배포 (10분)

---

## 📌 Feature 8: 학습 경로 추천

**목표**: 사용자 역할/목표에 맞는 Story 순서 추천
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 2시간
**핵심 가치**: 초보자 가이드, 맞춤형 학습

### Phase 1: 백업 (5분)

### Phase 2: 학습 경로 설계 (20분)

- [ ] **LearningPath 모델**
  ```python
  class LearningPath(Base):
      __tablename__ = "learning_paths"

      id = Column(Integer, primary_key=True)
      name = Column(String(200), nullable=False)
      description = Column(Text, nullable=True)
      target_role = Column(String(50), nullable=True)  # 'beginner', 'developer', etc.
      created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
      is_official = Column(Boolean, default=False)
      created_at = Column(DateTime, default=datetime.utcnow)

      steps = relationship("LearningPathStep", back_populates="path", order_by="LearningPathStep.order")

  class LearningPathStep(Base):
      __tablename__ = "learning_path_steps"

      id = Column(Integer, primary_key=True)
      path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
      story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
      order = Column(Integer, nullable=False)
      description = Column(Text, nullable=True)

      path = relationship("LearningPath", back_populates="steps")
      story = relationship("Story")
  ```

- [ ] **Alembic 마이그레이션**

### Phase 3: 백엔드 구현 (40분)

- [ ] **학습 경로 API**
  - `GET /api/learning-paths` - 경로 목록
  - `GET /api/learning-paths/{id}` - 경로 상세
  - `POST /api/admin/learning-paths` - 경로 생성 (Admin)

- [ ] **추천 로직**
  ```python
  @router.get("/api/learning-paths/recommend")
  async def recommend_path(
      role: str | None = None,
      user: User | None = Depends(get_current_user_optional),
      db: AsyncSession = Depends(get_db)
  ):
      """역할 기반 경로 추천"""
      # ...
  ```

### Phase 4: 프론트엔드 (40분)

- [ ] **학습 경로 페이지**
- [ ] **경로 선택 UI**
- [ ] **진행 상황 표시**
- [ ] **다음 단계 안내**

### Phase 5: 테스트 및 배포 (15분)

---

## 📌 Feature 9: 퀴즈/테스트 기능

**목표**: Passage 이해도 체크 및 학습 효과 측정
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 2.5시간
**핵심 가치**: 학습 효과 검증

### Phase 1: 백업 (5분)

### Phase 2: 데이터베이스 스키마 (20분)

- [ ] **Quiz 모델**
  ```python
  class Quiz(Base):
      __tablename__ = "quizzes"

      id = Column(Integer, primary_key=True)
      passage_id = Column(Integer, ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
      question = Column(Text, nullable=False)
      question_type = Column(String(20), nullable=False)  # 'multiple_choice', 'true_false', 'short_answer'
      options = Column(Text, nullable=True)  # JSON array for multiple choice
      correct_answer = Column(Text, nullable=False)
      explanation = Column(Text, nullable=True)
      order = Column(Integer, default=0)
      created_at = Column(DateTime, default=datetime.utcnow)

      passage = relationship("Passage", back_populates="quizzes")
      attempts = relationship("QuizAttempt", back_populates="quiz")

  class QuizAttempt(Base):
      __tablename__ = "quiz_attempts"

      id = Column(Integer, primary_key=True)
      quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
      user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      user_answer = Column(Text, nullable=False)
      is_correct = Column(Boolean, nullable=False)
      attempted_at = Column(DateTime, default=datetime.utcnow)

      quiz = relationship("Quiz", back_populates="attempts")
      user = relationship("User")
  ```

- [ ] **Alembic 마이그레이션**

### Phase 3: 백엔드 구현 (60분)

- [ ] **Quiz CRUD API (Admin)**
  - `POST /api/admin/passages/{id}/quizzes` - 퀴즈 생성
  - `PUT /api/admin/quizzes/{id}` - 퀴즈 수정
  - `DELETE /api/admin/quizzes/{id}` - 퀴즈 삭제

- [ ] **Quiz 조회 및 제출 API**
  - `GET /api/passages/{id}/quizzes` - Passage의 퀴즈 목록 (정답 제외)
  - `POST /api/quizzes/{id}/submit` - 답안 제출 및 채점

### Phase 4: 프론트엔드 (50분)

- [ ] **Quiz 생성 UI (Admin/Editor)**
  - 문제 유형 선택
  - 선택지 추가/삭제
  - 정답 설정

- [ ] **Quiz 표시 UI (User)**
  - Passage 하단에 퀴즈 섹션
  - 문제 유형별 UI 컴포넌트
  - 제출 버튼

- [ ] **결과 표시**
  - 정답/오답 표시
  - 해설 표시
  - 점수 저장

### Phase 5: 통계 (10min)

- [ ] **Quiz 통계 API**
  - 정답률
  - 사용자별 점수

### Phase 6: 테스트 및 배포 (15분)

---

## 📌 Feature 10: 알림 시스템

**목표**: 공유, 댓글, 업데이트 등 실시간 알림
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 2시간
**핵심 가치**: 사용자 참여 증대

### Phase 1: 백업 (5분)

### Phase 2: 데이터베이스 스키마 (15분)

- [ ] **Notification 모델**
  ```python
  class Notification(Base):
      __tablename__ = "notifications"

      id = Column(Integer, primary_key=True)
      user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      type = Column(String(50), nullable=False)  # 'share', 'comment', 'update', etc.
      title = Column(String(200), nullable=False)
      message = Column(Text, nullable=False)
      link = Column(String(500), nullable=True)  # 관련 URL
      is_read = Column(Boolean, default=False)
      created_at = Column(DateTime, default=datetime.utcnow)

      user = relationship("User", back_populates="notifications")
  ```

- [ ] **Alembic 마이그레이션**

### Phase 3: 백엔드 구현 (40min)

- [ ] **Notification 생성 함수**
  ```python
  async def create_notification(
      db: AsyncSession,
      user_id: int,
      type: str,
      title: str,
      message: str,
      link: str | None = None
  ):
      notif = Notification(...)
      db.add(notif)
      await db.commit()
  ```

- [ ] **Notification API**
  - `GET /api/notifications` - 내 알림 목록
  - `PUT /api/notifications/{id}/read` - 읽음 처리
  - `DELETE /api/notifications/{id}` - 삭제
  - `GET /api/notifications/unread-count` - 안 읽은 알림 개수

- [ ] **알림 트리거 추가**
  - Story 공유 시
  - Passage 편집 시 (공유받은 사람에게)
  - 공식 Story 업데이트 시

### Phase 4: 프론트엔드 (45min)

- [ ] **알림 아이콘 (헤더)**
  - 빨간 배지 (안 읽은 개수)
  - 클릭 시 드롭다운

- [ ] **알림 목록**
  - 제목, 메시지, 시간
  - 클릭 시 관련 페이지 이동
  - 읽음 처리

- [ ] **실시간 폴링 (선택)**
  - 5초마다 unread-count 체크
  - 또는 WebSocket (고급)

### Phase 5: 테스트 및 배포 (15min)

---

## 📌 Feature 11: 활동 로그 (Audit Log)

**목표**: 관리자용 사용자 활동 추적 및 보안 감사
**복잡도**: ⭐⭐ (중간)
**예상 소요 시간**: 1.5시간
**핵심 가치**: 보안, 문제 추적

### Phase 1: 백업 (5분)

### Phase 2: 데이터베이스 스키마 (15분)

- [ ] **AuditLog 모델**
  ```python
  class AuditLog(Base):
      __tablename__ = "audit_logs"

      id = Column(Integer, primary_key=True)
      user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
      action = Column(String(100), nullable=False)  # 'create_story', 'edit_passage', etc.
      resource_type = Column(String(50), nullable=False)  # 'story', 'passage', 'user', etc.
      resource_id = Column(Integer, nullable=True)
      details = Column(Text, nullable=True)  # JSON
      ip_address = Column(String(45), nullable=True)
      user_agent = Column(String(500), nullable=True)
      created_at = Column(DateTime, default=datetime.utcnow)

      user = relationship("User")
  ```

- [ ] **Alembic 마이그레이션**

### Phase 3: 백엔드 구현 (30min)

- [ ] **로깅 미들웨어**
  ```python
  async def log_audit(
      db: AsyncSession,
      user: User | None,
      action: str,
      resource_type: str,
      resource_id: int | None,
      request: Request
  ):
      log = AuditLog(
          user_id=user.id if user else None,
          action=action,
          resource_type=resource_type,
          resource_id=resource_id,
          ip_address=request.client.host,
          user_agent=request.headers.get("user-agent"),
      )
      db.add(log)
      await db.commit()
  ```

- [ ] **주요 액션에 로깅 추가**
  - Story/Passage CRUD
  - 사용자 권한 변경
  - 로그인/로그아웃

- [ ] **Audit Log API (Super Admin만)**
  - `GET /api/admin/audit-logs`
  - 필터: 날짜, 사용자, 액션 타입

### Phase 4: 프론트엔드 (30min)

- [ ] **Audit Log 페이지 (Super Admin)**
  - 테이블 형태
  - 필터 UI
  - 페이지네이션

### Phase 5: 테스트 및 배포 (10min)

---

## 📌 Feature 12: PDF/Markdown 내보내기

**목표**: Story를 PDF 또는 Markdown 파일로 내보내기
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 2시간
**핵심 가치**: 오프라인 열람, 문서 공유

### Phase 1: 백업 (5min)

### Phase 2: 백엔드 구현 (60min)

- [ ] **필요한 라이브러리 설치**
  ```bash
  pip install weasyprint markdown2
  # 또는 reportlab
  ```

- [ ] **Markdown 내보내기**
  ```python
  @router.get("/api/stories/{story_id}/export/markdown")
  async def export_markdown(
      story_id: int,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      # 1. Story 및 모든 Passage 조회
      # 2. Markdown 형식으로 변환
      # 3. FileResponse 반환
  ```

- [ ] **PDF 내보내기**
  ```python
  @router.get("/api/stories/{story_id}/export/pdf")
  async def export_pdf(
      story_id: int,
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      # 1. Markdown 생성
      # 2. HTML로 변환
      # 3. WeasyPrint로 PDF 생성
      # 4. FileResponse 반환
  ```

### Phase 3: 프론트엔드 (30min)

- [ ] **Export 버튼 (Story 상세 페이지)**
  ```tsx
  <button onClick={() => exportStory('pdf')}>
    <Download /> Export as PDF
  </button>
  <button onClick={() => exportStory('markdown')}>
    <FileText /> Export as Markdown
  </button>
  ```

- [ ] **다운로드 처리**
  ```typescript
  const exportStory = async (format: 'pdf' | 'markdown') => {
    const response = await api.get(`/stories/${storyId}/export/${format}`, {
      responseType: 'blob'
    });
    // Blob 다운로드
  };
  ```

### Phase 4: 스타일링 (20min)

- [ ] **PDF 스타일 커스터마이징**
  - 표지 페이지
  - 목차
  - 페이지 번호

### Phase 5: 테스트 및 배포 (10min)

---

## 📌 Feature 13: 대시보드 & 분석

**목표**: 관리자/사용자용 통계 대시보드
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 2.5시간
**핵심 가치**: 데이터 기반 의사결정

### Phase 1: 백업 (5min)

### Phase 2: 백엔드 구현 (60min)

- [ ] **통계 API (Admin)**
  ```python
  @router.get("/api/admin/analytics/overview")
  async def get_analytics_overview(
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_admin_user)
  ):
      return {
          "total_users": ...,
          "total_stories": ...,
          "total_passages": ...,
          "active_users_30d": ...,
          "popular_passages": [...],
          "completion_rate": ...,
      }
  ```

- [ ] **사용자별 통계 API**
  ```python
  @router.get("/api/my-stats")
  async def get_my_stats(
      db: AsyncSession = Depends(get_db),
      user: User = Depends(get_current_user_required)
  ):
      return {
          "stories_completed": ...,
          "passages_read": ...,
          "quizzes_taken": ...,
          "average_score": ...,
      }
  ```

### Phase 3: 프론트엔드 (70min)

- [ ] **Admin 대시보드 페이지**
  - 차트 라이브러리: `recharts` 또는 `chart.js`
  - KPI 카드 (사용자 수, Story 수 등)
  - 선 그래프 (일별 활동)
  - 바 차트 (인기 Passage)
  - 파이 차트 (진도율 분포)

- [ ] **개인 대시보드**
  - 내 진도
  - 학습 시간
  - 퀴즈 점수

### Phase 4: 테스트 및 배포 (15min)

---

## 📌 Feature 14: 템플릿 시스템

**목표**: Story/Passage 템플릿으로 빠른 생성
**복잡도**: ⭐⭐ (중간)
**예상 소요 시간**: 1.5시간
**핵심 가치**: 생산성 향상, 일관성

### Phase 1: 백업 (5min)

### Phase 2: 데이터베이스 스키마 (15min)

- [ ] **Template 모델**
  ```python
  class Template(Base):
      __tablename__ = "templates"

      id = Column(Integer, primary_key=True)
      name = Column(String(200), nullable=False)
      type = Column(String(50), nullable=False)  # 'story' or 'passage'
      content = Column(Text, nullable=False)  # JSON
      category = Column(String(100), nullable=True)  # 'tutorial', 'faq', 'project', etc.
      is_official = Column(Boolean, default=False)
      created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
      created_at = Column(DateTime, default=datetime.utcnow)
  ```

- [ ] **Alembic 마이그레이션**

### Phase 3: 백엔드 구현 (30min)

- [ ] **Template CRUD API**
  - `GET /api/templates` - 템플릿 목록
  - `POST /api/admin/templates` - 템플릿 생성 (Admin)
  - `POST /api/stories/from-template/{template_id}` - 템플릿에서 Story 생성

### Phase 4: 프론트엔드 (30min)

- [ ] **템플릿 선택 UI**
  - "Create from Template" 버튼
  - 템플릿 갤러리
  - 미리보기

### Phase 5: 기본 템플릿 생성 (10min)

- [ ] **공식 템플릿 추가**
  - "튜토리얼" 템플릿
  - "FAQ" 템플릿
  - "프로젝트 가이드" 템플릿

### Phase 6: 테스트 및 배포 (10min)

---

## 📌 Feature 15: 이미지 업로드 & 관리

**목표**: Passage에 이미지 추가 및 라이브러리 관리
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 2시간
**핵심 가치**: 시각적 학습 자료

### Phase 1: 백업 (5min)

### Phase 2: 백엔드 구현 (50min)

- [ ] **이미지 업로드 API**
  ```python
  @router.post("/api/upload/image")
  async def upload_image(
      file: UploadFile = File(...),
      user: User = Depends(get_current_user_required)
  ):
      # 1. 파일 검증 (크기, 확장자)
      # 2. 파일명 생성 (UUID)
      # 3. uploads/ 폴더에 저장
      # 4. DB에 기록 (선택)
      # 5. URL 반환
  ```

- [ ] **Image 모델 (선택)**
  ```python
  class Image(Base):
      __tablename__ = "images"

      id = Column(Integer, primary_key=True)
      filename = Column(String(255), nullable=False)
      original_filename = Column(String(255), nullable=True)
      file_size = Column(Integer, nullable=True)
      uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
      uploaded_at = Column(DateTime, default=datetime.utcnow)
  ```

### Phase 3: 프론트엔드 (50min)

- [ ] **TipTap 이미지 확장 설정**
  - 이미지 업로드 버튼
  - 드래그 앤 드롭
  - 크기 조절 핸들

- [ ] **이미지 라이브러리**
  - 업로드한 이미지 목록
  - 검색/필터
  - 재사용

### Phase 4: 최적화 (10min)

- [ ] **이미지 압축/리사이징** (선택)
  - Pillow 라이브러리
  - 썸네일 생성

### Phase 5: 테스트 및 배포 (10min)

---

## 📌 Feature 16: 다크 모드

**목표**: UI 테마 전환 (라이트/다크)
**복잡도**: ⭐⭐ (중간)
**예상 소요 시간**: 1시간
**핵심 가치**: 사용자 경험 개선

### Phase 1: Tailwind 다크 모드 설정 (15min)

- [ ] **tailwind.config.js 수정**
  ```javascript
  module.exports = {
    darkMode: 'class',
    // ...
  }
  ```

### Phase 2: 테마 관리 (20min)

- [ ] **Theme Store**
  ```typescript
  // stores/themeStore.ts
  const useThemeStore = create<ThemeStore>((set) => ({
    theme: localStorage.getItem('theme') || 'light',
    toggleTheme: () => set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return { theme: newTheme };
    }),
  }));
  ```

- [ ] **App.tsx에서 테마 적용**
  ```tsx
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  ```

### Phase 3: 다크 모드 스타일 적용 (20min)

- [ ] **주요 컴포넌트에 dark: 클래스 추가**
  ```tsx
  <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  ```

### Phase 4: 테마 전환 버튼 (5min)

- [ ] **헤더에 토글 버튼**
  ```tsx
  <button onClick={toggleTheme}>
    {theme === 'light' ? <Moon /> : <Sun />}
  </button>
  ```

### Phase 5: 테스트 (10min)

---

## 📌 Feature 17: 다국어 지원 (i18n)

**목표**: 영어/한국어 UI 전환
**복잡도**: ⭐⭐⭐ (중상)
**예상 소요 시간**: 2.5시간
**핵심 가치**: 글로벌 사용

### Phase 1: i18n 라이브러리 설정 (20min)

- [ ] **react-i18next 설치**
  ```bash
  npm install react-i18next i18next
  ```

- [ ] **i18n 설정**
  ```typescript
  // i18n.ts
  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: {...} },
      ko: { translation: {...} },
    },
    lng: 'ko',
    fallbackLng: 'en',
  });
  ```

### Phase 2: 번역 파일 작성 (60min)

- [ ] **locales/ko.json**
  ```json
  {
    "header": {
      "home": "홈",
      "stories": "스토리",
      "profile": "프로필"
    },
    "story": {
      "create": "스토리 만들기",
      "edit": "편집",
      "delete": "삭제"
    }
  }
  ```

- [ ] **locales/en.json**
  ```json
  {
    "header": {
      "home": "Home",
      "stories": "Stories",
      "profile": "Profile"
    },
    "story": {
      "create": "Create Story",
      "edit": "Edit",
      "delete": "Delete"
    }
  }
  ```

### Phase 3: 컴포넌트 수정 (50min)

- [ ] **useTranslation 훅 사용**
  ```tsx
  import { useTranslation } from 'react-i18next';

  const MyComponent = () => {
    const { t } = useTranslation();

    return <h1>{t('header.home')}</h1>;
  };
  ```

### Phase 4: 언어 전환 UI (10min)

- [ ] **언어 선택 드롭다운**
  ```tsx
  <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
    <option value="ko">한국어</option>
    <option value="en">English</option>
  </select>
  ```

### Phase 5: Passage 콘텐츠 번역 (선택)

- [ ] **다국어 콘텐츠 지원**
  - `passage_translations` 테이블
  - 언어별 콘텐츠 저장

### Phase 6: 테스트 및 배포 (20min)

---

## 📋 우선순위 및 일정

### 권장 순서 (3단계)

#### 🎯 Phase 1: 핵심 기능 (필수, Week 1-3)
1. **Feature 1: Passage Edit History** (45분) ⭐⭐
2. **Feature 3: User-Generated Stories** (1.5~2시간) ⭐⭐⭐
3. **Feature 2: GraphRAG 챗봇** (2.5~4시간) ⭐⭐⭐⭐

**소요 시간**: 약 5~7시간

#### 🚀 Phase 2: 기본 기능 강화 (Week 4-6)
4. **Feature 6: 학습 진도 추적** (1.5시간) ⭐⭐
5. **Feature 5: 전문 검색** (1시간) ⭐⭐
6. **Feature 4: 태그 시스템** (1시간) ⭐⭐
7. **Feature 7: 관련 Passage 추천** (1시간) ⭐⭐⭐

**소요 시간**: 약 4.5시간

#### 📈 Phase 3: 고급 기능 (Week 7-12)
8. **Feature 8: 학습 경로 추천** (2시간) ⭐⭐⭐
9. **Feature 9: 퀴즈/테스트** (2.5시간) ⭐⭐⭐
10. **Feature 13: 대시보드 & 분석** (2.5시간) ⭐⭐⭐
11. **Feature 10: 알림 시스템** (2시간) ⭐⭐⭐
12. **Feature 11: 활동 로그** (1.5시간) ⭐⭐
13. **Feature 12: PDF/Markdown 내보내기** (2시간) ⭐⭐⭐
14. **Feature 14: 템플릿 시스템** (1.5시간) ⭐⭐
15. **Feature 15: 이미지 업로드** (2시간) ⭐⭐⭐
16. **Feature 16: 다크 모드** (1시간) ⭐⭐
17. **Feature 17: 다국어 지원** (2.5시간) ⭐⭐⭐

**소요 시간**: 약 19.5시간

### 전체 로드맵 (12주)

```
Week 1: Feature 1 (Edit History)
├─ 구현 및 테스트
└─ 회사 환경 적용

Week 2-3: Feature 3 + Feature 2
├─ User Stories 구현
├─ GraphRAG 챗봇 구현
└─ 통합 테스트

Week 4: 기본 기능 강화 I
├─ Feature 6: 학습 진도 추적
└─ Feature 5: 전문 검색

Week 5: 기본 기능 강화 II
├─ Feature 4: 태그 시스템
└─ Feature 7: 관련 Passage 추천

Week 6: 학습 효과 증대 I
├─ Feature 8: 학습 경로 추천
└─ Feature 9: 퀴즈/테스트 (Part 1)

Week 7: 학습 효과 증대 II
├─ Feature 9: 퀴즈/테스트 (Part 2)
└─ Feature 13: 대시보드 & 분석 (Part 1)

Week 8: 협업 & 관리 I
├─ Feature 13: 대시보드 & 분석 (Part 2)
└─ Feature 10: 알림 시스템

Week 9: 협업 & 관리 II
├─ Feature 11: 활동 로그
└─ Feature 12: PDF/Markdown 내보내기

Week 10: 콘텐츠 관리
├─ Feature 14: 템플릿 시스템
└─ Feature 15: 이미지 업로드

Week 11-12: UX 개선
├─ Feature 16: 다크 모드
├─ Feature 17: 다국어 지원
└─ 전체 통합 테스트 및 최적화
```

### 우선순위별 분류

**🔥 Tier 1 (높은 ROI, 즉시 가치):**
- Feature 1, 3, 6, 5, 4

**⭐ Tier 2 (중기적 가치):**
- Feature 2, 7, 8, 9, 10, 13

**✨ Tier 3 (장기적 가치):**
- Feature 11, 12, 14, 15, 16, 17

---

## 🚨 주의사항

### 공통
- [ ] 모든 단계 전 **백업 필수**
- [ ] 테스트 환경에서 먼저 검증
- [ ] 마이그레이션 파일 검토 (`passages` 테이블 직접 변경 없어야 함)
- [ ] 서버 중지 → 마이그레이션 → 재시작 순서 준수

### Feature 1 (Edit History)
- [ ] `change_summary` 필드는 선택적 (nullable)
- [ ] Revision 저장 시 트랜잭션 사용
- [ ] 되돌리기 전 현재 내용 백업

### Feature 3 (User Stories)
- [ ] 기존 Story의 `is_official=TRUE`, `owner_id=NULL` 유지 필수
- [ ] 마이그레이션 시 `server_default` 사용하여 기존 데이터 보호
- [ ] Story 삭제 시 CASCADE로 StoryShare도 자동 삭제
- [ ] 권한 체크 로직 철저히 테스트 (본인 것만 편집 가능)
- [ ] Public Story는 누구나 읽기 가능하지만 편집은 Owner만

### Feature 2 (GraphRAG)
- [ ] OpenAI API 키 보안 (.env 파일, git에 커밋 금지)
- [ ] 임베딩 생성 비용 확인 ($0.50~$1.00 예상)
- [ ] Rate limit 주의 (분당 요청 제한)
- [ ] ChromaDB 등 대안 검토 (무료, 오프라인)

### Feature 4-17 (추가 기능들)
- [ ] **Feature 5 (검색)**: FTS5는 SQLite 3.9.0+ 필요, 버전 확인
- [ ] **Feature 6 (진도)**: 대용량 데이터 시 인덱스 최적화 필요
- [ ] **Feature 9 (퀴즈)**: 정답 암호화 또는 백엔드 검증
- [ ] **Feature 10 (알림)**: 너무 많은 알림은 UX 저해, 필터링 필요
- [ ] **Feature 12 (PDF)**: WeasyPrint는 큰 파일 시 메모리 소모
- [ ] **Feature 15 (이미지)**: 업로드 크기 제한 (5MB 권장), 악성 파일 검증
- [ ] **Feature 17 (i18n)**: Passage 콘텐츠 번역은 별도 DB 설계 필요

---

## ✅ 완료 조건

### Phase 1: 핵심 기능

**Feature 1: Passage Edit History**
- [ ] Passage 편집 시 자동으로 히스토리 저장
- [ ] 히스토리 UI에서 이전 버전 목록 확인 가능
- [ ] "Revert" 버튼으로 되돌리기 성공
- [ ] DB에 `passage_revisions` 레코드 존재

**Feature 3: User-Generated Stories**
- [ ] Viewer가 "Create My Story" 버튼으로 Story 생성 가능
- [ ] My Stories 탭에서 자신의 Story 목록 확인
- [ ] User Story 편집/삭제 가능 (본인 것만)
- [ ] Share 버튼으로 다른 사용자와 공유 가능
- [ ] Shared with Me 탭에서 공유받은 Story 확인
- [ ] Public Story가 Community 탭에 표시
- [ ] DB에 `story_shares` 레코드 존재

**Feature 2: GraphRAG 챗봇**
- [ ] 모든 Passage에 임베딩 생성 완료
- [ ] 챗봇 위젯 UI 표시
- [ ] 질문 입력 → AI 답변 생성
- [ ] 출처(Source) 링크 작동

### Phase 2: 기본 기능 강화

**Feature 6: 학습 진도 추적**
- [ ] Passage 조회 시 자동 방문 기록
- [ ] 완료 체크박스 작동
- [ ] Progress bar 표시
- [ ] 대시보드에서 진도율 확인

**Feature 5: 전문 검색**
- [ ] FTS5 테이블 생성 및 동기화
- [ ] 검색 API 작동
- [ ] 헤더 검색창에서 검색 가능
- [ ] 결과 하이라이트 표시

**Feature 4: 태그 시스템**
- [ ] Passage/Story에 태그 추가 가능
- [ ] 태그 클릭으로 필터링 작동
- [ ] 태그 자동완성 기능
- [ ] 태그 클라우드 표시

**Feature 7: 관련 Passage 추천**
- [ ] 추천 API 작동
- [ ] 사이드바에 추천 목록 표시
- [ ] 클릭 시 해당 Passage로 이동

### Phase 3: 고급 기능

**Feature 8: 학습 경로 추천**
- [ ] 학습 경로 생성 가능
- [ ] 경로별 진행 상황 추적
- [ ] 다음 단계 안내 작동

**Feature 9: 퀴즈/테스트**
- [ ] Admin이 퀴즈 생성 가능
- [ ] 사용자가 퀴즈 풀기 가능
- [ ] 자동 채점 및 해설 표시
- [ ] 점수 저장 및 통계

**Feature 13: 대시보드 & 분석**
- [ ] Admin 대시보드 차트 표시
- [ ] 개인 통계 페이지 작동
- [ ] KPI 카드 실시간 업데이트

**Feature 10: 알림 시스템**
- [ ] 알림 생성 로직 작동
- [ ] 헤더 알림 아이콘 표시
- [ ] 안 읽은 알림 개수 표시
- [ ] 클릭 시 관련 페이지 이동

**Feature 11: 활동 로그**
- [ ] 주요 액션 자동 로깅
- [ ] Super Admin 로그 조회 가능
- [ ] 필터 및 검색 작동

**Feature 12: PDF/Markdown 내보내기**
- [ ] Markdown 내보내기 작동
- [ ] PDF 내보내기 작동
- [ ] 다운로드 성공

**Feature 14: 템플릿 시스템**
- [ ] 템플릿 생성 가능
- [ ] 템플릿에서 Story 생성 작동
- [ ] 기본 템플릿 3개 이상

**Feature 15: 이미지 업로드**
- [ ] 이미지 업로드 작동
- [ ] TipTap 에디터에서 이미지 삽입
- [ ] 이미지 라이브러리 표시

**Feature 16: 다크 모드**
- [ ] 테마 전환 버튼 작동
- [ ] 모든 페이지 다크 모드 적용
- [ ] 설정 로컬 저장

**Feature 17: 다국어 지원**
- [ ] 언어 선택 드롭다운 작동
- [ ] UI 텍스트 번역 적용
- [ ] 언어 설정 저장

---

## 📚 참고 문서

- `docs/migration_guide.md` - Passage Edit History 상세 가이드
- `docs/graphrag_migration_guide.md` - GraphRAG 챗봇 상세 가이드
- `backend/scripts/backup_db.bat` - 백업 스크립트
- `backend/scripts/restore_db.bat` - 복구 스크립트

---

## 🎯 추천 구현 전략

### 옵션 A: 순차적 구현 (안전, 권장) ✅

**접근 방식**: Phase 단위로 순차 진행
```
Phase 1 (Week 1-3) → 안정화 1주
Phase 2 (Week 4-6) → 안정화 1주
Phase 3 (Week 7-12) → 최종 테스트
```

**장점**:
- ✅ 각 기능 안정화 후 다음 진행
- ✅ 문제 격리 및 해결 용이
- ✅ 회사 데이터 안전성 최우선
- ✅ 사용자 피드백 반영 가능
- ✅ 학습 곡선 완만

**단점**:
- ⏱️ 전체 완료까지 시간 소요 (14주)

---

### 옵션 B: 병렬 구현 (빠름)

**접근 방식**: 독립적인 Feature는 동시 진행
```
Week 1-2: F1 + F3 + F4 병렬
Week 3: F2 (GraphRAG)
Week 4-5: F5 + F6 + F7 병렬
```

**장점**:
- ⚡ 빠른 완료 (8-10주)
- 🚀 병렬 개발로 효율 증대

**단점**:
- ⚠️ 문제 발생 시 원인 파악 어려움
- ⚠️ DB 마이그레이션 충돌 가능성
- ⚠️ 통합 테스트 복잡

---

### 옵션 C: 최소 기능 우선 (MVP)

**접근 방식**: Tier 1만 먼저 구현
```
Week 1-6: Feature 1, 3, 6, 5, 4만
나머지는 사용자 피드백 후 결정
```

**장점**:
- 🎯 핵심 가치 빠른 검증
- 💰 리소스 효율적
- 📊 데이터 기반 우선순위 재조정

**단점**:
- 🔄 나중에 추가 개발 필요

---

### 최종 권장: 옵션 A (순차적)

**이유**:
1. **데이터 안전**: 회사 환경에서 기존 가이드 데이터 보호 최우선
2. **학습**: 각 Feature를 충분히 이해하고 익힐 시간
3. **안정성**: 문제 발생 시 빠른 롤백 및 해결
4. **품질**: 각 단계별 충분한 테스트

**진행 방식**:
- 각 Feature 완료 후 1주일 안정화 기간
- 사용자 피드백 수집 및 버그 수정
- 다음 Feature 시작 전 완전한 검증

---

**마지막 업데이트**: 2026-01-31
**다음 단계**: Feature 1 백업부터 시작

**총 예상 소요 시간**:
- Phase 1 (핵심 3개): 5~7시간
- Phase 2 (기본 4개): 4.5시간
- Phase 3 (고급 10개): 19.5시간
- **전체 합계**: 약 29~31시간 (17개 Feature)

**완성 목표**: 12주 (약 3개월)
