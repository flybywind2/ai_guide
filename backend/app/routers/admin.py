from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime
import json
import uuid
import os
import aiofiles
from app.database import get_db
from app.models.story import Story
from app.models.passage import Passage
from app.models.link import Link
from app.models.user import User
from app.models.analytics import VisitLog, Image
from app.models.feedback import Feedback
from app.schemas.story import (
    StoryCreate, StoryUpdate, StoryResponse, StoryWithPassages,
    PassageCreate, PassageUpdate, PassageResponse,
    LinkCreate, LinkUpdate, LinkResponse, StoryReorderRequest
)
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.feedback import FeedbackWithPassageInfo, FeedbackResponse
from app.core.dependencies import get_admin_user, get_super_admin
from app.config import get_settings

router = APIRouter(prefix="/api/admin", tags=["admin"])
settings = get_settings()

# ===== Story CRUD =====
@router.get("/stories", response_model=List[StoryResponse])
async def get_all_stories(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Story).order_by(Story.sort_order.asc(), Story.created_at.desc()))
    stories = result.scalars().all()

    return [
        StoryResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            start_passage_id=s.start_passage_id,
            is_active=bool(s.is_active),
            zoom=s.zoom,
            tags=json.loads(s.tags) if s.tags else [],
            sort_order=s.sort_order,
            icon=s.icon or "book-open",
            created_by=s.created_by,
            created_at=s.created_at,
            updated_at=s.updated_at
        )
        for s in stories
    ]

