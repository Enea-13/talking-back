# Talking Back

A phone-first web app inspired by Evagrius of Pontus’s *Talking Back*: recognize the thought, and get a Bible verse to answer it within seconds. It works offline and can be installed to the home screen.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # rebuilds data/entries.json, type-checks, writes dist/
```

## Data

`data/entries.json` is the single file the app reads, and the contract a future iOS app will reuse. It is generated; don’t edit it by hand.

| File | What it holds |
| --- | --- |
| `data/skeleton.json` | Every entry in the book: book, number, kind (rebuke / self / prayer), Septuagint reference. Facts only. |
| `data/refs.json` | Each reference converted to standard English numbering (World English Bible). |
| `data/thoughts.json` | The eight thoughts, their modern names and their clusters. |
| `data/authoring/NN-<thought>.json` | Hand-written per entry: `voice`, `situation`, `tags`, `cluster`, optional `note`, `lead: "greek"`, `excerpt`, and reference fixes (`web`, `greekRef`). |

Rebuilding from scratch:

```bash
npm run fetch-bibles                                  # WEB + Brenton into .cache/bibles
pdftotext -bbox -f 62 -l 184 <book.pdf> <work>/bbox.html
node scripts/parse-entries.mjs <work>/bbox.html <work>/reading.txt
node scripts/map-refs.mjs <work>/reading.txt <work>/review.txt
node scripts/build-data.mjs --reading <work>/reading.txt
```

`reading.txt` and `review.txt` contain the copyrighted translation and must stay outside this folder. They are used only to match verse references, and by the build’s copyright check, which fails if any modern wording shares an 8-word run with the translation.

## Sources

- Verses: *World English Bible* (US, “LORD” edition), public domain.
- Greek Old Testament wording: Brenton’s English Septuagint (1851), public domain.
- Typeface: Literata (Latin subset, `src/assets/fonts/`), SIL Open Font License.
- Painting (About screen): Juan de Flandes, *The Temptation of Christ*, c. 1500–1504, National Gallery of Art, Washington, accession 1967.7.1. Public domain, from the NGA’s open-access images (free for any use). `src/assets/art/` holds a 600 px copy.
- Crisis lines in `src/lib/care.ts` were checked in October 2026; recheck them before each store release.
- Entry numbering follows David Brakke’s translation, *Talking Back* (Liturgical Press, 2009). The app’s situations are original modern wording, not quotations.
