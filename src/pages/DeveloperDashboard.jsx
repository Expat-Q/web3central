import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CardSkeleton } from "../components/Skeleton";
import ToolLogo from "../components/ToolLogo";
import {
  LayoutDashboard, Star, PlusCircle, Globe, Tag, User, FileText,
  CheckCircle, XCircle, ChevronDown, Rocket, GitBranch, Link2,
  ShieldCheck, MousePointerClick, MessageSquare, TrendingUp,
  CornerDownRight, Send, Search, AlertCircle, RefreshCw, BadgeCheck
} from "lucide-react";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const CHAINS = ["Ethereum", "Base", "Solana", "Polygon", "Arbitrum", "Optimism", "Avalanche", "BNB Chain", "Sui", "Aptos", "Other"];
const CATEGORIES = [
  { id: "trading", name: "Trading / DEX / Perps" },
  { id: "defi", name: "DeFi (Lending / Yield)" },
  { id: "bridges", name: "Bridges & Cross-chain" },
  { id: "wallets", name: "Wallets" },
  { id: "security", name: "Security" },
  { id: "analytics", name: "Analytics" },
  { id: "nft", name: "NFT" },
  { id: "gaming", name: "Gaming / GameFi" },
  { id: "community", name: "Community & DAO" },
  { id: "rwa", name: "Real World Assets (RWA)" },
  { id: "cex", name: "Centralized Exchanges (CEX)" },
  { id: "privacy", name: "Privacy" },
  { id: "predictions", name: "Prediction Markets" },
];
const SECURITY_LEVELS = [
  { id: "unaudited", label: "Unaudited", color: "text-red-600 bg-red-50 border-red-100" },
  { id: "community", label: "Community Reviewed", color: "text-yellow-700 bg-yellow-50 border-yellow-100" },
  { id: "audited", label: "Audited", color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  { id: "verified", label: "Verified", color: "text-purple-700 bg-purple-50 border-purple-100" },
];

const TABS = [
  { id: "my-apps", label: "My Apps", icon: <LayoutDashboard size={16} /> },
  { id: "reviews", label: "Reviews", icon: <MessageSquare size={16} /> },
  { id: "publish", label: "Publish New App", icon: <PlusCircle size={16} /> },
];

/* ─── Star Row ─── */
const StarRow = ({ score }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={11} className={s <= score ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
    ))}
  </div>
);

