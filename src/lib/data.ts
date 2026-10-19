import raw from '../../data/entries.json';

export type Kind = 'rebuke' | 'self' | 'prayer';

export interface Passage {
  ref: string | null;
  text: string | null;
  greek?: { ref: string; text: string };
}

export interface Entry {
  id: string;
  thought: string;
  book: number;
  n: string;
  kind: Kind;
  cluster: string;
  voice: string;
  situation: string;
  tags: string[];
  note?: string;
  lead: 'web' | 'greek';
  passages: Passage[];
}

export interface Cluster {
  id: string;
  title: string;
}

export interface Thought {
  id: string;
  order: number;
  name: string;
  modernName: string;
  summary: string;
  clusters: Cluster[];
}

interface DataFile {
  thoughts: Thought[];
  totals: Record<string, number>;
  entries: Entry[];
}

const data = raw as unknown as DataFile;

export const thoughts = data.thoughts;
export const entries = data.entries;
export const totals = data.totals;

export const thoughtById = new Map(thoughts.map((t) => [t.id, t]));
export const entryById = new Map(entries.map((e) => [e.id, e]));

export const entriesFor = (thoughtId: string) => entries.filter((e) => e.thought === thoughtId);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** A thought's place in Evagrius's order, as a roman numeral. */
export const roman = (n: number) => ROMAN[n - 1] ?? String(n);

export function clusterTitle(e: Entry) {
  return thoughtById.get(e.thought)?.clusters.find((c) => c.id === e.cluster)?.title ?? '';
}

export const KIND_LABEL: Record<Kind, string> = {
  rebuke: 'Say to the thought',
  self: 'Say to yourself',
  prayer: 'Pray',
};

/** The verse(s) to show first: Greek wording when it leads, otherwise the WEB. */
export function mainVerses(e: Entry) {
  return e.passages
    .map((p) =>
      e.lead === 'greek' && p.greek ? { ref: p.greek.ref, text: p.greek.text } : p.text ? { ref: p.ref ?? '', text: p.text } : null,
    )
    .filter((v): v is { ref: string; text: string } => !!v);
}

/** The other rendering, shown as a secondary block. */
export function altVerses(e: Entry) {
  return e.passages
    .map((p) => {
      if (e.lead === 'greek') return p.greek && p.text ? { label: 'World English Bible', ref: p.ref ?? '', text: p.text } : null;
      return p.greek ? { label: 'As Evagrius read it', ref: p.greek.ref, text: p.greek.text } : null;
    })
    .filter((v): v is { label: string; ref: string; text: string } => !!v);
}

/** Next entry in the same cluster, wrapping around. */
export function nextInCluster(e: Entry) {
  const list = entries.filter((x) => x.thought === e.thought && x.cluster === e.cluster);
  if (list.length < 2) return null;
  return list[(list.indexOf(e) + 1) % list.length];
}
