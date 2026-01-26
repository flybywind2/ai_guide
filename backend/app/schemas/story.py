from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class PassageType(str, Enum):
    START = "start"
    CONTENT = "content"
    BRANCH = "branch"
    END = "end"

class LinkConditionType(str, Enum):
    ALWAYS = "always"
    PREVIOUS_PASSAGE = "previous_passage"
    USER_SELECTION = "user_selection"

# ===== Passage =====
class PassageBase(BaseModel):
    name: str
    content: Optional[str] = ""
    passage_type: PassageType = PassageType.CONTENT
    tags: List[str] = []
    position_x: float = 0
    position_y: float = 0
    width: float = 200
    height: float = 100

class PassageCreate(PassageBase):
    story_id: str

class PassageUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    passage_type: Optional[PassageType] = None
    tags: Optional[List[str]] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

class PassageResponse(PassageBase):
    id: str
    story_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

# ===== Link =====
class LinkBase(BaseModel):
    name: Optional[str] = None
    condition_type: LinkConditionType = LinkConditionType.ALWAYS
    condition_value: Optional[str] = None
    link_order: int = 0

class LinkCreate(LinkBase):
    story_id: str
    source_passage_id: str
    target_passage_id: str

class LinkUpdate(BaseModel):
    name: Optional[str] = None
    condition_type: Optional[LinkConditionType] = None
    condition_value: Optional[str] = None
    link_order: Optional[int] = None

class LinkResponse(LinkBase):
    id: str
    story_id: str
    source_passage_id: str
    target_passage_id: str

    class Config:
        from_attributes = True

# ===== Story =====
class StoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    zoom: float = 1.0
    tags: List[str] = []
    sort_order: int = 0

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_passage_id: Optional[str] = None
    is_active: Optional[bool] = None
    zoom: Optional[float] = None
    tags: Optional[List[str]] = None
    sort_order: Optional[int] = None

class StoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    start_passage_id: Optional[str]
    is_active: bool
    zoom: float
    tags: List[str]
    sort_order: int
    created_by: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class StoryReorderRequest(BaseModel):
    story_ids: List[str]  # List of story IDs in the new order

class StoryWithPassages(StoryResponse):
    passages: List[PassageResponse] = []
    links: List[LinkResponse] = []

# ===== Navigation Context =====
class PassageWithContext(BaseModel):
    passage: PassageResponse
    available_links: List[LinkResponse]
    previous_passage_id: Optional[str]
    is_end: bool

class NavigationRequest(BaseModel):
    link_id: str
    previous_passage_id: Optional[str] = None
