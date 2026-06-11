// Tool definitions — shared types + per-provider format converters

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, any>;
};

export type ToolResult = {
  id: string;
  result: string;       // sent back to the model
  displayText: string;  // shown in the UI
};

// ── Format converters ──────────────────────────────────────────────────────

export function toAnthropicTool(def: ToolDefinition) {
  return { name: def.name, description: def.description, input_schema: def.parameters };
}

export function toOpenAITool(def: ToolDefinition) {
  return {
    type: 'function' as const,
    function: { name: def.name, description: def.description, parameters: def.parameters },
  };
}

// ── Tool definitions ────────────────────────────────────────────────────────

export const TOOL_CALCULATE: ToolDefinition = {
  name: 'calculate',
  description: 'Evaluate a mathematical expression. Use for arithmetic, algebra, or any numeric computation.',
  parameters: {
    type: 'object',
    properties: { expression: { type: 'string', description: 'Math expression (e.g. "sqrt(144) + 5^2")' } },
    required: ['expression'],
  },
};

export const TOOL_WEB_SEARCH: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for current information, news, facts, or recent events. Use when the user needs information beyond your training data.',
  parameters: {
    type: 'object',
    properties: { query: { type: 'string', description: 'The search query' } },
    required: ['query'],
  },
};

export const TOOL_READ_URL: ToolDefinition = {
  name: 'read_url',
  description: 'Fetch and read the content of a webpage. Use when the user shares a link or asks you to read or summarize a specific page.',
  parameters: {
    type: 'object',
    properties: { url: { type: 'string', description: 'Full URL to fetch (must start with https://)' } },
    required: ['url'],
  },
};

export const TOOL_SAVE_INSIGHT: ToolDefinition = {
  name: 'save_insight',
  description: "Save an important insight, realization, or piece of information to the user's Sanctum Vault. Use when the user explicitly asks to save something, or when a key insight emerges that they should keep.",
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Short title for the insight (under 60 chars)' },
      content: { type: 'string', description: 'The insight content to save' },
    },
    required: ['title', 'content'],
  },
};

export const TOOL_GET_DATETIME: ToolDefinition = {
  name: 'get_datetime',
  description: 'Get the current date, time, day of week, and the user app context. Use when the user asks about the date or time, or when temporal context matters.',
  parameters: { type: 'object', properties: {}, required: [] },
};

export const TOOL_SEARCH_SUBJECTS: ToolDefinition = {
  name: 'search_subjects',
  description: 'Search the Mystery School subject library by keyword. Use when the user asks what topics are available to study or wants to find a specific subject.',
  parameters: {
    type: 'object',
    properties: { keyword: { type: 'string', description: 'Keyword to search for in subject titles and descriptions' } },
    required: ['keyword'],
  },
};

export const TOOL_WIKIPEDIA: ToolDefinition = {
  name: 'wikipedia_search',
  description: 'Search Wikipedia for encyclopedic information on any topic — history, science, philosophy, people, places, concepts. Use when the user asks about something that benefits from deep, structured knowledge.',
  parameters: {
    type: 'object',
    properties: { query: { type: 'string', description: 'The topic or concept to look up on Wikipedia' } },
    required: ['query'],
  },
};

export const TOOL_DUCKDUCKGO: ToolDefinition = {
  name: 'duckduckgo_instant',
  description: 'Get a fast instant answer from DuckDuckGo for definitions, quick facts, disambiguation, and general knowledge. Use for quick factual checks where a short answer is enough.',
  parameters: {
    type: 'object',
    properties: { query: { type: 'string', description: 'The question or topic to look up' } },
    required: ['query'],
  },
};

// ── Active tool list ────────────────────────────────────────────────────────

export function getActiveTools(opts: { hasBraveKey: boolean }): ToolDefinition[] {
  const tools: ToolDefinition[] = [
    TOOL_WIKIPEDIA,
    TOOL_DUCKDUCKGO,
    TOOL_CALCULATE,
    TOOL_GET_DATETIME,
    TOOL_READ_URL,
    TOOL_SAVE_INSIGHT,
    TOOL_SEARCH_SUBJECTS,
  ];
  if (opts.hasBraveKey) tools.unshift(TOOL_WEB_SEARCH);
  return tools;
}

// Human-readable display names for UI indicators
export const TOOL_DISPLAY: Record<string, string> = {
  calculate: '◈ Calculating',
  web_search: '⟁ Searching web',
  read_url: '→ Reading page',
  save_insight: '⊛ Saving insight',
  get_datetime: '⧖ Getting context',
  search_subjects: '✧ Searching subjects',
  wikipedia_search: '⊙ Wikipedia',
  duckduckgo_instant: '→ Instant answer',
};
