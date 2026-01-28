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
    <div className={`${depth > 0 ? 'pl-3 border-l-2 border-white/30' : ''}`}>
      <div className="bg-white/40 backdrop-blur-sm border border-white/40 rounded-lg p-3 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {feedback.is_anonymous ? '익명' : feedback.user_name || '사용자'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {new Date(feedback.created_at).toLocaleDateString('ko-KR')}
            </span>
            {canDelete && (
              <button
                onClick={() => onDelete(feedback.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="삭제"
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
            답글
          </button>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <form onSubmit={handleReply} className="mt-2 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요..."
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
                익명
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  답글
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
    if (!confirm('이 피드백을 삭제하시겠습니까?')) return;
    await api.delete(`/feedback/${feedbackId}`);
    fetchFeedbacks();
  };

  if (rightSidebarCollapsed) {
    return (
      <aside className="w-[48px] glass-panel border-l border-white/20 flex flex-col sticky top-16 h-[calc(100vh-64px)]">
        <button
          onClick={toggleRightSidebar}
          className="p-3 hover:bg-white/40 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[320px] glass-panel border-l border-white/20 flex flex-col sticky top-16 h-[calc(100vh-64px)]">
      <div className="p-4 border-b border-white/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">피드백</span>
          {feedbacks.length > 0 && (
            <span className="text-xs bg-primary-500/20 text-primary-700 px-2 py-0.5 rounded-full">
              {feedbacks.length}
            </span>
          )}
        </div>
        <button
          onClick={toggleRightSidebar}
          className="p-1 rounded hover:bg-white/40 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[200px]">
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
            아직 피드백이 없습니다. 첫 피드백을 남겨보세요!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="absolute bottom-[72px] left-0 right-0 p-4 border-t border-white/20 bg-white/60 backdrop-blur-md">
        <textarea
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          placeholder={
            isAuthenticated
              ? '피드백을 입력하세요...'
              : '로그인 후 피드백을 남길 수 있습니다'
          }
          disabled={!isAuthenticated}
          className="w-full px-3 py-2 border border-white/40 bg-white/50 rounded-lg text-sm resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
            익명
          </label>
          <Button
            type="submit"
            size="sm"
            disabled={!isAuthenticated || !newFeedback.trim() || isLoading}
          >
            <Send className="w-4 h-4 mr-1" />
            전송
          </Button>
        </div>
      </form>
    </aside>
  );
};
