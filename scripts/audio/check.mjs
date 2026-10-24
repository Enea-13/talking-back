// Fails the build if any response's recording is missing or was made from other words, or from
// another voice.json, so a store build can't ship a Speak it back button that stays silent.
// `npm run audio` records whatever this reports.
import { existsSync, readFileSync } from 'node:fs';
import { readJson, readings, textHash } from './readings.mjs';

const manifest = readJson('data/audio.json');
const problems = [];
if (manifest.source !== textHash(readFileSync(new URL('voice.json', import.meta.url), 'utf8'))) {
  problems.push('scripts/audio/voice.json has changed since the recordings were made');
}
for (const { id, text } of readings()) {
  const clip = manifest.clips[id];
  if (!clip) problems.push(`${id}: no recording`);
  else if (clip.text !== textHash(text) || clip.words.length !== text.match(/\S+/g).length) problems.push(`${id}: recorded from other words`);
  else if (!existsSync(new URL(`../../public/audio/${clip.file}.m4a`, import.meta.url))) problems.push(`${id}: public/audio/${clip.file}.m4a is missing`);
}

if (problems.length) {
  console.error(`Speak it back recordings are out of date (${problems.length}):\n  ${problems.slice(0, 20).join('\n  ')}`);
  if (problems.length > 20) console.error(`  …and ${problems.length - 20} more`);
  console.error('Run `npm run audio` to record them.');
  process.exit(1);
}
