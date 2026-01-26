import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Code } from 'lucide-react';
import { useStoryStore } from '../../stores/storyStore';
import { useUIStore } from '../../stores/uiStore';
import { Layout } from '../../components/layout';
import { Card, Button, Modal } from '../../components/common';

export const StorySelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { stories, fetchStories, startStory, getLastVisit, isLoading } = useStoryStore();
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
      await startStory(lastVisit.storyId);
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
              AI Literacy Workflow Guide
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
              {stories.map((story) => (
                <Card
                  key={story.id}
                  hover
                  onClick={() => handleStartStory(story.id)}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                    {story.name.includes('활용') || story.name.includes('Usage') ? (
                      <Sparkles className="w-8 h-8 text-primary-600" />
                    ) : (
                      <Code className="w-8 h-8 text-primary-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {story.name}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {story.description || 'Start your learning journey'}
                  </p>
                  <Button>Start</Button>
                </Card>
              ))}

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
        title="Continue where you left off?"
      >
        <p className="text-gray-600 mb-6">
          You have a saved progress. Would you like to continue from where you left off?
        </p>
        <div className="flex gap-3">
          <Button onClick={handleContinue} className="flex-1">
            Continue
          </Button>
          <Button variant="secondary" onClick={handleStartFresh} className="flex-1">
            Start Fresh
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
