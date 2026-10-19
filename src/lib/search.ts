import MiniSearch from 'minisearch';
import { entries, thoughtById, clusterTitle, type Entry } from './data';

// Everyday words people type, mapped to the vocabulary the entries are tagged with.
const SYNONYMS: Record<string, string> = {
  anxious: 'anxiety worry fear',
  anxiety: 'worry fear',
  worried: 'worry anxiety',
  worry: 'anxiety',
  scared: 'fear afraid',
  afraid: 'fear',
  frightened: 'fear',
  tempted: 'temptation craving',
  resentful: 'resentment bitterness grudge anger',
  bitter: 'bitterness resentment',
  bored: 'boredom restless listlessness',
  boring: 'boredom restless',
  restless: 'listlessness boredom',
  unnoticed: 'ignored praise approval recognition',
  ignored: 'unnoticed approval',
  superior: 'pride contempt better',
  craving: 'cravings appetite desire',
  crave: 'craving appetite',
  hopeless: 'hopelessness despair discouraged',
  depressed: 'sadness despair hopeless discouraged',
  sad: 'sadness grief',
  drink: 'alcohol wine drinking',
  drinking: 'alcohol wine',
  drunk: 'alcohol drunkenness wine',
  beer: 'alcohol drinking',
  booze: 'alcohol drinking',
  alcohol: 'wine drinking',
  food: 'eating overeating appetite',
  eat: 'eating food',
  eating: 'food overeating',
  snack: 'treat craving food',
  binge: 'overeating binge',
  overeat: 'overeating fullness',
  diet: 'fasting diet',
  lent: 'fasting',
  fast: 'fasting',
  money: 'provision scarcity poverty',
  broke: 'poverty scarcity money',
  bills: 'money provision scarcity',
  rent: 'money provision',
  poor: 'poverty',
  sick: 'illness sickness health',
  ill: 'illness sickness',
  health: 'illness body',
  tired: 'weary exhaustion',
  exhausted: 'exhaustion weary',
  lonely: 'alone isolation abandoned unseen',
  party: 'celebration holiday',
  holiday: 'celebration feast',
  christmas: 'holiday celebration',
  lazy: 'laziness work',
  give: 'giving generosity',
  stingy: 'generosity giving sharing selfishness',
  selfish: 'selfishness sharing generosity',
  greedy: 'greed hoarding selfishness',
  greed: 'hoarding selfishness',
  hoard: 'hoarding stockpiling',
  charity: 'giving generosity poor',
  share: 'sharing generosity',
  pray: 'prayer',
  sleep: 'rest vigil night',
  quit: 'giving up pointless',
  pointless: 'pointless doubt',
  old: 'aging',
  aging: 'body decline',
  home: 'homesick family',
  family: 'home',
  angry: 'anger resentment',
  mad: 'anger',
  furious: 'anger',
  jealous: 'envy',
  envy: 'jealous',
  lust: 'lust impurity',
  porn: 'lust impurity',
  proud: 'pride',
  praise: 'approval recognition praise',
  // Lust & impurity
  sex: 'lust impurity desire',
  sexual: 'lust impurity desire',
  fantasy: 'fantasy imagination images',
  fantasize: 'fantasy imagination images',
  fantasizing: 'fantasy imagination images',
  fantasies: 'fantasy imagination images',
  free: 'freedom victory hopeless',
  notice: 'noticed recognition approval',
  notices: 'noticed recognition approval',
  noticed: 'recognition approval',
  nobody: 'alone unseen',
  forgiving: 'forgiveness grudge',
  masturbation: 'arousal body lust',
  aroused: 'arousal body desire',
  dream: 'dreams night',
  dreams: 'dreams night nightmares',
  relapse: 'relapse going back habit',
  // Discouragement & fear
  nightmare: 'nightmares dreams night fear',
  nightmares: 'dreams night fear',
  night: 'night dark',
  panic: 'fear terror dread',
  terrified: 'terror fear',
  dread: 'fear future',
  abandoned: 'forsaken alone abandoned',
  alone: 'abandoned isolation loneliness',
  forsaken: 'abandoned',
  guilt: 'guilt shame past sins',
  ashamed: 'shame guilt',
  shame: 'guilt',
  grief: 'grief sadness loss',
  grieving: 'grief loss',
  loss: 'grief loss',
  why: 'why purpose trials',
  crazy: 'madness mental illness',
  // Anger & resentment
  annoyed: 'irritation anger',
  irritated: 'irritation anger temper',
  temper: 'anger temper',
  grudge: 'grudge resentment forgive',
  revenge: 'revenge payback',
  forgive: 'forgiveness grudge',
  gossip: 'gossip slander rumor',
  argue: 'argument quarrel strife',
  argument: 'quarrel strife',
  fight: 'quarrel strife argument',
  hate: 'hatred enemies',
  enemy: 'enemies',
  insulted: 'insult mockery',
  unfair: 'blame unfair',
  // Restless, can't settle
  procrastinate: 'procrastination laziness work',
  procrastinating: 'procrastination laziness',
  unmotivated: 'apathy motivation',
  motivation: 'apathy',
  distracted: 'distraction focus',
  focus: 'distraction prayer',
  move: 'relocate move elsewhere',
  job: 'work career',
  homesick: 'homesick family home',
  church: 'community leaders',
  boss: 'leaders authority',
  pastor: 'leaders',
  complain: 'grumbling complaining',
  // Craving approval
  attention: 'approval visibility noticed',
  likes: 'approval visibility praise',
  'social media': 'visibility platform approval',
  famous: 'fame glory',
  fame: 'famous glory',
  promotion: 'position status ambition',
  title: 'position honor',
  show: 'show audience',
  'show off': 'boasting audience',
  brag: 'boasting',
  // Pride
  arrogant: 'pride superiority',
  better: 'superiority contempt judging',
  judge: 'judging',
  judgmental: 'judging contempt',
  perfect: 'perfection arrived',
  credit: 'credit self-reliance',
  blasphemy: 'blasphemy intrusive thoughts',
  blasphemous: 'blasphemy intrusive thoughts',
  intrusive: 'intrusive thoughts blasphemy',
};

