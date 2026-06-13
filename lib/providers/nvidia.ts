import { Message } from '../ai-client';
import { AIProvider, TokenUsage, ResponseTimings } from './types';

const BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const NvidiaProvider: AIProvider = {
  id: 'nvidia',
  label: 'NVIDIA NIM',
  color: '#76B900',
  keyPlaceholder: 'nvapi-...',
  keyHint: 'Unlimited free prototyping · 28 models · build.nvidia.com/explore',
  models: [
    // ── Speed ──
    { id: 'meta/llama-3.1-8b-instruct',                      label: 'Llama 3.1 8B',         tier: 'free', note: 'FREE · Meta · Fastest · Light tasks' },
    { id: 'openai/gpt-oss-20b',                              label: 'GPT OSS 20B',          tier: 'free', note: 'FREE · OpenAI · Small MoE · Quick reasoning' },
    { id: 'stepfun-ai/step-3.7-flash',                       label: 'Step 3.7 Flash',       tier: 'free', note: 'FREE · StepFun · Fast · Multimodal · Coding' },
    { id: 'google/gemma-3n-e2b-it',                          label: 'Gemma 3n',             tier: 'free', note: 'FREE · Google · Edge · Multimodal lite' },
    { id: 'moonshotai/kimi-k2.6',                     label: 'Kimi K2',              tier: 'free', note: 'FREE · Moonshot · 1T MoE · Long-horizon · Default ✓' },
    // ── Reasoning ──
    { id: 'meta/llama-3.3-70b-instruct',                     label: 'Llama 3.3 70B',        tier: 'free', note: 'FREE · Meta · Reasoning · Math · Tool calling' },
    { id: 'google/gemma-4-31b-it',                           label: 'Gemma 4 31B',          tier: 'free', note: 'FREE · Google · Dense · Reasoning · Agentic' },
    { id: 'nvidia/llama-3.3-nemotron-super-49b-v1',          label: 'Nemotron Super 49B',   tier: 'free', note: 'FREE · NVIDIA · Tool calling · High efficiency' },
    { id: 'minimaxai/minimax-m2.7',                          label: 'MiniMax M2.7',         tier: 'free', note: 'FREE · MiniMax · 230B · Long reasoning' },
    { id: 'bytedance/seed-oss-36b-instruct',                 label: 'Seed 36B',             tier: 'free', note: 'FREE · ByteDance · Long-context · Agentic' },
    // ── Coding ──
    { id: 'mistralai/mistral-medium-3.5-128b',               label: 'Mistral Medium 3.5',   tier: 'free', note: 'FREE · Mistral · 128B · Best for code' },
    { id: 'mistralai/mistral-small-4-119b-2603',             label: 'Mistral Small 4',      tier: 'free', note: 'FREE · Mistral · 119B MoE · 256k ctx' },
    { id: 'qwen/qwen3.5-122b-a10b',                          label: 'Qwen3.5 122B',         tier: 'free', note: 'FREE · Alibaba · 122B MoE · Coding · Agent-ready' },
    { id: 'openai/gpt-oss-120b',                             label: 'GPT OSS 120B',         tier: 'free', note: 'FREE · OpenAI · 120B MoE · Reasoning' },
    { id: 'deepseek-ai/deepseek-v4-flash',                   label: 'DeepSeek V4 Flash',    tier: 'free', note: 'FREE · DeepSeek · 284B MoE · 1M ctx · Fast coding' },
    // ── Creative / Long ──
    { id: 'meta/llama-4-maverick-17b-128e-instruct',         label: 'Llama 4 Maverick',     tier: 'free', note: 'FREE · Meta · 128E MoE · Multimodal · Creative' },
    { id: 'qwen/qwen3-next-80b-a3b-instruct',                label: 'Qwen3-Next 80B',       tier: 'free', note: 'FREE · Alibaba · Ultra-long ctx · Storytelling' },
    // ── Vision ──
    { id: 'meta/llama-3.2-90b-vision-instruct',              label: 'Llama 3.2 90B Vision', tier: 'free', note: 'FREE · Meta · Vision-Language · Image reasoning' },
    { id: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',         label: 'Nemotron VL 8B',       tier: 'free', note: 'FREE · NVIDIA · Vision-Language · Fast' },
    { id: 'qwen/qwen3.5-397b-a17b',                          label: 'Qwen3.5 397B',         tier: 'free', note: 'FREE · Alibaba · 400B flagship · Vision + Agentic' },
    // ── Beast ──
    { id: 'nvidia/nemotron-3-super-120b-a12b',               label: 'Nemotron Super 120B',  tier: 'free', note: 'FREE · NVIDIA · 1M ctx · Agentic' },
    { id: 'nvidia/nemotron-3-ultra-550b-a55b',               label: 'Nemotron Ultra 550B',  tier: 'free', note: 'FREE · NVIDIA · 550B · 1M ctx · Best' },
    { id: 'mistralai/mistral-large-3-675b-instruct-2512',    label: 'Mistral Large 3',      tier: 'free', note: 'FREE · Mistral · 675B MoE · Top tier' },
  ],

  async send(messages, systemPrompt, apiKey, model, onChunk, _streamSpeed = 'normal', onUsage, tokenBudget = 4096, temperature = 0.9) {
    const startTime = Date.now();
    // Only models that natively handle reasoning budget params — don't include gemma-4/seed-oss,
    // they output raw <think> blocks and don't respect reasoning_budget cleanly
    const isReasoningModel = model.includes('reasoning') || model.includes('deepseek-v4') || model.includes('step-3.5') || model.includes('step-3.7') || model.includes('diffusiongemma');
    const isDeepSeekReasoning = model.includes('deepseek-v4');
    const isStepReasoning = model.includes('step-3.5');
    // Models that support 16K+ output
    const isLongForm = model.includes('kimi') || model.includes('qwen') || model.includes('llama-4') || model.includes('nemotron-3-ultra') || model.includes('step') || model.includes('mistral-large') || model.includes('mistral-medium') || model.includes('seed-oss') || model.includes('llama-3.2-90b');
    const maxTokens = isReasoningModel ? 65536 : isLongForm ? Math.min(tokenBudget, 16384) : Math.min(tokenBudget, 4096);

    const body: any = {
      model,
      max_tokens: maxTokens,
      temperature: isReasoningModel ? 0.6 : temperature,
      top_p: isReasoningModel ? 0.95 : undefined,
      // Always non-streaming on mobile — React Native res.body is unreliable,
      // causes SSE response to be parsed as JSON and explode. onChunk called once at end.
      stream: false,
      stream_options: undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    };
    if (isDeepSeekReasoning) {
      body.extra_body = { chat_template_kwargs: { thinking: true, reasoning_effort: 'high' } };
    } else if (isStepReasoning) {
      // Step 3.5 returns reasoning_content natively, no extra_body needed
    } else if (isReasoningModel) {
      body.extra_body = { chat_template_kwargs: { enable_thinking: true }, reasoning_budget: 16384 };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let res: Response;
    try {
      res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error((errJson as any)?.detail || (errJson as any)?.error?.message || `NVIDIA NIM error ${res.status}`);
    }

    const json = await res.json();
    const msg = json.choices?.[0]?.message;
    // Use content only — reasoning_content is internal chain-of-thought, never show it
    // Also strip <think>...</think> blocks that some models (Qwen3, Gemma 4, Seed) emit inline
    const rawContent = msg?.content || '';
    const content = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s+/, '');
    if (onUsage) {
      const totalTime = Date.now() - startTime;
      const inTok  = json.usage?.prompt_tokens     || Math.round((systemPrompt.length + messages.reduce((a, m) => a + m.content.length, 0)) / 4);
      const outTok = json.usage?.completion_tokens || Math.round(content.length / 4);
      onUsage(
        { inputTokens: inTok, outputTokens: outTok, totalTokens: inTok + outTok },
        { timeToFirstToken: totalTime, totalTime },
      );
    }
    if (onChunk && content) onChunk(content);
    return content;
  },
};
