import React from "react";
import { FaDiscord, FaTelegramPlane, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="py-8 border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">

        <p className="text-purple-900 text-[13px] font-bold opacity-70 text-center">
          © {new Date().getFullYear()} web3central. All rights reserved. Professional Web3 Hub.
        </p>

        <div className="flex items-center space-x-5 text-gray-400">
          <a href="#" className="hover:text-purple-600 transition-colors"><FaTwitter size={18} /></a>
          <a href="#" className="hover:text-purple-600 transition-colors"><FaDiscord size={18} /></a>
          <a href="#" className="hover:text-purple-600 transition-colors"><FaTelegramPlane size={18} /></a>
        </div>
      </div>
    </footer>
  );
}
