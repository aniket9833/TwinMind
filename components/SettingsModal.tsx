'use client';

import { useState } from 'react';
import type { AppSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/prompts';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
  isFirstOpen: boolean;
}

type Tab = 'api' | 'prompts' | 'context';

export default function SettingsModal({
  settings,
  onSave,
  onClose,
  isFirstOpen,
}: SettingsModalProps) {
  const [draft, setDraft] = useState<AppSettings>(() => settings);
  const [tab, setTab] = useState<Tab>('api');
  const [keyVisible, setKeyVisible] = useState(false);

  function handleSave() {
    onSave(draft);
    onClose();
  }

  function handleReset() {
    setDraft({ ...DEFAULT_SETTINGS, groqApiKey: draft.groqApiKey });
  }

  const field = (
    key: keyof AppSettings,
    label: string,
    description: string,
    type: 'text' | 'number' | 'textarea' | 'password' = 'text',
  ) => (
    <div className="space-y-1.5">
      <div>
        <label className="text-xs font-medium text-[#c0c0cc]">{label}</label>
        <p className="text-[11px] text-[#55555f] mt-0.5">{description}</p>
      </div>
      {type === 'textarea' ? (
        <textarea
          value={String(draft[key])}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          rows={8}
          className="w-full bg-[#111118] border border-[#ffffff14] rounded-lg px-3 py-2 text-xs
            font-mono text-[#a0a0b8] placeholder-[#55555f] focus:outline-none
            focus:border-[#ffffff28] resize-y transition-colors scrollbar-none"
        />
      ) : type === 'number' ? (
        <input
          type="number"
          value={Number(draft[key])}
          onChange={(e) =>
            setDraft({ ...draft, [key]: Number(e.target.value) })
          }
          className="w-full bg-[#111118] border border-[#ffffff14] rounded-lg px-3 py-2 text-sm
            text-[#f0f0f5] focus:outline-none focus:border-[#ffffff28] transition-colors"
        />
      ) : type === 'password' ? (
        <div className="relative">
          <input
            type={keyVisible ? 'text' : 'password'}
            value={String(draft[key])}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            placeholder="gsk_..."
            className="w-full bg-[#111118] border border-[#ffffff14] rounded-lg px-3 py-2 pr-10
              text-sm text-[#f0f0f5] placeholder-[#55555f] focus:outline-none
              focus:border-[#ffffff28] font-mono transition-colors"
          />
          <button
            type="button"
            onClick={() => setKeyVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55555f] hover:text-[#9090a8]"
          >
            {keyVisible ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={String(draft[key])}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          className="w-full bg-[#111118] border border-[#ffffff14] rounded-lg px-3 py-2 text-sm
            text-[#f0f0f5] focus:outline-none focus:border-[#ffffff28] transition-colors"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#111118] border border-[#ffffff14] rounded-xl shadow-2xl animate-fade-in mx-4">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ffffff0d]">
          <div>
            <h2 className="text-sm font-semibold text-[#f0f0f5]">Settings</h2>
            {isFirstOpen && (
              <p className="text-xs text-[#f59e0b] mt-0.5">
                Add your Groq API key to get started
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#55555f] hover:text-[#9090a8] transition-colors p-1"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#ffffff0d] px-5">
          {(['api', 'prompts', 'context'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                px-4 py-2.5 text-xs font-medium uppercase tracking-wider border-b-2 transition-colors -mb-px
                ${
                  tab === t
                    ? 'border-[#00d4ff] text-[#00d4ff]'
                    : 'border-transparent text-[#55555f] hover:text-[#9090a8]'
                }
              `}
            >
              {t === 'api'
                ? 'API Key'
                : t === 'prompts'
                  ? 'Prompts'
                  : 'Context'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-none">
          {tab === 'api' && (
            <>
              {field(
                'groqApiKey',
                'Groq API Key',
                'Get your key at console.groq.com — stored in localStorage, never sent to our servers',
                'password',
              )}
              <div className="rounded-lg bg-[#f59e0b08] border border-[#f59e0b20] p-3 text-xs text-[#9090a8] leading-relaxed">
                <strong className="text-[#f59e0b]">Required models:</strong>{' '}
                Your key must have access to{' '}
                <code className="font-mono text-[#a0d4b4]">
                  whisper-large-v3
                </code>{' '}
                (transcription) and{' '}
                <code className="font-mono text-[#a0d4b4]">
                  meta-llama/llama-4-scout-17b-16e-instruct
                </code>{' '}
                (suggestions + chat). All Groq free-tier keys support these.
              </div>
            </>
          )}

          {tab === 'prompts' && (
            <>
              {field(
                'suggestionPrompt',
                'Live Suggestion Prompt',
                'System prompt for generating the 3 suggestion cards every 30s',
                'textarea',
              )}
              {field(
                'chatPrompt',
                'Chat Prompt',
                'System prompt for general chat questions typed by the user',
                'textarea',
              )}
              {field(
                'detailPrompt',
                'Detail Expand Prompt',
                'System prompt used when clicking a suggestion card for a detailed answer',
                'textarea',
              )}
              <button
                onClick={handleReset}
                className="text-xs text-[#55555f] hover:text-[#9090a8] underline underline-offset-2 transition-colors"
              >
                Reset all prompts to defaults
              </button>
            </>
          )}

          {tab === 'context' && (
            <div className="space-y-4">
              {field(
                'suggestionContextLines',
                'Suggestion context window (chunks)',
                'How many recent transcript chunks to send when generating suggestions. Higher = more context, slower.',
                'number',
              )}
              {field(
                'chatContextLines',
                'Chat context window (chunks)',
                'How many transcript chunks to include in chat API calls. Full session recommended.',
                'number',
              )}
              {field(
                'suggestionMaxTokens',
                'Suggestion max tokens',
                'Max tokens for the suggestion response (3 suggestions + JSON = ~400-600 tokens)',
                'number',
              )}
              {field(
                'chatMaxTokens',
                'Chat max tokens',
                'Max tokens for chat and detail expand responses',
                'number',
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#ffffff0d]">
          <button
            onClick={onClose}
            className="text-xs text-[#55555f] hover:text-[#9090a8] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!draft.groqApiKey.trim()}
            className={`
              px-5 py-2 rounded-lg text-xs font-medium transition-all duration-150
              ${
                draft.groqApiKey.trim()
                  ? 'bg-[#00d4ff15] border border-[#00d4ff30] text-[#00d4ff] hover:bg-[#00d4ff25] active:scale-95'
                  : 'bg-[#ffffff08] border border-[#ffffff0d] text-[#55555f] cursor-not-allowed'
              }
            `}
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
