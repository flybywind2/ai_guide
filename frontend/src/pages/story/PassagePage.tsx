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
import { Map as MapIcon, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <Header />

      <div className="pt-16 flex min-h-screen">
        <LeftSidebar />

        <main className="flex-1 flex flex-col min-w-0 relative pb-[88px]">
          <Minimap />

          {/* Story Map Button - Enhanced */}
          <button
            onClick={() => setShowStoryMap(true)}
            className="absolute top-4 right-4 z-20 group"
            title="스토리 맵 보기"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300" />

            {/* Button */}
            <div className="relative w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110 group-active:scale-95">
              <MapIcon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            </div>

            {/* Tooltip */}
            <span className="absolute top-full mt-3 right-0 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg pointer-events-none transform translate-y-1 group-hover:translate-y-0">
              스토리 맵
              <span className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
            </span>
          </button>

          <div className="flex-1 p-8 overflow-y-auto">
            {isLoading ? (
              // Enhanced loading state
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                {/* Animated loader */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
                  <div className="relative w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-gray-600 font-medium">Loading passage...</p>
                  <p className="text-gray-400 text-sm">Please wait a moment</p>
                </div>
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
