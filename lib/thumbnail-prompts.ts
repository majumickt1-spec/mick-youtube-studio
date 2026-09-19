export type ThumbnailIdea = {
  name: '情緒衝突' | '生活情境' | '象徵對比';
  text: string;
  scene: string;
  prompt: string;
};

const visualRounds = [
  {
    mood: 'clear natural daylight with neutral whites and restrained warm gold accents',
    cameraA: 'eye-level medium close-up with an off-center candid composition',
    cameraB: 'wide documentary frame with layered foreground and background',
    cameraC: 'graphic overhead still life with crisp shadows and strong scale contrast',
  },
  {
    mood: 'cool early-morning window light with one restrained gold highlight',
    cameraA: 'tight three-quarter portrait from a slightly high angle',
    cameraB: 'side-on environmental frame with the subject small inside the space',
    cameraC: 'low-angle macro still life with bold depth and asymmetry',
  },
  {
    mood: 'bright overcast light with clean black-and-white surfaces and subtle gold detail',
    cameraA: 'waist-up candid frame from a slightly low angle',
    cameraB: 'high-angle room view showing a clear cause-and-effect relationship',
    cameraC: 'minimal studio still life with one oversized object and generous negative space',
  },
];

function cleanHeadlinePart(value: string) {
  return value
    .replace(/^(?:真正|其實|問題可能|問題|別急著|一定要|我才算出|我才|算出|你家)/u, '')
    .replace(/[「」『』【】]/g, '')
    .replace(/\s+/g, '')
    .replace(/[。！？?!：:，,｜|]/g, '')
    .replace(/還沒變成能累積的資產/g, '還沒變資產')
    .replace(/不一定跟著來/g, '沒跟上')
    .replace(/每月多出/g, '每月多')
    .replace(/(\d)000元?/g, '$1千元')
    .replace(/家裡沒有緩衝/g, '家裡沒緩衝')
    .replace(/收入還是離不開工時/g, '收入仍綁工時')
    .replace(/是在賺錢還是在加班/g, '賺錢還是加班')
    .replace(/有沒有變成資產/g, '是不是資產');
}

function compact(value: string, maxLength = 9, fromEnd = false) {
  const cleaned = cleanHeadlinePart(value);
  if (cleaned.length <= maxLength) return cleaned;
  return fromEnd
    ? cleaned.slice(cleaned.length - maxLength)
    : cleaned.slice(0, maxLength);
}

function uniqueHeadlines(values: string[], title: string) {
  const cleanTitle = cleanHeadlinePart(title);
  const candidates = [...values, compact(cleanTitle), compact(cleanTitle, 9, true)]
    .map((value) => value.trim())
    .filter((value) => value.length >= 3);
  const unique = [...new Set(candidates)];
  const offsets = [0, 3, 6];
  for (const offset of offsets) {
    if (unique.length >= 3) break;
    const fallback = cleanTitle.slice(offset, offset + 9);
    if (fallback.length >= 3 && !unique.includes(fallback)) unique.push(fallback);
  }
  return [unique[0], unique[1] || unique[0], unique[2] || unique[0]];
}