interface Doc {
  id: string;
  thoughtId: string;
  voice: string;
  situation: string;
  tags: string;
  cluster: string;
  thought: string;
  verse: string;
}

// Filler words carry no meaning here and drown out the real ones ("I keep…").
const STOP = new Set(
  "i me my myself you your it its the a an and or but of to in on at for with about is am are was were be been being do does did have has had will would can cant can't could should just so that this these those they them their he she his her we us our what how when where who keep ever really very too not no dont don't im i'm ive i've all any some someone something get got feel feeling like want".split(' '),
);

const index = new MiniSearch<Doc>({
  fields: ['voice', 'situation', 'tags', 'cluster', 'thought', 'verse'],
  processTerm: (term) => {
    const t = term.toLowerCase().replace(/’/g, "'");
    return STOP.has(t) ? null : t;
  },
  storeFields: ['id', 'thoughtId'],
  searchOptions: {
    boost: { voice: 3, tags: 2.5, situation: 2, cluster: 1.5, thought: 1.5, verse: 1 },
    prefix: (term) => term.length > 2,
    fuzzy: (term) => (term.length > 4 ? 0.2 : false),
    combineWith: 'OR',
  },
});

index.addAll(
  entries.map((e) => {
    const t = thoughtById.get(e.thought);
    return {
      id: e.id,
      thoughtId: e.thought,
      voice: e.voice,
      situation: e.situation,
      tags: e.tags.join(' '),
      cluster: clusterTitle(e),
      thought: `${t?.modernName ?? ''} ${t?.name ?? ''}`,
      verse: e.passages.map((p) => `${p.ref ?? ''} ${p.text ?? p.greek?.text ?? ''}`).join(' '),
    };
  }),
);

export function expand(query: string) {
  const lower = query.toLowerCase();
  const words = lower.match(/[a-z’']+/g) ?? [];
  const phrases = Object.keys(SYNONYMS).filter((k) => k.includes(' ') && lower.includes(k));
  const extra = [...words.map((w) => w.replace(/[’']/g, '')), ...phrases].flatMap((w) => (SYNONYMS[w] ?? '').split(' ').filter(Boolean));
  return [query, ...extra].join(' ');
}

const byId = new Map(entries.map((e) => [e.id, e]));

/** Ranked matches for what the thought is saying, optionally within one thought. */
export function search(query: string, limit = 30, thought?: string): Entry[] {
  const q = query.trim();
  if (!q) return [];
  return index
    .search(expand(q), thought ? { filter: (r) => r.thoughtId === thought } : undefined)
    .slice(0, limit)
    .map((r) => byId.get(r.id as string)!)
    .filter(Boolean);
}
