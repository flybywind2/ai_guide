import React, { useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Map as MapIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { StoryWithPassages } from '../../types';
import { BranchNode } from '../editor/BranchNode';
import { extractPassageLinks } from '../editor/twine-syntax';

const nodeTypes = {
  branch: BranchNode,
};

interface StoryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  currentPassageId: string;
}

const StoryMapModalContent: React.FC<StoryMapModalProps> = ({
  isOpen,
  onClose,
  storyId,
  currentPassageId,
}) => {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && storyId) {
      fetchStoryMap();
    }
  }, [isOpen, storyId]);

  const fetchStoryMap = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/stories/${storyId}`);
      const data: StoryWithPassages = response.data;

      console.log('Current Passage ID:', currentPassageId);

      const newNodes: Node[] = data.passages.map((p) => {
        const isBranch = p.passage_type === 'branch';
        const isCurrentPassage = p.id === currentPassageId;

        console.log(`Passage ${p.name} (${p.id}): isCurrentPassage=${isCurrentPassage}`);

        return {
          id: p.id,
          type: isBranch ? 'branch' : undefined,
          position: { x: p.position_x, y: p.position_y },
          data: {
            label: p.name,
            passage: p,
            isCurrentPassage: isCurrentPassage, // Pass current passage info to BranchNode
          },
          style: isBranch ? undefined : {
            width: p.width,
            minHeight: p.height,
            padding: '10px',
            backgroundColor:
              p.passage_type === 'start'
                ? '#D1FAE5'
                : p.passage_type === 'end'
                ? '#FEE2E2'
                : '#FFFFFF',
            border: isCurrentPassage
              ? '4px solid #7C3AED'
              : '2px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: isCurrentPassage
              ? '0 0 20px rgba(124, 58, 237, 0.5)'
              : undefined,
            cursor: 'pointer',
          },
        };
      });

      const passageMap = new Map(data.passages.map(p => [p.id, p]));

      const newEdges: Edge[] = data.links.map((l) => {
        const sourcePassage = passageMap.get(l.source_passage_id);
        const isBranchSource = sourcePassage?.passage_type === 'branch';
        const sourceHandle = isBranchSource ? `choice-${l.link_order}` : undefined;

        return {
          id: l.id,
          source: l.source_passage_id,
          target: l.target_passage_id,
          sourceHandle,
          label: isBranchSource ? `${l.link_order + 1}` : (l.name || ''),
          type: 'smoothstep',
          animated: l.condition_type !== 'always',
          style: isBranchSource ? { stroke: '#F59E0B', strokeWidth: 2 } : undefined,
          data: {
            conditionType: l.condition_type,
            conditionValue: l.condition_value,
          },
        };
      });

      const contentEdges: Edge[] = [];
      const existingEdgeSet = new Set(data.links.map(l => `${l.source_passage_id}-${l.target_passage_id}`));

      data.passages.forEach((passage) => {
        const linkedNames = extractPassageLinks(passage.content || '');
        linkedNames.forEach((linkName) => {
          const targetPassage = data.passages.find((p) => p.name === linkName);
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
              });
            }
          }
        });
      });

      setNodes(newNodes);
      setEdges([...newEdges, ...contentEdges]);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch story map:', error);
      setIsLoading(false);
    }
  };

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    // Navigate to the passage
    navigate(`/passage/${node.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">스토리 맵</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Map Content */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : (
            <ReactFlowWithFitView
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              currentPassageId={currentPassageId}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              panOnScroll={false}
              selectionOnDrag={false}
              selectNodesOnDrag={false}
            >
              <Background />
              <Controls />
            </ReactFlowWithFitView>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-4 border-primary-600 rounded"></div>
              <span>현재 위치</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Separate component to use useReactFlow hook
const ReactFlowWithFitView: React.FC<any> = ({ currentPassageId, children, ...props }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (currentPassageId) {
      // Wait for nodes to render, then fit view to current passage
      setTimeout(() => {
        fitView({
          nodes: [{ id: currentPassageId }],
          duration: 800,
          padding: 0.3,
        });
      }, 100);
    }
  }, [currentPassageId, fitView]);

  return (
    <ReactFlow {...props}>
      {children}
    </ReactFlow>
  );
};

// Main component wrapped with ReactFlowProvider
export const StoryMapModal: React.FC<StoryMapModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <ReactFlowProvider>
      <StoryMapModalContent {...props} />
    </ReactFlowProvider>
  );
};
