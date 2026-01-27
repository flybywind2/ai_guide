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
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../../services/api';
import type { StoryWithPassages, Passage } from '../../types';
import { Button } from '../common';
import { Plus, Save, X, Code, FileText, Play, Trash2, Maximize2, Minimize2 } from 'lucide-react';
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
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allPassages, setAllPassages] = useState<Passage[]>([]);
  const [storyVariables, setStoryVariables] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

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
    setSelectedEdge(null);
  }, []);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    // Only allow selecting database edges (not content-based edges)
    if (!edge.id.startsWith('content-')) {
      setSelectedEdge(edge);
      setSelectedNode(null);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  const deleteEdge = useCallback(async (edgeId: string) => {
    // Don't delete content-based edges
    if (edgeId.startsWith('content-')) return;

    try {
      await api.delete(`/admin/links/${edgeId}`);
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setSelectedEdge(null);
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  }, [setEdges]);

  const updateEdgeLabel = useCallback(async (edgeId: string, newLabel: string) => {
    try {
      await api.put(`/admin/links/${edgeId}`, { name: newLabel });
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId ? { ...e, label: newLabel } : e
        )
      );
    } catch (error) {
      console.error('Failed to update link label:', error);
    }
  }, [setEdges]);

  // Handle keyboard events for edge deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge && !selectedNode) {
        // Don't delete if user is typing in an input
        if (document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        deleteEdge(selectedEdge.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, selectedNode, deleteEdge]);

  const testStory = () => {
    window.open(`/story/${storyId}`, '_blank');
  };

  if (!story) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div
      className={`flex ${
        isMaximized
          ? 'fixed inset-0 z-50 bg-white'
          : 'h-[calc(100vh-64px)]'
      }`}
    >
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
          <Button
            variant="secondary"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges.map((e) => ({
            ...e,
            style: {
              ...e.style,
              stroke: selectedEdge?.id === e.id ? '#3B82F6' : e.style?.stroke,
              strokeWidth: selectedEdge?.id === e.id ? 3 : e.style?.strokeWidth || 2,
            },
            labelStyle: {
              fill: selectedEdge?.id === e.id ? '#3B82F6' : '#374151',
              fontWeight: selectedEdge?.id === e.id ? 600 : 400,
            },
          }))}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          fitView
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1, 2]}
          selectNodesOnDrag={false}
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

      {selectedEdge && (
        <div className="w-[350px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Edit Link</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Connection between passages
              </p>
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label (optional)</label>
              <input
                type="text"
                value={(selectedEdge.label as string) || ''}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setEdges((eds) =>
                    eds.map((edge) =>
                      edge.id === selectedEdge.id
                        ? { ...edge, label: newLabel }
                        : edge
                    )
                  );
                  setSelectedEdge((prev) =>
                    prev ? { ...prev, label: newLabel } : null
                  );
                }}
                onBlur={(e) => {
                  updateEdgeLabel(selectedEdge.id, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateEdgeLabel(selectedEdge.id, (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="Enter link label..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Label appears on the connection line
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">From:</span>{' '}
                {allPassages.find((p) => p.id === selectedEdge.source)?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">To:</span>{' '}
                {allPassages.find((p) => p.id === selectedEdge.target)?.name || 'Unknown'}
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => deleteEdge(selectedEdge.id)}
              className="w-full text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Link
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Tip: Press Delete or Backspace to remove selected link
            </p>
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
  const [isContentMaximized, setIsContentMaximized] = useState(false);

  // Handle ESC key to exit content maximize mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isContentMaximized) {
        setIsContentMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContentMaximized]);

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
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setIsContentMaximized(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Maximize editor"
            >
              <Maximize2 className="w-4 h-4" />
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

      {/* Maximized Content Editor Modal */}
      {isContentMaximized && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-lg">Edit Content: {name}</h3>
              <div className="flex bg-gray-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setEditorMode('code')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    editorMode === 'code'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('wysiwyg')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    editorMode === 'wysiwyg'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Visual
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Press ESC to exit</span>
              <button
                type="button"
                onClick={() => setIsContentMaximized(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Exit maximize"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-auto p-4">
            {editorMode === 'code' ? (
              <div className="h-full [&_.passage-code-editor]:h-full [&_.passage-code-editor>div:last-of-type]:h-[calc(100%-theme(spacing.14))] [&_.cm-editor]:h-full [&_.cm-scroller]:h-full">
                <PassageCodeEditor
                  content={content}
                  onChange={setContent}
                  passages={otherPassages}
                  variables={storyVariables}
                  placeholder="Enter passage content with Twine-style macros..."
                />
              </div>
            ) : (
              <div className="h-full [&>div]:h-full [&_.ProseMirror]:min-h-[calc(100vh-200px)]">
                <TipTapEditor
                  content={content}
                  onChange={setContent}
                  onImageUpload={handleImageUpload}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsContentMaximized(false)}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

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
