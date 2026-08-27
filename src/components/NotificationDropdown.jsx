import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, CheckCheck, ExternalLink, Sparkles, 
  TrendingUp, Newspaper, Layers, ShieldCheck, X, Volume2, Globe, Send
} from 'lucide-react';
import { requestPushPermission, triggerPushNotification } from '../lib/pushNotifications';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New Protocol Added: PureAlpha',
    message: 'Discover crypto projects before the crowd. Ranked by 600+ hand-picked wallets by @zacxbt.',
    type: 'protocol',
    category: 'Analytics',
    timestamp: 'Just now',
    link: '/apps/analytics',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'New Protocol Added: MintGo',
    message: 'Advanced minting engine with contract entry point analysis and anti-drain protection.',
    type: 'protocol',
    category: 'Tools',
    timestamp: '10m ago',
    link: '/apps/communityTools',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'New Protocol Added: Waypoint',
    message: 'Discover NFTs early. Built under Onchain Tools.',
    type: 'protocol',
    category: 'Tools',
    timestamp: '30m ago',
    link: '/apps/communityTools',
    read: false,
  },
  {
    id: 'notif-4',
    title: 'Builder Spotlight: zac.eth featured!',
    message: 'Check out the new Builder Spotlight story featuring @zacxbt (#1 Trencher on Ethos).',
    type: 'spotlight',
    category: 'Community',
    timestamp: '1h ago',
    link: '/',
    read: false,
  },
  {
    id: 'notif-5',
    title: 'Onchain Metrics Updated: Perps & DEX TVL',
    message: 'DeFiLlama & CoinGecko live volume & market metrics refreshed across all 19 categories.',
    type: 'metrics',
    category: 'Metrics',
    timestamp: '2h ago',
    link: '/apps',
    read: true,
  },
  {
    id: 'notif-6',
    title: 'Academy & News Update',
    message: 'New pentesting guide and Smart Contract Auditing handbook published in Web3Central Academy.',
    type: 'news',
    category: 'Academy',
    timestamp: '5h ago',
    link: '/academy',
    read: true,
  }
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('web3central_notifs');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [pushPermission, setPushPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('web3central_notifs', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications', e);
    }
  }, [notifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live dApp notifications from backend API & trigger OS push alerts
  useEffect(() => {
    let isMounted = true;

    async function loadLiveNotifs() {
      try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
        const res = await fetch(`${API_BASE}/tools/recent-notifications`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success || !Array.isArray(json.data)) return;

        if (isMounted && json.data.length > 0) {
          const liveItems = json.data;

          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifs = liveItems.filter(item => !existingIds.has(item.id));

            if (newNotifs.length > 0) {
              // Trigger push notification for newly added dApp if permission granted
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const latest = newNotifs[0];
                triggerPushNotification({
                  title: `🔔 ${latest.title}`,
                  body: latest.message,
                  url: latest.link || '/apps'
                });
              }

              return [...newNotifs, ...prev];
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Failed to fetch live notifications:', err);
      }
    }

    loadLiveNotifs();
    const interval = setInterval(loadLiveNotifs, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleEnablePush = async () => {
    const perm = await requestPushPermission();
    setPushPermission(perm);
  };

  const handleSendTestPush = async () => {
    if (pushPermission !== 'granted') {
      const perm = await requestPushPermission();
      setPushPermission(perm);
    }

    // 1. Trigger local floating toast & browser notification
    await triggerPushNotification({
      title: '🚀 Web3Central Live Test Alert',
      body: 'Notifications are working perfectly! Live updates for new dApps, TVL surges, and price action movers are active.',
      url: '/apps',
      type: 'protocol'
    });

    // 2. Trigger backend WebPush server payload
    try {
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
      await fetch(`${API_BASE}/notifications/send-test`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend WebPush test trigger failed:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        if (!n.read && pushPermission === 'granted') {
          triggerPushNotification({
            title: `Web3Central: ${n.title}`,
            body: n.message,
            url: n.link || '/'
          });
        }
        return { ...n, read: true };
      }
      return n;
    }));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'protocols') return n.type === 'protocol' || n.type === 'spotlight';
    if (activeFilter === 'onchain') return n.type === 'tvl' || n.type === 'price' || n.type === 'volume' || n.type === 'metrics';
    if (activeFilter === 'news') return n.type === 'news';
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'protocol':
        return <Layers size={16} className="text-purple-600" />;
      case 'tvl':
        return <TrendingUp size={16} className="text-emerald-600" />;
      case 'price':
        return <Sparkles size={16} className="text-amber-500" />;
      case 'volume':
        return <Volume2 size={16} className="text-blue-600" />;
      case 'spotlight':
        return <Sparkles size={16} className="text-amber-500" />;
      case 'metrics':
        return <TrendingUp size={16} className="text-emerald-600" />;
      case 'news':
        return <Newspaper size={16} className="text-blue-600" />;
      default:
        return <Bell size={16} className="text-purple-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all border border-transparent hover:border-purple-100"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-600 text-[9px] font-black text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-purple-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 text-purple-300">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Notification Center</h3>
                <p className="text-[11px] text-purple-200/80 font-medium">Real-time dApp & market push alerts</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-all"
              >
                <CheckCheck size={13} /> Mark read
              </button>
            )}
          </div>

          {/* Browser Push Permission Banner & Test Action */}
          <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-purple-600 shrink-0" />
              <span className="text-[11px] font-bold text-purple-950">
                {pushPermission === 'granted' ? 'Native OS Push Alerts Active' : 'Get push alerts when away'}
              </span>
            </div>

            {pushPermission === 'granted' ? (
              <button
                onClick={handleSendTestPush}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shrink-0 transition-colors shadow-sm flex items-center gap-1"
              >
                <Send size={10} /> Test Alert
              </button>
            ) : (
              <button
                onClick={handleEnablePush}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[10px] shrink-0 transition-colors shadow-sm"
              >
                Enable Push
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'protocols', label: 'dApps' },
              { id: 'onchain', label: 'Onchain & TVL' },
              { id: 'news', label: 'Academy' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl capitalize text-[11px] transition-all whitespace-nowrap ${
                  activeFilter === filter.id
                    ? 'bg-white text-purple-700 shadow-sm font-bold border border-purple-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 transition-all flex items-start gap-3 relative group cursor-pointer ${
                    n.read ? 'bg-white hover:bg-gray-50/80' : 'bg-purple-50/40 hover:bg-purple-50/80'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-gray-100 shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">
                        {n.category}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">{n.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 mt-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 mt-2 hover:underline"
                      >
                        Explore <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-400 text-xs font-semibold">
                No notifications in this category.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center flex items-center justify-between px-4">
            <span className="text-[10px] font-bold text-gray-400">
              {pushPermission === 'granted' ? '🟢 Push Alerts Active' : '🔴 Push Disabled'}
            </span>
            <Link
              to="/apps"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
            >
              Explore All Protocols →
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
