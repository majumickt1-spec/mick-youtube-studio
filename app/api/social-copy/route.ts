export const maxDuration = 60;

const OPENAI_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-5.6-luna';

type OpenAIContent = {
  type?: string;
  text?: string;
};

type OpenAIResponse = {
  id?: string;
  status?: string;
  output?: Array<{ content?: OpenAIContent[] }>;
  error?: { message?: string };
  incomplete_details?: { reason?: string };
};

function validString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function textFrom(response: OpenAIResponse) {
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === 'output_text' && content.text)
    .map((content) => content.text)
    .join('\n')
    .trim();
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
    throw new Error(data.error?.message || 'OpenAI 社群文案服務暫時無法使用');
  }
  return data;
}

function socialPrompt(input: {
  pillar: string;
  topic: string;
  title: string;
  painPoint: string;
  description: string;
  script: string;
}) {
  return `你是台灣 YouTube 頻道「米克大叔」的社群內容編輯。請依同一支影片，分別寫出可以直接發布的 Facebook 與 Instagram 宣傳文案。

【影片資料】
創作方向：${input.pillar}
確認主題：${input.topic}
影片標題：${input.title}
觀眾痛點：${input.painPoint || '請從影片內容合理歸納'}

YouTube 資訊欄：
${input.description || '未提供'}

口語腳本：
${input.script || '未提供，僅依主題與標題撰寫'}

【品牌定位】
- 核心是現金流；AI 是建立副業資產、增加非工資收入的手段，不是頻道定位。
- 受眾是 35–55 歲、有家庭責任、主要收入仍來自薪水的台灣上班族。
- 品牌句：管理現金流｜降低薪水依賴｜拿回人生選擇權。
- 語氣溫暖、真誠、理性，像陪觀眾把問題想清楚的朋友；不說教、不炫富、不製造焦慮。
- 不可捏造米克本人的經歷、成果、數字、新聞或研究。不要顯示資料來源或參考網址。
- 避免「首先、其次、最後、值得注意的是、綜上所述」等制式 AI 語氣。

【Facebook 文案】
- 約 350–550 個繁體中文字，適合 Facebook 閱讀節奏。
- 第一行用生活痛點或反常觀點讓人停下來，接著用 3–5 段短文說清楚影片價值。
- 可加入 2–3 點條列，但不要把整篇寫成清單。
- 結尾只保留一個行動：「完整影片：〔上架後貼入影片連結〕」。
- 最後放 3–5 個相關 Hashtag。

【Instagram 文案】
- 約 180–320 個繁體中文字，短句、留白明確，適合手機閱讀。
- 開頭 1–2 行必須有停留感，中段濃縮核心觀點或 3 個收穫。
- 結尾寫「完整影片：請見個人檔案連結」。
- 最後放 5–8 個精準 Hashtag，不塞無關熱門標籤。

兩份文案都不要加「Facebook 文案」「Instagram 文案」等前言；只輸出符合指定 JSON Schema 的內容。`;
}

function parsePackage(text: string) {
  const parsed = JSON.parse(text) as {
    fbCopy?: unknown;
    igCopy?: unknown;
  };
  const fbCopy = validString(parsed.fbCopy, 8_000);
  const igCopy = validString(parsed.igCopy, 5_000);
  if (!fbCopy || !igCopy) throw new Error('社群文案結果格式不完整');
  return { fbCopy, igCopy };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const studioCode = process.env.STUDIO_ACCESS_CODE;
    if (!apiKey || !studioCode) {
      return Response.json(
        { error: '社群文案生成尚未完成啟用，請先設定平台金鑰。' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.accessCode !== 'string' || body.accessCode !== studioCode) {
      return Response.json({ error: '平台使用碼不正確。' }, { status: 401 });
    }

    if (body.phase === 'generate') {
      const pillar = validString(body.pillar, 40);
      const topic = validString(body.topic, 500);
      const title = validString(body.title, 300);
      const painPoint = validString(body.painPoint, 1_000);
      const description = validString(body.description, 8_000);
      const script = validString(body.script, 24_000);
      if (!title || !['現金流管理', 'AI資產建立'].includes(pillar)) {
        return Response.json(
          { error: '請先完成選題並選定影片標題。' },
          { status: 400 },
        );
      }

      const result = await openAIRequest(apiKey, '/responses', {
        method: 'POST',
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
          background: true,
          store: true,
          reasoning: { effort: 'low' },
          max_output_tokens: 2_000,
          input: socialPrompt({
            pillar,
            topic,
            title,
            painPoint,
            description,
            script,
          }),
          text: {
            format: {
              type: 'json_schema',
              name: 'social_copy_package',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  fbCopy: { type: 'string' },
                  igCopy: { type: 'string' },
                },
                required: ['fbCopy', 'igCopy'],
                additionalProperties: false,
              },
            },
          },
        }),
      });
      if (!result.id) throw new Error('未取得背景社群文案任務編號');
      return Response.json({ responseId: result.id, status: result.status });
    }

    if (body.phase === 'status') {
      const responseId = validString(body.responseId, 200);
      if (!/^resp_[A-Za-z0-9_-]+$/.test(responseId)) {
        return Response.json(
          { error: '社群文案任務編號不正確。' },
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
            '背景社群文案未能完成，請重新產生。',
        );
      }
      return Response.json({
        status: 'completed',
        ...parsePackage(textFrom(result)),
      });
    }

    return Response.json({ error: '不支援的處理階段。' }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
        ? '社群文案服務連線超過等待時間，請稍後查看進度。'
        : error instanceof Error
          ? error.message
          : '社群文案生成暫時無法使用';
    return Response.json({ error: message }, { status: 500 });
  }
}
