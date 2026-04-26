'use client';

import { useRef, useEffect } from 'react';
import type { SuggestionBatch, Suggestion } from '@/lib/types';
import { SUGGESTION_TYPE_META } from '@/lib/prompts';

interface SuggestionPanelProps {
  batches: SuggestionBatch[];
  isLoading: boolean;
  isRecording: boolean;
  countdown: number;
  onRefresh: () => void;
  onSuggestionClick: (s: Suggestion) => void;
}

export default function SuggestionPanel({
  batches,
  isLoading,
  isRecording,
  countdown,
  onRefresh,
  onSuggestionClick,
}: SuggestionPanelProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const prevBatchCount = useRef(batches.length);

  useEffect(() => {
    if (batches.length > prevBatchCount.current) {
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevBatchCount.current = batches.length;
  }, [batches.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffffff0d]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#55555f] uppercase tracking-widest">
            02
          </span>
          <span className="text-xs font-medium text-[#9090a8] uppercase tracking-wider">
            Live Suggestions
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#55555f]">
          {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
        </span>
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#ffffff0d]">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-xs
            border border-[#ffffff14] transition-all duration-150
            ${
              isLoading
                ? 'opacity-50 cursor-not-allowed text-[#55555f]'
                : 'text-[#9090a8] hover:text-[#f0f0f5] hover:border-[#ffffff28] hover:bg-[#ffffff08] active:scale-95'
            }
          `}
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reload suggestions
        </button>

        {isRecording && !isLoading && (
          <span className="text-[10px] font-mono text-[#55555f]">
            auto-refresh in {countdown}s
          </span>
        )}
        {isLoading && (
          <span className="text-[10px] font-mono text-[#00d4ff] animate-pulse">
            generating...
          </span>
        )}
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 scrollbar-none">
        <div ref={topRef} />

        {batches.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-10 h-10 rounded-full border border-[#ffffff0d] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#55555f]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <p className="text-xs text-[#55555f]">No suggestions yet</p>
            <p className="text-[10px] text-[#3a3a45]">
              Start recording and click Reload
            </p>
          </div>
        )}

        {isLoading && batches.length === 0 && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {batches.map((batch, batchIdx) => (
          <div key={batch.id} className="space-y-2">
            {/* Batch header */}
            <div className="flex items-center gap-2">
              {batchIdx === 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00d4ff10] text-[#00d4ff] border border-[#00d4ff20] uppercase tracking-wider">
                  Latest
                </span>
              )}
              <span className="text-[10px] font-mono text-[#3a3a45]">
                {batch.timestamp}
              </span>
            </div>

            {/* Cards */}
            <div className={`space-y-2 ${batchIdx > 0 ? 'opacity-60' : ''}`}>
              {batch.suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onClick={() => onSuggestionClick(suggestion)}
                  isFaded={batchIdx > 0}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onClick,
  isFaded,
}: {
  suggestion: Suggestion;
  onClick: () => void;
  isFaded: boolean;
}) {
  const meta =
    SUGGESTION_TYPE_META[suggestion.type] ??
    SUGGESTION_TYPE_META['TALKING_POINT'];

  return (
    <button
      onClick={onClick}
      className={`
        suggestion-card w-full text-left rounded-lg p-3
        border transition-all duration-150
        ${isFaded ? 'hover:opacity-80' : 'hover:bg-[#ffffff05]'}
        focus:outline-none focus:ring-1 focus:ring-[#ffffff15]
        animate-slide-down
      `}
      style={{
        background: meta.bg,
        borderColor: meta.border,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="text-[9px] font-mono uppercase tracking-widest font-medium"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
      </div>
      <p className="text-[13px] text-[#d0d0da] leading-snug font-medium">
        {suggestion.preview}
      </p>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] text-[#55555f]">
          Click for detailed answer
        </span>
        <svg
          className="w-3 h-3 text-[#55555f]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg p-3 border border-[#ffffff0d] bg-[#ffffff05] animate-pulse">
      <div className="h-2.5 w-20 bg-[#ffffff0d] rounded mb-2" />
      <div className="h-3.5 w-full bg-[#ffffff08] rounded mb-1" />
      <div className="h-3.5 w-4/5 bg-[#ffffff08] rounded" />
    </div>
  );
}
