import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
import { Plus, Save, X, Code, FileText, Play, Trash2, Maximize2, Minimize2, HelpCircle, Download, Upload } from 'lucide-react';
import { TipTapEditor } from './TipTapEditor';
import { PassageCodeEditor } from './PassageCodeEditor';
import { MacroGuideModal } from './MacroGuideModal';
import { BranchNode } from './BranchNode';
import { extractVariables, extractPassageRefs, PassageRef } from './twine-syntax';
import { parseBranchData, serializeBranchData, createDefaultBranchData, generateUniqueId, BranchChoice } from '../../utils/branch-utils';

const nodeTypes = {
  branch: BranchNode,
};

interface StoryEditorProps {
  storyId: string;
}

type EditorMode = 'code' | 'wysiwyg';

// Panel width constants
const MIN_PANEL_WIDTH = 400;
const MAX_PANEL_WIDTH = 900;
const DEFAULT_PANEL_WIDTH = 600;
const PANEL_WIDTH_KEY = 'storyEditor.panelWidth';

export const StoryEditor: React.FC<StoryEditorProps> = ({ storyId }) => {
  const [story, setStory] = useState<StoryWithPassages | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allPassages, setAllPassages] = useState<Passage[]>([]);
  const [storyVariables, setStoryVariables] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showMacroGuide, setShowMacroGuide] = useState(false);

  // Resizable panel state
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY);
    return saved ? Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, parseInt(saved, 10))) : DEFAULT_PANEL_WIDTH;
  });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  const selectedPassage = selectedPassageId 
    ? allPassages.find(p => p.id === selectedPassageId) 
    : null;

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  const fetchStory = useCallback(async () => {
    try {
      const response = await api.get(`/admin/stories/${storyId}`);
      const data: StoryWithPassages = response.data;
      setStory(data);
      setAllPassages(data.passages);

      const allVars: string[] = [];
      data.passages.forEach((p) => {
        const vars = extractVariables(p.content);
        vars.forEach((v) => {
          if (!allVars.includes(v)) allVars.push(v);
        });
      });
      setStoryVariables(allVars);

      const newNodes: Node[] = data.passages.map((p) => {
        const isBranch = p.passage_type === 'branch' || p.passage_type === 'start';

        // Enhanced node styles with better visual hierarchy
        const getNodeStyle = () => {
          if (isBranch) return undefined;

          const baseStyle = {
            width: p.width || 200,
            minHeight: p.height || 80,
            padding: '12px',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          };

          if (p.passage_type === 'end') {
            return {
              ...baseStyle,
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              border: '2px solid #F87171',
              boxShadow: '0 4px 12px rgba(248, 113, 113, 0.15)',
            };
          }

          // Default content node
          return {
            ...baseStyle,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '2px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          };
        };

        return {
          id: p.id,
          type: isBranch ? 'branch' : undefined,
          position: { x: p.position_x, y: p.position_y },
          data: { label: p.name, passage: p },
          style: getNodeStyle(),
        };
      });

      const passageMap = new Map(data.passages.map(p => [p.id, p]));

      // Group links by source to determine priority
      const linksBySource = new Map<string, typeof data.links>();
      data.links.forEach(link => {
        const sourceLinks = linksBySource.get(link.source_passage_id) || [];
        sourceLinks.push(link);
        linksBySource.set(link.source_passage_id, sourceLinks);
      });

      // Sort each group by link_order
      linksBySource.forEach((links) => {
        links.sort((a, b) => a.link_order - b.link_order);
      });

      const newEdges: Edge[] = data.links.map((l) => {
        const sourcePassage = passageMap.get(l.source_passage_id);
        const isBranchSource = sourcePassage?.passage_type === 'branch' || sourcePassage?.passage_type === 'start';
        const isStartSource = sourcePassage?.passage_type === 'start';
        const sourceHandle = isBranchSource ? `choice-${l.link_order}` : undefined;

        // Determine priority for non-branch links
        const sourceLinks = linksBySource.get(l.source_passage_id) || [];
        const hasPriority = !isBranchSource && sourceLinks.length > 1;
        const priorityNumber = hasPriority ? sourceLinks.findIndex(link => link.id === l.id) + 1 : null;

        // Create label with priority
        let edgeLabel = '';
        if (isBranchSource) {
          edgeLabel = `${l.link_order + 1}`;
        } else if (hasPriority && priorityNumber) {
          edgeLabel = l.name ? `${priorityNumber}. ${l.name}` : `${priorityNumber}`;
        } else {
          edgeLabel = l.name || '';
        }

        return {
          id: l.id,
          source: l.source_passage_id,
          target: l.target_passage_id,
          sourceHandle,
          label: edgeLabel,
          type: 'smoothstep',
          animated: l.condition_type !== 'always',
          markerEnd: {
            type: 'arrowclosed' as const,
            width: 20,
            height: 20,
            color: isBranchSource ? (isStartSource ? '#10B981' : '#F59E0B') : '#6B7280',
          },
          style: isBranchSource
            ? { stroke: isStartSource ? '#10B981' : '#F59E0B', strokeWidth: 2 }
            : { strokeWidth: hasPriority ? 2 : 1.5 },
          data: {
            conditionType: l.condition_type,
            conditionValue: l.condition_value,
            priority: priorityNumber,
          },
        };
      });

      const contentEdges: Edge[] = [];
      const existingEdgeSet = new Set(data.links.map(l => `${l.source_passage_id}-${l.target_passage_id}`));

      data.passages.forEach((passage) => {
        const refs = extractPassageRefs(passage.content || '');
        refs.forEach((ref) => {
          let targetPassage;
          if (ref.type === 'id') {
            const passageNumber = parseInt(ref.value, 10);
            targetPassage = data.passages.find((p) => p.passage_number === passageNumber);
          } else {
            targetPassage = data.passages.find((p) => p.name === ref.value);
          }

          if (targetPassage && targetPassage.id !== passage.id) {
            const edgeKey = `${passage.id}-${targetPassage.id}`;
            if (!existingEdgeSet.has(edgeKey)) {
              existingEdgeSet.add(edgeKey);
              contentEdges.push({
                id: `content-${edgeKey}`,
                source: passage.id,
                target: targetPassage.id,
                type: 'smoothstep',
                style: { strokeDasharray: '5,5', stroke: '#9CA3AF' },
                animated: false,
                markerEnd: {
                  type: 'arrowclosed' as const,
                  width: 15,
                  height: 15,
                  color: '#9CA3AF',
                },
              });
            }
          }
        });
      });

      setNodes(newNodes);
      setEdges([...newEdges, ...contentEdges]);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch story:', error);
      return null;
    }
  }, [storyId, setNodes, setEdges]);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      try {
        let linkOrder = 0;

        if (connection.sourceHandle?.startsWith('choice-')) {
          linkOrder = parseInt(connection.sourceHandle.replace('choice-', ''), 10);
        } else {
          // For non-branch links, find the max link_order from the same source and add 1
          const story = await fetchStory();
          if (story) {
            const sourceLinks = story.links.filter(l => l.source_passage_id === connection.source);
            const maxOrder = sourceLinks.reduce((max, link) => Math.max(max, link.link_order), -1);
            linkOrder = maxOrder + 1;
          }
        }

        await api.post('/admin/links', {
          story_id: storyId,
          source_passage_id: connection.source,
          target_passage_id: connection.target,
          condition_type: 'always',
          link_order: linkOrder,
        });

        // Refresh the entire story to update priorities
        await fetchStory();
      } catch (error) {
        console.error('Failed to create link:', error);
      }
    },
    [storyId, allPassages, fetchStory]
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
  setSelectedEdge(null);
  setSelectedPassageId(node.id);
}, []);

