export const maxDuration = 60;

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

type AnthropicBlock = {
  type?: string;
  text?: string;
  citations?: Array<{
    type?: string;
    url?: string;
    title?: string;
    cited_text?: string;
  }>;
};

type AnthropicResponse = {
  content?: AnthropicBlock[];
  stop_reason?: string;
  error?: { message?: string };
};

type Source = {
  title: string;
  url: string;
  excerpt: string;
};

function textFrom(response: AnthropicResponse) {
  return (response.content || [])
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function sourcesFrom(responses: AnthropicResponse[]) {
  const sources = new Map<string, Source>();
  for (const response of responses) {
    for (const block of response.content || []) {
      for (const citation of block.citations || []) {
        if (!citation.url || sources.has(citation.url)) continue;
        sources.set(citation.url, {
          title: citation.title?.trim() || '未命名來源',
          url: citation.url,
          excerpt: citation.cited_text?.trim() || '',
        });
      }
    }
  }
  return [...sources.values()].slice(0, 12);
}

async function callAnthropic(
  apiKey: string,
  payload: Record<string, unknown>,
  signal = AbortSignal.timeout(50_000),
) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
    signal,
  });
  const data = (await response.json()) as AnthropicResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || 'Anthropic API 暫時無法使用');
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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
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
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

    if (phase === 'research') {
      if (!['現金流管理', 'AI資產建立'].includes(pillar)) {
        return Response.json({ error: '創作方向不正確。' }, { status: 400 });
      }

      const fallbackFocus =
        pillar === '現金流管理'
          ? '台灣房貸、家庭支出、就業、通膨、保險與現金流風險'
          : '台灣 AI 工具、數位產品、內容資產、副業收入與工作流';
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const prompt = `今天是 ${today}（台北時間）。請務必使用網頁搜尋，替台灣 YouTube 頻道「米克大叔」查證最近 30 天可用的選題素材。

頻道核心：現金流。AI 只是建立副業資產、降低薪水依賴的手段。
受眾：35–55 歲、有家庭責任、主要收入來自薪水的台灣上班族。
創作方向：${pillar}
觀眾痛點：${keyword || '未提供，請依創作方向尋找近期熱點'}
補充：${supplement || '未提供'}
對標影片或參考來源：${references || '未提供'}
無明確輸入時的搜尋焦點：${fallbackFocus}

請執行 3 次聚焦搜尋，優先台灣政府、研究機構、主要媒體與原始發布來源。只整理能由搜尋結果支持的事實，不可用既有記憶補新聞，不可捏造日期或數字。若找不到合格來源，明確寫「查無足夠的近 30 天來源」。

請用精簡繁體中文輸出最多 8 筆研究摘要，每筆包含：事件、發布日期、與家庭現金流的關聯、可切入的觀眾痛點。這一步只整理研究，不要產生影片標題。`;

      const messages: Array<Record<string, unknown>> = [
        { role: 'user', content: prompt },
      ];
      const tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
          user_location: {
            type: 'approximate',
            country: 'TW',
            timezone: 'Asia/Taipei',
          },
        },
      ];
      const searchDeadline = AbortSignal.timeout(55_000);
      let result = await callAnthropic(
        apiKey,
        {
          model,
          max_tokens: 1800,
          messages,
          tools,
        },
        searchDeadline,
      );
      const researchTurns = [result];
      if (result.stop_reason === 'pause_turn' && result.content) {
        messages.push({ role: 'assistant', content: result.content });
        messages.push({ role: 'user', content: '請繼續並完成研究摘要。' });
        result = await callAnthropic(
          apiKey,
          {
            model,
            max_tokens: 1200,
            messages,
            tools,
          },
          searchDeadline,
        );
        researchTurns.push(result);
      }

      const research = researchTurns.map(textFrom).filter(Boolean).join('\n');
      const sources = sourcesFrom(researchTurns);
      if (!research) throw new Error('沒有取得可用的研究摘要');
      return Response.json({ research, sources, searchedAt: today });
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
      const result = await callAnthropic(apiKey, {
        model,
        max_tokens: 2400,
        messages: [{ role: 'user', content: prompt }],
      });
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
        ? '網路熱點搜尋超過等待時間，請稍後再試一次。'
        : error instanceof Error
          ? error.message
          : '選題雷達暫時無法使用';
    return Response.json({ error: message }, { status: 500 });
  }
}
