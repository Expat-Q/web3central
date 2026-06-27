import React, { useEffect, useState } from "react";
import {
  Routes, Route, NavLink, useNavigate, useLocation, Navigate
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, AppWindow, MessageSquare, PlusCircle,
  Settings, BookOpen, ChevronLeft, ChevronRight, CheckCircle,
  Menu, X, Lock, ArrowRight, Eye, EyeOff, UserPlus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

// Sub-pages
import DashboardHome from "./developer/DashboardHome";
import MyApps from "./developer/MyApps";
import ReviewManagement from "./developer/ReviewManagement";
import PublishApp from "./developer/PublishApp";
import DevSettings from "./developer/DevSettings";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

const TIER_BADGE = {
  basic:    { label: "Basic",    color: "bg-gray-100 text-gray-600 border-gray-200" },
  claimed:  { label: "Claimed",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  verified: { label: "Verified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partner:  { label: "Partner",  color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const NAV_ITEMS = [
  { to: "/developer",          label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { to: "/developer/apps",     label: "My Apps",     icon: AppWindow },
  { to: "/developer/reviews",  label: "Reviews",     icon: MessageSquare },
  { to: "/developer/publish",  label: "Publish App", icon: PlusCircle },
];

const NAV_BOTTOM = [
  { to: "/developer/settings", label: "Settings",      icon: Settings },
  { to: "/academy",            label: "Documentation", icon: BookOpen },
];

/* ────────────────────────────────────────────────────────
   INLINE LOGIN GATE — shown when user is not authenticated
──────────────────────────────────────────────────────── */
function DevLoginGate() {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Email and password are required.");
    setLoading(true);
    setError("");
    try {
      // Use AuthContext login to keep global auth state in sync
      const res = await login({ email, password });
      if (!res.success) {
        setError(res.message || "Invalid email or password.");
        setLoading(false);
        return;
      }
      // Navigate via React router instead of hard reload
      navigate("/developer");
    } catch {
      setError("Login failed. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="web3central" className="w-8 h-8 rounded-xl object-cover border border-purple-100 shadow-sm" />
          <span className="font-black text-gray-900 text-sm tracking-tight">web3central</span>
          <span className="text-gray-400 text-xs font-medium ml-1">Developer Console</span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Back to site
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Hero text */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-300/40">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Developer Console</h1>
            <p className="text-sm text-gray-400 mt-2">
              Manage your Web3 apps, track performance, and respond to reviews.
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/60 p-8">
            <h2 className="text-base font-black text-gray-900 mb-5">Sign in to your console</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:border-purple-400 focus:outline-none transition-colors font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || authLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm mt-2"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Lock size={14} /> Sign In to Console</>
                }
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs font-bold text-gray-300">OR</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Register option */}
            <button
              onClick={() => navigate("/developer/register")}
              className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-gray-100 text-gray-600 font-bold rounded-xl hover:border-purple-300 hover:text-purple-700 transition-all text-sm"
            >
              <UserPlus size={15} /> Create Developer Account
            </button>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: "📊", label: "App Analytics" },
              { icon: "💬", label: "Review Replies" },
              { icon: "🚀", label: "Publish Apps" },
            ].map(({ icon, label }) => (
              <div key={label} className="text-center bg-white border border-gray-100 rounded-2xl p-3">
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-[11px] font-bold text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   MAIN CONSOLE
──────────────────────────────────────────────────────── */
export default function DeveloperConsole() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  // Start as true if a token exists — prevents flash redirect to /register before fetch completes
  const [profileLoading, setProfileLoading] = useState(!!localStorage.getItem("token"));
  const [profileFetched, setProfileFetched] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
    else setProfileLoading(false);
  }, [user]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${API}/developer/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setProfile(data.profile || null);
    } catch { setProfile(null); }
    finally {
      setProfileLoading(false);
      setProfileFetched(true);
    }
  };

  // Loading spinner (initial auth check)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → show in-page login gate
  if (!user) return <DevLoginGate />;

  // Profile still loading
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-400">Loading console...</p>
        </div>
      </div>
    );
  }

  // Logged in but no developer profile → show registration (only after fetch confirmed)
  if (!profileLoading && profileFetched && !profile) {
    return <Navigate to="/developer/register" replace />;
  }

  const tier = TIER_BADGE[profile?.tier || "basic"];
  const firstName = (profile?.displayName || user?.name || "Developer").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const sidebarJSX = (
    <aside className={`flex flex-col bg-[#F8F9FA] border-r border-gray-200 shrink-0 transition-all duration-200 h-full ${sidebarCollapsed ? "w-16" : "w-64"}`}>

      {/* ── Header: logo + collapse toggle ── */}
      <div className={`flex items-center border-b border-gray-200 py-4 shrink-0 ${sidebarCollapsed ? "px-3 justify-center" : "px-4 gap-2"}`}>
        {!sidebarCollapsed && (
          <img src={logo} alt="web3central" className="w-7 h-7 rounded-lg object-cover border border-purple-100 shrink-0" />
        )}
        {!sidebarCollapsed && (
          <span className="font-black text-gray-900 text-sm tracking-tight flex-1">web3central</span>
        )}
        {/* Collapse button — always visible */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ── Developer info ── */}
      <div className={`border-b border-gray-100 shrink-0 ${sidebarCollapsed ? "px-3 py-4 flex justify-center" : "px-4 py-4"}`}>
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0"
            title={sidebarCollapsed ? (profile?.displayName || user?.name) : undefined}
          >
            {firstName[0].toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{profile?.displayName || user?.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tier.color}`}>
                {tier.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable body: nav + bottom ── */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Main nav */}
        <nav className={`flex-1 py-3 space-y-0.5 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-semibold transition-all ${
                  sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-purple-50 text-purple-700 font-bold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? "text-purple-600" : "text-gray-400"} />
                  {!sidebarCollapsed && label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className={`pb-4 space-y-0.5 border-t border-gray-100 pt-3 shrink-0 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {NAV_BOTTOM.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-semibold transition-all ${
                  sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  isActive ? "bg-purple-50 text-purple-700 font-bold" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? "text-purple-600" : "text-gray-400"} />
                  {!sidebarCollapsed && label}
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => navigate("/")}
            title={sidebarCollapsed ? "Back to web3central" : undefined}
            className={`w-full flex items-center rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all ${
              sidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            <ChevronLeft size={16} className="text-gray-400" />
            {!sidebarCollapsed && "Back to web3central"}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#F8F9FA]">
        <div className="flex items-center gap-2">
          <img src={logo} alt="web3central" className="w-6 h-6 rounded-md object-cover border border-purple-100" />
          <span className="font-black text-gray-900 text-sm">Dev Console</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          {sidebarJSX}
        </div>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed top-0 left-0 z-50 h-full lg:hidden"
              >
                {sidebarJSX}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white min-w-0">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-500">
              {greeting}, <span className="text-gray-900 font-bold">{firstName}</span>
            </p>
            {profile?.tier === "verified" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle size={9} /> Verified Developer
              </span>
            )}
          </div>

          {/* Sub-page routes */}
          <div className="p-6">
            <Routes>
              <Route index element={<DashboardHome profile={profile} />} />
              <Route path="apps" element={<MyApps profile={profile} />} />
              <Route path="reviews" element={<ReviewManagement profile={profile} />} />
              <Route path="publish" element={<PublishApp onPublished={fetchProfile} />} />
              <Route path="settings" element={<DevSettings profile={profile} onSaved={fetchProfile} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
