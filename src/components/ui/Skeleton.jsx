export function Skeleton({ className = '', rounded = 'rounded-xl' }) {
  return (
    <div
      className={`bg-surface-200 animate-pulse ${rounded} ${className}`}
    />
  );
}

export function RideCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 card-shadow space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-16" rounded="rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-3" rounded="rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" rounded="rounded-full" />
        <Skeleton className="h-6 w-16" rounded="rounded-full" />
        <Skeleton className="h-6 w-18" rounded="rounded-full" />
      </div>
      <Skeleton className="h-10 w-full" rounded="rounded-2xl" />
    </div>
  );
}
