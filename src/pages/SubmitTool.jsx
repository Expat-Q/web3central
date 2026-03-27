import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CardSkeleton } from "../components/Skeleton";
import {
  PlusCircle, Globe, Tag, User, FileText, CheckCircle,
  XCircle, ArrowLeft, ChevronDown, Rocket, GitBranch, Link2, ShieldCheck
} from "lucide-react";

const CHAINS = [
  "Ethereum", "Base", "Solana", "Polygon", "Arbitrum", "Optimism",
  "Avalanche", "BNB Chain", "Sui", "Aptos", "Other"
];

const CATEGORIES = [
  { id: "dex", name: "Decentralized Exchange (DEX)" },
  { id: "interoperability", name: "Bridges & Interoperability" },
  { id: "onchainAutonomy", name: "Onchain Automation" },
  { id: "bountyHub", name: "Bounty / Grants" },
  { id: "communityTools", name: "Community Tools" },
  { id: "researchFiles", name: "Research & Analytics" },
  { id: "defi", name: "DeFi (Lending / Yield)" },
  { id: "nft", name: "NFT" },
  { id: "gaming", name: "Gaming / GameFi" },
  { id: "wallets", name: "Wallets" },
  { id: "security", name: "Security" },
  { id: "other", name: "Other" },
];

const CRITERIA = [
  "Live, real product with verifiable onchain activity",
  "Active community or social presence",
  "No rugs, honeypots, or abandoned projects",
];

export default function ListDapp() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (!authLoading && (!user || user.email === 'guest@web3central.internal')) {
      navigate('/login', { state: { returnTo: '/submit-tool' } });
    }
  }, [user, authLoading, navigate]);

  const [formData, setFormData] = useState({
    name: "", link: "", category: "dex", chain: "Ethereum",
    builderHandle: "", description: "", auditLink: ""
  });
  const [status, setStatus] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const token = localStorage.getItem('token');
      const API = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api' : '/api';
      const res = await fetch(`${API}/tools/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setFormData({ name: "", link: "", category: "dex", chain: "Ethereum", builderHandle: "", description: "", auditLink: "" });
    } catch (err) {
      setStatus("error");
    }
  };

  if (authLoading || !user || user.email === 'guest@web3central.internal') {
    return (
      <div className="min-h-screen bg-white pt-28 px-6 max-w-2xl mx-auto space-y-4">
        <CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  const inputCls = "w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 outline-none focus:border-purple-500 focus:bg-white transition-all placeholder:text-gray-300 shadow-sm text-sm";
  const labelCls = "text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2";

  return (
    <div className="relative min-h-screen pt-20 pb-24 px-6 bg-white overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-gray-900">
            List Your <span className="text-purple-600">Dapp</span>
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Get your protocol in front of Web3Central's growing community of builders and researchers.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShieldCheck size={13} className="text-purple-500" /> Listing Criteria
          </p>
          <ul className="space-y-2">
            {CRITERIA.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500 font-bold">✓</span> {c}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white border border-gray-100 p-8 md:p-12 rounded-[2rem] shadow-sm mb-10"
        >
          {status === "success" ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-green-50 text-green-500 mb-6 border border-green-100">
                <CheckCircle size={40} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
                Our curators will review your dapp and get back to you within 24–48 hours.
              </p>
              <button onClick={() => setStatus("")}
                className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-purple-600 transition-all">
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}><PlusCircle className="w-3 h-3 text-purple-500" /> Dapp Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    className={inputCls} placeholder="e.g. Uniswap, Aave" />
                </div>
                <div>
                  <label className={labelCls}><Globe className="w-3 h-3 text-purple-500" /> Website URL *</label>
                  <input type="url" name="link" value={formData.link} onChange={handleChange} required
                    className={inputCls} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}><Tag className="w-3 h-3 text-purple-500" /> Category *</label>
                  <div className="relative">
                    <button type="button" onClick={() => setCatOpen(!catOpen)}
                      className={`${inputCls} flex items-center justify-between cursor-pointer`}>
                      {CATEGORIES.find(c => c.id === formData.category)?.name || 'Select'}
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {catOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 max-h-56 overflow-y-auto">
                          {CATEGORIES.map(cat => (
                            <button key={cat.id} type="button"
                              onClick={() => { setFormData(p => ({ ...p, category: cat.id })); setCatOpen(false); }}
                              className={`w-full text-left px-5 py-3 text-sm transition-colors ${formData.category === cat.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}><GitBranch className="w-3 h-3 text-purple-500" /> Chain / Network *</label>
                  <div className="relative">
                    <button type="button" onClick={() => setChainOpen(!chainOpen)}
                      className={`${inputCls} flex items-center justify-between cursor-pointer`}>
                      {formData.chain}
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${chainOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {chainOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setChainOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 max-h-56 overflow-y-auto">
                          {CHAINS.map(chain => (
                            <button key={chain} type="button"
                              onClick={() => { setFormData(p => ({ ...p, chain })); setChainOpen(false); }}
                              className={`w-full text-left px-5 py-3 text-sm transition-colors ${formData.chain === chain ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                              {chain}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}><User className="w-3 h-3 text-purple-500" /> Your Handle (@username) *</label>
                  <input type="text" name="builderHandle" value={formData.builderHandle} onChange={handleChange} required
                    className={inputCls} placeholder="@yourhandle" />
                </div>
                <div>
                  <label className={labelCls}><Link2 className="w-3 h-3 text-purple-500" /> GitHub / Audit Link <span className="text-gray-300 font-normal">(optional)</span></label>
                  <input type="url" name="auditLink" value={formData.auditLink} onChange={handleChange}
                    className={inputCls} placeholder="https://github.com/..." />
                </div>
              </div>

              <div>
                <label className={labelCls}><FileText className="w-3 h-3 text-purple-500" /> Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={4}
                  className={`${inputCls} leading-relaxed`}
                  placeholder="What does your dapp do? What problem does it solve?" />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={status === "sending"}
                  className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-purple-600 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 group disabled:opacity-50">
                  <Rocket className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  {status === "sending" ? "Submitting..." : "Submit Listing"}
                </button>
                {status === "error" && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
                    <XCircle size={16} /> Connection error. Please try again.
                  </div>
                )}
              </div>
            </form>
          )}
        </motion.div>

        <div className="text-center">
          <Link to="/" className="group inline-flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-purple-600 transition-all">
            <div className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50 transition-all">
              <ArrowLeft size={16} />
            </div>
            Back to Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
