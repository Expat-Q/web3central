import { useState } from "react";

export default function useOutboundGuard() {
  const [pendingUrl, setPendingUrl] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const triggerGuard = (url) => {
    setPendingUrl(url);
    setShowPopup(true);
  };

  const proceed = () => {
    window.open(pendingUrl, "_blank", "noopener,noreferrer");
    setShowPopup(false);
  };

  const cancel = () => {
    setPendingUrl(null);
    setShowPopup(false);
  };

  return { showPopup, pendingUrl, triggerGuard, proceed, cancel };
}
