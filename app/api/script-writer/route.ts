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

type ResearchSource = {
  title: string;
  url: string;
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
    throw new Error(data.error?.message || 'OpenAI 腳本服務暫時無法使用');
  }
  return data;
}

function scriptPrompt(input: {
  pillar: string;
  topic: string;
  title: string;
  painPoint: string;
  supplement: string;
  references: string;
  research: string;
  researchSources: ResearchSource[];
}) {
  const sourceList = input.researchSources.length
    ? input.researchSources
        .map((source, index) => `${index + 1}. ${source.title}\n${source.url}`)
        .join('\n')
    : '沒有已查證的網路來源';

  return `你是台灣 YouTube 頻道「米克大叔」的資深腳本編輯。請完成一支可直接試讀的繁體中文口語腳本，以及 YouTube 資訊欄文案。

【本集資料】
創作方向：${input.pillar}
確認主題：${input.topic}
確認標題：${input.title}
觀眾想解決的痛點：${input.painPoint || '未另外提供，請從主題合理歸納，不要杜撰個人經歷'}
米克想補充的內容：${input.supplement || '未提供'}
本人提供的參考資料：${input.references || '未提供'}

已查證研究摘要：
${input.research || '本集沒有保存網路查證摘要；不可自行捏造新聞、日期、數字或研究結論。'}

可引用的查證來源：
${sourceList}

【品牌定位】
- 核心只有現金流；AI 是建立副業資產、增加非工資收入的手段，不是頻道定位。
- 受眾是 35–55 歲、有家庭責任、主要收入仍來自薪水的台灣上班族。
- 品牌對外句：管理現金流｜降低薪水依賴｜拿回人生選擇權。
- 最終目標：非工資收入大於或等於總支出的 2 倍。1 倍是財富自由門檻，2 倍是財務餘裕；代表可以掉、可以修、可以等、可以拒絕。

【口吻與內容規則】
- 溫暖、真誠、理性、像陪觀眾把錢整理清楚的朋友；使用台灣生活語境。
- 可使用發薪日、房貸卡費、孩子支出、餐桌、夫妻對話、手機銀行等場景，但案例必須明示為「假設」或「舉例」，不能假裝是米克本人經歷。
- 不羞辱、不說教、不炫富、不製造暴富焦慮，不薦個股、不保證報酬。
- 每支只處理一個問題、一個核心觀念、一個今天能做的行動。
- 只有已提供的研究摘要和來源可以當作查證事實。沒有依據就改成一般性說法，不可補造資料。
- 不使用「首先、其次、最後、值得注意的是、綜上所述」等制式 AI 語氣。

【腳本規格】
- 約 8–10 分鐘，正文約 2800–3000 個繁體中文字。
- 開場 5–10 秒直接交代問題、與觀眾的關係及看完的價值，不先自我介紹。
- 依序涵蓋：Hook、生活場景、問題重定義、框架拆解、家庭案例、可執行方法、今天的最小行動、單一 CTA、收束。
- CTA 固定引導「家庭資產負債表 Excel」，但真實下載網址未提供，資訊欄只能寫「〔上架前補入已確認連結〕」。
- 腳本使用 Markdown 小標方便編輯，小標不需當成口播內容。

【資訊欄規格】
- 約 350–600 個繁體中文字。
- 包含本集摘要、觀眾會帶走的 3 點、單一 CTA、品牌句與 3–5 個相關 Hashtag。
- 不在資訊欄顯示參考來源、資料來源、引用網址或來源清單。
- 必須使用下面的純文字版型與空行，讓使用者可以直接貼進 YouTube 資訊欄；不要使用 Markdown 表格，也不要把所有內容擠成單一段落：

【本集內容】
2–3 段短摘要，每段之間留一個空行。

【看完你會帶走】
1. 第一個具體收穫
2. 第二個具體收穫
3. 第三個具體收穫

【免費工具】
家庭資產負債表 Excel
👉 〔上架前補入已確認連結〕

管理現金流｜降低薪水依賴｜拿回人生選擇權

#標籤1 #標籤2 #標籤3
- 標題、段落、編號、CTA、品牌句與 Hashtag 之間都必須保留上述換行；不要加「以下是資訊欄文案」等前言。

只輸出符合指定 JSON Schema 的內容，不要在 JSON 外加任何說明。`;
}

function parsePackage(text: string) {
  const parsed = JSON.parse(text) as {
    script?: unknown;
    description?: unknown;
  };
  const script = validString(parsed.script, 24_000);
  const description = validString(parsed.description, 8_000).replace(
    /\n*【(?:資料來源|參考來源|參考資料)】[\s\S]*?(?=\n+(?:管理現金流｜降低薪水依賴｜拿回人生選擇權|#)|$)/g,
    '\n\n',
  );
  if (!script || !description) throw new Error('腳本結果格式不完整');
  return { script, description };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const studioCode = process.env.STUDIO_ACCESS_CODE;
    if (!apiKey || !studioCode) {
      return Response.json(
        { error: '腳本生成尚未完成啟用，請先設定平台金鑰。' },
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
      const painPoint = validString(body.painPoint, 1000);
      const supplement = validString(body.supplement, 3000);
      const references = validString(body.references, 3000);
      const research = validString(body.research, 20_000);
      const rawSources = Array.isArray(body.researchSources)
        ? body.researchSources
        : [];
      const researchSources = rawSources
        .map((source) => {
          const item = source as Record<string, unknown>;
          return {
            title: validString(item.title, 300),
            url: validString(item.url, 1200),
          };
        })
        .filter((source) => source.title && /^https?:\/\//.test(source.url))
        .slice(0, 12);

      if (!topic || !title || !['現金流管理', 'AI資產建立'].includes(pillar)) {
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
          reasoning: { effort: 'medium' },
          max_output_tokens: 7000,
          input: scriptPrompt({
            pillar,
            topic,
            title,
            painPoint,
            supplement,
            references,
            research,
            researchSources,
          }),
          text: {
            format: {
              type: 'json_schema',
              name: 'youtube_script_package',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  script: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['script', 'description'],
                additionalProperties: false,
              },
            },
          },
        }),
      });
      if (!result.id) throw new Error('未取得背景腳本任務編號');
      return Response.json({ responseId: result.id, status: result.status });
    }

    if (body.phase === 'status') {
      const responseId = validString(body.responseId, 200);
      if (!/^resp_[A-Za-z0-9_-]+$/.test(responseId)) {
        return Response.json(
          { error: '腳本任務編號不正確。' },
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
            '背景腳本未能完成，請重新產生。',
        );
      }
      const resultPackage = parsePackage(textFrom(result));
      return Response.json({ status: 'completed', ...resultPackage });
    }

    return Response.json({ error: '不支援的處理階段。' }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
        ? '腳本服務連線超過等待時間，請稍後查看進度。'
        : error instanceof Error
          ? error.message
          : '腳本生成暫時無法使用';
    return Response.json({ error: message }, { status: 500 });
  }
}
