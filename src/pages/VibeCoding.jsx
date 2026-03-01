import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchToolsByCategory } from "../services/apiService";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function VibeCoding() {
  const [vibeCodingTools, setVibeCodingTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchToolsByCategory('vibeCoding');
        setVibeCodingTools(data || []);
      } catch (err) {
        console.error("Error fetching vibe coding tools:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#233d4d]">
        <div className="w-12 h-12 border-4 border-[#fe7f2d]/20 border-t-[#fe7f2d] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-32 pb-32 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="glow-overlay w-[600px] h-[600px] bg-purple-500/10 top-[-10%] left-[-10%]" />
      <div className="glow-overlay w-[500px] h-[500px] bg-pink-500/10 bottom-[-10%] right-[-10%]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-pink-400 tracking-[0.2em] uppercase mb-10"
          >
            Community Lab
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-8xl font-black mb-10 tracking-tighter"
          >
            Vibe <span className="text-gradient hover:bg-gradient-to-l transition-all duration-1000">Coding</span>
          </motion.h1>
          <p className="text-gray-400 text-lg md:text-2xl max-w-4xl mx-auto font-medium leading-relaxed">
            Where creativity meets the blockchain. Explore experimental tools, fun prototypes,
            and community-driven artifacts.
          </p>
        </div>

        {/* Tools Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-32"
        >
          {vibeCodingTools.length > 0 ? (
            vibeCodingTools.map((tool) => (
              <motion.div
                key={tool.id}
                variants={item}
                whileHover={{ y: -10 }}
                className="hi-fi-card p-10 group"
                style={{ "--card-glow": "rgba(168, 85, 247, 0.15)" }}
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase group-hover:text-pink-400 transition-colors">{tool.name}</h3>
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-2">@{tool.builder.handle || "community_dev"}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20">
                    {tool.name.charAt(0)}
                  </div>
                </div>

                <p className="text-gray-500 text-base font-medium mb-10 leading-relaxed line-clamp-3">{tool.description}</p>

                <div className="flex flex-wrap gap-2 mb-10">
                  {tool.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-tighter rounded-lg text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full animate-pulse ${tool.status === "active" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-yellow-500"}`} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tool.status}</span>
                  </div>

                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-pink-600/20 hover:scale-105 transition-all"
                  >
                    Enter App
                  </a>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="hi-fi-card p-24 text-center">
                <div className="text-6xl mb-8 animate-bounce">🎨</div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Laboratory Empty</h3>
                <p className="text-gray-500 font-medium mb-12 max-w-md mx-auto">
                  The community haven't deployed any prototypes in this sector yet.
                  Be the architect of the first Vibe project.
                </p>
                <Link
                  to="/submit-tool"
                  className="btn-primary px-12 py-4"
                >
                  Submit Prototype
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Call to Action */}
        <section className="max-w-5xl mx-auto">
          <div className="hi-fi-card p-16 text-center relative overflow-hidden" style={{ "--card-glow": "rgba(244, 114, 182, 0.2)" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-pink-500/5" />
            <h2 className="text-4xl font-black mb-8 tracking-tighter italic uppercase">Expand the Collective</h2>
            <p className="text-gray-400 text-lg font-medium mb-12 max-w-2xl mx-auto">
              Built a fun Web3 experiment? Deploy your vision here and share it with thousands
              of on-chain explorers.
            </p>
            <Link
              to="/submit-tool"
              className="btn-secondary px-12 py-4 border-pink-500/20 text-pink-400 hover:bg-pink-500/5"
            >
              Partner with the Vibe
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}