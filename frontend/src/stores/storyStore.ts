import { create } from 'zustand';
import api from '../services/api';
import type { Story, PassageWithContext, Bookmark } from '../types';

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  currentPassage: PassageWithContext | null;
  previousPassageId: string | null;
  navigationHistory: string[];
  bookmarks: Bookmark[];
  isLoading: boolean;

  fetchStories: () => Promise<void>;
  fetchStory: (storyId: string) => Promise<void>;
  startStory: (storyId: string) => Promise<void>;
  navigateToPassage: (passageIdOrName: string, prevPassageId?: string) => Promise<void>;
  navigateViaLink: (linkId: string) => Promise<void>;
  goBack: () => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  addBookmark: (passageId: string) => Promise<void>;
  removeBookmark: (passageId: string) => Promise<void>;
  saveLastVisit: () => void;
  getLastVisit: () => { storyId: string; passageId: string } | null;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  currentStory: null,
  currentPassage: null,
  previousPassageId: null,
  navigationHistory: [],
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

  startStory: async (storyId: string) => {
    set({ isLoading: true });
    try {
      await get().fetchStory(storyId);
      const response = await api.get(`/stories/${storyId}/start`);
      set({
        currentPassage: response.data,
        previousPassageId: null,
        navigationHistory: [response.data.passage.id],
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

      set((state) => ({
        currentPassage: response.data,
        previousPassageId: prev || null,
        navigationHistory: [...state.navigationHistory, response.data.passage.id],
      }));
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
      set((state) => ({
        currentPassage: response.data,
        previousPassageId: currentPassageId,
        navigationHistory: [...state.navigationHistory, response.data.passage.id],
      }));
      get().saveLastVisit();
    } finally {
      set({ isLoading: false });
    }
  },

  goBack: async () => {
    const history = get().navigationHistory;
    if (history.length <= 1) return;

    const newHistory = history.slice(0, -1);
    const prevPassageId = newHistory[newHistory.length - 2];
    const passageId = newHistory[newHistory.length - 1];

    set({ isLoading: true });
    try {
      const response = await api.get(`/passages/${passageId}`, {
        params: { previous_passage_id: prevPassageId },
      });
      set({
        currentPassage: response.data,
        previousPassageId: prevPassageId || null,
        navigationHistory: newHistory,
      });
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
}));
