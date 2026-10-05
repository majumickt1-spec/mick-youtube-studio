export const maxDuration = 60;

const OPENAI_URL = 'https://api.openai.com/v1';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TEXT_MODEL = 'gpt-5.6-luna';
const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2.5-flare';
const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3-pro-image';

type ThumbnailProvider = 'openai' | 'google';

type OpenAIResponse = {
  id?: string;
  status?: string;
  output?: Array<{ type?: string; result?: string }>;
  error?: { message?: string };
  incomplete_details?: { reason?: string };
};

type GeminiContent = {
  type?: string;
  data?: string;
  mime_type?: string;
  mimeType?: string;
};

type GeminiInteraction = {
  id?: string;
  status?: string;
  steps?: Array<{ type?: string; content?: GeminiContent[] }>;
  output_image?: GeminiContent;
  error?: { code?: number; message?: string; status?: string } | string;
  errors?: Array<{ message?: string }>;
};

function geminiErrorMessage(data: GeminiInteraction, response: Response) {
  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  if (data.error && typeof data.error === 'object' && data.error.message) {
    return data.error.message;
  }
  const nestedMessage = data.errors?.find((error) => error.message)?.message;
  if (nestedMessage) return nestedMessage;
  return `Google Gemini 回應錯誤（${response.status} ${response.statusText || 'Unknown'}）`;
}

function validString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validProvider(value: unknown): ThumbnailProvider | null {
  return value === 'openai' || value === 'google' ? value : null;
}

async function openAIRequest(
  apiKey: string,
  path: string,
  init: RequestInit,
  timeout = 20_000,
) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${apiKey}`);
  headers.set('content-type', 'application/json');
  const response = await fetch(`${OPENAI_URL}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(timeout),
  });
  const data = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || 'GPT Image 2.5 暫時無法使用');
  }
  return data;
}

