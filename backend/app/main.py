from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.database import init_db
from app.routers import auth, stories, passages, feedback, bookmarks, admin
from app.config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

# CORS
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

# Routers
app.include_router(auth.router)
app.include_router(stories.router)
app.include_router(passages.router)
app.include_router(feedback.router)
app.include_router(bookmarks.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "AI Literacy Workflow Guide API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