const approvedHeadlineSets: Record<string, [string, string, string]> = {
  '影片一直做，為什麼還沒變成能累積的資產？': [
    '一直做卻沒累積',
    '影片不是資產？',
    '卡在哪一步？',
  ],
  '觀看數增加了，為什麼收入不一定跟著來？': [
    '觀看漲，收入沒漲',
    '有流量沒收入',
    '收入去哪了？',
  ],
  '3 個問題，檢查你的內容有沒有變成資產': [
    '內容是資產嗎？',
    '做完就歸零？',
    '3 題檢查',
  ],
  'AI 工具學得越多，為什麼越像在加班？': [
    '工具越多越忙',
    'AI 還是在加班',
    '你學對了嗎？',
  ],
  '別急著換 AI 工具：先確認有人願意付錢嗎？': [
    '有人願意付錢嗎？',
    '別急著換工具',
    '先驗證再投入',
  ],
  '3 個問題，判斷 AI 工作流能不能變成資產': [
    '工作流是資產嗎？',
    '自動化有累積嗎？',
    '3 題判斷',
  ],
  'AI 副業越做越忙，為什麼收入還是離不開工時？': [
    '副業變加班',
    '收入綁住工時',
    '越做越自由？',
  ],
  '不是做出產品就會賺錢：你漏了哪一步？': [
    '有產品≠會賺錢',
    '你漏了哪一步？',
    '為什麼賣不動？',
  ],
  '3 個問題，判斷你的 AI 副業是在賺錢還是在加班': [
    '副業真的賺錢嗎？',
    '賺錢還是加班？',
    '3 題判斷',
  ],
  '薪水沒增加，為什麼我每月能多留下一筆錢？': [
    '薪水沒漲，錢變多',
    '每月多留一筆',
    '我改了什麼？',
  ],
  '我還掉 4 萬信貸，為什麼每月多出 2,000 元？': [
    '還 4 萬，多 2 千',
    '現金流多 2 千',
    '提前還款有用嗎？',
  ],
  '3 個數字，看懂負債怎麼吃掉家庭現金流': [
    '負債正在吃錢',
    '錢都被誰拿走？',
    '3 個數字看懂',
  ],
  '真正可怕的不是失業，是家裡沒有緩衝': [
    '失業不可怕？',
    '家裡沒有緩衝',
    '你家能撐多久？',
  ],
  '工作還在，為什麼你家可能撐不了一個月？': [
    '有工作也撐不住',
    '不到一個月',
    '你家安全嗎？',
  ],
  '40 歲被裁員後，我才算出家裡只能撐 15 天': [
    '40 歲被裁員',
    '家裡只能撐 15 天',
    '只剩 15 天',
  ],
  '房貸繳得起，為什麼家裡還是沒有安全感？': [
    '繳得起卻不安心',
    '房貸不是安全感',
    '每月還剩多少？',
  ],
  '問題可能不是房貸利率，而是你每月剩多少錢': [
    '別只看房貸利率',
    '每月剩多少錢？',
    '問題在現金流',
  ],
  '3 個數字，買房後一定要先算清楚': [
    '買房後先算清楚',
    '房貸吃掉多少？',
    '3 個數字',
  ],
  '保險買得多，為什麼家庭現金還是不夠用？': [
    '保險多，現金少',
    '保費正在吃錢？',
    '買越多越安全？',
  ],
  '真正該檢查的，不只是保單有沒有買齊': [
    '別只看保單',
    '買齊就安全嗎？',
    '先檢查現金流',
  ],
  '3 個家庭現金流數字，保費繳之前先看清楚': [
    '保費繳之前先算',
    '家庭現金夠嗎？',
    '3 個數字',
  ],
  '收入不低卻存不到錢？問題可能不是你花太多': [
    '收入不低卻沒錢',
    '不是你花太多',
    '錢到底去哪了？',
  ],
  '2025 年我家月收 8 萬、支出 71,030 元：這樣有餘裕嗎？': [
    '月收 8 萬夠嗎？',
    '支出 71,030 元',
    '我家有餘裕嗎？',
  ],
  '3 個讓薪水留不下來的現金流漏洞，你中了幾個？': [
    '薪水為何留不住？',
    '3 個現金流漏洞',
    '你中了幾個？',
  ],
};

