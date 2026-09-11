'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Lightbulb,
  LoaderCircle,
  Menu,
  NotebookPen,
  Play,
  Radar,
  Scissors,
  Share2,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: Record<string, unknown>,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const steps = [
  { label: '選題雷達', detail: '靈感狀態＋方向＋痛點與來源', icon: Radar },
  {
    label: '縮圖生成',
    detail: '3 組無字圖＋大字與 Canva 提示詞',
    icon: ImageIcon,
  },
  { label: '腳本創作', detail: '口語腳本＋資訊欄文案', icon: NotebookPen },
  { label: 'AI 剪輯', detail: '透過剪輯 Skill 建立成片', icon: Scissors },
  { label: '社群宣傳', detail: 'Facebook＋Instagram 文案', icon: Share2 },
];

const thumbIdeasByPillar = {
  現金流管理: [
    {
      name: '薪水依賴',
      text: '薪水停了呢？',
      scene: '手機銀行餘額＋家庭帳單，人物沉著面對風險',
      prompt:
        'Cinematic Taiwanese middle-aged office worker at a dining table, phone banking balance and household bills, calm but concerned expression, black white and gold palette, warm realistic light, YouTube thumbnail, 16:9, no text, no letters, no logo',
    },
    {
      name: '目標數字',
      text: '非工資 2 倍',
      scene: '非工資收入與總支出形成清楚的 2× 對比',
      prompt:
        'Realistic household cashflow concept, two streams of income balanced against one stack of expenses, elegant black white and gold palette, warm family atmosphere, strong visual contrast, YouTube thumbnail, 16:9, no text, no letters, no logo',
    },
    {
      name: '安全天數',
      text: '還能撐幾天？',
      scene: '家庭月曆、必要支出與可動用現金形成倒數感',
      prompt:
        'Realistic family calendar beside essential bills and limited emergency cash, visual countdown tension, premium black white and gold palette, warm cinematic lighting, YouTube thumbnail, 16:9, no text, no letters, no logo',
    },
  ],
  AI資產建立: [
    {
      name: '資產判斷',
      text: '副業還是打工？',
      scene: '左側持續投入工時，右側是可累積的數位資產',
      prompt:
        'Split scene, overworked middle-aged office worker trading time on the left, reusable digital product generating value on the right, realistic Taiwanese setting, black white and gold palette, YouTube thumbnail, 16:9, no text, no letters, no logo',
    },
    {
      name: '工具迷思',
      text: '別只學 AI',
      scene: '模糊的工具圖示退到背景，清楚收入數字成為主角',
      prompt:
        'Middle-aged creator ignoring a wall of blurred AI app icons and focusing on a real customer payment notification, premium black white and gold, warm realistic lighting, YouTube thumbnail, 16:9, no text, no letters, no logo',
    },
    {
      name: '收入驗證',
      text: '真的有人買？',
      scene: '普通上班族查看第一筆數位產品成交紀錄',
      prompt:
        'Ordinary Taiwanese office worker seeing the first digital product sale on a laptop, authentic surprised expression, home desk at night, black white and gold palette, cinematic realism, YouTube thumbnail, 16:9, no text, no letters, no logo',
    },
  ],
};

const pillars = [
  {
    value: '現金流管理',
    label: '現金流管理',
  },
  {
    value: 'AI資產建立',
    label: 'AI資產建立',
  },
];

type ResearchSource = {
  title: string;
  url: string;
  excerpt: string;
};

type TopicCandidate = {
  title: string;
  angle: string;
  publishedAt: string;
  score: number;
  inferred: boolean;
  source: ResearchSource | null;
};

type SavedState = {
  videoName: string;
  topicMode: string;
  pillar: string;
  keyword: string;
  supplement: string;
  sources: string;
  researchSummary: string;
  researchSources: ResearchSource[];
  researchDate: string;
  researchJobId: string;
  candidates: string[];
  candidateDetails: TopicCandidate[];
  selectedTopic: string;
  selectedTitle: string;
  selectedThumb: number;
  script: string;
  description: string;
  editPlan: string;
  fbCopy: string;
  igCopy: string;
};

const initialState: SavedState = {
  videoName: '本月第 1 支｜降低薪水依賴',
  topicMode: 'trend',
  pillar: '現金流管理',
  keyword: '',
  supplement: '',
  sources: '',
  researchSummary: '',
  researchSources: [],
  researchDate: '',
  researchJobId: '',
  candidates: [],
  candidateDetails: [],
  selectedTopic: '',
  selectedTitle: '',
  selectedThumb: 0,
  script: '',
  description: '',
  editPlan: '',
  fbCopy: '',
  igCopy: '',
};

