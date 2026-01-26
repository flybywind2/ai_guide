import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { StoryEditor } from '../../components/editor/StoryEditor';
import { Button } from '../../components/common';

export const StoryEditorPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();

  if (!storyId) {
    return <div>Story not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <StoryEditor storyId={storyId} />
      </div>
    </div>
  );
};
