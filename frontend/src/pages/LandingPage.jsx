import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Shield,
  Zap,
  PieChart,
  Award,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const LandingPage = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    try {
      await login('demo@tradex.com', 'Demo@12345');
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  const sampleTickers = [
    { symbol: 'RELIANCE', price: '₹2,985.40', change: '+1.47%', positive: true },
    { symbol: 'TCS', price: '₹4,180.25', change: '-0.71%', positive: false },
    { symbol: 'HDFCBANK', price: '₹1,675.80', change: '+1.42%', positive: true },
    { symbol: 'INFY', price: '₹1,895.10', change: '+1.21%', positive: true },
    { symbol: 'TATAMOTORS', price: '₹994.50', change: '+2.72%', positive: true },
    { symbol: 'NVDA', price: '₹11,840.00', change: '+5.24%', positive: true }
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="h-20 border-b border-navy-800/80 bg-navy-950/80 backdrop-blur-md sticky top-0 z-40 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">
              Trade<span className="text-emerald-400">X</span>
            </span>
            <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase -mt-1">
              Smart Trading
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-navy-850 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Live Ticker Bar */}
      <div className="bg-navy-900 border-b border-navy-800 py-2.5 px-4 overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap overflow-x-auto no-scrollbar">
          {sampleTickers.map((t) => (
            <div key={t.symbol} className="inline-flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-white">{t.symbol}</span>
              <span className="text-slate-300">{t.price}</span>
              <span className={t.positive ? 'text-emerald-400' : 'text-rose-400'}>
                {t.change}
              </span>
            </div>
          ))}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-950 text-indigo-400 border border-navy-750 text-[11px] font-sans font-medium">
            <Sparkles className="w-3 h-3" />
            Simulated Quotes
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-28 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Academic disclaimer pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>Risk-Free Paper Trading Simulator • College Project</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          <span className="text-emerald-400 font-mono font-bold">₹100,000 Virtual Capital</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight sm:leading-none">
          Master the Stock Market <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Without Risking Real Money
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Experience real-world market dynamics, execute simulated buy and sell orders, track asset allocation, and master investment strategies using virtual paper funds.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={handleDemoLogin}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-card"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            1-Click Demo Account Login
          </button>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>₹100,000 Starting Virtual Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Real Financial Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Instant Execution & Portfolio Analytics</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-16 bg-navy-900/60 border-t border-navy-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase">Core Capabilities</h2>
            <h3 className="text-3xl font-bold text-white mt-2">Engineered for Learning & Market Mastery</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card hover:border-navy-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Simulated Order Execution</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Execute market buy and sell orders with instant validation against real server-side quotes. Prevents overselling and negative cash balances.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card hover:border-navy-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                <PieChart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Portfolio Analytics & P&L</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track weighted-average purchase cost, unrealized gains, realized profits, and interactive asset allocation charts powered by Recharts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card hover:border-navy-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Watchlists & History</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bookmark top equities, monitor dynamic simulated tick prices, and audit your complete trading history with 1-click CSV export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Notice Banner */}
      <section className="px-6 py-12 max-w-4xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-750 flex flex-col sm:flex-row items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Full Transparency & Security</h4>
            <p className="text-xs text-slate-400 mt-1">
              TradeX does not connect to real bank accounts, brokerages, or require financial credentials. All stocks and prices are simulated for educational demonstration.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-navy-800/80 bg-navy-950 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 TradeX — Smart Stock Trading and Portfolio Management Platform. Built for academic evaluation.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
