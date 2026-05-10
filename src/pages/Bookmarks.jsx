import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useCourseBookmarks } from '../hooks/useCourseBookmarks';
import { Link } from 'react-router-dom';
import { 
  Bookmark, Trash2, ExternalLink, BookOpen, 
  Sparkles, LayoutGrid, ChevronRight, Search,
  ArrowUpRight, Clock, Box, Layers
} from 'lucide-react';
import ToolLogo from '../components/ToolLogo';
import SafeLink from '../components/SafeLink';

export default function Bookmarks() {
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { bookmarks: courseBookmarks, toggleBookmark: toggleCourseBookmark } = useCourseBookmarks();

  const totalSaved = bookmarks.length + courseBookmarks.length;

  return (
    <div className="min-h-screen bg-[#fafafa] pt-2 pb-32 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <header className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] shadow-sm">
                <Box size={12} /> Personal Archive
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Library</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-lg text-lg">
                Manage your curated collection of protocols, dApps, and educational materials.
              </p>
            </div>

            <div className="flex items-center gap-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Saved</span>
                <span className="text-3xl font-black text-slate-900">{totalSaved}</span>
              </div>
              <div className="h-10 w-px bg-slate-100" />
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Bonus</span>
                  <p className="text-emerald-600 font-black text-sm">Active</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Sparkles size={20} />
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Protocols Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                  <Layers size={24} className="text-indigo-600" />
                  Saved Protocols
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black ml-2">
                    {bookmarks.length}
                  </span>
                </h2>
              </div>

              {bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {bookmarks.map((tool, idx) => (
                      <motion.div
                        key={tool.id || tool._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 p-3 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                            <ToolLogo tool={tool} />
                          </div>
                          <div className="flex items-center gap-2">
                            <SafeLink
                              href={tool.url}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all duration-300"
                              title="Launch App"
                            >
                              <ArrowUpRight size={20} />
                            </SafeLink>
                            <button
                              onClick={() => toggleBookmark(tool)}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all duration-300"
                              title="Remove"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight group-hover:text-indigo-600 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tool.category}</p>
                          <div className="mt-4 flex items-center gap-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                              <Clock size={12} /> Added recently
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState 
                  title="Your shelf is empty" 
                  desc="Save protocols from the directory to see them here."
                  link="/apps/trading"
                  linkText="Explore Directory"
                />
              )}
            </section>

            {/* Courses Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                  <BookOpen size={24} className="text-blue-600" />
                  Curated Learning
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black ml-2">
                    {courseBookmarks.length}
                  </span>
                </h2>
              </div>

              {courseBookmarks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  <AnimatePresence mode="popLayout">
                    {courseBookmarks.map((course, idx) => (
                      <motion.div
                        key={course._id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all duration-300 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <BookOpen size={24} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors tracking-tight">{course.title}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{course.platform}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 px-4">
                          <SafeLink
                            href={course.url}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Start Learning"
                          >
                            <ArrowUpRight size={22} />
                          </SafeLink>
                          <button
                            onClick={() => toggleCourseBookmark(course)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-10 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-slate-400 font-bold text-sm">No courses in your queue yet.</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative space-y-8">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                  <LayoutGrid className="text-indigo-300" size={28} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight leading-tight">Pro Curation</h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    Organizing your Web3 workspace improves decision making speed by up to 40%.
                  </p>
                </div>
                
                <div className="space-y-4 py-6 border-y border-white/10">
                  <StatRow label="Protocols" val={bookmarks.length} />
                  <StatRow label="Learning" val={courseBookmarks.length} />
                </div>

                <Link 
                  to="/apps/trading" 
                  className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all"
                >
                  Discover More <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-900 mb-6">Quick Filters</h3>
              <div className="flex flex-wrap gap-2">
                {['All', 'Trading', 'DeFi', 'NFTs', 'Security'].map(f => (
                  <button key={f} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-500 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, val }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className="text-xl font-black">{val}</span>
    </div>
  );
}

function EmptyState({ title, desc, link, linkText }) {
  return (
    <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-sm">
        <Search className="text-slate-300" size={32} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto">{desc}</p>
      <Link to={link} className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
        {linkText} <ChevronRight size={16} />
      </Link>
    </div>
  );
}
