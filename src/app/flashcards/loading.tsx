import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-md w-full px-4 py-8 flex flex-col items-center gap-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}
