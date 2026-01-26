from sqlalchemy import Column, String, Text, Integer, ForeignKey
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    passage_id = Column(String(36), ForeignKey("passages.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Integer, default=0)
    parent_id = Column(String(36), ForeignKey("feedback.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(String(26), default=now_iso)
    updated_at = Column(String(26), default=now_iso, onupdate=now_iso)
