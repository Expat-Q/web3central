import React, { useState, useEffect } from "react";
import { ArrowUpRight, Star, MousePointerClick, MessageSquare, Plus, Twitter, ChevronRight, Pencil } from "lucide-react";
import ToolLogo from "../../components/ToolLogo";
import { Link } from "react-router-dom";
import ClaimAppModal from "./ClaimAppModal";
import EditAppModal from "./EditAppModal";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

export default function MyApps({ profile }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimTarget, setClaimTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    fetch(`${API}/developer/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setTools(d.tools || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Apps</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tools.length} app{tools.length !== 1 ? "s" : ""} in your console</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setClaimTarget("modal")}
            className="flex items-center gap-1.5 px-4 py-2 border-2 border-purple-200 text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-50 transition-all"
          >
            <Twitter size={14} /> Claim Existing App
          </button>
          <Link
            to="/developer/publish"
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all"
          >
            <Plus size={14} /> Publish New App
          </Link>
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-14 text-center">
          <p className="text-base font-black text-gray-500 mb-1">No apps yet</p>
          <p className="text-sm text-gray-400 mb-6">Publish your first Web3 app or claim an existing listing to manage it here.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/developer/publish" className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all">
              Publish New App
            </Link>
            <button onClick={() => setClaimTarget("modal")} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:border-purple-300 transition-all">
              Claim Existing App
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map(tool => (
            <div key={tool._id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-purple-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl border border-gray-100 overflow-hidden shrink-0 bg-white">
                  <ToolLogo tool={tool} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-gray-900">{tool.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400 capitalize bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{tool.category}</span>
                        {tool.developerClaimedBy && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">Claimed</span>
                        )}
                        {tool.verified && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">✅ Verified</span>
                        )}
                      </div>
                    </div>
                    {tool.url && (
                      <a href={tool.url} target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors">
                        Visit <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>

                  {/* Stat pills */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MousePointerClick size={13} className="text-purple-400" />
                      <span className="font-bold">{(tool.clickCount || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-400">launches</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Star size={13} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-bold">{tool.averageRating?.toFixed(1) || "—"}</span>
                      <span className="text-xs text-gray-400">rating</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MessageSquare size={13} className="text-blue-400" />
                      <span className="font-bold">{tool.ratingCount || 0}</span>
                      <span className="text-xs text-gray-400">reviews</span>
                    </div>
                    {tool.unansweredReviews > 0 && (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        {tool.unansweredReviews} to answer
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                <button
                  onClick={() => setEditTarget(tool)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                >
                  <Pencil size={11} /> Edit Details
                </button>
                <Link to="/developer/reviews" className="text-xs font-bold text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-1 ml-4">
                  Manage Reviews <ChevronRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {claimTarget && (
        <ClaimAppModal onClose={() => setClaimTarget(null)} />
      )}

      {editTarget && (
        <EditAppModal
          tool={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updatedTool) => {
            setTools(prev => prev.map(t => t._id === updatedTool._id ? { ...t, ...updatedTool } : t));
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
