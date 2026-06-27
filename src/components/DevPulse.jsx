import React from 'react';
import { motion } from 'framer-motion';
import { GitCommit, Github, Activity, Info } from 'lucide-react';

const DevPulse = ({ githubRepo, githubCommits }) => {
  const count = githubCommits?.count30d || 0;
  const lastUpdated = githubCommits?.lastUpdated;

  // Determine health level
  let level = 'inactive';
  let levelColor = 'text-rose-600 bg-rose-50 border-rose-100';
  let levelText = 'Inactive / Stale';
  let levelBadgeColor = 'bg-rose-500 shadow-rose-500/50';
  let waveSpeed = 8; // slow
  let waveAmplitude = 5;

  if (count > 15) {
    level = 'active';
    levelColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
    levelText = 'Highly Active';
    levelBadgeColor = 'bg-emerald-500 shadow-emerald-500/50';
    waveSpeed = 2.5; // fast pulse
    waveAmplitude = 12;
  } else if (count >= 5) {
    level = 'moderate';
    levelColor = 'text-amber-600 bg-amber-50 border-amber-100';
    levelText = 'Moderate Activity';
    levelBadgeColor = 'bg-amber-500 shadow-amber-500/50';
    waveSpeed = 4.5; // medium
    waveAmplitude = 8;
  }

  // Format date
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  // GitHub URL
  const githubUrl = githubRepo.startsWith('http') ? githubRepo : `https://github.com/${githubRepo}`;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
      {/* Premium background wave / heartbeat micro-animation */}
      <div className="absolute inset-x-0 bottom-0 h-12 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
          <motion.path
            d="M0 10 Q25 15 50 10 T100 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={
              level === 'active' ? 'text-emerald-500' :
              level === 'moderate' ? 'text-amber-500' : 'text-rose-500'
            }
            animate={{
              d: [
                `M0 10 Q25 ${10 - waveAmplitude} 50 10 T100 10`,
                `M0 10 Q25 ${10 + waveAmplitude} 50 10 T100 10`,
                `M0 10 Q25 ${10 - waveAmplitude} 50 10 T100 10`,
              ]
            }}
            transition={{
              duration: waveSpeed,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className={
            level === 'active' ? 'text-emerald-500' :
            level === 'moderate' ? 'text-amber-500' : 'text-rose-500'
          } />
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none">Developer Pulse</h4>
        </div>
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-purple-600 transition-colors shrink-0"
        >
          <Github size={13} />
          <span className="truncate max-w-[120px] font-semibold">{githubRepo.replace(/^https?:\/\/github\.com\//, '')}</span>
        </a>
      </div>

      {/* Core gauge layout */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Glowing radial pulse indicator */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex flex-col items-center justify-center bg-white border border-gray-100 shadow-sm z-10">
            <GitCommit size={20} className={
              level === 'active' ? 'text-emerald-500' :
              level === 'moderate' ? 'text-amber-500' : 'text-rose-500'
            } />
          </div>
          {/* Animated pulse shadow ring */}
          <motion.div
            className={`absolute inset-0 rounded-full ${levelBadgeColor} opacity-20`}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: waveSpeed / 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Level metrics details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900 tracking-tight">{count}</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">commits / 30d</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${levelColor} uppercase tracking-widest`}>
              {levelText}
            </span>
          </div>
        </div>
      </div>

      {/* 3-tier progress level gauge */}
      <div className="mt-4 grid grid-cols-3 gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100 relative z-10">
        <div className={`h-full ${count >= 1 ? 'bg-rose-500' : 'bg-gray-200'}`} />
        <div className={`h-full ${count >= 5 ? 'bg-amber-500' : 'bg-gray-200'}`} />
        <div className={`h-full ${count >= 15 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
      </div>

      {/* Footer / Last synced */}
      <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
        <Info size={10} className="shrink-0" />
        <span className="truncate">Synced: {formattedDate}</span>
      </div>
    </div>
  );
};

export default DevPulse;
