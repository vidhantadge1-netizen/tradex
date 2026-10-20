import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
        <TrendingUp className="w-8 h-8" />
      </div>
      <h1 className="text-6xl font-black text-white font-mono">404</h1>
      <h2 className="text-xl font-bold text-slate-200 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 mt-2 max-w-sm">
        The page or asset you are attempting to access does not exist on TradeX.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/20"
      >
        <Home className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
