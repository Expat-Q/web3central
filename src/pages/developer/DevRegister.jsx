import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Twitter, Github, Globe, Wallet, ArrowRight, ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";
import logo from "../../assets/logo.jpg";
import { useAuth } from "../../context/AuthContext";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

const STEPS = ["Your Identity", "Social Proof", "Review & Agree"];

export default function DevRegister({ onComplete }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inline login state for existing developers
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [form, setForm] = useState({
    displayName: "", bio: "", builderType: "solo",
    twitter: "", github: "", website: "", walletAddress: "",
    agreedToTerms: false
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canProceedStep0 = form.displayName.trim().length >= 2;
  const canProceedStep1 = form.twitter || form.github || form.website;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPw) return setLoginError("Email and password are required.");
    setLoginLoading(true);
    setLoginError("");
    try {
      // Use AuthContext login to keep global auth state in sync
      const res = await login({ email: loginEmail, password: loginPw });
      if (!res.success) {
        setLoginError(res.message || "Invalid email or password.");
        setLoginLoading(false);
        return;
      }
      // Navigate via React router instead of hard reload
      navigate("/developer");
    } catch {
      setLoginError("Login failed. Please check your connection and try again.");
      setLoginLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/developer/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ ...form, agreedToTerms: true })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (onComplete) onComplete();
      navigate("/developer", { replace: true });
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-8">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <img src={logo} alt="web3central" className="w-9 h-9 rounded-xl object-cover border border-purple-100 shadow-sm" />
        <span className="font-black text-gray-900 text-lg tracking-tight">web3central</span>
        <span className="text-gray-400 text-sm font-medium ml-1">Developer Console</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Existing developer login banner */}
        <div className="mb-4">
          <button
            onClick={() => setShowLogin(!showLogin)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-gray-200 rounded-2xl hover:border-purple-300 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <LogIn size={15} className="text-purple-500" />
              <span className="text-sm font-bold text-gray-700">Already have a developer account?</span>
            </div>
            <span className="text-sm font-bold text-purple-600 group-hover:text-purple-500 flex items-center gap-1">
              Sign In {showLogin ? "↑" : "→"}
            </span>
          </button>

          {/* Inline login form */}
          <AnimatePresence>
            {showLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleLogin}
                  className="mt-2 bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Sign In to Console</p>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="Email address"
                    autoFocus
                    className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
                  />
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={loginPw}
                      onChange={e => setLoginPw(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{loginError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loginLoading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><LogIn size={14} /> Sign In to Console</>
                    }
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 ${i <= step ? "text-purple-700" : "text-gray-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                  i < step ? "bg-purple-600 border-purple-600 text-white" :
                  i === step ? "border-purple-600 text-purple-700 bg-purple-50" :
                  "border-gray-200 text-gray-400"
                }`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="text-xs font-bold hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-purple-400" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/60 p-8">
          <AnimatePresence mode="wait">
            {/* Step 0 — Identity */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-xl font-black text-gray-900 mb-1">Who are you building for?</h1>
                <p className="text-sm text-gray-400 mb-6">Tell us about yourself so users know who's behind the apps.</p>

                {/* Builder type */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[
                    { value: "solo", label: "Solo Builder" },
                    { value: "team", label: "Protocol Team" },
                    { value: "company", label: "Company" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => set("builderType", value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                        form.builderType === value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-widest">
                      Display Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={e => set("displayName", e.target.value)}
                      placeholder={form.builderType === "solo" ? "e.g. Alex Builder" : "e.g. Uniswap Labs"}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-widest">Short Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => set("bio", e.target.value)}
                      placeholder="What are you building in Web3?"
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors resize-none font-medium"
                    />
                    <p className="text-[10px] text-gray-300 mt-1 text-right">{form.bio.length}/300</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1 — Social Proof */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-xl font-black text-gray-900 mb-1">Prove it's really you</h1>
                <p className="text-sm text-gray-400 mb-6">We need at least one external link to prevent fake accounts. This will show on your developer profile.</p>

                <div className="space-y-3">
                  {[
                    { key: "twitter", icon: <Twitter size={14} className="text-sky-500" />, label: "Twitter / X", placeholder: "https://x.com/yourhandle" },
                    { key: "github", icon: <Github size={14} className="text-gray-700" />, label: "GitHub", placeholder: "https://github.com/yourrepo" },
                    { key: "website", icon: <Globe size={14} className="text-purple-500" />, label: "Website", placeholder: "https://yourproject.xyz" },
                    { key: "walletAddress", icon: <Wallet size={14} className="text-emerald-600" />, label: "Wallet Address (optional)", placeholder: "0x..." },
                  ].map(({ key, icon, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                        {icon} {label}
                      </label>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={e => set(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
                      />
                    </div>
                  ))}
                </div>

                {!canProceedStep1 && (
                  <p className="text-xs font-semibold text-amber-600 mt-4 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                    You must provide at least one link (Twitter, GitHub, or website).
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 2 — Review & Terms */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-xl font-black text-gray-900 mb-1">Almost there!</h1>
                <p className="text-sm text-gray-400 mb-6">Review your profile and agree to the Developer Terms.</p>

                {/* Summary */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 border border-gray-100">
                  <Row label="Name" value={form.displayName} />
                  <Row label="Type" value={form.builderType} />
                  {form.twitter && <Row label="Twitter" value={form.twitter} />}
                  {form.github && <Row label="GitHub" value={form.github} />}
                  {form.website && <Row label="Website" value={form.website} />}
                </div>

                {/* Terms */}
                <div className="space-y-3">
                  {[
                    "My app is a real, live product that is functional and not under construction.",
                    "I will not submit scam, rug-pull, or honeypot projects.",
                    "I agree to web3central's Developer Terms and Community Guidelines.",
                  ].map((t, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                      <div className="w-5 h-5 rounded-md border-2 border-gray-200 group-hover:border-purple-400 mt-0.5 flex items-center justify-center shrink-0 transition-colors checked:bg-purple-600">
                        <input type="checkbox" className="sr-only" onChange={() => { if (i === 2) set("agreedToTerms", !form.agreedToTerms); }} />
                        <div className="w-2.5 h-2.5 rounded-sm bg-purple-600 opacity-0 group-hover:opacity-30" />
                      </div>
                      <span className="text-sm text-gray-600">{t}</span>
                    </label>
                  ))}
                </div>

                {/* Single agree-all */}
                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreedToTerms}
                    onChange={e => set("agreedToTerms", e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <span className="text-sm font-bold text-gray-900">I confirm all of the above</span>
                </label>

                {error && <p className="text-xs text-red-600 font-semibold mt-4 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !form.agreedToTerms}
                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Create Developer Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-400 font-semibold capitalize">{label}</span>
    <span className="font-bold text-gray-800 truncate max-w-[60%] text-right">{value}</span>
  </div>
);
