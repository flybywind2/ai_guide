import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GitFork, Flag, Play } from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';

export const Minimap: React.FC = () => {
  const {
    mainPath,
    currentPassage,
    navigationHistory,
    navigateToMainPathIndex,
  } = useStoryStore();

  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find current position in main path
  const currentMainPathIndex = mainPath.findIndex(
    (p) => p.id === currentPassage?.passage.id
  );

  // Check if passage was visited (in navigation history)
  const isVisited = (passageId: string) => navigationHistory.includes(passageId);

  // Check if passage is accessible (visited or next after last visited)
  const isAccessible = (index: number) => {
    if (index === 0) return true;
    // Can access if this passage or any previous passage was visited
    for (let i = index; i >= 0; i--) {
      if (isVisited(mainPath[i].id)) return true;
    }
    // Can access if the previous passage in main path was visited
    return isVisited(mainPath[index - 1]?.id);
  };

  // Scroll to current indicator
  useEffect(() => {
    if (scrollRef.current && currentMainPathIndex >= 0) {
      const container = scrollRef.current;
      const indicators = container.querySelectorAll('[data-indicator]');
      const currentIndicator = indicators[currentMainPathIndex] as HTMLElement;
      if (currentIndicator) {
        const containerRect = container.getBoundingClientRect();
        const indicatorRect = currentIndicator.getBoundingClientRect();
        const scrollLeft = indicatorRect.left - containerRect.left - containerRect.width / 2 + indicatorRect.width / 2;
        container.scrollBy({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentMainPathIndex]);

  const handleIndicatorClick = async (index: number) => {
    if (!isAccessible(index)) return;
    if (mainPath[index].id === currentPassage?.passage.id) return;
    await navigateToMainPathIndex(index);
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  if (mainPath.length === 0) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="w-3 h-3" />;
      case 'branch':
        return <GitFork className="w-3 h-3" />;
      case 'end':
        return <Flag className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto relative">
        {/* Scroll buttons */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/90 rounded-full shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white/90 rounded-full shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>

        {/* Indicators */}
        <div
          ref={scrollRef}
          className="flex items-start gap-1 overflow-x-auto scrollbar-hide px-8 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mainPath.map((entry, index) => {
            const isCurrent = entry.id === currentPassage?.passage.id;
            const visited = isVisited(entry.id);
            const accessible = isAccessible(index);
            const isLast = index === mainPath.length - 1;

            return (
              <React.Fragment key={`${entry.id}-${index}`}>
                <div
                  data-indicator
                  className="flex flex-col items-center flex-shrink-0 relative"
                  onMouseEnter={() => setShowTooltip(index)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  {/* Indicator dot */}
                  <button
                    onClick={() => handleIndicatorClick(index)}
                    disabled={!accessible}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 scale-110'
                        : visited
                        ? 'bg-primary-200 text-primary-700 hover:bg-primary-300'
                        : accessible
                        ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {getTypeIcon(entry.type) || (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </button>

                  {/* Title below indicator */}
                  <span
                    className={`mt-1 text-[10px] max-w-[60px] text-center truncate ${
                      isCurrent
                        ? 'text-primary-700 font-semibold'
                        : visited
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                    title={entry.name}
                  >
                    {entry.name}
                  </span>

                  {/* Tooltip on hover */}
                  {showTooltip === index && (
                    <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20">
                      {entry.name}
                      {entry.type !== 'content' && (
                        <span className="ml-1 text-gray-400">({entry.type})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Connection line */}
                {!isLast && (
                  <div className="flex items-center self-center mt-[-12px]">
                    <div
                      className={`flex-shrink-0 w-6 h-0.5 ${
                        visited && isVisited(mainPath[index + 1]?.id)
                          ? 'bg-primary-300'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
