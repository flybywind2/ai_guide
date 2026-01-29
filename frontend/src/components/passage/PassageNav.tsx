import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, Home, Sparkles, ArrowRight } from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';
import type { PassageWithContext } from '../../types';

interface PassageNavProps {
  context: PassageWithContext;
}

export const PassageNav: React.FC<PassageNavProps> = ({ context }) => {
  const navigate = useNavigate();
  const { goBack, navigateViaLink, navigationHistory } = useStoryStore();
  const { passage, available_links, is_end } = context;

  const canGoBack = navigationHistory.length > 1;

  // Separate user selection links from automatic links
  const userSelectionLinks = available_links.filter(
    (link) => link.condition_type === 'user_selection'
  );
  const autoLinks = available_links.filter(
    (link) => link.condition_type !== 'user_selection'
  );
  // Sort links by link_order
  const sortedAutoLinks = [...autoLinks].sort((a, b) => a.link_order - b.link_order);

  const handleLinkClick = async (linkId: string) => {
    await navigateViaLink(linkId);
  };

  const handleChangePath = () => {
    // Clear last visit to prevent "Continue where you left off?" modal
    localStorage.removeItem('last_visit');
    navigate('/');
  };

  // Enhanced navigation UI
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* Gradient blur backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/80 backdrop-blur-sm" />

      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />

      <div className="relative px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Previous button */}
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              canGoBack
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-200 ${canGoBack ? 'group-hover:-translate-x-0.5' : ''}`} />
            <span>Previous</span>
          </button>

          {/* Center navigation area */}
          <div className="flex items-center gap-3">
            {(passage.passage_type === 'branch' || passage.passage_type === 'start') ? (
              // For branch/start passages, only show end message if applicable
              is_end && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Journey Complete</span>
                  </div>
                  <button
                    onClick={handleChangePath}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-180 duration-500" />
                    Start Over
                  </button>
                </div>
              )
            ) : (
              // For non-branch/start passages, show normal navigation options
              <>
                {is_end ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Journey Complete</span>
                    </div>
                    <button
                      onClick={handleChangePath}
                      className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                      <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-180 duration-500" />
                      Start Over
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Show user selection links as choice buttons */}
                    {userSelectionLinks.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => handleLinkClick(link.id)}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all duration-200 active:scale-95"
                      >
                        <span>{link.name || 'Choice'}</span>
                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                    {/* Show all automatic links with priority */}
                    {sortedAutoLinks.map((link, index) => {
                      const hasPriority = sortedAutoLinks.length > 1;
                      const priorityLabel = hasPriority ? `${index + 1}. ` : '';
                      const buttonText = link.name
                        ? `${priorityLabel}${link.name}`
                        : (hasPriority ? `${index + 1}. Next` : 'Next');

                      const isPrimary = index === 0;

                      return (
                        <button
                          key={link.id}
                          onClick={() => handleLinkClick(link.id)}
                          className={`group relative flex items-center gap-2 px-6 py-2.5 font-medium rounded-xl transition-all duration-200 active:scale-95 ${
                            isPrimary
                              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700'
                          }`}
                        >
                          {/* Subtle glow effect for primary button */}
                          {isPrimary && (
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                          )}
                          <span className="relative z-10">{buttonText}</span>
                          <ArrowRight className={`relative z-10 w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5 ${isPrimary ? '' : ''}`} />
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>

          {/* Change path / Home button */}
          <button
            onClick={handleChangePath}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 active:scale-95"
          >
            <Home className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            <span>Change Path</span>
          </button>
        </div>

        {/* Navigation history indicator */}
        {navigationHistory.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-3">
            <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100">
              {navigationHistory.slice(-5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === navigationHistory.slice(-5).length - 1
                      ? 'bg-violet-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
              {navigationHistory.length > 5 && (
                <span className="text-xs text-gray-400 ml-1">+{navigationHistory.length - 5}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
