'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Compass,
  Copy,
  Download,
  ImageIcon,
  Lightbulb,
  Menu,
  Mic2,
  NotebookPen,
  Play,
  Plus,
  Search,
  ShieldCheck,
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
  { label: '選題羅盤', detail: '用現金流篩選題目', icon: Compass },
  { label: '包裝實驗室', detail: '先定標題與縮圖', icon: ImageIcon },
  { label: '本人素材訪談', detail: '說出真實經歷與判斷', icon: Mic2 },
  { label: '腳本工作桌', detail: '整理、試讀、定稿', icon: NotebookPen },
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
    { name: '薪水依賴', text: '薪水停了呢？', scene: '手機銀行餘額＋家庭帳單，人物沉著面對風險' },
    { name: '目標數字', text: '非工資 2 倍', scene: '非工資收入與總支出形成清楚的 2× 對比' },
    { name: '安全天數', text: '還能撐幾天？', scene: '家庭月曆、必要支出與可動用現金形成倒數感' },
  ],
  'AI 副業資產': [
    { name: '資產判斷', text: '副業還是打工？', scene: '左側持續投入工時，右側是可累積的數位資產' },
    { name: '工具迷思', text: '別只學 AI', scene: '模糊的工具圖示退到背景，清楚收入數字成為主角' },
    { name: '收入驗證', text: '真的有人買？', scene: '普通上班族查看第一筆數位產品成交紀錄' },
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
  checks: boolean[];
};

