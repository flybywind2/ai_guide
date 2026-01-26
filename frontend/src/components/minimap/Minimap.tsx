import React from 'react';
import { useStoryStore } from '../../stores/storyStore';

export const Minimap: React.FC = () => {
  const { navigationHistory, currentPassage, navigateToPassage } = useStoryStore();

  if (navigationHistory.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {navigationHistory.map((passageId, index) => {
            const isCurrent = currentPassage?.passage.id === passageId;
            const isLast = index === navigationHistory.length - 1;

            return (
              <React.Fragment key={`${passageId}-${index}`}>
                <button
                  onClick={() => {
                    if (!isCurrent) {
                      const prevId = index > 0 ? navigationHistory[index - 1] : undefined;
                      navigateToPassage(passageId, prevId);
                    }
                  }}
                  className={`flex-shrink-0 w-4 h-4 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-primary-600 ring-4 ring-primary-100'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Step ${index + 1}`}
                />
                {!isLast && (
                  <div className="flex-shrink-0 w-8 h-0.5 bg-gray-300" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
