import React, { useState } from "react";
import ExitWarningModal from "./ExitWarningModal";

export default function SafeLink({ url, children, className, verified = false, hideDomain = false }) {
  const [open, setOpen] = useState(false);

  // Extract domain name from URL
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch (e) {
      return url;
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    setOpen(true);
  };

  const confirmExit = () => {
    window.open(url, "_blank", "noopener noreferrer");
    setOpen(false);
  };

  return (
    <>
      <a href={url} onClick={handleClick} className={className}>
        <div className="flex items-center justify-between w-full">
          {children}
          {verified && (
            <span className="inline-flex items-center ml-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        {!hideDomain && <div className="text-xs text-gray-400 mt-1">{getDomain(url)}</div>}
      </a>

      {open && (
        <ExitWarningModal
          url={url}
          onCancel={() => setOpen(false)}
          onConfirm={confirmExit}
        />
      )}
    </>
  );
}
