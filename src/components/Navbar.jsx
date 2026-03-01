import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

/**
 * Modern web3central Navbar
 */

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  const navLinks = [
    { name: "Home", to: "/" },
    { name: "Academy", to: "/academy" },
    { name: "Compare", to: "/tool-comparison" },
    { name: "Support", to: "/support" },
    { name: "Submit", to: "/submit-tool" },
    { name: "Profile", to: "/profile" },
  ];

  const appLinks = [
    { name: "Decentralized exchanges", to: "/apps/dex" },
    { name: "Perpetual protocols", to: "/apps/perps" },
    { name: "Interoperability bridges", to: "/apps/interoperability" },
    { name: "Autonomous protocol", to: "/apps/onchain-autonomy" },
    { name: "Community tools", to: "/apps/community-tools" },
    { name: "Bounty Hub", to: "/apps/bounty-hub" },

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
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${isActive ? "text-purple-600" : "text-gray-500 hover:text-purple-600"}`
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
                className={`flex items-center gap-1 text-sm font-semibold transition-colors ${appsOpen ? "text-purple-600" : "text-gray-500 hover:text-purple-600"
                  }`}
              >
                Apps
                <svg className={`w-4 h-4 transition-transform ${appsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {appsOpen && (
                <div className="absolute left-0 mt-0 w-64 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50">
                  {appLinks.map((app) => (
                    <Link
                      key={app.to}
                      to={app.to}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      {app.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.slice(1).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${isActive ? "text-purple-600" : "text-gray-500 hover:text-purple-600"
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
          {/* Mobile Apps Section */}
          <div className="pt-2 pb-1 border-t border-gray-100 mt-2">
            <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Apps</p>
            {appLinks.map((app) => (
              <Link
                key={app.to}
                to={app.to}
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
              >
                {app.name}
              </Link>
            ))}
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
