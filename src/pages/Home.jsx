import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { Link } from "react-router-dom";
import { fetchToolsData, fetchCommunitySpotlight, fetchStatsOverview } from "../services/apiService";
import { ArrowLeftRight, TrendingUp, Network, Bot, Users, Target, Star, ExternalLink } from "lucide-react";

const AnimatedCounter = ({ value, duration = 2, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = parseInt(value, 10);
      if (start === end) return;
      const totalMilSecDur = parseInt(duration);
      const incrementTime = (totalMilSecDur / end) * 1000;

      const timer = setInterval(() => {
        start += 1;
        setCount(String(start));
        if (start === end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [value, duration, isInView]);

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
};

export default function Home() {
  const [appsData, setAppsData] = useState(null);
  const [communitySpotlight, setCommunitySpotlight] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [toolsData, spotlightData, statsData] = await Promise.all([
          fetchToolsData(),
          fetchCommunitySpotlight(),
          fetchStatsOverview()
        ]);
        setAppsData(toolsData);
        setCommunitySpotlight(spotlightData);
        setPlatformStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div>
            <p className="text-purple-600 font-bold mb-1">Connecting to Web3Central Engine...</p>
          </div>
        </div>
      </div>
    );
  }

  const services = [
    { title: "Decentralized exchanges", icon: <ArrowLeftRight className="w-6 h-6" />, desc: "Swap assets securely through top-tier peer-to-peer protocols.", path: "/apps/dex" },
    { title: "Perpetual protocols", icon: <TrendingUp className="w-6 h-6" />, desc: "Trade with leverage on decentralized derivative platforms.", path: "/apps/perps" },
    { title: "Interoperability bridges", icon: <Network className="w-6 h-6" />, desc: "Move your assets seamlessly across different blockchains.", path: "/apps/interoperability" },
    { title: "Autonomous protocol", icon: <Bot className="w-6 h-6" />, desc: "Experience the power of self-governing on-chain systems.", path: "/apps/onchain-autonomy" },
    { title: "Community tools", icon: <Users className="w-6 h-6" />, desc: "Essential utilities for decentralized collaboration and voting.", path: "/apps/community-tools" },
    { title: "Bounty Hub", icon: <Target className="w-6 h-6" />, desc: "Discover and complete Web3 bounties to earn rewards.", path: "/apps/bounty-hub" },
  ];

  const allTools = appsData ? Object.values(appsData).flat() : [];
  const activeToolsCount = platformStats?.activeTools || allTools.length || 0;
  const inReviewCount = platformStats?.pendingTools || 0;
  const communityToolsList = appsData?.communityTools || [];
  const recentlyAdded = [...communityToolsList].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 8);

  const recentToolsMarquee = (tools) => (
    <>
      {tools.map((t, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-purple-500 font-bold">NEW APP LISTED</span>
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <Link to={`/apps/${t.category}`} className="text-purple-900 hover:text-purple-600 transition-colors cursor-pointer">
            {t.name || t.title}
          </Link>
          <span className="mx-4 text-purple-300">|</span>
        </span>
      ))}
    </>
  );

  // No more hardcoded fallback — trending tools are sourced from real community data only

  const faqs = [
    { q: "What is web3central?", a: "web3central is a clean and professional hub for all things decentralized, from academy tracks to protocol comparisons." },
    { q: "How do I start learning?", a: "Visit our Academy section to explore structured paths designed by industry experts." },
    { q: "Is it free to use?", a: "Yes, web3central is an open resource for the community to explore and learn about Web3." },
    { q: "What are Antidrain Tools?", a: "Zuns Antidrain Tools are a suite of security protocols designed to prevent unauthorized withdrawals and protect your on-chain assets." },
  ];

  const slideFromLeft = {
    initial: { opacity: 0, x: -100 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const slideFromRight = {
    initial: { opacity: 0, x: 100 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  // Derived metrics for Home
  const bs = communitySpotlight?.[0]?.builderSpotlight || communitySpotlight?.builderSpotlight;

  // Collect trending tools from community items based on ratingCount
  // We simulate ratingCount fallback to 0 until rating engine is built
  const activeTrendingTools = appsData?.communityTools?.length
    ? [...appsData.communityTools].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 5)
    : [];

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <div className="h-24" />

      {/* Scrolling Headline News for Newly Added Tools */}
      {recentlyAdded.length > 0 && (
        <div className="w-full bg-purple-100 text-purple-700 border-b border-purple-200 overflow-hidden relative flex font-medium text-sm py-1.5">
          <div className="whitespace-nowrap flex items-center gap-10 animate-marquee z-10">
            {recentToolsMarquee(recentlyAdded)}
            <span aria-hidden="true" className="flex items-center gap-10">{recentToolsMarquee(recentlyAdded)}</span>
          </div>
        </div>
      )}

      {/* 2nd Section: Hero */}
      <motion.section
        {...slideFromLeft}
        className="py-10 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16 lg:min-h-[70vh]"
      >
        <div className="flex-1 space-y-8 order-1">
          <div className="space-y-2">
            <span className="text-gray-400 font-medium tracking-widest text-xs uppercase block">Welcome to web3central</span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              The Hub for <span className="text-purple-600">On-Chain</span> Mastery.
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed font-normal">
            Web3Central is the trusted hub for community-built Web3 tools. We curate the most useful decentralized applications built by the community, spanning DeFi, interoperability, automation, analytics, and social tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link to="/apps/community-tools" className="w-full sm:w-auto text-center px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 text-base">
              Start Your Journey
            </Link>
            <Link to="/tool-comparison" className="w-full sm:w-auto text-center px-8 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all text-base">
              Compare Tools
            </Link>
          </div>
        </div>
        <div className="flex-1 w-full order-2 hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800"
            alt="Web3 Protocol Design"
            className="rounded-[2.5rem] shadow-2xl shadow-purple-200/50 border border-gray-100 w-full max-w-[500px] lg:h-[380px] object-cover"
          />
        </div>
      </motion.section>

      {/* Animated Stats Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
          <div className="text-center">
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
              <AnimatedCounter value={activeToolsCount} suffix="+" />
            </h3>
            <p className="text-gray-500 font-medium">Active Tools</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
              <AnimatedCounter value={inReviewCount} />
            </h3>
            <p className="text-gray-500 font-medium">In Review</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
              <AnimatedCounter value={platformStats?.users || 0} />
            </h3>
            <p className="text-gray-500 font-medium">Registered Users</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
              <AnimatedCounter value={Object.keys(appsData || {}).length || 7} />
            </h3>
            <p className="text-gray-500 font-medium">Categories</p>
          </div>
        </div>
      </section>

      {/* 3rd Section: About Us (Grid layout stating services) */}
      <motion.section
        {...slideFromRight}
        className="py-16 bg-gray-50/50"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              A comprehensive ecosystem designed to streamline your decentralized experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <Link to={service.path} key={i}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="h-full p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6">
                    <span className="group-hover:scale-110 transition-transform">{service.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-base">{service.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 4th Section: Builder spotlight section and trending tools */}
      <motion.section
        {...slideFromLeft}
        className="py-16 px-6 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Enhanced Builder Spotlight */}
          <div className="space-y-6 flex flex-col">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Builder Spotlight</h2>
              <p className="text-gray-500 text-base">Featuring revolutionary tools and visionary developers.</p>
            </div>

            <div className="flex-1 p-8 rounded-[2rem] bg-gradient-to-br from-purple-50 via-white to-indigo-50 border border-purple-100/60 relative overflow-hidden group flex flex-col">
              {/* Spotlight glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-gradient-to-b from-purple-200/40 to-transparent rounded-full blur-[80px] pointer-events-none" />


              <div className="relative z-10 flex flex-col flex-1 space-y-5">
                {/* Header: Avatar + Name + Socials */}
                <div className="flex items-center gap-4 pt-4">
                  {bs?.xProfileImageUrl ? (
                    <img src={bs.xProfileImageUrl} alt={bs?.name} className="w-16 h-16 rounded-full object-cover shadow-lg shadow-purple-200/40 ring-4 ring-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-200/40 ring-4 ring-white">
                      {bs?.name ? bs.name.charAt(0).toUpperCase() : "Z"}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-gray-900">{bs?.name || "Zun20"}</h4>
                    <p className="text-gray-500 text-sm">{bs?.role || "Security Researcher & Tool Builder"}</p>
                    <div className="flex gap-3 mt-1.5">
                      {bs?.twitter && (
                        <a href={bs.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                        </a>
                      )}
                      {bs?.github && (
                        <a href={bs.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {bs?.description || (
                    <>Creator of multiple security tools including <span className="text-purple-600 font-semibold">Anti Drain Tool</span> and <span className="text-purple-600 font-semibold">Poly Whales Tracker</span>. Known for building practical tools that protect users.</>
                  )}
                </p>

                {/* Featured Tools */}
                <div className="space-y-3 flex-1 flex flex-col justify-end">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured Tools</h5>
                  <div className="space-y-2">
                    {bs?.featuredTools?.length > 0 ? (
                      bs.featuredTools.map((ft, i) => (
                        <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3 hover:border-purple-200 hover:bg-purple-50/30 transition-colors group/tool shadow-sm">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white group-hover/tool:scale-110 transition-transform flex-shrink-0">
                            {ft.initial || ft.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{ft.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{ft.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3 hover:border-purple-200 hover:bg-purple-50/30 transition-colors group/tool shadow-sm">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white group-hover/tool:scale-110 transition-transform shrink-0">
                            AD
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">Anti Drain Tool</p>
                            <p className="text-[11px] text-gray-500 truncate">Security tool protecting users from malicious drain transactions</p>
                          </div>
                        </div>
                        <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3 hover:border-purple-200 hover:bg-purple-50/30 transition-colors group/tool shadow-sm">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white group-hover/tool:scale-110 transition-transform shrink-0">
                            PW
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">Poly Whales Tracker</p>
                            <p className="text-[11px] text-gray-500 truncate">Tracks bets placed on Polymarket by top performing traders</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="pt-4 mt-auto border-t border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-700">{bs?.rating || "4.9"} Community Rating</span>
                  </div>
                  <Link to="/apps/community-tools" className="px-4 py-2 bg-purple-600 text-white text-[11px] font-bold rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center gap-1">
                    View All Tools <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Tools with Analytics */}
          <div className="space-y-6 flex flex-col">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900 italic underline decoration-purple-600/30">Trending Tools</h2>
              <p className="text-gray-500 text-base">Top rated tools curated by the community.</p>
            </div>
            <div className="grid gap-3 flex-1 content-start">
              {activeTrendingTools.map((tool, i) => (
                <div key={i} className="flex items-center justify-between p-3 md:p-4 border border-gray-100 rounded-xl md:rounded-[1.2rem] bg-white hover:bg-purple-50/50 hover:border-purple-100 transition-all group overflow-hidden relative">
                  <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <span className="text-lg md:text-2xl font-black text-gray-200 w-6 md:w-8 shrink-0">0{i + 1}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-sm md:text-lg text-gray-900 block truncate group-hover:text-purple-600">{tool.name || tool.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 rounded-md shrink-0">
                          ⭐ {tool.averageRating || tool.rating || "4.8"}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 truncate">
                          {tool.ratingCount ? `${tool.ratingCount} Reviews` : (tool.analytics || "Community Tool")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right relative z-10 shrink-0 ml-4 hidden md:block">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">CATEGORY</p>
                    <p className="text-purple-600 font-bold text-sm capitalize">{tool.category || "General"}</p>
                  </div>
                </div>
              ))}
              <Link to="/apps/community-tools" className="block text-center mt-2 py-3 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 font-bold hover:border-purple-200 hover:text-purple-600 transition-all text-sm">
                Explore Community Tools ↗
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        {...slideFromRight}
        className="py-8 bg-gray-50 border-t border-gray-100 rounded-t-[3rem]"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-6 space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Got Questions?</h2>
            <p className="text-gray-500 text-base">Everything you need to know about the platform.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-gray-200 overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-900 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[11px] font-bold text-purple-700">{i + 1}</span>
                    {faq.q}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? "auto" : 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 text-gray-600 text-sm leading-relaxed pl-14">
                    {faq.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">Stay Updated.</h2>
              <p className="text-gray-500 text-sm max-w-sm">
                Join our community of builders.
              </p>
            </div>
            <form className="flex gap-3 w-full md:w-auto" onSubmit={(e) => { e.preventDefault(); alert('Newsletter coming soon!'); }}>
              <input
                type="email"
                placeholder="Email"
                className="flex-1 md:w-56 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors text-sm text-gray-900 placeholder:text-gray-400"
              />
              <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg text-sm">
                Join
              </button>
            </form>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
