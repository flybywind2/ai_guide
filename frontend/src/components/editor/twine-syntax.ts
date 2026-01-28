// Twine-style syntax highlighting for CodeMirror 6
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Custom tags for Twine syntax
const twineTags = {
  passageLink: tags.link,
  macro: tags.keyword,
  macroName: tags.function(tags.keyword),
  variable: tags.variableName,
  hook: tags.labelName,
  string: tags.string,
  comment: tags.comment,
  operator: tags.operator,
};

// Highlight style for Twine syntax
export const twineHighlightStyle = HighlightStyle.define([
  { tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
  { tag: tags.keyword, color: '#7c3aed' },
  { tag: tags.function(tags.keyword), color: '#db2777' },
  { tag: tags.variableName, color: '#059669' },
  { tag: tags.labelName, color: '#d97706' },
  { tag: tags.string, color: '#0891b2' },
  { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
  { tag: tags.operator, color: '#ef4444' },
]);

// Regex patterns for Twine syntax
const patterns = {
  // [[passage link]] or [[display text->passage]] or [[display text|passage]]
  passageLink: /\[\[[^\]]+\]\]/g,
  // (macro: args) or (macro:)
  macro: /\(([a-zA-Z_][a-zA-Z0-9_-]*):([^)]*)\)/g,
  // $variable or _tempVariable
  variable: /[$_][a-zA-Z_][a-zA-Z0-9_]*/g,
  // |hookName> or <hookName|
  hook: /[|<]([a-zA-Z_][a-zA-Z0-9_]*)[>|]/g,
  // "string" or 'string'
  string: /"[^"]*"|'[^']*'/g,
  // HTML comments <!-- -->
  comment: /<!--[\s\S]*?-->/g,
};

// Decoration classes
const passageLinkDeco = Decoration.mark({ class: 'cm-passage-link' });
const macroDeco = Decoration.mark({ class: 'cm-macro' });
const macroNameDeco = Decoration.mark({ class: 'cm-macro-name' });
const variableDeco = Decoration.mark({ class: 'cm-variable' });
const hookDeco = Decoration.mark({ class: 'cm-hook' });
const stringDeco = Decoration.mark({ class: 'cm-string' });
const commentDeco = Decoration.mark({ class: 'cm-comment' });

// Function to find matches and create decorations
function findMatches(
  text: string,
  pattern: RegExp,
  decoration: Decoration,
  offset: number = 0
): { from: number; to: number; deco: Decoration }[] {
  const matches: { from: number; to: number; deco: Decoration }[] = [];
  let match;
  const regex = new RegExp(pattern.source, pattern.flags);
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      from: offset + match.index,
      to: offset + match.index + match[0].length,
      deco: decoration,
    });
  }
  return matches;
}

// Create decorations for the entire document
function createDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const text = view.state.doc.toString();

  const allMatches: { from: number; to: number; deco: Decoration }[] = [];

  // Find all pattern matches
  allMatches.push(...findMatches(text, patterns.comment, commentDeco));
  allMatches.push(...findMatches(text, patterns.passageLink, passageLinkDeco));
  allMatches.push(...findMatches(text, patterns.macro, macroDeco));
  allMatches.push(...findMatches(text, patterns.variable, variableDeco));
  allMatches.push(...findMatches(text, patterns.hook, hookDeco));
  allMatches.push(...findMatches(text, patterns.string, stringDeco));

  // Sort by position
  allMatches.sort((a, b) => a.from - b.from);

  // Add decorations (avoiding overlaps)
  let lastEnd = 0;
  for (const match of allMatches) {
    if (match.from >= lastEnd) {
      builder.add(match.from, match.to, match.deco);
      lastEnd = match.to;
    }
  }

  return builder.finish();
}

