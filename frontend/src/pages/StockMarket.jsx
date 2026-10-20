import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Star,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  ExternalLink,
  Info
} from 'lucide-react';
import { stocksApi, watchlistApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import Badge from '../components/common/Badge';
import OrderModal from '../components/common/OrderModal';

const StockMarket = () => {
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState(['All']);
  const [watchlistSymbols, setWatchlistSymbols] = useState(new Set());
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  // Trade Modal
  const [tradeStock, setTradeStock] = useState(null);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchMarketData = async () => {
    try {
      const [stocksRes, sectorsRes, watchlistRes] = await Promise.all([
        stocksApi.getStocks({ search, sector: selectedSector, sort: sortBy, order: sortOrder }),
        stocksApi.getSectors(),
        watchlistApi.getWatchlist().catch(() => ({ data: { watchlist: [] } }))
      ]);

      if (stocksRes.data?.success) setStocks(stocksRes.data.stocks);
      if (sectorsRes.data?.success) setSectors(sectorsRes.data.sectors);
      if (watchlistRes.data?.success) {
        const set = new Set(watchlistRes.data.watchlist.map((w) => w.symbol));
        setWatchlistSymbols(set);
      }
    } catch (err) {
      console.error('Error loading stock market directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [search, selectedSector, sortBy, sortOrder]);

  const toggleWatchlist = async (stock) => {
    const symbol = stock.symbol;
    const isWatchlisted = watchlistSymbols.has(symbol);

    try {
      if (isWatchlisted) {
        await watchlistApi.removeFromWatchlist(symbol);
        setWatchlistSymbols((prev) => {
          const updated = new Set(prev);
          updated.delete(symbol);
          return updated;
        });
        showSuccess(`Removed ${symbol} from watchlist.`);
      } else {
        await watchlistApi.addToWatchlist(symbol);
        setWatchlistSymbols((prev) => {
          const updated = new Set(prev);
          updated.add(symbol);
          return updated;
        });
        showSuccess(`Added ${symbol} to watchlist.`);
      }
    } catch (err) {
      showError('Failed to update watchlist.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Simulated Market Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Stock Directory
            </h1>
            <Badge variant="cyan" size="xs">
              <Sparkles className="w-3 h-3" />
              Live Simulation
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse, analyze, and trade Indian blue-chips & global equities with ₹100,000 virtual funds
          </p>
        </div>
      </div>

      {/* Simulated Transparency Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-navy-900 border border-navy-800 flex items-center gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-white">Notice:</strong> Stock prices are simulated for educational evaluation and updated periodically. Never treat simulated paper-trading data as live advisory.
        </span>
      </div>

      {/* Search & Sector Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by symbol or company name (e.g. RELIANCE, TCS, AAPL)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-navy-900 border border-navy-800 rounded-xl text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="volume" className="bg-navy-900">Highest Volume</option>
                <option value="price" className="bg-navy-900">Price</option>
                <option value="symbol" className="bg-navy-900">Symbol</option>
                <option value="name" className="bg-navy-900">Company Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSector === sec
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800 hover:border-navy-700'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Stocks Table */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading stocks directory...
          </div>
        ) : stocks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No stocks found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 border-b border-navy-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-5 pr-2 w-10"></th>
                  <th className="py-3.5 px-3">Symbol & Company</th>
                  <th className="py-3.5 px-3">Sector</th>
                  <th className="py-3.5 px-3 text-right">Price</th>
                  <th className="py-3.5 px-3 text-right">24h Change</th>
                  <th className="py-3.5 px-3 text-right hidden md:table-cell">Day Range</th>
                  <th className="py-3.5 px-3 text-right hidden lg:table-cell">Market Cap</th>
                  <th className="py-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-850">
                {stocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  const isWatchlisted = watchlistSymbols.has(stock.symbol);

                  return (
                    <tr key={stock.symbol} className="hover:bg-navy-850/50 transition-colors group">
                      {/* Watchlist toggle */}
                      <td className="py-3.5 pl-5 pr-2">
                        <button
                          onClick={() => toggleWatchlist(stock)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isWatchlisted
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Stock Symbol & Name */}
                      <td className="py-3.5 px-3">
                        <Link
                          to={`/market/${stock.symbol}`}
                          className="font-bold text-white hover:text-indigo-400 flex items-center gap-1.5"
                        >
                          <span>{stock.symbol}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-navy-800 text-slate-400 border border-navy-700">
                            {stock.exchange}
                          </span>
                        </Link>
                        <span className="text-[11px] text-slate-400 truncate max-w-[200px] block">
                          {stock.name}
                        </span>
                      </td>

                      {/* Sector */}
                      <td className="py-3.5 px-3 text-slate-400">
                        <span className="truncate max-w-[150px] block">{stock.sector}</span>
                      </td>

                      {/* Current Price */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white text-sm">
                        {formatCurrency(stock.currentPrice)}
                      </td>

                      {/* 24h Change */}
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

                      {/* Day Range */}
                      <td className="py-3.5 px-3 text-right font-mono text-[11px] text-slate-400 hidden md:table-cell">
                        <span>{formatCurrency(stock.dayLow)}</span>
                        <span className="mx-1 text-slate-600">-</span>
                        <span>{formatCurrency(stock.dayHigh)}</span>
                      </td>

                      {/* Market Cap */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-300 hidden lg:table-cell">
                        {stock.marketCap}
                      </td>

                      {/* Trade Button */}
                      <td className="py-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/market/${stock.symbol}`}
                            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors"
                            title="View Stock Details & Charts"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setTradeStock(stock);
                              setIsTradeOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Trade
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
        onOrderSuccess={() => fetchMarketData()}
      />
    </div>
  );
};

export default StockMarket;
