// Utility functions for branch passage data

export interface BranchChoice {
  id: string;
  button: string;
  description: string;
}

export interface BranchData {
  choices: BranchChoice[];
}

const BRANCH_DATA_MARKER = '<!--BRANCH_DATA:';
const BRANCH_DATA_END = '-->';

/**
 * Parse branch data from passage content
 */
export function parseBranchData(content: string): { content: string; branchData: BranchData | null } {
  const markerIndex = content.lastIndexOf(BRANCH_DATA_MARKER);

  if (markerIndex === -1) {
    return { content, branchData: null };
  }

  const endIndex = content.indexOf(BRANCH_DATA_END, markerIndex);
  if (endIndex === -1) {
    return { content, branchData: null };
  }

  const jsonStr = content.substring(markerIndex + BRANCH_DATA_MARKER.length, endIndex);
  const cleanContent = content.substring(0, markerIndex).trimEnd();

  try {
    const branchData = JSON.parse(jsonStr) as BranchData;
    
    // id 없는 기존 데이터에 id 추가 (마이그레이션)
    branchData.choices = branchData.choices.map((choice) => ({
      ...choice,
      id: choice.id || crypto.randomUUID(),
    }));
    
    return { content: cleanContent, branchData };
  } catch {
    return { content: cleanContent, branchData: null };
  }
}

/**
 * Serialize branch data into passage content
 */
export function serializeBranchData(content: string, branchData: BranchData | null): string {
  // First, remove any existing branch data
  const { content: cleanContent } = parseBranchData(content);

  if (!branchData || branchData.choices.length === 0) {
    return cleanContent;
  }

  const jsonStr = JSON.stringify(branchData);
  return `${cleanContent}\n${BRANCH_DATA_MARKER}${jsonStr}${BRANCH_DATA_END}`;
}

/**
 * Create empty branch data with default choices
 */
export function createDefaultBranchData(): BranchData {
  return {
    choices: [
      { id: crypto.randomUUID(), button: 'Option A', description: 'Description for option A' },
      { id: crypto.randomUUID(), button: 'Option B', description: 'Description for option B' },
    ],
  };
}

/**
 * Check if branch data is valid (has at least 2 choices with non-empty buttons)
 */
export function isValidBranchData(branchData: BranchData | null): boolean {
  if (!branchData) return false;
  return branchData.choices.length >= 2 &&
    branchData.choices.every(c => c.button.trim().length > 0);
}
