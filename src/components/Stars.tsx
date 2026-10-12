import { clsx } from "clsx";

// A five-pointed star centered on (0, 0) with outer radius 1.
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 1 : 0.42;
  const a = (Math.PI / 5) * i - Math.PI / 2;
  return `${(r * Math.cos(a)).toFixed(3)},${(r * Math.sin(a)).toFixed(3)}`;
}).join(" ");

// Where each star sits (center x, y and radius) inside the 40x40 badge, by how many there are:
// one big star, a staggered pair, or three in a triforce triangle.
const LAYOUT: Record<1 | 2 | 3, { x: number; y: number; r: number }[]> = {
  1: [{ x: 20, y: 20.5, r: 11 }],
  2: [
    { x: 13.5, y: 22.5, r: 8 },
    { x: 26.5, y: 17.5, r: 8 },
  ],
  3: [
    { x: 20, y: 12.5, r: 7 },
    { x: 13.5, y: 25.5, r: 7 },
    { x: 26.5, y: 25.5, r: 7 },
  ],
};

// 1-3 stars packed into a small circle, so a result reads at a glance without a row of icons.
export function Stars({ count, className }: { count: 1 | 2 | 3; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label={`${count} ${count === 1 ? "star" : "stars"}`}
      className={clsx("w-10 h-10 shrink-0", className)}
    >
      <circle cx="20" cy="20" r="18.5" className="fill-accent-soft stroke-accent/40" strokeWidth="1" />
      {LAYOUT[count].map((s, i) => (
        <polygon
          key={i}
          points={STAR}
          transform={`translate(${s.x} ${s.y}) scale(${s.r})`}
          className="fill-accent stroke-accent"
          strokeWidth={0.08}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
