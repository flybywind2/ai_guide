from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.database import get_db
from app.models.feedback import Feedback
from app.models.user import User
from app.models.passage import Passage
from app.models.story import Story
from app.schemas.feedback import FeedbackCreate, FeedbackResponse, FeedbackWithPassageInfo
from app.core.dependencies import get_current_user, get_current_user_required, get_admin_user

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

async def build_feedback_response(feedback: Feedback, db: AsyncSession) -> FeedbackResponse:
    user_name = None
    if feedback.user_id and not feedback.is_anonymous:
        result = await db.execute(select(User).where(User.id == feedback.user_id))
        user = result.scalar_one_or_none()
        if user:
            user_name = user.name

    # Get replies
    result = await db.execute(
        select(Feedback)
        .where(Feedback.parent_id == feedback.id)
        .order_by(Feedback.created_at)
    )
    replies_db = result.scalars().all()

    replies = []
    for reply in replies_db:
        reply_response = await build_feedback_response(reply, db)
        replies.append(reply_response)

    return FeedbackResponse(
        id=feedback.id,
        user_id=feedback.user_id if not feedback.is_anonymous else None,
        user_name=user_name,
        passage_id=feedback.passage_id,
        content=feedback.content,
        is_anonymous=bool(feedback.is_anonymous),
        parent_id=feedback.parent_id,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        replies=replies
    )

@router.get("", response_model=List[FeedbackResponse])
async def get_feedback(
    passage_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get feedback list (optionally filtered by passage)"""
    query = select(Feedback).where(Feedback.parent_id == None)

    if passage_id:
        query = query.where(Feedback.passage_id == passage_id)

    query = query.order_by(Feedback.created_at.desc())
    result = await db.execute(query)
    feedbacks = result.scalars().all()

    responses = []
    for f in feedbacks:
        response = await build_feedback_response(f, db)
        responses.append(response)

    return responses

@router.post("", response_model=FeedbackResponse)
async def create_feedback(
    feedback_data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """Create new feedback"""
    feedback = Feedback(
        user_id=user.id if user else None,
        passage_id=feedback_data.passage_id,
        content=feedback_data.content,
        is_anonymous=1 if feedback_data.is_anonymous else 0,
        parent_id=feedback_data.parent_id
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return await build_feedback_response(feedback, db)

@router.post("/{feedback_id}/reply", response_model=FeedbackResponse)
async def reply_feedback(
    feedback_id: str,
    feedback_data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_current_user)
):
    """Reply to feedback"""
    # Check parent exists
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    parent = result.scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback = Feedback(
        user_id=user.id if user else None,
        passage_id=parent.passage_id,
        content=feedback_data.content,
        is_anonymous=1 if feedback_data.is_anonymous else 0,
        parent_id=feedback_id
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)

    return await build_feedback_response(feedback, db)

@router.delete("/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Delete feedback (owner or admin only)"""
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if feedback.user_id != user.id and user.role not in ["super_admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(feedback)
    await db.commit()

    return {"message": "Feedback deleted"}
