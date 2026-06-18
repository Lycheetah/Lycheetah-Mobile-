import { Message } from '../ai-client';
import { AIProvider, TokenUsage, ResponseTimings } from './types';

const BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export const NvidiaProvider: AIProvider = {
  id: 'nvidia',
  label: 'NVIDIA NIM',
  color: '#76B900',
  keyPlaceholder: 'nvapi-...',
  keyHint: 'Unlimited free prototyping · 50+ models · build.nvidia.com/explore',
  models: [
    // ── ⚡ FASTEST — start here ──
    { id: 'meta/llama-4-maverick-17b-128e-instruct',         label: '⚡ Llama 4 Maverick',   tier: 'free', note: 'FREE · Meta · 128E MoE · 17B active · Fast + smart · Multimodal' },
    { id: 'deepseek-ai/deepseek-v4-flash',                   label: '⚡ DeepSeek V4 Flash',  tier: 'free', note: 'FREE · DeepSeek · 284B MoE · 1M ctx · Flash speed · ✓ tool' },
    { id: 'stepfun-ai/step-3.7-flash',                       label: '⚡ Step 3.7 Flash',     tier: 'free', note: 'FREE · StepFun · Flash MoE · Agentic · Coding · Multimodal' },
    { id: 'meta/llama-3.1-8b-instruct',                      label: '⚡ Llama 3.1 8B',       tier: 'free', note: 'FREE · Meta · 8B · Ultra-reliable · Fast · Instruction following' },
    { id: 'mistralai/mistral-small-4-119b-2603',             label: '⚡ Mistral Small 4',    tier: 'free', note: 'FREE · Mistral · 119B MoE · 256k ctx · Fast despite size' },
    { id: 'openai/gpt-oss-20b',                              label: '⚡ GPT OSS 20B',        tier: 'free', note: 'FREE · OpenAI · Small MoE · Quick reasoning · Low latency' },
    { id: 'microsoft/phi-4-mini-instruct',                   label: '⚡ Phi-4 Mini',         tier: 'free', note: 'FREE · Microsoft · Lightweight · Multilingual · Low latency' },
    // ── Tiny / Edge ──
    { id: 'meta/llama-3.2-1b-instruct',                      label: 'Llama 3.2 1B',         tier: 'free', note: 'FREE · Meta · Tiny · Simple tasks · Ultra-low footprint' },
    { id: 'meta/llama-3.2-3b-instruct',                      label: 'Llama 3.2 3B',         tier: 'free', note: 'FREE · Meta · Small · Summaries · Quick answers' },
    { id: 'google/gemma-3n-e2b-it',                          label: 'Gemma 3n E2B',         tier: 'free', note: 'FREE · Google · Edge 2B · Audio/image/text lite' },
    { id: 'google/gemma-3n-e4b-it',                          label: 'Gemma 3n E4B',         tier: 'free', note: 'FREE · Google · Edge 4B · Multimodal · Resource-light' },
    { id: 'google/gemma-2-2b-it',                            label: 'Gemma 2 2B',           tier: 'free', note: 'FREE · Google · 2B dense · Edge apps' },
    { id: 'nvidia/nemotron-mini-4b-instruct',                 label: 'Nemotron Mini 4B',     tier: 'free', note: 'FREE · NVIDIA · 4B · Roleplay · RAG · Function calling' },
    // ── Speed (8B–20B) ──
    { id: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',         label: 'Nemotron VL 8B',       tier: 'free', note: 'FREE · NVIDIA · Vision-Language · Fast · Doc intel' },
    { id: 'microsoft/phi-4-multimodal-instruct',             label: 'Phi-4 Multimodal',     tier: 'free', note: 'FREE · Microsoft · Image + audio + text · Speech recognition' },
    { id: 'google/diffusiongemma-26b-a4b-it',                label: 'DiffusionGemma 26B',   tier: 'free', note: 'FREE · Google · Parallel token gen · Real-time · Diffusion LLM' },
    // ── Mid (30B–70B) ──
    { id: 'meta/llama-3.3-70b-instruct',                     label: 'Llama 3.3 70B',        tier: 'free', note: 'FREE · Meta · Reasoning · Math · Tool calling' },
    { id: 'meta/llama-3.1-70b-instruct',                     label: 'Llama 3.1 70B',        tier: 'free', note: 'FREE · Meta · Complex chat · Contextual reasoning' },
    { id: 'nvidia/nvidia-nemotron-nano-9b-v2',               label: 'Nemotron Nano 9B v2',  tier: 'free', note: 'FREE · NVIDIA · Hybrid Transformer-Mamba · Thinking budget' },
    { id: 'abacusai/dracarys-llama-3.1-70b-instruct',        label: 'Dracarys 70B',         tier: 'free', note: 'FREE · AbacusAI · Fine-tuned Llama 70B · Code · Summarization' },
    { id: 'sarvamai/sarvam-m',                               label: 'Sarvam M',             tier: 'free', note: 'FREE · SarvamAI · Multilingual · Indian langs · Math · Code' },
    // ── Vision / Multimodal ──
    { id: 'meta/llama-3.2-11b-vision-instruct',              label: 'Llama 3.2 11B Vision', tier: 'free', note: 'FREE · Meta · Vision-Language · Image reasoning · Fast' },
    { id: 'meta/llama-3.2-90b-vision-instruct',              label: 'Llama 3.2 90B Vision', tier: 'free', note: 'FREE · Meta · Large VLM · Deep image reasoning' },
    { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',   label: 'Nemotron Omni 30B',    tier: 'free', note: 'FREE · NVIDIA · Omnimodal · Image/video/speech/text reasoning' },
    // ── Reasoning / Coding ──
    { id: 'nvidia/llama-3.3-nemotron-super-49b-v1',          label: 'Nemotron Super 49B',   tier: 'free', note: 'FREE · NVIDIA · Tool calling · High efficiency · Reasoning' },
    { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',        label: 'Nemotron Super 49B v1.5', tier: 'free', note: 'FREE · NVIDIA · Latest · Reasoning · Tool calling · Chat' },
    { id: 'minimaxai/minimax-m2.7',                          label: 'MiniMax M2.7',         tier: 'free', note: 'FREE · MiniMax · 230B · Long reasoning · Office tasks' },
    { id: 'minimaxai/minimax-m3',                            label: 'MiniMax M3',           tier: 'free', note: 'FREE · MiniMax · MoE VLM · Reasoning · Coding · Tool calling' },
    { id: 'bytedance/seed-oss-36b-instruct',                 label: 'Seed 36B',             tier: 'free', note: 'FREE · ByteDance · Long-context · Agentic · Thinking budget' },
    { id: 'mistralai/mistral-nemotron',                      label: 'Mistral Nemotron',     tier: 'free', note: 'FREE · Mistral+NVIDIA · Agentic workflows · Coding · Function calling' },
    { id: 'mistralai/ministral-14b-instruct-2512',           label: 'Ministral 14B',        tier: 'free', note: 'FREE · Mistral · 14B VLM · General chat · Instructions' },
    { id: 'mistralai/mistral-medium-3.5-128b',               label: 'Mistral Medium 3.5',   tier: 'free', note: 'FREE · Mistral · 128B · Best for code' },
    { id: 'openai/gpt-oss-120b',                             label: 'GPT OSS 120B',         tier: 'free', note: 'FREE · OpenAI · 120B MoE · Reasoning · ✓ tool' },
    { id: 'qwen/qwen3-next-80b-a3b-instruct',                label: 'Qwen3-Next 80B',       tier: 'free', note: 'FREE · Alibaba · Ultra-long ctx · Hybrid attention · Storytelling' },
    // ── Large / Flagship ──
    { id: 'nvidia/nemotron-3-super-120b-a12b',               label: 'Nemotron Super 120B',  tier: 'free', note: 'FREE · NVIDIA · 1M ctx · Agentic · Mamba-Transformer · ✓ tool' },
    { id: 'mistralai/mistral-large-3-675b-instruct-2512',    label: 'Mistral Large 3',      tier: 'free', note: 'FREE · Mistral · 675B MoE · Top tier · VLM · ✓ tool' },
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
