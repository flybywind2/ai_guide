import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  Eye,
  Plus,
  GripVertical,
  Trash2,
  Image,
  Settings,
  Sparkles,
  Lightbulb,
  Target,
  Rocket,
  Brain,
  Code,
  Gamepad2,
  Map,
  Compass,
  Star,
  Heart,
  Zap,
  Award,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Reply,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Button } from '../../components/common';
import type { Story, Feedback } from '../../types';

interface FeedbackWithPassageInfo extends Feedback {
  passage_name?: string;
  story_id?: string;
  story_name?: string;
  reply_count?: number;
}

// Available icons for stories
const STORY_ICONS = [
  { name: 'book-open', icon: BookOpen },
  { name: 'lightbulb', icon: Lightbulb },
  { name: 'target', icon: Target },
  { name: 'rocket', icon: Rocket },
  { name: 'brain', icon: Brain },
  { name: 'code', icon: Code },
  { name: 'gamepad2', icon: Gamepad2 },
  { name: 'map', icon: Map },
  { name: 'compass', icon: Compass },
  { name: 'star', icon: Star },
  { name: 'heart', icon: Heart },
  { name: 'zap', icon: Zap },
  { name: 'award', icon: Award },
  { name: 'sparkles', icon: Sparkles },
  { name: 'image', icon: Image },
];

const getIconComponent = (iconName: string) => {
  const iconData = STORY_ICONS.find((i) => i.name === iconName);
  return iconData?.icon || BookOpen;
};

interface Stats {
  total_users: number;
  total_stories: number;
  total_passages: number;
  total_visits: number;
  total_feedbacks: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackWithPassageInfo[]>([]);
  const [selectedStoryFilter, setSelectedStoryFilter] = useState<string>('');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [iconPickerStoryId, setIconPickerStoryId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [selectedStoryFilter]);

