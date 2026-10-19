import { entryById } from '../lib/data';
import { href } from '../lib/router';
import { useSaved } from '../lib/storage';
import { TopBar, EntryRow } from '../components/parts';

export function Saved() {
  const saved = useSaved()
    .map((id) => entryById.get(id))
    .filter((e) => !!e);

  return (
    <>
      <TopBar backTo={href.home()} backLabel="Home" />
      <main class="page">
        <h1 class="title">My verses</h1>
        <p class="subtitle">Responses you’ve saved, kept on this device.</p>
        {saved.length ? (
          <ul class="rows">
            {saved.map((e) => (
              <EntryRow e={e} showThought />
            ))}
          </ul>
        ) : (
          <p class="empty">
            Nothing saved yet. Tap <strong>Save</strong> on any response to keep it here, ready for the next time the thought comes back.
          </p>
        )}
      </main>
    </>
  );
}
