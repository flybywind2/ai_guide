from sqlalchemy import Column, String, Integer, ForeignKey
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

class VisitLog(Base):
    __tablename__ = "visit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    story_id = Column(String(36), ForeignKey("stories.id", ondelete="CASCADE"), nullable=True)
    passage_id = Column(String(36), ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
    previous_passage_id = Column(String(36), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(String(26), default=now_iso)

class Image(Base):
    __tablename__ = "images"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=True)
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String(26), default=now_iso)
