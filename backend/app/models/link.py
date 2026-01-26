from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Link(Base):
    __tablename__ = "links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    story_id = Column(String(36), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    source_passage_id = Column(String(36), ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
    target_passage_id = Column(String(36), ForeignKey("passages.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=True)
    condition_type = Column(String(20), default="always")  # always, previous_passage, user_selection
    condition_value = Column(String(36), nullable=True)
    link_order = Column(Integer, default=0)

    story = relationship("Story", back_populates="links")
    source_passage = relationship("Passage", foreign_keys=[source_passage_id])
    target_passage = relationship("Passage", foreign_keys=[target_passage_id])
