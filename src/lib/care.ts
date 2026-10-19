import { useState } from 'preact/hooks';

// Searches that suggest someone may be at risk get a care panel above the results.
const CRISIS =
  /\b(suicid\w*|kill(ing)? my ?self|end(ing)? (it all|my life)|self[- ]?harm\w*|hurt(ing)? my ?self|cutting myself|want(ed)? to die|wish i (was|were) dead|don[’']?t want to (live|be here)|no reason to live|better off dead|overdos\w*)\b/i;

export const isCrisis = (q: string) => CRISIS.test(q);

/** Shown under the care panel for crisis searches, instead of ranked results. */
export const HOPE_IDS = ['sad-063', 'lis-012', 'lis-020', 'sad-016', 'sad-004', 'lis-038', 'sad-071'];

/** Responses that also carry the care panel on their own page. */
export const CARE_ENTRY_IDS = new Set([...HOPE_IDS, 'sad-035', 'sad-037', 'sad-043']);

export interface Helpline {
  country: string;
  name: string;
  number: string;
  tel: string;
  text: boolean;
  emergency: string;
}

// National, free, 24/7 crisis lines (checked October 2026). Everywhere else,
// findahelpline.com lists verified services by country.
export const HELPLINES: Record<string, Helpline> = {
  US: { country: 'United States', name: '988 Suicide & Crisis Lifeline', number: '988', tel: '988', text: true, emergency: '911' },
  CA: { country: 'Canada', name: '9-8-8 Suicide Crisis Helpline', number: '9-8-8', tel: '988', text: true, emergency: '911' },
  GB: { country: 'United Kingdom', name: 'Samaritans', number: '116 123', tel: '116123', text: false, emergency: '999' },
  IE: { country: 'Ireland', name: 'Samaritans', number: '116 123', tel: '116123', text: false, emergency: '112 or 999' },
  AU: { country: 'Australia', name: 'Lifeline', number: '13 11 14', tel: '131114', text: false, emergency: '000' },
  NZ: { country: 'New Zealand', name: 'Need to talk?', number: '1737', tel: '1737', text: true, emergency: '111' },
};

const CA_ZONES =
  /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Swift_Current|Dawson_Creek|Fort_Nelson|Creston|Dawson|Inuvik|Cambridge_Bay|Rankin_Inlet|Resolute|Atikokan|Blanc-Sablon|Nipigon|Thunder_Bay|Rainy_River|Pangnirtung|Montreal)$/;
const US_ZONES =
  /^(America\/(New_York|Detroit|Chicago|Denver|Boise|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu)$/;

/**
 * Best guess at the viewer's country from their time zone (a better location
 * signal than language settings). Unknown places get the worldwide directory.
 */
function guessCountry(): string {
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    /* no Intl time zone */
  }
  if (US_ZONES.test(tz)) return 'US';
  if (CA_ZONES.test(tz)) return 'CA';
  if (tz === 'Europe/London' || tz === 'Europe/Belfast') return 'GB';
  if (tz === 'Europe/Dublin') return 'IE';
  if (tz.startsWith('Australia/')) return 'AU';
  if (tz === 'Pacific/Auckland' || tz === 'Pacific/Chatham') return 'NZ';
  return 'OTHER';
}

const KEY = 'tb:country';

export function useCountry(): [string, (c: string) => void] {
  const [country, setCountry] = useState(() => {
    try {
      return localStorage.getItem(KEY) || guessCountry();
    } catch {
      return guessCountry();
    }
  });
  return [
    country,
    (c: string) => {
      try {
        localStorage.setItem(KEY, c);
      } catch {
        /* storage unavailable: keep the choice for this visit */
      }
      setCountry(c);
    },
  ];
}