const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
  setSelectedEdge(null);
  setSelectedPassageId(node.id);
}, []);
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (!edge.id.startsWith('content-')) {
      setSelectedEdge(edge);
      setSelectedPassageId(null);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  const deleteEdge = useCallback(async (edgeId: string) => {
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

  const updateLinkCondition = useCallback(async (
    edgeId: string,
    conditionType: string,
    conditionValue?: string
  ) => {
    try {
      await api.put(`/admin/links/${edgeId}`, {
        condition_type: conditionType,
        condition_value: conditionValue,
      });
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                animated: conditionType !== 'always',
                data: {
                  ...e.data,
                  conditionType,
                  conditionValue,
                },
              }
            : e
        )
      );
      setSelectedEdge((prev) =>
        prev
          ? {
              ...prev,
              animated: conditionType !== 'always',
              data: {
                ...prev.data,
                conditionType,
                conditionValue,
              },
            }
          : null
      );
    } catch (error) {
      console.error('Failed to update link condition:', error);
    }
  }, [setEdges]);

  const updateLinkOrder = useCallback(async (edgeId: string, newOrder: number) => {
    try {
      await api.put(`/admin/links/${edgeId}`, {
        link_order: newOrder,
      });
      // Refresh the story to update all priorities
      await fetchStory();
    } catch (error) {
      console.error('Failed to update link order:', error);
    }
  }, [fetchStory]);

  const exportPassagesCSV = useCallback(async () => {
    try {
      const response = await api.get(`/admin/stories/${storyId}/export/passages`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `passages_${storyId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export passages:', error);
      alert('Failed to export passages');
    }
  }, [storyId]);

  const exportLinksCSV = useCallback(async () => {
    try {
      const response = await api.get(`/admin/stories/${storyId}/export/links`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `links_${storyId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export links:', error);
      alert('Failed to export links');
    }
  }, [storyId]);

  const importPassagesCSV = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/admin/stories/${storyId}/import/passages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        alert(`Import complete!\nImported: ${response.data.imported}\nUpdated: ${response.data.updated}\nErrors: ${response.data.errors.length}`);
        if (response.data.errors.length > 0) {
          console.error('Import errors:', response.data.errors);
        }
        await fetchStory();
      } catch (error) {
        console.error('Failed to import passages:', error);
        alert('Failed to import passages');
      }
    };
    input.click();
  }, [storyId, fetchStory]);

  const importLinksCSV = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/admin/stories/${storyId}/import/links`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        alert(`Import complete!\nImported: ${response.data.imported}\nUpdated: ${response.data.updated}\nErrors: ${response.data.errors.length}`);
        if (response.data.errors.length > 0) {
          console.error('Import errors:', response.data.errors);
        }
        await fetchStory();
      } catch (error) {
        console.error('Failed to import links:', error);
        alert('Failed to import links');
      }
    };
    input.click();
  }, [storyId, fetchStory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge && !selectedPassageId) {
        if (document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        deleteEdge(selectedEdge.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, selectedPassageId, deleteEdge]);

  const testStory = () => {
    window.open(`/story/${storyId}`, '_blank');
  };

  const closeEditor = useCallback(() => {
    setSelectedPassageId(null);
  }, []);

  // Panel resize handlers
  const handlePanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPanel(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = panelWidth;
  }, [panelWidth]);

  useEffect(() => {
    if (!isDraggingPanel) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = dragStartXRef.current - e.clientX;
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, dragStartWidthRef.current + deltaX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingPanel(false);
      localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPanel, panelWidth]);

  if (!story) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div
      className={`flex ${
        isMaximized
          ? 'fixed inset-0 z-50 bg-white'
          : 'h-[calc(100vh-64px)]'
      } ${isDraggingPanel ? 'cursor-col-resize select-none' : ''}`}
    >
      <div className="flex-1 relative">
        {/* Enhanced Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 flex-wrap">
          {/* Primary Actions */}
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
            <Button size="sm" onClick={addPassage}>
              <Plus className="w-4 h-4" />
              패시지 추가
            </Button>
            <div className="w-px h-6 bg-gray-200" />
            <Button size="sm" variant="secondary" onClick={savePositions} disabled={isSaving} loading={isSaving}>
              <Save className="w-4 h-4" />
              위치 저장
            </Button>
            <Button size="sm" variant="secondary" onClick={testStory}>
              <Play className="w-4 h-4" />
              테스트
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-2 py-2 shadow-lg">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? '전체화면 종료' : '전체화면'}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowMacroGuide(true)}
              title="매크로 가이드"
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* CSV Import/Export */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-2 py-2 shadow-lg">
            <span className="text-xs text-gray-500 px-2 font-medium">CSV</span>
            <div className="w-px h-5 bg-gray-200" />
            <button
              type="button"
              onClick={exportPassagesCSV}
              title="패시지 내보내기"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              패시지
            </button>
            <button
              type="button"
              onClick={exportLinksCSV}
              title="링크 내보내기"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              링크
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <button
              type="button"
              onClick={importPassagesCSV}
              title="패시지 가져오기"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              패시지
            </button>
            <button
              type="button"
              onClick={importLinksCSV}
              title="링크 가져오기"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              링크
            </button>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          edges={edges.map((e) => ({
            ...e,
            style: {
              ...e.style,
              stroke: selectedEdge?.id === e.id ? '#6366F1' : e.style?.stroke,
              strokeWidth: selectedEdge?.id === e.id ? 3 : e.style?.strokeWidth || 2,
            },
            labelStyle: {
              fill: selectedEdge?.id === e.id ? '#6366F1' : '#374151',
              fontWeight: selectedEdge?.id === e.id ? 600 : 400,
              fontSize: 11,
            },
            labelBgStyle: {
              fill: selectedEdge?.id === e.id ? '#EEF2FF' : '#F9FAFB',
              fillOpacity: 0.9,
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
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
          }}
        >
          <Background color="#E2E8F0" gap={20} size={1} />
          <Controls
            className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg"
            position="bottom-left"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              const passage = (node.data as any)?.passage;
              if (!passage) return '#94A3B8';
              switch (passage.passage_type) {
                case 'start': return '#10B981';
                case 'branch': return '#F59E0B';
                case 'end': return '#EF4444';
                default: return '#6366F1';
              }
            }}
            nodeStrokeWidth={3}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="!bg-white/80 !border !border-gray-200 !rounded-lg !shadow-lg"
            position="bottom-right"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>

      {/* Passage Edit Panel */}
      {selectedPassage && (
        <div
          className="relative bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-xl"
          style={{ width: `${panelWidth}px` }}
        >
          {/* Resize Handle */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-20 transition-colors
              ${isDraggingPanel ? 'bg-primary-500' : 'bg-transparent hover:bg-primary-300'}`}
            onMouseDown={handlePanelResizeStart}
            title="드래그하여 패널 너비 조절"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 rounded-full bg-gray-300 opacity-0 hover:opacity-100 transition-opacity" />
          </div>
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div>
              <h3 className="font-semibold text-gray-900">패시지 편집</h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <span className={`
                  inline-block w-2 h-2 rounded-full
                  ${selectedPassage.passage_type === 'start' ? 'bg-emerald-500' :
                    selectedPassage.passage_type === 'branch' ? 'bg-amber-500' :
                    selectedPassage.passage_type === 'end' ? 'bg-red-500' :
                    'bg-indigo-500'}
                `} />
                {selectedPassage.passage_type === 'start' ? '시작' :
                 selectedPassage.passage_type === 'branch' ? '분기' :
                 selectedPassage.passage_type === 'end' ? '종료' : '콘텐츠'} 패시지
              </p>
            </div>
            <button
              onClick={closeEditor}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <PassageEditForm
              key={selectedPassage.id}
              passage={selectedPassage}
              allPassages={allPassages}
              storyVariables={storyVariables}
              onUpdate={fetchStory}
              onClose={closeEditor}
            />
          </div>
        </div>
      )}

      {/* Link Edit Panel */}
      {selectedEdge && (
        <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">링크 편집</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  패시지 간 연결 설정
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Label Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                라벨 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
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
                placeholder="연결선에 표시할 라벨..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors hover:border-gray-400"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                연결선 위에 표시되는 텍스트입니다
              </p>
            </div>

            {/* Condition Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">조건 타입</label>
              <select
                value={(selectedEdge.data?.conditionType as string) || 'always'}
                onChange={(e) => {
                  const newType = e.target.value;
                  updateLinkCondition(
                    selectedEdge.id,
                    newType,
                    newType === 'previous_passage' ? (selectedEdge.data?.conditionValue as string | undefined) : undefined
                  );
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors hover:border-gray-400 cursor-pointer"
              >
                <option value="always">항상 표시</option>
                <option value="previous_passage">이전 페이지 조건부</option>
                <option value="user_selection">사용자 선택</option>
              </select>
              <div className={`
                mt-2 p-3 rounded-lg text-xs
                ${selectedEdge.data?.conditionType === 'always' ? 'bg-gray-50 text-gray-600' :
                  selectedEdge.data?.conditionType === 'previous_passage' ? 'bg-amber-50 text-amber-700' :
                  'bg-indigo-50 text-indigo-700'}
              `}>
                {selectedEdge.data?.conditionType === 'always' && '단일 진행용입니다. 여러 개 있어도 첫 번째만 "다음" 버튼으로 표시됩니다.'}
                {selectedEdge.data?.conditionType === 'previous_passage' && '특정 페이지에서 왔을 때만 표시됩니다. 조건부 단일 진행에 사용하세요.'}
                {selectedEdge.data?.conditionType === 'user_selection' && '분기 선택용입니다. 모든 링크가 개별 선택 버튼으로 표시됩니다.'}
              </div>
            </div>

            {/* Previous Passage Condition */}
            {selectedEdge.data?.conditionType === 'previous_passage' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="block text-sm font-medium text-amber-800 mb-1.5">필요한 이전 페이지</label>
                <select
                  value={(selectedEdge.data?.conditionValue as string) || ''}
                  onChange={(e) => {
                    updateLinkCondition(
                      selectedEdge.id,
                      'previous_passage',
                      e.target.value
                    );
                  }}
                  className="w-full px-3 py-2.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                >
                  <option value="">페이지 선택...</option>
                  {allPassages
                    .filter((p) => p.id !== selectedEdge.target)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1.5 text-xs text-amber-600">
                  선택한 페이지에서 왔을 때만 이 링크가 표시됩니다
                </p>
              </div>
            )}

            {/* Link Order Control */}
            <LinkOrderControl
              selectedEdge={selectedEdge}
              story={story}
              allPassages={allPassages}
              onUpdateOrder={updateLinkOrder}
            />

            {/* Connection Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">연결 정보</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">출발:</span>{' '}
                    {allPassages.find((p) => p.id === selectedEdge.source)?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">도착:</span>{' '}
                    {allPassages.find((p) => p.id === selectedEdge.target)?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              {(() => {
                // Calculate current priority dynamically from story.links
                if (!story) return null;

                const currentLink = story.links.find(l => l.id === selectedEdge.id);
                if (!currentLink) return null;

                const sourcePassage = allPassages.find(p => p.id === selectedEdge.source);
                const isBranchSource = sourcePassage?.passage_type === 'branch' || sourcePassage?.passage_type === 'start';

                // Don't show priority for branch/start sources
                if (isBranchSource) return null;

                const sourceLinks = story.links
                  .filter(l => l.source_passage_id === selectedEdge.source)
                  .sort((a, b) => a.link_order - b.link_order);

                if (sourceLinks.length <= 1) return null; // Only show if multiple links

                const priorityNumber = sourceLinks.findIndex(l => l.id === selectedEdge.id) + 1;

                return (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                        ${priorityNumber === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}
                      `}>
                        {priorityNumber}
                      </span>
                      <span className="text-xs text-gray-600">
                        {priorityNumber === 1 ? '기본 "다음" 버튼으로 표시됨' : `${priorityNumber}번째 우선순위`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Delete Button */}
            <Button
              variant="danger"
              onClick={() => deleteEdge(selectedEdge.id)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4" />
              링크 삭제
            </Button>

            <p className="text-xs text-gray-400 text-center bg-gray-50 rounded-lg py-2 px-3">
              Delete 또는 Backspace 키로 선택된 링크를 삭제할 수 있습니다
            </p>
          </div>
        </div>
      )}

      <MacroGuideModal
        isOpen={showMacroGuide}
        onClose={() => setShowMacroGuide(false)}
      />
    </div>
  );
};

