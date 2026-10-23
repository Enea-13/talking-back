import { href } from '../lib/router';
import { useLargeText, useTheme, type Theme } from '../lib/storage';
import { TopBar } from '../components/parts';
import painting from '../assets/art/temptation-of-christ.jpg';

// Set VITE_FEEDBACK_URL (an https form link) in the hosting settings to show the
// feedback section; builds without it, such as the store apps, leave it out.
const rawFeedback = (import.meta.env.VITE_FEEDBACK_URL ?? '').trim();
const FEEDBACK_URL = /^https:\/\//.test(rawFeedback) ? rawFeedback : '';

const THEMES: [Theme, string][] = [
  ['auto', 'Automatic'],
  ['light', 'Light'],
  ['dark', 'Dark'],
];

export function About() {
  const [large, setLarge] = useLargeText();
  const [theme, setTheme] = useTheme();
  return (
    <>
      <TopBar backTo={href.home()} backLabel="Home" />
      <main class="page prose">
        <h1 class="title">About</h1>

        <h2>The method</h2>
        <p>
          Around the year 390, Evagrius of Pontus, a teacher of monks in the Egyptian desert, was asked for help resisting the thoughts that pull a
          person away from God. His answer was a handbook. He named the thoughts one by one under eight headings, from gluttony to pride, and gave
          each a short passage of Scripture to say back to it.
        </p>
        <p>
          He gathered them in advance because, as he explains, the right words are hard to find in the moment of struggle. Jesus answered his
          tempter in the wilderness by quoting Scripture, and Evagrius invites us to do the same.
        </p>
        <figure class="painting">
          <img
            src={painting}
            width={600}
            height={797}
            loading="lazy"
            decoding="async"
            alt="Christ, seated in a dark blue robe, raises his hand as he answers the devil, who is disguised as a friar with small horns and clawed feet and holds out a stone."
          />
          <figcaption>
            Juan de Flandes, <em>The Temptation of Christ</em>, c. 1500–1504. The devil, disguised as a friar, offers a stone to turn into bread.
            <span>National Gallery of Art, Washington · public domain</span>
          </figcaption>
        </figure>

        <h2>How to use it</h2>
        <ol>
          <li>Notice what the thought is saying. Search for it in your own words, or pick a feeling or one of the eight thoughts.</li>
          <li>Find the line that sounds like the voice in your head.</li>
          <li>
            Say the verse, aloud if you can. Some responses are spoken to the thought, some to yourself, and some to God as a prayer. The label above
            each verse tells you which.
          </li>
        </ol>

        <h2>Settings</h2>
        <p class="setting-name" id="appearance">
          Appearance
        </p>
        <div class="segmented" role="radiogroup" aria-labelledby="appearance">
          {THEMES.map(([value, label]) => (
            <label class={theme === value ? 'on' : ''}>
              <input type="radio" name="theme" value={value} checked={theme === value} onChange={() => setTheme(value)} />
              {label}
            </label>
          ))}
        </div>
        <label class="toggle">
          <input type="checkbox" checked={large} onChange={(ev) => setLarge((ev.target as HTMLInputElement).checked)} />
          <span>Larger text</span>
        </label>

        {FEEDBACK_URL && (
          <>
            <h2>Feedback</h2>
            <p>
              This is a test version. Tell us what helped, what was confusing, and any verse or wording that seems wrong.{' '}
              <a href={FEEDBACK_URL} target="_blank" rel="noopener">
                Send feedback
              </a>
              .
            </p>
          </>
        )}

        <h2>Sources</h2>
        <p>
          Inspired by Evagrius of Pontus, <em>Talking Back: A Monastic Handbook for Combating Demons</em>, translated by David Brakke (Cistercian
          Publications / Liturgical Press, 2009). We recommend reading it. Each response lists its book and entry number so you can find the
          original.
        </p>
        <p>
          The situations in this app are written in modern words and are not quotations from that translation. Verses are from the{' '}
          <em>World English Bible</em> (public domain). Evagrius used the Greek Old Testament, so where its wording differs, the app also shows
          Brenton’s 1851 translation of the Septuagint (public domain), marked “As Evagrius read it.” Shortened passages are marked
          with “…”, and psalm titles and the word “Selah” are left out.
        </p>
        <p>
          The painting is Juan de Flandes, <em>The Temptation of Christ</em> (c. 1500–1504), from the open-access collection of the National Gallery
          of Art, Washington (public domain).
        </p>
        <p>Text is set in Literata, by the Literata Project Authors (SIL Open Font License).</p>
        <p>
          This app is a companion for prayer, not a substitute for a pastor, a spiritual director or medical care. Everything stays on your device: see the{' '}
          <a href={href.privacy()}>privacy policy</a>.
        </p>
      </main>
    </>
  );
}
