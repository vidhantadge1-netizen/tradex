import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-navy-800/80 bg-navy-950 py-6 px-4 md:px-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">TradeX Platform</span>
          <span>•</span>
          <span>College Evaluation Edition</span>
        </div>
        <p className="text-[11px] text-slate-500 max-w-xl">
          ⚠️ <strong className="text-slate-400">Educational Simulation Notice:</strong> TradeX uses virtual paper currency (₹100,000 initial allocation). Stock quotes and order executions are strictly simulated for academic learning.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
