'use client';

import { create } from 'zustand';
import type {
  TranscriptChunk,
  SuggestionBatch,
  ChatMessage,
  AppSettings,
} from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/prompts';

interface SessionState {
  // Data
  transcript: TranscriptChunk[];
  suggestionBatches: SuggestionBatch[];
  chatMessages: ChatMessage[];
  settings: AppSettings;

  // UI state
  isRecording: boolean;
  isTranscribing: boolean;
  isSuggestionsLoading: boolean;
  isChatLoading: boolean;
  lastRefreshAt: Date | null;
  settingsOpen: boolean;
  countdown: number;

  // Actions
  appendTranscript: (chunk: TranscriptChunk) => void;
  prependBatch: (batch: SuggestionBatch) => void;
  addChatMessage: (msg: ChatMessage) => void;
  updateLastChatMessage: (content: string, done?: boolean) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  setRecording: (v: boolean) => void;
  setTranscribing: (v: boolean) => void;
  setSuggestionsLoading: (v: boolean) => void;
  setChatLoading: (v: boolean) => void;
  setLastRefreshAt: (d: Date) => void;
  setSettingsOpen: (v: boolean) => void;
  setCountdown: (v: number) => void;
  clearSession: () => void;
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem('twinmind_settings');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  transcript: [],
  suggestionBatches: [],
  chatMessages: [],
  settings: DEFAULT_SETTINGS,
  isRecording: false,
  isTranscribing: false,
  isSuggestionsLoading: false,
  isChatLoading: false,
  lastRefreshAt: null,
  settingsOpen: false,
  countdown: 30,

  appendTranscript: (chunk) =>
    set((s) => ({ transcript: [...s.transcript, chunk] })),

  prependBatch: (batch) =>
    set((s) => ({ suggestionBatches: [batch, ...s.suggestionBatches] })),

  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  updateLastChatMessage: (content, done = false) =>
    set((s) => {
      const msgs = [...s.chatMessages];
      if (msgs.length === 0) return {};
      const last = { ...msgs[msgs.length - 1], content };
      if (done) last.isStreaming = false;
      msgs[msgs.length - 1] = last;
      return { chatMessages: msgs };
    }),

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    if (typeof window !== 'undefined') {
      localStorage.setItem('twinmind_settings', JSON.stringify(next));
    }
  },

  setRecording: (v) => set({ isRecording: v }),
  setTranscribing: (v) => set({ isTranscribing: v }),
  setSuggestionsLoading: (v) => set({ isSuggestionsLoading: v }),
  setChatLoading: (v) => set({ isChatLoading: v }),
  setLastRefreshAt: (d) => set({ lastRefreshAt: d }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setCountdown: (v) => set({ countdown: v }),

  clearSession: () =>
    set({
      transcript: [],
      suggestionBatches: [],
      chatMessages: [],
      lastRefreshAt: null,
      countdown: 30,
    }),
}));

// Hydrate settings from localStorage after mount
export function hydrateSettings() {
  const s = loadSettings();
  useSessionStore.getState().updateSettings(s);
}
