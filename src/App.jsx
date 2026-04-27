import React, { useEffect, useLayoutEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import ClaudeBot from "./components/ClaudeBot";
// import { Analytics } from "@vercel/analytics/react";

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
};

import Home from "./pages/Home";
import About from "./pages/About";
import Support from "./pages/Support";
import Apps from "./pages/Apps";
import DeveloperConsole from "./pages/DeveloperConsole";
import DevRegister from "./pages/developer/DevRegister";
import ToolComparison from "./pages/ToolComparison";
import Admin from "./pages/Admin";

import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import OAuthCallback from "./pages/auth/OAuthCallback";
import Academy from "./pages/Academy";
import LessonDetail from "./pages/LessonDetail";
import Profile from "./pages/Profile";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import CommunityFeed from "./pages/CommunityFeed";

import Dex from "./pages/apps/Dex";
import Interoperability from "./pages/apps/Interoperability";
import CommunityTools from "./pages/apps/CommunityTools";
import Web3Chat from "./pages/apps/Web3Chat";
import BountyHub from "./pages/apps/BountyHub";
import CategoryPage from "./pages/apps/CategoryPage";

const ConditionalFooter = () => {
  const location = useLocation();
  const hideFooter = ["/login", "/signup", "/oauth/callback"].includes(location.pathname)
    || location.pathname.startsWith("/developer");
  return !hideFooter ? <Footer /> : null;
};

const ConditionalNavbar = () => {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/developer");
  return !hideNavbar ? <Navbar /> : null;
};

const ConditionalBot = () => {
  const location = useLocation();
  const hideBot = location.pathname.startsWith("/developer");
  return !hideBot ? <ClaudeBot /> : null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-white text-gray-900">
          <ConditionalNavbar />
          {/* <Analytics /> */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              {/* Developer Console — full-page layout, no outer navbar */}
              <Route path="/developer/register" element={<DevRegister />} />
              <Route path="/developer/*" element={<DeveloperConsole />} />
              <Route path="/submit-tool" element={<DeveloperConsole />} />
              <Route path="/tool-comparison" element={<ToolComparison />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/:slug" element={<LessonDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsArticle />} />
              <Route path="/community" element={<CommunityFeed />} />
              {/* Legacy category routes */}
              <Route path="/apps/dex" element={<Dex />} />
              <Route path="/apps/interoperability" element={<Interoperability />} />
              <Route path="/apps/community-tools" element={<CommunityTools />} />
              <Route path="/apps/perps" element={<Web3Chat />} />
              <Route path="/apps/bounty-hub" element={<BountyHub />} />
              {/* Dynamic category routes */}
              <Route path="/apps/:categoryKey" element={<CategoryPage />} />
              <Route path="*" element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-white pt-16">
                  <h1 className="text-6xl font-black text-slate-900">404</h1>
                  <p className="text-slate-500 mt-2 text-lg">Page not found</p>
                  <a href="/" className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">Go Home</a>
                </div>
              } />
            </Routes>
          </main>
          <ConditionalFooter />
          <ConditionalBot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
