from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import json
from app.database import get_db
from app.models.passage import Passage
from app.models.story import Story
from app.models.analytics import VisitLog
from app.schemas.story import PassageWithContext, NavigationRequest, PassageResponse, PassageUpdate
from app.services.story_engine import StoryEngine
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/passages", tags=["passages"])

@router.get("/resolve", response_model=PassageResponse)
async def resolve_passage_reference(
    story_id: str = Query(...),
    reference: str = Query(..., description="Passage name or #XXXXXX ID format"),
    db: AsyncSession = Depends(get_db)
):
    """Resolve a passage reference to its full data."""
    # Check if story exists and is active
    story_result = await db.execute(
        select(Story).where(Story.id == story_id, Story.is_active == True)
    )
    if not story_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Story not found")

    # Check if reference is in #XXXXXX format
    if reference.startswith('#'):
        try:
            passage_number = int(reference[1:])
            # Validate bounds (1 to 999999)
            if passage_number <= 0 or passage_number > 999999:
                raise HTTPException(status_code=400, detail="Invalid passage number")
            result = await db.execute(
                select(Passage).where(
                    Passage.story_id == story_id,
                    Passage.passage_number == passage_number
                )
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid passage number format")
    else:
        # Query by passage name
        result = await db.execute(
            select(Passage).where(
                Passage.story_id == story_id,
                Passage.name == reference
            )
        )

    passage = result.scalar_one_or_none()

    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")

    return PassageResponse(
        id=passage.id,
        story_id=passage.story_id,
        passage_number=passage.passage_number,
        name=passage.name,
        content=passage.content or "",
        passage_type=passage.passage_type,
        tags=json.loads(passage.tags) if passage.tags else [],
        position_x=passage.position_x,
        position_y=passage.position_y,
        width=passage.width,
        height=passage.height,
        created_at=passage.created_at,
        updated_at=passage.updated_at
    )

@router.get("/{passage_id}", response_model=PassageWithContext)
async def get_passage(
    passage_id: str,
    previous_passage_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """Get passage with navigation context"""
    engine = StoryEngine(db)
    context = await engine.get_passage_with_context(passage_id, previous_passage_id)

    if not context:
        raise HTTPException(status_code=404, detail="Passage not found")

    # Log visit
    result = await db.execute(select(Passage).where(Passage.id == passage_id))
    passage = result.scalar_one_or_none()

    if passage:
        visit_log = VisitLog(
            user_id=user.id if user else None,
            story_id=passage.story_id,
            passage_id=passage_id,
            previous_passage_id=previous_passage_id
        )
        db.add(visit_log)
        await db.commit()

    return context

@router.post("/{passage_id}/navigate", response_model=PassageWithContext)
async def navigate(
    passage_id: str,
    nav_request: NavigationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Navigate to next passage via link"""
    engine = StoryEngine(db)
    next_passage = await engine.navigate(passage_id, nav_request.link_id)

    if not next_passage:
        raise HTTPException(status_code=404, detail="Invalid navigation")

    context = await engine.get_passage_with_context(
        next_passage.id,
        passage_id  # Current passage becomes previous
    )

    return context

@router.put("/{passage_id}", response_model=PassageResponse)
async def update_passage(
    passage_id: str,
    passage_data: PassageUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update passage content (WARNING: No authentication required)"""
    result = await db.execute(
        select(Passage).where(Passage.id == passage_id)
    )
    passage = result.scalar_one_or_none()

    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")

    # Update fields
    if passage_data.name is not None:
        passage.name = passage_data.name
    if passage_data.content is not None:
        passage.content = passage_data.content
    if passage_data.passage_type is not None:
        passage.passage_type = passage_data.passage_type
    if passage_data.tags is not None:
        passage.tags = json.dumps(passage_data.tags, ensure_ascii=False)
    if passage_data.position_x is not None:
        passage.position_x = passage_data.position_x
    if passage_data.position_y is not None:
        passage.position_y = passage_data.position_y
    if passage_data.width is not None:
        passage.width = passage_data.width
    if passage_data.height is not None:
        passage.height = passage_data.height

    await db.commit()
    await db.refresh(passage)

    return PassageResponse(
        id=passage.id,
        story_id=passage.story_id,
        passage_number=passage.passage_number,
        name=passage.name,
        content=passage.content or "",
        passage_type=passage.passage_type,
        tags=json.loads(passage.tags) if passage.tags else [],
        position_x=passage.position_x,
        position_y=passage.position_y,
        width=passage.width,
        height=passage.height,
        created_at=passage.created_at,
        updated_at=passage.updated_at
    )
