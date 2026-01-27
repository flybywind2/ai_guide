import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, List, History } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useStoryStore } from '../../stores/storyStore';
import type { Link as LinkType } from '../../types';

interface LeftSidebarProps {
  storyLinks?: LinkType[];
}

export const LeftSidebar: React.FC<LeftSidebarProps> = () => {
  const navigate = useNavigate();
  const { leftSidebarCollapsed, toggleLeftSidebar } = useUIStore();
  const {
    bookmarks,
    currentPassage,
    navigateToPassage,
    currentStory,
    navigationHistoryWithNames,
    currentHistoryIndex,
    navigateToHistoryIndex,
    stories,
    fetchStories,
    startStory,
  } = useStoryStore();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const filteredBookmarks = bookmarks.filter(
    (b) => b.story_id === currentStory?.id
  );

  if (leftSidebarCollapsed) {
    return (
      <aside className="w-[60px] bg-white border-r border-gray-200 flex flex-col sticky top-16 h-[calc(100vh-64px)]">
        <button
          onClick={toggleLeftSidebar}
          className="p-4 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col overflow-hidden sticky top-16 h-[calc(100vh-64px)]">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <span className="font-semibold text-gray-900">내비게이션</span>
        <button
          onClick={toggleLeftSidebar}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Bookmarks */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
            <Bookmark className="w-4 h-4" />
            <span>북마크</span>
          </div>
          {filteredBookmarks.length > 0 ? (
            <ul className="space-y-1">
              {filteredBookmarks.map((bookmark) => (
                <li key={bookmark.id}>
                  <button
                    onClick={() => navigateToPassage(bookmark.passage_id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentPassage?.passage.id === bookmark.passage_id
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {bookmark.passage_name || '제목 없음'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">아직 북마크가 없습니다</p>
          )}
        </div>

        {/* Navigation History */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
            <History className="w-4 h-4" />
            <span>히스토리</span>
          </div>
          {navigationHistoryWithNames.length > 0 ? (
            <ul className="space-y-1">
              {navigationHistoryWithNames.map((entry, index) => (
                <li key={`${entry.id}-${index}`}>
                  <button
                    onClick={() => navigateToHistoryIndex(index)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      index === currentHistoryIndex
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-gray-400 mr-2">{index + 1}.</span>
                    {entry.name || '제목 없음'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">아직 히스토리가 없습니다</p>
          )}
        </div>

        {/* Stories */}
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
            <List className="w-4 h-4" />
            <span>스토리</span>
          </div>
          {stories.length > 0 ? (
            <ul className="space-y-2">
              {stories.map((story) => (
                <li key={story.id}>
                  <button
                    onClick={async () => {
                      await startStory(story.id);
                      // Navigate to /passage - PassagePage will load from currentPassage state
                      navigate('/passage');
                    }}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                      currentStory?.id === story.id
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{story.name}</div>
                    {story.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {story.description}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">사용 가능한 스토리가 없습니다</p>
          )}
        </div>
      </div>
    </aside>
  );
};