interface LinkOrderControlProps {
  selectedEdge: Edge;
  story: StoryWithPassages | null;
  allPassages: Passage[];
  onUpdateOrder: (edgeId: string, newOrder: number) => Promise<void>;
}

const LinkOrderControl: React.FC<LinkOrderControlProps> = ({
  selectedEdge,
  story,
  allPassages,
  onUpdateOrder,
}) => {
  const sourceLink = story?.links.find(l => l.id === selectedEdge.id);
  const [localOrder, setLocalOrder] = useState<string>('');

  // Update local order when link changes
  useEffect(() => {
    if (sourceLink) {
      setLocalOrder(String(sourceLink.link_order));
    }
  }, [sourceLink?.link_order]);

  if (!sourceLink) return null;

  const sourcePassage = allPassages.find(p => p.id === selectedEdge.source);
  const isBranchSource = sourcePassage?.passage_type === 'branch' || sourcePassage?.passage_type === 'start';

  // Don't show order control for branch/start nodes (they have their own choice handles)
  if (isBranchSource) return null;

  const handleBlur = () => {
    const newOrder = parseInt(localOrder, 10);
    if (!isNaN(newOrder) && newOrder >= 0 && newOrder !== sourceLink.link_order) {
      onUpdateOrder(selectedEdge.id, newOrder);
    } else {
      // Reset to current value if invalid
      setLocalOrder(String(sourceLink.link_order));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">링크 우선순위</label>
      <input
        type="number"
        min="0"
        value={localOrder}
        onChange={(e) => setLocalOrder(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      <p className="mt-1 text-xs text-gray-500">
        같은 출발점에서 나가는 링크가 여러 개일 때 우선순위를 결정합니다. 숫자가 작을수록 우선순위가 높습니다.
      </p>
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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const PassageEditForm: React.FC<PassageEditFormProps> = ({
  passage,
  allPassages,
  storyVariables,
  onUpdate,
  onClose,
}) => {
  const [name, setName] = useState(passage.name);
  const [rawContent, setRawContent] = useState('');
  const [branchChoices, setBranchChoices] = useState<BranchChoice[]>([]);
  const [passageType, setPassageType] = useState(passage.passage_type);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [editorMode, setEditorMode] = useState<EditorMode>('wysiwyg');
  const [linkedPassages, setLinkedPassages] = useState<PassageRef[]>([]);
  const [isContentMaximized, setIsContentMaximized] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isInitializedRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialBranchChoicesRef = useRef<string>(''); // 초기값 저장용

  // 초기화
  useEffect(() => {
    console.log('🔵 PassageEditForm 초기화 시작');
    
    // 자동 저장 타이머 취소
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    isInitializedRef.current = false;
    
    const { content: parsedContent, branchData } = parseBranchData(passage.content);
    
    setName(passage.name);
    setPassageType(passage.passage_type);
    setRawContent(parsedContent);
    
    let choices: BranchChoice[] = [];
    if (branchData) {
      choices = branchData.choices;
    } else if (passage.passage_type === 'branch' || passage.passage_type === 'start') {
      choices = createDefaultBranchData().choices;
    }
    
    setBranchChoices(choices);
    
    // 초기값 저장 (자동 저장 시 비교용)
    initialBranchChoicesRef.current = JSON.stringify(choices);
    
    console.log('🔵 branchChoices 설정 완료:', choices);
    
    // 200ms 후 초기화 완료 (충분한 시간 확보)
    const timer = setTimeout(() => {
      isInitializedRef.current = true;
      console.log('🔵 초기화 완료, 자동 저장 활성화');
    }, 200);
    
    return () => {
      clearTimeout(timer);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [passage.id]);

  // Branch choices 자동 저장 - 초기값과 다를 때만 저장
  useEffect(() => {
    // 초기화 전이면 무시
    if (!isInitializedRef.current) {
      console.log('⏳ 자동 저장 스킵: 초기화 중');
      return;
    }

    if (passageType !== 'branch' && passageType !== 'start') return;
    if (branchChoices.length === 0) return;
    
    // 현재 값과 초기값 비교
    const currentValue = JSON.stringify(branchChoices);
    if (currentValue === initialBranchChoicesRef.current) {
      console.log('⏳ 자동 저장 스킵: 초기값과 동일');
      return;
    }
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    console.log('⏳ 자동 저장 예약 (500ms 후)');
    
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const fullContent = serializeBranchData(rawContent, { choices: branchChoices });

        await api.put(`/admin/passages/${passage.id}`, {
          name,
          content: fullContent,
          passage_type: passageType,
        });

        // 저장 후 초기값 업데이트
        initialBranchChoicesRef.current = JSON.stringify(branchChoices);

        console.log('✅ Branch choices auto-saved');
      } catch (error) {
        console.error('Failed to auto-save branch choices:', error);
      }
    }, 500);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [branchChoices, passageType, rawContent, name, passage.id]);

  // 저장할 때 사용하는 전체 content
  const getFullContent = () => {
    if ((passageType === 'branch' || passageType === 'start') && branchChoices.length > 0) {
      return serializeBranchData(rawContent, { choices: branchChoices });
    }
    return rawContent;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isContentMaximized) {
        setIsContentMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContentMaximized]);

  useEffect(() => {
    const refs = extractPassageRefs(rawContent);
    setLinkedPassages(refs);
  }, [rawContent]);

  useEffect(() => {
    if ((passageType === 'branch' || passageType === 'start') && branchChoices.length === 0 && isInitializedRef.current) {
      setBranchChoices(createDefaultBranchData().choices);
    }
  }, [passageType]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    // Clear any existing status timer
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
    }

    try {
      const fullContent = getFullContent();

      await api.put(`/admin/passages/${passage.id}`, {
        name,
        content: fullContent,
        passage_type: passageType,
      });

      // 저장 후 초기값 업데이트
      initialBranchChoicesRef.current = JSON.stringify(branchChoices);

      setSaveStatus('saved');
      onUpdate();

      // Reset status after 2 seconds
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to update passage:', error);
      setSaveStatus('error');

      // Reset status after 3 seconds
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 패시지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setIsDeleting(true);
    try {
      await api.delete(`/admin/passages/${passage.id}`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete passage:', error);
      setIsDeleting(false);
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

  const otherPassages = allPassages.filter((p) => p.id !== passage.id);

  // Validation
  const nameError = name.trim() === '' ? '패시지 이름을 입력해주세요' : undefined;
  const hasErrors = !!nameError;

  return (
    <div className="space-y-5">
      {/* Passage Info Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${passageType === 'start' ? 'bg-emerald-100 text-emerald-600' :
            passageType === 'branch' ? 'bg-amber-100 text-amber-600' :
            passageType === 'end' ? 'bg-red-100 text-red-600' :
            'bg-indigo-100 text-indigo-600'}
        `}>
          {passageType === 'start' ? (
            <Play className="w-5 h-5" />
          ) : passageType === 'branch' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ) : passageType === 'end' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          ) : (
            <FileText className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">패시지 번호</p>
          <p className="font-mono text-sm font-medium text-gray-900">
            #{String(passage.passage_number).padStart(6, '0')}
          </p>
        </div>
      </div>

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="패시지 이름 입력..."
          className={`
            w-full px-3 py-2.5 border rounded-lg
            transition-all duration-150
            focus:ring-2 focus:ring-offset-0
            ${nameError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-100 hover:border-gray-400'
            }
          `}
        />
        {nameError && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {nameError}
          </p>
        )}
      </div>

      {/* Type Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">유형</label>
        <select
          value={passageType}
          onChange={(e) => setPassageType(e.target.value as Passage['passage_type'])}
          className="
            w-full px-3 py-2.5 border border-gray-300 rounded-lg
            bg-white text-gray-900
            transition-all duration-150
            focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:ring-offset-0
            hover:border-gray-400
            cursor-pointer
          "
        >
          <option value="start">시작 (Start)</option>
          <option value="content">콘텐츠 (Content)</option>
          <option value="branch">분기 (Branch)</option>
          <option value="end">종료 (End)</option>
        </select>
        <p className="mt-1.5 text-xs text-gray-500">
          {passageType === 'start' && '스토리의 시작점입니다. 하나의 스토리에 하나만 존재해야 합니다.'}
          {passageType === 'content' && '일반적인 콘텐츠 페이지입니다.'}
          {passageType === 'branch' && '사용자가 선택할 수 있는 분기점입니다.'}
          {passageType === 'end' && '스토리의 끝점입니다. 여러 개가 존재할 수 있습니다.'}
        </p>
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
            content={rawContent}
            onChange={setRawContent}
            passages={otherPassages}
            variables={storyVariables}
            placeholder="Enter passage content with Twine-style macros..."
          />
        ) : (
          <TipTapEditor
            content={rawContent}
            onChange={setRawContent}
            onImageUpload={handleImageUpload}
          />
        )}
      </div>

      {isContentMaximized && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
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

          <div className="flex-1 overflow-auto p-4">
            {editorMode === 'code' ? (
              <div className="h-full [&_.passage-code-editor]:h-full [&_.passage-code-editor>div:last-of-type]:h-[calc(100%-theme(spacing.14))] [&_.cm-editor]:h-full [&_.cm-scroller]:h-full">
                <PassageCodeEditor
                  content={rawContent}
                  onChange={setRawContent}
                  passages={otherPassages}
                  variables={storyVariables}
                  placeholder="Enter passage content with Twine-style macros..."
                />
              </div>
            ) : (
              <div className="h-full [&>div]:h-full [&_.ProseMirror]:min-h-[calc(100vh-200px)]">
                <TipTapEditor
                  content={rawContent}
                  onChange={setRawContent}
                  onImageUpload={handleImageUpload}
                />
              </div>
            )}
          </div>

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

      {(passageType === 'branch' || passageType === 'start') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-amber-800">
              Branch Choices ({branchChoices.length})
              <span className="ml-2 text-xs text-amber-600 font-normal">(Auto-saved)</span>
            </h4>
            <button
              type="button"
              onClick={() => setBranchChoices([
                ...branchChoices,
                { id: generateUniqueId(), button: '', description: '' }
              ])}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-200 text-amber-800 rounded hover:bg-amber-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Choice
            </button>
          </div>
          <div className="space-y-3">
            {branchChoices.map((choice, index) => (
              <div
                key={choice.id}
                className="flex items-start gap-2 bg-white rounded-lg p-3 border border-amber-200"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full text-amber-700 font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={choice.button}
                      onChange={(e) => {
                        const newChoices = branchChoices.map((c) =>
                          c.id === choice.id ? { ...c, button: e.target.value } : c
                        );
                        setBranchChoices(newChoices);
                      }}
                      placeholder="Enter button text..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={choice.description}
                      onChange={(e) => {
                        const newChoices = branchChoices.map((c) =>
                          c.id === choice.id ? { ...c, description: e.target.value } : c
                        );
                        setBranchChoices(newChoices);
                      }}
                      placeholder="Enter description..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
                {branchChoices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newChoices = branchChoices.filter((c) => c.id !== choice.id);
                      setBranchChoices(newChoices);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove choice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-3">
            Each choice will create a numbered connection point on the canvas. Connect each to a target passage.
          </p>
        </div>
      )}

      {linkedPassages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Linked Passages ({linkedPassages.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {linkedPassages.map((ref, index) => {
              let exists = false;
              let displayText = '';

              if (ref.type === 'id') {
                const passageNumber = parseInt(ref.value, 10);
                const foundPassage = allPassages.find((p) => p.passage_number === passageNumber);
                exists = !!foundPassage;
                displayText = foundPassage
                  ? `${foundPassage.name} (#${ref.value.padStart(6, '0')})`
                  : `#${ref.value.padStart(6, '0')}`;
              } else {
                exists = allPassages.some((p) => p.name === ref.value);
                displayText = ref.value;
              }

              return (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                    exists
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {displayText}
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

      {/* Action Buttons with Save Status */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={isSaving || hasErrors}
          loading={isSaving}
          className={`
            ${saveStatus === 'saved' ? '!bg-green-600 hover:!bg-green-700' : ''}
            ${saveStatus === 'error' ? '!bg-red-600 hover:!bg-red-700' : ''}
          `}
        >
          {saveStatus === 'saved' ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              저장 완료
            </>
          ) : saveStatus === 'error' ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              저장 실패
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isSaving ? '저장 중...' : '저장'}
            </>
          )}
        </Button>

        <div className="flex-1" />

        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={isDeleting}
          loading={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      </div>
    </div>
  );
};



export default StoryEditor;
