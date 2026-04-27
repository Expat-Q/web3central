import React, { useState } from "react";
import { CheckCircle, Twitter, Github, Globe, Wallet, Save, Link, AlertCircle, ExternalLink } from "lucide-react";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

const TIER_INFO = {
  basic:    { label: "Basic",    desc: "Create an account, submit apps",                         color: "text-gray-600 bg-gray-50 border-gray-200" },
  claimed:  { label: "Claimed",  desc: "Verified ownership of an app, can manage reviews",       color: "text-blue-700 bg-blue-50 border-blue-200" },
  verified: { label: "Verified", desc: "Eligible for featured placement and Developer Spotlight", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  partner:  { label: "Partner",  desc: "Direct relationship with web3central",                   color: "text-purple-700 bg-purple-50 border-purple-200" },
};

export default function DevSettings({ profile, onSaved }) {
  const [form, setForm] = useState({
    displayName: profile?.displayName || "",
    bio: profile?.bio || "",
    twitter: profile?.twitter || "",
    github: profile?.github || "",
    website: profile?.website || "",
    walletAddress: profile?.walletAddress || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Wallet connect state
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/developer/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onSaved) onSaved();
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const connectWallet = async () => {
    setWalletError("");
    setWalletConnecting(true);
    try {
      if (!window.ethereum) {
        setWalletError("No wallet detected. Please install MetaMask or Rabby.");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        setWalletError("No accounts returned from wallet.");
        return;
      }
      const address = accounts[0];
      set("walletAddress", address);
      setWalletError("");
    } catch (err) {
      if (err.code === 4001) setWalletError("Wallet connection was rejected.");
      else setWalletError(err.message || "Failed to connect wallet.");
    } finally {
      setWalletConnecting(false);
    }
  };

  const tier = TIER_INFO[profile?.tier || "basic"];
  const shortAddress = form.walletAddress
    ? `${form.walletAddress.slice(0, 6)}...${form.walletAddress.slice(-4)}`
    : null;

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your developer profile and account details.</p>
      </div>

      {/* Current tier */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Developer Tier</p>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${tier.color}`}>
          {profile?.tier === "verified" && <CheckCircle size={13} />}
          {tier.label}
        </div>
        <p className="text-xs text-gray-400 mt-2">{tier.desc}</p>
        {(profile?.tier === "basic" || profile?.tier === "claimed") && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
            <p className="text-xs font-bold text-purple-700">🚀 How to get Verified</p>
            <p className="text-xs text-purple-600 mt-1">
              Claim your app via Twitter proof, then contact us at <strong>developers@web3central.xyz</strong> for manual verification review.
            </p>
          </div>
        )}
      </div>

      {/* Profile form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile</p>
        <Field label="Display Name" value={form.displayName} onChange={v => set("displayName", v)} placeholder="Your name or team name" />
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => set("bio", e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="A short description of what you build"
            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors resize-none font-medium"
          />
        </div>
      </div>

      {/* Social links */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Social Links</p>
        {[
          { key: "twitter",  icon: <Twitter size={13} className="text-sky-500" />,    label: "Twitter / X", placeholder: "https://x.com/handle" },
          { key: "github",   icon: <Github size={13} className="text-gray-700" />,    label: "GitHub",      placeholder: "https://github.com/yourrepo" },
          { key: "website",  icon: <Globe size={13} className="text-purple-500" />,   label: "Website",     placeholder: "https://yourprotocol.xyz" },
        ].map(({ key, icon, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              {icon} {label}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
            />
          </div>
        ))}
      </div>

      {/* Wallet Connect */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Connected Wallet</p>
        <p className="text-xs text-gray-400 mb-4">
          Link your wallet for on-chain identity proof and app publishing verification.
        </p>

        {form.walletAddress ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Wallet size={13} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-800">{shortAddress}</p>
                <p className="text-[10px] text-emerald-600">Wallet connected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://etherscan.io/address/${form.walletAddress}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink size={13} />
              </a>
              <button
                onClick={() => set("walletAddress", "")}
                className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={walletConnecting}
            className="flex items-center gap-2.5 px-5 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40 w-full justify-center"
          >
            {walletConnecting
              ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              : <Wallet size={15} />
            }
            {walletConnecting ? "Connecting..." : "Connect Wallet (MetaMask / Rabby)"}
          </button>
        )}

        {walletError && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
            <AlertCircle size={13} /> {walletError}
          </div>
        )}

        {/* Manual input as fallback */}
        {!form.walletAddress && (
          <div className="mt-3">
            <p className="text-[10px] text-gray-400 mb-1.5">Or paste address manually:</p>
            <input
              type="text"
              value={form.walletAddress}
              onChange={e => set("walletAddress", e.target.value)}
              placeholder="0x..."
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium font-mono"
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Member since {new Date(profile?.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-700 transition-all disabled:opacity-40"
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : saved
              ? <><CheckCircle size={14} /> Saved!</>
              : <><Save size={14} /> Save Changes</>
          }
        </button>
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">{label}</label>
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
    />
  </div>
);
