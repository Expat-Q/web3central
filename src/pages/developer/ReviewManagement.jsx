import React, { useState, useEffect } from "react";
import { Star, CornerDownRight, Send, ChevronDown } from "lucide-react";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

const StarRow = ({ score }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={11} className={s <= score ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
    ))}
  </div>
);

export default function ReviewManagement({ profile }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMap, setReplyMap] = useState({});
  const [sending, setSending] = useState({});
  const [filter, setFilter] = useState("all"); // all | unanswered

  useEffect(() => {
    fetch(`${API}/developer/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.ratings || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async (reviewId) => {
    const text = replyMap[reviewId]?.trim();
    if (!text) return;
    setSending(p => ({ ...p, [reviewId]: true }));
    try {
      const res = await fetch(`${API}/ratings/${reviewId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ reply: text })
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.map(r =>
          r._id === reviewId ? { ...r, developerReply: text, developerRepliedAt: new Date() } : r
        ));
        setReplyMap(p => { const n = { ...p }; delete n[reviewId]; return n; });
      }
    } catch {}
    finally { setSending(p => ({ ...p, [reviewId]: false })); }
  };

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  const filtered = filter === "unanswered"
    ? reviews.filter(r => r.comment && !r.developerReply)
    : reviews;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {reviews.length} total · {reviews.filter(r => r.comment && !r.developerReply).length} need a reply
          </p>
        </div>
        {/* Filter */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {["all", "unanswered"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-sm font-bold text-gray-500">
            {filter === "unanswered" ? "All caught up! No reviews need a reply." : "No reviews yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r._id} className="bg-white border border-gray-100 rounded-2xl p-5">
              {/* Reviewer */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {r.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{r.user?.name || "Anonymous"}</span>
                    <StarRow score={r.score} />
                    <span className="text-[11px] text-gray-400 ml-auto">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{r.comment}</p>}
                </div>
              </div>

              {/* Developer reply if exists */}
              {r.developerReply ? (
                <div className="ml-12 bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <CornerDownRight size={9} /> Your Response
                  </p>
                  <p className="text-sm text-gray-700">{r.developerReply}</p>
                </div>
              ) : r.comment ? (
                /* Reply box */
                <div className="ml-12 mt-2">
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={replyMap[r._id] || ""}
                      onChange={e => setReplyMap(p => ({ ...p, [r._id]: e.target.value }))}
                      placeholder="Write a response to this review..."
                      className="flex-1 px-3 py-2.5 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors resize-none"
                    />
                    <button
                      onClick={() => handleReply(r._id)}
                      disabled={!replyMap[r._id]?.trim() || sending[r._id]}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed self-end"
                    >
                      {sending[r._id]
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send size={14} />}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
