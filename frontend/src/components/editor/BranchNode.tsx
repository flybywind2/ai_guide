import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitFork } from 'lucide-react';
import { parseBranchData } from '../../utils/branch-utils';
import type { Passage } from '../../types';

interface BranchNodeData {
  label: string;
  passage: Passage;
  isCurrentPassage?: boolean;
}

export const BranchNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as BranchNodeData;
  const passage = nodeData.passage;
  const isCurrentPassage = nodeData.isCurrentPassage || false;

  const { branchData } = parseBranchData(passage.content || '');
  const choices = branchData?.choices || [];
  const isStart = passage.passage_type === 'start';

  return (
    <div
      className={`relative min-w-[180px] ${selected ? 'ring-2 ring-primary-500' : ''}`}
      style={{
        backgroundColor: isStart ? '#D1FAE5' : '#FEF3C7',
        border: isCurrentPassage ? '4px solid #7C3AED' : (isStart ? '2px solid #10B981' : '2px solid #F59E0B'),
        borderRadius: '8px',
        padding: '10px',
        boxShadow: isCurrentPassage ? '0 0 20px rgba(124, 58, 237, 0.5)' : undefined,
        cursor: 'pointer',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 ${isStart ? '!bg-green-500' : '!bg-amber-500'} !border-2 !border-white`}
      />

      <div className="flex items-center gap-2 mb-2">
        <GitFork className={`w-4 h-4 ${isStart ? 'text-green-600' : 'text-amber-600'}`} />
        <span className="font-medium text-gray-800 text-sm">{nodeData.label}</span>
      </div>

      {choices.length > 0 ? (
        <div className={`space-y-1 mt-2 border-t ${isStart ? 'border-green-300' : 'border-amber-300'} pt-2`}>
          {choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`flex items-center gap-2 text-xs ${isStart ? 'bg-green-100' : 'bg-amber-100'} rounded px-2 py-1 relative`}
            >
              <span className={`flex-shrink-0 w-5 h-5 rounded-full ${isStart ? 'bg-green-500' : 'bg-amber-500'} text-white flex items-center justify-center font-bold text-[10px]`}>
                {index + 1}
              </span>
              <span className={`truncate ${isStart ? 'text-green-800' : 'text-amber-800'}`} title={choice.button}>
                {choice.button || `Option ${index + 1}`}
              </span>

              {/* handle id는 기존 index 유지 (links/link_order 호환) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`choice-${index}`}
                className={`!w-3 !h-3 ${isStart ? '!bg-green-500' : '!bg-amber-500'} !border-2 !border-white`}
                style={{ top: 'auto', right: -6 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`!w-3 !h-3 ${isStart ? '!bg-green-500' : '!bg-amber-500'} !border-2 !border-white`}
        />
      )}
    </div>
  );
});

BranchNode.displayName = 'BranchNode';
