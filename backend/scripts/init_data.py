"""Initialize sample data for the AI 활용 가이드"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session_maker, init_db
from app.models.user import User
from app.models.story import Story
from app.models.passage import Passage
from app.models.link import Link
from app.core.security import get_password_hash
import json

async def create_sample_data():
    await init_db()

    async with async_session_maker() as db:
        # Check if data already exists
        from sqlalchemy import select
        result = await db.execute(select(User))
        if result.scalar_one_or_none():
            print("Data already exists. Skipping initialization.")
            return

        # Create admin user
        admin = User(
            email="admin@example.com",
            password=get_password_hash("admin123"),
            name="Admin",
            role="super_admin"
        )
        db.add(admin)
        await db.flush()

        # Create sample user
        user = User(
            email="user@example.com",
            password=get_password_hash("user123"),
            name="Test User",
            role="user"
        )
        db.add(user)

        # Create Story 1: AI Usage Guide
        story1 = Story(
            name="AI 서비스 활용 가이드",
            description="사내 AI 서비스를 활용하는 방법을 안내합니다.",
            is_active=1,
            tags=json.dumps(["AI", "활용", "입문"]),
            created_by=admin.id
        )
        db.add(story1)
        await db.flush()

        # Create passages for Story 1
        p1_start = Passage(
            story_id=story1.id,
            passage_number=1,
            name="시작",
            content="""
<h2>AI 서비스 활용 가이드에 오신 것을 환영합니다!</h2>
<p>이 가이드는 사내 AI 서비스를 효과적으로 활용하는 방법을 안내합니다.</p>
<p>어떤 것을 배우고 싶으신가요?</p>
""",
            passage_type="start",
            position_x=250,
            position_y=50
        )
        db.add(p1_start)
        await db.flush()

        p1_service = Passage(
            story_id=story1.id,
            passage_number=2,
            name="사내 AI 서비스 소개",
            content="""
<h2>사내 AI 서비스 소개</h2>
<p>현재 사용 가능한 AI 서비스들을 소개합니다:</p>
<ul>
<li><strong>AI Assistant</strong> - 문서 작성, 요약, 번역 지원</li>
<li><strong>AI Code Helper</strong> - 코드 리뷰, 디버깅 지원</li>
<li><strong>AI Data Analyzer</strong> - 데이터 분석 및 시각화</li>
</ul>
<p>각 서비스에 대해 더 자세히 알아보시겠습니까?</p>
""",
            passage_type="content",
            position_x=100,
            position_y=200
        )
        db.add(p1_service)

        p1_setup = Passage(
            story_id=story1.id,
            passage_number=3,
            name="환경 구축 가이드",
            content="""
<h2>환경 구축 가이드</h2>
<p>AI 서비스를 사용하기 위한 환경 설정 방법입니다:</p>
<ol>
<li>사내 포털에서 AI 서비스 신청</li>
<li>승인 후 접근 권한 확인</li>
<li>API 키 발급 (필요시)</li>
<li>개발 환경 설정</li>
</ol>
<p>자세한 설정 방법은 다음 페이지에서 확인하세요.</p>
""",
            passage_type="content",
            position_x=400,
            position_y=200
        )
        db.add(p1_setup)

        p1_end = Passage(
            story_id=story1.id,
            passage_number=4,
            name="가이드 완료",
            content="""
<h2>축하합니다!</h2>
<p>AI 서비스 활용 가이드를 완료하셨습니다.</p>
<p>이제 사내 AI 서비스를 활용하여 업무 효율을 높여보세요!</p>
<p>추가 질문이 있으시면 우측 피드백 게시판을 이용해 주세요.</p>
""",
            passage_type="end",
            position_x=250,
            position_y=400
        )
        db.add(p1_end)
        await db.flush()

        # Update start passage
        story1.start_passage_id = p1_start.id

        # Create links for Story 1
        link1 = Link(
            story_id=story1.id,
            source_passage_id=p1_start.id,
            target_passage_id=p1_service.id,
            name="사내 AI 서비스 알아보기",
            condition_type="user_selection",
            link_order=0
        )
        db.add(link1)

        link2 = Link(
            story_id=story1.id,
            source_passage_id=p1_start.id,
            target_passage_id=p1_setup.id,
            name="환경 구축하기",
            condition_type="user_selection",
            link_order=1
        )
        db.add(link2)

        link3 = Link(
            story_id=story1.id,
            source_passage_id=p1_service.id,
            target_passage_id=p1_end.id,
            name="다음",
            condition_type="always",
            link_order=0
        )
        db.add(link3)

        link4 = Link(
            story_id=story1.id,
            source_passage_id=p1_setup.id,
            target_passage_id=p1_end.id,
            name="다음",
            condition_type="always",
            link_order=0
        )
        db.add(link4)

        # Create Story 2: AI Development Guide
        story2 = Story(
            name="AI 개발 가이드",
            description="AI 과제를 직접 개발하는 방법을 안내합니다.",
            is_active=1,
            tags=json.dumps(["AI", "개발", "ML", "DL"]),
            created_by=admin.id
        )
        db.add(story2)
        await db.flush()

        # Create passages for Story 2
        p2_start = Passage(
            story_id=story2.id,
            passage_number=1,
            name="시작",
            content="""