  const fetchData = async () => {
    try {
      const [statsRes, storiesRes] = await Promise.all([
        api.get('/admin/stats/overview'),
        api.get('/admin/stories'),
      ]);
      setStats(statsRes.data);
      setStories(storiesRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const params = selectedStoryFilter ? { story_id: selectedStoryFilter } : {};
      const res = await api.get('/feedback/admin/all', { params });
      setFeedbacks(res.data);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  const handleReplyFeedback = async (feedbackId: string) => {
    if (!replyContent.trim()) return;
    try {
      await api.post(`/feedback/${feedbackId}/reply`, {
        content: replyContent,
        is_anonymous: false,
      });
      setReplyContent('');
      setReplyingTo(null);
      fetchFeedbacks();
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await api.delete(`/feedback/${feedbackId}`);
      fetchFeedbacks();
    } catch (error) {
      console.error('Failed to delete feedback:', error);
    }
  };

  const createStory = async () => {
    const name = prompt('Enter story name:');
    if (!name) return;

    try {
      await api.post('/admin/stories', { name });
      fetchData();
    } catch (error) {
      console.error('Failed to create story:', error);
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      await api.delete(`/admin/stories/${storyId}`);
      setDeleteConfirmId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete story:', error);
    }
  };

  const updateStoryIcon = async (storyId: string, icon: string) => {
    try {
      await api.put(`/admin/stories/${storyId}`, { icon });
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, icon } : s))
      );
      setIconPickerStoryId(null);
    } catch (error) {
      console.error('Failed to update story icon:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);

    // Add a slight delay to apply dragging styles
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = async () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }

    // If we have a valid drag operation, save the new order
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newStories = [...stories];
      const [draggedItem] = newStories.splice(draggedIndex, 1);
      newStories.splice(dragOverIndex, 0, draggedItem);

      setStories(newStories);

      // Save to backend
      setIsSaving(true);
      try {
        const storyIds = newStories.map(s => s.id);
        await api.put('/admin/stories/reorder', { story_ids: storyIds });
      } catch (error) {
        console.error('Failed to reorder stories:', error);
        // Revert on error
        fetchData();
      } finally {
        setIsSaving(false);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null) return;
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // Don't clear dragOverIndex here to prevent flickering
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button onClick={createStory}>
            <Plus className="w-4 h-4 mr-2" />
            New Story
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.total_users || 0}
                </p>
                <p className="text-xs text-gray-500">Users</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.total_stories || 0}
                </p>
                <p className="text-xs text-gray-500">Stories</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.total_passages || 0}
                </p>
                <p className="text-xs text-gray-500">Passages</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.total_visits || 0}
                </p>
                <p className="text-xs text-gray-500">Visits</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.total_feedbacks || 0}
                </p>
                <p className="text-xs text-gray-500">Feedbacks</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stories */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Stories</h2>
            {isSaving && (
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                Saving order...
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop to reorder stories. The order will be reflected on the public story selection page.
          </p>
          <div className="space-y-3">
            {stories.map((story, index) => {
              const IconComponent = getIconComponent(story.icon || 'book-open');
              return (
                <div
                  key={story.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-move transition-all ${
                    dragOverIndex === index && draggedIndex !== index
                      ? 'border-2 border-primary-500 border-dashed bg-primary-50'
                      : 'border-2 border-transparent'
                  } ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIconPickerStoryId(
                            iconPickerStoryId === story.id ? null : story.id
                          );
                        }}
                        className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center hover:bg-primary-200 transition-colors"
                        title="Change icon"
                      >
                        <IconComponent className="w-5 h-5 text-primary-600" />
                      </button>
                      {iconPickerStoryId === story.id && (
                        <div className="absolute top-12 left-0 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48">
                          <div className="flex items-center justify-between mb-2 pb-2 border-b">
                            <span className="text-xs font-medium text-gray-600">
                              Select Icon
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIconPickerStoryId(null);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <X className="w-3 h-3 text-gray-500" />
                            </button>
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {STORY_ICONS.map(({ name, icon: Icon }) => (
                              <button
                                key={name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStoryIcon(story.id, name);
                                }}
                                className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                                  story.icon === name ? 'bg-primary-100' : ''
                                }`}
                                title={name}
                              >
                                <Icon className="w-4 h-4 text-gray-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{story.name}</h3>
                      <p className="text-sm text-gray-500">
                        {story.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        story.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {story.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Link to={`/admin/stories/${story.id}`}>
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <div className="relative">
                      {deleteConfirmId === story.id ? (
                        <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-700">Delete?</span>
                          <button
                            onClick={() => deleteStory(story.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(story.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete story"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {stories.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No stories yet. Create your first story!
              </p>
            )}
          </div>
        </Card>

        {/* Feedback Management */}
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold">Feedback</h2>
              <span className="text-sm text-gray-500">({feedbacks.length})</span>
            </div>
            <select
              value={selectedStoryFilter}
              onChange={(e) => setSelectedStoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">All Stories</option>
              {stories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Feedback header */}
                <div className="p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">
                          {feedback.is_anonymous ? 'Anonymous' : feedback.user_name || 'User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(feedback.created_at).toLocaleString()}
                        </span>
                        {(feedback.reply_count || 0) > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {feedback.reply_count} replies
                          </span>
                        )}
                      </div>
                      {feedback.passage_name && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="bg-gray-200 px-2 py-0.5 rounded">
                            {feedback.story_name}
                          </span>
                          <span>→</span>
                          <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                            {feedback.passage_name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedFeedbackId(
                          expandedFeedbackId === feedback.id ? null : feedback.id
                        )}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {expandedFeedbackId === feedback.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700">{feedback.content}</p>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setReplyingTo(replyingTo === feedback.id ? null : feedback.id)}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                    {feedback.passage_id && (
                      <Link
                        to={`/admin/stories/${feedback.story_id}`}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Go to Editor
                      </Link>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingTo === feedback.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReplyFeedback(feedback.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReplyFeedback(feedback.id)}
                        disabled={!replyContent.trim()}
                      >
                        Send
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expanded replies */}
                {expandedFeedbackId === feedback.id && feedback.replies && feedback.replies.length > 0 && (
                  <div className="border-t border-gray-200 bg-white p-4 space-y-3">
                    {feedback.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="pl-4 border-l-2 border-primary-200"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">
                            {reply.is_anonymous ? 'Anonymous' : reply.user_name || 'User'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteFeedback(reply.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {feedbacks.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No feedback yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};
