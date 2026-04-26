'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/types';
import { SUGGESTION_TYPE_META } from '@/lib/prompts';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string, isDetail?: boolean) => void;
}

export default function ChatPanel({
  messages,
  isLoading,
  onSend,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text, false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffffff0d]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#55555f] uppercase tracking-widest">
            03
          </span>
          <span className="text-xs font-medium text-[#9090a8] uppercase tracking-wider">
            Chat
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#55555f]">
          session-only
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-none">
        {messages.length === 0 && (
          <div className="text-xs text-[#55555f] leading-relaxed bg-[#ffffff05] border border-[#ffffff0d] rounded-lg p-3">
            Click a suggestion to get a detailed answer, or type a question
            directly.
            <br />
            <span className="text-[#3a3a45]">
              Chat uses full transcript context. No login, no persistence.
            </span>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#ffffff0d]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-grow up to 5 lines
              e.target.style.height = 'auto';
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            disabled={isLoading}
            className={`
              flex-1 resize-none bg-[#1c1c25] border border-[#ffffff14]
              rounded-lg px-3 py-2.5 text-sm text-[#f0f0f5] placeholder-[#55555f]
              focus:outline-none focus:border-[#ffffff28]
              transition-colors scrollbar-none
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center
              transition-all duration-150
              ${
                input.trim() && !isLoading
                  ? 'bg-[#00d4ff10] border-[#00d4ff30] text-[#00d4ff] hover:bg-[#00d4ff20] active:scale-95'
                  : 'bg-[#ffffff05] border-[#ffffff0d] text-[#55555f] cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  // Detect if this was triggered from a suggestion type
  const typeMatch = Object.entries(SUGGESTION_TYPE_META).find(([key]) =>
    message.content.startsWith(`[${key}]`),
  );
  const displayContent = typeMatch
    ? message.content.replace(`[${typeMatch[0]}] `, '')
    : message.content;
  const typeMeta = typeMatch ? typeMatch[1] : null;

  return (
    <div
      className={`flex flex-col gap-1 animate-fade-in ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className="flex items-center gap-1.5">
        {typeMeta && (
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: typeMeta.color }}
          >
            {typeMeta.label}
          </span>
        )}
        <span className="text-[10px] font-mono text-[#3a3a45]">
          {isUser ? 'you' : 'assistant'} · {message.timestamp}
        </span>
      </div>

      <div
        className={`
          max-w-[92%] rounded-lg px-3 py-2.5 text-sm leading-relaxed
          ${
            isUser
              ? 'bg-[#ffffff0d] border border-[#ffffff14] text-[#d0d0da] text-right'
              : 'bg-[#1c1c25] border border-[#ffffff0d] text-[#c8c8d4]'
          }
          ${message.isStreaming ? 'typing-cursor' : ''}
        `}
      >
        {isUser ? (
          <span>{displayContent}</span>
        ) : (
          <SimpleMarkdown content={displayContent} />
        )}
      </div>
    </div>
  );
}

// Lightweight markdown renderer — no external deps
function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H2/H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={i}
          className="text-xs font-semibold text-[#f0f0f5] mt-3 mb-1 uppercase tracking-wider"
        >
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-sm font-semibold text-[#f0f0f5] mt-3 mb-1">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-sm font-bold text-[#f0f0f5] mt-2 mb-1">
          {line.slice(2)}
        </h1>,
      );
    }
    // Bullet lists
    else if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 space-y-0.5 pl-3">
          {items.map((item, j) => (
            <li key={j} className="flex gap-1.5 text-[13px]">
              <span className="text-[#55555f] mt-0.5 flex-shrink-0">·</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    // Numbered lists
    else if (line.match(/^\d+\. /)) {
      const items: { num: string; text: string }[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        const m = lines[i].match(/^(\d+)\. (.*)/)!;
        items.push({ num: m[1], text: m[2] });
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-1.5 space-y-0.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-[13px]">
              <span className="text-[#55555f] flex-shrink-0 font-mono text-[11px] mt-0.5">
                {item.num}.
              </span>
              <span
                dangerouslySetInnerHTML={{ __html: inlineFormat(item.text) }}
              />
            </li>
          ))}
        </ol>,
      );
      continue;
    }
    // Code blocks
    else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-2 px-3 py-2 rounded bg-[#ffffff08] border border-[#ffffff0d] text-[11px] font-mono text-[#a0d4b4] overflow-x-auto scrollbar-none"
        >
          {codeLines.join('\n')}
        </pre>,
      );
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      elements.push(<hr key={i} className="my-2 border-[#ffffff0d]" />);
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
    }
    // Normal paragraph
    else {
      elements.push(
        <p
          key={i}
          className="text-[13px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />,
      );
    }

    i++;
  }

  return <div className="prose-chat space-y-0.5">{elements}</div>;
}

function inlineFormat(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="text-[#f0f0f5] font-semibold">$1</strong>',
    )
    .replace(/\*(.+?)\*/g, '<em class="text-[#d0d0da]">$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code class="font-mono text-[11px] bg-[#ffffff0d] px-1 py-0.5 rounded text-[#a0d4b4]">$1</code>',
    );
}
