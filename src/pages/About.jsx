import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 
                 hover:shadow-[0_0_18px_rgba(99,102,241,0.35)] 
                 hover:border-indigo-500/40 transition-all duration-300 cursor-pointer 
                 backdrop-blur-xl"
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg sm:text-xl font-semibold text-indigo-300">
          {question}
        </h3>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FiChevronDown className="text-gray-400 text-xl" />
        </motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="text-gray-400 mt-3 text-sm sm:text-base leading-relaxed"
          >
            {answer}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function About() {
  return (
    <div className="relative min-h-screen pt-32 pb-32 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="glow-overlay w-[600px] h-[600px] bg-indigo-500/10 top-[-10%] left-[-10%]" />
      <div className="glow-overlay w-[500px] h-[500px] bg-purple-500/10 bottom-[-10%] right-[-10%]" />

      {/* --- Header Section --- */}
      <div className="max-w-7xl mx-auto relative z-10 text-center mb-32">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-indigo-400 tracking-[0.2em] uppercase mb-10"
        >
          Our Narrative
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-8xl font-black mb-10 tracking-tighter"
        >
          Mastering the <br /><span className="text-gradient">On-Chain Era</span>
        </motion.h1>
        <p className="text-gray-400 text-lg md:text-2xl max-w-4xl mx-auto font-medium leading-relaxed">
          web3central is a research-driven gateway designed for the next wave of on-chain pioneers.
          We bridge the gap between complex protocols and actionable intelligence.
        </p>
      </div>

      {/* --- Hero Values (Grid) --- */}
      <section className="max-w-7xl mx-auto mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="hi-fi-card p-16 flex flex-col justify-center" style={{ "--card-glow": "rgba(99, 102, 241, 0.2)" }}>
            <h2 className="text-4xl font-black mb-10 tracking-tighter italic uppercase">The Mission</h2>
            <p className="text-gray-400 text-lg font-medium leading-relaxed mb-8">
              Our objective is simple: to neutralize the noise of the crypto space and provide institutional-grade clarity.
            </p>
            <p className="text-gray-400 text-lg font-medium leading-relaxed">
              We vet protocols based on security, liquidity, and long-term utility, ensuring you navigate the frontier with confidence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {[
              { title: "Verifiable", icon: "🔍" },
              { title: "Liquid", icon: "💧" },
              { title: "Autonomous", icon: "⚙️" },
              { title: "Community", icon: "👥" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="hi-fi-card p-8 flex flex-col items-center text-center justify-center bg-white/[0.01]"
              >
                <span className="text-4xl mb-4">{stat.icon}</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">{stat.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Core Philosophy --- */}
      <section className="max-w-7xl mx-auto mb-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Platform Philosophy</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { title: "Transparency", desc: "Every protocol listed undergoes a rigorous analysis of trust and governance.", icon: "🛡️" },
            { title: "Empowerment", desc: "We provide the tools, you provide the vision. Full autonomy in your learning.", icon: "⚡" },
            { title: "Sustainability", desc: "Prioritizing ecosystems that value long-term health over short-term hype.", icon: "🌱" },
          ].map((value, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="hi-fi-card p-10 group"
              style={{ "--card-glow": "rgba(168, 85, 247, 0.1)" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-8 border border-white/5 group-hover:border-indigo-500/30 transition-all">
                {value.icon}
              </div>
              <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter italic">{value.title}</h3>
              <p className="text-gray-500 text-base font-medium leading-relaxed">
                {value.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black tracking-tighter uppercase">Intelligence FAQ</h2>
        </div>

        <div className="space-y-6">
          {[
            { q: "What is web3central?", a: "A research hub and dApp directory focused on high-utility decentralized protocols." },
            { q: "How are protocols vetted?", a: "We analyze code audits, liquidity metrics, and developer activity before any listing." },
            { q: "Is the Academy free?", a: "The core curriculum is 100% free. We believe education is a fundamental human right in the digital age." },
            { q: "Can I partner with you?", a: "We are always looking for institutional partners and developers pushing the frontier." },
          ].map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
