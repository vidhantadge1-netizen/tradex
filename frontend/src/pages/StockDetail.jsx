import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Star,
  ShoppingBag,
  Briefcase,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import { stocksApi, portfolioApi, watchlistApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import StockChart from '../components/common/StockChart';
import Badge from '../components/common/Badge';
import OrderModal from '../components/common/OrderModal';

const StockDetail = () => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('1M');
  const [userHolding, setUserHolding] = useState(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Trade Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('BUY');

  const { showSuccess, showError } = useToast();

  const loadStockData = async (selectedTimeframe = timeframe) => {
    try {
      const [stockRes, histRes, portRes, watchRes] = await Promise.all([
        stocksApi.getStock(symbol),
        stocksApi.getStockHistory(symbol, selectedTimeframe),
        portfolioApi.getPortfolio().catch(() => ({ data: { holdings: [] } })),
        watchlistApi.getWatchlist().catch(() => ({ data: { watchlist: [] } }))
      ]);

      if (stockRes.data?.success) setStock(stockRes.data.stock);
      if (histRes.data?.success) setHistory(histRes.data.history);

      if (portRes.data?.success) {
        const matchingHolding = portRes.data.holdings.find(
          (h) => h.symbol.toUpperCase() === symbol.toUpperCase()
        );
        setUserHolding(matchingHolding || null);
      }

      if (watchRes.data?.success) {
        const found = watchRes.data.watchlist.some(
          (w) => w.symbol.toUpperCase() === symbol.toUpperCase()
        );
        setIsWatchlisted(found);
      }
    } catch (err) {
      console.error('Error loading stock detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData(timeframe);
  }, [symbol, timeframe]);

  const toggleWatchlist = async () => {
    try {
      if (isWatchlisted) {
        await watchlistApi.removeFromWatchlist(symbol);
        setIsWatchlisted(false);
        showSuccess(`Removed ${symbol} from watchlist.`);
      } else {
        await watchlistApi.addToWatchlist(symbol);
        setIsWatchlisted(true);
        showSuccess(`Added ${symbol} to watchlist.`);
      }
    } catch (err) {
      showError('Failed to update watchlist.');
    }
  };

  const handleOpenTrade = (tab) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-navy-850 rounded-xl w-32" />
        <div className="h-28 bg-navy-900 rounded-2xl border border-navy-800" />
        <div className="h-96 bg-navy-900 rounded-2xl border border-navy-800" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="p-12 text-center rounded-2xl bg-navy-900 border border-navy-800">
        <h3 className="text-lg font-bold text-white">Stock Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">
          No asset matching symbol "{symbol}" could be located in our directory.
        </p>
        <Link
          to="/market"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stock Market
        </Link>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/market"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stock Market
        </Link>
      </div>

      {/* Stock Header Card */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-white tracking-tight">{stock.symbol}</h1>
            <Badge variant="gray" size="xs">
              {stock.exchange}
            </Badge>
            <Badge variant="indigo" size="xs">
              {stock.sector}
            </Badge>
            <button
              onClick={toggleWatchlist}
              className={`p-1.5 rounded-lg border transition-colors ${
                isWatchlisted
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-navy-750 bg-navy-850 text-slate-400 hover:text-white'
              }`}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-slate-300 mt-1">{stock.name}</p>
        </div>

        {/* Price & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="text-left sm:text-right">
            <span className="text-3xl font-extrabold text-white font-mono block">
              {formatCurrency(stock.currentPrice)}
            </span>
            <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
              <Badge variant={isPositive ? 'green' : 'red'} size="xs" className="font-mono">
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenTrade('BUY')}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              Buy Shares
            </button>
            <button
              onClick={() => handleOpenTrade('SELL')}
              disabled={!userHolding || userHolding.quantity <= 0}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950/40 disabled:text-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              Sell Shares
            </button>
          </div>
        </div>
      </div>

      {/* User Holding Banner if owned */}
      {userHolding && userHolding.quantity > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Position in Your Portfolio</p>
              <p className="text-[11px] text-slate-400">
                You own <strong className="text-slate-200">{userHolding.quantity} shares</strong> at an average cost of{' '}
                <strong className="text-slate-200">{formatCurrency(userHolding.averageBuyPrice)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Market Value</span>
              <span className="text-white font-bold">{formatCurrency(userHolding.currentValue)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Unrealized P&L</span>
              <span
                className={`font-bold ${
                  userHolding.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {userHolding.unrealizedPnl >= 0 ? '+' : ''}
                {formatCurrency(userHolding.unrealizedPnl)} ({formatPercent(userHolding.unrealizedPnlPercent)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Section */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Price Performance
          </h3>
          <Badge variant="cyan" size="xs">
            Simulated Quotes
          </Badge>
        </div>

        <StockChart
          data={history}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf)}
          height={340}
        />
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] text-slate-400 block font-medium">Day High</span>
          <span className="text-sm font-bold font-mono text-white mt-1 block">
            {formatCurrency(stock.dayHigh)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] text-slate-400 block font-medium">Day Low</span>
          <span className="text-sm font-bold font-mono text-white mt-1 block">
            {formatCurrency(stock.dayLow)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] text-slate-400 block font-medium">52W High</span>
          <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">
            {formatCurrency(stock.fiftyTwoWeekHigh)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] text-slate-400 block font-medium">52W Low</span>
          <span className="text-sm font-bold font-mono text-rose-400 mt-1 block">
            {formatCurrency(stock.fiftyTwoWeekLow)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] text-slate-400 block font-medium">P/E Ratio</span>
          <span className="text-sm font-bold font-mono text-white mt-1 block">{stock.peRatio}</span>
        </div>
        <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
          <span className="text-[11px] text-slate-400 block font-medium">Market Cap</span>
          <span className="text-sm font-bold font-mono text-indigo-400 mt-1 block">{stock.marketCap}</span>
        </div>
      </div>

      {/* Company Description */}
      {stock.description && (
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card">
          <h4 className="text-sm font-bold text-white mb-2">About {stock.name}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{stock.description}</p>
        </div>
      )}

      {/* Trade Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stock={stock}
        holding={userHolding}
        initialTab={modalTab}
        onOrderSuccess={() => loadStockData(timeframe)}
      />
    </div>
  );
};

export default StockDetail;