async function geminiRequest(
  apiKey: string,
  path: string,
  init: RequestInit,
  timeout = 20_000,
) {
  const headers = new Headers(init.headers);
  headers.set('x-goog-api-key', apiKey);
  headers.set('content-type', 'application/json');
  headers.set('Api-Revision', '2026-05-20');
  const response = await fetch(`${GEMINI_URL}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(timeout),
  });
  const raw = await response.text();
  let data: GeminiInteraction = {};
  try {
    data = raw ? (JSON.parse(raw) as GeminiInteraction) : {};
  } catch {
    if (!response.ok) {
      throw new Error(
        `Google Gemini 回應錯誤（${response.status} ${response.statusText || 'Unknown'}）`,
      );
    }
    throw new Error('Google Gemini 回傳了無法辨識的結果。');
  }
  if (!response.ok) {
    throw new Error(geminiErrorMessage(data, response));
  }
  return data;
}

function finalPrompt(
  prompt: string,
  title: string,
  topic: string,
  pillar: string,
  compositionIndex: number,
) {
  const compositions = [
    'Variation A: emotional conflict. Keep the fixed master layout. Use a thoughtful or concerned presenter portrait on the left and one compact literal conflict object in the upper-right.',
    'Variation B: lived-in cause and consequence. Keep the fixed master layout. Compress the situation into one small realistic diorama or tightly grouped household object set in the upper-right.',
    'Variation C: symbolic contrast. Keep the fixed master layout. Use one bold tactile 3D metaphor object or one tightly unified object group in the upper-right; the symbolic object itself contains no people.',
  ];
  return `DELIVERABLE
Create exactly one premium semi-realistic hand-painted 16:9 YouTube thumbnail background for a Taiwanese personal-finance creator. It must look illustrated rather than photographed, remain clear at phone size, and leave usable negative space for a headline added later.

SELECTED TITLE — PRIMARY CREATIVE BRIEF
${title}
The image must be designed from this selected title's specific promise, conflict, subject, and stakes. Do not replace it with a generic image about the broader topic.

SECONDARY CONTEXT
Broader topic: ${topic}
Content pillar: ${pillar}

VISUAL DIRECTION
${prompt}

NON-NEGOTIABLE BRAND MASTER LAYOUT
The left 40–45% contains a large chest-up Taiwanese male creator aged 40–50 wearing understated dark rectangular glasses. The upper edge of a dark laptop is visible in the lower-left foreground. The creator looks toward the upper-right, never straight at the camera.
The upper-right contains exactly one topic-specific hero object, smaller than the creator. For an AI or agent topic, this may be one polished black-and-gold 3D agent character; otherwise use one literal object, miniature diorama, or visual metaphor directly tied to the title.
The middle-right is a clean rising diagonal zone reserved for the first ivory-white headline. A broad warm-gold diagonal ribbon crosses the lower-right and is reserved for the second, largest headline. Generate both zones without any text. Add only a small restrained warm-gold dot grid in the far upper-right and a subtle dark tabletop or floor along the bottom.
The reading path must be creator -> hero object -> two diagonal headline zones. Do not move the presenter to the right and do not reserve the left side for text.

ASSIGNED VARIATION
${compositions[compositionIndex] || compositions[0]}
Follow this assigned variation while preserving the same master layout in every result. Express the selected title rather than merely illustrating the broader topic. Do not draw a fake interface screenshot.

STYLE
Premium high-contrast semi-realistic hand-painted YouTube editorial illustration, not photography. Preserve believable adult facial anatomy, recognizable human proportions, understated expressions, and natural posture. Use visible fine pencil and charcoal cross-hatching, textured digital brushwork, softly simplified skin planes, and a refined illustrated finish. Near-black background, ivory-white highlights, warm metallic gold rim light, crisp cutout separation, mature and trustworthy. The hero object may use polished cinematic 3D rendering, but the creator must remain a hand-painted illustrated portrait. The composition must remain clear at phone size. Do not default to a full amber night scene.

STRICT CONSTRAINTS
Absolutely no photorealistic camera look, photographic skin pores, flat vector art, anime, manga, chibi proportions, children's-book cartoon style, visible text, Chinese characters, English letters, numbers, logos, watermarks, subtitles, UI labels, extra badges, money, coins, gold bars, rockets, luxury cars, profit charts, holographic interfaces, or generic stock-business-team scenes. Do not add an unrelated mascot; one mature topic-specific 3D AI-agent character is allowed only for an AI or agent topic.`;
}

function geminiImageFrom(interaction: GeminiInteraction) {
  const content = (interaction.steps || [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content || [])
    .find((item) => item.type === 'image' && item.data);
  const image = content || interaction.output_image;
  if (!image?.data) return null;
  return {
    imageBase64: image.data,
    mimeType: image.mime_type || image.mimeType || 'image/jpeg',
  };
}

export async function GET() {
  return Response.json(
    {
      openai: Boolean(process.env.OPENAI_API_KEY),
      google: Boolean(process.env.GEMINI_API_KEY),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  try {
    const studioCode = process.env.STUDIO_ACCESS_CODE;
    if (!studioCode) {
      return Response.json(
        { error: '縮圖生成尚未完成啟用，請先設定平台使用碼。' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.accessCode !== 'string' || body.accessCode !== studioCode) {
      return Response.json({ error: '平台使用碼不正確。' }, { status: 401 });
    }

    const provider = validProvider(body.provider);
    if (!provider) {
      return Response.json({ error: '圖片模型不正確。' }, { status: 400 });
    }
    const apiKey =
      provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            provider === 'openai'
              ? '尚未設定 OPENAI_API_KEY。'
              : '尚未設定 GEMINI_API_KEY。',
        },
        { status: 503 },
      );
    }

    if (body.phase === 'generateOne' && provider === 'google') {
      const title = validString(body.title, 220);
      const topic = validString(body.topic, 500);
      const pillar = validString(body.pillar, 40);
      const prompt = validString(body.prompt, 6000);
      const compositionIndex =
        typeof body.compositionIndex === 'number'
          ? Math.max(0, Math.min(2, Math.trunc(body.compositionIndex)))
          : 0;
      if (!title || !topic || !prompt) {
        return Response.json(
          { error: '請先選定標題並準備縮圖方向。' },
          { status: 400 },
        );
      }

      const result = await geminiRequest(
        apiKey,
        '/interactions',
        {
          method: 'POST',
          body: JSON.stringify({
            model: process.env.GEMINI_IMAGE_MODEL || DEFAULT_GEMINI_IMAGE_MODEL,
            input: finalPrompt(prompt, title, topic, pillar, compositionIndex),
            response_format: {
              type: 'image',
              aspect_ratio: '16:9',
              image_size: '2K',
              mime_type: 'image/jpeg',
            },
          }),
        },
        55_000,
      );
      const image = geminiImageFrom(result);
      if (!image) throw new Error('Nano Banana Pro 沒有回傳圖片結果。');
      return Response.json({ status: 'completed', ...image });
    }

    if (body.phase === 'generate') {
      const title = validString(body.title, 220);
      const topic = validString(body.topic, 500);
      const pillar = validString(body.pillar, 40);
      const prompts = Array.isArray(body.prompts)
        ? body.prompts
            .map((prompt) => validString(prompt, 6000))
            .filter(Boolean)
            .slice(0, 3)
        : [];
      if (!title || !topic || prompts.length !== 3) {
        return Response.json(
          { error: '請先選定標題並準備三組縮圖方向。' },
          { status: 400 },
        );
      }

      const jobs: Array<{ index: number; responseId: string }> = [];
      const failures: string[] = [];
      for (const [index, prompt] of prompts.entries()) {
        try {
          const completePrompt = finalPrompt(
            prompt,
            title,
            topic,
            pillar,
            index,
          );
          if (provider === 'openai') {
            const result = await openAIRequest(apiKey, '/responses', {
              method: 'POST',
              body: JSON.stringify({
                model: process.env.OPENAI_MODEL || DEFAULT_TEXT_MODEL,
                background: true,
                store: true,
                input: completePrompt,
                tools: [
                  {
                    type: 'image_generation',
                    model:
                      process.env.OPENAI_IMAGE_MODEL ||
                      DEFAULT_OPENAI_IMAGE_MODEL,
                    action: 'generate',
                    size: '1536x864',
                    quality: 'medium',
                    output_format: 'webp',
                  },
                ],
              }),
            });
            if (!result.id) throw new Error('未取得 GPT Image 2.5 任務編號');
            jobs.push({ index, responseId: result.id });
          } else {
            throw new Error('Nano Banana Pro 請改用逐張生成流程。');
          }
        } catch (error) {
          failures.push(
            error instanceof Error
              ? error.message
              : `第 ${index + 1} 組建立失敗`,
          );
        }
      }
      if (jobs.length === 0) {
        throw new Error(failures[0] || '三組縮圖任務都無法建立');
      }
      return Response.json({
        jobs,
        warning:
          jobs.length < 3
            ? `已建立 ${jobs.length}/3 組縮圖，其餘任務暫時無法建立。`
            : '',
      });
    }

    if (body.phase === 'status') {
      const responseId = validString(body.responseId, 600);
      const validResponseId =
        provider === 'openai'
          ? /^resp_[A-Za-z0-9_-]+$/.test(responseId)
          : /^[A-Za-z0-9_-]{10,600}$/.test(responseId);
      if (!validResponseId) {
        return Response.json(
          { error: '圖片任務編號不正確。' },
          { status: 400 },
        );
      }

      if (provider === 'openai') {
        const result = await openAIRequest(
          apiKey,
          `/responses/${encodeURIComponent(responseId)}`,
          { method: 'GET' },
        );
        if (result.status === 'queued' || result.status === 'in_progress') {
          return Response.json({ status: result.status });
        }
        if (result.status !== 'completed') {
          throw new Error(
            result.error?.message ||
              result.incomplete_details?.reason ||
              'GPT Image 2.5 縮圖生成未能完成。',
          );
        }
        const imageBase64 = (result.output || []).find(
          (item) => item.type === 'image_generation_call' && item.result,
        )?.result;
        if (!imageBase64) throw new Error('完成的任務沒有圖片結果');
        return Response.json({
          status: 'completed',
          imageBase64,
          mimeType: 'image/webp',
        });
      }

      const result = await geminiRequest(
        apiKey,
        `/interactions/${encodeURIComponent(responseId)}`,
        { method: 'GET' },
      );
      if (result.status === 'queued' || result.status === 'in_progress') {
        return Response.json({ status: result.status });
      }
      if (result.status !== 'completed') {
        throw new Error(
          (typeof result.error === 'object'
            ? result.error?.message
            : result.error) ||
            result.errors?.find((error) => error.message)?.message ||
            'Nano Banana Pro 縮圖生成未能完成。',
        );
      }
      const image = geminiImageFrom(result);
      if (!image) throw new Error('完成的任務沒有圖片結果');
      return Response.json({ status: 'completed', ...image });
    }

    return Response.json({ error: '不支援的處理階段。' }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
        ? '圖片服務連線超過等待時間，請稍後查看進度。'
        : error instanceof Error
          ? error.message
          : '縮圖生成暫時無法使用';
    return Response.json({ error: message }, { status: 500 });
  }
}
