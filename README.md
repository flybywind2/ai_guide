# AI 활용 가이드

Twine 스타일의 인터랙티브 AI 학습 가이드 시스템

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database with sample data
python scripts/init_data.py

# Start server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Test Accounts

- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`

## Features

- **Story-based Learning**: Twine 스타일의 분기형 학습 경로
- **Visual Editor**: React Flow 기반의 스토리 에디터
- **Feedback System**: 익명 피드백 및 댓글 기능
- **Bookmarks**: 페이지 북마크 저장
- **Continue Feature**: 마지막 읽은 위치 저장

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Zustand, React Flow, TailwindCSS
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, SQLite3
- **Auth**: JWT
