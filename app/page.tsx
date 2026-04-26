'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore, hydrateSettings } from '@/store/useSessionStore';
import TranscriptPanel from '@/components/TranscriptPanel';
import SuggestionPanel from '@/components/SuggestionPanel';
import ChatPanel from '@/components/ChatPanel';
import SettingsModal from '@/components/SettingsModal';
import {
  startRecording,
  blobToFile,
  type RecorderHandle,
} from '@/lib/transcript';
import { buildExportText, buildExportJson, downloadFile } from '@/lib/export';
import type {
  Suggestion,
  SuggestionBatch,
  TranscriptChunk,
  ChatMessage,
} from '@/lib/types';

const REFRESH_INTERVAL = 30;

export default function Home() {
  const store = useSessionStore();
  const recorderRef = useRef<RecorderHandle | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const startCountdownRef = useRef<(() => void) | null>(null);
  const pendingChunksRef = useRef<Blob[]>([]);

  // Hydrate settings from localStorage on mount
  useEffect(() => {
    hydrateSettings();
  }, []);

  // Show settings modal on first load if no API key
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!store.settings.groqApiKey) {
        store.setSettingsOpen(true);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Transcription ─────────────────────────────────────────────────────────

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      if (!store.settings.groqApiKey) return;
      store.setTranscribing(true);
      try {
        const file = blobToFile(blob, 'audio.webm');
        const form = new FormData();
        form.append('audio', file);

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'x-groq-key': store.settings.groqApiKey },
          body: form,
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (data.text?.trim()) {
          const chunk: TranscriptChunk = {
            id: `t-${Date.now()}`,
            text: data.text.trim(),
            timestamp: new Date().toLocaleTimeString(),
          };
          store.appendTranscript(chunk);
        }
      } catch (err) {
        console.error('Transcribe error:', err);
      } finally {
        store.setTranscribing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.settings.groqApiKey],
  );

  // ── Suggestions ───────────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(
    async (currentTranscript?: TranscriptChunk[]) => {
      const transcript = currentTranscript ?? store.transcript;
      if (!store.settings.groqApiKey || transcript.length === 0) return;

      store.setSuggestionsLoading(true);
      try {
        const previousBatch = store.suggestionBatches[0]?.suggestions ?? [];

        const res = await fetch('/api/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-groq-key': store.settings.groqApiKey,
          },
          body: JSON.stringify({
            transcript,
            previousBatch,
            settings: {
              suggestionContextLines: store.settings.suggestionContextLines,
              suggestionMaxTokens: store.settings.suggestionMaxTokens,
              suggestionPrompt: store.settings.suggestionPrompt,
            },
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (data.suggestions?.length > 0) {
          const batch: SuggestionBatch = {
            id: `b-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            suggestions: data.suggestions,
          };
          store.prependBatch(batch);
          store.setLastRefreshAt(new Date());
        }
      } catch (err) {
        console.error('Suggestions error:', err);
      } finally {
        store.setSuggestionsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.settings, store.transcript, store.suggestionBatches],
  );

  // ── Auto-refresh countdown ────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoRefreshRef.current) clearTimeout(autoRefreshRef.current);

    store.setCountdown(REFRESH_INTERVAL);

    countdownRef.current = setInterval(() => {
      useSessionStore.setState((s) => ({
        countdown: Math.max(0, s.countdown - 1),
      }));
    }, 1000);

    autoRefreshRef.current = setTimeout(async () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      // Flush any pending audio chunk
      if (pendingChunksRef.current.length > 0) {
        const blob = pendingChunksRef.current.shift()!;
        await transcribeBlob(blob);
      }
      await fetchSuggestions();
      startCountdownRef.current?.(); // restart cycle with latest callback
    }, REFRESH_INTERVAL * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcribeBlob, fetchSuggestions]);

  useEffect(() => {
    startCountdownRef.current = startCountdown;
  }, [startCountdown]);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoRefreshRef.current) clearTimeout(autoRefreshRef.current);
  }, []);

  // ── Mic toggle ────────────────────────────────────────────────────────────

  const handleToggleMic = useCallback(async () => {
    if (!store.settings.groqApiKey) {
      store.setSettingsOpen(true);
      return;
    }

    if (store.isRecording) {
      // Stop recording
      recorderRef.current?.stop();
      recorderRef.current = null;
      store.setRecording(false);
      stopCountdown();
      store.setCountdown(REFRESH_INTERVAL);
    } else {
      // Start recording
      try {
        recorderRef.current = await startRecording((blob) => {
          pendingChunksRef.current.push(blob);
        }, REFRESH_INTERVAL * 1000);
        store.setRecording(true);
        startCountdown();
      } catch (err) {
        console.error('Mic error:', err);
        alert('Could not access microphone. Please check browser permissions.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    store.isRecording,
    store.settings.groqApiKey,
    startCountdown,
    stopCountdown,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      stopCountdown();
    };
  }, [stopCountdown]);

  // ── Manual refresh ────────────────────────────────────────────────────────

  const handleManualRefresh = useCallback(async () => {
    // Flush pending chunk first
    if (pendingChunksRef.current.length > 0) {
      const blob = pendingChunksRef.current.shift()!;
      await transcribeBlob(blob);
    }
    await fetchSuggestions();
    if (store.isRecording) {
      stopCountdown();
      startCountdown();
    }
  }, [
    transcribeBlob,
    fetchSuggestions,
    store.isRecording,
    stopCountdown,
    startCountdown,
  ]);

  // ── Chat / suggestion click ───────────────────────────────────────────────

  const handleChatSend = useCallback(
    async (text: string, isDetail = false) => {
      if (!store.settings.groqApiKey) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString(),
      };
      store.addChatMessage(userMsg);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
      };
      store.addChatMessage(assistantMsg);
      store.setChatLoading(true);

      try {
        const allMessages = [...store.chatMessages, userMsg].filter(
          (m) => !m.isStreaming,
        );

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-groq-key': store.settings.groqApiKey,
          },
          body: JSON.stringify({
            messages: allMessages,
            transcript: store.transcript,
            isDetailExpand: isDetail,
            settings: {
              chatContextLines: store.settings.chatContextLines,
              chatMaxTokens: store.settings.chatMaxTokens,
              chatPrompt: store.settings.chatPrompt,
              detailPrompt: store.settings.detailPrompt,
            },
          }),
        });

        if (!res.ok) throw new Error(await res.text());
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          store.updateLastChatMessage(accumulated);
        }

        store.updateLastChatMessage(accumulated, true);
      } catch (err) {
        console.error('Chat error:', err);
        store.updateLastChatMessage(
          'Sorry, something went wrong. Please check your API key and try again.',
          true,
        );
      } finally {
        store.setChatLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.settings, store.transcript, store.chatMessages],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      const text = `[${suggestion.type}] ${suggestion.detail_prompt || suggestion.preview}`;
      handleChatSend(text, true);
    },
    [handleChatSend],
  );

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = (format: 'json' | 'txt') => {
    const data = {
      transcript: store.transcript,
      suggestionBatches: store.suggestionBatches,
      chatMessages: store.chatMessages,
    };
    const ts = new Date()
      .toISOString()
      .slice(0, 16)
      .replace('T', '_')
      .replace(':', '-');
    if (format === 'json') {
      downloadFile(
        buildExportJson(data),
        `twinmind_${ts}.json`,
        'application/json',
      );
    } else {
      downloadFile(buildExportText(data), `twinmind_${ts}.txt`, 'text/plain');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Top nav */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#ffffff0d] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#00d4ff20] to-[#a855f720] border border-[#00d4ff20] flex items-center justify-center">
            <span className="text-[9px] font-bold text-[#00d4ff]">TM</span>
          </div>
          <span className="text-sm font-semibold text-[#f0f0f5] tracking-tight">
            TwinMind
          </span>
          <span className="text-[10px] text-[#55555f] font-mono">
            live copilot
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Export */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('txt')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-[#9090a8]
                border border-[#ffffff0d] hover:border-[#ffffff1a] hover:text-[#f0f0f5]
                hover:bg-[#ffffff05] transition-all active:scale-95"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export TXT
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-[#9090a8]
                border border-[#ffffff0d] hover:border-[#ffffff1a] hover:text-[#f0f0f5]
                hover:bg-[#ffffff05] transition-all active:scale-95"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export JSON
            </button>
          </div>

          {/* Clear */}
          <button
            onClick={() => {
              if (confirm('Clear this session? Recording will stop.')) {
                recorderRef.current?.stop();
                recorderRef.current = null;
                stopCountdown();
                store.clearSession();
                store.setRecording(false);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-[#55555f]
              border border-[#ffffff0d] hover:border-[#ef444430] hover:text-[#ef4444]
              hover:bg-[#ef444408] transition-all active:scale-95"
          >
            Clear
          </button>

          {/* Settings */}
          <button
            onClick={() => store.setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px]
              border transition-all active:scale-95
              text-[#9090a8] border-[#ffffff0d] hover:border-[#ffffff1a]
              hover:text-[#f0f0f5] hover:bg-[#ffffff05]"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
            {!store.settings.groqApiKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] ml-0.5" />
            )}
          </button>
        </div>
      </header>

      {/* 3-column layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Column 1 — Transcript */}
        <div className="w-[30%] min-w-[240px] border-r border-[#ffffff0d] flex flex-col overflow-hidden">
          <TranscriptPanel
            transcript={store.transcript}
            isRecording={store.isRecording}
            isTranscribing={store.isTranscribing}
            countdown={store.countdown}
            onToggleMic={handleToggleMic}
          />
        </div>

        {/* Column 2 — Suggestions */}
        <div className="w-[35%] min-w-[280px] border-r border-[#ffffff0d] flex flex-col overflow-hidden">
          <SuggestionPanel
            batches={store.suggestionBatches}
            isLoading={store.isSuggestionsLoading}
            isRecording={store.isRecording}
            countdown={store.countdown}
            onRefresh={handleManualRefresh}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>

        {/* Column 3 — Chat */}
        <div className="flex-1 min-w-[280px] flex flex-col overflow-hidden">
          <ChatPanel
            messages={store.chatMessages}
            isLoading={store.isChatLoading}
            onSend={handleChatSend}
          />
        </div>
      </main>

      {/* Settings modal */}
      {store.settingsOpen && (
        <SettingsModal
          settings={store.settings}
          onSave={store.updateSettings}
          onClose={() => store.setSettingsOpen(false)}
          isFirstOpen={!store.settings.groqApiKey}
        />
      )}
    </div>
  );
}
