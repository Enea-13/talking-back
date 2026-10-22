import type { ComponentChildren } from 'preact';
import { href } from '../lib/router';
import { TopBar } from '../components/parts';
// The same text is published at enea-13.github.io/talking-back-site/privacy (see docs/store-release.md).
import policy from '../../docs/privacy.md?raw';

/** **Bold**, *italic* and [links](url): the inline Markdown docs/privacy.md uses. */
function inline(text: string): ComponentChildren[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/).map((part) => {
    if (part.startsWith('**')) return <strong>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*')) return <em>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[(.+)\]\((.+)\)$/);
    if (!link) return part;
    return link[2].startsWith('http') ? (
      <a href={link[2]} target="_blank" rel="noopener">
        {link[1]}
      </a>
    ) : (
      <a href={link[2]}>{link[1]}</a>
    );
  });
}

/** Headings, paragraphs and "- " lists, one block per blank-line-separated chunk. */
const blocks = (md: string) =>
  md
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n');
      if (block.startsWith('# ')) return <h1 class="title">{inline(block.slice(2))}</h1>;
      if (block.startsWith('## ')) return <h2>{inline(block.slice(3))}</h2>;
      if (lines.every((l) => l.startsWith('- '))) return <ul>{lines.map((l) => <li>{inline(l.slice(2))}</li>)}</ul>;
      return <p>{inline(lines.join(' '))}</p>;
    });

export function Privacy() {
  return (
    <>
      <TopBar backTo={href.about()} backLabel="About" />
      <main class="page prose">{blocks(policy)}</main>
    </>
  );
}
