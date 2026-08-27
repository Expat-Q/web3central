import React, { useState, useEffect, useLayoutEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CategorySidebar from "./components/CategorySidebar";
import { AuthProvider } from "./context/AuthContext";
import { MetricsProvider } from "./context/MetricsContext";
import ClaudeBot from "./components/ClaudeBot";
// import { Analytics } from "@vercel/analytics/react";

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'Web3Central',
  projectId: '3fcc6b14d4919618b774906e347683b9', 
  chains: [mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http('https://cloudflare-eth.com'),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http()
  }
});
const queryClient = new QueryClient();

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
import Apps from "./pages/Apps";
import CategoryPage from "./pages/apps/CategoryPage";

// Lazy-loaded secondary routes for optimal bundle size & fast initial page loads
const About = React.lazy(() => import("./pages/About"));
const Support = React.lazy(() => import("./pages/Support"));
const DeveloperConsole = React.lazy(() => import("./pages/DeveloperConsole"));
const DevRegister = React.lazy(() => import("./pages/developer/DevRegister"));
const ToolComparison = React.lazy(() => import("./pages/ToolComparison"));
const Admin = React.lazy(() => import("./pages/Admin"));
const Quests = React.lazy(() => import("./pages/Quests"));
const Bookmarks = React.lazy(() => import("./pages/Bookmarks"));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard"));
const Signup = React.lazy(() => import("./pages/auth/Signup"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const ForgotPassword = React.lazy(() => import("./pages/auth/ForgotPassword"));
const OAuthCallback = React.lazy(() => import("./pages/auth/OAuthCallback"));
const Academy = React.lazy(() => import("./pages/Academy"));
const LessonDetail = React.lazy(() => import("./pages/LessonDetail"));
const Profile = React.lazy(() => import("./pages/Profile"));
const News = React.lazy(() => import("./pages/News"));
const NewsArticle = React.lazy(() => import("./pages/NewsArticle"));
const CommunityFeed = React.lazy(() => import("./pages/CommunityFeed"));
const Airdrops = React.lazy(() => import("./pages/Airdrops"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white py-12">
    <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading...</span>
  </div>
);

const ConditionalFooter = () => {
  const location = useLocation();
  const hideFooter = ["/login", "/signup", "/oauth/callback", "/forgot-password"].includes(location.pathname)
    || location.pathname.startsWith("/developer");
  return !hideFooter ? <Footer /> : null;
};

const ConditionalNavbar = ({ setSidebarOpen }) => {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/developer");
  return !hideNavbar ? <Navbar setSidebarOpen={setSidebarOpen} /> : null;
};

import PushNotificationPrompt from "./components/PushNotificationPrompt";
import FloatingNotificationToast from "./components/FloatingNotificationToast";

const ConditionalBot = () => {
  const location = useLocation();
  const hideBot = ["/login", "/signup", "/oauth/callback", "/forgot-password"].includes(location.pathname)
    || location.pathname.startsWith("/developer");
  return !hideBot ? <ClaudeBot /> : null;
};

// Pages that should NOT show the sidebar
const NO_SIDEBAR_ROUTES = [
  "/login", "/signup", "/oauth/callback", "/admin", "/forgot-password"
];

const AppLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const hideSidebar =
    ["/login", "/signup", "/oauth/callback", "/forgot-password"].includes(location.pathname) ||
    NO_SIDEBAR_ROUTES.some((r) => location.pathname === r);

  if (hideSidebar) {
    // No sidebar — render plain layout
    return (
      <div className="min-h-screen flex flex-col bg-white text-gray-900">
        <ConditionalNavbar setSidebarOpen={setSidebarOpen} />
        {/* <Analytics /> */}
        <main className="flex-grow">
          <React.Suspense fallback={<PageLoader />}>
            <AppRoutes sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </React.Suspense>
        </main>
        <ConditionalFooter />
        <ConditionalBot />
        <PushNotificationPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900">
      {/* Fixed top navbar */}
      <ConditionalNavbar setSidebarOpen={setSidebarOpen} />

      {/* Sidebar + content flex */}
      <div className="flex">
        {/* Sidebar — full-height, starts from top-0 via z-[51] */}
        <CategorySidebar
          activeSection={activeSection}
          onSelect={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Scrollable page content */}
        <div className="flex-1 min-w-0">
          {/* Spacer for fixed navbar */}
          <div className="h-16" />
          <main className="flex-grow">
            <React.Suspense fallback={<PageLoader />}>
              <AppRoutes sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            </React.Suspense>
          </main>
          <ConditionalFooter />
        </div>
      </div>

      <ConditionalBot />
      <PushNotificationPrompt />
      <FloatingNotificationToast />
    </div>
  );
};

// Pass sidebar controls down so pages can still open the mobile drawer
const AppRoutes = ({ sidebarOpen, setSidebarOpen }) => (
  <Routes>
    <Route path="/" element={<Home sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
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
    <Route path="/quests" element={<Quests />} />
    <Route path="/bookmarks" element={<Bookmarks />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/oauth/callback" element={<OAuthCallback />} />
    <Route path="/news" element={<News />} />
    <Route path="/news/:slug" element={<NewsArticle />} />
    <Route path="/community" element={<CommunityFeed />} />
    <Route path="/apps/airdrops" element={<Airdrops />} />
    {/* Dynamic category routes */}
    <Route path="/apps/:categoryKey" element={<CategoryPage />} />
    <Route path="*" element={
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white pt-16">
        <h1 className="text-6xl font-black text-slate-900">404</h1>
        <p className="text-slate-500 mt-2 text-lg">Page not found</p>
        <a href="/" className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">Go Home</a>
      </div>
    } />
  </Routes>
);

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MetricsProvider>
            <AuthProvider>
              <Router>
                <ScrollToTop />
                <AppLayout />
              </Router>
            </AuthProvider>
          </MetricsProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
