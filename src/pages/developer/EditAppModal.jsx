import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Globe, MessageCircle, Send, Star, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

export default function EditAppModal({ tool, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: tool.description || "",
    url: tool.url || "",
    airdropUrl: tool.airdropUrl || "",
    isTestnet: tool.isTestnet || false,
    discord: tool.builder?.discord || "",
    telegram: tool.builder?.telegram || "",
    twitter: tool.builder?.twitter || "",
    github: tool.builder?.github || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/developer/apps/${tool.id || tool._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          description: form.description,
          url: form.url,
          airdropUrl: form.airdropUrl,
          isTestnet: form.isTestnet,
          builder: {
            discord: form.discord,
            telegram: form.telegram,
            twitter: form.twitter,
            github: form.github,
          }
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");
      setSuccess(true);
      if (onSaved) onSaved(data.tool);
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      setError(e.message || "Failed to update app.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-black text-gray-900">Edit App Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tool.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors resize-none font-medium"
              placeholder="Describe your protocol..."
            />
            <p className="text-[10px] text-gray-300 mt-1 text-right">{form.description.length}/500</p>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Globe size={11} /> Website URL
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
              placeholder="https://yourprotocol.xyz"
            />
          </div>

          {/* Airdrop URL */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Star size={11} /> Airdrop Page URL
            </label>
            <input
              type="url"
              value={form.airdropUrl}
              onChange={(e) => set("airdropUrl", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
              placeholder="https://yourprotocol.xyz/airdrop (optional)"
            />
          </div>

          {/* Mainnet / Testnet Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-gray-900">Network Scope</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{form.isTestnet ? "This protocol is in testnet phase" : "This protocol is on mainnet"}</p>
            </div>
            <button
              onClick={() => set("isTestnet", !form.isTestnet)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                form.isTestnet
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-blue-300 bg-blue-50 text-blue-700"
              }`}
            >
              {form.isTestnet ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {form.isTestnet ? "Testnet" : "Mainnet"}
            </button>
          </div>

          {/* Social Links */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Community Links</p>
            <div className="space-y-3">
              {[
                { key: "discord", icon: <MessageCircle size={13} className="text-indigo-500" />, label: "Discord Server", placeholder: "https://discord.gg/..." },
                { key: "telegram", icon: <Send size={13} className="text-sky-500" />, label: "Telegram Channel", placeholder: "https://t.me/..." },
                { key: "twitter", icon: <ExternalLink size={13} className="text-gray-700" />, label: "X (Twitter)", placeholder: "https://x.com/..." },
                { key: "github", icon: <ExternalLink size={13} className="text-gray-700" />, label: "GitHub", placeholder: "https://github.com/..." },
              ].map(({ key, icon, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <input
                    type="url"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className="flex-1 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl">
              ✅ App details updated successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-sm hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40 shadow-md shadow-purple-200"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
