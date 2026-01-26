import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  highlightSpecialChars,
  placeholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import {
  autocompletion,
  completionKeymap,
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import {
  twineSyntaxPlugin,
  twineEditorTheme,
  macroDefinitions,
} from './twine-syntax';
import type { Passage } from '../../types';

interface PassageCodeEditorProps {
  content: string;
  onChange: (content: string) => void;
  passages?: Passage[];
  variables?: string[];
  onInsertMacro?: (macro: string) => void;
  placeholder?: string;
}

export const PassageCodeEditor: React.FC<PassageCodeEditorProps> = ({
  content,
  onChange,
  passages = [],
  variables = [],
  placeholder: placeholderText = 'Enter passage content...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [showMacroPanel, setShowMacroPanel] = useState(false);
  const [macroFilter, setMacroFilter] = useState('');

  // Create autocomplete function
  const createCompletions = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      // Check for passage link completion [[
      const passageLinkMatch = context.matchBefore(/\[\[[^\]]*$/);
      if (passageLinkMatch) {
        const typed = passageLinkMatch.text.slice(2); // Remove [[
        const filteredPassages = passages.filter((p) =>
          p.name.toLowerCase().includes(typed.toLowerCase())
        );

        if (filteredPassages.length === 0) return null;

        return {
          from: passageLinkMatch.from + 2,
          options: filteredPassages.map((p) => ({
            label: p.name,
            type: 'class',
            info: `Go to: ${p.name}`,
            apply: `${p.name}]]`,
          })),
        };
      }

      // Check for variable completion $
      const variableMatch = context.matchBefore(/\$[a-zA-Z_]*/);
      if (variableMatch) {
        const typed = variableMatch.text.slice(1); // Remove $
        const allVars = [
          ...variables,
          '$playerName',
          '$score',
          '$visited',
          '$time',
          '$chapter',
        ];
        const uniqueVars = [...new Set(allVars)];
        const filteredVars = uniqueVars.filter((v) =>
          v.toLowerCase().includes(typed.toLowerCase())
        );

        if (filteredVars.length === 0) return null;

        return {
          from: variableMatch.from,
          options: filteredVars.map((v) => ({
            label: v,
            type: 'variable',
            info: 'Story variable',
          })),
        };
      }

      // Check for macro completion (
      const macroMatch = context.matchBefore(/\([a-zA-Z_-]*$/);
      if (macroMatch) {
        const typed = macroMatch.text.slice(1); // Remove (
        const filteredMacros = macroDefinitions.filter((m) =>
          m.name.toLowerCase().includes(typed.toLowerCase())
        );

        if (filteredMacros.length === 0) return null;

        return {
          from: macroMatch.from + 1,
          options: filteredMacros.map((m) => ({
            label: m.name,
            type: 'function',
            info: m.description,
            detail: m.syntax,
            apply: `${m.name}: `,
          })),
        };
      }

      return null;
    },
    [passages, variables]
  );

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      bracketMatching(),
      autocompletion({
        override: [createCompletions],
        activateOnTyping: true,
        maxRenderedOptions: 20,
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...searchKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      placeholder(placeholderText),
      twineSyntaxPlugin,
      twineEditorTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          onChange(newContent);
        }
      }),
    ];

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Update content when prop changes (but not when editing)
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== content) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: content,
          },
        });
      }
    }
  }, [content]);

  // Insert text at cursor
  const insertAtCursor = useCallback((text: string) => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const { from } = view.state.selection.main;

    view.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length },
    });
    view.focus();
  }, []);

  // Insert macro
  const insertMacro = useCallback(
    (macro: typeof macroDefinitions[0]) => {
      insertAtCursor(macro.syntax);
      setShowMacroPanel(false);
    },
    [insertAtCursor]
  );

  // Insert passage link
  const insertPassageLink = useCallback(
    (passageName: string) => {
      insertAtCursor(`[[${passageName}]]`);
    },
    [insertAtCursor]
  );

  // Filter macros
  const filteredMacros = macroDefinitions.filter(
    (m) =>
      m.name.toLowerCase().includes(macroFilter.toLowerCase()) ||
      m.description.toLowerCase().includes(macroFilter.toLowerCase())
  );

  return (
    <div className="passage-code-editor">
      {/* Toolbar */}
      <div className="bg-gray-50 border border-gray-200 rounded-t-lg p-2 flex flex-wrap gap-1 items-center">
        {/* Quick insert buttons */}
        <button
          type="button"
          onClick={() => insertAtCursor('[[')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-mono"
          title="Insert passage link"
        >
          [[Link]]
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('(if: condition)[')}
          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-mono"
          title="Insert if condition"
        >
          (if:)
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('(set: $var to ')}
          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-mono"
          title="Set variable"
        >
          (set:)
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('(print: $')}
          className="px-2 py-1 text-xs bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 font-mono"
          title="Print variable"
        >
          (print:)
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('(link-goto: "텍스트", "패시지명")')}
          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-mono"
          title="Link with goto"
        >
          (link-goto:)
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Macro panel toggle */}
        <button
          type="button"
          onClick={() => setShowMacroPanel(!showMacroPanel)}
          className={`px-3 py-1 text-xs rounded font-medium ${
            showMacroPanel
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Macros
        </button>

        {/* Passage links dropdown */}
        {passages.length > 0 && (
          <div className="relative group">
            <button
              type="button"
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
            >
              Passages ({passages.length})
            </button>
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block max-h-60 overflow-y-auto min-w-[200px]">
              {passages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => insertPassageLink(p.name)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      p.passage_type === 'start'
                        ? 'bg-green-500'
                        : p.passage_type === 'end'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Macro Panel */}
      {showMacroPanel && (
        <div className="border-x border-gray-200 bg-white p-3 max-h-64 overflow-y-auto">
          <input
            type="text"
            placeholder="Search macros..."
            value={macroFilter}
            onChange={(e) => setMacroFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            {filteredMacros.map((macro) => (
              <button
                key={macro.name}
                type="button"
                onClick={() => insertMacro(macro)}
                className="text-left p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300"
              >
                <div className="font-mono text-sm text-primary-600">
                  ({macro.name}:)
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {macro.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        className="border border-t-0 border-gray-200 rounded-b-lg overflow-hidden bg-white"
      />

      {/* Syntax help */}
      <div className="mt-2 text-xs text-gray-500 space-y-1">
        <p>
          <span className="font-mono text-blue-600">[[passage name]]</span> - 다른 패시지로 링크
        </p>
        <p>
          <span className="font-mono text-purple-600">(macro:)</span> - 매크로 사용,{' '}
          <span className="font-mono text-green-600">$variable</span> - 변수
        </p>
      </div>
    </div>
  );
};

export default PassageCodeEditor;
