# Passage 히스토리 기능 마이그레이션 가이드

> **중요**: 이 가이드는 회사 환경의 데이터를 안전하게 보호하면서 히스토리 기능을 추가하는 방법을 설명합니다.

## 목차
1. [개요](#개요)
2. [사전 준비](#사전 준비)
3. [Step 1: 백업 (필수)](#step-1-백업-필수)
4. [Step 2: 로컬 테스트](#step-2-로컬-테스트)
5. [Step 3: 회사 환경 적용](#step-3-회사-환경-적용)
6. [문제 발생 시 복구](#문제-발생-시-복구)
7. [FAQ](#faq)

---

## 개요

### 추가되는 기능
- ✨ Passage 편집 히스토리 자동 저장
- ⏮️ 이전 버전으로 되돌리기
- 📊 누가 언제 무엇을 편집했는지 추적

### 변경 사항
- **새 테이블 추가**: `passage_revisions` (히스토리 저장용)
- **기존 테이블**: `passages` 테이블은 **절대 변경 안 함**
- **데이터 손실**: **0%** (기존 데이터 그대로 유지)

### 안전성 보장
- ✅ 기존 passages 테이블 읽기만
- ✅ 새 테이블만 생성
- ✅ 롤백 가능
- ✅ 트랜잭션 보호

---

## 사전 준비

### 필요한 도구
- [ ] 백업 저장용 USB 또는 외장 하드
- [ ] 개인 PC (로컬 테스트용)
- [ ] 최소 10GB 여유 공간

### 예상 소요 시간
- 백업: 5분
- 로컬 테스트: 30분
- 회사 적용: 10분
- **총 소요 시간: 약 45분**

---

## Step 1: 백업 (필수)

### 1.1 회사 컴퓨터에서 DB 백업

```bash
# 백업 디렉토리 생성
cd D:\Python\ai_guide\backend
mkdir backups

# 현재 DB 백업 (날짜 포함)
# Windows PowerShell
$date = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item data\app.db -Destination backups\app_backup_$date.db

# 또는 Git Bash / WSL
cp data/app.db backups/app_backup_$(date +%Y%m%d_%H%M%S).db
```

### 1.2 백업 검증

```bash
# 백업 파일 존재 확인
dir backups

# 예상 출력:
# app_backup_20260131_143000.db  (파일 크기: 수 MB~수백 MB)
```

### 1.3 백업 복사 (안전을 위해)

```bash
# 1. USB에 추가 백업
copy backups\app_backup_*.db E:\backups\

# 2. 네트워크 드라이브에도 백업 (선택사항)
copy backups\app_backup_*.db \\server\backups\

# 3. 로컬 PC로 가져오기 (테스트용)
# USB 또는 네트워크로 복사
```

**✅ 체크포인트 1**: 백업 파일이 2곳 이상에 있는지 확인

---

## Step 2: 로컬 테스트

### 2.1 개인 PC에 환경 구성

```bash
# 1. 프로젝트 디렉토리로 이동
cd D:\Python\ai_guide\backend

# 2. 회사 DB 복사본 배치
copy E:\backups\app_backup_20260131_143000.db data\app_test.db

# 3. 가상환경 활성화
venv\Scripts\activate

# 4. 의존성 확인
pip list | findstr alembic
# alembic 버전이 표시되어야 함
```

### 2.2 마이그레이션 파일 생성

```bash
# 1. 마이그레이션 생성
alembic revision --autogenerate -m "Add passage revision history"

# 예상 출력:
# Generating D:\Python\ai_guide\backend\alembic\versions\xxxx_add_passage_revision_history.py ... done
```

### 2.3 마이그레이션 검토

생성된 파일을 열어서 확인:
```python
# alembic/versions/xxxx_add_passage_revision_history.py

def upgrade():
    # 새 테이블 생성만 있어야 함
    op.create_table('passage_revisions',
        # ...
    )
    # passages 테이블 변경이 없어야 함!

def downgrade():
    # 새 테이블 삭제만 있어야 함
    op.drop_table('passage_revisions')
```

**⚠️ 주의**: `alter_table('passages', ...)` 같은 코드가 있으면 **절대 실행하지 마세요!**

### 2.4 테스트 DB에 적용

```bash
# 1. 테스트 DB로 환경 변수 설정 (.env 파일 수정)
# DATABASE_URL=sqlite+aiosqlite:///./data/app_test.db

# 또는 임시로:
set DATABASE_URL=sqlite+aiosqlite:///./data/app_test.db

# 2. 마이그레이션 실행
alembic upgrade head

# 예상 출력:
# INFO  [alembic.runtime.migration] Running upgrade ... -> xxxx, Add passage revision history
```

### 2.5 데이터 무결성 검증

```bash
# SQLite 직접 확인
sqlite3 data/app_test.db

# 다음 쿼리 실행:
-- 1. Passages 개수 확인 (변경 전과 동일해야 함)
SELECT COUNT(*) FROM passages;

-- 2. Passages 내용 샘플 확인
SELECT id, name, LENGTH(content) as content_length FROM passages LIMIT 5;

-- 3. 새 테이블 생성 확인
SELECT COUNT(*) FROM passage_revisions;
-- 0 (새 테이블이라 비어있음)

-- 4. 종료
.exit
```

### 2.6 서버 실행 테스트

```bash
# 1. 서버 시작
uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload

# 2. 브라우저에서 확인
# http://localhost:8080

# 3. 테스트 항목:
- [ ] 로그인 가능
- [ ] Story 목록 표시
- [ ] Passage 열람 가능
- [ ] Passage 편집 가능 (Viewer 계정)
- [ ] 편집 후 저장 성공
- [ ] 에러 없이 작동

# 4. 서버 중지: Ctrl+C
```

### 2.7 히스토리 저장 확인

```bash
sqlite3 data/app_test.db

-- 편집 후 히스토리 확인
SELECT * FROM passage_revisions;

-- 결과: 편집한 내용의 이전 버전이 저장되어 있어야 함
.exit
```

**✅ 체크포인트 2**: 모든 기능이 정상 작동하고 히스토리가 저장되는지 확인

---

## Step 3: 회사 환경 적용

### 3.1 최종 백업 (다시 한번!)

```bash
# 회사 컴퓨터에서
cd D:\Python\ai_guide\backend

# 최종 백업 생성
$date = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item data\app.db -Destination backups\app_FINAL_BACKUP_$date.db

# USB에도 복사
copy backups\app_FINAL_BACKUP_*.db E:\
```

### 3.2 서버 중지

```bash
# main2.py로 실행 중인 서버 중지
# Ctrl+C 또는 작업 관리자에서 Python 프로세스 종료
```

### 3.3 코드 업데이트

```bash
# Git에서 최신 코드 가져오기
cd D:\Python\ai_guide
git pull origin main

# 또는 USB로 복사한 경우:
# - frontend/dist 폴더 교체
# - backend/app 폴더 교체
# - backend/alembic/versions 폴더 교체
```

### 3.4 마이그레이션 적용

```bash
cd backend

# 1. 가상환경 활성화
venv\Scripts\activate

# 2. 현재 마이그레이션 상태 확인
alembic current
# 출력: xxxx (현재 버전)

# 3. 마이그레이션 실행
alembic upgrade head

# 예상 출력:
# INFO  [alembic.runtime.migration] Running upgrade xxxx -> yyyy, Add passage revision history

# 4. 적용 확인
alembic current
# 출력: yyyy (새 버전)
```

### 3.5 데이터 검증

```bash
sqlite3 data/app.db

-- 1. Passages 개수 확인 (변경 전과 동일)
SELECT COUNT(*) FROM passages;

-- 2. 샘플 데이터 확인
SELECT id, name FROM passages LIMIT 3;

-- 3. 새 테이블 확인
.schema passage_revisions

-- 4. 종료
.exit
```

### 3.6 서버 재시작

```bash
# 서버 시작
uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload

# 또는 백그라운드 실행:
# start /B uvicorn app.main2:app --host 0.0.0.0 --port 8080
```

### 3.7 실제 환경 테스트

```
1. 브라우저: http://localhost:8080
2. 로그인
3. Passage 열람 확인
4. Passage 편집 → 저장 확인
5. 다른 사용자 계정으로 테스트
```

**✅ 체크포인트 3**: 회사 환경에서 정상 작동 확인

---

## 문제 발생 시 복구

### 시나리오 1: 마이그레이션 실패

```bash
# 1. 서버 중지
# Ctrl+C

# 2. DB 복구
cd backend
copy backups\app_FINAL_BACKUP_20260131_143000.db data\app.db
# "덮어쓰시겠습니까?" → y

# 3. 마이그레이션 롤백 (선택)
alembic downgrade -1

# 4. 서버 재시작
uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload
```

**복구 시간: 1분**

### 시나리오 2: 서버 실행 에러

```bash
# 1. 에러 로그 확인
# 콘솔 출력 또는 logs/ 폴더 확인

# 2. DB 복구
copy backups\app_FINAL_BACKUP_*.db data\app.db

# 3. 코드 되돌리기 (Git)
git reset --hard HEAD~1

# 4. 재시작
uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload
```

### 시나리오 3: 데이터 이상

```bash
# 1. 즉시 서버 중지
# Ctrl+C

# 2. 현재 DB 별도 보관 (분석용)
copy data\app.db data\app_error_$(date +%Y%m%d).db

# 3. 백업으로 복구
copy backups\app_FINAL_BACKUP_*.db data\app.db

# 4. 확인 후 재시작
sqlite3 data/app.db "SELECT COUNT(*) FROM passages;"
uvicorn app.main2:app --host 0.0.0.0 --port 8080 --reload
```

### 긴급 연락

문제 해결이 안 되면:
1. 서버 중지 유지
2. 백업 DB로 복구
3. 에러 메시지 캡처
4. 개발자에게 연락

---

## FAQ

### Q1. 마이그레이션 중 데이터가 손실될 수 있나요?
**A**: 아니요. 새 테이블만 추가하고 기존 데이터는 절대 변경하지 않습니다.

### Q2. 롤백이 가능한가요?
**A**: 네. `alembic downgrade -1` 명령으로 언제든 되돌릴 수 있습니다.

### Q3. 백업은 몇 개나 보관해야 하나요?
**A**: 최소 3개 (로컬 + USB + 네트워크) 권장합니다.

### Q4. 마이그레이션이 실패하면 어떻게 되나요?
**A**: 자동으로 롤백되어 원래 상태로 돌아갑니다. 수동 복구도 1분이면 가능합니다.

### Q5. 테스트 환경 없이 바로 적용해도 되나요?
**A**: 권장하지 않습니다. 로컬 테스트를 꼭 거치세요.

### Q6. 히스토리는 얼마나 보관되나요?
**A**: 기본적으로 모든 히스토리를 보관합니다. 나중에 정리 정책을 설정할 수 있습니다.

### Q7. 성능에 영향이 있나요?
**A**: 편집 시 약간의 시간 추가 (0.1초 미만). 읽기는 영향 없습니다.

---

## 체크리스트

### 사전 준비
- [ ] 백업 디렉토리 생성
- [ ] 개인 PC 환경 구성
- [ ] USB/외장하드 준비

### 백업
- [ ] 회사 DB 백업 완료
- [ ] USB에 백업 복사
- [ ] 백업 파일 크기 확인
- [ ] 로컬 PC로 복사

### 로컬 테스트
- [ ] 테스트 DB 배치
- [ ] 마이그레이션 파일 생성
- [ ] 마이그레이션 내용 검토
- [ ] 테스트 DB에 적용
- [ ] 데이터 무결성 검증
- [ ] 서버 실행 테스트
- [ ] 편집 기능 테스트
- [ ] 히스토리 저장 확인

### 회사 적용
- [ ] 최종 백업 생성
- [ ] 서버 중지
- [ ] 코드 업데이트
- [ ] 마이그레이션 적용
- [ ] 데이터 검증
- [ ] 서버 재시작
- [ ] 실제 환경 테스트

### 완료
- [ ] 모든 기능 정상 작동
- [ ] 백업 파일 보관 확인
- [ ] 팀원들에게 공지

---

## 다음 단계

마이그레이션 완료 후:

1. **히스토리 UI 추가**
   - 편집 이력 조회 화면
   - 되돌리기 버튼
   - Diff 뷰어 (변경사항 비교)

2. **자동 백업 설정**
   - 일일 백업 스크립트
   - 주간 백업 정책

3. **사용자 교육**
   - Viewer 편집 가이드
   - 히스토리 기능 사용법

---

**마지막 확인**: 문제가 생기면 언제든 백업으로 복구할 수 있습니다. 천천히 단계별로 진행하세요!
