import React from 'react';
import { ExternalLink, Gem, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const BAGS_APPS = [
  { id: 'bags-1', name: 'Bags App', category: 'Social', description: 'Solana-native reputation and crowdfunding platform.', url: 'https://bags.fm', logo: 'https://bags.fm/favicon.ico', price: '0.42 SOL', trend: '+12%', holders: '12.4K' },
  { id: 'bags-2', name: 'SolChat', category: 'Communication', description: 'Web3 messaging protocol on Solana with Bags integration.', url: 'https://solchat.io', logo: 'https://solchat.io/favicon.ico', price: '0.15 SOL', trend: '+5.2%', holders: '8.1K' },
  { id: 'bags-3', name: 'Flash.Trade', category: 'Trading', description: 'Asset-backed perpetual trading on Solana.', url: 'https://flash.trade', logo: 'https://flash.trade/favicon.ico', price: '0.88 SOL', trend: '+22.4%', holders: '15.9K' },
];

export default function BagsSection() {
  return (
    <section className="my-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Gem size={18} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Bags Ecosystem</h2>
          </div>
          <p className="text-xs text-gray-400 pl-[34px]">Discover the next generation of Solana-native reputation apps</p>
        </div>
        <a href="https://bags.fm" target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 transition-colors">
          View all on Bags <ExternalLink size={12} />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BAGS_APPS.map((app, idx) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-6 text-white overflow-hidden shadow-xl"
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
              <Gem size={80} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/10 shrink-0">
                  <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{app.name}</h3>
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{app.category}</p>
                </div>
              </div>

              <p className="text-sm text-indigo-100/70 leading-relaxed line-clamp-2">
                {app.description}
              </p>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5">
                <div>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Key Price</p>
                  <p className="text-sm font-black">{app.price}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Growth</p>
                  <p className="text-sm font-black text-emerald-400">{app.trend}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300">
                  <Users size={12} /> {app.holders} holders
                </div>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[11px] font-black transition-all"
                >
                  Enter
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
