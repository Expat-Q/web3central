import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, Twitter, Wallet, Copy, ExternalLink, AlertCircle } from "lucide-react";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";
// Placeholder vault address — will be updated once web3central wallet is confirmed
const W3C_VAULT = process.env.REACT_APP_W3C_VAULT_ADDRESS || "0xTBD_WEB3CENTRAL_VAULT";
const LISTING_FEE_ETH = "0.001";

const SECURITY_LEVELS = ["unaudited", "community", "audited", "verified"];
const CATEGORIES = [
  "defi", "dex", "trading", "bridges", "wallets", "nft",
  "security", "analytics", "community", "rwa", "cex", "gaming",
];

const STEPS = ["App Details", "Twitter Proof", "On-Chain Fee"];

export default function PublishApp({ onPublished }) {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", url: "", description: "", category: "", logo: "",
    twitter: "", securityLevel: "unaudited", chains: ""
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Wallet connect state
  const [walletAddress, setWalletAddress] = useState("");
  const [sendingTx, setSendingTx] = useState(false);
  const [txSent, setTxSent] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Generate verification code when moving to step 1
  useEffect(() => {
    if (step === 1 && !verificationCode) {
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      setVerificationCode(`W3C-PUB-${form.name.replace(/\s+/g, '-').toUpperCase().slice(0, 12)}-${rand}`);
    }
  }, [step]);

  const canProceedStep0 = form.name && form.url && form.description && form.category;

  const tweetTemplate = `Submitting ${form.name} to @_web3central. ${verificationCode}`;

  const copyTweet = () => {
    navigator.clipboard.writeText(tweetTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectAndSendTx = async () => {
    setError("");
    setSendingTx(true);
    try {
      if (!window.ethereum) {
        setError("No wallet detected. Install MetaMask or Rabby to send the listing fee.");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const from = accounts[0];
      setWalletAddress(from);

      // Encode the verification code as hex for tx input data
      const hexData = "0x" + [...verificationCode].map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
      const valueHex = "0x" + (BigInt(Math.round(parseFloat(LISTING_FEE_ETH) * 1e18))).toString(16);

      if (W3C_VAULT === "0xTBD_WEB3CENTRAL_VAULT") {
        // Vault not yet configured — skip tx, use manual hash input
        setError("Vault address not yet configured. Please paste your tx hash manually below.");
        setSendingTx(false);
        return;
      }

      const txHashResult = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from,
          to: W3C_VAULT,
          value: valueHex,
          data: hexData,
        }]
      });

      setTxHash(txHashResult);
      setTxSent(true);
    } catch (err) {
      if (err.code === 4001) setError("Transaction was rejected.");
      else setError(err.message || "Transaction failed.");
    } finally {
      setSendingTx(false);
    }
  };

  const handleSubmit = async () => {
    if (!tweetUrl.trim() || !txHash.trim()) {
      setError("Both the tweet URL and transaction hash are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        chains: form.chains.split(",").map(c => c.trim()).filter(Boolean),
        verificationCode,
        tweetUrl,
        txHash,
        walletAddress,
      };
      const res = await fetch(`${API}/tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Submission failed.");
      setSuccess(true);
      if (onPublished) onPublished();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle size={32} className="text-emerald-600" />
      </div>
      <h2 className="text-xl font-black text-gray-900">App Submitted!</h2>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">
        Your on-chain payment was verified. The team is reviewing your tweet for identity confirmation. Your app goes live once approved.
      </p>
      <div className="flex items-center justify-center gap-3 mt-2">
        <button
          onClick={() => { setSuccess(false); setStep(0); setForm({ name:"",url:"",description:"",category:"",logo:"",twitter:"",securityLevel:"unaudited",chains:"" }); setTweetUrl(""); setTxHash(""); setVerificationCode(""); }}
          className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:border-gray-300 transition-all"
        >
          Submit Another
        </button>
        <button onClick={() => navigate("/developer/apps")}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all"
        >
          View My Apps <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Publish New App</h1>
        <p className="text-sm text-gray-400 mt-1">
          Complete all 3 steps to submit your app. The on-chain fee is verified instantly; the tweet is reviewed by the team.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 ${i <= step ? "text-purple-700" : "text-gray-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                i < step ? "bg-purple-600 border-purple-600 text-white" :
                i === step ? "border-purple-600 text-purple-700 bg-purple-50" :
                "border-gray-200 text-gray-400"
              }`}>
                {i < step ? <CheckCircle size={13} /> : i + 1}
              </div>
              <span className="text-xs font-bold hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-purple-400" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 0: App Details ─────────────────────────── */}
      {step === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="App Name *" placeholder="e.g. Uniswap" value={form.name} onChange={v => set("name", v)} />
            <Field label="App URL *" placeholder="https://app.uniswap.org" value={form.url} onChange={v => set("url", v)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">Category *</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors bg-white font-medium"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="What does your app do? Be clear and concise."
              rows={4}
              maxLength={600}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors resize-none font-medium"
            />
            <p className="text-[10px] text-gray-300 mt-1 text-right">{form.description.length}/600</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Logo URL" placeholder="https://yourapp.xyz/logo.png" value={form.logo} onChange={v => set("logo", v)} />
            <Field label="Twitter / X" placeholder="https://x.com/yourapp" value={form.twitter} onChange={v => set("twitter", v)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">Security Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SECURITY_LEVELS.map(lvl => (
                <button key={lvl} type="button" onClick={() => set("securityLevel", lvl)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all capitalize ${form.securityLevel === lvl ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}
                >{lvl}</button>
              ))}
            </div>
          </div>

          <Field label="Supported Chains (comma-separated)" placeholder="Ethereum, Base, Arbitrum" value={form.chains} onChange={v => set("chains", v)} />

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={() => setStep(1)}
              disabled={!canProceedStep0}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Tweet Proof ─────────────────────────── */}
      {step === 1 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <h2 className="text-base font-black text-gray-900 mb-1">Post from your official Twitter/X</h2>
            <p className="text-sm text-gray-400">
              Tweet the message below from your app's official account. This proves you're the real team behind the project.
            </p>
          </div>

          {/* Tweet to post */}
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Twitter size={11} className="text-sky-500" /> Tweet this exactly
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
              <p className="text-sm text-gray-800 font-medium pr-8">{tweetTemplate}</p>
              <button
                onClick={copyTweet}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {copied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-400 flex-1">
                Post from the <strong>official</strong> {form.twitter ? `(${form.twitter.replace(/.*x\.com\//, '@').replace(/.*twitter\.com\//, '@')})` : "Twitter/X"} account for <strong>{form.name}</strong>.
              </p>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetTemplate)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
              >
                <Twitter size={11} /> Post on X →
              </a>
            </div>

          </div>

          {/* Tweet URL input */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Paste the tweet URL
            </label>
            <input
              type="text"
              value={tweetUrl}
              onChange={e => setTweetUrl(e.target.value)}
              placeholder="https://x.com/YourApp/status/..."
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
            />
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl mt-2">
              ⚠️ The tweet will be reviewed by the web3central team for identity confirmation — it is not instant.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button onClick={() => setStep(0)} className="text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">← Back</button>
            <button
              onClick={() => setStep(2)}
              disabled={!tweetUrl.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: On-Chain Listing Fee ─────────────── */}
      {step === 2 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <h2 className="text-base font-black text-gray-900 mb-1">Pay the listing fee on-chain</h2>
            <p className="text-sm text-gray-400">
              Send <strong>{LISTING_FEE_ETH} ETH</strong> to the web3central vault with your verification code as the transaction memo. This is verified instantly.
            </p>
          </div>

          {/* Vault info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-semibold">Send to</span>
              <span className="font-mono font-bold text-gray-900 text-xs">{W3C_VAULT}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-semibold">Amount</span>
              <span className="font-bold text-gray-900">{LISTING_FEE_ETH} ETH</span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <span className="text-gray-500 font-semibold">Memo / Input Data</span>
              <span className="font-mono font-bold text-purple-700 text-xs text-right">{verificationCode}</span>
            </div>
          </div>

          {/* Send via wallet */}
          {!txSent ? (
            <button
              onClick={connectAndSendTx}
              disabled={sendingTx}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40 text-sm shadow-md shadow-purple-200"
            >
              {sendingTx
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Wallet size={15} />
              }
              {sendingTx ? "Waiting for wallet..." : "Connect Wallet & Send Fee"}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
              <CheckCircle size={16} /> Transaction sent! Hash auto-filled below.
            </div>
          )}

          {/* Manual tx hash input */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Transaction Hash
            </label>
            <input
              type="text"
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors font-mono font-medium"
            />
            {txHash && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-600 font-bold mt-1.5 hover:underline"
              >
                View on Etherscan <ExternalLink size={11} />
              </a>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
              <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">← Back</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !txHash.trim() || !tweetUrl.trim()}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Submit App for Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, placeholder, value, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">{label}</label>
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
    />
  </div>
);
