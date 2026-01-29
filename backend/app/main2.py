# cd frontend
# npm run build




# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from pathlib import Path

from app.database import init_db
from app.routers import auth, stories, passages, feedback, bookmarks, admin, admin_csv
from app.config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

# CORS (통합 시에는 필요 없지만, 개발 편의상 유지)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API Routers - 각 라우터가 이미 /api prefix를 포함하고 있음
app.include_router(auth.router)
app.include_router(stories.router)
app.include_router(passages.router)
app.include_router(feedback.router)
app.include_router(bookmarks.router)
app.include_router(admin.router)
app.include_router(admin_csv.router)

# Health check
@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Frontend static files (React 빌드 결과물)
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    # React 정적 파일 서빙
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")
    
    # SPA fallback: 모든 나머지 경로는 index.html로
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API 경로는 여기서 처리하지 않음 (이미 위에서 처리됨)
        if full_path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")

        # 정적 파일이 존재하면 반환
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        # 그 외 모든 경로는 React Router가 처리하도록 index.html 반환
        return FileResponse(FRONTEND_DIR / "index.html")

# cd backend
# uvicorn app.main:app --host 0.0.0.0 --port 8080
