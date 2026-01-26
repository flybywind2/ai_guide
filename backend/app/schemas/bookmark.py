from pydantic import BaseModel
from typing import Optional

class BookmarkResponse(BaseModel):
    id: str
    user_id: str
    passage_id: str
    passage_name: Optional[str] = None
    story_id: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
