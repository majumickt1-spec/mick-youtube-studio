'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  ImageIcon,
  Lightbulb,
  Menu,
  NotebookPen,
  Play,
  Plus,
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
  { label: '選題雷達', detail: '時事選題／既定主題＋本人提問', icon: Radar },
  {
    label: '縮圖生成',
    detail: '3 組無字圖＋大字與 Canva 提示詞',
    icon: ImageIcon,
  },
  { label: '腳本創作', detail: '口語腳本＋資訊欄文案', icon: NotebookPen },
  { label: 'AI 剪輯', detail: '透過剪輯 Skill 建立成片', icon: Scissors },
  { label: '社群宣傳', detail: 'Facebook＋Instagram 文案', icon: Share2 },
];

const questions = [
  '你為什麼會想談這個題目？最近看見了什麼？',
  '你自己真的經歷過、做過，或觀察過什麼？',
  '這件事會怎麼改善現金流，或降低對薪水的依賴？',
  '如果只能教觀眾一個可執行的方法，你會教哪一步？',
  '觀眾看完後，今天晚上可以做的最小行動是什麼？',
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
  'AI 副業資產': [
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
    label: '現金流管理｜守住現在',
    detail: '看懂錢流、資產負債與家庭安全墊',
  },
  {
    value: 'AI 副業資產',
    label: 'AI 副業資產｜創造未來',
    detail: '用 AI 建立可累積的非工資收入來源',
  },
];

const initialAnswers = questions.map(() => '');

type SavedState = {
  videoName: string;
  topicMode: string;
  pillar: string;
  keyword: string;
  audience: string;
  sources: string;
  candidates: string[];
  selectedTopic: string;
  selectedTitle: string;
  selectedThumb: number;
  answers: string[];
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
  keyword: '薪水中斷、家庭現金流',
  audience: '35–55 歲、有家庭責任、主要收入仍來自薪水的上班族',
  sources: '',
  candidates: [],
  selectedTopic: '',
  selectedTitle: '',
  selectedThumb: 0,
  answers: initialAnswers,
  script: '',
  description: '',
  editPlan: '',
  fbCopy: '',
  igCopy: '',
};

