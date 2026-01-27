import React, { useCallback, useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Pencil, GitFork } from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';
import { useAuthStore } from '../../stores/authStore';
import { TwinePassageRenderer } from '../reader/TwinePassageRenderer';
import { InlinePassageEditor } from '../editor/InlinePassageEditor';
import {
  createInitialState,
  TwineState,
  extractLinksFromContent,
} from '../../utils/twine-runtime';
import type { PassageWithContext } from '../../types';

interface PassageViewProps {
  context: PassageWithContext;
}

// Store key for session storage
const TWINE_STATE_KEY = 'twine_story_state';

export const PassageView: React.FC<PassageViewProps> = ({ context }) => {
  const { passage } = context;
  const { bookmarks, addBookmark, removeBookmark, navigateToPassage, currentStory, refreshCurrentPassage } =
    useStoryStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [passageContent, setPassageContent] = useState(passage.content);

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
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${
              passage.passage_type === 'start'
                ? 'bg-green-100 text-green-700'
                : passage.passage_type === 'end'
                ? 'bg-red-100 text-red-700'
                : passage.passage_type === 'branch'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-primary-100 text-primary-700'
            }`}
          >
            {passage.passage_type}
          </span>
          <h1 className="text-3xl font-bold text-gray-900">{passage.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
              title="Edit passage"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={handleBookmark}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-6 h-6 text-primary-600" />
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
          content={passageContent || ''}
          state={twineState}
          onStateChange={handleStateChange}
          onNavigate={handleNavigate}
        />
      )}

      {/* Show branch indicator for branch passages */}
      {passage.passage_type === 'branch' && (
        <div className="mt-6 pt-6 border-t border-amber-200">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className="p-2 bg-amber-100 rounded-full">
              <GitFork className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">Decision Point</p>
              <p className="text-sm text-amber-600">Choose your path below to continue</p>
            </div>
          </div>
        </div>
      )}

      {/* Show inline links if available (not for branch passages - they use the nav bar) */}
      {links.length > 0 && passage.passage_type !== 'branch' && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Continue to:</h3>
          <div className="flex flex-wrap gap-2">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={() => handleNavigate(link)}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      )}

      {passage.tags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {passage.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
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
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              Story Variables ({Object.keys(twineState.variables).length})
            </summary>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
              {JSON.stringify(twineState.variables, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </article>
  );
};
