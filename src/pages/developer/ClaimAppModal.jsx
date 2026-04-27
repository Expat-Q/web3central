import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Twitter, Copy, CheckCircle, ExternalLink, Clock } from "lucide-react";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

export default function ClaimAppModal({ onClose }) {
  const [step, setStep] = useState("search"); // search | code | verify | done
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [claim, setClaim] = useState(null);
  const [tweetUrl, setTweetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [autoApproved, setAutoApproved] = useState(false);

  const searchApps = async (q) => {
    if (!q.trim() || q.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(`${API}/tools/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      // API returns a plain array (not {data:[]}), decorated with logoUrl
      setResults(Array.isArray(data) ? data : (data.data || []));
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const initiateClaim = async (tool) => {
    setSelected(tool);
    setError("");
    try {
      const res = await fetch(`${API}/developer/claim/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ toolId: tool.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setClaim(data);
      setStep("code");
    } catch (e) {
      setError(e.message || "Failed to initiate claim.");
    }
  };

  const copyTweet = () => {
    navigator.clipboard.writeText(claim.tweetTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitVerification = async () => {
    if (!tweetUrl.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/developer/claim/verify-twitter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ toolId: selected.id, tweetUrl })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAutoApproved(data.autoApproved === true);
      setStep("done");
    } catch (e) {
      setError(e.message || "Verification failed.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-black text-gray-900">Claim an App</h2>
            <p className="text-xs text-gray-400 mt-0.5">Verify you own an existing listing via Twitter/X</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {/* Step: Search */}
          {step === "search" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 border-2 border-gray-100 rounded-xl px-4 py-3 focus-within:border-purple-400 transition-colors">
                  <Search size={14} className="text-gray-300 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); if (e.target.value.length > 1) searchApps(e.target.value); }}
                    placeholder="Search for your app..."
                    className="flex-1 text-sm outline-none bg-transparent font-medium placeholder:text-gray-300"
                    autoFocus
                  />
                  {searching && <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />}
                </div>
              </div>

              {results.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => initiateClaim(tool)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors text-left border border-gray-100 hover:border-purple-200 group"
                    >
                      <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                        {tool.logoUrl ? <img src={tool.logoUrl} alt="" className="w-full h-full object-contain p-1" /> : (
                          <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-xs">{tool.name[0]}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{tool.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{tool.category}</p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Claim →</span>
                    </button>
                  ))}
                </div>
              )}

              {error && <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-xl border border-red-100">{error}</p>}
            </div>
          )}

          {/* Step: Show code + tweet instructions */}
          {step === "code" && claim && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-white border border-purple-100 flex items-center justify-center shrink-0 text-purple-600 font-black text-sm">
                  {selected?.name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{selected?.name}</p>
                  <p className="text-xs text-gray-400">{selected?.category}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Twitter size={11} className="text-sky-500" /> Step 1 — Post this tweet
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
                  <p className="text-sm text-gray-800 font-medium pr-8">{claim.tweetTemplate}</p>
                  <button
                    onClick={copyTweet}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {copied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-400 flex-1">
                    Post from the <strong>official Twitter/X account</strong> of the project ({selected?.name}).
                  </p>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(claim.tweetTemplate)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    <Twitter size={11} /> Post on X →
                  </a>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ExternalLink size={11} /> Step 2 — Paste the tweet URL
                </p>
                <input
                  type="text"
                  value={tweetUrl}
                  onChange={e => setTweetUrl(e.target.value)}
                  placeholder="https://x.com/Uniswap/status/..."
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                <Clock size={12} /> Claim code expires in 24 hours
              </div>

              {error && <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-xl border border-red-100">{error}</p>}

              <div className="flex items-center justify-between">
                <button onClick={() => setStep("search")} className="text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">← Back</button>
                <button
                  onClick={submitVerification}
                  disabled={!tweetUrl.trim() || submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  Submit for Verification
                </button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="text-center py-6 space-y-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border-2 ${
                autoApproved ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
              }`}>
                <CheckCircle size={28} className={autoApproved ? "text-emerald-600" : "text-amber-500"} />
              </div>
              <h3 className="text-base font-black text-gray-900">
                {autoApproved ? "🎉 Claim Approved!" : "Tweet Submitted!"}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {autoApproved
                  ? `${selected?.name} is now in your console under My Apps. Your tier has been upgraded to Claimed.`
                  : `Our team will verify your tweet within 24 hours. Once approved, ${selected?.name} will appear in your console.`
                }
              </p>
              <button
                onClick={onClose}
                className={`mt-2 px-6 py-2.5 text-white rounded-xl font-bold text-sm transition-all ${
                  autoApproved ? "bg-emerald-600 hover:bg-emerald-500" : "bg-gray-900 hover:bg-gray-700"
                }`}
              >
                {autoApproved ? "Go to My Apps" : "Got it"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
