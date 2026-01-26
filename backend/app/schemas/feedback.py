from pydantic import BaseModel
from typing import Optional, List

class FeedbackCreate(BaseModel):
    passage_id: Optional[str] = None
    content: str
    is_anonymous: bool = False
    parent_id: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    user_id: Optional[str]
    user_name: Optional[str] = None
    passage_id: Optional[str]
    content: str
    is_anonymous: bool
    parent_id: Optional[str]
    created_at: str
    updated_at: str
    replies: List["FeedbackResponse"] = []

    class Config:
        from_attributes = True

FeedbackResponse.model_rebuild()
