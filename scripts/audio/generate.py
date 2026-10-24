"""Record each response's verses for "Speak it back", with the Kokoro voice in voice.json.

    npm run audio       (node scripts/audio/readings.mjs | uv run --project scripts/audio ...)

Reads [{id, text}] on stdin. Writes one clip per distinct reading to public/audio/<key>.m4a
(32 kbps AAC, encoded with macOS's afconvert) and data/audio.json, which the app reads: for each
entry, its clip, a hash of the text it was recorded from, and when each word on screen starts. A
clip's key covers everything that shapes its sound, so a rerun records only the readings that
changed and deletes clips nothing uses any more.

voice.json "say" fixes words Kokoro gets wrong, spelled the way a pronunciation guide would:
parts joined by hyphens, the stressed part in capitals ("NAY-hash"), or IPA between slashes.
"""
import atexit
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from bisect import bisect_right
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CLIPS = ROOT / 'public' / 'audio'
MANIFEST = ROOT / 'data' / 'audio.json'
RATE = 24000
# Bump when a change here alters how clips sound or are timed, so that all of them are recorded again.
VERSION = 1


def sha(s):
    return hashlib.sha1(s.encode()).hexdigest()[:12]


def for_voice(text):
    """What the voice is given. Each swap keeps the length, so positions still match the text on screen."""
    return re.sub(r'\bGOD\b', 'God', re.sub(r'\bLORD\b', 'Lord', text.replace('…', ' ')))


def whole(word):
    return re.compile(rf"(?<![\w’']){re.escape(word)}(?![\w’'])")


def load_pipeline(lang):
    import espeakng_loader
    import misaki.espeak  # noqa: F401  (points phonemizer at espeakng_loader's espeak on import)
    from phonemizer.backend.espeak.wrapper import EspeakWrapper
    from kokoro import KPipeline

    # espeak, which guesses words missing from Kokoro's dictionary, quietly ignores a data folder
    # whose path is over 160 characters and then exits. A long one is copied somewhere short.
    data = espeakng_loader.get_data_path()
    if len(str(data)) > 150:
        tmp = tempfile.mkdtemp(prefix='espeak')
        atexit.register(shutil.rmtree, tmp, True)
        shutil.copytree(data, Path(tmp) / 'd')
        EspeakWrapper.set_data_path(str(Path(tmp) / 'd'))
    return KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M')


VOWELS = set('AIOQWYaeiouæɑɒɔəɛɜɪʊʌᵻɐ')
# Parts that pronunciation guides use for a bare vowel, which English spelling alone gets wrong
# ("ay" reads as "aye"), in Kokoro's British (b) and American (a) phonemes.
SOUNDS = {
    'b': {'ay': 'A', 'ee': 'iː', 'eye': 'I', 'oh': 'Q', 'oo': 'uː', 'uh': 'ə', 'ah': 'ɑː'},
    'a': {'ay': 'A', 'ee': 'i', 'eye': 'I', 'oh': 'O', 'oo': 'u', 'uh': 'ə', 'ah': 'ɑ'},
}


def respell(g2p, lang, spelling):
    """'NAY-hash' as phonemes: each part as English reads it, stressed where it is in capitals."""
    if spelling.startswith('/'):
        return spelling.strip('/')
    out = ''
    for part in spelling.split('-'):
        ps = SOUNDS[lang].get(part.lower()) or re.sub('[ˈˌ]', '', g2p(part.lower())[0])
        if part.isupper():
            i = next(i for i, c in enumerate(ps) if c in VOWELS)
            ps = ps[:i] + 'ˈ' + ps[i:]
        elif lang == 'b':
            ps = ps.replace('ɜː', 'ə')  # an unstressed "er" is a schwa
        out += ps
    return out


SAME = str.maketrans('’‘“”', "''\"\"")


def record(pipe, voice, speed, voiced, marked):
    """Speak `marked` (`voiced` with fixed words marked up). Returns the audio and, for each word
    Kokoro read, where it is in `voiced` and when it starts, in seconds."""
    flat = voiced.translate(SAME)
    parts, times, offset, cursor = [], [], 0.0, 0
    # Kokoro reads a long text in parts, and each part's timings start again at zero.
    for r in pipe(marked, voice=voice, speed=speed):
        for tk in r.tokens:
            if not any(c.isalpha() for c in tk.text):
                continue
            at = flat.find(tk.text.translate(SAME), cursor)
            if at < 0:
                raise ValueError(f'"{tk.text}" not found after position {cursor} in: {voiced}')
            cursor = at + len(tk.text)
            if tk.start_ts is not None:
                times.append((at, offset + tk.start_ts))
        audio = r.audio.numpy()
        parts.append(audio)
        offset += len(audio) / RATE
    return np.concatenate(parts), times


