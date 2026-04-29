import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  Home, TrendingUp, Star, Sparkles, Newspaper, GraduationCap,
  ArrowLeftRight, Landmark, Share2, Wallet, ShieldCheck,
  BarChart3, Image, Gamepad2, Users, Building, Coins, Lock,
  Activity, X, ChevronRight, ChevronLeft, LayoutGrid, Code2,
  Scale, HelpCircle, User as UserIcon, Target
} from "lucide-react";
import logo from "../assets/logo.jpg";

const QUICK_LINKS = [
  { id: "for-you",   label: "For You",      icon: Home,       color: "text-purple-600" },
  { id: "trending",  label: "Trending",     icon: TrendingUp, color: "text-orange-500" },
  { id: "top-rated", label: "Top Rated",    icon: Star,       color: "text-yellow-500" },
  { id: "new",       label: "New Arrivals", icon: Sparkles,   color: "text-emerald-500" },
  { id: "all",       label: "All Apps",     icon: LayoutGrid, color: "text-blue-500"   },
];

const CATEGORIES = [
  { id: "trading",     label: "Trading",     icon: ArrowLeftRight, path: "/apps/trading",     color: "text-violet-600"  },
  { id: "defi",        label: "DeFi",        icon: Landmark,       path: "/apps/defi",        color: "text-emerald-600" },
  { id: "bridges",     label: "Bridges",     icon: Share2,         path: "/apps/bridges",     color: "text-blue-600"    },
  { id: "wallets",     label: "Wallets",     icon: Wallet,         path: "/apps/wallets",     color: "text-slate-600"   },
  { id: "security",    label: "Security",    icon: ShieldCheck,    path: "/apps/security",    color: "text-red-600"     },
  { id: "analytics",   label: "Analytics",   icon: BarChart3,      path: "/apps/analytics",   color: "text-cyan-600"    },
  { id: "nft",         label: "NFT",         icon: Image,          path: "/apps/nft",         color: "text-pink-600"    },
  { id: "gaming",      label: "Gaming",      icon: Gamepad2,       path: "/apps/gaming",      color: "text-green-600"   },
  { id: "community",   label: "Community",   icon: Users,          path: "/apps/community",   color: "text-teal-600"    },
  { id: "rwa",         label: "RWA",         icon: Building,       path: "/apps/rwa",         color: "text-amber-600"   },
  { id: "cex",         label: "CEX",         icon: Coins,          path: "/apps/cex",         color: "text-yellow-600"  },
  { id: "privacy",     label: "Privacy",     icon: Lock,           path: "/apps/privacy",     color: "text-gray-600"    },
  { id: "predictions", label: "Predictions", icon: Activity,       path: "/apps/predictions", color: "text-orange-600"  },
  { id: "bounty-hub",  label: "Bounty Hub",  icon: Target,         path: "/apps/bounty-hub",  color: "text-indigo-600"  },
];

const NAV_LINKS = [
  { label: "News",              icon: Newspaper,     path: "/news"             },
  { label: "Community Feed",    icon: Users,         path: "/community"        },
  { label: "Academy",           icon: GraduationCap, path: "/academy"          },
  { label: "Compare",           icon: Scale,         path: "/tool-comparison"  },
  { label: "Profile",           icon: UserIcon,      path: "/profile"          },
  { label: "Support",           icon: HelpCircle,    path: "/support"          },
  { label: "Developer Console", icon: Code2,         path: "/developer"        },
];

export default function CategorySidebar({ activeSection, onSelect, isOpen, onClose }) {
  const drawerRef = useRef(null);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("w3c_sidebar_collapsed") === "true"; }
    catch { return false; }
  });

  const toggleCollapse = () => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem("w3c_sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleCategoryNav = (path, id) => {
    onSelect?.(id);
    navigate(path);
    onClose?.();
  };

  const handleSelect = (id) => {
    onSelect?.(id);
    onClose?.();
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── Shared inner content ── */
  const SidebarContent = ({ forceExpanded = false }) => {
    const isCollapsed = !forceExpanded && collapsed;
    return (
      <div className="flex flex-col h-full">

        {/* ── Logo / Brand Header ── */}
        <div className={`relative flex items-center shrink-0 h-16 border-b border-gray-100 ${isCollapsed ? "justify-center px-3" : "justify-between px-4"}`}>
          <Link to="/" className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "" : "flex-1"}`}>
            <img
              src={logo}
              alt="web3central"
              className="w-9 h-9 object-cover rounded-lg border border-purple-100 shadow-sm shrink-0"
            />
            {!isCollapsed && (
              <span className="text-base font-black tracking-tight text-gray-900 whitespace-nowrap overflow-hidden">
                web3<span className="text-purple-600">central</span>
              </span>
            )}
          </Link>

          {/* Expand/collapse toggle — desktop only */}
          {isCollapsed ? (
            /* Floating expand button — sits on the right edge so it doesn't squish logo */
            <button
              onClick={toggleCollapse}
              title="Expand sidebar"
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <ChevronRight size={12} />
            </button>
          ) : (
            <button
              onClick={toggleCollapse}
              title="Collapse sidebar"
              className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            >
              <ChevronLeft size={15} />
            </button>
          )}

          {/* Close — mobile drawer only */}
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-3 space-y-4 ${isCollapsed ? "px-2" : ""}`}>

          {/* Quick links */}
          <div className={isCollapsed ? "space-y-0.5" : "px-3 space-y-0.5"}>
            {!isCollapsed && (
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-3 mb-1">Discover</p>
            )}
            {QUICK_LINKS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                title={isCollapsed ? label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all text-left group
                  ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}
                  ${activeSection === id
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <Icon
                  size={16}
                  className={activeSection === id ? "text-purple-600 shrink-0" : `${color} opacity-70 group-hover:opacity-100 shrink-0`}
                />
                {!isCollapsed && label}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className={isCollapsed ? "space-y-0.5" : "px-3"}>
            {!isCollapsed && (
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-3 mb-1">Categories</p>
            )}
            <div className="space-y-0.5">
              {CATEGORIES.map(({ id, label, icon: Icon, path, color }) => (
                <button
                  key={id}
                  onClick={() => handleCategoryNav(path, id)}
                  title={isCollapsed ? label : undefined}
                  className={`w-full flex items-center rounded-xl text-sm font-medium transition-all text-left group
                    ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"}
                    ${activeSection === id
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                >
                  <Icon
                    size={15}
                    className={activeSection === id ? "text-purple-600 shrink-0" : `${color} opacity-60 group-hover:opacity-100 shrink-0`}
                  />
                  {!isCollapsed && label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          {!isCollapsed && <div className="mx-4 border-t border-gray-100" />}

          {/* Bottom nav links */}
          <div className={isCollapsed ? "space-y-0.5" : "px-3 space-y-0.5"}>
            {!isCollapsed && (
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-3 mb-1">More</p>
            )}
            {NAV_LINKS.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-medium transition-all
                  ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}
                  ${isActive
                    ? "bg-purple-50 text-purple-700 font-semibold"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                  }`
                }
              >
                <Icon size={15} className="shrink-0" />
                {!isCollapsed && label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop: sticky collapsible sidebar from top ── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen z-[51] bg-white border-r border-gray-100 transition-all duration-200 ${
          collapsed ? "w-14" : "w-60"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: overlay drawer (always expanded) ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <aside
            ref={drawerRef}
            className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl overflow-hidden flex flex-col"
            style={{ animation: "slideInLeft 0.22s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <SidebarContent forceExpanded />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
