from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.story import Story
from app.models.passage import Passage
from app.models.link import Link
from app.schemas.story import LinkConditionType, PassageResponse, LinkResponse, PassageWithContext
import json

class StoryEngine:
    """
    Twine-style Story navigation engine
    - Handles conditional branching
    - Dynamic routing based on previous Passage
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_start_passage(self, story_id: str) -> Optional[Passage]:
        """Get the starting Passage of a Story"""
        result = await self.db.execute(
            select(Story).where(Story.id == story_id)
        )
        story = result.scalar_one_or_none()

        if story and story.start_passage_id:
            result = await self.db.execute(
                select(Passage).where(Passage.id == story.start_passage_id)
            )
            return result.scalar_one_or_none()

        result = await self.db.execute(
            select(Passage).where(
                Passage.story_id == story_id,
                Passage.passage_type == "start"
            )
        )
        return result.scalar_one_or_none()

    async def get_available_links(
        self,
        passage_id: str,
        previous_passage_id: Optional[str] = None
    ) -> List[Link]:
        """Get available links from current Passage (after condition evaluation)"""
        result = await self.db.execute(
            select(Link)
            .where(Link.source_passage_id == passage_id)
            .order_by(Link.link_order)
        )
        all_links = result.scalars().all()

        valid_links = []
        for link in all_links:
            if self._evaluate_condition(link, previous_passage_id):
                valid_links.append(link)

        return valid_links

    def _evaluate_condition(
        self,
        link: Link,
        previous_passage_id: Optional[str]
    ) -> bool:
        """Evaluate Link condition"""
        if link.condition_type == LinkConditionType.ALWAYS.value:
            return True

        if link.condition_type == LinkConditionType.PREVIOUS_PASSAGE.value:
            return previous_passage_id == link.condition_value

        if link.condition_type == LinkConditionType.USER_SELECTION.value:
            return True  # User selection is always shown

        return False

    async def get_passage_with_context(
        self,
        passage_id: str,
        previous_passage_id: Optional[str] = None
    ) -> Optional[PassageWithContext]:
        """Get Passage with navigation context"""
        result = await self.db.execute(
            select(Passage).where(Passage.id == passage_id)
        )
        passage = result.scalar_one_or_none()

        if not passage:
            return None

        available_links = await self.get_available_links(
            passage_id,
            previous_passage_id
        )

        is_end = (
            passage.passage_type == "end" or
            len(available_links) == 0
        )

        # Convert to response models
        passage_response = PassageResponse(
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

        link_responses = [
            LinkResponse(
                id=link.id,
                story_id=link.story_id,
                source_passage_id=link.source_passage_id,
                target_passage_id=link.target_passage_id,
                name=link.name,
                condition_type=link.condition_type,
                condition_value=link.condition_value,
                link_order=link.link_order
            )
            for link in available_links
        ]

        return PassageWithContext(
            passage=passage_response,
            available_links=link_responses,
            previous_passage_id=previous_passage_id,
            is_end=is_end
        )

    async def navigate(
        self,
        current_passage_id: str,
        link_id: str
    ) -> Optional[Passage]:
        """Navigate to next Passage via Link"""
        result = await self.db.execute(
            select(Link).where(
                Link.id == link_id,
                Link.source_passage_id == current_passage_id
            )
        )
        link = result.scalar_one_or_none()

        if not link:
            return None

        result = await self.db.execute(
            select(Passage).where(Passage.id == link.target_passage_id)
        )
        return result.scalar_one_or_none()
