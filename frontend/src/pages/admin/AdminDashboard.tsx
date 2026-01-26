import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileText, Eye, Plus, GripVertical } from 'lucide-react';
import api from '../../services/api';
import { Layout } from '../../components/layout';
import { Card, Button } from '../../components/common';
import type { Story } from '../../types';

interface Stats {
  total_users: number;
  total_stories: number;
  total_passages: number;
  total_visits: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_users || 0}
                </p>
                <p className="text-sm text-gray-500">Users</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_stories || 0}
                </p>
                <p className="text-sm text-gray-500">Stories</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_passages || 0}
                </p>
                <p className="text-sm text-gray-500">Passages</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_visits || 0}
                </p>
                <p className="text-sm text-gray-500">Visits</p>
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
            {stories.map((story, index) => (
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
                } ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
                </div>
              </div>
            ))}

            {stories.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No stories yet. Create your first story!
              </p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};
