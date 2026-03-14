import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Settings,
  Users,
  Share2,
  ShieldAlert,
  Lightbulb,
  Mail,
  User,
  Send,
  Copy,
  CheckCircle
} from "lucide-react";

export default function Support() {
  const [copied, setCopied] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
  const walletAddress = "0xFE15279535Fb336746B4B98DB245b5C492BD1c46";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormStatus("sending");
    setTimeout(() => setFormStatus("success"), 1500);
    setTimeout(() => setFormStatus(null), 5000);
  };

  const slideFromLeft = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const slideFromRight = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const supportLinks = [
    {
      title: "General Support",
      desc: "Having issues with navigation or connectivity? Reach out to our helpdesk for direct support.",
      icon: <MessageCircle className="w-8 h-8 text-purple-600" />,
      href: "mailto:support@web3central.io?subject=General Support Request",
      color: "purple"
    },
    {
      title: "Technical Assistance",
      desc: "Encountered a bug or technical challenge? Our devs can help troubleshoot.",
      icon: <Settings className="w-8 h-8 text-indigo-600" />,
      href: "mailto:tech@web3central.io?subject=Technical Assistance",
      color: "indigo"
    },
    {
      title: "Partnerships",
      desc: "Interested in featuring your project on web3central? Let’s collaborate and grow together.",
      icon: <Users className="w-8 h-8 text-pink-600" />,
      href: "mailto:partnerships@web3central.io?subject=Partnership Inquiry",
      color: "pink"
    },
    {
      title: "Community Help",
      desc: "Join our community and get instant feedback from builders and users.",
      icon: <Share2 className="w-8 h-8 text-blue-600" />,
      href: "https://x.com/web3aborode",
      color: "blue"
    },
    {
      title: "Security",
      desc: "Report vulnerabilities or suspicious activity. Help us keep Web3 safe.",
      icon: <ShieldAlert className="w-8 h-8 text-red-600" />,
      href: "mailto:security@web3central.io?subject=Security Report",
      color: "red"
    },
    {
      title: "Feedback & Suggestions",
      desc: "Your ideas shape web3central. Tell us what to improve or what features you’d love next.",
      icon: <Lightbulb className="w-8 h-8 text-yellow-600" />,
      href: "https://formspree.io/f/myzbqdnl",
      color: "yellow"
    },
  ];

  return (
    <div className="relative min-h-screen pt-24 pb-24 px-6 overflow-hidden bg-white">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-60" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 opacity-60" />

      {/* HEADER */}
      <motion.div
        variants={slideFromLeft}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto relative z-10 text-center mb-16"
      >
        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-gray-900"
        >
          How can we <span className="text-purple-600">help you?</span>
        </motion.h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
          Need technical assistance, partnership info, or have feedback? Our team is ready to help you navigate the on-chain world.
        </p>
      </motion.div>

      {/* SUPPORT CARDS GRID */}
      <motion.section
        variants={slideFromRight}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20 relative z-10"
      >
        {supportLinks.map((item, i) => (
          <motion.a
            key={i}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-purple-100 transition-all group flex flex-col h-full"
          >
            <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 flex items-center justify-center mb-8 border border-${item.color}-100 group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
            <p className="text-gray-500 text-base mb-8 flex-1 leading-relaxed">
              {item.desc}
            </p>
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm mt-auto pt-4">
              Contact Now <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.a>
        ))}
      </motion.section>

      {/* CONTACT FORM & DONATION SECTION */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        {/* Contact Form */}
        <motion.div
          variants={slideFromLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-gray-50/50 border border-gray-100 p-8 md:p-12 rounded-[2.5rem]"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Direct Inquiry</h2>
            <p className="text-gray-500">Send us a message and we'll get back to you shortly.</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-white border border-gray-100 rounded-2xl px-12 py-4 text-gray-900 font-normal outline-none focus:border-purple-600 transition-all placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full bg-white border border-gray-100 rounded-2xl px-12 py-4 text-gray-900 font-normal outline-none focus:border-purple-600 transition-all placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-2">Message</label>
              <textarea
                required
                rows={4}
                placeholder="How can we help?"
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-normal outline-none focus:border-purple-600 transition-all placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>

            <button
              disabled={formStatus === "sending" || formStatus === "success"}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2 ${formStatus === "success"
                ? "bg-green-500 shadow-green-200"
                : "bg-gray-900 hover:bg-purple-600 shadow-gray-200"
                }`}
            >
              {formStatus === "sending" ? "Processing..." : formStatus === "success" ? <>Sent Successfully <CheckCircle className="w-5 h-5" /></> : <>Send Message <Send className="w-5 h-5" /></>}
            </button>
          </form>
        </motion.div>

        {/* Donation Section */}
        <motion.div
          variants={slideFromRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col justify-center"
        >
          <div className="p-10 md:p-14 bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <h2 className="text-3xl font-bold mb-4 tracking-tight text-gray-900">Support Innovation</h2>
            <p className="text-gray-500 text-lg mb-10 font-normal leading-relaxed">
              Help us maintain and scale web3central infrastructure. Every contribution fuels open-source research and community-driven tools.
            </p>

            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 relative group overflow-hidden">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">EVM Donation Gateway</p>
              <div className="font-mono text-gray-600 text-sm md:text-base break-all mb-8 bg-white p-6 rounded-2xl border border-gray-100 select-all">
                {walletAddress}
              </div>

              <motion.button
                onClick={copyToClipboard}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${copied
                  ? "bg-green-500 text-white shadow-green-200"
                  : "bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700"
                  }`}
              >
                {copied ? <>Copied to Clipboard <CheckCircle className="w-5 h-5" /></> : <>Copy Address <Copy className="w-5 h-5" /></>}
              </motion.button>
            </div>

            <div className="mt-8 flex items-center gap-6 justify-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Supported Networks:</span>
              <div className="flex gap-3 items-center">
                {/* Ethereum */}
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center" title="Ethereum">
                  <svg width="14" height="14" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#343434" />
                    <path d="M127.962 0L0 212.32L127.962 287.959V154.158V0Z" fill="#8C8C8C" />
                    <path d="M127.961 312.187L126.386 314.107V412.306L127.961 416.905L255.999 236.587L127.961 312.187Z" fill="#3C3C3B" />
                    <path d="M127.962 416.905V312.187L0 236.587L127.962 416.905Z" fill="#8C8C8C" />
                    <path d="M127.961 287.958L255.923 212.32L127.961 154.159V287.958Z" fill="#141414" />
                    <path d="M0.001 212.32L127.962 287.958V154.159L0.001 212.32Z" fill="#393939" />
                  </svg>
                </div>
                {/* Base */}
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center" title="Base">
                  <svg width="14" height="14" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="white" />
                  </svg>
                </div>
                {/* Polygon */}
                <div className="w-7 h-7 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center" title="Polygon">
                  <svg width="14" height="14" viewBox="0 0 38 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M28.5 12.3C27.9 11.9 27.1 11.9 26.4 12.3L21.1 15.4L17.5 17.4L12.3 20.5C11.7 20.9 10.9 20.9 10.2 20.5L6.1 18.1C5.5 17.7 5.1 17 5.1 16.3V11.5C5.1 10.8 5.4 10.1 6.1 9.7L10.1 7.4C10.7 7 11.5 7 12.2 7.4L16.2 9.7C16.8 10.1 17.2 10.8 17.2 11.5V14.6L20.8 12.5V9.3C20.8 8.6 20.5 7.9 19.8 7.5L12.3 3.2C11.7 2.8 10.9 2.8 10.2 3.2L2.6 7.6C1.9 8 1.6 8.7 1.6 9.4V17.9C1.6 18.6 1.9 19.3 2.6 19.7L10.2 24C10.8 24.4 11.6 24.4 12.3 24L17.5 21L21.1 18.9L26.3 15.8C26.9 15.4 27.7 15.4 28.4 15.8L32.4 18.1C33 18.5 33.4 19.2 33.4 19.9V24.7C33.4 25.4 33.1 26.1 32.4 26.5L28.5 28.8C27.9 29.2 27.1 29.2 26.4 28.8L22.4 26.5C21.8 26.1 21.4 25.4 21.4 24.7V21.7L17.8 23.8V26.9C17.8 27.6 18.1 28.3 18.8 28.7L26.4 33C27 33.4 27.8 33.4 28.5 33L36.1 28.6C36.7 28.2 37.1 27.5 37.1 26.8V18.3C37.1 17.6 36.8 16.9 36.1 16.5L28.5 12.3Z" fill="#8247E5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
