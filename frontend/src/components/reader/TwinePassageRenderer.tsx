import React, { useEffect, useMemo, useRef } from 'react';
import {
  processPassageContent,
  TwineState,
} from '../../utils/twine-runtime';

interface TwinePassageRendererProps {
  content: string;
  state: TwineState;
  onStateChange: (newState: TwineState) => void;
  onNavigate: (passageName: string) => void;
  className?: string;
}

export const TwinePassageRenderer: React.FC<TwinePassageRendererProps> = ({
  content,
  state,
  onStateChange,
  onNavigate,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process content with macros
  const { html, newState } = useMemo(() => {
    const result = processPassageContent(content, state);
    return { html: result.html, newState: result.state };
  }, [content, state]);

  // Update state if changed
  useEffect(() => {
    if (JSON.stringify(newState) !== JSON.stringify(state)) {
      onStateChange(newState);
    }
  }, [newState, state, onStateChange]);

  // Handle click events for passage links
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const passageLink = target.closest('[data-passage]');

      if (passageLink) {
        e.preventDefault();
        const passageName = passageLink.getAttribute('data-passage');
        if (passageName) {
          onNavigate(passageName);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [onNavigate]);

  return (
    <div
      ref={containerRef}
      className={`twine-content passage-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default TwinePassageRenderer;
