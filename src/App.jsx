import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import ClaudeBot from "./components/ClaudeBot";
import { Analytics } from "@vercel/analytics/react";

import Home from "./pages/Home";
import About from "./pages/About";
import Support from "./pages/Support";
import Apps from "./pages/Apps";
import SubmitTool from "./pages/SubmitTool";
import ToolComparison from "./pages/ToolComparison";
import Admin from "./pages/Admin";

import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import Academy from "./pages/Academy";
import LessonDetail from "./pages/LessonDetail";
import Profile from "./pages/Profile";

import Dex from "./pages/apps/Dex";
import OnchainAutonomy from "./pages/apps/OnchainAutonomy";
import Interoperability from "./pages/apps/Interoperability";
import CommunityTools from "./pages/apps/CommunityTools";
import Web3Chat from "./pages/apps/Web3Chat";
import BountyHub from "./pages/apps/BountyHub";

const ConditionalFooter = () => {
  const location = useLocation();
  const hideFooter = ["/login", "/signup"].includes(location.pathname);
  return !hideFooter ? <Footer /> : null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-white text-gray-900">
          <Navbar />
          <Analytics />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              <Route path="/submit-tool" element={<SubmitTool />} />
              <Route path="/tool-comparison" element={<ToolComparison />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/academy/:slug" element={<LessonDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />

              <Route path="/apps/dex" element={<Dex />} />
              <Route path="/apps/onchain-autonomy" element={<OnchainAutonomy />} />
              <Route path="/apps/interoperability" element={<Interoperability />} />
              <Route path="/apps/community-tools" element={<CommunityTools />} />
              <Route path="/apps/perps" element={<Web3Chat />} />
              <Route path="/apps/bounty-hub" element={<BountyHub />} />
              <Route path="*" element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-white pt-20">
                  <h1 className="text-6xl font-black text-slate-900">404</h1>
                  <p className="text-slate-500 mt-2 text-lg">Page not found</p>
                  <a href="/" className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">Go Home</a>
                </div>
              } />
            </Routes>
          </main>
          <ConditionalFooter />
          <ClaudeBot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