function makeCandidates(keyword: string, pillar: string) {
  const focus = keyword.trim() || '降低薪水依賴';
  if (pillar === 'AI 副業資產') {
    return [
      `這份 AI 副業只是多打一份工，還是在累積資產？｜${focus}`,
      `普通上班族怎麼用 AI，做出第一個有人願意付錢的數位產品？`,
      `別再只學 AI 工具：先算它能不能替你增加非工資收入`,
      `每天只有一小時，怎麼把 YouTube 內容變成可累積的收入資產？`,
      `AI 副業沒賺錢，不一定是工具不夠強：你可能少了現金流驗證`,
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
  if (pillar === 'AI 副業資產') {
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
  const answer = (index: number) =>
    state.answers[index]?.trim() || '〔待補米克大叔本人原話〕';
  return `# ${title}\n\n## ▌Hook\n如果有一天薪水消失了，你現在擁有的現金流，能不能繼續支撐生活？這一集，我們不追最新工具，也不追最高報酬，而是看這件事能不能降低你對薪水的依賴。\n\n## ▌生活場景與真實素材\n${answer(0)}\n\n${answer(1)}\n\n## ▌重新理解問題\n${answer(2)}\n\n頻道的核心不是投資，也不是 AI 副業，而是現金流。資產與負債要看它每個月帶來或拿走多少現金；AI 則是普通上班族建立副業資產、增加非工資收入的手段。\n\n## ▌方法\n${answer(3)}\n\n把方法放回這一條路：先守住家庭現金流，再把副業收入變成可累積的資產。1 倍是財富自由的門檻，2 倍才有可以掉、可以修、可以等、可以拒絕的餘裕。\n\n## ▌最小行動\n${answer(4)}\n\n## ▌CTA\n依本集內容只保留一個已確認可用的行動或資源；連結上架前再次核對，不放未核實網址。\n\n## ▌定位管理確認\n核心：現金流｜方法：管理現金流＋建立 AI 副業資產｜終點：非工資收入 ≥ 2×總支出，拿回人生選擇權。\n\n## ▌試讀提醒\n把這份稿念出來。凡是你平常不會說的句子，就改回你的原話；沒有親身經歷的故事，不要補。`;
}

function buildDescription(state: SavedState) {
  const title = state.selectedTitle || state.selectedTopic;
  return `${title}\n\n如果有一天薪水消失，你現在的現金流能不能繼續支撐生活？這支影片會從「${state.pillar}」出發，陪你看懂如何改善現金流、降低薪水依賴。\n\n這集你會帶走：\n・重新理解問題的現金流視角\n・一個普通上班族做得到的方法\n・今天晚上就能開始的最小行動\n\n1 倍，是財富自由的門檻。2 倍，是不用為生存奔波的餘裕。\n\n#現金流 #降低薪水依賴 #米克大叔`;
}

function buildEditPlan(state: SavedState) {
  return `# ${state.selectedTitle || state.selectedTopic}｜AI 剪輯任務\n\n## 節奏\n開場 10 秒快速建立「薪水消失」的危機感；觀念段保留停頓；方法段加入條列與關鍵字畫面；結尾回到 1 倍與 2 倍。\n\n## 必留素材\n${state.answers.map((answer, index) => `${index + 1}. ${answer}`).join('\n')}\n\n## 畫面規則\n黑白金、溫暖寫實、家庭感；不使用卡通人物、通用商務人物或暴富視覺。字幕保持繁體中文，關鍵數字只強調「1×」與「2×」。\n\n## 交付\n16:9 YouTube 主片、去除明顯停頓與口誤、保留自然呼吸；需由米克大叔看片確認後才能定稿。`;
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
  const [question, setQuestion] = useState(0);
  const [newName, setNewName] = useState('');
  const [notice, setNotice] = useState('');
  const [thumbnailImages, setThumbnailImages] = useState<string[]>([]);
  const [imageAccessCode, setImageAccessCode] = useState('');
  const [imageError, setImageError] = useState('');
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const titles = useMemo(
    () => makeTitles(state.selectedTopic, state.pillar),
    [state.selectedTopic, state.pillar],
  );
  const thumbIdeas =
    thumbIdeasByPillar[state.pillar as keyof typeof thumbIdeasByPillar] ||
    thumbIdeasByPillar.現金流管理;
  const completed = [
    Boolean(state.selectedTopic) &&
      state.answers.filter(Boolean).length === questions.length,
    Boolean(state.selectedTitle) && thumbnailImages.length === 3,
    Boolean(state.script) && Boolean(state.description),
    Boolean(state.editPlan),
    Boolean(state.fbCopy) && Boolean(state.igCopy),
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem('mick-youtube-studio-v3');
      if (saved) {
        try {
          setState({ ...initialState, ...JSON.parse(saved) });
        } catch {
          /* preserve a fresh safe state */
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      'mick-youtube-studio-v3',
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
          description: '在米克 YouTube 創作台中開啟指定階段。',
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
  async function generateThumbnails() {
    if (!state.selectedTitle || !imageAccessCode.trim()) return;
    setIsGeneratingImages(true);
    setImageError('');
    setThumbnailImages([]);

    try {
      const prompts = thumbIdeas.map(
        (idea) =>
          `${idea.prompt}. Video topic: ${state.selectedTitle}. The image must contain absolutely no visible text, letters, numbers, captions, logos, watermarks, or interface elements. Leave intentional negative space for adding Traditional Chinese headline later in Canva.`,
      );
      const response = await fetch('/api/thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts, accessCode: imageAccessCode.trim() }),
      });
      const result = (await response.json()) as {
        images?: string[];
        error?: string;
      };
      if (!response.ok || result.images?.length !== 3) {
        throw new Error(result.error || '沒有收到三張縮圖。');
      }
      setThumbnailImages(result.images);
      setNotice('GPT Image 2 已完成三張無字縮圖。');
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '縮圖生成失敗。');
    } finally {
      setIsGeneratingImages(false);
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
  function resetProject() {
    setState({ ...initialState, videoName: newName.trim() || '未命名影片' });
    setStage('0');
    setQuestion(0);
    setNewName('');
    setNotice('新影片已建立。');
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
            <p className="font-semibold tracking-wide">YT 創作智能體平台</p>
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
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-xl md:px-9">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
              目前製作
            </p>
            <h1 className="mt-1 truncate text-lg font-bold tracking-tight md:text-xl">
              {state.videoName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="匯出本集備份"
              onClick={exportProject}
            >
              <Download className="size-4" />
            </Button>
            <Dialog>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-[#151515] px-4 text-white hover:bg-[#2b2925]" />
                }
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">新影片</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>建立一支新影片</DialogTitle>
                  <DialogDescription>
                    目前這一集會留在瀏覽器備份中；建議先匯出再開始。
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="例如：九月第 2 支｜安全天數"
                />
                <DialogFooter>
                  <Button onClick={resetProject}>建立並回到選題</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

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
            eyebrow="沒有靈感找時事，有主題就直接驗證"
            title="選題雷達：先找到值得說的問題。"
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.38fr)_minmax(330px,.62fr)]">
              <section className="surface-card p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-bold">選擇這次的起點</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      不論從時事或既定主題出發，都要回到現金流。
                    </p>
                  </div>
                  <IconTile>
                    <Radar className="size-5" />
                  </IconTile>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {[
                    [
                      'trend',
                      '沒有靈感｜時事選題',
                      '貼上近期新聞、熱門影片或搜尋線索',
                    ],
                    [
                      'planned',
                      '已有方向｜既定主題',
                      '直接輸入你已經想談的核心問題',
                    ],
                  ].map(([value, label, detail]) => (
                    <button
                      key={value}
                      onClick={() =>
                        update({
                          topicMode: value,
                          candidates: [],
                          selectedTopic: '',
                          selectedTitle: '',
                          answers: initialAnswers,
                        })
                      }
                      className={`rounded-xl border p-4 text-left ${state.topicMode === value ? 'border-[#d4af64] bg-[#d4af64]/10' : 'bg-[#faf9f6]'}`}
                    >
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {detail}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <Field
                    label={
                      state.topicMode === 'trend'
                        ? '最近想關注什麼時事？'
                        : '你已經想談什麼主題？'
                    }
                  >
                    <Input
                      value={state.keyword}
                      onChange={(e) => update({ keyword: e.target.value })}
                    />
                  </Field>
                  <Field label="這支片要陪誰解決？">
                    <Input
                      value={state.audience}
                      onChange={(e) => update({ audience: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-5">
                  <p className="text-sm font-medium">這支片走哪一條內容線？</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    {pillars.map((pillar) => (
                      <button
                        key={pillar.value}
                        onClick={() =>
                          update({
                            pillar: pillar.value,
                            candidates: [],
                            selectedTopic: '',
                            selectedTitle: '',
                          })
                        }
                        className={`rounded-xl border p-4 text-left transition ${state.pillar === pillar.value ? 'border-[#d4af64] bg-[#d4af64]/10' : 'bg-[#faf9f6] hover:border-[#d4af64]/50'}`}
                      >
                        <span className="block text-sm font-bold">
                          {pillar.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {pillar.detail}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <Field
                  label={
                    state.topicMode === 'trend'
                      ? '貼上時事來源、數據或熱門影片'
                      : '貼上既有筆記、資料或參考來源'
                  }
                  className="mt-5"
                >
                  <Textarea
                    value={state.sources}
                    onChange={(e) => update({ sources: e.target.value })}
                    placeholder="網址、標題、觀看數與發布日期；沒有來源的數字不進腳本。"
                    className="min-h-28"
                  />
                </Field>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="gold-button"
                    onClick={() =>
                      update({
                        candidates: makeCandidates(state.keyword, state.pillar),
                      })
                    }
                  >
                    <Sparkles className="size-4" />
                    {state.topicMode === 'trend'
                      ? '產生時事選題'
                      : '產生主題切角'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    依「現金流核心」產生；時事與數據仍需核實來源。
                  </span>
                </div>
              </section>
              <BrandGate />
            </div>
            {state.candidates.length > 0 && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold">5 個候選題</h3>
                  <span className="text-xs text-muted-foreground">
                    選定一題，再回答本人素材提問
                  </span>
                </div>
                <div className="grid gap-3">
                  {state.candidates.map((candidate, index) => (
                    <button
                      key={candidate}
                      onClick={() =>
                        update({ selectedTopic: candidate, selectedTitle: '' })
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
                          {state.pillar} · 改善現金流 · 降低薪水依賴 ·
                          仍需核實來源
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
                {state.selectedTopic && (
                  <section className="surface-card mt-6 p-5 md:p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold">本人素材提問</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          一次回答一題，讓腳本保留你的故事與判斷。
                        </p>
                      </div>
                      <Badge variant="outline">
                        {state.answers.filter(Boolean).length} /{' '}
                        {questions.length}
                      </Badge>
                    </div>
                    <h3 className="mt-6 text-xl font-black leading-8">
                      {questions[question]}
                    </h3>
                    <Textarea
                      value={state.answers[question]}
                      onChange={(event) => {
                        const answers = [...state.answers];
                        answers[question] = event.target.value;
                        update({ answers, script: '', description: '' });
                      }}
                      placeholder="直接保留你的原話，不需要先整理得很漂亮。"
                      className="mt-4 min-h-36 text-base leading-7"
                    />
                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        variant="outline"
                        disabled={question === 0}
                        onClick={() => setQuestion((value) => value - 1)}
                      >
                        <ArrowLeft className="size-4" />
                        上一題
                      </Button>
                      {question < questions.length - 1 ? (
                        <Button
                          className="gold-button"
                          disabled={!state.answers[question].trim()}
                          onClick={() => setQuestion((value) => value + 1)}
                        >
                          保存，下一題
                          <ArrowRight className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          className="gold-button"
                          disabled={state.answers.some(
                            (answer) => !answer.trim(),
                          )}
                          onClick={() => go(1)}
                        >
                          素材完成，生成縮圖
                          <ArrowRight className="size-4" />
                        </Button>
                      )}
                    </div>
                  </section>
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
                text="先回到選題雷達，選定主題並完成本人素材提問。"
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
                            setThumbnailImages([]);
                            setImageError('');
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">
                          GPT Image 2 縮圖生成
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          圖片本身不放文字；大字建議留到 Canva 疊加。
                        </p>
                      </div>
                      <IconTile>
                        <ImageIcon className="size-5" />
                      </IconTile>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <Input
                        type="password"
                        value={imageAccessCode}
                        onChange={(event) =>
                          setImageAccessCode(event.target.value)
                        }
                        placeholder="輸入平台使用碼"
                        aria-label="平台使用碼"
                        className="h-11 rounded-xl bg-[#faf9f6]"
                      />
                      <Button
                        className="gold-button h-11 shrink-0"
                        disabled={
                          !state.selectedTitle ||
                          !imageAccessCode.trim() ||
                          isGeneratingImages
                        }
                        onClick={() => void generateThumbnails()}
                      >
                        <WandSparkles className="size-4" />
                        {isGeneratingImages
                          ? '正在生成 3 張…'
                          : '生成 3 張無字縮圖'}
                      </Button>
                    </div>
                    {imageError && (
                      <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                        {imageError}
                      </p>
                    )}
                    {thumbnailImages.length !== 3 ? (
                      <div className="mt-5 rounded-2xl border border-dashed p-6 text-sm leading-6 text-muted-foreground">
                        選定左側標題並輸入平台使用碼後，GPT Image 2
                        會直接生成三張 16:9 無字縮圖。提示詞仍保留，方便後續在
                        Canva 調整。
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-3">
                        {thumbIdeas.map((idea, index) => (
                          <button
                            key={idea.name}
                            onClick={() => update({ selectedThumb: index })}
                            className={`grid overflow-hidden rounded-2xl border text-left sm:grid-cols-[180px_1fr] ${state.selectedThumb === index ? 'border-[#d4af64] ring-2 ring-[#d4af64]/25' : 'border-border'}`}
                          >
                            <div className="aspect-video overflow-hidden bg-[#11110f] sm:aspect-auto">
                              <Image
                                src={thumbnailImages[index]}
                                alt={`${idea.name}無字縮圖`}
                                width={1536}
                                height={1024}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="bg-white p-4">
                              <p className="text-xs font-bold text-[#8b6c2d]">
                                {idea.name}｜大字建議：{idea.text}
                              </p>
                              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                {idea.scene}
                              </p>
                              <p className="mt-3 rounded-lg bg-[#f4f1e9] p-3 font-mono text-[11px] leading-5 text-[#4c463a]">
                                {idea.prompt}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
                <NextButton
                  disabled={
                    !state.selectedTitle || thumbnailImages.length !== 3
                  }
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
            eyebrow="用本人素材寫稿，主片與資訊欄一次完成"
            title="腳本創作與資訊欄文案。"
          >
            {state.answers.some((answer) => !answer.trim()) ? (
              <Blocked
                text="先回到選題雷達，完成五題本人素材提問。"
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
                      placeholder="按上方按鈕，依本人素材整理腳本。"
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
function BrandGate() {
  return (
    <aside className="rounded-[28px] bg-[#151515] p-6 text-white md:p-7">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#d4af64]">
        米克定位檢查｜2026
      </p>
      <h3 className="mt-3 text-2xl font-bold leading-tight">
        每個選題，都要回答同一個問題。
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/60">
        它能不能改善普通上班族家庭的現金流？
      </p>
      <div className="mt-7 space-y-5">
        {[
          ['01', '現金流是核心嗎？', '不追工具或報酬率本身，先看每月錢流'],
          ['02', '能降低薪水依賴嗎？', '守住現在，或建立可累積的副業資產'],
          ['03', '終點更接近 2 倍嗎？', '非工資收入 ≥ 2×總支出，換回選擇權'],
          ['04', '你真的有話可以說嗎？', '真實經歷、自己的判斷、可做的方法'],
        ].map(([n, title, body]) => (
          <div key={n} className="flex gap-4 border-t border-white/10 pt-5">
            <span className="font-mono text-xs text-[#d4af64]">{n}</span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-6 text-white/48">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-7 rounded-xl border border-[#d4af64]/25 bg-[#d4af64]/10 p-4">
        <p className="text-sm font-bold text-[#e7c87f]">
          1 倍是自由門檻，2 倍是生活餘裕。
        </p>
        <p className="mt-2 text-xs leading-5 text-white/55">
          可以掉、可以修、可以等、可以拒絕。
        </p>
      </div>
    </aside>
  );
}
