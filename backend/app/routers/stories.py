from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.story import Story
from app.models.passage import Passage
from app.models.link import Link
from app.schemas.story import StoryResponse, PassageResponse, PassageWithContext, StoryWithPassages, LinkResponse
from app.services.story_engine import StoryEngine
import json

router = APIRouter(prefix="/api/stories", tags=["stories"])

@router.get("", response_model=List[StoryResponse])
async def get_stories(db: AsyncSession = Depends(get_db)):
    """Get all active stories"""
    result = await db.execute(
        select(Story).where(Story.is_active == 1).order_by(Story.sort_order.asc(), Story.created_at.desc())
    )
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

@router.get("/structure/{story_id}", response_model=StoryWithPassages)
async def get_story_structure(story_id: str, db: AsyncSession = Depends(get_db)):
    """Get full story structure with passages and links (public)"""
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
                content=p.content,
                passage_type=p.passage_type,
                tags=json.loads(p.tags) if p.tags else [],
                position_x=p.position_x,
                position_y=p.position_y,
                width=p.width,
                height=p.height,
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

@router.get("/{story_id}", response_model=StoryResponse)
async def get_story(story_id: str, db: AsyncSession = Depends(get_db)):
    """Get story by ID"""
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

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

@router.get("/{story_id}/start", response_model=PassageWithContext)
async def get_start_passage(story_id: str, db: AsyncSession = Depends(get_db)):
    """Get the starting passage of a story"""
    engine = StoryEngine(db)
    passage = await engine.get_start_passage(story_id)

    if not passage:
        raise HTTPException(status_code=404, detail="Start passage not found")

    context = await engine.get_passage_with_context(passage.id)
    return context


@router.get("/{story_id}/passages/by-name/{passage_name:path}", response_model=PassageWithContext)
async def get_passage_by_name(
    story_id: str,
    passage_name: str,
    previous_passage_id: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get a passage by its name within a story"""
    # Find the passage by name
    result = await db.execute(
        select(Passage).where(
            Passage.story_id == story_id,
            Passage.name == passage_name
        )
    )
    passage = result.scalar_one_or_none()

    if not passage:
        raise HTTPException(
            status_code=404,
            detail=f"Passage '{passage_name}' not found in story"
        )

    engine = StoryEngine(db)
    context = await engine.get_passage_with_context(passage.id, previous_passage_id)
    return context
