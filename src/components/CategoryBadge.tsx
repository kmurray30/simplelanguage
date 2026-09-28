import { categoryLabel } from "@/lib/categories";

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-muted text-foreground-muted whitespace-nowrap">
      {categoryLabel(category)}
    </span>
  );
}
