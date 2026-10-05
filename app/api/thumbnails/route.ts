import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const maxDuration = 60;

const OPENAI_URL = 'https://api.openai.com/v1';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TEXT_MODEL = 'gpt-5.6-luna';
const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2.5-flare';
const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3-pro-image';
const CREATOR_REFERENCE_PATH = join(
  process.cwd(),
  'public',
  'mick-character-reference.jpg',
);

let creatorReferencePromise: Promise<string> | null = null;

function creatorReferenceBase64() {
  creatorReferencePromise ??= readFile(CREATOR_REFERENCE_PATH).then((buffer) =>
    buffer.toString('base64'),
  );
  return creatorReferencePromise;
}

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
    'DIRECTION A — EMOTIONAL CONFLICT: use a large chest-up creator portrait on the left 40–45%, a clear topic-specific expression and hand gesture, a laptop edge in the lower-left, and one compact conflict object in the upper-right. This must read as an emotional portrait, not a wide room scene or object-only still life.',
    'DIRECTION B — LIVED-IN SITUATION: use a wide Taiwanese home, dining-table, or after-work environment. Keep the creator smaller at roughly 25–32% of the frame and naturally performing the topic-specific action. Show cause and consequence through real props across foreground and background. Do not use the large left-side cutout portrait from Direction A and do not compress the setting into one small object cluster.',
    'DIRECTION C — EXACT 50/50 LEFT/RIGHT BEFORE-AFTER CONTRAST: place the dividing seam at the exact horizontal midpoint (x = 50%), so the BEFORE side occupies the left 50% and the AFTER side occupies the right 50%. Use a straight vertical or very narrow near-vertical center seam; do not use a broad sweeping diagonal split that makes one side larger. Show the same referenced creator on both sides with the same face, glasses, hair, clothing, body proportions, crop, head size, and visual weight. Center the left creator near x = 25% and the right creator near x = 75%, keeping all side-specific props inside their own half. The left side is BEFORE: darker, cluttered, inefficient, pressured, or stuck. The right side is AFTER: clearer, organized, calmer, and visibly improved. Do not create two unrelated people or two unrelated scenes, and do not let either side dominate more than half of the frame.',
  ];
  return `DELIVERABLE
Create exactly one premium semi-realistic hand-painted 16:9 YouTube thumbnail background for a Taiwanese personal-finance creator. It must look illustrated rather than photographed, remain clear at phone size, and leave usable negative space for a headline added later.

SELECTED TITLE — PRIMARY CREATIVE BRIEF
${title}
The image must be designed from this selected title's specific promise, conflict, subject, and stakes. Do not replace it with a generic image about the broader topic.

SECONDARY CONTEXT
Broader topic: ${topic}
Content pillar: ${pillar}

CREATOR IDENTITY REFERENCE — REQUIRED
An attached reference sheet shows the only creator allowed in this thumbnail. Preserve his recognizable face shape, short spiky black hair, dark rectangular glasses, calm mature expression, black textured sweater over a white collared shirt, dark trousers, brown shoes, and black wristwatch. Treat the sheet as an identity and wardrobe reference, not as content to copy into the thumbnail. Do not reproduce the white contact-sheet background, multiple pose lineup, or sketch-sheet layout. Direction A uses one close portrait, Direction B uses one smaller environmental figure, and Direction C uses the same creator twice as before and after. Do not invent a different host or add other people.

VISUAL DIRECTION
${prompt}

SHARED BRAND DNA — STYLE IS FIXED, COMPOSITION IS NOT
Every result uses the same semi-realistic hand-painted black, ivory-white, and warm-gold brand language, with two clean diagonal headline zones, one broad warm-gold diagonal ribbon, strong mobile-size hierarchy, and only a small restrained gold dot-grid accent. These shared brand elements must not force the same subject placement in all three results.

ASSIGNED COMPOSITION — MUST LOOK CLEARLY DIFFERENT FROM THE OTHER TWO
${compositions[compositionIndex] || compositions[0]}
Follow only this assigned composition. Do not blend it with either of the other two directions. Express the selected title rather than merely illustrating the broader topic. Do not draw a fake interface screenshot.

STYLE
Premium high-contrast semi-realistic hand-painted YouTube editorial illustration, not photography. When a person is present, preserve believable adult facial anatomy, recognizable human proportions, understated expressions, and natural posture. Use visible fine pencil and charcoal cross-hatching, textured digital brushwork, softly simplified forms, and a refined illustrated finish. Near-black base, ivory-white highlights, warm metallic gold rim light, crisp focal separation, mature and trustworthy. Topic objects may use polished cinematic 3D rendering. The composition must remain clear at phone size. Do not default to a full amber night scene.

STRICT CONSTRAINTS
Absolutely no replacement presenter, changed face, changed glasses, changed hairstyle, changed wardrobe, unrelated people, photorealistic camera look, photographic skin pores, flat vector art, anime, manga, chibi proportions, children's-book cartoon style, visible text, Chinese characters, English letters, numbers, logos, watermarks, subtitles, UI labels, extra badges, money, coins, gold bars, rockets, luxury cars, profit charts, holographic interfaces, or generic stock-business-team scenes. Do not add an unrelated mascot; one mature topic-specific 3D AI-agent character is allowed only for an AI or agent topic.`;
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

      const creatorReference = await creatorReferenceBase64();

      const result = await geminiRequest(
        apiKey,
        '/interactions',
        {
          method: 'POST',
          body: JSON.stringify({
            model: process.env.GEMINI_IMAGE_MODEL || DEFAULT_GEMINI_IMAGE_MODEL,
            input: [
              {
                type: 'text',
                text: finalPrompt(
                  prompt,
                  title,
                  topic,
                  pillar,
                  compositionIndex,
                ),
              },
              {
                type: 'image',
                mime_type: 'image/jpeg',
                data: creatorReference,
              },
            ],
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
      const creatorReference = await creatorReferenceBase64();
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
                input: [
                  {
                    role: 'user',
                    content: [
                      { type: 'input_text', text: completePrompt },
                      {
                        type: 'input_image',
                        image_url: `data:image/jpeg;base64,${creatorReference}`,
                        detail: 'high',
                      },
                    ],
                  },
                ],
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