function makeCandidates(keyword: string, pillar: string, topicMode: string) {
  const focus = keyword.trim() || '降低薪水依賴';
  if (pillar === 'AI資產建立') {
    if (topicMode === 'planned') {
      return [
        `${focus}：這份 AI 副業是在增加收入，還是在建立資產？`,
        `${focus}：普通上班族可以先做的第一個 AI 資產`,
        `${focus}：別急著換工具，先驗證有沒有人願意付錢`,
        `${focus}：每天一小時，如何累積可重複銷售的內容資產？`,
        `${focus}：從一次性接案走向可累積收入的三個步驟`,
      ];
    }
    return [
      `這份 AI 副業只是多打一份工，還是在累積資產？｜${focus}`,
      `普通上班族怎麼用 AI，做出第一個有人願意付錢的數位產品？`,
      `別再只學 AI 工具：先算它能不能替你增加非工資收入`,
      `每天只有一小時，怎麼把 YouTube 內容變成可累積的收入資產？`,
      `AI 副業沒賺錢，不一定是工具不夠強：你可能少了現金流驗證`,
    ];
  }
  if (topicMode === 'planned') {
    return [
      `${focus}：先從家庭每月現金流找出真正問題`,
      `${focus}：資產不少，為什麼還是沒有安全感？`,
      `${focus}：用現金流安全天數看懂你能撐多久`,
      `${focus}：哪些固定支出正在拿走你的選擇權？`,
      `${focus}：從薪水依賴走向財務餘裕的第一步`,
    ];
  }
  return [
    `如果明天沒有薪水，你家的現金流能撐多久？｜${focus}`,
    `資產不少卻不安心？先看每個月真正流進來多少錢`,
    `1 倍只是自由門檻：為什麼非工資收入要做到支出的 2 倍？`,
    `投資前先算這個數字：你家的現金流安全天數`,
    `房貸不是只看利率：它每個月拿走多少人生選擇權？`,
  ];
}

function makeTitles(topic: string, pillar: string) {
  const base = topic || '家庭現金流出了問題';
  if (pillar === 'AI資產建立') {
    return [
      base.split('｜')[0],
      '這份 AI 副業是在賺收入，還是在建立資產？',
      '別急著學下一個 AI 工具：先驗證有沒有人願意付錢',
    ];
  }
  return [
    base.split('｜')[0],
    '如果明天沒有薪水，你現在的現金流撐得住嗎？',
    '別只看賺多少：真正重要的是你還有多依賴薪水',
  ];
}

function buildScript(state: SavedState) {
  const title = state.selectedTitle || state.selectedTopic || '本集主題待確認';
  const supplement = state.supplement.trim() || '〔未提供額外補充〕';
  const sources = state.sources.trim() || '〔未提供參考來源〕';
  return `# ${title}\n\n## ▌Hook\n如果有一天薪水消失了，你現在擁有的現金流，能不能繼續支撐生活？這一集，我們不追最新工具，也不追最高報酬，而是看這件事能不能降低你對薪水的依賴。\n\n## ▌觀眾痛點\n${state.keyword}\n\n## ▌米克大叔補充\n${supplement}\n\n## ▌參考來源\n${sources}\n\n## ▌重新理解問題\n頻道的核心不是投資，也不是 AI 副業，而是現金流。資產與負債要看它每個月帶來或拿走多少現金；AI 則是普通上班族建立副業資產、增加非工資收入的手段。\n\n## ▌方法\n把方法放回這一條路：先守住家庭現金流，再把副業收入變成可累積的資產。1 倍是財富自由的門檻，2 倍才有可以掉、可以修、可以等、可以拒絕的餘裕。\n\n## ▌最小行動\n依這次痛點整理一個觀眾今天晚上就能開始的具體步驟。\n\n## ▌CTA\n依本集內容只保留一個已確認可用的行動或資源；連結上架前再次核對，不放未核實網址。\n\n## ▌定位管理確認\n核心：現金流｜方法：管理現金流＋建立 AI 副業資產｜終點：非工資收入 ≥ 2×總支出，拿回人生選擇權。\n\n## ▌試讀提醒\n把這份稿念出來。凡是你平常不會說的句子，就改回你的原話；沒有親身經歷的故事，不要補。`;
}

function buildDescription(state: SavedState) {
  const title = state.selectedTitle || state.selectedTopic;
  return `${title}\n\n如果有一天薪水消失，你現在的現金流能不能繼續支撐生活？這支影片會從「${state.pillar}」出發，陪你看懂如何改善現金流、降低薪水依賴。\n\n這集你會帶走：\n・重新理解問題的現金流視角\n・一個普通上班族做得到的方法\n・今天晚上就能開始的最小行動\n\n1 倍，是財富自由的門檻。2 倍，是不用為生存奔波的餘裕。\n\n#現金流 #降低薪水依賴 #米克大叔`;
}

function buildEditPlan(state: SavedState) {
  return `# ${state.selectedTitle || state.selectedTopic}｜AI 剪輯任務\n\n## 節奏\n開場 10 秒快速建立「薪水消失」的危機感；觀念段保留停頓；方法段加入條列與關鍵字畫面；結尾回到 1 倍與 2 倍。\n\n## 必留重點\n觀眾痛點：${state.keyword}\n米克補充：${state.supplement || '無'}\n\n## 畫面規則\n黑白金、溫暖寫實、家庭感；不使用卡通人物、通用商務人物或暴富視覺。字幕保持繁體中文，關鍵數字只強調「1×」與「2×」。\n\n## 交付\n16:9 YouTube 主片、去除明顯停頓與口誤、保留自然呼吸；需由米克大叔看片確認後才能定稿。`;
}

