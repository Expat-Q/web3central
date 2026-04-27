import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Star, MessageSquare, MousePointerClick, TrendingUp, AlertCircle } from "lucide-react";
import ToolLogo from "../../components/ToolLogo";
import { Link } from "react-router-dom";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      {icon}
    </div>
    <p className="text-2xl font-black text-gray-900 leading-none">{value ?? "—"}</p>
    {sub && <p className="text-xs font-semibold text-emerald-600 mt-1">{sub}</p>}
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5">{label}</p>
  </div>
);

export default function DashboardHome({ profile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/developer/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  const { summary, tools = [], ratings = [] } = data || {};
  const recentReviews = ratings.slice(0, 3);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          {tools.length} app{tools.length !== 1 ? "s" : ""} · {summary?.totalReviews || 0} total reviews
          {summary?.totalUnanswered > 0 && (
            <span className="ml-2 text-amber-600 font-bold">· {summary.totalUnanswered} need{summary.totalUnanswered === 1 ? "s" : ""} response</span>
          )}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Launches"
          value={(summary?.totalLaunches || 0).toLocaleString()}
          icon={<MousePointerClick size={18} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Total Reviews"
          value={summary?.totalReviews || 0}
          sub={summary?.totalUnanswered > 0 ? `${summary.totalUnanswered} unanswered` : null}
          icon={<MessageSquare size={18} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Avg Rating"
          value={tools.length
            ? (tools.filter(t => t.averageRating).reduce((a, t) => a + t.averageRating, 0) / Math.max(tools.filter(t => t.averageRating).length, 1)).toFixed(1)
            : "—"}
          icon={<Star size={18} className="text-yellow-500" />}
          color="bg-yellow-50"
        />
      </div>

      {/* My Apps preview */}
      {tools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-900">My Apps</h2>
            <Link to="/developer/apps" className="text-xs font-bold text-purple-600 hover:text-purple-500 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {tools.slice(0, 3).map(tool => (
              <div key={tool._id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-200 transition-all">
                <div className="w-12 h-12 rounded-2xl border border-gray-100 overflow-hidden shrink-0 bg-white">
                  <ToolLogo tool={tool} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{tool.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-gray-400 capitalize">{tool.category}</span>
                    {tool.averageRating && (
                      <span className="flex items-center gap-0.5 text-[11px] font-bold text-yellow-600">
                        <Star size={9} className="fill-yellow-400 text-yellow-400" /> {tool.averageRating}
                      </span>
                    )}
                    {tool.clickCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                        <MousePointerClick size={9} /> {tool.clickCount.toLocaleString()}
                      </span>
                    )}
                    {tool.unansweredReviews > 0 && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                        {tool.unansweredReviews} review{tool.unansweredReviews > 1 ? "s" : ""} to answer
                      </span>
                    )}
                  </div>
                </div>
                {tool.url && (
                  <a href={tool.url} target="_blank" rel="noreferrer" className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
                    <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tools.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-gray-500 mb-1">No apps yet</p>
          <p className="text-xs text-gray-400 mb-4">Publish your first app or claim an existing listing.</p>
          <Link to="/developer/publish" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all">
            Publish App
          </Link>
        </div>
      )}

      {/* Recent reviews */}
      {recentReviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-900">Recent Reviews</h2>
            <Link to="/developer/reviews" className="text-xs font-bold text-purple-600 hover:text-purple-500 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentReviews.map(r => (
              <div key={r._id} className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {r.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{r.user?.name || "Anonymous"}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={10} className={s <= r.score ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.comment}</p>}
                    {!r.developerReply && r.comment && (
                      <Link to="/developer/reviews" className="text-[11px] font-bold text-purple-600 hover:text-purple-500 mt-1.5 inline-block">
                        Reply →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