// View plugin for syntax highlighting
export const twineSyntaxPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = createDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Editor theme with Twine-specific styles
export const twineEditorTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: "'Fira Code', 'Consolas', monospace",
  },
  '.cm-content': {
    padding: '12px',
    minHeight: '200px',
  },
  '.cm-line': {
    padding: '2px 0',
  },
  '.cm-passage-link': {
    color: '#2563eb',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  '.cm-macro': {
    color: '#7c3aed',
    fontWeight: '500',
  },
  '.cm-macro-name': {
    color: '#db2777',
  },
  '.cm-variable': {
    color: '#059669',
    fontWeight: '500',
  },
  '.cm-hook': {
    color: '#d97706',
    fontStyle: 'italic',
  },
  '.cm-string': {
    color: '#0891b2',
  },
  '.cm-comment': {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f3f4f6',
  },
  '.cm-activeLine': {
    backgroundColor: '#f9fafb',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#dbeafe !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#bfdbfe !important',
  },
  '.cm-tooltip': {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul': {
      maxHeight: '200px',
    },
    '& > ul > li': {
      padding: '4px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#eff6ff',
      color: '#1d4ed8',
    },
  },
});

// Macro definitions for our application
export const macroDefinitions = [
  {
    name: 'if',
    syntax: '(if: condition)[content]',
    description: 'Displays content if condition is true',
    example: '(if: $visited > 0)[You have been here before.]',
  },
  {
    name: 'else-if',
    syntax: '(else-if: condition)[content]',
    description: 'Alternative condition after if',
    example: '(else-if: $score >= 50)[You passed!]',
  },
  {
    name: 'else',
    syntax: '(else:)[content]',
    description: 'Fallback content when no conditions match',
    example: '(else:)[Try again next time.]',
  },
  {
    name: 'set',
    syntax: '(set: $variable to value)',
    description: 'Sets a variable to a value',
    example: '(set: $playerName to "Hero")',
  },
  {
    name: 'print',
    syntax: '(print: $variable)',
    description: 'Displays the value of a variable',
    example: '(print: $playerName)',
  },
  {
    name: 'link',
    syntax: '(link: "text")[action]',
    description: 'Creates a clickable link with custom text',
    example: '(link: "Click me")[(set: $clicked to true)]',
  },
  {
    name: 'link-goto',
    syntax: '(link-goto: "text", "passage")',
    description: 'Creates a link that goes to another passage',
    example: '(link-goto: "Go to forest", "Forest Path")',
  },
  {
    name: 'goto',
    syntax: '(goto: "passage")',
    description: 'Immediately goes to another passage',
    example: '(goto: "Game Over")',
  },
  {
    name: 'display',
    syntax: '(display: "passage")',
    description: 'Embeds another passage content here',
    example: '(display: "Common Header")',
  },
  {
    name: 'hidden',
    syntax: '|name>[content]',
    description: 'Hidden hook that can be shown later',
    example: '|secret>[This is hidden initially]',
  },
  {
    name: 'show',
    syntax: '(show: ?hookName)',
    description: 'Shows a hidden hook',
    example: '(show: ?secret)',
  },
  {
    name: 'hide',
    syntax: '(hide: ?hookName)',
    description: 'Hides a visible hook',
    example: '(hide: ?message)',
  },
  {
    name: 'replace',
    syntax: '(replace: ?hookName)[new content]',
    description: 'Replaces hook content',
    example: '(replace: ?status)[Updated status]',
  },
  {
    name: 'append',
    syntax: '(append: ?hookName)[content]',
    description: 'Appends content to a hook',
    example: '(append: ?log)[New entry added]',
  },
  {
    name: 'prepend',
    syntax: '(prepend: ?hookName)[content]',
    description: 'Prepends content to a hook',
    example: '(prepend: ?list)[First item]',
  },
  {
    name: 'live',
    syntax: '(live: time)[content]',
    description: 'Re-runs content periodically',
    example: '(live: 2s)[(print: $timer)]',
  },
  {
    name: 'stop',
    syntax: '(stop:)',
    description: 'Stops a live macro',
    example: '(if: $timer <= 0)[(stop:)]',
  },
  {
    name: 'transition',
    syntax: '(transition: "type")[content]',
    description: 'Applies transition effect',
    example: '(transition: "fade")[Welcome!]',
  },
  {
    name: 'text-style',
    syntax: '(text-style: "style")[text]',
    description: 'Applies text styling',
    example: '(text-style: "bold")[Important!]',
  },
  {
    name: 'text-color',
    syntax: '(text-color: color)[text]',
    description: 'Changes text color',
    example: '(text-color: red)[Warning!]',
  },
  {
    name: 'background',
    syntax: '(background: color)[content]',
    description: 'Sets background color',
    example: '(background: yellow)[Highlighted]',
  },
  {
    name: 'alert',
    syntax: '(alert: "message")',
    description: 'Shows an alert dialog',
    example: '(alert: "Save complete!")',
  },
  {
    name: 'prompt',
    syntax: '(prompt: "message", "default")',
    description: 'Shows a prompt dialog',
    example: '(set: $name to (prompt: "Your name?", "Player"))',
  },
  {
    name: 'confirm',
    syntax: '(confirm: "message")',
    description: 'Shows a confirm dialog',
    example: '(if: (confirm: "Are you sure?"))[(goto: "Exit")]',
  },
  {
    name: 'random',
    syntax: '(random: min, max)',
    description: 'Generates a random number',
    example: '(set: $roll to (random: 1, 6))',
  },
  {
    name: 'either',
    syntax: '(either: ...values)',
    description: 'Randomly selects one value',
    example: '(print: (either: "heads", "tails"))',
  },
  {
    name: 'cond',
    syntax: '(cond: condition, ifTrue, ifFalse)',
    description: 'Conditional expression',
    example: '(print: (cond: $score > 50, "Pass", "Fail"))',
  },
];

