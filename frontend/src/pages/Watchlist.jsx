import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  TrendingUp,
  TrendingDown,
  Trash2,
  ShoppingBag,
  Plus,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { watchlistApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import Badge from '../components/common/Badge';
import OrderModal from '../components/common/OrderModal';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trade Modal
  const [tradeStock, setTradeStock] = useState(null);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchWatchlist = async () => {
    try {
      const res = await watchlistApi.getWatchlist();
      if (res.data?.success) {
        setWatchlist(res.data.watchlist);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (symbol) => {
    try {
      await watchlistApi.removeFromWatchlist(symbol);
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
      showSuccess(`Removed ${symbol} from watchlist.`);
    } catch (err) {
      showError('Failed to remove stock from watchlist.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Watchlist
            </h1>
            <Badge variant="indigo" size="xs">
              {watchlist.length} Tracked
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pin and monitor high-conviction equities for instant virtual paper execution
          </p>
        </div>

        <Link
          to="/market"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add More Stocks
        </Link>
      </div>

      {/* Main Watchlist Card */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading watchlist items...
          </div>
        ) : watchlist.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-200">Your watchlist is currently empty</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Track your favorite stocks and monitor their simulated price ticks before executing orders.
            </p>
            <Link
              to="/market"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Discover Stocks
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 border-b border-navy-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-5 pr-2">Symbol</th>
                  <th className="py-3.5 px-3">Company</th>
                  <th className="py-3.5 px-3">Sector</th>
                  <th className="py-3.5 px-3 text-right">Current Price</th>
                  <th className="py-3.5 px-3 text-right">24h Change</th>
                  <th className="py-3.5 px-3 text-right hidden sm:table-cell">Day Range</th>
                  <th className="py-3.5 px-3 text-right hidden md:table-cell">P/E</th>
                  <th className="py-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-850">
                {watchlist.map((item) => {
                  const stock = item.stock;
                  if (!stock) return null;
                  const isPositive = stock.change >= 0;

                  return (
                    <tr key={item.symbol} className="hover:bg-navy-850/50 transition-colors">
                      <td className="py-3.5 pl-5 pr-2 font-bold text-white">
                        <Link
                          to={`/market/${stock.symbol}`}
                          className="hover:text-indigo-400 flex items-center gap-1.5"
                        >
                          <span>{stock.symbol}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-navy-800 text-slate-400 border border-navy-700">
                            {stock.exchange}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        <span className="truncate max-w-[180px] block">{stock.name}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        <span className="truncate max-w-[130px] block">{stock.sector}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(stock.currentPrice)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {formatPercent(stock.changePercent)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-400 hidden sm:table-cell">
                        {formatCurrency(stock.dayLow)} - {formatCurrency(stock.dayHigh)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300 hidden md:table-cell">
                        {stock.peRatio}
                      </td>
                      <td className="py-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTradeStock(stock);
                              setIsTradeOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Trade
                          </button>
                          <button
                            onClick={() => handleRemove(item.symbol)}
                            className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <OrderModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        stock={tradeStock}
        initialTab="BUY"
        onOrderSuccess={() => fetchWatchlist()}
      />
    </div>
  );
};

export default Watchlist;
