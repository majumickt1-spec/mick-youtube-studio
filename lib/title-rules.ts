export type TitleOption = {
  kind: '反常型' | '金額型' | '數字型';
  title: string;
};

function shortenWithoutBreakingEnglish(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  let end = maxLength;
  while (
    end < cleaned.length &&
    /[A-Za-z0-9]/.test(cleaned[end - 1]) &&
    /[A-Za-z0-9]/.test(cleaned[end])
  ) {
    end += 1;
  }
  return cleaned.slice(0, end).trim();
}

function topicAnchor(topic: string) {
  const normalized = topic
    .replace(/[「」『』【】]/g, '')
    .replace(/^(?:我想要?|想要|如何|怎麼|為什麼|請問|聊聊|探討|做一支關於)\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  const clauses = normalized
    .split(/[，,。；;：:！？?]/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const anchor = clauses.find((part) => part.length >= 5) || normalized;
  return shortenWithoutBreakingEnglish(anchor || '這個主題', 18);
}

function editorialCount(topic: string) {
  let score = 0;
  for (let index = 0; index < topic.length; index += 1) {
    score += topic.charCodeAt(index) * (index + 1);
  }
  return [2, 4, 5, 6][Math.abs(score) % 4];
}

function moneyAmounts(topic: string) {
  return topic.match(/\d[\d,.]*\s*(?:元|塊|千|萬)/gu) || [];
}

function aiSubject(topic: string, fallback: string) {
  if (/NotebookLM/iu.test(topic)) return 'NotebookLM 內容工作流';
  if (/Codex/iu.test(topic) && /智能體|Agent/iu.test(topic)) {
    return 'Codex AI 智能體';
  }
  if (/智能體|Agent|AI\s*助手/iu.test(topic)) return '個人 AI 智能體';
  if (/影片|YouTube|頻道|內容|創作/u.test(topic)) return '影片內容';
  if (/數位產品|知識產品|產品/u.test(topic)) return 'AI 數位產品';
  if (/自動化|工作流/u.test(topic)) return 'AI 工作流';
  return fallback;
}

function cashflowSubject(topic: string, fallback: string) {
  if (/房貸|買房/u.test(topic)) return '房貸後的家庭現金流';
  if (/保險|保費|保單/u.test(topic)) return '家庭保費';
  if (/裁員|失業|安全天數|沒薪水/u.test(topic)) return '家庭安全天數';
  if (/信貸|負債|貸款|還款/u.test(topic)) return '家庭負債';
  if (/薪水|收入|存不到|留不下/u.test(topic)) return '每月剩餘現金';
  return fallback;
}

/** Local fallback titles must still change with the selected Step 1 topic. */
export function makeTitles(topic: string, pillar: string): TitleOption[] {
  const anchor = topicAnchor(topic);
  const count = editorialCount(topic);
  const amounts = moneyAmounts(topic);

  if (pillar === 'AI資產建立') {
    const subject = aiSubject(topic, anchor);
    const outcome = /影片|YouTube|頻道|內容|創作/u.test(topic)
      ? '累積成內容資產'
      : /產品|服務|付費|客戶|銷售/u.test(topic)
        ? '通過付費驗證'
        : /智能體|Agent|Codex|AI\s*助手/iu.test(topic)
          ? '穩定替你工作'
          : '降低工時依賴';
    return [
      {
        kind: '反常型',
        title: `${subject}做得出來，為什麼還不能${outcome}？`,
      },
      {
        kind: '反常型',
        title: `別急著換工具：${subject}真正缺的可能不是更多 AI`,
      },
      {
        kind: '數字型',
        title: `${count} 個檢查點，看懂「${subject}」能不能${outcome}`,
      },
    ];
  }

  const subject = cashflowSubject(topic, anchor);
  const isRunwayTopic = /裁員|失業|安全天數|沒薪水/u.test(topic);
  const secondOption: TitleOption = amounts.length
    ? {
        kind: '金額型',
        title: `${subject}涉及 ${amounts.slice(0, 2).join('、')}，家裡真正剩下多少？`,
      }
    : {
        kind: '反常型',
        title: isRunwayTopic
          ? '真正可怕的不是失業，是你不知道家裡能撐多久'
          : `問題可能不在${subject}本身，而是你每月真正剩多少`,
      };
  return [
    {
      kind: '反常型',
      title: isRunwayTopic
        ? '工作還在，為什麼家庭安全天數可能比你想的短？'
        : `${subject}看起來負擔得起，為什麼家裡還是沒餘裕？`,
    },
    secondOption,
    {
      kind: '數字型',
      title: `${count} 個現金流檢查點，看清「${subject}」有沒有壓縮家庭餘裕`,
    },
  ];
}
