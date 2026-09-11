export const maxDuration = 60;

const OPENAI_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-5.6-luna';

type OpenAIContent = {
  type?: string;
  text?: string;
  annotations?: Array<{ type?: string; url?: string; title?: string }>;
};

type OpenAIOutput = {
  type?: string;
  content?: OpenAIContent[];
  action?: {
    sources?: Array<{ type?: string; url?: string; title?: string }>;
  };
};

type OpenAIResponse = {
  id?: string;
  status?: string;
  output?: OpenAIOutput[];
  error?: { message?: string };
  incomplete_details?: { reason?: string };
};

type Source = {
  title: string;
  url: string;
  excerpt: string;
};

function textFrom(response: OpenAIResponse) {
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === 'output_text' && content.text)
    .map((content) => content.text)
    .join('\n')
    .trim();
}

function sourcesFrom(response: OpenAIResponse) {
  const sources = new Map<string, Source>();
  for (const output of response.output || []) {
    for (const source of output.action?.sources || []) {
      if (!source.url || sources.has(source.url)) continue;
      sources.set(source.url, {
        title: source.title?.trim() || '未命名來源',
        url: source.url,
        excerpt: '',
      });
    }
    for (const content of output.content || []) {
      for (const annotation of content.annotations || []) {
        if (!annotation.url || sources.has(annotation.url)) continue;
        sources.set(annotation.url, {
          title: annotation.title?.trim() || '未命名來源',
          url: annotation.url,
          excerpt: '',
        });
      }
    }
  }
  return [...sources.values()].slice(0, 12);
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
    throw new Error(data.error?.message || 'OpenAI API 暫時無法使用');
  }
  return data;
}

function parseJsonArray(text: string) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) throw new Error('選題結果格式不完整');
  return JSON.parse(text.slice(start, end + 1)) as Array<{
    title?: unknown;
    angle?: unknown;
    sourceIndex?: unknown;
    publishedAt?: unknown;
    score?: unknown;
  }>;
}

