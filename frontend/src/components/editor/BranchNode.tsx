import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitFork, Play, Flag } from 'lucide-react';
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

  // Dynamic styles based on state
  const borderColor = isCurrentPassage
    ? '#7C3AED'
    : isStart
    ? '#059669'
    : '#D97706';

  const bgGradient = isStart
    ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
    : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';

  const shadowStyle = isCurrentPassage
    ? '0 0 0 3px rgba(124, 58, 237, 0.3), 0 8px 24px rgba(124, 58, 237, 0.25)'
    : selected
    ? '0 0 0 2px rgba(99, 102, 241, 0.5), 0 8px 20px rgba(0, 0, 0, 0.15)'
    : '0 4px 12px rgba(0, 0, 0, 0.08)';

  return (
    <div
      className={`
        relative min-w-[200px] max-w-[280px]
        transition-all duration-200 ease-out
        ${selected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
      `}
      style={{
        background: bgGradient,
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '12px',
        boxShadow: shadowStyle,
        cursor: 'pointer',
      }}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`
          !w-4 !h-4 !-top-2
          ${isStart ? '!bg-emerald-500' : '!bg-amber-500'}
          !border-2 !border-white
          !shadow-md
          transition-transform hover:scale-125
        `}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`
          p-1.5 rounded-lg
          ${isStart ? 'bg-emerald-500/20' : 'bg-amber-500/20'}
        `}>
          {isStart ? (
            <Play className="w-4 h-4 text-emerald-700" />
          ) : (
            <GitFork className="w-4 h-4 text-amber-700" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-800 text-sm block truncate">
            {nodeData.label}
          </span>
          <span className={`
            text-[10px] font-medium uppercase tracking-wide
            ${isStart ? 'text-emerald-600' : 'text-amber-600'}
          `}>
            {isStart ? '시작' : '분기'}
          </span>
        </div>
        {isStart && (
          <Flag className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        )}
      </div>

      {/* Choices */}
      {choices.length > 0 ? (
        <div className={`
          space-y-1.5 mt-3 pt-3
          border-t ${isStart ? 'border-emerald-300/60' : 'border-amber-300/60'}
        `}>
          {choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`
                group flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 relative
                transition-colors duration-150
                ${isStart
                  ? 'bg-emerald-100/70 hover:bg-emerald-200/70'
                  : 'bg-amber-100/70 hover:bg-amber-200/70'
                }
              `}
            >
              <span className={`
                flex-shrink-0 w-5 h-5 rounded-full
                ${isStart ? 'bg-emerald-600' : 'bg-amber-600'}
                text-white flex items-center justify-center font-bold text-[10px]
                shadow-sm
              `}>
                {index + 1}
              </span>
              <span className={`
                truncate flex-1
                ${isStart ? 'text-emerald-800' : 'text-amber-800'}
                font-medium
              `} title={choice.button || `옵션 ${index + 1}`}>
                {choice.button || `옵션 ${index + 1}`}
              </span>

              {/* Choice Handle */}
              <Handle
                type="source"
                position={Position.Right}
                id={`choice-${index}`}
                className={`
                  !w-3 !h-3
                  ${isStart ? '!bg-emerald-600' : '!bg-amber-600'}
                  !border-2 !border-white
                  !shadow-sm
                  transition-transform group-hover:scale-125
                `}
                style={{ top: 'auto', right: -6 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`
            !w-4 !h-4 !-bottom-2
            ${isStart ? '!bg-emerald-500' : '!bg-amber-500'}
            !border-2 !border-white
            !shadow-md
            transition-transform hover:scale-125
          `}
        />
      )}

      {/* Current Passage Indicator */}
      {isCurrentPassage && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-600" />
          </span>
        </div>
      )}
    </div>
  );
});

BranchNode.displayName = 'BranchNode';