/* ─── Security badge ─── */
const SecurityBadge = ({ level }) => {
  const def = SECURITY_LEVELS.find((s) => s.id === level) || SECURITY_LEVELS[0];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${def.color}`}>
      {def.label}
    </span>
  );
};

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("my-apps");
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState(null);

  /* Publish form state */
  const [formData, setFormData] = useState({
    name: "", link: "", category: "dex", chain: "Ethereum",
    builderHandle: "", description: "", auditLink: "", securityLevel: "unaudited",
  });
  const [submitStatus, setSubmitStatus] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [chainOpen, setChainOpen] = useState(false);
  const [secOpen, setSecOpen] = useState(false);

  /* Claim state */
  const [claimId, setClaimId] = useState("");
  const [claimStatus, setClaimStatus] = useState("");

  /* Reply state */
  const [replyMap, setReplyMap] = useState({}); // { ratingId: text }
  const [replyOpenId, setReplyOpenId] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);

  /* Auth guard */
  useEffect(() => {
    if (!authLoading && (!user || user.email === "guest@web3central.internal")) {
      navigate("/login", { state: { returnTo: "/developer" } });
    }
  }, [user, authLoading, navigate]);

  /* Fetch dashboard data */
  const fetchDash = useCallback(async () => {
    if (!user) return;
    setDashLoading(true);
    setDashError(null);
    try {
      const res = await fetch(`${API}/tools/developer/dashboard`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setDashData(json);
      else throw new Error(json.error || "Failed to load dashboard");
    } catch (e) {
      setDashError(e.message);
    } finally {
      setDashLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== "publish") fetchDash();
  }, [activeTab, fetchDash]);

  /* Publish handler */
  const handlePublish = async (e) => {
    e.preventDefault();
    setSubmitStatus("sending");
    try {
      const res = await fetch(`${API}/tools/submit`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed");
      }
      setSubmitStatus("success");
      setFormData({ name: "", link: "", category: "dex", chain: "Ethereum", builderHandle: "", description: "", auditLink: "", securityLevel: "unaudited" });
    } catch (err) {
      setSubmitStatus("error-" + err.message);
    }
  };

  /* Claim handler */
  const handleClaim = async () => {
    if (!claimId.trim()) return;
    setClaimStatus("sending");
    try {
      const res = await fetch(`${API}/tools/${claimId.trim()}/claim`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) setClaimStatus("success");
      else throw new Error(json.error);
    } catch (err) {
      setClaimStatus("error-" + err.message);
    }
  };

  /* Reply handler */
  const handleReply = async (ratingId) => {
    const text = replyMap[ratingId];
    if (!text?.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch(`${API}/ratings/${ratingId}/reply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reply: text }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyOpenId(null);
        setReplyMap((p) => ({ ...p, [ratingId]: "" }));
        fetchDash();
      }
    } finally {
      setReplyLoading(false);
    }
  };

  if (authLoading || !user || user.email === "guest@web3central.internal") {
    return (
      <div className="min-h-screen bg-white pt-20 px-6 max-w-2xl mx-auto space-y-4">
        <CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  const inputCls = "w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-gray-900 outline-none focus:border-purple-500 focus:bg-white transition-all placeholder:text-gray-300 shadow-sm text-sm";
  const labelCls = "text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5";

  return (
    <div className="relative min-h-screen pt-16 pb-24 bg-white overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Developer Dashboard</h1>
              <p className="text-gray-400 text-sm">Manage, track and grow your Web3 apps.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-50 border border-gray-100 p-1.5 rounded-2xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-purple-700 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Tab: My Apps ─── */}
          {activeTab === "my-apps" && (
            <motion.div key="my-apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {dashLoading ? (
                <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
              ) : dashError ? (
                <div className="text-center py-16 text-gray-400">
                  <AlertCircle size={32} className="mx-auto mb-3 text-red-300" />
                  <p className="font-semibold">{dashError}</p>
                  <button onClick={fetchDash} className="mt-4 text-sm text-purple-600 flex items-center gap-1 mx-auto">
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
              ) : dashData?.tools?.length === 0 ? (
                <div className="text-center py-20">
                  <LayoutDashboard size={40} className="mx-auto mb-4 text-gray-200" />
                  <p className="text-gray-500 font-semibold">No apps yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Publish your first app or claim an existing one.</p>
                  <button
                    onClick={() => setActiveTab("publish")}
                    className="mt-6 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all"
                  >
                    Publish New App
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashData?.tools?.map((tool) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                          <ToolLogo tool={tool} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-gray-900 text-base">{tool.name}</h3>
                            <SecurityBadge level={tool.securityLevel} />
                            {tool.verified && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <BadgeCheck size={10} /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 capitalize mt-0.5">{tool.category}</p>
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{tool.description}</p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="mt-5 grid grid-cols-3 gap-4 pt-5 border-t border-gray-50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-purple-600 mb-1">
                            <MousePointerClick size={14} />
                            <span className="text-xl font-black text-gray-900">{(tool.clickCount || 0).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Launches</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xl font-black text-gray-900">{tool.averageRating ? tool.averageRating.toFixed(1) : "—"}</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Rating</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                            <MessageSquare size={14} />
                            <span className="text-xl font-black text-gray-900">{tool.ratingCount || 0}</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reviews</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <a href={tool.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all">
                          <Globe size={12} /> Visit App
                        </a>
                        <button onClick={() => setActiveTab("reviews")}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all">
                          <MessageSquare size={12} /> View Reviews
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Claim section */}
                  <div className="mt-8 bg-purple-50 border border-purple-100 rounded-3xl p-6">
                    <h3 className="font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Search size={16} className="text-purple-600" /> Claim an Existing App
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">Already have an app listed on Web3Central? Claim it to see its analytics here.</p>
                    <div className="flex gap-2">
                      <input
                        value={claimId}
                        onChange={(e) => setClaimId(e.target.value)}
                        placeholder="Enter app ID (e.g. uniswap)"
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        onClick={handleClaim}
                        disabled={claimStatus === "sending"}
                        className="px-5 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-50"
                      >
                        {claimStatus === "sending" ? "Sending..." : "Claim"}
                      </button>
                    </div>
                    {claimStatus === "success" && (
                      <p className="mt-3 text-sm text-emerald-700 font-semibold flex items-center gap-1.5"><CheckCircle size={14} /> Claim submitted. We'll verify within 24h.</p>
                    )}
                    {claimStatus.startsWith("error-") && (
                      <p className="mt-3 text-sm text-red-600 font-semibold flex items-center gap-1.5"><XCircle size={14} /> {claimStatus.replace("error-", "")}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Tab: Reviews ─── */}
          {activeTab === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {dashLoading ? (
                <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
              ) : !dashData?.ratings?.length ? (
                <div className="text-center py-20">
                  <MessageSquare size={40} className="mx-auto mb-4 text-gray-200" />
                  <p className="text-gray-500 font-semibold">No reviews yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Reviews from users on your apps will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashData.ratings.map((rating) => {
                    const toolName = dashData.tools?.find((t) => t.id === rating.tool)?.name || rating.tool;
                    return (
                      <motion.div key={rating._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                            {rating.user?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div>
                                <span className="font-bold text-sm text-gray-900">{rating.user?.name || "Anonymous"}</span>
                                <span className="ml-2 text-xs text-gray-400">on <span className="text-purple-600 font-semibold">{toolName}</span></span>
                              </div>
                              <StarRow score={rating.score} />
                            </div>
                            {rating.comment && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{rating.comment}</p>
                            )}
                            <p className="text-[11px] text-gray-300 mt-1">{new Date(rating.createdAt).toLocaleDateString()}</p>

                            {/* Developer reply shown if exists */}
                            {rating.developerReply && (
                              <div className="mt-3 pl-4 border-l-2 border-purple-200 bg-purple-50/50 rounded-r-xl py-2 pr-3">
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <CornerDownRight size={10} /> Developer Response
                                </p>
                                <p className="text-sm text-gray-700">{rating.developerReply}</p>
                              </div>
                            )}

                            {/* Reply button/toggle */}
                            {!rating.developerReply && (
                              <button
                                onClick={() => setReplyOpenId(replyOpenId === rating._id ? null : rating._id)}
                                className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-500 flex items-center gap-1 transition-colors"
                              >
                                <CornerDownRight size={11} /> {replyOpenId === rating._id ? "Cancel" : "Reply"}
                              </button>
                            )}

                            {/* Reply input */}
                            <AnimatePresence>
                              {replyOpenId === rating._id && !rating.developerReply && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 overflow-hidden">
                                  <textarea
                                    rows={3}
                                    value={replyMap[rating._id] || ""}
                                    onChange={(e) => setReplyMap((p) => ({ ...p, [rating._id]: e.target.value }))}
                                    placeholder="Write a reply to this review..."
                                    className={`${inputCls} resize-none`}
                                  />
                                  <button
                                    onClick={() => handleReply(rating._id)}
                                    disabled={replyLoading || !replyMap[rating._id]?.trim()}
                                    className="mt-2 flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-500 transition-all disabled:opacity-50"
                                  >
                                    <Send size={12} /> {replyLoading ? "Sending..." : "Post Reply"}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Tab: Publish New App ─── */}
          {activeTab === "publish" && (
            <motion.div key="publish" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                {submitStatus === "success" ? (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-green-50 text-green-500 mb-6 border border-green-100">
                      <CheckCircle size={40} strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Our curators will review your app and get back to you within 24–48 hours.</p>
                    <button onClick={() => setSubmitStatus("")}
                      className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-purple-600 transition-all">
                      Submit Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePublish} className="space-y-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-1">Publish a New App</h2>
                      <p className="text-sm text-gray-400">Get your dapp in front of Web3Central's growing community.</p>
                    </div>

                    {/* Listing criteria */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-purple-500" /> Listing Criteria
                      </p>
                      {["Live, real product with verifiable onchain activity", "Active community or social presence", "No rugs, honeypots, or abandoned projects"].map((c, i) => (
                        <p key={i} className="text-sm text-gray-600 flex items-center gap-2 mb-1"><span className="text-green-500 font-bold">✓</span>{c}</p>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}><PlusCircle className="w-3 h-3 text-purple-500" /> App Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required className={inputCls} placeholder="e.g. Uniswap, Aave" />
                      </div>
                      <div>
                        <label className={labelCls}><Globe className="w-3 h-3 text-purple-500" /> Website URL *</label>
                        <input type="url" name="link" value={formData.link} onChange={(e) => setFormData((p) => ({ ...p, link: e.target.value }))} required className={inputCls} placeholder="https://..." />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Category dropdown */}
                      <div>
                        <label className={labelCls}><Tag className="w-3 h-3 text-purple-500" /> Category *</label>
                        <div className="relative">
                          <button type="button" onClick={() => setCatOpen(!catOpen)} className={`${inputCls} flex items-center justify-between cursor-pointer`}>
                            {CATEGORIES.find((c) => c.id === formData.category)?.name || "Select"}
                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${catOpen ? "rotate-180" : ""}`} />
                          </button>
                          {catOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 max-h-56 overflow-y-auto">
                                {CATEGORIES.map((cat) => (
                                  <button key={cat.id} type="button" onClick={() => { setFormData((p) => ({ ...p, category: cat.id })); setCatOpen(false); }}
                                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${formData.category === cat.id ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                                    {cat.name}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Chain dropdown */}
                      <div>
                        <label className={labelCls}><GitBranch className="w-3 h-3 text-purple-500" /> Chain *</label>
                        <div className="relative">
                          <button type="button" onClick={() => setChainOpen(!chainOpen)} className={`${inputCls} flex items-center justify-between cursor-pointer`}>
                            {formData.chain}
                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${chainOpen ? "rotate-180" : ""}`} />
                          </button>
                          {chainOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setChainOpen(false)} />
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 max-h-56 overflow-y-auto">
                                {CHAINS.map((chain) => (
                                  <button key={chain} type="button" onClick={() => { setFormData((p) => ({ ...p, chain })); setChainOpen(false); }}
                                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${formData.chain === chain ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                                    {chain}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}><User className="w-3 h-3 text-purple-500" /> Your Handle (@username) *</label>
                        <input type="text" value={formData.builderHandle} onChange={(e) => setFormData((p) => ({ ...p, builderHandle: e.target.value }))} required className={inputCls} placeholder="@yourhandle" />
                      </div>
                      <div>
                        <label className={labelCls}><Link2 className="w-3 h-3 text-purple-500" /> GitHub / Audit Link <span className="text-gray-300 font-normal">(optional)</span></label>
                        <input type="url" value={formData.auditLink} onChange={(e) => setFormData((p) => ({ ...p, auditLink: e.target.value }))} className={inputCls} placeholder="https://github.com/..." />
                      </div>
                    </div>

                    {/* Security Level */}
                    <div>
                      <label className={labelCls}><ShieldCheck className="w-3 h-3 text-purple-500" /> Security Level</label>
                      <div className="relative">
                        <button type="button" onClick={() => setSecOpen(!secOpen)} className={`${inputCls} flex items-center justify-between cursor-pointer`}>
                          {SECURITY_LEVELS.find((s) => s.id === formData.securityLevel)?.label}
                          <ChevronDown size={14} className={`text-gray-400 transition-transform ${secOpen ? "rotate-180" : ""}`} />
                        </button>
                        {secOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setSecOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                              {SECURITY_LEVELS.map((s) => (
                                <button key={s.id} type="button" onClick={() => { setFormData((p) => ({ ...p, securityLevel: s.id })); setSecOpen(false); }}
                                  className={`w-full text-left px-5 py-3 text-sm transition-colors ${formData.securityLevel === s.id ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}><FileText className="w-3 h-3 text-purple-500" /> Description *</label>
                      <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} required rows={4}
                        className={`${inputCls} leading-relaxed resize-none`} placeholder="What does your app do? What problem does it solve?" />
                    </div>

                    <button type="submit" disabled={submitStatus === "sending"}
                      className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-purple-600 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 group disabled:opacity-50">
                      <Rocket className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                      {submitStatus === "sending" ? "Submitting..." : "Submit Listing"}
                    </button>

                    {submitStatus.startsWith("error-") && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
                        <XCircle size={16} /> {submitStatus.replace("error-", "") || "Connection error. Please try again."}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
