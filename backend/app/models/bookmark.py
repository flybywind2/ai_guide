from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from app.database import Base
import uuid
from datetime import datetime

def generate_uuid():
    return str(uuid.uuid4())

def now_iso():
    return datetime.utcnow().isoformat()

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    passage_id = Column(String(36), ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(String(26), default=now_iso)

    __table_args__ = (UniqueConstraint('user_id', 'passage_id', name='uq_user_passage'),)
