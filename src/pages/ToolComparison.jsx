import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchToolsData } from "../services/apiService";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Search,
  Plus,
  X,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  TrendingUp,
  Star,
  Activity,
  ChevronRight,
  Database
} from "lucide-react";

export default function ToolComparison() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedTools, setSelectedTools] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get tool IDs from URL params
  useEffect(() => {
    if (!authLoading && (!user || user.email === 'guest@web3central.internal')) {
      navigate('/login', { state: { returnTo: `/compare?${searchParams.toString()}` } });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchToolsData();

        // Data is categorized: { category1: [tools], category2: [tools] }
        const allTools = Object.values(data).filter(val => Array.isArray(val)).flat();

        const toolIds = searchParams.get("tools")?.split(",") || [];

        // Find tools by ID (handling both 'id' and '_id')
        const tools = toolIds
          .map(idStr => allTools.find(tool => String(tool.id) === String(idStr) || String(tool._id) === String(idStr)))
          .filter(Boolean);

        setSelectedTools(tools);
        setAvailableTools(allTools.filter(tool => !tools.some(t => (t.id || t._id) === (tool.id || tool._id))));
      } catch (err) {
        console.error("Error fetching tools:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.email !== 'guest@web3central.internal') {
      fetchData();
    }
  }, [searchParams, user, authLoading, navigate]);

  // Add a tool to comparison
  const addToComparison = (tool) => {
    const toolId = tool.id || tool._id;
    if (selectedTools.length < 4 && !selectedTools.some(t => (t.id || t._id) === toolId)) {
      const newTools = [...selectedTools, tool];
      setSelectedTools(newTools);
      setAvailableTools(availableTools.filter(t => (t.id || t._id) !== toolId));

      // Update URL
      const toolIds = newTools.map(t => t.id || t._id).join(",");
      window.history.replaceState(null, "", `?tools=${toolIds}`);
    }
  };

  // Remove a tool from comparison
  const removeFromComparison = (toolIdToRemove) => {
    const toolToRemove = selectedTools.find(t => (t.id || t._id) === toolIdToRemove);
    if (toolToRemove) {
      const newTools = selectedTools.filter(t => (t.id || t._id) !== toolIdToRemove);
      setSelectedTools(newTools);
      setAvailableTools([...availableTools, toolToRemove]);

      // Update URL
      const toolIds = newTools.map(t => t.id || t._id).join(",");
      window.history.replaceState(null, "", newTools.length > 0 ? `?tools=${toolIds}` : "");
    }
  };

  const formatValue = (criterion, value) => {
    if (value === undefined || value === null) return <span className="text-gray-300">N/A</span>;

    if (criterion.type === "boolean") {
      return value ? (
        <div className="flex items-center justify-center text-green-500 bg-green-50 w-8 h-8 rounded-lg mx-auto border border-green-100 italic">
          <ShieldCheck size={16} />
        </div>
      ) : (
        <div className="flex items-center justify-center text-gray-300 bg-gray-50 w-8 h-8 rounded-lg mx-auto border border-gray-100">
          <X size={16} />
        </div>
      );
    }

    if (criterion.type === "array") {
      return (
        <div className="flex flex-wrap justify-center gap-1">
          {value?.slice(0, 2).map((tag, i) => (
            <span key={i} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
              {tag}
            </span>
          ))}
        </div>
      );
    }

    if (criterion.type === "currency") {
      return (
        <div className="flex flex-col items-center">
          <span className="text-gray-900 font-black text-lg">
            ${new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)}
          </span>
        </div>
      );
    }

    if (criterion.type === "number") {
      return (
        <div className="flex items-center justify-center gap-1 font-black text-gray-900">
          {value} <Star size={12} className="text-yellow-400 fill-yellow-400" />
        </div>
      )
    }

    return <span className="text-gray-600 font-medium">{value}</span>;
  };

  const criteria = [
    { key: "metrics.tvl", label: "Liquidity (TVL)", icon: <Activity size={16} />, type: "currency" },
    { key: "metrics.mcap", label: "Market Cap", icon: <Database size={16} />, type: "currency" },
    { key: "rating", label: "User Trust", icon: <Star size={16} />, type: "number" },
    { key: "monthlyUsers", label: "Monthly Growth", icon: <TrendingUp size={16} />, type: "string" },
    { key: "verified", label: "Vetted Status", icon: <ShieldCheck size={16} />, type: "boolean" },
    { key: "tags", label: "Focus Areas", icon: <Layers size={16} />, type: "array" }
  ];

  return (
    <div className="bg-white min-h-screen text-gray-900 pt-32 pb-32 px-6 relative overflow-x-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-24 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 tracking-wider uppercase mb-8"
          >
            <BarChart3 size={14} /> Analytical Intelligence
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-gray-900 leading-none"
          >
            Protocol <span className="text-indigo-600">Comparison</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg md:text-xl max-w-3xl font-medium leading-relaxed"
          >
            Side-by-side technical evaluation of institutional-grade protocols.
            Analyze liquidity, security parameters, and growth metrics in real-time.
          </motion.p>
        </div>

        {/* Comparison Dashboard */}
        <div className="mb-32">
          {selectedTools.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 rounded-[3rem] p-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-white rounded-[2rem] border border-gray-100 flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-sm">
                <Plus size={40} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Analytical Bench Empty</h2>
              <p className="text-gray-500 font-medium max-w-sm mx-auto mb-10">Select up to 4 protocols from the directory below to begin technical analysis.</p>
              <a href="#available-assets" className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200">
                Explore Directory <ChevronRight size={16} />
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Top Bar with Clear Actions */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 italic">Active Analysis ({selectedTools.length}/4)</h2>
                  <div className="h-1 w-20 bg-indigo-100 rounded-full" />
                </div>
                <button
                  onClick={() => {
                    setSelectedTools([]);
                    window.history.replaceState(null, "", "?");
                    setAvailableTools([...availableTools, ...selectedTools]);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  Flush Bench
                </button>
              </div>

              {/* Main Table Structure (Responsive Grid) */}
              <div className="bg-white border border-gray-100 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-8 md:p-12 text-left bg-gray-50/50 border-b border-gray-100">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Parameter</span>
                        </th>
                        {selectedTools.map(tool => (
                          <th key={tool.id} className="p-8 md:p-12 border-b border-gray-100 min-w-[240px]">
                            <div className="flex flex-col items-center group">
                              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-black mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                {tool.name.charAt(0)}
                              </div>
                              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{tool.name}</h3>
                              <button
                                onClick={() => removeFromComparison(tool.id)}
                                className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
                              >
                                <X size={12} /> Remove
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((criterion, idx) => (
                        <tr key={criterion.key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                          <td className="p-8 md:p-10 border-b border-gray-50">
                            <div className="flex items-center gap-4">
                              <div className="text-indigo-600 opacity-60">
                                {criterion.icon}
                              </div>
                              <span className="font-bold text-gray-900 text-sm tracking-tight">{criterion.label}</span>
                            </div>
                          </td>
                          {selectedTools.map(tool => {
                            let value;
                            if (criterion.key.includes(".")) {
                              const keys = criterion.key.split(".");
                              value = tool[keys[0]]?.[keys[1]];
                            } else {
                              value = tool[criterion.key];
                            }
                            return (
                              <td key={`${tool.id}-${criterion.key}`} className="p-8 md:p-10 text-center border-b border-gray-50">
                                {formatValue(criterion, value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {/* Description Row (Institutional Summary) */}
                      <tr>
                        <td className="p-8 md:p-10 bg-gray-50/20">
                          <span className="font-bold text-gray-900 text-sm tracking-tight">Protocol Intent</span>
                        </td>
                        {selectedTools.map(tool => (
                          <td key={`${tool.id}-desc`} className="p-8 md:p-10 border-b border-gray-50 bg-gray-50/10">
                            <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3 italic">
                              "{tool.description}"
                            </p>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Directory Section */}
        <section id="available-assets" className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-4 leading-none italic uppercase">Available <span className="text-indigo-600">Assets</span></h2>
              <p className="text-gray-500 font-medium">Inject high-liquidity protocols into the engine for comparative evaluation.</p>
            </div>
            <Link to="/apps" className="px-6 py-3 rounded-xl border border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all flex items-center gap-2">
              All Protocols <Globe size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableTools.filter(t => !selectedTools.some(s => s.id === t.id)).slice(0, 9).map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1, duration: 0.6 }}
                className="group"
              >
                <div
                  className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.06)] hover:border-indigo-100 transition-all duration-500 cursor-pointer flex flex-col h-full relative overflow-hidden"
                  onClick={() => addToComparison(tool)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[60px] translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 transition-all duration-500" />

                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl font-black text-indigo-600 group-hover:scale-110 shadow-sm transition-transform">
                      {tool.name.charAt(0)}
                    </div>
                    {tool.verified && (
                      <div className="px-3 py-1 bg-green-50 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">
                        Vetted
                      </div>
                    )}
                  </div>

                  <div className="flex-grow relative z-10">
                    <h3 className="text-2xl font-black mb-3 tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
                    <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-1.5 opacity-60">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{tool.rating || "NEW"}</span>
                    </div>
                    <button
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToComparison(tool);
                      }}
                    >
                      Sync to Bench <Zap size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="text-center pt-20">
          <Link
            to="/"
            className="group inline-flex items-center gap-4 text-[10px] font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-[0.3em]"
          >
            <div className="w-12 h-12 rounded-full border border-gray-100 bg-white flex items-center justify-center group-hover:border-indigo-200 group-hover:shadow-md transition-all">
              <ArrowLeft size={16} />
            </div>
            Universal Entry Point
          </Link>
        </div>
      </div>
    </div>
  );
}