<h2>AI 개발 가이드에 오신 것을 환영합니다!</h2>
<p>이 가이드는 AI 과제를 직접 개발하는 방법을 안내합니다.</p>
<p>먼저, 어떤 종류의 AI 개발에 관심이 있으신가요?</p>
""",
            passage_type="start",
            position_x=250,
            position_y=50
        )
        db.add(p2_start)
        await db.flush()

        p2_resource = Passage(
            story_id=story2.id,
            passage_number=2,
            name="자원 신청 가이드",
            content="""
<h2>AI 개발 자원 신청</h2>
<p>AI 개발을 위해 필요한 자원 신청 방법입니다:</p>
<ul>
<li><strong>GPU 서버</strong> - NVIDIA A100, V100 등</li>
<li><strong>스토리지</strong> - 대용량 데이터 저장소</li>
<li><strong>개발 환경</strong> - JupyterHub, MLflow 등</li>
</ul>
<p>신청 절차:</p>
<ol>
<li>사내 AI 포털 접속</li>
<li>자원 신청 메뉴 선택</li>
<li>필요 자원 및 기간 입력</li>
<li>승인 대기 (평균 2-3일)</li>
</ol>
""",
            passage_type="content",
            position_x=100,
            position_y=200
        )
        db.add(p2_resource)

        p2_ml = Passage(
            story_id=story2.id,
            passage_number=3,
            name="ML/DL 개발 가이드",
            content="""
<h2>ML/DL 모델 개발 가이드</h2>
<p>머신러닝/딥러닝 모델 개발 프로세스:</p>
<ol>
<li><strong>문제 정의</strong> - 해결하고자 하는 문제 명확화</li>
<li><strong>데이터 수집</strong> - 학습 데이터 확보</li>
<li><strong>데이터 전처리</strong> - 정제, 변환, 증강</li>
<li><strong>모델 설계</strong> - 아키텍처 선택</li>
<li><strong>학습 및 평가</strong> - 훈련, 검증, 테스트</li>
<li><strong>배포</strong> - 서비스화</li>
</ol>
<p>각 단계에 대한 상세 가이드는 다음 페이지에서 확인하세요.</p>
""",
            passage_type="content",
            position_x=400,
            position_y=200
        )
        db.add(p2_ml)

        p2_end = Passage(
            story_id=story2.id,
            passage_number=4,
            name="가이드 완료",
            content="""
<h2>축하합니다!</h2>
<p>AI 개발 가이드를 완료하셨습니다.</p>
<p>이제 본격적으로 AI 개발을 시작해 보세요!</p>
<p>도움이 필요하시면 AI CoE 팀에 문의해 주세요.</p>
""",
            passage_type="end",
            position_x=250,
            position_y=400
        )
        db.add(p2_end)
        await db.flush()

        # Update start passage
        story2.start_passage_id = p2_start.id

        # Create links for Story 2
        link5 = Link(
            story_id=story2.id,
            source_passage_id=p2_start.id,
            target_passage_id=p2_resource.id,
            name="자원 신청하기",
            condition_type="user_selection",
            link_order=0
        )
        db.add(link5)

        link6 = Link(
            story_id=story2.id,
            source_passage_id=p2_start.id,
            target_passage_id=p2_ml.id,
            name="ML/DL 개발 시작",
            condition_type="user_selection",
            link_order=1
        )
        db.add(link6)

        link7 = Link(
            story_id=story2.id,
            source_passage_id=p2_resource.id,
            target_passage_id=p2_ml.id,
            name="다음: ML/DL 개발",
            condition_type="always",
            link_order=0
        )
        db.add(link7)

        link8 = Link(
            story_id=story2.id,
            source_passage_id=p2_ml.id,
            target_passage_id=p2_end.id,
            name="완료",
            condition_type="always",
            link_order=0
        )
        db.add(link8)

        await db.commit()
        print("Sample data created successfully!")
        print("\nTest accounts:")
        print("  Admin: admin@example.com / admin123")
        print("  User:  user@example.com / user123")

if __name__ == "__main__":
    asyncio.run(create_sample_data())