export function makeThumbnailHeadlines(title: string) {
  const selectedTitle = title.split(/[｜|]/)[0].trim();
  const approved = approvedHeadlineSets[selectedTitle];
  if (approved) return approved;
  const notMatch = selectedTitle.match(/不是(.+?)[，,、 ]*(?:而)?是(.+?)[？?]?$/u);
  if (notMatch) {
    return uniqueHeadlines(
      [
        `不是${compact(notMatch[1], 5)}`,
        `而是${compact(notMatch[2], 5)}`,
        `${compact(notMatch[1], 5)}不可怕？`,
      ],
      selectedTitle,
    );
  }

  const whyMatch = selectedTitle.match(/^(.+?)[，,、 ]*為什麼(.+?)[？?]?$/u);
  if (whyMatch) {
    const cause = compact(whyMatch[1], 7);
    const consequence = compact(whyMatch[2], 7);
    return uniqueHeadlines(
      [
        `${compact(cause, 5)}卻${compact(consequence, 6)}`,
        compact(whyMatch[1], 9),
        `${consequence}？`,
      ],
      selectedTitle,
    );
  }

  const contrastMatch = selectedTitle.match(/^(.+?)卻(.+?)(?:[？?]|$)/u);
  if (contrastMatch) {
    const cause = compact(contrastMatch[1], 6);
    const consequence = compact(contrastMatch[2], 7);
    return uniqueHeadlines(
      [`${cause}卻${consequence}`, cause, `${consequence}？`],
      selectedTitle,
    );
  }

  const numberedMatch = selectedTitle.match(/^(\d+\s*個[^，,：:？?]+)/u);
  if (numberedMatch) {
    const normalizedTitle = cleanHeadlinePart(selectedTitle);
    const choiceMatch = normalizedTitle.match(/(.{2,6})還是(.{2,6})/u);
    const finalClause = selectedTitle
      .split(/[，,：:？?]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1);
    return uniqueHeadlines(
      [
        compact(numberedMatch[1], 9),
        choiceMatch
          ? `${compact(choiceMatch[1], 4, true)}還是${compact(choiceMatch[2], 4)}`
          : compact(finalClause || selectedTitle, 9),
        choiceMatch && normalizedTitle.includes('AI副業')
          ? 'AI副業能賺錢？'
          : compact(finalClause || selectedTitle, 9, true),
      ],
      selectedTitle,
    );
  }

  const colonParts = selectedTitle
    .split(/[：:，,？?！!]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const lastPart = colonParts.at(-1) || selectedTitle;
  const lastNumber = lastPart.match(/(\d+(?:\.\d+)?\s*(?:天|元|萬|倍|年|個月))/u);
  return uniqueHeadlines(
    [
      compact(colonParts[0] || selectedTitle, 9),
      compact(lastPart, 9),
      lastNumber ? `只剩${lastNumber[1].replace(/\s+/g, '')}` : `${compact(lastPart, 8)}？`,
    ],
    selectedTitle,
  );
}

export function makeThumbnailIdeas(
  topic: string,
  title: string,
  pillar: string,
  variationRound = 0,
): ThumbnailIdea[] {
  const round = visualRounds[Math.abs(variationRound) % visualRounds.length];
  const safeTopic = topic.trim() || '家庭現金流問題';
  const safeTitle = title.trim() || safeTopic;
  const headlines = makeThumbnailHeadlines(safeTitle);

  const sharedContext = `PRIMARY CREATIVE BRIEF — selected video title: "${safeTitle}". Design the entire image from the promise, conflict, subject, and stakes expressed by this selected title. Every visible action, location, and prop must have a direct reason traceable to the selected title. Secondary context only: the broader topic is "${safeTopic}" and the content pillar is "${pillar}". Do not substitute a generic image about the broader topic, personal finance, AI, or content creation. Do not reuse a generic creator-at-a-laptop scene.`;

  return [
    {
      name: '情緒衝突',
      text: headlines[0],
      scene: `人物近景：呈現「${safeTitle}」帶來的單一明確情緒與動作，不以坐在電腦桌前作為預設。`,
      prompt: `Direction A — emotional conflict. ${sharedContext} Show exactly one believable Taiwanese adult aged 35–55 in a candid ${round.cameraA}. Give the person one unmistakable emotion and one physical action caused by the topic. Choose a location and props that specifically explain this episode, not a generic office or studio. Use ${round.mood}. Natural skin texture, realistic posture, no glamour pose, no looking at camera, no glowing cubes, no piles of gold or cash.`,
    },
    {
      name: '生活情境',
      text: headlines[1],
      scene: `真實情境：用家庭或工作現場呈現「${safeTopic}」的原因與後果，人物不是擺拍主角。`,
      prompt: `Direction B — lived-in situation. ${sharedContext} Build a ${round.cameraB} inside a recognizable Taiwanese home, commute, storefront, or workplace selected for this exact topic. Show a clear cause-and-effect story through natural human activity and topic-specific objects. Use a different location, pose, camera distance, and object set from Direction A. The people are part of the situation, not posing for a portrait. Use ${round.mood}. Avoid a lone man staring at a laptop, fake app screens, glowing UI walls, gold bars, or luxury imagery.`,
    },
    {
      name: '象徵對比',
      text: headlines[2],
      scene: `無人物象徵：只用與「${safeTitle}」直接相關的日常物件，形成一眼看懂的矛盾或前後對比。`,
      prompt: `Direction C — symbolic contrast. ${sharedContext} Create a people-free ${round.cameraC}. Use only two to four ordinary, topic-specific objects to form one immediately readable visual contradiction, imbalance, before-and-after relationship, or trade-off. No people, faces, hands, bodies, desks with laptops, coins, money rain, gold bars, glowing cubes, generic upward charts, or abstract AI icons. Use ${round.mood}. Favor a strong silhouette, tactile real materials, and a simple visual metaphor that remains clear at phone size.`,
    },
  ];
}
