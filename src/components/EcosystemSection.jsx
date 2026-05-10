import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Globe, TrendingUp, Users, Zap, ShieldCheck, ChevronRight } from 'lucide-react';

const ECOSYSTEMS = [
  {
    id: 'solana',
    name: 'Solana',
    tagline: 'High-performance blockchain for mass adoption',
    color: 'from-purple-600 to-emerald-500',
    icon: Globe,
    apps: [
      { id: 'jupiter', name: 'Jupiter', category: 'DEX', description: 'The best swap aggregator on Solana.', logo: 'https://jup.ag/favicon.ico', stats: { label: 'Vol 24h', value: '$1.2B' } },
      { id: 'phantom', name: 'Phantom', category: 'Wallet', description: 'The friendly crypto wallet for Solana.', logo: 'https://phantom.app/favicon.ico', stats: { label: 'Users', value: '3M+' } },
      { id: 'marginfi', name: 'Marginfi', category: 'Lending', description: 'Decentralized lending protocol on Solana.', logo: 'https://marginfi.com/favicon.ico', stats: { label: 'TVL', value: '$450M' } },
    ]
  },
  {
    id: 'base',
    name: 'Base',
    tagline: 'A secure, low-cost, builder-friendly L2 by Coinbase',
    color: 'from-blue-600 to-indigo-600',
    icon: Zap,
    apps: [
      { id: 'aerodrome', name: 'Aerodrome', category: 'DEX', description: 'Central trading and liquidity hub on Base.', logo: 'https://aerodrome.finance/favicon.ico', stats: { label: 'TVL', value: '$150M' } },
      { id: 'basepaint', name: 'Base Paint', category: 'NFT', description: 'Collaborative pixel art on Base.', logo: 'https://basepaint.xyz/favicon.ico', stats: { label: 'Mints', value: '45K' } },
      { id: 'farcaster', name: 'Farcaster', category: 'Social', description: 'Sufficiently decentralized social network.', logo: 'https://farcaster.xyz/favicon.ico', stats: { label: 'Users', value: '180K' } },
    ]
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    tagline: 'Scaling Ethereum with optimistic rollups',
    color: 'from-blue-400 to-blue-700',
    icon: ShieldCheck,
    apps: [
      { id: 'gmx', name: 'GMX', category: 'Perps', description: 'Decentralized perpetual exchange on Arbitrum.', logo: 'https://gmx.io/favicon.ico', stats: { label: 'TVL', value: '$600M' } },
      { id: 'radiant', name: 'Radiant', category: 'Lending', description: 'Omnichain money market protocol.', logo: 'https://radiant.capital/favicon.ico', stats: { label: 'TVL', value: '$320M' } },
      { id: 'treasure', name: 'Treasure', category: 'Gaming', description: 'The decentralized gaming ecosystem.', logo: 'https://treasure.lol/favicon.ico', stats: { label: 'Players', value: '250K' } },
    ]
  }
];

export default function EcosystemSection() {
  const [activeTab, setActiveTab] = useState('solana');
  const currentEcosystem = ECOSYSTEMS.find(e => e.id === activeTab);

  return (
    <section className="py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Ecosystem Spotlight</h2>
            <div className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-purple-100">
              Live Data
            </div>
          </div>
          <p className="text-xs text-gray-400">Deep dive into the top protocols on leading networks</p>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {ECOSYSTEMS.map(eco => (
            <button
              key={eco.id}
              onClick={() => setActiveTab(eco.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === eco.id 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {eco.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`relative rounded-[2.5rem] p-8 overflow-hidden bg-gradient-to-br ${currentEcosystem.color} text-white shadow-2xl`}
        >
          {/* Background pattern */}
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <currentEcosystem.icon size={120} />
          </div>

          <div className="relative z-10">
            <div className="mb-8">
              <h3 className="text-3xl font-black mb-2">{currentEcosystem.name} Ecosystem</h3>
              <p className="text-white/80 font-medium max-w-xl">{currentEcosystem.tagline}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentEcosystem.apps.map((app, idx) => (
                <div key={app.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 group hover:bg-white/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white p-2 shrink-0">
                      <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base leading-tight">{app.name}</h4>
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{app.category}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-white/70 line-clamp-2 mb-4 h-8">
                    {app.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{app.stats.label}</p>
                      <p className="text-sm font-black">{app.stats.value}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white text-white group-hover:text-gray-900 transition-all">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-8 flex items-center gap-2 text-sm font-black hover:gap-3 transition-all">
              Explore {currentEcosystem.name} Directory <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
