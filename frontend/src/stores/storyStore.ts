import { create } from 'zustand';
import api from '../services/api';
import type { Story, PassageWithContext, Bookmark, Link, StoryWithPassages } from '../types';

interface HistoryEntry {
  id: string;
  name: string;
}

interface MainPathEntry {
  id: string;
  name: string;
  type: 'start' | 'content' | 'branch' | 'end';
}

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  storyStructure: StoryWithPassages | null;
  mainPath: MainPathEntry[];
  currentPassage: PassageWithContext | null;
  previousPassageId: string | null;
  navigationHistory: string[];
  navigationHistoryWithNames: HistoryEntry[];
  currentHistoryIndex: number;
  bookmarks: Bookmark[];
  isLoading: boolean;

  fetchStories: () => Promise<void>;
  fetchStory: (storyId: string) => Promise<void>;
  fetchStoryStructure: (storyId: string) => Promise<void>;
  startStory: (storyId: string) => Promise<void>;
  loadPassageById: (passageId: string, updateHistory?: boolean) => Promise<void>;
  loadPassageByNumber: (passageNumber: number, storyId: string) => Promise<void>;
  navigateToPassage: (passageIdOrName: string, prevPassageId?: string) => Promise<void>;
  navigateViaLink: (linkId: string) => Promise<void>;
  goBack: () => Promise<void>;
  navigateToHistoryIndex: (index: number) => Promise<void>;
  navigateToMainPathIndex: (index: number) => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  addBookmark: (passageId: string) => Promise<void>;
  removeBookmark: (passageId: string) => Promise<void>;
  saveLastVisit: () => void;
  getLastVisit: () => { storyId: string; passageId: string } | null;
  refreshCurrentPassage: () => Promise<void>;
}

