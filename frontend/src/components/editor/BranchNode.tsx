import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitFork } from 'lucide-react';
import { parseBranchData } from '../../utils/branch-utils';
import type { Passage } from '../../types';

interface BranchNodeData {
  label: string;
  passage: Passage;
}

export const BranchNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as BranchNodeData;
  const passage = nodeData.passage;
  const { branchData } = parseBranchData(passage.content || '');
  const choices = branchData?.choices || [];

  return (
    <div
      className={`relative min-w-[180px] ${selected ? 'ring-2 ring-primary-500' : ''}`}
      style={{
        backgroundColor: '#FEF3C7',
        border: '2px solid #F59E0B',
        borderRadius: '8px',
        padding: '10px',
      }}
    >
      {/* Default target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
      />

      {/* Node content */}
      <div className="flex items-center gap-2 mb-2">
        <GitFork className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-gray-800 text-sm">{nodeData.label}</span>
      </div>

      {/* Branch choices with handles */}
      {choices.length > 0 ? (
        <div className="space-y-1 mt-2 border-t border-amber-300 pt-2">
          {choices.map((choice, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs bg-amber-100 rounded px-2 py-1 relative"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">
                {index + 1}
              </span>
              <span className="truncate text-amber-800" title={choice.button}>
                {choice.button || `Option ${index + 1}`}
              </span>
              {/* Individual source handle for each choice */}
              <Handle
                type="source"
                position={Position.Right}
                id={`choice-${index}`}
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
                style={{ top: 'auto', right: -6 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Default source handle when no choices defined */}
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
          />
        </>
      )}
    </div>
  );
});

BranchNode.displayName = 'BranchNode';
