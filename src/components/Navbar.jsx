import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";
import {
  ArrowLeftRight, Share2, Landmark, Sparkles, ShieldCheck, BarChart3,
  Wallet, Layers, Image, Gamepad2, Lock, Activity, Users, DollarSign,
  ChevronRight, ArrowRight
} from "lucide-react";

/**
 * Modern web3central Navbar
 */

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [mobileAppsOpen, setMobileAppsOpen] = useState(false);
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const location = useLocation();
  const isOnAppsPage = location.pathname.startsWith('/apps');

  const navLinks = [
    { name: "Home", to: "/" },
    { name: "Academy", to: "/academy" },
    { name: "Compare", to: "/tool-comparison" },
    { name: "Support", to: "/support" },
    { name: "Submit", to: "/submit-tool" },
    { name: "Profile", to: "/profile" },
  ];

  const appLinks = [
    { name: "Trading",     to: "/apps/trading",     icon: <ArrowLeftRight size={15} />, color: "from-violet-500 to-purple-600"  },
    { name: "Bridges",     to: "/apps/bridges",     icon: <Share2 size={15} />,         color: "from-blue-500 to-cyan-600"      },
    { name: "DeFi",        to: "/apps/defi",        icon: <Landmark size={15} />,       color: "from-emerald-500 to-green-600"  },
    { name: "Staking",     to: "/apps/staking",     icon: <Sparkles size={15} />,       color: "from-indigo-500 to-violet-600"  },
    { name: "Security",    to: "/apps/security",    icon: <ShieldCheck size={15} />,    color: "from-red-500 to-rose-600"       },
    { name: "Analytics",   to: "/apps/analytics",   icon: <BarChart3 size={15} />,      color: "from-cyan-500 to-sky-600"       },
    { name: "Wallets",     to: "/apps/wallets",     icon: <Wallet size={15} />,         color: "from-slate-500 to-gray-600"     },
    { name: "Layer 2",     to: "/apps/l2",          icon: <Layers size={15} />,         color: "from-violet-500 to-indigo-600"  },
    { name: "NFT",         to: "/apps/nft",         icon: <Image size={15} />,          color: "from-pink-500 to-fuchsia-600"   },
    { name: "Gaming",      to: "/apps/gaming",      icon: <Gamepad2 size={15} />,       color: "from-green-500 to-teal-600"     },
    { name: "Privacy",     to: "/apps/privacy",     icon: <Lock size={15} />,           color: "from-gray-500 to-zinc-600"      },
    { name: "Predictions", to: "/apps/predictions", icon: <Activity size={15} />,       color: "from-orange-500 to-amber-600"   },
    { name: "Community",   to: "/apps/community",   icon: <Users size={15} />,          color: "from-teal-500 to-emerald-600"   },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Area - Left */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="web3central"
                className="w-10 h-10 object-cover rounded-lg border border-purple-100 shadow-sm"
              />
              <span className="text-xl font-bold tracking-tight text-gray-900">
                web3<span className="text-purple-600">central</span>
              </span>
            </Link>
          </div>

          {/* Nav Links - Center */}
          <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "font-semibold text-purple-600" : "font-medium text-gray-500 hover:text-purple-600"}`
              }
            >
              Home
            </NavLink>

            {/* Apps Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setAppsOpen(true)}
              onMouseLeave={() => setAppsOpen(false)}
            >
              <button
                className={`flex items-center gap-1 text-sm transition-colors ${appsOpen || isOnAppsPage ? "font-semibold text-purple-600" : "font-medium text-gray-500 hover:text-purple-600"
                  }`}
              >
                Apps
                <svg className={`w-4 h-4 transition-transform ${appsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {appsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-0 w-[560px] bg-white border border-gray-100 shadow-2xl rounded-2xl p-5 z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Browse Categories</p>
                    <Link to="/apps" className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">View All <ChevronRight size={12} /></Link>
                  </div>
                  {/* Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {appLinks.map((app) => (
                      <Link
                        key={app.to}
                        to={app.to}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform text-white`}>
                          {app.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">{app.name}</span>
                      </Link>
                    ))}
                  </div>
                  {/* Bounty Hub CTA */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      to="/apps/bounty-hub"
                      className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm text-white">
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Bounty Hub</p>
                          <p className="text-xs text-gray-500">Earn rewards for Web3 contributions</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {navLinks.slice(1).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm transition-colors ${isActive ? "font-semibold text-purple-600" : "font-medium text-gray-500 hover:text-purple-600"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Auth Area - Right */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">Hi, {user.name}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Logout
                </button>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    Admin
                  </Link>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 text-base font-medium rounded-md ${isActive ? "text-purple-600 bg-purple-50" : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          {/* Mobile Apps Dropdown */}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <button
              onClick={() => setMobileAppsOpen(!mobileAppsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 text-base font-medium rounded-md transition-colors ${
                isOnAppsPage ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Apps
              <svg className={`w-4 h-4 transition-transform duration-200 ${mobileAppsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileAppsOpen && (
              <div className="mt-2 mx-1 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="grid grid-cols-2 gap-1.5">
                  {[...appLinks, { name: "Bounty Hub", to: "/apps/bounty-hub", icon: <DollarSign size={13} />, color: "from-amber-400 to-orange-500" }].map((app) => (
                    <Link
                      key={app.to}
                      to={app.to}
                      onClick={() => { setMenuOpen(false); setMobileAppsOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors group bg-white border border-gray-100"
                    >
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center shrink-0 text-white`}>
                        {app.icon}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">{app.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            {isLoggedIn ? (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
              Logout
              </button>
            ) : (
              <div className="space-y-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-base font-medium text-gray-600 hover:text-purple-600"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-purple-600 rounded-md shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
