#!/bin/bash
# DB 동기화 스크립트

echo "=== 현재 PC DB 동기화 ==="

# 1. 백업
echo "1. 백업 생성 중..."
cp data/app.db data/app.db.backup_$(date +%Y%m%d_%H%M%S)

# 2. 마이그레이션 상태 확인
echo "2. 현재 마이그레이션 상태:"
python -m alembic current

# 3. 대기 중인 마이그레이션 확인
echo "3. 대기 중인 마이그레이션:"
python -m alembic heads

# 4. 마이그레이션 실행
echo "4. 마이그레이션 실행:"
python -m alembic upgrade head

echo "=== 완료 ==="
