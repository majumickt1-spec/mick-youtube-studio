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

function shortHeadline(title: string, fallback: string) {
  const parts = title
    .replace(/[？！?：:｜|]/g, '｜')
    .split('｜')
    .map((part) => part.trim())
    .filter(Boolean);
  const candidate = parts.find((part) => part.length >= 4 && part.length <= 8);
  return candidate || fallback;
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
  const isAi = pillar === 'AI資產建立';
  const headline = shortHeadline(
    safeTitle,
    isAi ? '副業還是加班？' : '錢去哪了？',
  );

  const sharedContext = `The image must communicate this exact video topic: "${safeTopic}". It must visually support this working title: "${safeTitle}". Translate the topic into concrete, topic-specific actions, ordinary objects, and consequences; do not reuse a generic creator-at-a-laptop scene.`;

  return [
    {
      name: '情緒衝突',
      text: headline,
      scene: `人物近景：呈現「${safeTitle}」帶來的單一明確情緒與動作，不以坐在電腦桌前作為預設。`,
      prompt: `Direction A — emotional conflict. ${sharedContext} Show exactly one believable Taiwanese adult aged 35–55 in a candid ${round.cameraA}. Give the person one unmistakable emotion and one physical action caused by the topic. Choose a location and props that specifically explain this episode, not a generic office or studio. Use ${round.mood}. Natural skin texture, realistic posture, no glamour pose, no looking at camera, no glowing cubes, no piles of gold or cash.`,
    },
    {
      name: '生活情境',
      text: isAi ? '下班後還在忙？' : '這就是我家？',
      scene: `真實情境：用家庭或工作現場呈現「${safeTopic}」的原因與後果，人物不是擺拍主角。`,
      prompt: `Direction B — lived-in situation. ${sharedContext} Build a ${round.cameraB} inside a recognizable Taiwanese home, commute, storefront, or workplace selected for this exact topic. Show a clear cause-and-effect story through natural human activity and topic-specific objects. Use a different location, pose, camera distance, and object set from Direction A. The people are part of the situation, not posing for a portrait. Use ${round.mood}. Avoid a lone man staring at a laptop, fake app screens, glowing UI walls, gold bars, or luxury imagery.`,
    },
    {
      name: '象徵對比',
      text: isAi ? '工時還是資產？' : '收入不少卻沒錢？',
      scene: `無人物象徵：只用與「${safeTitle}」直接相關的日常物件，形成一眼看懂的矛盾或前後對比。`,
      prompt: `Direction C — symbolic contrast. ${sharedContext} Create a people-free ${round.cameraC}. Use only two to four ordinary, topic-specific objects to form one immediately readable visual contradiction, imbalance, before-and-after relationship, or trade-off. No people, faces, hands, bodies, desks with laptops, coins, money rain, gold bars, glowing cubes, generic upward charts, or abstract AI icons. Use ${round.mood}. Favor a strong silhouette, tactile real materials, and a simple visual metaphor that remains clear at phone size.`,
    },
  ];
}
