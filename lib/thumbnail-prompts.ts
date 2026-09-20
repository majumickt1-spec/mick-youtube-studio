export type ThumbnailIdea = {
  name: '情緒衝突' | '生活情境' | '象徵對比';
  text: string;
  scene: string;
  prompt: string;
  canvaPrompt: string;
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

type VisualSeed = {
  emotional: { scene: string; prompt: string };
  situation: { scene: string; prompt: string };
  symbolic: { scene: string; prompt: string };
};

function makeVisualSeed(topic: string, title: string): VisualSeed {
  const brief = `${title} ${topic}`;

  if (/觀看|流量|訂閱|影片.*收入|收入.*跟/u.test(brief)) {
    return {
      emotional: {
        scene: '台灣家庭餐桌：一手看手機上的觀看成長趨勢，另一手打開幾乎空的錢包，人物低頭看錢包。',
        prompt:
          'At a modest Taiwanese apartment dining table, one worried Taiwanese man aged 40–50 holds a smartphone showing a simple unlabeled upward audience trend in one hand and opens a nearly empty dark wallet with the other. He looks down at the wallet, not at the camera. A plain ceramic mug is the only secondary prop.',
      },
      situation: {
        scene: '台灣住家工作桌：完成的影片企劃與拍攝器材很多，但旁邊的生活帳單與空零錢罐形成落差。',
        prompt:
          'Inside a lived-in Taiwanese apartment, a creator sits at a dining table after finishing several videos. Blank storyboard cards and a small camera fill one side of the table, while household bills and a nearly empty glass savings jar sit on the other side. The person quietly compares the two sides instead of posing.',
      },
      symbolic: {
        scene: '無人物俯拍：大量完成的空白影片卡片堆成高塔，旁邊卻是扁平的空錢包，形成一眼看懂的反差。',
        prompt:
          'A people-free overhead still life: a tall stack of blank video-frame cards and a small camera-memory-card case on one side, contrasted with a flattened nearly empty dark wallet on the other. The height difference must be immediately obvious.',
      },
    };
  }

  if (/裁員|失業|安全天數|撐不了|緩衝/u.test(brief)) {
    return {
      emotional: {
        scene: '台灣家庭餐桌：中年上班族握著素面資遣信封，另一手數著只剩幾張的生活費，神情震驚。',
        prompt:
          'At a Taiwanese family dining table, one stunned Taiwanese adult aged 40–55 grips a plain unmarked termination envelope while counting only a few remaining household-expense notes with the other hand. A wall calendar with blank squares and ordinary utility envelopes sit nearby.',
      },
      situation: {
        scene: '住家晚餐桌：家庭帳單排成一列，緊急預備金罐接近見底，人物正在計算還能撐多久。',
        prompt:
          'In a modest Taiwanese home dining area, one adult sorts a row of household expense envelopes beside a nearly empty emergency savings jar and a blank monthly calendar. The scene clearly shows a family calculating how little financial runway remains.',
      },
      symbolic: {
        scene: '無人物俯拍：很短的一排日曆方塊即將撞上厚厚的家庭帳單，旁邊只剩少量零錢。',
        prompt:
          'A people-free overhead still life: a very short row of blank calendar blocks leads directly into a thick stack of household expense envelopes, with only a few loose coins remaining beside them. The short runway is unmistakable.',
      },
    };
  }

  if (/信貸|負債|貸款|還款/u.test(brief)) {
    return {
      emotional: {
        scene: '家庭餐桌：人物把一疊還款信封推開，同時握住剛被釋放出來的生活費信封，表情從壓力轉為鬆一口氣。',
        prompt:
          'At a Taiwanese family dining table, one adult pushes away a thick stack of plain loan-payment envelopes while holding one newly freed monthly household envelope close. Their expression shows cautious relief, with a simple calculator nearby.',
      },
      situation: {
        scene: '家庭記帳現場：左側是厚重貸款資料，右側是重新分配到生活與儲蓄的信封，呈現現金流被釋放。',
        prompt:
          'A lived-in Taiwanese household budgeting scene: a thick bundle of loan documents and payment envelopes sits on the left, while two modest household and savings envelopes are being reorganized on the right. One adult naturally moves the envelopes between the two sides.',
      },
      symbolic: {
        scene: '無人物靜物：厚重的貸款信封壓住細小現金流，剪斷一節束帶後，一個生活費信封被釋放出來。',
        prompt:
          'A people-free still life: a thick bundle of plain loan envelopes weighs down a narrow paper path, while one loosened strap releases a single household-expense envelope. Use real paper and tactile materials, not fantasy symbols.',
      },
    };
  }

  if (/房貸|買房/u.test(brief)) {
    return {
      emotional: {
        scene: '台灣住家餐桌：人物拿著家門鑰匙，卻盯著房貸信封與幾乎空的錢包，呈現有房卻不安心。',
        prompt:
          'At a Taiwanese apartment dining table, one concerned adult holds a home key while looking down at a thick plain mortgage envelope beside a nearly empty wallet. The apartment interior feels real and modest, not luxurious.',
      },
      situation: {
        scene: '新家尚未整理的餐桌：鑰匙與紙箱代表擁有房子，旁邊密集帳單與稀少生活費呈現壓力。',
        prompt:
          'Inside a newly occupied Taiwanese apartment, moving boxes and a home key show ownership, while a dining table crowded with mortgage and utility envelopes leaves only a thin household cash envelope. One adult sorts the expenses naturally.',
      },
      symbolic: {
        scene: '無人物俯拍：房屋鑰匙壓在厚房貸信封上，另一側只剩薄薄的生活費信封。',
        prompt:
          'A people-free overhead still life: a home key rests on a thick plain mortgage envelope, sharply contrasted with one very thin household-expense envelope on the other side. Make the imbalance immediately readable.',
      },
    };
  }

  if (/保險|保費|保單/u.test(brief)) {
    return {
      emotional: {
        scene: '家庭餐桌：人物被多份保單資料包圍，手上卻只剩薄薄的生活費信封，表情困惑。',
        prompt:
          'At a Taiwanese family dining table, one confused adult is surrounded by several plain insurance-policy folders while holding one visibly thin household-expense envelope. The person looks at the thin envelope, not at the camera.',
      },
      situation: {
        scene: '每月家庭記帳：一側堆滿保單與保費信封，另一側買菜與生活費信封明顯不足。',
        prompt:
          'A lived-in Taiwanese household budgeting scene: policy folders and premium-payment envelopes crowd one side of the table, while grocery and daily-expense envelopes on the other side are visibly sparse. One adult is trying to rebalance them.',
      },
      symbolic: {
        scene: '無人物靜物：厚厚保單資料壓住一個極薄的生活費信封，呈現保障很多但現金不足。',
        prompt:
          'A people-free still life: a heavy stack of plain insurance-policy folders physically presses down on one very thin household-expense envelope. Real paper, restrained composition, and an obvious weight imbalance.',
      },
    };
  }

  if (/AI|副業|工具|工作流|產品|付錢|加班|工時/u.test(brief)) {
    return {
      emotional: {
        scene: '下班後的台灣家庭餐桌：人物一手按著疲憊的額頭，另一手整理重複工作紙卡，牆上時鐘顯示時間已晚。',
        prompt:
          'At a Taiwanese apartment dining table after work, one tired adult aged 35–55 presses one hand to their forehead while the other hand sorts a repetitive chain of blank task cards. A wall clock and tangled charging cables show that the work has stretched late into the evening.',
      },
      situation: {
        scene: '住家餐桌上的副業現場：左側是散亂、重複的一次性工作，右側是一套整理完成、可重複使用的流程盒。',
        prompt:
          'A wider Taiwanese home side-business scene: scattered duplicate task cards, cables, and unfinished one-off work cover the left side of a dining table, while one compact organized workflow box with neatly ordered blank cards sits on the right. The adult is moving one task into the reusable system.',
      },
      symbolic: {
        scene: '無人物俯拍：大量散亂的一次性任務卡消耗沙漏，旁邊只有一套整齊可重複使用的流程卡。',
        prompt:
          'A people-free overhead still life: many scattered duplicate task cards surround a nearly empty hourglass, contrasted with one compact stack of neatly ordered reusable process cards. The difference between repeated labor and a reusable system must be obvious.',
      },
    };
  }

  return {
    emotional: {
      scene: '台灣家庭餐桌：人物對照一疊生活帳單與幾乎空的錢包，正在找出錢留不下來的原因。',
      prompt:
        'At a modest Taiwanese apartment dining table, one concerned adult aged 35–55 compares a stack of plain household expense envelopes with a nearly empty wallet. They sort one envelope by hand and look at the shortfall, not at the camera.',
    },
    situation: {
      scene: '家庭記帳現場：收入信封在桌上，但房貸、卡費與日常開銷從不同方向把錢分走。',
      prompt:
        'A lived-in Taiwanese household budgeting scene: one monthly income envelope sits at the center while mortgage, card-payment, grocery, and utility envelopes pull the available household money in different directions. One adult naturally traces where the money goes.',
    },
    symbolic: {
      scene: '無人物俯拍：一個收入信封連向多個支出信封，中間只剩極細的現金流，形成明確失衡。',
      prompt:
        'A people-free overhead still life: one household income envelope feeds into several expense envelopes through narrow paper strips, leaving only one very thin remaining strip at the end. Use ordinary real materials and a clear imbalance.',
    },
  };
}

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
  const visualSeed = makeVisualSeed(safeTopic, safeTitle);

  const sharedStyle = `Premium photorealistic editorial photography with realistic Taiwanese everyday details. Black, white, and neutral tones form the visual base, with only one restrained warm-gold accent. Leave the left third clean for a headline added later. Strong subject separation and a simple silhouette that remains readable at phone size.`;
  const sharedConstraints = `No visible text, readable screen interface, numbers, logos, watermarks, cartoons, office stock-photo pose, gold bars, glowing cubes, or money rain.`;

  return [
    {
      name: '情緒衝突',
      text: headlines[0],
      scene: `人物情緒衝突：${visualSeed.emotional.scene}`,
      prompt: `Direction A — emotional conflict. REQUIRED LITERAL SCENE: ${visualSeed.emotional.prompt} Use a candid ${round.cameraA} and ${round.mood}. ${sharedStyle} Natural skin texture and realistic posture. ${sharedConstraints}`,
      canvaPrompt: `Create one photorealistic 16:9 YouTube thumbnail background. REQUIRED SCENE: ${visualSeed.emotional.prompt} COMPOSITION: candid ${round.cameraA}; keep the subject on the right half and leave the left third quiet and uncluttered. LIGHTING: ${round.mood}. STYLE: ${sharedStyle} CONSTRAINTS: ${sharedConstraints} Do not add the headline inside the image.`,
    },
    {
      name: '生活情境',
      text: headlines[1],
      scene: `生活因果情境：${visualSeed.situation.scene}`,
      prompt: `Direction B — lived-in situation. REQUIRED LITERAL SCENE: ${visualSeed.situation.prompt} Use a ${round.cameraB} and ${round.mood}. ${sharedStyle} The person is part of the activity, never posing. ${sharedConstraints}`,
      canvaPrompt: `Create one photorealistic 16:9 YouTube thumbnail background. REQUIRED SCENE: ${visualSeed.situation.prompt} COMPOSITION: ${round.cameraB}; keep the main activity on the right two-thirds and leave quiet negative space in the upper-left. LIGHTING: ${round.mood}. STYLE: ${sharedStyle} CONSTRAINTS: ${sharedConstraints} Do not add the headline inside the image.`,
    },
    {
      name: '象徵對比',
      text: headlines[2],
      scene: `物件象徵對比：${visualSeed.symbolic.scene}`,
      prompt: `Direction C — symbolic contrast. REQUIRED LITERAL SCENE: ${visualSeed.symbolic.prompt} Create a people-free ${round.cameraC} using ${round.mood}. ${sharedStyle} Favor tactile real materials. ${sharedConstraints} No people, faces, hands, or bodies.`,
      canvaPrompt: `Create one photorealistic 16:9 YouTube thumbnail background. REQUIRED SCENE: ${visualSeed.symbolic.prompt} COMPOSITION: people-free ${round.cameraC}; place the visual contrast on the right two-thirds and leave the left third clean. LIGHTING: ${round.mood}. STYLE: ${sharedStyle} CONSTRAINTS: ${sharedConstraints} No people, faces, hands, or bodies. Do not add the headline inside the image.`,
    },
  ];
}
