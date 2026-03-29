export function MissionListSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
