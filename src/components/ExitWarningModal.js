import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ExternalLink } from "lucide-react";

export default function ExitWarningModal({ url, onCancel, onConfirm, verified = false }) {
  // Extract domain name from URL
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch (e) {
      return url;
    }
  };

  const domain = getDomain(url);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-2xl p-6 w-96 shadow-xl border border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-4">
          <ShieldAlert className="text-yellow-400" size={28} />
          <h2 className="text-lg font-semibold text-gray-100">Leaving Web3Central</h2>
        </div>

        <p className="text-gray-300 text-sm mb-4">
          You are about to visit an external website.
          Please verify that this is the correct domain:
        </p>

        <div className="flex items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-100">{domain}</h3>
          {verified && (
            <span className="inline-flex items-center ml-2 px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400 border border-green-800/50">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>

        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-gray-200 text-sm break-words mb-5">
          {url}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center space-x-2 transition"
          >
            <span>Continue</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
