import React from 'react';
import { useMetrics } from '../context/MetricsContext';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHAINS = [
  'All', 'Ethereum', 'Solana', 'Arbitrum', 'Base', 'Polygon', 'Optimism', 'Avalanche', 'Sui', 'Aptos', 'Cosmos', 'Bitcoin'
];

export default function ChainFilter() {
  const { selectedChain, setSelectedChain } = useMetrics();
  const [isOpen, setIsOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const handleSelect = (chain) => {
    setSelectedChain(chain);
    setIsOpen(false);
    
    // Show toast notification
    setToast(chain === 'All' ? 'Showing all networks' : `Switched to ${chain}`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all group ${
            selectedChain !== 'All' 
              ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' 
              : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
          }`}
        >
          <Layers size={14} className={selectedChain !== 'All' ? 'text-purple-600' : 'text-purple-600'} />
          <span className={`text-xs font-bold ${selectedChain !== 'All' ? 'text-purple-700' : 'text-gray-700'}`}>
            {selectedChain}
          </span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[61] py-1"
              >
                <div className="px-3 py-2 border-b border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Network</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain}
                      onClick={() => handleSelect(chain)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between
                        ${selectedChain === chain ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                      `}
                    >
                      {chain}
                      {selectedChain === chain && <Check size={14} className="text-purple-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
          >
            <Layers size={16} className="text-purple-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
