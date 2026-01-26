import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryStore } from '../../stores/storyStore';
import { useAuthStore } from '../../stores/authStore';
import { Header } from '../../components/layout/Header';
import { LeftSidebar } from '../../components/layout/LeftSidebar';
import { RightSidebar } from '../../components/layout/RightSidebar';
import { Minimap } from '../../components/minimap';
import { PassageView, PassageNav } from '../../components/passage';

export const PassagePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentPassage, currentStory, fetchBookmarks, isLoading } = useStoryStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!currentStory || !currentPassage) {
      navigate('/');
      return;
    }

    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [currentStory, currentPassage, isAuthenticated]);

  if (!currentPassage || !currentStory) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-16 pb-[72px] flex">
        <LeftSidebar />

        <main className="flex-1 flex flex-col min-w-0">
          <Minimap />

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
    </div>
  );
};
