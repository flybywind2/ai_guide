from sqlalchemy import Column, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

class Passage(Base):
    __tablename__ = "passages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    story_id = Column(String(36), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    content = Column(Text, default="")
    passage_type = Column(String(20), default="content")  # start, content, branch, end
    tags = Column(Text, default="[]")
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    width = Column(Float, default=200)
    height = Column(Float, default=100)
    created_at = Column(String(26), default=now_iso)
    updated_at = Column(String(26), default=now_iso, onupdate=now_iso)

    story = relationship("Story", back_populates="passages")
