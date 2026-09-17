export type TitleOption = {
  kind: '反常型' | '金額型' | '數字型';
  title: string;
};

/** Only use money amounts already supplied in Mick's story library. */
export function makeTitles(topic: string, pillar: string): TitleOption[] {
  if (pillar === 'AI資產建立') {
    if (/影片|YouTube|頻道|內容|創作/.test(topic)) {
      return [
        { kind: '反常型', title: '影片一直做，為什麼還沒變成能累積的資產？' },
        { kind: '反常型', title: '觀看數增加了，為什麼收入不一定跟著來？' },
        { kind: '數字型', title: '3 個問題，檢查你的內容有沒有變成資產' },
      ];
    }
    if (/工具|自動化|工作流|Agent/.test(topic)) {
      return [
        { kind: '反常型', title: 'AI 工具學得越多，為什麼越像在加班？' },
        { kind: '反常型', title: '別急著換 AI 工具：先確認有人願意付錢嗎？' },
        { kind: '數字型', title: '3 個問題，判斷 AI 工作流能不能變成資產' },
      ];
    }
    return [
      { kind: '反常型', title: 'AI 副業越做越忙，為什麼收入還是離不開工時？' },
      { kind: '反常型', title: '不是做出產品就會賺錢：你漏了哪一步？' },
      { kind: '數字型', title: '3 個問題，判斷你的 AI 副業是在賺錢還是在加班' },
    ];
  }

  if (/信貸|負債|貸款|還款/.test(topic)) {
    return [
      { kind: '反常型', title: '薪水沒增加，為什麼我每月能多留下一筆錢？' },
      { kind: '金額型', title: '我還掉 4 萬信貸，為什麼每月多出 2,000 元？' },
      { kind: '數字型', title: '3 個數字，看懂負債怎麼吃掉家庭現金流' },
    ];
  }
  if (/裁員|失業|沒薪水|安全天數/.test(topic)) {
    return [
      { kind: '反常型', title: '真正可怕的不是失業，是家裡沒有緩衝' },
      { kind: '反常型', title: '工作還在，為什麼你家可能撐不了一個月？' },
      { kind: '數字型', title: '40 歲被裁員後，我才算出家裡只能撐 15 天' },
    ];
  }
  if (/房貸|買房/.test(topic)) {
    return [
      { kind: '反常型', title: '房貸繳得起，為什麼家裡還是沒有安全感？' },
      { kind: '反常型', title: '問題可能不是房貸利率，而是你每月剩多少錢' },
      { kind: '數字型', title: '3 個數字，買房後一定要先算清楚' },
    ];
  }
  if (/保險|保費/.test(topic)) {
    return [
      { kind: '反常型', title: '保險買得多，為什麼家庭現金還是不夠用？' },
      { kind: '反常型', title: '真正該檢查的，不只是保單有沒有買齊' },
      { kind: '數字型', title: '3 個家庭現金流數字，保費繳之前先看清楚' },
    ];
  }
  return [
    { kind: '反常型', title: '收入不低卻存不到錢？問題可能不是你花太多' },
    { kind: '金額型', title: '2025 年我家月收 8 萬、支出 71,030 元：這樣有餘裕嗎？' },
    { kind: '數字型', title: '3 個讓薪水留不下來的現金流漏洞，你中了幾個？' },
  ];
}