function buildSocialCopy(state: SavedState) {
  const title = state.selectedTitle || state.selectedTopic;
  return {
    fbCopy: `如果明天薪水停了，你現在的現金流可以撐多久？\n\n很多人談理財，第一個想到的是投資報酬率。但對一個有家庭責任的上班族來說，更早該問的是：我有多少收入，不需要靠每天上班才能得到？\n\n這支新影片，我想用「${title}」陪你重新看懂薪水、支出與人生選擇權之間的關係。\n\n1 倍，是財富自由的門檻；2 倍，才是可以掉、可以修、可以等、可以拒絕的餘裕。\n\n影片連結：〔上架後貼入〕`,
    igCopy: `薪水，是收入。\n但不該是唯一的安全感。\n\n這次從「${title}」開始，重新看懂現金流。\n\n管理現金流｜降低薪水依賴｜拿回人生選擇權\n\n完整影片：個人檔案連結\n\n#現金流 #薪水依賴 #財務自由 #AI副業 #米克大叔`,
  };
}

export default function Home() {
  const [stage, setStage] = useState('0');
  const [state, setState] = useState<SavedState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchAction, setActiveSearchAction] = useState<
    'research' | 'topics' | ''
  >('');
  const [searchPhase, setSearchPhase] = useState('');
  const [searchError, setSearchError] = useState('');
  const titles = useMemo(
    () => makeTitles(state.selectedTopic, state.pillar),
    [state.selectedTopic, state.pillar],
  );
  const thumbIdeas =
    thumbIdeasByPillar[state.pillar as keyof typeof thumbIdeasByPillar] ||
    thumbIdeasByPillar.現金流管理;
  const completed = [
    Boolean(state.selectedTopic),
    Boolean(state.selectedTitle),
    Boolean(state.script) && Boolean(state.description),
    Boolean(state.editPlan),
    Boolean(state.fbCopy) && Boolean(state.igCopy),
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem('mick-youtube-studio-v4');
      if (saved) {
        try {
          setState({ ...initialState, ...JSON.parse(saved) });
        } catch {
          /* preserve a fresh safe state */
        }
      }
      setAccessCode(window.sessionStorage.getItem('studio-access-code') || '');
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      'mick-youtube-studio-v4',
      JSON.stringify(state),
    );
  }, [hydrated, state]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: 'open_creation_stage',
          title: '開啟創作階段',
          description: '在 YT-AI Agent創作平台(CX) 中開啟指定階段。',
          inputSchema: {
            type: 'object',
            properties: { stage: { type: 'integer', minimum: 1, maximum: 5 } },
            required: ['stage'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input: unknown) => {
            const value = (input as { stage?: number })?.stage;
            if (!Number.isInteger(value) || !value || value < 1 || value > 5)
              throw new Error('stage 必須是 1 到 5');
            setStage(String(value - 1));
            return { stage: value, label: steps[value - 1].label };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function update(patch: Partial<SavedState>) {
    setState((current) => ({ ...current, ...patch }));
  }
  function clearResearchAndTopics(extra: Partial<SavedState>) {
    update({
      ...extra,
      researchSummary: '',
      researchSources: [],
      researchDate: '',
      researchJobId: '',
      candidates: [],
      candidateDetails: [],
      selectedTopic: '',
      selectedTitle: '',
    });
    setSearchPhase('');
    setSearchError('');
  }
  function go(next: number) {
    setStage(String(next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function copyScript() {
    void navigator.clipboard
      .writeText(state.script)
      .then(() => setNotice('腳本已複製，可以貼到你的試讀工具。'));
  }
  function copyText(text: string, message: string) {
    void navigator.clipboard.writeText(text).then(() => setNotice(message));
  }
  async function pollResearch(responseId: string, code: string) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const response = await fetch('/api/topic-radar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phase: 'researchStatus',
          accessCode: code,
          responseId,
        }),
      });
      const data = (await response.json()) as {
        status?: string;
        research?: string;
        sources?: ResearchSource[];
        searchedAt?: string;
        error?: string;
      };
      if (!response.ok) {
        update({ researchJobId: '' });
        throw new Error(data.error || '無法查詢搜尋進度');
      }
      if (data.status === 'completed' && data.research) {
        update({
          researchJobId: '',
          researchSummary: data.research,
          researchSources: data.sources || [],
          researchDate: data.searchedAt || '',
          candidates: [],
          candidateDetails: [],
          selectedTopic: '',
          selectedTitle: '',
        });
        setSearchPhase('查證完成。請檢視素材，再按第二步產生選題。');
        return;
      }
      setSearchPhase('OpenAI 正在背景搜尋並查證近期熱點…');
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    }
    throw new Error(
      '搜尋仍在背景執行。稍後再按「查看搜尋進度」，不會重新計費或重複搜尋。',
    );
  }

  async function researchTrends() {
    setSearchError('');
    if (!accessCode.trim()) {
      setSearchError('請先輸入平台使用碼。');
      return;
    }

    setIsSearching(true);
    setActiveSearchAction('research');
    window.sessionStorage.setItem('studio-access-code', accessCode.trim());
    try {
      const code = accessCode.trim();
      let responseId = state.researchJobId;
      if (!responseId) {
        setSearchPhase('正在建立 OpenAI 背景搜尋任務…');
        const response = await fetch('/api/topic-radar', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            phase: 'research',
            accessCode: code,
            pillar: state.pillar,
            keyword: state.keyword,
            supplement: state.supplement,
            references: state.sources,
          }),
        });
        const data = (await response.json()) as {
          responseId?: string;
          error?: string;
        };
        if (!response.ok || !data.responseId) {
          throw new Error(data.error || '無法建立背景搜尋任務');
        }
        responseId = data.responseId;
        update({
          researchJobId: responseId,
          researchSummary: '',
          researchSources: [],
          researchDate: '',
          candidates: [],
          candidateDetails: [],
          selectedTopic: '',
          selectedTitle: '',
        });
      }
      await pollResearch(responseId, code);
    } catch (error) {
      setSearchPhase('');
      setSearchError(
        error instanceof Error ? error.message : '選題雷達暫時無法使用',
      );
    } finally {
      setIsSearching(false);
      setActiveSearchAction('');
    }
  }
  async function generateCandidates() {
    setSearchError('');
    if (state.topicMode === 'planned') {
      update({
        candidates: makeCandidates(
          state.keyword,
          state.pillar,
          state.topicMode,
        ),
        candidateDetails: [],
      });
      return;
    }
    if (!accessCode.trim()) {
      setSearchError('請先輸入平台使用碼。');
      return;
    }
    if (!state.researchSummary) {
      setSearchError('請先完成第一步的熱點搜尋與查證。');
      return;
    }

    setIsSearching(true);
    setActiveSearchAction('topics');
    window.sessionStorage.setItem('studio-access-code', accessCode.trim());
    try {
      setSearchPhase('正在根據已保存的查證資料產生 5–8 個選題…');
      const topicResponse = await fetch('/api/topic-radar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phase: 'topics',
          accessCode: accessCode.trim(),
          pillar: state.pillar,
          keyword: state.keyword,
          supplement: state.supplement,
          research: state.researchSummary,
          sources: state.researchSources,
        }),
      });
      const topicData = (await topicResponse.json()) as {
        candidates?: TopicCandidate[];
        error?: string;
      };
      if (!topicResponse.ok || !topicData.candidates) {
        throw new Error(topicData.error || '無法產生選題');
      }
      update({
        candidates: topicData.candidates.map((candidate) => candidate.title),
        candidateDetails: topicData.candidates,
        selectedTopic: '',
        selectedTitle: '',
      });
      setSearchPhase('');
    } catch (error) {
      setSearchPhase('');
      setSearchError(
        error instanceof Error ? error.message : '選題雷達暫時無法使用',
      );
    } finally {
      setIsSearching(false);
      setActiveSearchAction('');
    }
  }
  function exportProject() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.videoName || '米克影片企劃'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('本集企劃已匯出備份。');
  }
  return (
    <Tabs
      value={stage}
      onValueChange={setStage}
      className="min-h-screen gap-0 bg-background text-foreground lg:flex-row"
    >
      <aside className="hidden w-[292px] shrink-0 border-r border-white/10 bg-[#11110f] px-5 py-6 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-10 place-items-center rounded-full border border-[#d4af64]/50 bg-[#d4af64]/10 text-[#e7c87f]">
            <Anchor className="size-5" />
          </div>
          <div>
            <p className="font-semibold tracking-wide">
              YT-AI Agent創作平台(CX)
            </p>
            <p className="text-xs text-white/48">五步完成一支影片</p>
          </div>
        </div>
        <p className="mt-10 px-2 text-xs font-semibold tracking-[0.18em] text-[#d4af64]">
          創作流程
        </p>
        <TabsList
          aria-label="影片製作流程"
          className="mt-4 flex h-auto w-full flex-col items-stretch gap-2 bg-transparent p-0"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <TabsTrigger
                key={step.label}
                value={String(index)}
                className="group h-auto w-full justify-start gap-3 rounded-xl border-0 px-3 py-3 text-left text-white/65 data-active:bg-[#d4af64] data-active:text-[#151515]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-current/15 bg-current/5">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {index + 1}. {step.label}
                  </span>
                  <span className="block truncate text-xs opacity-55">
                    {step.detail}
                  </span>
                </span>
                {completed[index] ? (
                  <CircleCheck className="size-4" />
                ) : (
                  <ChevronRight className="size-4 opacity-45" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="border-b border-border bg-[#151515] px-4 py-3 lg:hidden">
          <div className="mb-2 flex items-center gap-2 text-white">
            <Menu className="size-4" />
            <span className="text-xs">創作航線</span>
          </div>
          <TabsList className="grid h-auto w-full grid-cols-5 bg-white/5 p-1">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.label}
                value={String(index)}
                className="h-10 px-1 text-xs text-white/55 data-active:bg-[#d4af64] data-active:text-black"
              >
                {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {notice && (
          <button
            onClick={() => setNotice('')}
            className="mx-5 mt-5 flex max-w-3xl items-center gap-2 rounded-xl border border-[#d4af64]/30 bg-[#d4af64]/10 px-4 py-3 text-left text-sm md:mx-9"
          >
            <CircleCheck className="size-4 text-[#8b6c2d]" />
            {notice}
          </button>
        )}

        <TabsContent value="0">
          <StageShell
            step="STEP 01"
            eyebrow="用五項資訊快速收斂創作方向"
            title="選題雷達：找出觀眾想解決的痛點。"
          >
            <section className="surface-card p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold">填寫選題條件</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    前兩項直接選擇，後三項保留你的想法與參考資料。
                  </p>
                </div>
                <IconTile>
                  <Radar className="size-5" />
                </IconTile>
              </div>
              <div className="mt-7 grid gap-5">
                <Field label="1. 有無靈感">
                  <Select
                    value={state.topicMode}
                    onValueChange={(value) => {
                      if (!value) return;
                      clearResearchAndTopics({
                        topicMode: value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 w-full rounded-xl bg-[#faf9f6]">
                      <SelectValue>
                        {state.topicMode === 'planned'
                          ? '已有方向'
                          : '沒有靈感'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trend">沒有靈感</SelectItem>
                      <SelectItem value="planned">已有方向</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="2. 創作方向">
                  <Select
                    value={state.pillar}
                    onValueChange={(value) => {
                      if (!value) return;
                      clearResearchAndTopics({
                        pillar: value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 w-full rounded-xl bg-[#faf9f6]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pillars.map((pillar) => (
                        <SelectItem key={pillar.value} value={pillar.value}>
                          {pillar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="3. 這影片想解決什麼痛點？" className="mt-5">
                <Input
                  value={state.keyword}
                  onChange={(event) =>
                    clearResearchAndTopics({
                      keyword: event.target.value,
                    })
                  }
                  placeholder="例如：擔心薪水中斷，卻不知道家庭現金流能撐多久"
                />
              </Field>
              <Field
                label="4. 關於這次主題，有沒有特別想補充的？"
                className="mt-5"
              >
                <Textarea
                  value={state.supplement}
                  onChange={(event) =>
                    clearResearchAndTopics({
                      supplement: event.target.value,
                    })
                  }
                  placeholder="可填入你的觀點、親身經驗、案例或希望一定提到的內容。"
                  className="min-h-28"
                />
              </Field>
              <Field label="5. 對標影片網址或參考來源" className="mt-5">
                <Textarea
                  value={state.sources}
                  onChange={(event) =>
                    clearResearchAndTopics({
                      sources: event.target.value,
                    })
                  }
                  placeholder="貼上 YouTube 影片網址、文章、數據來源或參考筆記。"
                  className="min-h-28"
                />
              </Field>
              {state.topicMode === 'trend' && (
                <Field label="平台使用碼" className="mt-5">
                  <Input
                    type="password"
                    value={accessCode}
                    onChange={(event) => setAccessCode(event.target.value)}
                    placeholder="用來保護你的 OpenAI API 額度"
                    autoComplete="current-password"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    這不是 OpenAI API Key，只會暫存在目前瀏覽器分頁。
                  </p>
                </Field>
              )}
              {state.topicMode === 'trend' ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gold-button"
                    disabled={isSearching}
                    onClick={() => void researchTrends()}
                  >
                    {activeSearchAction === 'research' ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Radar className="size-4" />
                    )}
                    {state.researchJobId && !state.researchSummary
                      ? '查看搜尋進度'
                      : '第一步：搜尋並查證近期熱點'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={isSearching || !state.researchSummary}
                    onClick={() => void generateCandidates()}
                  >
                    {activeSearchAction === 'topics' ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    第二步：根據查證來源產生選題
                  </Button>
                  <span className="w-full text-xs text-muted-foreground">
                    第二步失敗時可直接重試，不會重新搜尋。
                  </span>
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gold-button"
                    disabled={!state.keyword.trim()}
                    onClick={() => void generateCandidates()}
                  >
                    <Sparkles className="size-4" />
                    依目前方向產生 5 個候選題
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    依你輸入的方向快速發想。
                  </span>
                </div>
              )}
              {searchPhase && (
                <p className="mt-4 rounded-xl border border-[#d4af64]/30 bg-[#d4af64]/10 px-4 py-3 text-sm">
                  {searchPhase}
                </p>
              )}
              {searchError && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {searchError}
                </p>
              )}
              {state.topicMode === 'trend' && state.researchSummary && (
                <div className="mt-5 rounded-2xl border border-[#d4af64]/30 bg-[#faf8f1] p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-bold">已查證的近期素材</h3>
                    {state.researchDate && (
                      <span className="text-xs text-muted-foreground">
                        搜尋日期：{state.researchDate}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#37332b]">
                    {state.researchSummary}
                  </p>
                  {state.researchSources.length > 0 && (
                    <div className="mt-5 border-t border-[#d4af64]/20 pt-4">
                      <p className="text-sm font-bold">查證來源</p>
                      <div className="mt-2 grid gap-2">
                        {state.researchSources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-[#6f541f] underline underline-offset-4"
                          >
                            {source.title}
                            <ExternalLink className="ml-1 inline size-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-muted-foreground">
                    這份研究已保存在本瀏覽器；重新整理後仍可直接產生選題。
                  </p>
                </div>
              )}
            </section>
            {state.candidates.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold">
                    {state.candidates.length} 個候選題
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    選定一題後進入縮圖企劃
                  </span>
                </div>
                {state.candidateDetails.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                        <thead className="bg-[#151515] text-white">
                          <tr>
                            <th className="w-24 px-4 py-3 font-semibold">
                              評分
                            </th>
                            <th className="px-4 py-3 font-semibold">選題</th>
                            <th className="px-4 py-3 font-semibold">
                              現金流切角
                            </th>
                            <th className="w-64 px-4 py-3 font-semibold">
                              來源
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.candidateDetails.map((candidate) => (
                            <tr
                              key={candidate.title}
                              className={`border-t align-top ${state.selectedTopic === candidate.title ? 'bg-[#d4af64]/10' : ''}`}
                            >
                              <td className="px-4 py-4 font-semibold text-[#8b6c2d]">
                                {'★'.repeat(candidate.score)}
                                {'☆'.repeat(5 - candidate.score)}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() =>
                                    update({
                                      selectedTopic: candidate.title,
                                      selectedTitle: '',
                                    })
                                  }
                                  className="flex w-full items-start gap-2 text-left font-bold leading-6 hover:text-[#8b6c2d]"
                                >
                                  <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-[#d4af64]">
                                    {state.selectedTopic ===
                                      candidate.title && (
                                      <Check className="size-3" />
                                    )}
                                  </span>
                                  {candidate.title}
                                </button>
                              </td>
                              <td className="px-4 py-4 leading-6 text-muted-foreground">
                                {candidate.angle}
                              </td>
                              <td className="px-4 py-4 text-xs leading-5">
                                {candidate.inferred || !candidate.source ? (
                                  <span className="font-semibold text-amber-700">
                                    AI 推想選題｜無直接來源
                                  </span>
                                ) : (
                                  <a
                                    href={candidate.source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#6f541f] underline underline-offset-4"
                                  >
                                    {candidate.source.title}
                                    <ExternalLink className="ml-1 inline size-3" />
                                    <span className="mt-1 block font-normal text-muted-foreground no-underline">
                                      {candidate.publishedAt}
                                    </span>
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {state.candidates.map((candidate, index) => (
                      <button
                        key={candidate}
                        onClick={() =>
                          update({
                            selectedTopic: candidate,
                            selectedTitle: '',
                          })
                        }
                        className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition ${state.selectedTopic === candidate ? 'border-[#d4af64] bg-[#d4af64]/10' : 'bg-card hover:border-[#d4af64]/50'}`}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#151515] font-mono text-xs text-[#d4af64]">
                          {90 - index * 3}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold leading-6">
                            {candidate}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {state.pillar} · 依目前方向發想
                          </span>
                        </span>
                        {state.selectedTopic === candidate ? (
                          <Check className="size-5 text-[#8b6c2d]" />
                        ) : (
                          <ChevronRight className="size-5 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {state.selectedTopic && (
                  <NextButton onClick={() => go(1)}>
                    確認選題，進入縮圖企劃
                  </NextButton>
                )}
              </section>
            )}
          </StageShell>
        </TabsContent>

        <TabsContent value="1">
          <StageShell
            step="STEP 02"
            eyebrow="圖片不放中文字，文字建議與 Canva 提示詞分開"
            title="一次準備 3 組縮圖方向。"
          >
            {!state.selectedTopic ? (
              <Blocked
                text="先回到選題雷達，完成五項條件並選定主題。"
                onClick={() => go(0)}
              />
            ) : (
              <>
                <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
                  <section className="surface-card p-5 md:p-7">
                    <p className="text-sm font-bold">本集核心問題</p>
                    <p className="mt-2 text-xl font-black leading-8">
                      {state.selectedTopic}
                    </p>
                    <div className="mt-6 space-y-3">
                      <p className="text-sm font-bold">選一個標題</p>
                      {titles.map((title) => (
                        <button
                          key={title}
                          onClick={() => {
                            update({ selectedTitle: title });
                          }}
                          className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm font-semibold leading-6 ${state.selectedTitle === title ? 'border-[#d4af64] bg-[#d4af64]/10' : 'bg-[#faf9f6]'}`}
                        >
                          <span
                            className={`mt-1 grid size-4 shrink-0 place-items-center rounded-full border ${state.selectedTitle === title ? 'border-[#d4af64] bg-[#d4af64]' : 'border-border'}`}
                          >
                            {state.selectedTitle === title && (
                              <Check className="size-3" />
                            )}
                          </span>
                          {title}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="surface-card p-5 md:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold">三組縮圖企劃</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          圖片本身不放文字；大字建議留到 Canva 疊加。
                        </p>
                        <Badge className="mt-3 border-[#d4af64]/40 bg-[#d4af64]/10 text-[#795d24]">
                          AI 圖片生成延後建置
                        </Badge>
                      </div>
                      <IconTile>
                        <ImageIcon className="size-5" />
                      </IconTile>
                    </div>
                    <p className="mt-5 rounded-2xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
                      目前先完成縮圖方向、大字建議與 Canva
                      英文提示詞；不需要設定 API，也不會在平台內產生圖片。
                    </p>
                    <div className="mt-5 grid gap-3">
                      {thumbIdeas.map((idea, index) => (
                        <button
                          key={idea.name}
                          onClick={() => update({ selectedThumb: index })}
                          className={`rounded-2xl border bg-white p-4 text-left ${state.selectedThumb === index ? 'border-[#d4af64] ring-2 ring-[#d4af64]/25' : 'border-border'}`}
                        >
                          <p className="text-xs font-bold text-[#8b6c2d]">
                            {idea.name}｜大字建議：{idea.text}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            畫面方向：{idea.scene}
                          </p>
                          <p className="mt-3 rounded-lg bg-[#f4f1e9] p-3 font-mono text-[11px] leading-5 text-[#4c463a]">
                            {idea.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
                <NextButton
                  disabled={!state.selectedTitle}
                  onClick={() => go(2)}
                >
                  縮圖方向確認，開始寫腳本
                </NextButton>
              </>
            )}
          </StageShell>
        </TabsContent>

        <TabsContent value="2">
          <StageShell
            step="STEP 03"
            eyebrow="依選題條件寫稿，主片與資訊欄一次完成"
            title="腳本創作與資訊欄文案。"
          >
            {!state.selectedTopic ? (
              <Blocked
                text="先回到選題雷達，完成五項條件並選定主題。"
                onClick={() => go(0)}
              />
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <Button
                    className="gold-button"
                    onClick={() =>
                      update({
                        script: buildScript(state),
                        description: buildDescription(state),
                      })
                    }
                  >
                    <WandSparkles className="size-4" />
                    {state.script ? '重新整理腳本與資訊欄' : '產生腳本與資訊欄'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    只整理本人回答，不補不存在的經歷或成果。
                  </span>
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
                  <section className="surface-card p-5 md:p-7">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">YouTube 口語腳本</p>
                      {state.script && (
                        <Button variant="outline" onClick={copyScript}>
                          <Copy className="size-4" />
                          複製
                        </Button>
                      )}
                    </div>
                    <Textarea
                      aria-label="YouTube 口語腳本"
                      value={state.script}
                      onChange={(event) =>
                        update({ script: event.target.value })
                      }
                      placeholder="按上方按鈕，依選題條件整理腳本。"
                      className="mt-4 min-h-[620px] font-mono text-sm leading-7"
                    />
                  </section>
                  <section className="surface-card p-5 md:p-7">
                    <p className="text-sm font-bold">YouTube 資訊欄</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      保留影片摘要、品牌句與必要標籤；影片網址與資源連結上架前再補。
                    </p>
                    <Textarea
                      aria-label="YouTube 資訊欄文案"
                      value={state.description}
                      onChange={(event) =>
                        update({ description: event.target.value })
                      }
                      placeholder="資訊欄文案會和腳本一起產生。"
                      className="mt-4 min-h-[480px] text-sm leading-7"
                    />
                  </section>
                </div>
                <NextButton
                  disabled={!state.script || !state.description}
                  onClick={() => go(3)}
                >
                  腳本確認，進入 AI 剪輯
                </NextButton>
              </>
            )}
          </StageShell>
        </TabsContent>

        <TabsContent value="3">
          <StageShell
            step="STEP 04"
            eyebrow="把腳本轉成剪輯 Skill 能直接執行的任務"
            title="AI 剪輯：先整理交付，再進入成片。"
          >
            {!state.script ? (
              <Blocked
                text="先完成腳本，剪輯任務才有可用素材。"
                onClick={() => go(2)}
              />
            ) : (
              <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <section className="surface-card p-5 md:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">剪輯 Skill 任務單</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        包含節奏、必留原話、畫面規則與輸出格式。
                      </p>
                    </div>
                    <Button
                      className="gold-button"
                      onClick={() => update({ editPlan: buildEditPlan(state) })}
                    >
                      <Scissors className="size-4" />
                      {state.editPlan ? '重新整理任務' : '建立剪輯任務'}
                    </Button>
                  </div>
                  <Textarea
                    aria-label="AI 剪輯任務單"
                    value={state.editPlan}
                    onChange={(event) =>
                      update({ editPlan: event.target.value })
                    }
                    placeholder="按下「建立剪輯任務」，把腳本整理成剪輯 Skill 的輸入。"
                    className="mt-5 min-h-[560px] font-mono text-sm leading-7"
                  />
                  {state.editPlan && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() =>
                        copyText(state.editPlan, '剪輯任務已複製。')
                      }
                    >
                      <Copy className="size-4" />
                      複製剪輯任務
                    </Button>
                  )}
                </section>
                <aside className="rounded-[28px] bg-[#151515] p-6 text-white">
                  <p className="text-xs font-semibold tracking-[0.16em] text-[#d4af64]">
                    連接狀態
                  </p>
                  <h3 className="mt-3 text-xl font-bold">
                    剪輯 Skill 尚未接入網站
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    目前可產生完整剪輯任務單，但還不能在這個 Vercel
                    網站直接上傳影片並輸出成片。完成 Skill
                    與影片處理服務後，這裡會接上執行與進度。
                  </p>
                  <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
                    不會把「產生任務單」假裝成「影片已剪好」。每支影片仍需本人看片確認。
                  </div>
                </aside>
                <div className="xl:col-span-2">
                  <NextButton disabled={!state.editPlan} onClick={() => go(4)}>
                    剪輯任務確認，產生宣傳文案
                  </NextButton>
                </div>
              </div>
            )}
          </StageShell>
        </TabsContent>

        <TabsContent value="4">
          <StageShell
            step="STEP 05"
            eyebrow="同一支影片，轉成不同平台會有人停下來的語氣"
            title="Facebook 與 Instagram 宣傳文案。"
          >
            {!state.selectedTitle ? (
              <Blocked
                text="先完成主題與標題，才能產生對應宣傳文案。"
                onClick={() => go(1)}
              />
            ) : (
              <>
                <Button
                  className="gold-button"
                  onClick={() => update(buildSocialCopy(state))}
                >
                  <Share2 className="size-4" />
                  {state.fbCopy ? '重新產生宣傳文案' : '產生 FB＋IG 文案'}
                </Button>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <section className="surface-card p-5 md:p-7">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">Facebook</p>
                      {state.fbCopy && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyText(state.fbCopy, 'Facebook 文案已複製。')
                          }
                        >
                          <Copy className="size-4" />
                          複製
                        </Button>
                      )}
                    </div>
                    <Textarea
                      aria-label="Facebook 宣傳文案"
                      value={state.fbCopy}
                      onChange={(event) =>
                        update({ fbCopy: event.target.value })
                      }
                      placeholder="產生適合 Facebook 的生活場景型文案。"
                      className="mt-4 min-h-[420px] text-sm leading-7"
                    />
                  </section>
                  <section className="surface-card p-5 md:p-7">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">Instagram</p>
                      {state.igCopy && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyText(state.igCopy, 'Instagram 文案已複製。')
                          }
                        >
                          <Copy className="size-4" />
                          複製
                        </Button>
                      )}
                    </div>
                    <Textarea
                      aria-label="Instagram 宣傳文案"
                      value={state.igCopy}
                      onChange={(event) =>
                        update({ igCopy: event.target.value })
                      }
                      placeholder="產生適合 Instagram 的短句、品牌句與標籤。"
                      className="mt-4 min-h-[420px] text-sm leading-7"
                    />
                  </section>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    className="gold-button"
                    disabled={!state.fbCopy || !state.igCopy}
                    onClick={exportProject}
                  >
                    <Download className="size-4" />
                    匯出完整製作包
                  </Button>
                </div>
              </>
            )}
          </StageShell>
        </TabsContent>
      </main>
    </Tabs>
  );
}

function StageShell({
  step,
  eyebrow,
  title,
  children,
}: {
  step: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-7 md:px-9 md:py-9">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-[#d4af64]/50 bg-[#d4af64]/10 text-[#7d6229]"
            >
              {step}
            </Badge>
            <span className="text-sm text-muted-foreground">{eyebrow}</span>
          </div>
          <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.035em] md:text-4xl">
            {title}
          </h2>
        </div>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <Play className="size-4 fill-current" /> 每一步都由你確認
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {label}
      <div className="mt-2 [&_input]:h-12 [&_input]:rounded-xl [&_input]:bg-[#faf9f6] [&_textarea]:rounded-xl [&_textarea]:bg-[#faf9f6]">
        {children}
      </div>
    </label>
  );
}
function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#151515] text-[#e7c87f]">
      {children}
    </div>
  );
}
function NextButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end">
      <Button
        size="lg"
        className="gold-button"
        disabled={disabled}
        onClick={onClick}
      >
        {children}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
function Blocked({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <div className="surface-card grid min-h-80 place-items-center p-8 text-center">
      <div>
        <Lightbulb className="mx-auto size-9 text-[#b18b43]" />
        <p className="mt-4 max-w-lg text-lg font-bold">{text}</p>
        <Button variant="outline" className="mt-5" onClick={onClick}>
          <ArrowLeft className="size-4" />
          回到上一步
        </Button>
      </div>
    </div>
  );
}
