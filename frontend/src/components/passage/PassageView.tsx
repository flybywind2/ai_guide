import React, { useCallback, useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Pencil, GitFork, ChevronRight, Play, Flag, FileText, Sparkles } from 'lucide-react';
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

// Passage type badge configuration
const PASSAGE_TYPE_CONFIG = {
  start: {
    bg: 'bg-gradient-to-r from-emerald-400 to-green-500',
    text: 'text-white',
    icon: Play,
    label: 'Start',
  },
  end: {
    bg: 'bg-gradient-to-r from-rose-400 to-red-500',
    text: 'text-white',
    icon: Flag,
    label: 'End',
  },
  branch: {
    bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    text: 'text-white',
    icon: GitFork,
    label: 'Branch',
  },
  content: {
    bg: 'bg-gradient-to-r from-violet-400 to-purple-500',
    text: 'text-white',
    icon: FileText,
    label: 'Content',
  },
};

interface PassageViewProps {
  context: PassageWithContext;
}

// Store key for session storage
const TWINE_STATE_KEY = 'twine_story_state';

export const PassageView: React.FC<PassageViewProps> = ({ context }) => {
  const { passage, available_links } = context;
  const { bookmarks, addBookmark, removeBookmark, navigateToPassage, navigateViaLink, currentStory, refreshCurrentPassage, storyStructure } =
    useStoryStore();
  const { isAuthenticated } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [passageContent, setPassageContent] = useState(passage.content);

  // Parse branch data from content
  const { content: cleanContent, branchData } = parseBranchData(passage.content || '');
  const branchChoices = branchData?.choices || [];

  // Get links sorted by link_order for matching with branch choices
  const sortedLinks = [...available_links]
    .filter(l => l.condition_type !== 'user_selection')
    .sort((a, b) => a.link_order - b.link_order);

  // Check if user can edit (anyone can edit now, no auth required)
  const canEdit = true;

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

  // Get passage type config
  const typeConfig = PASSAGE_TYPE_CONFIG[passage.passage_type as keyof typeof PASSAGE_TYPE_CONFIG] || PASSAGE_TYPE_CONFIG.content;
  const TypeIcon = typeConfig.icon;

  return (
    <article className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl mx-auto transition-all duration-300 hover:shadow-xl">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

        <div className="p-8 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Type badge with icon */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${typeConfig.bg} ${typeConfig.text}`}>
                  <TypeIcon className="w-3.5 h-3.5" />
                  {typeConfig.label}
                </span>
              </div>

              {/* Title with better typography */}
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                {passage.name}
              </h1>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {canEdit && !isEditing && passage.passage_type !== 'branch' && passage.passage_type !== 'start' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="group p-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 transition-all duration-200 hover:scale-105"
                  title="Edit passage"
                >
                  <Pencil className="w-5 h-5 transition-transform group-hover:rotate-12" />
                </button>
              )}
              {canEdit && (passage.passage_type === 'branch' || passage.passage_type === 'start') && (
                <div className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    에디터에서 편집
                  </span>
                </div>
              )}
              {isAuthenticated && (
                <button
                  onClick={handleBookmark}
                  className={`group p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isBookmarked
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-violet-500'
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
                  ) : (
                    <Bookmark className="w-5 h-5 transition-transform group-hover:scale-110" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content area with padding */}
      <div className="px-8 pb-8">

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
        <div className="mt-10 pt-8 border-t border-gray-100">
          {/* Branch header with animated decoration */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200 to-amber-400" />
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 blur-lg opacity-30 animate-pulse" />
              <div className="relative flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full shadow-sm">
                <GitFork className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-amber-700 uppercase tracking-wider">
                  Choose Your Path
                </span>
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-200 to-amber-400" />
          </div>

          {/* Branch choices with enhanced styling */}
          <div className="space-y-4">
            {branchChoices.map((choice, index) => {
              const matchingLink = sortedLinks[index];
              const handleClick = () => {
                if (matchingLink) {
                  navigateViaLink(matchingLink.id);
                }
              };

              // Different gradient colors for each choice
              const gradients = [
                'from-violet-500 to-purple-600',
                'from-blue-500 to-indigo-600',
                'from-emerald-500 to-teal-600',
                'from-amber-500 to-orange-600',
                'from-rose-500 to-pink-600',
              ];
              const gradientClass = gradients[index % gradients.length];

              return (
                <button
                  key={index}
                  onClick={handleClick}
                  disabled={!matchingLink}
                  className={`w-full group relative overflow-hidden rounded-2xl text-left transition-all duration-300 ${
                    matchingLink
                      ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Background with gradient border effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className={`relative m-[2px] rounded-[14px] p-5 transition-colors duration-300 ${
                    matchingLink ? 'bg-white group-hover:bg-gray-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-5">
                      {/* Choice number badge with gradient */}
                      <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-transform duration-300 group-hover:scale-110 ${
                        matchingLink
                          ? `bg-gradient-to-br ${gradientClass} text-white shadow-lg`
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <span className="relative z-10">{index + 1}</span>
                        {matchingLink && (
                          <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        )}
                      </div>

                      {/* Choice content */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-lg mb-1 transition-colors duration-200 ${
                          matchingLink
                            ? 'text-gray-800 group-hover:text-gray-900'
                            : 'text-gray-400'
                        }`}>
                          {choice.button || `Option ${index + 1}`}
                        </h4>
                        {choice.description && (
                          <p className={`text-sm line-clamp-2 ${
                            matchingLink ? 'text-gray-500 group-hover:text-gray-600' : 'text-gray-400'
                          }`}>
                            {choice.description}
                          </p>
                        )}
                      </div>

                      {/* Arrow icon with animation */}
                      <div className={`flex-shrink-0 p-2 rounded-full transition-all duration-300 ${
                        matchingLink
                          ? `bg-gradient-to-r ${gradientClass} text-white shadow-md opacity-50 group-hover:opacity-100 group-hover:translate-x-1`
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Not connected warning */}
                    {!matchingLink && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                        <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-500">!</span>
                        Not connected to a passage
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fallback if no branch data but has links */}
          {branchChoices.length === 0 && sortedLinks.length > 0 && (
            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl text-white shadow-md">
                <GitFork className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">Decision Point</p>
                <p className="text-sm text-amber-600">Choose your path below to continue</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback for branch/start passages without branch data */}
      {(passage.passage_type === 'branch' || passage.passage_type === 'start') && branchChoices.length === 0 && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl text-white shadow-md">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Decision Point</p>
              <p className="text-sm text-amber-600">Choose your path below to continue</p>
            </div>
          </div>
        </div>
      )}

      {/* Show inline links if available (not for branch/start passages - they use the nav bar) */}
      {links.length > 0 && passage.passage_type !== 'branch' && passage.passage_type !== 'start' && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Continue to:</h3>
          <div className="flex flex-wrap gap-3">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={() => handleNavigate(link)}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 rounded-xl hover:from-violet-100 hover:to-purple-100 transition-all duration-200 text-sm font-medium border border-violet-200 hover:border-violet-300 hover:shadow-md hover:scale-105"
              >
                <span className="relative z-10">{link}</span>
                <ChevronRight className="inline-block w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags with improved styling */}
      {passage.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {passage.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Debug: Show current state (can be removed in production) */}
      {Object.keys(twineState.variables).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <details className="text-sm text-gray-500 group">
            <summary className="cursor-pointer hover:text-gray-700 font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                {Object.keys(twineState.variables).length}
              </span>
              Story Variables
            </summary>
            <pre className="mt-3 p-4 bg-gray-50 rounded-xl text-xs overflow-auto font-mono border border-gray-100">
              {JSON.stringify(twineState.variables, null, 2)}
            </pre>
          </details>
        </div>
      )}
      </div>
    </article>
  );
};
