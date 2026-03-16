import React, { useState, useEffect } from 'react';
import { Download, MonitorSmartphone } from 'lucide-react';

export default function InstallButton({ toolName }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      // Can log to analytics here in the future
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt available, user might be on iOS Safari or already installed
      // Could show a "How to install on iOS" modal here instead
      alert("To install on iOS:\n1. Tap the Share button at the bottom of Safari\n2. Scroll down and tap 'Add to Home Screen'");
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <button 
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-emerald-600 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap"
      >
        <MonitorSmartphone size={12} />
        Installed
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap"
      title={`Install ${toolName || 'App'}`}
    >
      <Download size={12} />
      Install
    </button>
  );
}
