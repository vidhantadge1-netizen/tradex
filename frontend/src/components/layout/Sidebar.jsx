import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Bookmark,
  History,
  Shield,
  Sparkles,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Stock Market', path: '/market', icon: TrendingUp },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'Trade History', path: '/history', icon: History }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-navy-900 border-r border-navy-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-navy-800">
            <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/10">
                <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-white">
                  Trade<span className="text-emerald-400">X</span>
                </span>
                <span className="block text-[9px] font-mono tracking-widest text-slate-400 uppercase -mt-1">
                  Paper Trading
                </span>
              </div>
            </NavLink>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-navy-850'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Educational / Virtual Badge Card */}
        <div className="p-4">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-navy-850 to-navy-950 border border-navy-800 shadow-card">
            <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Virtual Sandbox</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Practicing stock trading with simulated capital. No real funds are at risk.
            </p>
            <div className="mt-3 pt-3 border-t border-navy-800 flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span>Demo Balance:</span>
              <span className="font-bold">₹100,000</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
