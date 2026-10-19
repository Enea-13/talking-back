import type { JSX } from 'preact';

const Svg = (props: JSX.IntrinsicElements['svg']) => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    {...props}
  />
);

export const Search = () => (
  <Svg>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const Back = () => (
  <Svg>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);
export const Chevron = () => (
  <Svg width="18" height="18">
    <path d="m9 18 6-6-6-6" />
  </Svg>
);
export const Star = ({ filled }: { filled?: boolean }) => (
  <Svg fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </Svg>
);
export const Speaker = ({ on }: { on?: boolean }) => (
  <Svg>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    {on ? <path d="M16 9h.01M16 15h.01M20 12h.01" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
  </Svg>
);
export const Share = () => (
  <Svg>
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </Svg>
);
export const Info = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5h.01" />
  </Svg>
);
export const Clear = () => (
  <Svg width="18" height="18">
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
export const Next = () => (
  <Svg width="18" height="18">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

// One simple glyph per thought, drawn in that thought's color.
const THOUGHT_PATHS: Record<string, JSX.Element> = {
  // a cup
  gluttony: <path d="M6 4h12l-1.2 6.5a4.9 4.9 0 0 1-9.6 0zM12 15.5V20M8.5 20.5h7" />,
  // a flame
  fornication: <path d="M12 3c.6 3 4.5 4.7 4.5 9.4a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.4 2.3-4.4.1 1.8.9 2.9 2 3.2-.4-2.9-.6-5.4.2-8.2z" />,
  // a stack of coins
  money: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" />
      <path d="M5 6v5.5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 11.5V17c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5.5" />
    </>
  ),
  // a cloud with rain
  sadness: <path d="M7.5 14.5a3.8 3.8 0 0 1 .3-7.6 5 5 0 0 1 9.6 1.4 3.2 3.2 0 0 1-.4 6.2zM9 18l-.8 2M12.5 18l-.8 2M16 18l-.8 2" />,
  // a lightning bolt
  anger: <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z" />,
  // an hourglass
  listlessness: <path d="M6.5 3h11M6.5 21h11M8 3c0 4.5 8 4.7 8 9s-8 4.5-8 9M16 3c0 4.5-8 4.7-8 9s8 4.5 8 9" />,
  // an eye: wanting to be seen
  vainglory: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // a crown
  pride: <path d="M3.5 8.5 7.5 12 12 5.5l4.5 6.5 4-3.5-2 10h-13zM5.5 21h13" />,
};

export const ThoughtIcon = ({ id, size = 22 }: { id: string; size?: number }) => (
  <Svg width={size} height={size} stroke-width="1.8">
    {THOUGHT_PATHS[id]}
  </Svg>
);

export const Phone = () => (
  <Svg width="18" height="18">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Svg>
);
