import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
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
  Sparkles,
  Image,
} from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';
import { useUIStore } from '../../stores/uiStore';
import { Layout } from '../../components/layout';
import { Card, Button, Modal } from '../../components/common';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  'book-open': BookOpen,
  lightbulb: Lightbulb,
  target: Target,
  rocket: Rocket,
  brain: Brain,
  code: Code,
  gamepad2: Gamepad2,
  map: Map,
  compass: Compass,
  star: Star,
  heart: Heart,
  zap: Zap,
  award: Award,
  sparkles: Sparkles,
  image: Image,
};

const getIcon = (iconName?: string) => {
  return ICON_MAP[iconName || 'book-open'] || BookOpen;
};

export const StorySelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { stories, fetchStories, startStory, loadPassageById, getLastVisit, isLoading } = useStoryStore();
  const { showContinueModal, setShowContinueModal } = useUIStore();

  useEffect(() => {
    fetchStories();

    // Check for last visit
    const lastVisit = getLastVisit();
    if (lastVisit) {
      setShowContinueModal(true);
    }
  }, []);

  const handleStartStory = async (storyId: string) => {
    await startStory(storyId);
    navigate('/passage');
  };

  const handleContinue = async () => {
    const lastVisit = getLastVisit();
    if (lastVisit) {
      // Load the saved passage, not the start passage
      await loadPassageById(lastVisit.passageId, false);
      navigate('/passage');
    }
    setShowContinueModal(false);
  };

  const handleStartFresh = () => {
    localStorage.removeItem('last_visit');
    setShowContinueModal(false);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI 활용 가이드
            </h1>
            <p className="text-xl text-gray-600">
              Choose your learning path to get started
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {stories.map((story) => {
                const IconComponent = getIcon(story.icon);
                return (
                  <Card
                    key={story.id}
                    hover
                    onClick={() => handleStartStory(story.id)}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {story.name}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {story.description || 'Start your learning journey'}
                    </p>
                    <Button>Start</Button>
                  </Card>
                );
              })}

              {stories.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-500">
                  No stories available yet. Check back later!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showContinueModal}
        onClose={() => setShowContinueModal(false)}
        title="이어서 진행하시겠습니까?"
      >
        <p className="text-gray-600 mb-6">
          저장된 진행 상태가 있습니다. 마지막으로 보던 곳에서 이어서 진행하시겠습니까?
        </p>
        <div className="flex gap-3">
          <Button onClick={handleContinue} className="flex-1">
            이어하기
          </Button>
          <Button variant="secondary" onClick={handleStartFresh} className="flex-1">
            새로 시작
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
