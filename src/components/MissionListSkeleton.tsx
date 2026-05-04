export function MissionListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="divide-y divide-slate-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-3 w-48 rounded bg-slate-100" />
              </div>
              <div className="h-8 w-20 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
