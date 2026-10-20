import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-800 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & simulated badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-850 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live market status badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-navy-950 border border-navy-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">Market Active</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            SIMULATED
          </span>
        </div>
      </div>

      {/* Right: Cash balance & User dropdown */}
      <div className="flex items-center gap-3 md:gap-4">
        {isAuthenticated && user ? (
          <>
            {/* Virtual Cash Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-navy-950 border border-navy-800 shadow-inner">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight font-medium">Virtual Cash</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {formatCurrency(user.virtualBalance)}
                </span>
              </div>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-750 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline text-xs font-medium text-slate-200 truncate max-w-[120px]">
                  {user.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-navy-900 border border-navy-750 shadow-2xl py-2 z-50 animate-scale-up"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-navy-800">
                    <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/portfolio"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-navy-850 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    My Portfolio
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl border border-navy-700 hover:border-slate-500 text-xs font-semibold text-slate-200 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              Get ₹100k Demo
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