def word_starts(text, times):
    """When each word on screen starts (each run of non-spaces, as Entry.tsx splits the verses), in
    hundredths of a second, stored as the gap from the word before to keep data/audio.json small."""
    starts = [m.start() for m in re.finditer(r'\S+', text)]
    first = [None] * len(starts)
    for at, t in times:
        w = bisect_right(starts, at) - 1
        if w >= 0 and first[w] is None:
            first[w] = round(t * 100)
    gaps, prev = [], 0
    for t in first:
        # A word with nothing spoken in it (a dash) lights up with the one before.
        t = prev if t is None else max(prev, t)
        gaps.append(t - prev)
        prev = t
    return gaps


def save(audio, path, tmp):
    # The same loudness for every clip, without clipping.
    audio = audio * min(0.06 / np.sqrt((audio**2).mean()), 0.95 / np.abs(audio).max())
    wav = Path(tmp) / 'clip.wav'
    sf.write(wav, audio, RATE)
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1', str(wav), str(path)], check=True)


def main():
    if not shutil.which('afconvert'):
        sys.exit('generate.py encodes with afconvert, which comes with macOS.')
    readings = json.load(sys.stdin)
    raw = (HERE / 'voice.json').read_text()
    settings = json.loads(raw)
    voice, lang, speed, say = settings['voice'], settings['lang'], settings['speed'], settings['say']

    old = json.loads(MANIFEST.read_text())['clips'] if MANIFEST.exists() else {}
    timed = {c['file']: c['words'] for c in old.values() if (CLIPS / f"{c['file']}.m4a").exists()}
    clips, todo = {}, {}
    for r in readings:
        voiced = for_voice(r['text'])
        fixes = sorted(w for w in say if whole(w).search(voiced))
        key = sha(json.dumps([VERSION, voice, lang, speed, voiced, [[w, say[w]] for w in fixes]], ensure_ascii=False))
        clips[r['id']] = {'file': key, 'text': sha(r['text'])}
        if key not in timed:
            todo[key] = (r['text'], fixes)

    guessed, failed = {}, []
    try:
        if todo:
            CLIPS.mkdir(parents=True, exist_ok=True)
            pipe = load_pipeline(lang)
            guess = pipe.g2p.fallback

            def noting(tk):
                guessed[tk.text] = guessed.get(tk.text, 0) + 1
                return guess(tk)

            phonemes = {w: respell(pipe.g2p, lang, s) for w, s in say.items()}
            pipe.g2p.fallback = noting
            with tempfile.TemporaryDirectory() as tmp:
                for n, (key, (text, fixes)) in enumerate(todo.items(), 1):
                    voiced = for_voice(text)
                    marked = voiced
                    for w in fixes:
                        marked = whole(w).sub(f'[{w}](/{phonemes[w]}/)', marked)
                    try:
                        audio, times = record(pipe, voice, speed, voiced, marked)
                    except ValueError as err:
                        failed.append(str(err))
                        continue
                    save(audio, CLIPS / f'{key}.m4a', tmp)
                    timed[key] = word_starts(text, times)
                    print(f'[{n}/{len(todo)}] {key}  {len(audio) / RATE:.1f}s', flush=True)
    finally:
        # Written even when the run stops part way, so what was recorded is kept. Entries still
        # without a recording are left out, and the build check names them.
        done = {i: {**c, 'words': timed[c['file']]} for i, c in clips.items() if c['file'] in timed}
        used = {c['file'] for c in done.values()}
        unused = [f for f in CLIPS.glob('*.m4a') if f.stem not in used]
        for f in unused:
            f.unlink()
        rows = ',\n'.join(f'    {json.dumps(i)}: {json.dumps(c, separators=(",", ":"))}' for i, c in done.items())
        MANIFEST.write_text(f'{{\n  "source": "{sha(raw)}",\n  "voice": "{voice}",\n  "clips": {{\n{rows}\n  }}\n}}\n')

    recorded = sum(key in timed for key in todo)
    print(f'{recorded} recorded, {len(used) - recorded} unchanged, {len(unused)} removed.')
    new = sorted(w for w in guessed if w.strip() and w not in say)
    if new:
        print('Kokoro guessed these words; add any it gets wrong to "say" in voice.json:\n  ' + ', '.join(new))
    if failed:
        sys.exit(f'{len(failed)} not recorded, because a word could not be matched to the text on screen:\n  ' + '\n  '.join(failed))


if __name__ == '__main__':
    main()
