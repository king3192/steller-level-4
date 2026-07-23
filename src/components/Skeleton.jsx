import React from 'react';

export function Skeleton({ className = '', height = 'h-4', width = 'w-full', rounded = 'rounded-lg' }) {
  return (
    <div
      className={`bg-slate-800/60 animate-pulse ${height} ${width} ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width="w-1/3" height="h-5" />
          <Skeleton width="w-16" height="h-6" rounded="rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-950/50 p-3 rounded-xl space-y-2">
            <Skeleton width="w-1/2" height="h-3" />
            <Skeleton width="w-3/4" height="h-6" />
          </div>
          <div className="bg-slate-950/50 p-3 rounded-xl space-y-2">
            <Skeleton width="w-1/2" height="h-3" />
            <Skeleton width="w-3/4" height="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
      <Skeleton width="w-36" height="h-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/40">
          <div className="space-y-1.5 w-2/3">
            <Skeleton width="w-full" height="h-3.5" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
          <Skeleton width="w-16" height="h-5" rounded="rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
