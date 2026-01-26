from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db
from app.models.passage import Passage
from app.models.analytics import VisitLog
from app.schemas.story import PassageWithContext, NavigationRequest
from app.services.story_engine import StoryEngine
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/passages", tags=["passages"])

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
