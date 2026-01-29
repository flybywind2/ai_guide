import React, { useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  processPassageContent,
  TwineState,
} from '../../utils/twine-runtime';
import { Passage } from '../../types';

interface TwinePassageRendererProps {
  content: string;
  state: TwineState;
  onStateChange: (newState: TwineState) => void;
  onNavigate: (passageName: string) => void;
  passages?: Passage[];
  className?: string;
}

export const TwinePassageRenderer: React.FC<TwinePassageRendererProps> = ({
  content,
  state,
  onStateChange,
  onNavigate,
  passages = [],
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process content with macros and sanitize HTML
  const { html, newState } = useMemo(() => {
    const result = processPassageContent(content, state, undefined, passages);

    // Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(result.html, {
      ADD_ATTR: ['data-passage', 'data-passage-id', 'data-action', 'data-hook'],
      ADD_TAGS: ['span', 'a', 'img'],
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'img', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'colgroup', 'col'],
      ALLOWED_ATTR: ['class', 'data-passage', 'data-passage-id', 'data-action', 'data-hook', 'href', 'src', 'alt', 'width', 'height', 'title', 'style']
    });

    return { html: sanitizedHtml, newState: result.state };
  }, [content, state, passages]);

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

        // Try passage_id first (ID-based navigation)
        const passageId = passageLink.getAttribute('data-passage-id');
        if (passageId && passages.length > 0) {
          const passageNumber = parseInt(passageId, 10);
          const passage = passages.find(p => p.passage_number === passageNumber);
          if (passage) {
            onNavigate(passage.name);
            return;
          }
        }

        // Fallback to passage name (name-based navigation)
        const passageName = passageLink.getAttribute('data-passage');
        if (passageName) {
          onNavigate(passageName);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [onNavigate, passages]);

  return (
    <div
      ref={containerRef}
      className={`twine-content passage-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default TwinePassageRenderer;
