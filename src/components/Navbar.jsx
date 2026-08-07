import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

/**
 * Slim Navbar — auth actions & notification center.
 * Logo/branding lives in the CategorySidebar.
 */
export default function Navbar({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Hamburger only (mobile — sidebar has the logo) */}
          <div className="flex items-center">
            {setSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <NotificationDropdown />

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
            <div className="md:hidden flex items-center gap-1 sm:gap-2">
              {isLoggedIn ? (
                <button
                  onClick={logout}
                  className="px-2 py-1.5 sm:px-3 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="px-2 py-1.5 sm:px-3 text-xs font-semibold text-gray-600">
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-2 py-1.5 sm:px-3 text-xs font-bold text-white bg-purple-600 rounded-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
