import type { JSX } from 'preact';

const Svg = (props: JSX.IntrinsicElements['svg']) => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    {...props}
  />
);

export const Search = () => (
  <Svg width="20" height="20">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);
export const Back = () => (
  <Svg>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);
export const Chevron = () => (
  <Svg width="18" height="18">
    <path d="m9.5 18 6-6-6-6" />
  </Svg>
);
export const Star = ({ filled, size = 22 }: { filled?: boolean; size?: number }) => (
  <Svg width={size} height={size} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8Z" />
  </Svg>
);
export const Speaker = ({ on, size = 22 }: { on?: boolean; size?: number }) => (
  <Svg width={size} height={size}>
    {on ? (
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    ) : (
      <>
        <path d="M11 5 6 9H3v6h3l5 4Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    )}
  </Svg>
);
export const Share = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size}>
    <path d="M12 3.5v11.5M7.5 8 12 3.5 16.5 8" />
    <path d="M5.5 13.5v5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5" />
  </Svg>
);
export const Info = () => (
  <Svg>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 11v5.6M12 7.6h.01" />
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
export const Candle = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size}>
    <path d="M9.5 21h5v-9.5h-5Z" />
    <path d="M12 9.2c-1.4 0-2.2-.9-2.2-2.1 0-1.5 1.4-2.3 2.2-4.6.8 2.3 2.2 3.1 2.2 4.6 0 1.2-.8 2.1-2.2 2.1Z" />
  </Svg>
);

// One emblem per thought, drawn as a set: same grid, same stroke.
const EMBLEMS: Record<string, JSX.Element> = {
  // the fruit: the first temptation was to eat
  gluttony: (
    <>
      <path d="M12 8.2c-1.3-1.1-3.4-1.6-5-.5C4.9 9.1 4.5 12.4 5.6 15.3c1 2.8 2.9 5 4.5 5 .8 0 1.2-.4 1.9-.4s1.1.4 1.9.4c1.6 0 3.5-2.2 4.5-5 1.1-2.9.7-6.2-1.4-7.6-1.6-1.1-3.7-.6-5 .5Z" />
      <path d="M12 8.2c0-1.9.5-3.4 1.6-4.6" />
      <path d="M13.1 5.6c1.1-1.7 3.1-2.3 4.7-1.7-.6 1.7-2.6 2.6-4.7 1.7Z" />
    </>
  ),
  // the flame
  fornication: (
    <>
      <path d="M12 21c-3.5 0-6-2.5-6-5.7 0-3.3 2.6-5.1 3.6-8.3.7 1.4.7 2.8.3 4 1.6-1 3-3.5 2.8-7.5 3.2 2.4 5.3 6.3 5.3 10.3 0 4-2.5 7.2-6 7.2Z" />
      <path d="M12 21c-1.5 0-2.6-1.1-2.6-2.6 0-1.6 1.2-2.6 2.6-4.3 1.4 1.7 2.6 2.7 2.6 4.3 0 1.5-1.1 2.6-2.6 2.6Z" />
    </>
  ),
  // the purse
  money: (
    <>
      <path d="M9.3 7.6C6.8 9.6 4.6 12.5 4.6 15.7c0 3.3 3 4.8 7.4 4.8s7.4-1.5 7.4-4.8c0-3.2-2.2-6.1-4.7-8.1" />
      <path d="M8.6 7.6h6.8" />
      <path d="M9.3 7.6 7.8 4.1c1.4.6 2.8.7 4.2.1 1.4.6 2.8.5 4.2-.1l-1.5 3.5" />
      <circle cx="12" cy="14.8" r="2.2" />
    </>
  ),
  // the tear
  sadness: (
    <>
      <path d="M12 3.3s-5.6 6.8-5.6 11a5.6 5.6 0 0 0 11.2 0c0-4.2-5.6-11-5.6-11Z" />
      <path d="M9.3 14.6a2.8 2.8 0 0 0 2.2 2.7" />
    </>
  ),
  // the bolt
  anger: <path d="M13.6 2.6 5.8 13.2h5.4l-1.4 8.2 8.4-11h-5.6l1-7.8Z" />,
  // the noonday sun over a sundial: the monk who keeps checking how long until the ninth hour
  listlessness: (
    <>
      <circle cx="12" cy="5.6" r="2.1" />
      <path d="M12 1.6v.8M8 5.6h.8M15.2 5.6h.8M9.2 2.8l.5.5M14.3 3.3l.5-.5" />
      <path d="M4 19.5h16M5 19.5a7 7 0 0 1 14 0" />
      <path d="M12 19.5v-6M12 19.5 7.6 15M12 19.5l4.4-4.5" />
    </>
  ),
  // the peacock feather: wanting to be seen
  vainglory: (
    <>
      <path d="M5.5 21 15 8.5" />
      <path d="M15.4 2.8c3.4.4 5.3 3.6 3.6 6.8-1.6 3-6.1 5.2-9.2 5.4.2-3.2 2.1-7.9 4.1-10.6.4-.7.9-1.3 1.5-1.6Z" />
      <ellipse cx="15.6" cy="7.4" rx="1.9" ry="2.3" transform="rotate(35 15.6 7.4)" />
    </>
  ),
  // the tower of Babel
  pride: (
    <>
      <path d="M4.5 20.5h15" />
      <path d="M6.2 20.5V16h11.6v4.5" />
      <path d="M7.9 16v-4.2h8.2V16" />
      <path d="M9.6 11.8V7.8h4.8v4" />
      <path d="M11 7.8V4h2v3.8" />
      <path d="M11 20.5v-2a1 1 0 0 1 2 0v2" />
    </>
  ),
};

export const ThoughtIcon = ({ id, size = 24 }: { id: string; size?: number }) => (
  <Svg width={size} height={size} stroke-width="1.5">
    {EMBLEMS[id]}
  </Svg>
);

export const Phone = () => (
  <Svg width="20" height="20">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Svg>
);
