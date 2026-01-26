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
    sort_order = Column(Integer, default=0)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(String(26), default=now_iso)
    updated_at = Column(String(26), default=now_iso, onupdate=now_iso)

    passages = relationship("Passage", back_populates="story", cascade="all, delete-orphan")
    links = relationship("Link", back_populates="story", cascade="all, delete-orphan")
