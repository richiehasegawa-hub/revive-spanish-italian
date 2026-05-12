import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export const CLAUDE_MODEL = 'claude-sonnet-4-6';

export const CLAUDE_PARAMS = {
  conversation: {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    temperature: 0.8,
  },
  evaluation: {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    temperature: 0.1,
  },
} as const;
