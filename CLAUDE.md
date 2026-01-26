# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Literacy Workflow Guide - A Twine-style interactive guide system for Samsung DS employees to learn AI utilization and development paths. Built with React frontend and FastAPI backend using SQLite3 database.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Zustand, React Router, React Flow (visual editor), TipTap (WYSIWYG), Tailwind CSS
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0+, aiosqlite, Alembic, Pydantic 2.x
- **Database**: SQLite3 (file-based at `./data/app.db`)
- **Auth**: JWT with python-jose, bcrypt password hashing

## Local Development Setup (No Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm

### Backend Setup
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

# Create data directories
mkdir data uploads

# Run database migrations
alembic upgrade head

# Start server (port 8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev
```

### Environment Variables
Create `backend/.env`:
```
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite+aiosqlite:///./data/app.db
DEBUG=true
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

### Database Migrations
```bash
cd backend
alembic upgrade head                              # Apply migrations
alembic revision --autogenerate -m "description"  # Create new migration
```

### Testing
```bash
cd backend
pytest
pytest tests/test_story_engine.py -v  # Single test file
```

### Running Both Services
Open two terminals:
- Terminal 1: Backend at http://localhost:8000
- Terminal 2: Frontend at http://localhost:5173

## Architecture

### Core Concepts (Twine-inspired)
- **Story**: Complete learning path (e.g., "AI Usage Guide", "AI Development Guide")
- **Passage**: Individual content page/node within a Story
- **Link**: Connection between Passages with conditional branching
- **Story Engine**: Navigation engine handling conditional routing based on previous Passage

### Link Condition Types
- `always`: Always navigable
- `previous_passage`: Only shown when coming from specific Passage
- `user_selection`: User choice option

### Project Structure
```
ai-literacy-guide/
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components (common, layout, passage, editor, minimap, feedback)
│   │   ├── pages/         # Route pages (auth, story, admin)
│   │   ├── hooks/         # Custom hooks (useAuth, useStory, usePassage)
│   │   ├── stores/        # Zustand stores (authStore, storyStore, uiStore)
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── ...
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI entry point
│   │   ├── models/        # SQLAlchemy models (user, story, passage, link, feedback, bookmark, analytics)
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── routers/       # API routers (auth, stories, passages, feedback, bookmarks, admin)
│   │   ├── services/      # Business logic (story_engine.py handles Twine-style navigation)
│   │   └── core/          # Security, dependencies
│   ├── alembic/           # DB migrations
│   ├── data/              # SQLite DB file
│   └── uploads/           # Uploaded files
└── ...
```

## Key API Endpoints

### User APIs
- `GET /api/stories` - Active stories list
- `GET /api/stories/{id}/start` - Get starting Passage
- `GET /api/passages/{id}` - Passage with navigation context
- `POST /api/passages/{id}/navigate` - Navigate to next Passage

### Admin APIs
- `GET/POST /api/admin/stories` - Story CRUD
- `PUT /api/admin/stories/{id}/full` - Save entire Story structure
- `POST /api/admin/passages` - Create Passage
- `POST /api/admin/links` - Create Link with conditions

## Database Notes (SQLite3)

- Write operations lock the file; recommended for <100 concurrent users
- Boolean stored as INTEGER (0/1)
- JSON stored as TEXT (use json.loads/dumps in Python)
- No ON UPDATE for timestamps; handle in application
- Backup: `cp data/app.db data/app.db.backup`

## Design System

- **Primary color**: Purple (#7C3AED)
- **Font**: Pretendard (Korean), system fonts fallback
- **Light mode only**
- Layout: Header (64px) + Minimap (120px) + Left Sidebar (280px) + Content (max 800px) + Right Sidebar (320px) + Footer Nav (72px)
