import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

/**
 * Slim Navbar — logo + auth only.
 * All navigation lives in the CategorySidebar.
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-end h-16">

          {/* Logo — hidden on desktop (shown in sidebar instead) */}
          <Link to="/" className="flex items-center gap-3 shrink-0 lg:hidden">
            <img
              src={logo}
              alt="web3central"
              className="w-9 h-9 object-cover rounded-lg border border-purple-100 shadow-sm"
            />
            <span className="text-lg font-black tracking-tight text-gray-900">
              web3<span className="text-purple-600">central</span>
            </span>
          </Link>

          {/* Auth — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="text-sm font-medium text-gray-500">
                  Hi, {user.name?.split(" ")[0]}
                </span>
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Auth — mobile */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-xs font-semibold text-gray-600">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