// Helper function to compute main path from story structure
function computeMainPath(structure: StoryWithPassages): MainPathEntry[] {
  const { passages, links, start_passage_id } = structure;
  if (!start_passage_id || passages.length === 0) return [];

  const passageMap = new Map(passages.map(p => [p.id, p]));
  const linksBySource = new Map<string, Link[]>();

  links.forEach(link => {
    const existing = linksBySource.get(link.source_passage_id) || [];
    existing.push(link);
    linksBySource.set(link.source_passage_id, existing);
  });

  const path: MainPathEntry[] = [];
  const visited = new Set<string>();
  let currentId: string | null = start_passage_id;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const passage = passageMap.get(currentId);
    if (!passage) break;

    path.push({
      id: passage.id,
      name: passage.name,
      type: passage.passage_type,
    });

    // Find next passage via primary link (lowest link_order, preferring 'always' type)
    const outLinks = linksBySource.get(currentId) || [];
    const sortedLinks = [...outLinks].sort((a, b) => {
      // Prefer 'always' and 'previous_passage' over 'user_selection'
      if (a.condition_type !== 'user_selection' && b.condition_type === 'user_selection') return -1;
      if (a.condition_type === 'user_selection' && b.condition_type !== 'user_selection') return 1;
      return a.link_order - b.link_order;
    });

    currentId = sortedLinks[0]?.target_passage_id || null;
  }

  return path;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  currentStory: null,
  storyStructure: null,
  mainPath: [],
  currentPassage: null,
  previousPassageId: null,
  navigationHistory: [],
  navigationHistoryWithNames: [],
  currentHistoryIndex: -1,
  bookmarks: [],
  isLoading: false,

  fetchStories: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/stories');
      set({ stories: response.data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStory: async (storyId: string) => {
    const response = await api.get(`/stories/${storyId}`);
    set({ currentStory: response.data });
  },

  fetchStoryStructure: async (storyId: string) => {
    try {
      const response = await api.get(`/stories/structure/${storyId}`);
      const structure = response.data as StoryWithPassages;
      const mainPath = computeMainPath(structure);
      set({ storyStructure: structure, mainPath });
    } catch (error) {
      console.error('Failed to fetch story structure:', error);
    }
  },

  startStory: async (storyId: string) => {
    set({ isLoading: true });
    try {
      await get().fetchStory(storyId);
      const response = await api.get(`/stories/${storyId}/start`);
      const passage = response.data.passage;
      set({
        currentPassage: response.data,
        previousPassageId: null,
        navigationHistory: [passage.id],
        navigationHistoryWithNames: [{ id: passage.id, name: passage.name }],
        currentHistoryIndex: 0,
      });
      get().saveLastVisit();
    } finally {
      set({ isLoading: false });
    }
  },

  loadPassageById: async (passageId: string, updateHistory = true) => {
    set({ isLoading: true });
    try {
      // First get the passage to find its story
      const response = await api.get(`/passages/${passageId}`);
      const passage = response.data.passage;
      const storyId = passage.story_id;

      // Load story if not already loaded or different
      const currentStory = get().currentStory;
      if (!currentStory || currentStory.id !== storyId) {
        await get().fetchStory(storyId);
      }

      if (updateHistory) {
        set((state) => {
          return {
            currentPassage: response.data,
            previousPassageId: state.currentPassage?.passage.id || null,
            navigationHistory: [...state.navigationHistory, passage.id],
            navigationHistoryWithNames: [...state.navigationHistoryWithNames, { id: passage.id, name: passage.name }],
            currentHistoryIndex: state.navigationHistoryWithNames.length,
          };
        });
      } else {
        set({
          currentPassage: response.data,
        });
      }
      get().saveLastVisit();
    } finally {
      set({ isLoading: false });
    }
  },

  loadPassageByNumber: async (passageNumber: number, storyId: string) => {
    set({ isLoading: true });
    try {
      // Resolve passage number to passage ID using resolve API
      const reference = `#${passageNumber.toString().padStart(6, '0')}`;
      const response = await api.get(`/passages/resolve`, {
        params: {
          story_id: storyId,
          reference: reference,
        },
      });

      const passage = response.data.passage;

      // Load story if not already loaded or different
      const currentStory = get().currentStory;
      if (!currentStory || currentStory.id !== storyId) {
        await get().fetchStory(storyId);
      }

      // Set current passage without updating history (direct URL access)
      set({
        currentPassage: response.data,
        previousPassageId: null,
        navigationHistory: [passage.id],
        navigationHistoryWithNames: [{ id: passage.id, name: passage.name }],
        currentHistoryIndex: 0,
      });
      get().saveLastVisit();
    } finally {
      set({ isLoading: false });
    }
  },

  navigateToPassage: async (passageIdOrName: string, prevPassageId?: string) => {
    set({ isLoading: true });
    try {
      const prev = prevPassageId || get().currentPassage?.passage.id;
      const storyId = get().currentStory?.id;

      // Check if it's a UUID (passage ID) or a name
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        passageIdOrName
      );

      let response;
      if (isUuid) {
        response = await api.get(`/passages/${passageIdOrName}`, {
          params: { previous_passage_id: prev },
        });
      } else {
        // Navigate by name - need to find the passage first
        response = await api.get(`/stories/${storyId}/passages/by-name/${encodeURIComponent(passageIdOrName)}`, {
          params: { previous_passage_id: prev },
        });
      }

      const passage = response.data.passage;
      set((state) => {
        // Don't truncate - keep all history and append new navigation
        return {
          currentPassage: response.data,
          previousPassageId: prev || null,
          navigationHistory: [...state.navigationHistory, passage.id],
          navigationHistoryWithNames: [...state.navigationHistoryWithNames, { id: passage.id, name: passage.name }],
          currentHistoryIndex: state.navigationHistoryWithNames.length,
        };
      });
      get().saveLastVisit();
    } finally {
      set({ isLoading: false });
    }
  },

  navigateViaLink: async (linkId: string) => {
    const currentPassageId = get().currentPassage?.passage.id;
    if (!currentPassageId) return;

    set({ isLoading: true });
    try {
      const response = await api.post(`/passages/${currentPassageId}/navigate`, {
        link_id: linkId,
      });
      const passage = response.data.passage;
      set((state) => {
        // Don't truncate - keep all history and append new navigation
        return {
          currentPassage: response.data,
          previousPassageId: currentPassageId,
          navigationHistory: [...state.navigationHistory, passage.id],
          navigationHistoryWithNames: [...state.navigationHistoryWithNames, { id: passage.id, name: passage.name }],
          currentHistoryIndex: state.navigationHistoryWithNames.length,
        };
      });
      get().saveLastVisit();
    } finally {
      set({ isLoading: false });
    }
  },

  goBack: async () => {
    const currentIndex = get().currentHistoryIndex;
    if (currentIndex <= 0) return;

    const newIndex = currentIndex - 1;
    const historyWithNames = get().navigationHistoryWithNames;
    const prevIndex = newIndex > 0 ? newIndex - 1 : undefined;
    const prevPassageId = prevIndex !== undefined ? historyWithNames[prevIndex].id : undefined;
    const passageId = historyWithNames[newIndex].id;

    set({ isLoading: true });
    try {
      const response = await api.get(`/passages/${passageId}`, {
        params: { previous_passage_id: prevPassageId },
      });
      set({
        currentPassage: response.data,
        previousPassageId: prevPassageId || null,
        currentHistoryIndex: newIndex,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  navigateToHistoryIndex: async (index: number) => {
    const historyWithNames = get().navigationHistoryWithNames;
    if (index < 0 || index >= historyWithNames.length) return;

    const prevIndex = index > 0 ? index - 1 : undefined;
    const prevPassageId = prevIndex !== undefined ? historyWithNames[prevIndex].id : undefined;
    const passageId = historyWithNames[index].id;

    set({ isLoading: true });
    try {
      const response = await api.get(`/passages/${passageId}`, {
        params: { previous_passage_id: prevPassageId },
      });
      set({
        currentPassage: response.data,
        previousPassageId: prevPassageId || null,
        currentHistoryIndex: index,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  navigateToMainPathIndex: async (index: number) => {
    const mainPath = get().mainPath;
    if (index < 0 || index >= mainPath.length) return;

    const passageId = mainPath[index].id;
    const prevPassageId = index > 0 ? mainPath[index - 1].id : undefined;

    set({ isLoading: true });
    try {
      const response = await api.get(`/passages/${passageId}`, {
        params: { previous_passage_id: prevPassageId },
      });
      const passage = response.data.passage;

      // Update navigation history to reflect this jump
      // Build history from start to this point in main path
      const newHistory = mainPath.slice(0, index + 1).map(p => p.id);
      const newHistoryWithNames = mainPath.slice(0, index + 1).map(p => ({ id: p.id, name: p.name }));

      set({
        currentPassage: response.data,
        previousPassageId: prevPassageId || null,
        navigationHistory: newHistory,
        navigationHistoryWithNames: newHistoryWithNames,
        currentHistoryIndex: index,
      });
      get().saveLastVisit();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBookmarks: async () => {
    try {
      const response = await api.get('/bookmarks');
      set({ bookmarks: response.data });
    } catch {
      // Not authenticated
    }
  },

  addBookmark: async (passageId: string) => {
    await api.post(`/bookmarks/${passageId}`);
    await get().fetchBookmarks();
  },

  removeBookmark: async (passageId: string) => {
    await api.delete(`/bookmarks/${passageId}`);
    await get().fetchBookmarks();
  },

  saveLastVisit: () => {
    const { currentStory, currentPassage } = get();
    if (currentStory && currentPassage) {
      localStorage.setItem(
        'last_visit',
        JSON.stringify({
          storyId: currentStory.id,
          passageId: currentPassage.passage.id,
          timestamp: Date.now(),
        })
      );
    }
  },

  getLastVisit: () => {
    const data = localStorage.getItem('last_visit');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  refreshCurrentPassage: async () => {
    const currentPassage = get().currentPassage;
    const previousPassageId = get().previousPassageId;
    if (!currentPassage) return;

    try {
      const response = await api.get(`/passages/${currentPassage.passage.id}`, {
        params: { previous_passage_id: previousPassageId },
      });
      set({ currentPassage: response.data });
    } catch (error) {
      console.error('Failed to refresh passage:', error);
    }
  },
}));
