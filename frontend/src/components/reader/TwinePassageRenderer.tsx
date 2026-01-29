import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { X } from 'lucide-react';
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
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

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

  // Handle click events for passage links and images
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if clicked element is an image
      if (target.tagName === 'IMG') {
        // Check if image is inside a passage link
        const passageLink = target.closest('[data-passage]');
        if (passageLink) {
          // Image inside a link - let link handling occur
          return;
        }
        // Image not inside a link - open zoom modal
        const src = target.getAttribute('src');
        if (src) {
          e.preventDefault();
          setEnlargedImage(src);
          return;
        }
      }

      // Check if clicked element is a passage link
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

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && enlargedImage) {
        setEnlargedImage(null);
      }
    };

    if (enlargedImage) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enlargedImage]);

  return (
    <>
      <div
        ref={containerRef}
        className={`twine-content passage-content ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Image Zoom Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={enlargedImage}
              alt="Enlarged"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X size={24} className="text-gray-800" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TwinePassageRenderer;
