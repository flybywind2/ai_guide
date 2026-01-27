import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, GitFork } from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';
import { Button } from '../common';
import type { PassageWithContext } from '../../types';

interface PassageNavProps {
  context: PassageWithContext;
}

export const PassageNav: React.FC<PassageNavProps> = ({ context }) => {
  const navigate = useNavigate();
  const { goBack, navigateViaLink, navigationHistory } = useStoryStore();
  const { passage, available_links, is_end } = context;

  const canGoBack = navigationHistory.length > 1;
  const isBranch = passage.passage_type === 'branch';

  // Separate user selection links from automatic links
  const userSelectionLinks = available_links.filter(
    (link) => link.condition_type === 'user_selection'
  );
  const autoLinks = available_links.filter(
    (link) => link.condition_type !== 'user_selection'
  );
  // Sort links by link_order
  const sortedAutoLinks = [...autoLinks].sort((a, b) => a.link_order - b.link_order);
  const primaryAutoLink = sortedAutoLinks[0];

  // For branch type, show all links as choices
  const branchLinks = isBranch ? sortedAutoLinks : [];

  const handleLinkClick = async (linkId: string) => {
    await navigateViaLink(linkId);
  };

  // Branch type: Show prominent choice UI
  if (isBranch && branchLinks.length > 0) {
    return (
      <div className="bg-gradient-to-t from-amber-50 to-white border-t-2 border-amber-300 px-6 py-6 fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-4xl mx-auto">
          {/* Branch header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <GitFork className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
              Choose Your Path
            </span>
            <GitFork className="w-5 h-5 text-amber-600 scale-x-[-1]" />
          </div>

          {/* Branch choices */}
          <div className={`grid gap-3 mb-4 ${
            branchLinks.length === 2 ? 'grid-cols-2' :
            branchLinks.length === 3 ? 'grid-cols-3' :
            branchLinks.length >= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'
          }`}>
            {branchLinks.map((link, index) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="group relative p-4 bg-white border-2 border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-100 rounded-full">
                  <span className="text-xs font-bold text-amber-700">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 group-hover:text-amber-700 transition-colors">
                    {link.name || `Option ${index + 1}`}
                  </span>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between pt-3 border-t border-amber-200">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={!canGoBack}
              className="text-gray-500"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </Button>

            <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-500">
              <RotateCcw className="w-4 h-4 mr-2" />
              Change Path
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default navigation UI
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4 fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={!canGoBack}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          {is_end ? (
            <div className="text-center">
              <p className="text-gray-600 mb-2">You've reached the end of this path.</p>
              <Button variant="secondary" onClick={() => navigate('/')}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          ) : (
            <>
              {/* Show user selection links as choices */}
              {userSelectionLinks.map((link) => (
                <Button
                  key={link.id}
                  variant="secondary"
                  onClick={() => handleLinkClick(link.id)}
                >
                  {link.name || 'Choice'}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              ))}
              {/* Show only one Next button for automatic links */}
              {primaryAutoLink && (
                <Button
                  variant="primary"
                  onClick={() => handleLinkClick(primaryAutoLink.id)}
                >
                  {primaryAutoLink.name || 'Next'}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              )}
            </>
          )}
        </div>

        <Button variant="ghost" onClick={() => navigate('/')}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Change Path
        </Button>
      </div>
    </div>
  );
};