// Passage reference type
export interface PassageRef {
  type: 'name' | 'id';
  value: string;  // name이면 passage name, id면 passage_number (문자열)
  displayText?: string;
}

// Passage link patterns
// Pattern for passage links - handles both [[passage]] and [[text->passage]] or [[text|passage]]
export const passageLinkPattern = /\[\[([^\]|\->]+)(?:\||->)([^\]]+)\]\]|\[\[([^\]]+)\]\]/g;

// Extract passage references (both name-based and ID-based) from content
export function extractPassageRefs(content: string): PassageRef[] {
  const refs: PassageRef[] = [];

  // ID-based with custom text: [[text->#000001]] or [[text|#000001]]
  const idArrowPattern = /\[\[([^\]|\->]+)(?:->|\|)#(\d{1,6})\]\]/g;
  let match;
  while ((match = idArrowPattern.exec(content)) !== null) {
    const passageNumber = match[2];
    if (!refs.some(r => r.type === 'id' && r.value === passageNumber)) {
      refs.push({ type: 'id', value: passageNumber, displayText: match[1].trim() });
    }
  }

  // Simple ID: [[#000001]]
  const idSimplePattern = /\[\[#(\d{1,6})\]\]/g;
  while ((match = idSimplePattern.exec(content)) !== null) {
    const passageNumber = match[1];
    if (!refs.some(r => r.type === 'id' && r.value === passageNumber)) {
      refs.push({ type: 'id', value: passageNumber });
    }
  }

  // Name-based with custom text: [[text->passage]] or [[text|passage]] (excluding ID refs)
  const arrowPattern = /\[\[([^\]|\->]+)(?:->|\|)([^\]#][^\]]*)\]\]/g;
  while ((match = arrowPattern.exec(content)) !== null) {
    const passageName = match[2].trim();
    if (!refs.some(r => r.type === 'name' && r.value === passageName)) {
      refs.push({ type: 'name', value: passageName, displayText: match[1].trim() });
    }
  }

  // Simple name: [[passage]] (excluding ID refs)
  const simplePattern = /\[\[([^\]#|\->]+)\]\]/g;
  while ((match = simplePattern.exec(content)) !== null) {
    const passageName = match[1].trim();
    if (!refs.some(r => r.type === 'name' && r.value === passageName)) {
      refs.push({ type: 'name', value: passageName });
    }
  }

  return refs;
}

// Extract passage names from content (backward compatibility)
export function extractPassageLinks(content: string): string[] {
  const refs = extractPassageRefs(content);
  // name-based links만 반환 (backward compatibility)
  return refs
    .filter(r => r.type === 'name')
    .map(r => r.value);
}

// Extract variables from content
export function extractVariables(content: string): string[] {
  const variables: string[] = [];
  let match;
  while ((match = patterns.variable.exec(content)) !== null) {
    if (!variables.includes(match[0])) {
      variables.push(match[0]);
    }
  }
  return variables;
}

export default {
  twineSyntaxPlugin,
  twineEditorTheme,
  twineHighlightStyle,
  macroDefinitions,
  extractPassageLinks,
  extractPassageRefs,
  extractVariables,
};
