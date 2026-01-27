import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Send, Reply, Trash2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useStoryStore } from '../../stores/storyStore';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import type { Feedback } from '../../types';
import { Button } from '../common';

interface FeedbackItemProps {
  feedback: Feedback;
  onReply: (feedbackId: string, content: string, isAnonymous: boolean) => Promise<void>;
  onDelete: (feedbackId: string) => Promise<void>;
  isAuthenticated: boolean;
  currentUserId?: string;
  isAdmin: boolean;
  depth?: number;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({
  feedback,
  onReply,
  onDelete,
  isAuthenticated,
  currentUserId,
  isAdmin,
  depth = 0,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canDelete = isAdmin || feedback.user_id === currentUserId;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(feedback.id, replyContent, replyAnonymous);
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'pl-3 border-l-2 border-gray-200' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {feedback.is_anonymous ? 'Anonymous' : feedback.user_name || 'User'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {new Date(feedback.created_at).toLocaleDateString()}
            </span>
            {canDelete && (
              <button
                onClick={() => onDelete(feedback.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">{feedback.content}</p>

        {/* Reply button */}
        {isAuthenticated && depth < 2 && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Reply className="w-3 h-3" />
            Reply
          </button>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <form onSubmit={handleReply} className="mt-2 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:border-primary-500"
              rows={2}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={replyAnonymous}
                  onChange={(e) => setReplyAnonymous(e.target.checked)}
                  className="rounded border-gray-300 w-3 h-3"
                />
                Anonymous
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Nested replies */}
      {feedback.replies?.length > 0 && (
        <div className="mt-2 space-y-2">
          {feedback.replies.map((reply) => (
            <FeedbackItem
              key={reply.id}
              feedback={reply}
              onReply={onReply}
              onDelete={onDelete}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const RightSidebar: React.FC = () => {
  const { rightSidebarCollapsed, toggleRightSidebar } = useUIStore();
  const { currentPassage } = useStoryStore();
  const { isAuthenticated, user } = useAuthStore();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'editor';

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

  const handleReply = async (feedbackId: string, content: string, anonymous: boolean) => {
    await api.post(`/feedback/${feedbackId}/reply`, {
      content,
      is_anonymous: anonymous,
    });
    fetchFeedbacks();
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    await api.delete(`/feedback/${feedbackId}`);
    fetchFeedbacks();
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
          {feedbacks.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {feedbacks.length}
            </span>
          )}
        </div>
        <button
          onClick={toggleRightSidebar}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {feedbacks.length > 0 ? (
          feedbacks.map((feedback) => (
            <FeedbackItem
              key={feedback.id}
              feedback={feedback}
              onReply={handleReply}
              onDelete={handleDelete}
              isAuthenticated={isAuthenticated}
              currentUserId={user?.id}
              isAdmin={isAdmin}
            />
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