const initialState: SavedState = {
  videoName: '本月第 1 支｜降低薪水依賴',
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
  checks: [false, false, false, false],
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

export default function Home() {
  const [stage, setStage] = useState('0');
  const [state, setState] = useState<SavedState>(initialState);
  const [question, setQuestion] = useState(0);
  const [newName, setNewName] = useState('');
  const [notice, setNotice] = useState('');
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
    state.answers.filter(Boolean).length === questions.length,
    Boolean(state.script),
  ];

  useEffect(() => {
    const saved = window.localStorage.getItem('mick-youtube-studio-v2');
    if (saved) {
      try {
        setState({ ...initialState, ...JSON.parse(saved) });
      } catch {
        /* preserve a fresh safe state */
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'mick-youtube-studio-v2',
      JSON.stringify(state),
    );
  }, [state]);

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
            properties: { stage: { type: 'integer', minimum: 1, maximum: 4 } },
            required: ['stage'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input: unknown) => {
            const value = (input as { stage?: number })?.stage;
            if (!Number.isInteger(value) || !value || value < 1 || value > 4)
              throw new Error('stage 必須是 1 到 4');
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
            <p className="font-semibold tracking-wide">米克創作航海圖</p>
            <p className="text-xs text-white/48">一支影片，一條完整航線</p>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/48">本月目標</span>
            <span className="text-xs text-[#e7c87f]">1 / 4 支</span>
          </div>
          <Progress
            value={25}
            className="mt-3 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#d4af64]"
          />
          <p className="mt-3 text-sm leading-6 text-white/76">
            用 4 支影片，逐步降低觀眾對薪水的依賴。
          </p>
        </div>
        <TabsList
          aria-label="影片製作流程"
          className="mt-7 flex h-auto w-full flex-col items-stretch gap-2 bg-transparent p-0"
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
        <div className="mt-auto rounded-2xl border border-[#d4af64]/25 bg-[#d4af64]/[0.06] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#e7c87f]">
            <ShieldCheck className="size-4" /> 品牌護欄已開啟
          </div>
          <p className="mt-2 text-xs leading-5 text-white/55">
            現金流是核心，AI 是手段；目標是非工資收入達總支出的 2 倍。
          </p>
        </div>
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
          <TabsList className="grid h-auto w-full grid-cols-4 bg-white/5 p-1">
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
            eyebrow="人的判斷在前，AI 整理在後"
            title="這題，真的值得你拍嗎？"
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.38fr)_minmax(330px,.62fr)]">
              <section className="surface-card p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-bold">先畫出搜尋邊界</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      不是全網熱門都適合你，只找觀眾現在會停下來的問題。
                    </p>
                  </div>
                  <IconTile>
                    <Search className="size-5" />
                  </IconTile>
                </div>
                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <Field label="最近想關注什麼？">
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
                <Field label="貼上你看到的來源、數據或影片" className="mt-5">
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
                    產生候選清單
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
                    選一個進入包裝，不用全做
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
                <NextButton
                  disabled={!state.selectedTopic}
                  onClick={() => go(1)}
                >
                  帶著這題去做包裝
                </NextButton>
              </section>
            )}
          </StageShell>
        </TabsContent>

        <TabsContent value="1">
          <StageShell
            step="STEP 02"
            eyebrow="先讓人想點，再讓內容兌現"
            title="標題和縮圖，要先說同一件事。"
          >
            {!state.selectedTopic ? (
              <Blocked
                text="先回到選題羅盤，選定這一集要說的問題。"
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
                          onClick={() => update({ selectedTitle: title })}
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
                        <p className="text-sm font-bold">縮圖概念</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          黑白金、寫實家庭情境；人物與原始照片交給後續製圖。
                        </p>
                      </div>
                      <IconTile>
                        <ImageIcon className="size-5" />
                      </IconTile>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {thumbIdeas.map((idea, index) => (
                        <button
                          key={idea.name}
                          onClick={() => update({ selectedThumb: index })}
                          className={`overflow-hidden rounded-2xl border text-left ${state.selectedThumb === index ? 'border-[#d4af64] ring-2 ring-[#d4af64]/25' : 'border-border'}`}
                        >
                          <div className="aspect-video bg-[#11110f] p-4 text-white">
                            <p className="text-[10px] tracking-widest text-[#d4af64]">
                              {idea.name}
                            </p>
                            <p className="mt-5 text-xl font-black leading-tight">
                              {idea.text}
                            </p>
                            <div className="mt-3 h-px w-12 bg-[#d4af64]" />
                          </div>
                          <p className="bg-white p-3 text-xs leading-5 text-muted-foreground">
                            {idea.scene}
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
                  包裝確認，開始本人訪談
                </NextButton>
              </>
            )}
          </StageShell>
        </TabsContent>

        <TabsContent value="2">
          <StageShell
            step="STEP 03"
            eyebrow="先說，再寫；一次只回答一題"
            title="把只有你能說的話留下來。"
          >
            {!state.selectedTitle ? (
              <Blocked
                text="先完成本集標題與縮圖，訪談才有清楚方向。"
                onClick={() => go(1)}
              />
            ) : (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
                <section className="surface-card p-5 md:p-8">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      問題 {question + 1} / {questions.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      已回答 {state.answers.filter(Boolean).length} 題
                    </span>
                  </div>
                  <Progress
                    value={((question + 1) / questions.length) * 100}
                    className="mt-4 [&_[data-slot=progress-indicator]]:bg-[#d4af64]"
                  />
                  <h3 className="mt-8 max-w-2xl text-2xl font-black leading-9 md:text-3xl">
                    {questions[question]}
                  </h3>
                  <Textarea
                    value={state.answers[question]}
                    onChange={(e) => {
                      const answers = [...state.answers];
                      answers[question] = e.target.value;
                      update({ answers, script: '' });
                    }}
                    placeholder="直接貼上你用語音說出的原話。可以結巴、可以沒整理；真實比漂亮重要。"
                    className="mt-6 min-h-48 text-base leading-7"
                  />
                  <div className="mt-5 flex items-center justify-between">
                    <Button
                      variant="outline"
                      disabled={question === 0}
                      onClick={() => setQuestion((q) => q - 1)}
                    >
                      <ArrowLeft className="size-4" />
                      上一題
                    </Button>
                    {question < questions.length - 1 ? (
                      <Button
                        className="gold-button"
                        disabled={!state.answers[question].trim()}
                        onClick={() => setQuestion((q) => q + 1)}
                      >
                        保存，下一題
                        <ArrowRight className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        className="gold-button"
                        disabled={state.answers.some((a) => !a.trim())}
                        onClick={() => go(3)}
                      >
                        素材確認，整理腳本
                        <ArrowRight className="size-4" />
                      </Button>
                    )}
                  </div>
                </section>
                <aside className="rounded-[28px] border border-border bg-[#ede8dc] p-6">
                  <div className="grid size-12 place-items-center rounded-full bg-[#151515] text-[#d4af64]">
                    <Mic2 className="size-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold">這裡不幫你編故事。</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    你沒有經歷，可以直接說沒有。平台只整理你真的知道、做過與相信的內容，不補不存在的人物、金額或成果。
                  </p>
                  <div className="mt-6 border-t border-black/10 pt-5">
                    <p className="text-xs font-bold tracking-widest text-[#8b6c2d]">
                      本集方向
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6">
                      {state.selectedTitle}
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </StageShell>
        </TabsContent>

        <TabsContent value="3">
          <StageShell
            step="STEP 04"
            eyebrow="整理原話，不抹掉你的活人感"
            title="從腳本骨架，到念得出口的定稿。"
          >
            {state.answers.some((a) => !a.trim()) ? (
              <Blocked
                text="本人素材還沒回答完整。回去把五題說完，腳本才不會變成 AI 空話。"
                onClick={() => go(2)}
              />
            ) : (
              <>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
                  <section className="surface-card p-5 md:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">口語腳本工作區</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          產生後仍可直接修改；你念不順的地方，就是要改的地方。
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => update({ script: buildScript(state) })}
                        >
                          <WandSparkles className="size-4" />
                          {state.script ? '重新整理' : '整理腳本骨架'}
                        </Button>
                        {state.script && (
                          <Button variant="outline" onClick={copyScript}>
                            <Copy className="size-4" />
                            複製
                          </Button>
                        )}
                      </div>
                    </div>
                    {state.script ? (
                      <Textarea
                        aria-label="腳本編輯區"
                        value={state.script}
                        onChange={(e) => update({ script: e.target.value })}
                        className="mt-5 min-h-[620px] font-mono text-sm leading-7"
                      />
                    ) : (
                      <div className="mt-5 grid min-h-80 place-items-center rounded-2xl border border-dashed border-border bg-[#faf9f6] p-8 text-center">
                        <div>
                          <NotebookPen className="mx-auto size-8 text-[#b18b43]" />
                          <p className="mt-4 font-bold">
                            你的五段原話已經準備好
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            按下「整理腳本骨架」，才會開始把素材排成可試讀結構。
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                  <aside className="space-y-4">
                    <section className="rounded-[28px] bg-[#151515] p-6 text-white">
                      <p className="text-xs font-semibold tracking-[0.16em] text-[#d4af64]">
                        試讀檢查
                      </p>
                      <div className="mt-5 space-y-4">
                        {[
                          '念起來像我平常說話',
                          '沒有新增我沒說過的故事',
                          '只留一個核心觀念與行動',
                          'CTA 連結已在上架前核對',
                        ].map((label, index) => (
                          <label
                            key={label}
                            className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/75"
                          >
                            <Checkbox
                              checked={state.checks[index]}
                              onCheckedChange={(checked) => {
                                const checks = [...state.checks];
                                checks[index] = Boolean(checked);
                                update({ checks });
                              }}
                              className="mt-1 border-white/30 data-checked:border-[#d4af64] data-checked:bg-[#d4af64] data-checked:text-black"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </section>
                    <section className="rounded-[28px] border border-border bg-card p-6">
                      <p className="text-sm font-bold">完成度</p>
                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-4xl font-black">
                          {state.checks.filter(Boolean).length}
                        </span>
                        <span className="pb-1 text-muted-foreground">
                          / 4 項
                        </span>
                      </div>
                      <Progress
                        value={state.checks.filter(Boolean).length * 25}
                        className="mt-4 [&_[data-slot=progress-indicator]]:bg-[#d4af64]"
                      />
                      <Button
                        onClick={exportProject}
                        disabled={
                          !state.script || state.checks.some((check) => !check)
                        }
                        className="gold-button mt-5 w-full"
                      >
                        <Download className="size-4" />
                        匯出本集製作包
                      </Button>
                    </section>
                  </aside>
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
