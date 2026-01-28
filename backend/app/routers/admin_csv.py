"""CSV Export/Import endpoints for Passages and Links"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import csv
import io
import json

from app.database import get_db
from app.models.story import Story
from app.models.passage import Passage
from app.models.link import Link
from app.models.user import User
from app.core.dependencies import get_admin_user

router = APIRouter()


@router.get("/stories/{story_id}/export/passages")
async def export_passages_csv(
    story_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    """Export passages to CSV"""
    # Verify story exists
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Get all passages
    result = await db.execute(
        select(Passage)
        .where(Passage.story_id == story_id)
        .order_by(Passage.passage_number)
    )
    passages = result.scalars().all()

    # Create CSV in memory with UTF-8 BOM for Excel compatibility
    output = io.StringIO()
    # Write UTF-8 BOM
    output.write('\ufeff')
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        'id', 'story_id', 'passage_number', 'name', 'content',
        'passage_type', 'tags', 'position_x', 'position_y',
        'width', 'height'
    ])

    # Write data
    for passage in passages:
        writer.writerow([
            passage.id,
            passage.story_id,
            passage.passage_number or '',
            passage.name,
            passage.content or '',
            passage.passage_type,
            passage.tags or '[]',
            passage.position_x,
            passage.position_y,
            passage.width,
            passage.height
        ])

    # Prepare response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=passages_{story_id}.csv"
        }
    )


@router.get("/stories/{story_id}/export/links")
async def export_links_csv(
    story_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    """Export links to CSV"""
    # Verify story exists
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Get all links
    result = await db.execute(
        select(Link)
        .where(Link.story_id == story_id)
        .order_by(Link.source_passage_id, Link.link_order)
    )
    links = result.scalars().all()

    # Create CSV in memory with UTF-8 BOM for Excel compatibility
    output = io.StringIO()
    # Write UTF-8 BOM
    output.write('\ufeff')
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        'id', 'story_id', 'source_passage_id', 'target_passage_id',
        'name', 'condition_type', 'condition_value', 'link_order'
    ])

    # Write data
    for link in links:
        writer.writerow([
            link.id,
            link.story_id,
            link.source_passage_id,
            link.target_passage_id,
            link.name or '',
            link.condition_type,
            link.condition_value or '',
            link.link_order
        ])

    # Prepare response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=links_{story_id}.csv"
        }
    )


@router.post("/stories/{story_id}/import/passages")
async def import_passages_csv(
    story_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    """Import passages from CSV"""
    # Verify story exists
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Read CSV file
    content = await file.read()
    csv_text = content.decode('utf-8-sig')  # Handle BOM
    csv_file = io.StringIO(csv_text)
    reader = csv.DictReader(csv_file)

    imported_count = 0
    updated_count = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
        try:
            passage_id = row.get('id', '').strip()
            passage_number_str = row.get('passage_number', '').strip()

            # Convert passage_number to int or None
            passage_number = None
            if passage_number_str:
                try:
                    passage_number = int(passage_number_str)
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid passage_number '{passage_number_str}'")
                    continue

            # Check if passage exists
            result = await db.execute(
                select(Passage).where(Passage.id == passage_id)
            )
            existing_passage = result.scalar_one_or_none()

            # Parse tags
            tags_str = row.get('tags', '[]').strip()
            try:
                tags = json.loads(tags_str) if tags_str else []
            except json.JSONDecodeError:
                tags = []

            if existing_passage:
                # Update existing passage
                existing_passage.story_id = story_id
                existing_passage.passage_number = passage_number
                existing_passage.name = row['name']
                existing_passage.content = row.get('content', '')
                existing_passage.passage_type = row['passage_type']
                existing_passage.tags = json.dumps(tags)
                existing_passage.position_x = float(row.get('position_x', 0))
                existing_passage.position_y = float(row.get('position_y', 0))
                existing_passage.width = float(row.get('width', 200))
                existing_passage.height = float(row.get('height', 100))
                updated_count += 1
            else:
                # Create new passage
                new_passage = Passage(
                    id=passage_id,
                    story_id=story_id,
                    passage_number=passage_number,
                    name=row['name'],
                    content=row.get('content', ''),
                    passage_type=row['passage_type'],
                    tags=json.dumps(tags),
                    position_x=float(row.get('position_x', 0)),
                    position_y=float(row.get('position_y', 0)),
                    width=float(row.get('width', 200)),
                    height=float(row.get('height', 100))
                )
                db.add(new_passage)
                imported_count += 1

        except KeyError as e:
            errors.append(f"Row {row_num}: Missing required field {str(e)}")
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    await db.commit()

    return {
        "imported": imported_count,
        "updated": updated_count,
        "errors": errors
    }


@router.post("/stories/{story_id}/import/links")
async def import_links_csv(
    story_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin_user)
):
    """Import links from CSV"""
    # Verify story exists
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Read CSV file
    content = await file.read()
    csv_text = content.decode('utf-8-sig')  # Handle BOM
    csv_file = io.StringIO(csv_text)
    reader = csv.DictReader(csv_file)

    imported_count = 0
    updated_count = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            link_id = row.get('id', '').strip()

            # Check if link exists
            result = await db.execute(
                select(Link).where(Link.id == link_id)
            )
            existing_link = result.scalar_one_or_none()

            link_order = int(row.get('link_order', 0))

            if existing_link:
                # Update existing link
                existing_link.story_id = story_id
                existing_link.source_passage_id = row['source_passage_id']
                existing_link.target_passage_id = row['target_passage_id']
                existing_link.name = row.get('name') or None
                existing_link.condition_type = row.get('condition_type', 'always')
                existing_link.condition_value = row.get('condition_value') or None
                existing_link.link_order = link_order
                updated_count += 1
            else:
                # Create new link
                new_link = Link(
                    id=link_id,
                    story_id=story_id,
                    source_passage_id=row['source_passage_id'],
                    target_passage_id=row['target_passage_id'],
                    name=row.get('name') or None,
                    condition_type=row.get('condition_type', 'always'),
                    condition_value=row.get('condition_value') or None,
                    link_order=link_order
                )
                db.add(new_link)
                imported_count += 1

        except KeyError as e:
            errors.append(f"Row {row_num}: Missing required field {str(e)}")
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    await db.commit()

    return {
        "imported": imported_count,
        "updated": updated_count,
        "errors": errors
    }
