import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Send } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useStoryStore } from '../../stores/storyStore';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import type { Feedback } from '../../types';
import { Button } from '../common';

export const RightSidebar: React.FC = () => {
  const { rightSidebarCollapsed, toggleRightSidebar } = useUIStore();
  const { currentPassage } = useStoryStore();
  const { isAuthenticated } = useAuthStore();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [currentPassage?.passage.id]);

  const fetchFeedbacks = async () => {
    try {
      const params = currentPassage?.passage.id
        ? { passage_id: currentPassage.passage.id }
        : {};
      const response = await api.get('/feedback', { params });
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    setIsLoading(true);
    try {
      await api.post('/feedback', {
        passage_id: currentPassage?.passage.id,
        content: newFeedback,
        is_anonymous: isAnonymous,
      });
      setNewFeedback('');
      fetchFeedbacks();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (rightSidebarCollapsed) {
    return (
      <aside className="w-[48px] bg-white border-l border-gray-200 flex flex-col">
        <button
          onClick={toggleRightSidebar}
          className="p-3 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[320px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Feedback</span>
        </div>
        <button
          onClick={toggleRightSidebar}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {feedbacks.length > 0 ? (
          feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-gray-50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {feedback.is_anonymous
                    ? 'Anonymous'
                    : feedback.user_name || 'User'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(feedback.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{feedback.content}</p>
              {feedback.replies?.length > 0 && (
                <div className="pl-3 border-l-2 border-gray-200 space-y-2 mt-2">
                  {feedback.replies.map((reply) => (
                    <div key={reply.id} className="text-sm">
                      <span className="font-medium text-gray-700">
                        {reply.is_anonymous
                          ? 'Anonymous'
                          : reply.user_name || 'User'}
                        :
                      </span>{' '}
                      <span className="text-gray-600">{reply.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No feedback yet. Be the first to share!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <textarea
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          placeholder={
            isAuthenticated
              ? 'Share your feedback...'
              : 'Login to share feedback'
          }
          disabled={!isAuthenticated}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-primary-500"
          rows={3}
        />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300"
            />
            Anonymous
          </label>
          <Button
            type="submit"
            size="sm"
            disabled={!isAuthenticated || !newFeedback.trim() || isLoading}
          >
            <Send className="w-4 h-4 mr-1" />
            Send
          </Button>
        </div>
      </form>
    </aside>
  );
};
