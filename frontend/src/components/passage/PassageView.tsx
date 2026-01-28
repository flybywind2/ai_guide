import React, { useCallback, useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Pencil, GitFork, ChevronRight } from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';
import { useAuthStore } from '../../stores/authStore';
import { TwinePassageRenderer } from '../reader/TwinePassageRenderer';
import { InlinePassageEditor } from '../editor/InlinePassageEditor';
import {
  createInitialState,
  TwineState,
  extractLinksFromContent,
} from '../../utils/twine-runtime';
import { parseBranchData } from '../../utils/branch-utils';
import type { PassageWithContext } from '../../types';

interface PassageViewProps {
  context: PassageWithContext;
}

// Store key for session storage
const TWINE_STATE_KEY = 'twine_story_state';

export const PassageView: React.FC<PassageViewProps> = ({ context }) => {
  const { passage, available_links } = context;
  const { bookmarks, addBookmark, removeBookmark, navigateToPassage, navigateViaLink, currentStory, refreshCurrentPassage, storyStructure } =
    useStoryStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [passageContent, setPassageContent] = useState(passage.content);

  // Parse branch data from content
  const { content: cleanContent, branchData } = parseBranchData(passage.content || '');
  const branchChoices = branchData?.choices || [];

  // Get links sorted by link_order for matching with branch choices
  const sortedLinks = [...available_links]
    .filter(l => l.condition_type !== 'user_selection')
    .sort((a, b) => a.link_order - b.link_order);

  // Check if user can edit (super_admin or editor role)
  const canEdit = isAuthenticated && user && (user.role === 'super_admin' || user.role === 'editor');

  // Update content when passage changes
  useEffect(() => {
    setPassageContent(passage.content);
    setIsEditing(false);
  }, [passage.id, passage.content]);

  // Initialize state from session storage or create new
  const [twineState, setTwineState] = useState<TwineState>(() => {
    try {
      const saved = sessionStorage.getItem(`${TWINE_STATE_KEY}_${currentStory?.id}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    return createInitialState();
  });

  // Update state with current passage info
  useEffect(() => {
    setTwineState((prev) => ({
      ...prev,
      currentPassage: passage.name,
      visitedPassages: prev.visitedPassages.includes(passage.name)
        ? prev.visitedPassages
        : [...prev.visitedPassages, passage.name],
    }));
  }, [passage.name]);

  // Save state to session storage
  useEffect(() => {
    if (currentStory?.id) {
      sessionStorage.setItem(
        `${TWINE_STATE_KEY}_${currentStory.id}`,
        JSON.stringify(twineState)
      );
    }
  }, [twineState, currentStory?.id]);

  const isBookmarked = bookmarks.some((b) => b.passage_id === passage.id);

  const handleBookmark = async () => {
    if (isBookmarked) {
      await removeBookmark(passage.id);
    } else {
      await addBookmark(passage.id);
    }
  };

  const handleStateChange = useCallback((newState: TwineState) => {
    setTwineState(newState);
  }, []);

  const handleNavigate = useCallback(
    (passageName: string) => {
      navigateToPassage(passageName);
    },
    [navigateToPassage]
  );

  // Extract links for display
  const links = extractLinksFromContent(passage.content || '');

  return (
    <article className="glass-card p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${
              passage.passage_type === 'start'
                ? 'bg-secondary-green/20 text-secondary-green-dark border border-secondary-green/30'
                : passage.passage_type === 'end'
                ? 'bg-red-500/10 text-red-700'
                : passage.passage_type === 'branch'
                ? 'bg-yellow-500/10 text-yellow-700'
                : 'bg-primary-500/10 text-primary-700'
            }`}
          >
            {passage.passage_type}
          </span>
          <h1 className="text-3xl font-bold text-gray-900">{passage.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isEditing && passage.passage_type !== 'branch' && passage.passage_type !== 'start' && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg hover:bg-primary-500/10 text-primary-600 transition-colors"
              title="Edit passage"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
          {canEdit && (passage.passage_type === 'branch' || passage.passage_type === 'start') && (
            <div className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg">
              {passage.passage_type === 'branch' ? 'Branch' : 'Start'} 노드는 에디터에서만 편집 가능
            </div>
          )}
          {isAuthenticated && (
            <button
              onClick={handleBookmark}
              className="p-2 rounded-lg hover:bg-white/40 transition-colors"
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-6 h-6 text-primary-500" />
              ) : (
                <Bookmark className="w-6 h-6 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <InlinePassageEditor
          passageId={passage.id}
          initialContent={passageContent || ''}
          onSave={(newContent) => {
            setPassageContent(newContent);
            setIsEditing(false);
            // Refresh the passage data from server
            if (refreshCurrentPassage) {
              refreshCurrentPassage();
            }
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <TwinePassageRenderer
          content={(passage.passage_type === 'branch' || passage.passage_type === 'start') ? cleanContent : (passageContent || '')}
          state={twineState}
          onStateChange={handleStateChange}
          onNavigate={handleNavigate}
          passages={storyStructure?.passages || []}
        />
      )}

      {/* Show branch choices for branch and start passages */}
      {(passage.passage_type === 'branch' || passage.passage_type === 'start') && branchChoices.length > 0 && (
        <div className="mt-10 pt-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-green/5 to-transparent rounded-xl -z-10" />
          
          {/* Branch header */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-secondary-green" />
            <div className="relative">
              <div className="absolute inset-0 bg-secondary-green/30 blur-lg rounded-full animate-pulse" />
              <div className="relative flex items-center gap-3 px-6 py-3 bg-white border-2 border-secondary-green rounded-full shadow-[0_0_15px_rgba(162,237,180,0.4)]">
                <GitFork className="w-6 h-6 text-secondary-green-dark" />
                <span className="text-base font-bold bg-gradient-to-r from-secondary-green-dark to-primary-main bg-clip-text text-transparent uppercase tracking-wider">
                  운명의 갈림길
                </span>
              </div>
            </div>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-secondary-green" />
          </div>

          {/* Branch choices */}
          <div className="grid gap-4">
            {branchChoices.map((choice, index) => {
              const matchingLink = sortedLinks[index];
              const handleClick = () => {
                if (matchingLink) {
                  navigateViaLink(matchingLink.id);
                }
              };

              return (
                <button
                  key={index}
                  onClick={handleClick}
                  disabled={!matchingLink}
                  className={`w-full group relative p-6 bg-white/80 backdrop-blur-sm border-2 rounded-2xl text-left transition-all duration-300 ${
                    matchingLink
                      ? 'border-secondary-green/40 hover:border-secondary-green hover:shadow-[0_8px_30px_rgba(162,237,180,0.3)] hover:-translate-y-1 cursor-pointer'
                      : 'border-gray-200 opacity-50 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  {/* Background Gradient on Hover */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary-green/10 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                  <div className="relative flex items-center gap-5">
                    {/* Choice number badge */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transform transition-transform duration-300 group-hover:rotate-6 ${
                      matchingLink
                        ? 'bg-gradient-to-br from-[#A2EDB4] to-[#3EB35C] text-white shadow-md group-hover:shadow-lg'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Choice content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-xl mb-2 transition-colors duration-200 ${
                        matchingLink
                          ? 'text-gray-800 group-hover:text-secondary-green-dark'
                          : 'text-gray-400'
                      }`}>
                        {choice.button || `선택지 ${index + 1}`}
                      </h4>
                      {choice.description && (
                        <p className={`text-base leading-relaxed ${
                          matchingLink ? 'text-gray-600 group-hover:text-gray-800' : 'text-gray-400'
                        }`}>
                          {choice.description}
                        </p>
                      )}
                    </div>

                    {/* Arrow icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      matchingLink
                        ? 'bg-secondary-green/20 text-secondary-green-dark group-hover:bg-secondary-green group-hover:text-white group-hover:translate-x-2'
                        : 'bg-gray-100 text-gray-300'
                    }`}>
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Not connected warning */}
                  {!matchingLink && (
                    <div className="mt-3 text-xs text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      연결된 다음 이야기가 없습니다
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Fallback if no branch data but has links */}
          {branchChoices.length === 0 && sortedLinks.length > 0 && (
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-secondary-green/10 to-transparent rounded-2xl border border-secondary-green/30 mt-4">
              <div className="p-3 bg-white rounded-full shadow-sm border border-secondary-green/20">
                <GitFork className="w-6 h-6 text-secondary-green-dark" />
              </div>
              <div>
                <p className="font-bold text-lg text-secondary-green-dark mb-1">다음 이야기 선택</p>
                <p className="text-gray-600">아래 버튼을 눌러 이야기를 계속 진행하세요.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback for branch/start passages without branch data */}
      {(passage.passage_type === 'branch' || passage.passage_type === 'start') && branchChoices.length === 0 && (
        <div className="mt-6 pt-6 border-t border-secondary-green/20">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-secondary-green/5 to-secondary-green/10 rounded-xl border border-secondary-green/20">
            <div className="p-2 bg-secondary-green/20 rounded-full">
              <GitFork className="w-5 h-5 text-secondary-green-dark" />
            </div>
            <div>
              <p className="font-medium text-secondary-green-dark">Decision Point</p>
              <p className="text-sm text-gray-600">Choose your path below to continue</p>
            </div>
          </div>
        </div>
      )}

      {/* Show inline links if available (not for branch/start passages - they use the nav bar) */}
      {links.length > 0 && passage.passage_type !== 'branch' && passage.passage_type !== 'start' && (
        <div className="mt-6 pt-6 border-t border-white/30">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Continue to:</h3>
          <div className="flex flex-wrap gap-2">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={() => handleNavigate(link)}
                className="px-4 py-2 bg-primary-500/10 text-primary-700 rounded-lg hover:bg-primary-500/20 transition-colors text-sm font-medium"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      )}

      {passage.tags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/30">
          <div className="flex flex-wrap gap-2">
            {passage.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-white/40 text-gray-600 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Debug: Show current state (can be removed in production) */}
      {Object.keys(twineState.variables).length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/30">
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              Story Variables ({Object.keys(twineState.variables).length})
            </summary>
            <pre className="mt-2 p-2 bg-white/40 rounded text-xs overflow-auto">
              {JSON.stringify(twineState.variables, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </article>
  );
};