@router.post("/stories", response_model=StoryResponse)
async def create_story(
    story_data: StoryCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    # Get the max sort_order and add 1 for new story
    result = await db.execute(select(func.max(Story.sort_order)))
    max_order = result.scalar() or 0

    story = Story(
        name=story_data.name,
        description=story_data.description,
        is_active=1 if story_data.is_active else 0,
        zoom=story_data.zoom,
        tags=json.dumps(story_data.tags),
        sort_order=max_order + 1,
        created_by=user.id
    )
    db.add(story)
    await db.commit()
    await db.refresh(story)

    return StoryResponse(
        id=story.id,
        name=story.name,
        description=story.description,
        start_passage_id=story.start_passage_id,
        is_active=bool(story.is_active),
        zoom=story.zoom,
        tags=json.loads(story.tags) if story.tags else [],
        sort_order=story.sort_order,
        icon=story.icon or "book-open",
        created_by=story.created_by,
        created_at=story.created_at,
        updated_at=story.updated_at
    )

@router.put("/stories/reorder", response_model=List[StoryResponse])
async def reorder_stories(
    reorder_data: StoryReorderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    """Reorder stories by providing a list of story IDs in the desired order"""
    # Update sort_order for each story
    for index, story_id in enumerate(reorder_data.story_ids):
        result = await db.execute(select(Story).where(Story.id == story_id))
        story = result.scalar_one_or_none()
        if story:
            story.sort_order = index
            story.updated_at = datetime.utcnow().isoformat()

    await db.commit()

    # Return updated list
    result = await db.execute(select(Story).order_by(Story.sort_order.asc()))
    stories = result.scalars().all()

    return [
        StoryResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            start_passage_id=s.start_passage_id,
            is_active=bool(s.is_active),
            zoom=s.zoom,
            tags=json.loads(s.tags) if s.tags else [],
            sort_order=s.sort_order,
            icon=s.icon or "book-open",
            created_by=s.created_by,
            created_at=s.created_at,
            updated_at=s.updated_at
        )
        for s in stories
    ]

@router.get("/stories/{story_id}", response_model=StoryWithPassages)
async def get_story_full(
    story_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Get passages
    result = await db.execute(select(Passage).where(Passage.story_id == story_id))
    passages = result.scalars().all()

    # Get links
    result = await db.execute(select(Link).where(Link.story_id == story_id))
    links = result.scalars().all()

    return StoryWithPassages(
        id=story.id,
        name=story.name,
        description=story.description,
        start_passage_id=story.start_passage_id,
        is_active=bool(story.is_active),
        zoom=story.zoom,
        tags=json.loads(story.tags) if story.tags else [],
        sort_order=story.sort_order,
        icon=story.icon or "book-open",
        created_by=story.created_by,
        created_at=story.created_at,
        updated_at=story.updated_at,
        passages=[
            PassageResponse(
                id=p.id,
                story_id=p.story_id,
                name=p.name,
                content=p.content or "",
                passage_type=p.passage_type,
                tags=json.loads(p.tags) if p.tags else [],
                position_x=p.position_x,
                position_y=p.position_y,
                width=p.width,
                height=p.height,
                passage_number=p.passage_number,
                created_at=p.created_at,
                updated_at=p.updated_at
            )
            for p in passages
        ],
        links=[
            LinkResponse(
                id=l.id,
                story_id=l.story_id,
                source_passage_id=l.source_passage_id,
                target_passage_id=l.target_passage_id,
                name=l.name,
                condition_type=l.condition_type,
                condition_value=l.condition_value,
                link_order=l.link_order
            )
            for l in links
        ]
    )

@router.put("/stories/{story_id}", response_model=StoryResponse)
async def update_story(
    story_id: str,
    story_data: StoryUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    if story_data.name is not None:
        story.name = story_data.name
    if story_data.description is not None:
        story.description = story_data.description
    if story_data.start_passage_id is not None:
        story.start_passage_id = story_data.start_passage_id
    if story_data.is_active is not None:
        story.is_active = 1 if story_data.is_active else 0
    if story_data.zoom is not None:
        story.zoom = story_data.zoom
    if story_data.tags is not None:
        story.tags = json.dumps(story_data.tags)
    if story_data.sort_order is not None:
        story.sort_order = story_data.sort_order
    if story_data.icon is not None:
        story.icon = story_data.icon

    story.updated_at = datetime.utcnow().isoformat()
    await db.commit()
    await db.refresh(story)

    return StoryResponse(
        id=story.id,
        name=story.name,
        description=story.description,
        start_passage_id=story.start_passage_id,
        is_active=bool(story.is_active),
        zoom=story.zoom,
        tags=json.loads(story.tags) if story.tags else [],
        sort_order=story.sort_order,
        icon=story.icon or "book-open",
        created_by=story.created_by,
        created_at=story.created_at,
        updated_at=story.updated_at
    )

@router.delete("/stories/{story_id}")
async def delete_story(
    story_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    await db.delete(story)
    await db.commit()
    return {"message": "Story deleted"}

# ===== Passage CRUD =====
@router.post("/passages", response_model=PassageResponse)
async def create_passage(
    passage_data: PassageCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    # Retry logic to handle race condition in passage_number assignment
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Get next passage_number for this story
            result = await db.execute(
                select(func.max(Passage.passage_number))
                .where(Passage.story_id == passage_data.story_id)
            )
            max_number = result.scalar() or 0
            next_number = max_number + 1

            passage = Passage(
                story_id=passage_data.story_id,
                name=passage_data.name,
                content=passage_data.content,
                passage_type=passage_data.passage_type.value,
                tags=json.dumps(passage_data.tags),
                position_x=passage_data.position_x,
                position_y=passage_data.position_y,
                width=passage_data.width,
                height=passage_data.height,
                passage_number=next_number
            )
            db.add(passage)
            await db.commit()
            await db.refresh(passage)

            # Success - break out of retry loop
            break
        except IntegrityError:
            await db.rollback()
            if attempt == max_retries - 1:
                raise HTTPException(status_code=409, detail="Failed to assign passage number after retries")
            # Continue to next retry attempt

    return PassageResponse(
        id=passage.id,
        story_id=passage.story_id,
        name=passage.name,
        content=passage.content or "",
        passage_type=passage.passage_type,
        tags=json.loads(passage.tags) if passage.tags else [],
        position_x=passage.position_x,
        position_y=passage.position_y,
        width=passage.width,
        height=passage.height,
        passage_number=passage.passage_number,
        created_at=passage.created_at,
        updated_at=passage.updated_at
    )

@router.put("/passages/{passage_id}", response_model=PassageResponse)
async def update_passage(
    passage_id: str,
    passage_data: PassageUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Passage).where(Passage.id == passage_id))
    passage = result.scalar_one_or_none()
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")

    if passage_data.name is not None:
        passage.name = passage_data.name
    if passage_data.content is not None:
        passage.content = passage_data.content
    if passage_data.passage_type is not None:
        passage.passage_type = passage_data.passage_type.value
    if passage_data.tags is not None:
        passage.tags = json.dumps(passage_data.tags)
    if passage_data.position_x is not None:
        passage.position_x = passage_data.position_x
    if passage_data.position_y is not None:
        passage.position_y = passage_data.position_y
    if passage_data.width is not None:
        passage.width = passage_data.width
    if passage_data.height is not None:
        passage.height = passage_data.height

    passage.updated_at = datetime.utcnow().isoformat()
    await db.commit()
    await db.refresh(passage)

    return PassageResponse(
        id=passage.id,
        story_id=passage.story_id,
        name=passage.name,
        content=passage.content or "",
        passage_type=passage.passage_type,
        tags=json.loads(passage.tags) if passage.tags else [],
        position_x=passage.position_x,
        position_y=passage.position_y,
        width=passage.width,
        height=passage.height,
        passage_number=passage.passage_number,
        created_at=passage.created_at,
        updated_at=passage.updated_at
    )

@router.delete("/passages/{passage_id}")
async def delete_passage(
    passage_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Passage).where(Passage.id == passage_id))
    passage = result.scalar_one_or_none()
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")

    await db.delete(passage)
    await db.commit()
    return {"message": "Passage deleted"}

# ===== Link CRUD =====
@router.post("/links", response_model=LinkResponse)
async def create_link(
    link_data: LinkCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    link = Link(
        story_id=link_data.story_id,
        source_passage_id=link_data.source_passage_id,
        target_passage_id=link_data.target_passage_id,
        name=link_data.name,
        condition_type=link_data.condition_type.value,
        condition_value=link_data.condition_value,
        link_order=link_data.link_order
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return LinkResponse(
        id=link.id,
        story_id=link.story_id,
        source_passage_id=link.source_passage_id,
        target_passage_id=link.target_passage_id,
        name=link.name,
        condition_type=link.condition_type,
        condition_value=link.condition_value,
        link_order=link.link_order
    )

@router.put("/links/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: str,
    link_data: LinkUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Link).where(Link.id == link_id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if link_data.name is not None:
        link.name = link_data.name
    if link_data.condition_type is not None:
        link.condition_type = link_data.condition_type.value
    if link_data.condition_value is not None:
        link.condition_value = link_data.condition_value
    if link_data.link_order is not None:
        link.link_order = link_data.link_order

    await db.commit()
    await db.refresh(link)

    return LinkResponse(
        id=link.id,
        story_id=link.story_id,
        source_passage_id=link.source_passage_id,
        target_passage_id=link.target_passage_id,
        name=link.name,
        condition_type=link.condition_type,
        condition_value=link.condition_value,
        link_order=link.link_order
    )

@router.delete("/links/{link_id}")
async def delete_link(
    link_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    result = await db.execute(select(Link).where(Link.id == link_id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    await db.delete(link)
    await db.commit()
    return {"message": "Link deleted"}

# ===== Image Upload =====
@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    async with aiofiles.open(filepath, 'wb') as f:
        content = await file.read()
        await f.write(content)

    image = Image(
        filename=filename,
        original_name=file.filename,
        mime_type=file.content_type,
        size_bytes=len(content),
        uploaded_by=user.id
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)

    return {
        "id": image.id,
        "url": f"/uploads/{filename}",
        "filename": filename
    }

# ===== User Management =====
@router.get("/users", response_model=List[UserResponse])
async def get_users(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_super_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return users

@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.role:
        user.role = user_data.role
    if user_data.name:
        user.name = user_data.name

    user.updated_at = datetime.utcnow().isoformat()
    await db.commit()
    await db.refresh(user)

    return user

# ===== Statistics =====
@router.get("/stats/overview")
async def get_stats_overview(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    # Total users
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar()

    # Total stories
    result = await db.execute(select(func.count(Story.id)))
    total_stories = result.scalar()

    # Total passages
    result = await db.execute(select(func.count(Passage.id)))
    total_passages = result.scalar()

    # Total visits
    result = await db.execute(select(func.count(VisitLog.id)))
    total_visits = result.scalar()

    # Total feedbacks
    result = await db.execute(select(func.count(Feedback.id)))
    total_feedbacks = result.scalar()

    return {
        "total_users": total_users,
        "total_stories": total_stories,
        "total_passages": total_passages,
        "total_visits": total_visits,
        "total_feedbacks": total_feedbacks
    }

@router.get("/stats/passages")
async def get_passage_stats(
    story_id: str = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    query = select(
        VisitLog.passage_id,
        func.count(VisitLog.id).label('visit_count')
    ).group_by(VisitLog.passage_id)

    if story_id:
        query = query.where(VisitLog.story_id == story_id)

    result = await db.execute(query)
    stats = result.all()

    passage_stats = []
    for passage_id, visit_count in stats:
        result = await db.execute(select(Passage).where(Passage.id == passage_id))
        passage = result.scalar_one_or_none()
        if passage:
            passage_stats.append({
                "passage_id": passage_id,
                "passage_name": passage.name,
                "visit_count": visit_count
            })

    return passage_stats

# ===== Feedback Management =====
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

@router.get("/feedback/all", response_model=List[FeedbackWithPassageInfo])
async def get_all_feedback_admin(
    story_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    """Get all feedback across all passages (admin only)"""
    # Get top-level feedbacks only
    query = select(Feedback).where(Feedback.parent_id == None)

    if story_id:
        # Filter by story - need to join with passages
        query = query.join(Passage, Feedback.passage_id == Passage.id).where(Passage.story_id == story_id)

    query = query.order_by(Feedback.created_at.desc())
    result = await db.execute(query)
    feedbacks = result.scalars().all()

    responses = []
    for f in feedbacks:
        # Get user name
        user_name = None
        if f.user_id and not f.is_anonymous:
            result = await db.execute(select(User).where(User.id == f.user_id))
            feedback_user = result.scalar_one_or_none()
            if feedback_user:
                user_name = feedback_user.name

        # Get passage and story info
        passage_name = None
        story_id_val = None
        story_name = None
        if f.passage_id:
            result = await db.execute(select(Passage).where(Passage.id == f.passage_id))
            passage = result.scalar_one_or_none()
            if passage:
                passage_name = passage.name
                story_id_val = passage.story_id
                result = await db.execute(select(Story).where(Story.id == passage.story_id))
                story = result.scalar_one_or_none()
                if story:
                    story_name = story.name

        # Count replies
        result = await db.execute(
            select(func.count(Feedback.id)).where(Feedback.parent_id == f.id)
        )
        reply_count = result.scalar() or 0

        # Get replies
        replies_response = await build_feedback_response(f, db)

        responses.append(FeedbackWithPassageInfo(
            id=f.id,
            user_id=f.user_id if not f.is_anonymous else None,
            user_name=user_name,
            passage_id=f.passage_id,
            passage_name=passage_name,
            story_id=story_id_val,
            story_name=story_name,
            content=f.content,
            is_anonymous=bool(f.is_anonymous),
            parent_id=f.parent_id,
            created_at=f.created_at,
            updated_at=f.updated_at,
            reply_count=reply_count,
            replies=replies_response.replies
        ))

    return responses
