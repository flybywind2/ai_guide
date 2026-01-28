import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
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

  const handleLinkClick = async (linkId: string) => {
    await navigateViaLink(linkId);
  };

  const handleChangePath = () => {
    // Clear last visit to prevent "Continue where you left off?" modal
    localStorage.removeItem('last_visit');
    navigate('/');
  };

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
          {(passage.passage_type === 'branch' || passage.passage_type === 'start') ? (
            // For branch/start passages, only show end message if applicable
            is_end && (
              <div className="text-center">
                <p className="text-gray-600 mb-2">You've reached the end of this path.</p>
                <Button variant="secondary" onClick={handleChangePath}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>
            )
          ) : (
            // For non-branch/start passages, show normal navigation options
            <>
              {is_end ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-2">You've reached the end of this path.</p>
                  <Button variant="secondary" onClick={handleChangePath}>
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
                  {/* Show all automatic links with priority */}
                  {sortedAutoLinks.map((link, index) => {
                    const hasPriority = sortedAutoLinks.length > 1;
                    const priorityLabel = hasPriority ? `${index + 1}. ` : '';
                    const buttonText = link.name
                      ? `${priorityLabel}${link.name}`
                      : (hasPriority ? `${index + 1}. Next` : 'Next');

                    return (
                      <Button
                        key={link.id}
                        variant={index === 0 ? 'primary' : 'secondary'}
                        onClick={() => handleLinkClick(link.id)}
                        className={hasPriority ? 'relative' : ''}
                      >
                        {buttonText}
                        <ChevronRight className="w-5 h-5 ml-1" />
                      </Button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        <Button variant="ghost" onClick={handleChangePath}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Change Path
        </Button>
      </div>
    </div>
  );
};
