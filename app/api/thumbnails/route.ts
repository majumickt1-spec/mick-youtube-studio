export const maxDuration = 60;

const OPENAI_URL = 'https://api.openai.com/v1';
const DEFAULT_TEXT_MODEL = 'gpt-5.6-luna';
const DEFAULT_IMAGE_MODEL = 'gpt-image-2';

type OpenAIResponse = {
  id?: string;
  status?: string;
  output?: Array<{ type?: string; result?: string }>;
  error?: { message?: string };
  incomplete_details?: { reason?: string };
};

function validString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
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
    throw new Error(data.error?.message || 'OpenAI 圖片服務暫時無法使用');
  }
  return data;
}

function finalPrompt(
  prompt: string,
  title: string,
  topic: string,
  pillar: string,
) {
  return `Create exactly one premium photorealistic YouTube thumbnail background for a Taiwanese personal-finance creator.

Video topic: ${topic}
Working title: ${title}
Content pillar: ${pillar}
Visual concept: ${prompt}

Art direction: black, white, and restrained gold palette; warm cinematic realism; trustworthy and emotionally clear; Taiwanese home or work context; strong subject separation; high contrast; simple composition that remains readable on a phone.
Composition: 16:9 landscape. Keep generous clean negative space on the left for a headline that will be added later in Canva. Place the main subject or focal object mostly on the right. Do not draw a fake interface screenshot.
Strict exclusions: absolutely no text, no Chinese characters, no English letters, no numbers, no logos, no watermark, no subtitles, no UI labels, no cartoon, no mascot, no generic stock-business-team scene.`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const studioCode = process.env.STUDIO_ACCESS_CODE;
    if (!apiKey || !studioCode) {
      return Response.json(
        { error: '縮圖生成尚未完成啟用，請先設定平台金鑰。' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.accessCode !== 'string' || body.accessCode !== studioCode) {
      return Response.json({ error: '平台使用碼不正確。' }, { status: 401 });
    }

    if (body.phase === 'generate') {
      const title = validString(body.title, 220);
      const topic = validString(body.topic, 500);
      const pillar = validString(body.pillar, 40);
      const prompts = Array.isArray(body.prompts)
        ? body.prompts
            .map((prompt) => validString(prompt, 1800))
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
          const result = await openAIRequest(apiKey, '/responses', {
            method: 'POST',
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || DEFAULT_TEXT_MODEL,
              background: true,
              store: true,
              input: finalPrompt(prompt, title, topic, pillar),
              tools: [
                {
                  type: 'image_generation',
                  model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
                  action: 'generate',
                  size: '1536x864',
                  quality: 'medium',
                  output_format: 'webp',
                },
              ],
            }),
          });
          if (!result.id) throw new Error('未取得圖片任務編號');
          jobs.push({ index, responseId: result.id });
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
      const responseId = validString(body.responseId, 200);
      if (!/^resp_[A-Za-z0-9_-]+$/.test(responseId)) {
        return Response.json(
          { error: '圖片任務編號不正確。' },
          { status: 400 },
        );
      }
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
            '縮圖生成未能完成。',
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

    return Response.json({ error: '不支援的處理階段。' }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
        ? '圖片服務連線超過等待時間，請稍後再試一次。'
        : error instanceof Error
          ? error.message
          : '縮圖生成暫時無法使用';
    return Response.json({ error: message }, { status: 500 });
  }
}
