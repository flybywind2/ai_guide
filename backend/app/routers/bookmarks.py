from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.bookmark import Bookmark
from app.models.passage import Passage
from app.models.user import User
from app.schemas.bookmark import BookmarkResponse
from app.core.dependencies import get_current_user_required

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])

@router.get("", response_model=List[BookmarkResponse])
async def get_bookmarks(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get user's bookmarks"""
    result = await db.execute(
        select(Bookmark)
        .where(Bookmark.user_id == user.id)
        .order_by(Bookmark.created_at.desc())
    )
    bookmarks = result.scalars().all()

    responses = []
    for b in bookmarks:
        # Get passage info
        result = await db.execute(select(Passage).where(Passage.id == b.passage_id))
        passage = result.scalar_one_or_none()

        responses.append(BookmarkResponse(
            id=b.id,
            user_id=b.user_id,
            passage_id=b.passage_id,
            passage_name=passage.name if passage else None,
            story_id=passage.story_id if passage else None,
            created_at=b.created_at
        ))

    return responses

@router.post("/{passage_id}", response_model=BookmarkResponse)
async def add_bookmark(
    passage_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Add bookmark"""
    # Check passage exists
    result = await db.execute(select(Passage).where(Passage.id == passage_id))
    passage = result.scalar_one_or_none()
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")

    # Check if already bookmarked
    result = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == user.id,
            Bookmark.passage_id == passage_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already bookmarked")

    bookmark = Bookmark(
        user_id=user.id,
        passage_id=passage_id
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)

    return BookmarkResponse(
        id=bookmark.id,
        user_id=bookmark.user_id,
        passage_id=bookmark.passage_id,
        passage_name=passage.name,
        story_id=passage.story_id,
        created_at=bookmark.created_at
    )

@router.delete("/{passage_id}")
async def remove_bookmark(
    passage_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Remove bookmark"""
    result = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == user.id,
            Bookmark.passage_id == passage_id
        )
    )
    bookmark = result.scalar_one_or_none()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    await db.delete(bookmark)
    await db.commit()

    return {"message": "Bookmark removed"}
