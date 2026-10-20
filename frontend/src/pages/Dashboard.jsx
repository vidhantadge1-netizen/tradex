import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Briefcase,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { portfolioApi, stocksApi, tradesApi } from '../services/api';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import StockChart from '../components/common/StockChart';
import Badge from '../components/common/Badge';
import OrderModal from '../components/common/OrderModal';

const Dashboard = () => {
  const { user } = useAuth();

  const [portfolio, setPortfolio] = useState(null);
  const [overview, setOverview] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Trade Modal State
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [modalTab, setModalTab] = useState('BUY');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [portRes, overviewRes, tradesRes] = await Promise.all([
        portfolioApi.getPortfolio(),
        stocksApi.getMarketOverview(),
        tradesApi.getHistory({ limit: 5 })
      ]);

      if (portRes.data?.success) setPortfolio(portRes.data);
      if (overviewRes.data?.success) setOverview(overviewRes.data);
      if (tradesRes.data?.success) setRecentTrades(tradesRes.data.trades);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openTradeModal = (stock, tab = 'BUY', holding = null) => {
    setSelectedStock(stock);
    setSelectedHolding(holding);
    setModalTab(tab);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-navy-850 rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-navy-900 rounded-2xl border border-navy-800" />
          ))}
        </div>
        <div className="h-80 bg-navy-900 rounded-2xl border border-navy-800" />
      </div>
    );
  }

  const summary = portfolio?.summary || {
    cashBalance: user?.virtualBalance || 100000,
    totalPortfolioValue: user?.virtualBalance || 100000,
    totalInvested: 0,
    totalUnrealizedPnl: 0,
    totalUnrealizedPnlPercent: 0,
    totalRealizedPnl: 0,
    totalNetPnl: 0
  };

  const holdings = portfolio?.holdings || [];
  const performanceTrend = portfolio?.performanceTrend || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Overview
            </h1>
            <Badge variant="cyan" size="xs">
              <Sparkles className="w-3 h-3" />
              Paper Trading
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time simulated portfolio tracking and market surveillance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-850 border border-navy-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Quotes
          </button>

          <Link
            to="/market"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Explore Stocks
          </Link>
        </div>
      </div>

      {/* Simulated Indices Bar */}
      {overview?.indices && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {overview.indices.map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div
                key={idx.name}
                className="flex items-center justify-between p-3.5 rounded-xl bg-navy-900 border border-navy-800 text-xs"
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">{idx.name}</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Badge variant={isPos ? 'green' : 'red'} size="xs" className="font-mono">
                  {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {formatPercent(idx.changePercent)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Virtual Cash Balance"
          value={formatCurrency(summary.cashBalance)}
          subtitle="Available for trading"
          icon={Wallet}
        />
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(summary.totalPortfolioValue)}
          changePercent={summary.totalUnrealizedPnlPercent}
          subtitle="Cash + active equities"
          icon={Briefcase}
        />
        <StatCard
          title="Total Invested Amount"
          value={formatCurrency(summary.totalInvested)}
          subtitle={`${summary.activeHoldingsCount || holdings.length} active positions`}
          icon={PieIcon}
        />
        <StatCard
          title="Total Unrealized P&L"
          value={formatCurrency(summary.totalUnrealizedPnl)}
          changePercent={summary.totalUnrealizedPnlPercent}
          subtitle={`Realized: ${formatCurrency(summary.totalRealizedPnl)}`}
          trend={summary.totalUnrealizedPnl >= 0 ? 'up' : 'down'}
          icon={summary.totalUnrealizedPnl >= 0 ? TrendingUp : TrendingDown}
        />
      </div>

      {/* Performance Trend Chart */}
      <div className="p-5 md:p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Portfolio Trajectory</h3>
            <p className="text-xs text-slate-400">7-Day estimated virtual asset trend</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {formatCurrency(summary.totalPortfolioValue)}
            </span>
          </div>
        </div>

        <StockChart
          data={performanceTrend.map((pt) => ({
            timestamp: pt.date,
            price: pt.portfolioValue,
            volume: 0
          }))}
          height={280}
          showTimeframeSelector={false}
          colorScheme={summary.totalUnrealizedPnl >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Grid: Active Holdings Preview & Market Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Active Holdings (2 Columns) */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Top Portfolio Holdings</h3>
                <p className="text-xs text-slate-400">Current positions and floating gains</p>
              </div>
              <Link
                to="/portfolio"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View Full Portfolio
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {holdings.length === 0 ? (
              <div className="py-12 text-center">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No active stock holdings yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Use your ₹100,000 in virtual cash to execute your first risk-free paper trade!
                </p>
                <Link
                  to="/market"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Browse Stocks
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-navy-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-semibold">Stock</th>
                      <th className="pb-3 font-semibold text-right">Shares</th>
                      <th className="pb-3 font-semibold text-right">Avg / Price</th>
                      <th className="pb-3 font-semibold text-right">Market Value</th>
                      <th className="pb-3 font-semibold text-right">Unrealized P&L</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-850">
                    {holdings.slice(0, 5).map((h) => {
                      const isProfit = h.unrealizedPnl >= 0;
                      return (
                        <tr key={h.symbol} className="hover:bg-navy-850/50 transition-colors">
                          <td className="py-3">
                            <Link to={`/market/${h.symbol}`} className="font-bold text-white hover:text-indigo-400 block">
                              {h.symbol}
                            </Link>
                            <span className="text-[11px] text-slate-400 truncate max-w-[140px] block">
                              {h.companyName}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-medium text-slate-200">
                            {h.quantity}
                          </td>
                          <td className="py-3 text-right font-mono">
                            <span className="text-slate-400 block text-[11px]">
                              {formatCurrency(h.averageBuyPrice)}
                            </span>
                            <span className="text-white font-semibold block">
                              {formatCurrency(h.currentPrice)}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-white">
                            {formatCurrency(h.currentValue)}
                          </td>
                          <td className="py-3 text-right font-mono">
                            <span className={`font-semibold block ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}{formatCurrency(h.unrealizedPnl)}
                            </span>
                            <span className={`text-[11px] ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatPercent(h.unrealizedPnlPercent)}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  openTradeModal(
                                    {
                                      symbol: h.symbol,
                                      name: h.companyName,
                                      currentPrice: h.currentPrice,
                                      change: h.currentPrice - h.previousClose,
                                      changePercent: h.dayChangePercent
                                    },
                                    'BUY',
                                    h
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/20"
                              >
                                Buy
                              </button>
                              <button
                                onClick={() =>
                                  openTradeModal(
                                    {
                                      symbol: h.symbol,
                                      name: h.companyName,
                                      currentPrice: h.currentPrice,
                                      change: h.currentPrice - h.previousClose,
                                      changePercent: h.dayChangePercent
                                    },
                                    'SELL',
                                    h
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/20"
                              >
                                Sell
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
        </div>

        {/* Top Market Gainers / Movers (1 Column) */}
        <div className="p-5 md:p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Top Market Gainers</h3>
              <Badge variant="green" size="xs">
                Active
              </Badge>
            </div>

            <div className="space-y-3">
              {overview?.topGainers && overview.topGainers.length > 0 ? (
                overview.topGainers.slice(0, 4).map((stock) => (
                  <div
                    key={stock.symbol}
                    className="p-3 rounded-xl bg-navy-850/60 border border-navy-800 hover:border-navy-700 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <Link
                        to={`/market/${stock.symbol}`}
                        className="text-xs font-bold text-white hover:text-indigo-400 block"
                      >
                        {stock.symbol}
                      </Link>
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px] block">
                        {stock.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white block">
                        {formatCurrency(stock.currentPrice)}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        +{stock.changePercent}%
                      </span>
                    </div>

                    <button
                      onClick={() => openTradeModal(stock, 'BUY')}
                      className="ml-2 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs"
                      title="Quick Buy"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No market data available.</p>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-navy-800">
            <Link
              to="/market"
              className="w-full py-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              View Full Stock Directory
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Card */}
      {recentTrades.length > 0 && (
        <div className="p-5 md:p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Full Trade Log
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentTrades.slice(0, 3).map((trade) => {
              const isBuy = trade.type === 'BUY';
              return (
                <div
                  key={trade._id}
                  className="p-3.5 rounded-xl bg-navy-850/50 border border-navy-800 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                        isBuy
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {trade.type}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{trade.symbol}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(trade.timestamp)}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-white block">{formatCurrency(trade.totalAmount)}</span>
                    <span className="text-[11px] text-slate-400">{trade.quantity} shares</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trade Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stock={selectedStock}
        holding={selectedHolding}
        initialTab={modalTab}
        onOrderSuccess={() => fetchData()}
      />
    </div>
  );
};

export default Dashboard;