function validString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function researchPrompt(
  pillar: string,
  keyword: string,
  supplement: string,
  references: string,
  today: string,
) {
  const fallbackFocus =
    pillar === '現金流管理'
      ? '台灣房貸、家庭支出、就業、通膨、保險與現金流風險'
      : '台灣 AI 工具、數位產品、內容資產、副業收入與工作流';
  return `今天是 ${today}（台北時間）。請使用網頁搜尋，替台灣 YouTube 頻道「米克大叔」查證最近 30 天可用的選題素材。

頻道核心：現金流。AI 只是建立副業資產、降低薪水依賴的手段。
受眾：35–55 歲、有家庭責任、主要收入來自薪水的台灣上班族。
創作方向：${pillar}
觀眾痛點：${keyword || '未提供，請依創作方向尋找近期熱點'}
補充：${supplement || '未提供'}
對標影片或參考來源：${references || '未提供'}
無明確輸入時的搜尋焦點：${fallbackFocus}

搜尋時最多使用 3 組聚焦查詢，依序考慮：
1. 觀眾痛點或補充說明最近 30 天的台灣新聞。
2. 與創作方向相關的台灣政府、研究機構或原始統計資料。
3. 相關產業趨勢、主要媒體報導與生活案例。

優先台灣政府、研究機構、主要媒體與原始發布來源。只整理能由搜尋結果支持的事實，不可用既有記憶補新聞，不可捏造日期或數字。找不到合格來源時，明確寫「查無足夠的近 30 天來源」。

請用精簡繁體中文輸出最多 8 筆研究摘要，每筆包含：事件、發布日期、與家庭現金流的關聯、可切入的觀眾痛點。這一步只整理研究，不要產生影片標題。`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const studioCode = process.env.STUDIO_ACCESS_CODE;
    if (!apiKey || !studioCode) {
      return Response.json(
        { error: '選題雷達尚未完成啟用，請先設定平台金鑰。' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.accessCode !== 'string' || body.accessCode !== studioCode) {
      return Response.json({ error: '平台使用碼不正確。' }, { status: 401 });
    }

    const phase = body.phase;
    const pillar = validString(body.pillar, 40);
    const keyword = validString(body.keyword, 500);
    const supplement = validString(body.supplement, 1500);
    const references = validString(body.references, 1500);
    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

    if (phase === 'research') {
      if (!['現金流管理', 'AI資產建立'].includes(pillar)) {
        return Response.json({ error: '創作方向不正確。' }, { status: 400 });
      }
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const result = await openAIRequest(apiKey, '/responses', {
        method: 'POST',
        body: JSON.stringify({
          model,
          background: true,
          store: true,
          reasoning: { effort: 'low' },
          tools: [
            {
              type: 'web_search',
              search_context_size: 'low',
              user_location: {
                type: 'approximate',
                country: 'TW',
                city: 'Taipei',
                region: 'Taiwan',
              },
            },
          ],
          include: ['web_search_call.action.sources'],
          input: researchPrompt(pillar, keyword, supplement, references, today),
        }),
      });
      if (!result.id) throw new Error('未取得背景搜尋任務編號');
      return Response.json({ responseId: result.id, status: result.status });
    }

    if (phase === 'researchStatus') {
      const responseId = validString(body.responseId, 200);
      if (!/^resp_[A-Za-z0-9_-]+$/.test(responseId)) {
        return Response.json(
          { error: '搜尋任務編號不正確。' },
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
            '背景搜尋未能完成，請重新開始。',
        );
      }
      const research = textFrom(result);
      if (!research) throw new Error('沒有取得可用的研究摘要');
      const searchedAt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      return Response.json({
        status: 'completed',
        research,
        sources: sourcesFrom(result),
        searchedAt,
      });
    }

    if (phase === 'topics') {
      const research = validString(body.research, 20_000);
      const rawSources = Array.isArray(body.sources) ? body.sources : [];
      const sources: Source[] = rawSources
        .map((source) => {
          const item = source as Record<string, unknown>;
          return {
            title: validString(item.title, 300),
            url: validString(item.url, 1000),
            excerpt: validString(item.excerpt, 500),
          };
        })
        .filter((source) => source.title && /^https?:\/\//.test(source.url))
        .slice(0, 12);
      if (!research) {
        return Response.json(
          { error: '缺少第一階段研究結果。' },
          { status: 400 },
        );
      }

      const sourceList = sources
        .map(
          (source, index) =>
            `${index + 1}. ${source.title}\nURL: ${source.url}\n摘錄: ${source.excerpt}`,
        )
        .join('\n\n');
      const prompt = `請根據下方「已完成網路查證的研究摘要」產生 5–8 個 YouTube 選題。頻道核心是現金流，受眾是 35–55 歲、有家庭責任的台灣上班族。

創作方向：${pillar}
觀眾痛點：${keyword || '未指定'}
補充：${supplement || '未提供'}

研究摘要：
${research}

可引用來源（只能用這份編號）：
${sourceList || '沒有取得可引用來源'}

每題必須鎖定一個生活場景、一個痛點、一個現金流切角。若題目有直接來源，sourceIndex 填來源編號，score 可為 1–5；若沒有直接來源，sourceIndex 必須是 null、score 最高 3，並視為「AI 推想選題」。不可杜撰來源、日期或數據。

只輸出 JSON 陣列，不要 Markdown、不要前言：
[{"title":"影片選題","angle":"為什麼觀眾會在意，以及現金流切角","sourceIndex":1,"publishedAt":"YYYY-MM-DD；研究摘要未明示時填日期未確認","score":5}]`;
      const result = await openAIRequest(
        apiKey,
        '/responses',
        {
          method: 'POST',
          body: JSON.stringify({
            model,
            reasoning: { effort: 'low' },
            max_output_tokens: 2400,
            input: prompt,
          }),
        },
        52_000,
      );
      const rawCandidates = parseJsonArray(textFrom(result));
      const candidates = rawCandidates
        .map((candidate) => {
          const title = validString(candidate.title, 180);
          const angle = validString(candidate.angle, 400);
          const parsedIndex = Number(candidate.sourceIndex);
          const sourceIndex =
            Number.isInteger(parsedIndex) &&
            parsedIndex >= 1 &&
            parsedIndex <= sources.length
              ? parsedIndex
              : null;
          const requestedScore = Math.max(
            1,
            Math.min(5, Number(candidate.score) || 1),
          );
          return {
            title,
            angle,
            publishedAt: sourceIndex
              ? validString(candidate.publishedAt, 30) || '日期未確認'
              : '',
            score: sourceIndex ? requestedScore : Math.min(3, requestedScore),
            inferred: !sourceIndex,
            source: sourceIndex ? sources[sourceIndex - 1] : null,
          };
        })
        .filter((candidate) => candidate.title && candidate.angle)
        .slice(0, 8);
      if (candidates.length < 5) throw new Error('選題數量不足，請再試一次');
      return Response.json({ candidates });
    }

    return Response.json({ error: '不支援的處理階段。' }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof DOMException &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')
        ? '服務連線超過等待時間，請稍後再試一次。'
        : error instanceof Error
          ? error.message
          : '選題雷達暫時無法使用';
    return Response.json({ error: message }, { status: 500 });
  }
}
