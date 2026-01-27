import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { currentPassage, currentStory, fetchBookmarks, isLoading, loadPassageById } = useStoryStore();
  const { isAuthenticated } = useAuthStore();
  const [showStoryMap, setShowStoryMap] = useState(false);

  useEffect(() => {
    // If passageId is in URL, load that passage
    if (passageId) {
      loadPassageById(passageId, false);
      return;
    }

    // Otherwise, check if we have a current passage
    if (!currentStory || !currentPassage) {
      navigate('/');
      return;
    }
  }, [passageId]);

  useEffect(() => {
    if (isAuthenticated && currentStory) {
      fetchBookmarks();
    }
  }, [isAuthenticated, currentStory]);

  // Update URL when current passage changes (for navigation via links)
  useEffect(() => {
    if (currentPassage && !passageId) {
      const currentPassageId = currentPassage.passage.id;
      navigate(`/passage/${currentPassageId}`, { replace: true });
    }
  }, [currentPassage?.passage.id]);

  if (!currentPassage || !currentStory) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-16 pb-[72px] flex">
        <LeftSidebar />

        <main className="flex-1 flex flex-col min-w-0 relative">
          <Minimap />

          {/* Story Map Button */}
          <button
            onClick={() => setShowStoryMap(true)}
            className="absolute top-4 right-4 z-20 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            title="스토리 맵 보기"
          >
            <MapIcon className="w-6 h-6" />
            <span className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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
