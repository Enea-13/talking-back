// Download the two public-domain Bible texts the data build reads into
// .cache/bibles/ (skipped when already present). Needs `unzip` on the PATH.
//
//   engwebu_vpl.zip      World English Bible, US spelling, "the LORD" (~5 MB)
//   eng-Brenton_vpl.zip  Brenton's English Septuagint (~4 MB)
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../.cache/bibles/', import.meta.url));
mkdirSync(dir, { recursive: true });

for (const id of ['engwebu', 'eng-Brenton']) {
  const txt = `${id}_vpl.txt`;
  if (existsSync(dir + txt)) {
    console.log(`have ${txt}`);
    continue;
  }
  const url = `https://ebible.org/Scriptures/${id}_vpl.zip`;
  console.log(`downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const zip = dir + `${id}_vpl.zip`;
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  execFileSync('unzip', ['-o', '-q', '-j', zip, txt, '-d', dir]);
  rmSync(zip);
}
