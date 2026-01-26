// Twine-style macro runtime engine
// Processes passage content and renders macros

export interface TwineState {
  variables: Record<string, unknown>;
  visitedPassages: string[];
  currentPassage: string;
  hooks: Record<string, { visible: boolean; content: string }>;
}

export const createInitialState = (): TwineState => ({
  variables: {},
  visitedPassages: [],
  currentPassage: '',
  hooks: {},
});

// Parse and execute a single macro
export function executeMacro(
  macroName: string,
  args: string,
  state: TwineState
): { result: string; state: TwineState } {
  const newState = { ...state };

  switch (macroName.toLowerCase()) {
    case 'set': {
      // (set: $variable to value)
      const match = args.match(/\$([a-zA-Z_][a-zA-Z0-9_]*)\s+to\s+(.+)/i);
      if (match) {
        const [, varName, value] = match;
        newState.variables[varName] = parseValue(value.trim(), newState);
      }
      return { result: '', state: newState };
    }

    case 'print': {
      // (print: $variable) or (print: expression)
      const value = evaluateExpression(args.trim(), newState);
      return { result: String(value ?? ''), state: newState };
    }

    case 'if': {
      // (if: condition)[content] - returns marker, actual processing done in processContent
      return { result: `__IF_MARKER__${args}__`, state: newState };
    }

    case 'else-if':
    case 'elseif': {
      return { result: `__ELSEIF_MARKER__${args}__`, state: newState };
    }

    case 'else': {
      return { result: '__ELSE_MARKER__', state: newState };
    }

    case 'link-goto': {
      // (link-goto: "text", "passage")
      const match = args.match(/"([^"]+)"\s*,\s*"([^"]+)"/);
      if (match) {
        const [, text, passage] = match;
        return {
          result: `<a class="passage-link" data-passage="${passage}">${text}</a>`,
          state: newState,
        };
      }
      return { result: '', state: newState };
    }

    case 'link': {
      // (link: "text")[action]
      const match = args.match(/"([^"]+)"/);
      if (match) {
        return {
          result: `<a class="passage-link" data-action="true">${match[1]}</a>`,
          state: newState,
        };
      }
      return { result: '', state: newState };
    }

    case 'goto': {
      // (goto: "passage")
      const match = args.match(/"([^"]+)"/);
      if (match) {
        return {
          result: `__GOTO__${match[1]}__`,
          state: newState,
        };
      }
      return { result: '', state: newState };
    }

    case 'display': {
      // (display: "passage") - embed another passage
      const match = args.match(/"([^"]+)"/);
      if (match) {
        return {
          result: `__DISPLAY__${match[1]}__`,
          state: newState,
        };
      }
      return { result: '', state: newState };
    }

    case 'random': {
      // (random: min, max)
      const match = args.match(/(\d+)\s*,\s*(\d+)/);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        return { result: String(result), state: newState };
      }
      return { result: '0', state: newState };
    }

    case 'either': {
      // (either: "a", "b", "c")
      const values = args.match(/"[^"]+"|'[^']+'|\d+/g);
      if (values && values.length > 0) {
        const randomValue = values[Math.floor(Math.random() * values.length)];
        return { result: randomValue.replace(/['"]/g, ''), state: newState };
      }
      return { result: '', state: newState };
    }

    case 'cond': {
      // (cond: condition, ifTrue, ifFalse)
      const parts = args.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        const condition = evaluateCondition(parts[0], newState);
        const result = condition ? parts[1] : parts[2];
        return { result: result.replace(/['"]/g, ''), state: newState };
      }
      return { result: '', state: newState };
    }

    case 'text-style': {
      // (text-style: "style")[text]
      const match = args.match(/"([^"]+)"/);
      if (match) {
        const style = match[1];
        const styleMap: Record<string, string> = {
          bold: 'font-weight: bold',
          italic: 'font-style: italic',
          underline: 'text-decoration: underline',
          strike: 'text-decoration: line-through',
          uppercase: 'text-transform: uppercase',
          lowercase: 'text-transform: lowercase',
        };
        return {
          result: `<span style="${styleMap[style] || ''}">`,
          state: newState,
        };
      }
      return { result: '', state: newState };
    }

    case 'text-color':
    case 'color': {
      // (text-color: color)[text]
      const color = args.trim().replace(/['"]/g, '');
      return {
        result: `<span style="color: ${color}">`,
        state: newState,
      };
    }

    case 'background': {
      // (background: color)[content]
      const color = args.trim().replace(/['"]/g, '');
      return {
        result: `<span style="background-color: ${color}">`,
        state: newState,
      };
    }

    case 'show': {
      // (show: ?hookName)
      const match = args.match(/\?([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (match && newState.hooks[match[1]]) {
        newState.hooks[match[1]].visible = true;
      }
      return { result: '', state: newState };
    }

    case 'hide': {
      // (hide: ?hookName)
      const match = args.match(/\?([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (match && newState.hooks[match[1]]) {
        newState.hooks[match[1]].visible = false;
      }
      return { result: '', state: newState };
    }

    default:
      // Unknown macro, return as-is for debugging
      return { result: `(${macroName}: ${args})`, state: newState };
  }
}

// Parse a value (string, number, boolean, or variable)
function parseValue(value: string, state: TwineState): unknown {
  // String
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  const num = parseFloat(value);
  if (!isNaN(num)) return num;

  // Variable
  if (value.startsWith('$')) {
    const varName = value.slice(1);
    return state.variables[varName];
  }

  // Expression (try to evaluate)
  return evaluateExpression(value, state);
}

// Evaluate a simple expression
function evaluateExpression(expr: string, state: TwineState): unknown {
  // Replace variables with their values
  let processed = expr.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, varName) => {
    const value = state.variables[varName];
    if (typeof value === 'string') return `"${value}"`;
    return String(value ?? 0);
  });

  // Handle visits function
  processed = processed.replace(/visits\s*\(\s*\)/g, () => {
    return String(state.visitedPassages.filter((p) => p === state.currentPassage).length);
  });

  // Try to evaluate as JavaScript expression (safe subset)
  try {
    // Only allow safe operations
    const safeExpr = processed.replace(/[^0-9+\-*/().<>=!&|"'\s]/g, '');
    if (safeExpr === processed || processed.match(/^"[^"]*"$/)) {
      // eslint-disable-next-line no-eval
      return eval(processed);
    }
  } catch {
    // Return as string if evaluation fails
  }

  return processed.replace(/['"]/g, '');
}

// Evaluate a condition
function evaluateCondition(condition: string, state: TwineState): boolean {
  const result = evaluateExpression(condition, state);
  return Boolean(result);
}

// Process passage content with all macros
export function processPassageContent(
  content: string,
  state: TwineState,
  onNavigate?: (passageName: string) => void
): { html: string; state: TwineState } {
  let newState = { ...state };
  let html = content;

  // Process hooks first: |hookName>[content]
  html = html.replace(
    /\|([a-zA-Z_][a-zA-Z0-9_]*)>\[([^\]]*)\]/g,
    (_, hookName, hookContent) => {
      newState.hooks[hookName] = { visible: false, content: hookContent };
      return `<span class="hook-hidden" data-hook="${hookName}">${hookContent}</span>`;
    }
  );

  // Process macros: (macro: args)
  html = html.replace(/\(([a-zA-Z_][a-zA-Z0-9_-]*):([^)]*)\)/g, (_, name, args) => {
    const { result, state: updatedState } = executeMacro(name, args, newState);
    newState = updatedState;
    return result;
  });

  // Process passage links: [[passage]] or [[text->passage]] or [[text|passage]]
  html = html.replace(
    /\[\[([^\]|]+?)(?:\||->)([^\]]+)\]\]/g,
    (_, text, passage) => {
      return `<a class="passage-link" data-passage="${passage.trim()}">${text.trim()}</a>`;
    }
  );

  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, passage) => {
    return `<a class="passage-link" data-passage="${passage.trim()}">${passage.trim()}</a>`;
  });

  // Process variables: $variableName
  html = html.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, varName) => {
    const value = newState.variables[varName];
    return `<span class="variable-display">${value ?? ''}</span>`;
  });

  // Process conditionals
  html = processConditionals(html, newState);

  // Convert newlines to breaks
  html = html.replace(/\n/g, '<br>');

  return { html, state: newState };
}

// Process if/else-if/else conditionals
function processConditionals(html: string, state: TwineState): string {
  // Simple if block processing: __IF_MARKER__condition__[content]
  const ifPattern = /__IF_MARKER__(.+?)__\[([^\]]*)\]/g;

  html = html.replace(ifPattern, (_, condition, content) => {
    const result = evaluateCondition(condition, state);
    return result ? content : '';
  });

  // Clean up any remaining markers
  html = html.replace(/__\w+_MARKER__[^_]*__/g, '');

  return html;
}

// Get all available links from processed content
export function extractLinksFromContent(content: string): string[] {
  const links: string[] = [];

  // Pattern for [[text->passage]] or [[text|passage]] format
  const arrowPattern = /\[\[([^\]|]+?)(?:->|\|)([^\]]+)\]\]/g;
  let match;

  while ((match = arrowPattern.exec(content)) !== null) {
    const passageName = match[2].trim();
    if (passageName && !links.includes(passageName)) {
      links.push(passageName);
    }
  }

  // Pattern for simple [[passage]] format (no arrow or pipe)
  const simplePattern = /\[\[([^\]|>\-]+)\]\]/g;
  while ((match = simplePattern.exec(content)) !== null) {
    const passageName = match[1].trim();
    if (passageName && !links.includes(passageName)) {
      links.push(passageName);
    }
  }

  return links;
}

export default {
  createInitialState,
  executeMacro,
  processPassageContent,
  extractLinksFromContent,
};
