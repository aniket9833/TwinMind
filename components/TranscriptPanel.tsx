'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptChunk } from '@/lib/types';
import MicButton from './MicButton';

interface TranscriptPanelProps {
  transcript: TranscriptChunk[];
  isRecording: boolean;
  isTranscribing: boolean;
  countdown: number;
  onToggleMic: () => void;
}

export default function TranscriptPanel({
  transcript,
  isRecording,
  isTranscribing,
  countdown,
  onToggleMic,
}: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffffff0d]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#55555f] uppercase tracking-widest">
            01
          </span>
          <span className="text-xs font-medium text-[#9090a8] uppercase tracking-wider">
            Mic &amp; Transcript
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="text-[10px] font-mono text-[#9090a8]">
              next chunk in {countdown}s
            </span>
          )}
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
              isRecording
                ? 'text-red-400 bg-red-400/10'
                : 'text-[#55555f] bg-[#ffffff08]'
            }`}
          >
            {isRecording ? 'REC' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Mic controls */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#ffffff0d]">
        <MicButton
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onClick={onToggleMic}
        />
        <div className="text-xs text-[#55555f]">
          {isRecording
            ? isTranscribing
              ? 'Transcribing chunk...'
              : 'Recording — transcript appends every ~30s'
            : 'Click mic to start recording'}
        </div>
      </div>

      {/* Transcript body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none">
        {transcript.length === 0 ? (
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
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <p className="text-xs text-[#55555f]">No transcript yet</p>
            <p className="text-[10px] text-[#3a3a45]">Start the mic to begin</p>
          </div>
        ) : (
          transcript.map((chunk) => (
            <div key={chunk.id} className="animate-fade-in">
              <div className="text-[10px] font-mono text-[#55555f] mb-1">
                {chunk.timestamp}
              </div>
              <p className="text-sm text-[#c0c0cc] leading-relaxed">
                {chunk.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
