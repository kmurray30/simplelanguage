import { categoryLabel } from "@/lib/categories";

export function CategoryBadge({ categories }: { categories: string[] }) {
  return (
    <>
      {categories.map((category) => (
        <span
          key={category}
          className="text-[11px] px-2 py-0.5 rounded-full bg-surface-muted text-foreground-muted whitespace-nowrap"
        >
          {categoryLabel(category)}
        </span>
      ))}
    </>
  );
}
