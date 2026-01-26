import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../../services/api';
import type { StoryWithPassages, Passage } from '../../types';
import { Button } from '../common';
import { Plus, Save, X, Code, FileText, Play, Trash2 } from 'lucide-react';
import { TipTapEditor } from './TipTapEditor';
import { PassageCodeEditor } from './PassageCodeEditor';
import { extractPassageLinks, extractVariables } from './twine-syntax';

interface StoryEditorProps {
  storyId: string;
}

type EditorMode = 'code' | 'wysiwyg';

export const StoryEditor: React.FC<StoryEditorProps> = ({ storyId }) => {
  const [story, setStory] = useState<StoryWithPassages | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allPassages, setAllPassages] = useState<Passage[]>([]);
  const [storyVariables, setStoryVariables] = useState<string[]>([]);

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  const fetchStory = async () => {
    try {
      const response = await api.get(`/admin/stories/${storyId}`);
      const data: StoryWithPassages = response.data;
      setStory(data);
      setAllPassages(data.passages);

      // Extract all variables from all passages
      const allVars: string[] = [];
      data.passages.forEach((p) => {
        const vars = extractVariables(p.content);
        vars.forEach((v) => {
          if (!allVars.includes(v)) allVars.push(v);
        });
      });
      setStoryVariables(allVars);

      // Convert passages to nodes
      const newNodes: Node[] = data.passages.map((p) => ({
        id: p.id,
        position: { x: p.position_x, y: p.position_y },
        data: { label: p.name, passage: p },
        style: {
          width: p.width,
          minHeight: p.height,
          padding: '10px',
          backgroundColor:
            p.passage_type === 'start'
              ? '#D1FAE5'
              : p.passage_type === 'end'
              ? '#FEE2E2'
              : p.passage_type === 'branch'
              ? '#FEF3C7'
              : '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '8px',
        },
      }));

      // Convert links to edges (from database)
      const newEdges: Edge[] = data.links.map((l) => ({
        id: l.id,
        source: l.source_passage_id,
        target: l.target_passage_id,
        label: l.name || '',
        type: 'smoothstep',
        animated: l.condition_type !== 'always',
      }));

      // Create edges from [[passage]] links in content
      const contentEdges: Edge[] = [];
      const existingEdgeSet = new Set(data.links.map(l => `${l.source_passage_id}-${l.target_passage_id}`));

      data.passages.forEach((passage) => {
        const linkedNames = extractPassageLinks(passage.content || '');
        linkedNames.forEach((linkName) => {
          // Find target passage by name
          const targetPassage = data.passages.find((p) => p.name === linkName);
          if (targetPassage && targetPassage.id !== passage.id) {
            const edgeKey = `${passage.id}-${targetPassage.id}`;
            // Only add if no database link exists
            if (!existingEdgeSet.has(edgeKey)) {
              existingEdgeSet.add(edgeKey);
              contentEdges.push({
                id: `content-${edgeKey}`,
                source: passage.id,
                target: targetPassage.id,
                type: 'smoothstep',
                style: { strokeDasharray: '5,5', stroke: '#9CA3AF' },
                animated: false,
              });
            }
          }
        });
      });

      setNodes(newNodes);
      setEdges([...newEdges, ...contentEdges]);
    } catch (error) {
      console.error('Failed to fetch story:', error);
    }
  };

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        const response = await api.post('/admin/links', {
          story_id: storyId,
          source_passage_id: connection.source,
          target_passage_id: connection.target,
          condition_type: 'always',
        });

        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: response.data.id,
              type: 'smoothstep',
            },
            eds
          )
        );
      } catch (error) {
        console.error('Failed to create link:', error);
      }
    },
    [storyId, setEdges]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const addPassage = async () => {
    try {
      const response = await api.post('/admin/passages', {
        story_id: storyId,
        name: 'New Passage',
        content: '',
        passage_type: 'content',
        position_x: Math.random() * 500,
        position_y: Math.random() * 500,
      });

      const newPassage = response.data;
      setNodes((nds) => [
        ...nds,
        {
          id: newPassage.id,
          position: { x: newPassage.position_x, y: newPassage.position_y },
          data: { label: newPassage.name, passage: newPassage },
          style: {
            width: 200,
            minHeight: 100,
            padding: '10px',
            backgroundColor: '#FFFFFF',
            border: '2px solid #E5E7EB',
            borderRadius: '8px',
          },
        },
      ]);
      setAllPassages((prev) => [...prev, newPassage]);
    } catch (error) {
      console.error('Failed to create passage:', error);
    }
  };

  const savePositions = async () => {
    setIsSaving(true);
    try {
      for (const node of nodes) {
        await api.put(`/admin/passages/${node.id}`, {
          position_x: node.position.x,
          position_y: node.position.y,
        });
      }
      alert('Positions saved!');
    } catch (error) {
      console.error('Failed to save positions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const testStory = () => {
    window.open(`/story/${storyId}`, '_blank');
  };

  if (!story) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button onClick={addPassage}>
            <Plus className="w-4 h-4 mr-2" />
            Add Passage
          </Button>
          <Button variant="secondary" onClick={savePositions} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Positions
          </Button>
          <Button variant="secondary" onClick={testStory}>
            <Play className="w-4 h-4 mr-2" />
            Test Story
          </Button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {selectedNode && (
        <div className="w-[600px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Edit Passage</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedNode.data.passage.passage_type} passage
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <PassageEditForm
              key={selectedNode.id}
              passage={selectedNode.data.passage as Passage}
              allPassages={allPassages}
              storyVariables={storyVariables}
              onUpdate={fetchStory}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface PassageEditFormProps {
  passage: Passage;
  allPassages: Passage[];
  storyVariables: string[];
  onUpdate: () => void;
  onClose: () => void;
}

const PassageEditForm: React.FC<PassageEditFormProps> = ({
  passage,
  allPassages,
  storyVariables,
  onUpdate,
  onClose,
}) => {
  const [name, setName] = useState(passage.name);
  const [content, setContent] = useState(passage.content);
  const [passageType, setPassageType] = useState(passage.passage_type);
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('code');
  const [linkedPassages, setLinkedPassages] = useState<string[]>([]);

  // Update linked passages when content changes
  useEffect(() => {
    const links = extractPassageLinks(content);
    setLinkedPassages(links);
  }, [content]);

  // Reset state when passage changes
  useEffect(() => {
    setName(passage.name);
    setContent(passage.content);
    setPassageType(passage.passage_type);
  }, [passage.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/admin/passages/${passage.id}`, {
        name,
        content,
        passage_type: passageType,
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update passage:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this passage?')) return;

    try {
      await api.delete(`/admin/passages/${passage.id}`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete passage:', error);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  };

  // Get other passages (excluding current one)
  const otherPassages = allPassages.filter((p) => p.id !== passage.id);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={passageType}
          onChange={(e) => setPassageType(e.target.value as Passage['passage_type'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="start">Start</option>
          <option value="content">Content</option>
          <option value="branch">Branch</option>
          <option value="end">End</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Content</label>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setEditorMode('code')}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
                editorMode === 'code'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-3 h-3" />
              Code
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('wysiwyg')}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
                editorMode === 'wysiwyg'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3 h-3" />
              Visual
            </button>
          </div>
        </div>

        {editorMode === 'code' ? (
          <PassageCodeEditor
            content={content}
            onChange={setContent}
            passages={otherPassages}
            variables={storyVariables}
            placeholder="Enter passage content with Twine-style macros..."
          />
        ) : (
          <TipTapEditor
            content={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
          />
        )}
      </div>

      {/* Linked passages preview */}
      {linkedPassages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Linked Passages ({linkedPassages.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {linkedPassages.map((link, index) => {
              const exists = allPassages.some((p) => p.name === link);
              return (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                    exists
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {link}
                  {!exists && (
                    <span className="ml-1 text-red-500" title="Passage not found">
                      ⚠
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Variables preview */}
      {storyVariables.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-green-800 mb-2">
            Story Variables ({storyVariables.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {storyVariables.slice(0, 10).map((variable, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700 font-mono"
              >
                {variable}
              </span>
            ))}
            {storyVariables.length > 10 && (
              <span className="text-xs text-green-600">
                +{storyVariables.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="ghost" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default StoryEditor;
