import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStoryStore } from '../../stores/storyStore';
import { useAuthStore } from '../../stores/authStore';
import { Header } from '../../components/layout/Header';
import { LeftSidebar } from '../../components/layout/LeftSidebar';
import { RightSidebar } from '../../components/layout/RightSidebar';
import { Minimap } from '../../components/minimap';
import { PassageView, PassageNav } from '../../components/passage';
import { StoryMapModal } from '../../components/passage/StoryMapModal';
import { Map as MapIcon } from 'lucide-react';

export const PassagePage: React.FC = () => {
  const navigate = useNavigate();
  const { passageId } = useParams<{ passageId?: string }>();
  const [searchParams] = useSearchParams();
  const { currentPassage, currentStory, fetchBookmarks, isLoading, loadPassageById, loadPassageByNumber } = useStoryStore();
  const { isAuthenticated } = useAuthStore();
  const [showStoryMap, setShowStoryMap] = useState(false);

  useEffect(() => {
    // Check if passage_number query param exists
    const passageNumberParam = searchParams.get('number');
    const storyIdParam = searchParams.get('story');

    if (passageNumberParam && storyIdParam) {
      // Load passage by number
      loadPassageByNumber(parseInt(passageNumberParam, 10), storyIdParam);
      return;
    }

    // If passageId is in URL path, load that passage
    if (passageId) {
      loadPassageById(passageId, false);
      return;
    }

    // Otherwise, check if we have a current passage
    if (!currentStory || !currentPassage) {
      navigate('/');
      return;
    }
  }, [passageId, searchParams]);

  useEffect(() => {
    if (isAuthenticated && currentStory) {
      fetchBookmarks();
    }
  }, [isAuthenticated, currentStory]);

  // Update URL when current passage changes (for navigation via links)
  useEffect(() => {
    if (currentPassage && currentStory) {
      const passage = currentPassage.passage;

      // Always use passage_number format if available (migrate from UUID URLs)
      if (passage.passage_number) {
        const newUrl = `/passage?number=${passage.passage_number}&story=${currentStory.id}`;
        const currentUrl = `${window.location.pathname}${window.location.search}`;

        // Only update if URL is different (avoid infinite loops)
        if (currentUrl !== newUrl) {
          console.log('Updating URL to:', newUrl, 'from:', currentUrl);
          navigate(newUrl, { replace: true });
        }
      } else {
        // Fallback to ID-based URL if passage_number not available
        const expectedUrl = `/passage/${passage.id}`;
        if (window.location.pathname !== expectedUrl && !searchParams.get('number')) {
          console.log('Using ID-based URL:', expectedUrl);
          navigate(expectedUrl, { replace: true });
        }
      }
    }
  }, [currentPassage?.passage.id, currentPassage?.passage.passage_number, currentStory?.id, navigate, searchParams]);

  if (!currentPassage || !currentStory) {
    return null;
  }

  return (
    <div className="min-h-screen main-layout-bg">
      <Header />

      <div className="pt-16 flex min-h-screen">
        <LeftSidebar />

        <main className="flex-1 flex flex-col min-w-0 relative pb-[72px]">
          <Minimap />

          {/* Story Map Button */}
          <button
            onClick={() => setShowStoryMap(true)}
            className="absolute top-4 right-4 z-20 w-14 h-14 bg-gradient-to-br from-[#A2EDB4] to-[#3EB35C] text-white rounded-full shadow-[0_0_15px_rgba(162,237,180,0.5)] hover:shadow-[0_0_25px_rgba(162,237,180,0.8)] hover:scale-110 transition-all duration-300 flex items-center justify-center group border-2 border-white/50"
            title="스토리 맵 보기"
          >
            <MapIcon className="w-7 h-7 drop-shadow-md" />
            <span className="absolute top-full mt-2 right-0 bg-gray-900/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0 whitespace-nowrap shadow-xl">
              스토리 맵
            </span>
          </button>

          <div className="flex-1 p-8 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
              </div>
            ) : (
              <PassageView context={currentPassage} />
            )}
          </div>
        </main>

        <RightSidebar />
      </div>

      <PassageNav context={currentPassage} />

      {/* Story Map Modal */}
      {currentStory && currentPassage && (
        <StoryMapModal
          isOpen={showStoryMap}
          onClose={() => setShowStoryMap(false)}
          storyId={currentStory.id}
          currentPassageId={currentPassage.passage.id}
        />
      )}
    </div>
  );
};
