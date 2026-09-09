import { NextResponse } from 'next/server';

type GenerateBody = {
  prompts?: unknown;
  accessCode?: unknown;
};

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const studioAccessCode = process.env.STUDIO_ACCESS_CODE;

  if (!apiKey || !studioAccessCode) {
    return NextResponse.json(
      {
        error: '圖片服務尚未完成設定。請先在 Vercel 加入圖片金鑰與平台使用碼。',
      },
      { status: 503 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: '請求格式不正確。' }, { status: 400 });
  }

  if (body.accessCode !== studioAccessCode) {
    return NextResponse.json({ error: '平台使用碼不正確。' }, { status: 401 });
  }

  if (
    !Array.isArray(body.prompts) ||
    body.prompts.length !== 3 ||
    body.prompts.some(
      (prompt) =>
        typeof prompt !== 'string' ||
        prompt.length < 20 ||
        prompt.length > 3000,
    )
  ) {
    return NextResponse.json(
      { error: '必須提供 3 組有效的縮圖提示詞。' },
      { status: 400 },
    );
  }

  try {
    const images = await Promise.all(
      body.prompts.map(async (prompt) => {
        const response = await fetch(
          'https://api.openai.com/v1/images/generations',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-image-2',
              prompt,
              size: '1536x1024',
              quality: 'medium',
              output_format: 'jpeg',
              background: 'opaque',
              n: 1,
            }),
          },
        );

        const result = (await response.json()) as {
          data?: Array<{ b64_json?: string }>;
          error?: { message?: string };
        };

        if (!response.ok || !result.data?.[0]?.b64_json) {
          throw new Error(result.error?.message || 'GPT Image 沒有回傳圖片。');
        }

        return `data:image/jpeg;base64,${result.data[0].b64_json}`;
      }),
    );

    return NextResponse.json({ images });
  } catch (error) {
    const message = error instanceof Error ? error.message : '圖片生成失敗。';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
