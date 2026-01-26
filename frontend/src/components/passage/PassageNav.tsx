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
  const { available_links, is_end } = context;

  const canGoBack = navigationHistory.length > 1;

  const handleLinkClick = async (linkId: string) => {
    await navigateViaLink(linkId);
  };

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
            available_links.map((link) => (
              <Button
                key={link.id}
                variant={link.condition_type === 'user_selection' ? 'secondary' : 'primary'}
                onClick={() => handleLinkClick(link.id)}
              >
                {link.name || 'Next'}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ))
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
