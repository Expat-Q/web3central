import React from 'react';

/* ── Single shimmer block ── */
export function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`bg-gray-200 rounded-xl animate-pulse ${className}`}
    />
  );
}

/* ── Full-page loader (replaces the centered spinner) ── */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 pt-20 pb-16 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>
      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ── Card skeleton (tool / lesson cards) ── */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-5/6" />
      <SkeletonBlock className="h-8 w-24 rounded-full mt-2" />
    </div>
  );
}

/* ── Feed / post skeleton (community feed, lesson list) ── */
export function FeedSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4">
          <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Lesson detail skeleton ── */
export function LessonSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-24 space-y-6">
      <SkeletonBlock className="h-4 w-24 mb-6" />
      <div className="flex items-start gap-3">
        <SkeletonBlock className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-40" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>
      <SkeletonBlock className="h-9 w-3/4" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className={`h-4 ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

/* ── Profile skeleton ── */
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white px-4 pt-20 pb-16 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-5">
        <SkeletonBlock className="w-20 h-20 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-4 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <SkeletonBlock className="h-40 rounded-2xl" />
    </div>
  );
}
