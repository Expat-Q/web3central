import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  PlusCircle,
  Globe,
  Tag,
  User,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronDown,
  Rocket
} from "lucide-react";

const slideFromLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const slideFromRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function SubmitTool() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (!authLoading && (!user || user.email === 'guest@web3central.internal')) {
      navigate('/login', { state: { returnTo: '/submit-tool' } });
    }
  }, [user, authLoading, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    link: "",
    category: "dex",
    builderHandle: "",
    description: ""
  });

  const [status, setStatus] = useState(""); // "" | "sending" | "success" | "error"

  const categories = [
    { id: "dex", name: "Decentralized Exchanges (DEX)" },
    { id: "interoperability", name: "Interoperability Bridges" },
    { id: "onchainAutonomy", name: "Onchain Autonomy" },
    { id: "bountyHub", name: "Bounty Hub" },
    { id: "web3Chat", name: "Perps" },
    { id: "communityTools", name: "Community Tools" },
    { id: "researchFiles", name: "Research Platforms" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? '/api'
        : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

      const response = await fetch(`${API_BASE_URL}/tools/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to submit tool");
      }

      setStatus("success");
      setFormData({
        name: "",
        link: "",
        category: "dex",
        builderHandle: "",
        description: ""
      });
    } catch (err) {
      console.error("Submission error:", err);
      setStatus("error");
    }
  };

  if (authLoading || !user || user.email === 'guest@web3central.internal') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 pb-24 px-6 bg-white overflow-x-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideFromLeft}
          className="text-center mb-16"
        >

          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-gray-900 leading-tight">
            Submit Your <span className="text-purple-600">Tool</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Expand the web3central ecosystem. Apply for your protocol to be indexed in our institutional-grade discovery hub.
          </p>
        </motion.div>

        {/* Success / Form Container */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideFromRight}
          className="bg-white border border-gray-100 p-8 md:p-14 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] mb-16 relative overflow-hidden"
        >
          {status === "success" ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-green-50 text-green-500 mb-8 border border-green-100 shadow-[0_10px_30px_rgba(34,197,94,0.1)]">
                <CheckCircle size={48} strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Submission Received</h3>
              <p className="text-gray-500 text-lg font-medium mb-10 max-w-sm mx-auto">
                Your entry has been queued for verification. Our curators will finalize the listing within 24-48 hours.
              </p>
              <button
                onClick={() => setStatus("")}
                className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-purple-600 transition-all shadow-xl shadow-gray-200"
              >
                Submit Another Entry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <div className="space-y-3">
                  <label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <PlusCircle className="w-3 h-3 text-purple-600" /> Tool Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold outline-none focus:border-purple-600 focus:bg-white transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder="e.g. Uniswap V4"
                  />
                </div>

                {/* Link */}
                <div className="space-y-3">
                  <label htmlFor="link" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Globe className="w-3 h-3 text-purple-600" /> Website URL *
                  </label>
                  <input
                    type="url"
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold outline-none focus:border-purple-600 focus:bg-white transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Category */}
                <div className="space-y-3">
                  <label htmlFor="category" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Tag className="w-3 h-3 text-purple-600" /> Category *
                  </label>
                  <div className="relative group/select">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold appearance-none outline-none focus:border-purple-600 focus:bg-white transition-all cursor-pointer shadow-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-400 group-hover/select:text-purple-600 transition-colors">
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {/* Builder Handle */}
                <div className="space-y-3">
                  <label htmlFor="builderHandle" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <User className="w-3 h-3 text-purple-600" /> Architect ID (@handle) *
                  </label>
                  <input
                    type="text"
                    id="builderHandle"
                    name="builderHandle"
                    value={formData.builderHandle}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold outline-none focus:border-purple-600 focus:bg-white transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder="@architect_name"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label htmlFor="description" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <FileText className="w-3 h-3 text-purple-600" /> Technical Abstract *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-medium outline-none focus:border-purple-600 focus:bg-white transition-all placeholder:text-gray-300 shadow-sm leading-relaxed"
                  placeholder="Define the utility and core architecture of your protocol..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full py-5 bg-gray-900 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-gray-200 hover:bg-purple-600 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  <Rocket className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  {status === "sending" ? "Processing..." : "Submit for Verification"}
                </button>

                {status === "error" && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold uppercase tracking-widest">
                    <XCircle size={16} /> Connection error. Please retry.
                  </div>
                )}
              </div>
            </form>
          )}
        </motion.div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            to="/"
            className="group inline-flex items-center gap-4 text-xs font-bold text-gray-400 hover:text-purple-600 transition-all uppercase tracking-widest outline-none"
          >
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
