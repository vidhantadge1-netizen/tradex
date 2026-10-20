import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart as PieIcon,
  Wallet,
  TrendingUp,
  TrendingDown,
  Briefcase,
  HelpCircle,
  ShoppingBag,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { portfolioApi } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import OrderModal from '../components/common/OrderModal';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Trade Modal
  const [tradeStock, setTradeStock] = useState(null);
  const [tradeHolding, setTradeHolding] = useState(null);
  const [tradeTab, setTradeTab] = useState('BUY');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPortfolio = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await portfolioApi.getPortfolio();
      if (res.data?.success) {
        setPortfolio(res.data);
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const openTrade = (holding, tab = 'BUY') => {
    setTradeStock({
      symbol: holding.symbol,
      name: holding.companyName,
      currentPrice: holding.currentPrice,
      change: holding.currentPrice - holding.previousClose,
      changePercent: holding.dayChangePercent
    });
    setTradeHolding(holding);
    setTradeTab(tab);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-navy-850 rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-navy-900 rounded-2xl border border-navy-800" />
          ))}
        </div>
        <div className="h-96 bg-navy-900 rounded-2xl border border-navy-800" />
      </div>
    );
  }

  const summary = portfolio?.summary || {
    cashBalance: 0,
    totalInvested: 0,
    currentHoldingsValue: 0,
    totalPortfolioValue: 0,
    totalUnrealizedPnl: 0,
    totalUnrealizedPnlPercent: 0,
    totalRealizedPnl: 0,
    totalNetPnl: 0,
    activeHoldingsCount: 0
  };

  const holdings = portfolio?.holdings || [];
  const assetAllocation = portfolio?.assetAllocation || [];

  // Donut chart colors
  const ALLOCATION_COLORS = [
    '#10b981', // emerald (cash)
    '#6366f1', // indigo
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#14b8a6', // teal
    '#f97316'  // orange
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              My Portfolio
            </h1>
            <Badge variant="indigo" size="xs">
              {summary.activeHoldingsCount} Positions
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Performance analytics, cost-basis accounting, and asset distribution
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-850 border border-navy-800 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Calculation Logic
          </button>

          <button
            onClick={() => fetchPortfolio(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-850 border border-navy-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Formulas Card (Collapsible) */}
      {showFormulaModal && (
        <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Documented Financial Assumptions & Formulas
            </h4>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="p-3 rounded-xl bg-navy-950/60 border border-indigo-500/20">
              <span className="font-semibold text-indigo-300 block mb-1">
                Weighted Average Cost (WAC):
              </span>
              <p className="text-[11px] font-mono text-slate-400">
                Avg Cost = (Previous Cost + New Trade Amount) / (Previous Shares + New Shares)
              </p>
            </div>
            <div className="p-3 rounded-xl bg-navy-950/60 border border-indigo-500/20">
              <span className="font-semibold text-indigo-300 block mb-1">Unrealized P&L:</span>
              <p className="text-[11px] font-mono text-slate-400">
                Unrealized P&L = (Current Price - Average Buy Price) × Quantity Held
              </p>
            </div>
            <div className="p-3 rounded-xl bg-navy-950/60 border border-indigo-500/20">
              <span className="font-semibold text-indigo-300 block mb-1">Realized P&L:</span>
              <p className="text-[11px] font-mono text-slate-400">
                Realized P&L = Sum of [(Sell Price - Avg Cost at Sell Time) × Quantity Sold]
              </p>
            </div>
            <div className="p-3 rounded-xl bg-navy-950/60 border border-indigo-500/20">
              <span className="font-semibold text-indigo-300 block mb-1">Total Portfolio Value:</span>
              <p className="text-[11px] font-mono text-slate-400">
                Portfolio Value = Virtual Cash Balance + Sum(Current Value of all active Holdings)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(summary.totalPortfolioValue)}
          changePercent={summary.totalUnrealizedPnlPercent}
          subtitle={`Net P&L: ${formatCurrency(summary.totalNetPnl)}`}
          icon={Briefcase}
        />
        <StatCard
          title="Virtual Cash Available"
          value={formatCurrency(summary.cashBalance)}
          subtitle="Unallocated purchasing power"
          icon={Wallet}
        />
        <StatCard
          title="Total Invested Cost"
          value={formatCurrency(summary.totalInvested)}
          subtitle={`Current Value: ${formatCurrency(summary.currentHoldingsValue)}`}
          icon={PieIcon}
        />
        <StatCard
          title="Unrealized / Realized P&L"
          value={formatCurrency(summary.totalUnrealizedPnl)}
          changePercent={summary.totalUnrealizedPnlPercent}
          subtitle={`Realized: ${formatCurrency(summary.totalRealizedPnl)}`}
          trend={summary.totalUnrealizedPnl >= 0 ? 'up' : 'down'}
          icon={summary.totalUnrealizedPnl >= 0 ? TrendingUp : TrendingDown}
        />
      </div>

      {/* Asset Allocation & Summary Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="p-5 md:p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Asset Allocation</h3>
            <p className="text-xs text-slate-400 mb-4">Capital split across cash & equities</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${formatCurrency(val)} (${item.payload.percentage}%)`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#0c1322',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Legend */}
          <div className="mt-4 pt-3 border-t border-navy-800 space-y-2">
            {assetAllocation.slice(0, 5).map((item, idx) => (
              <div key={item.symbol} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length] }}
                  />
                  <span className="text-slate-300 font-medium truncate max-w-[120px]">
                    {item.name}
                  </span>
                </div>
                <div className="font-mono text-right">
                  <span className="text-white font-semibold">{item.percentage}%</span>
                  <span className="text-slate-500 text-[10px] ml-1.5 hidden sm:inline">
                    ({formatCurrency(item.value)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings Table (2 Columns) */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Active Equity Holdings</h3>
                <p className="text-xs text-slate-400">Manage, inspect, or liquidate positions</p>
              </div>
              <Link
                to="/market"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Buy New Stock
              </Link>
            </div>

            {holdings.length === 0 ? (
              <div className="py-16 text-center">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-200">Your portfolio is empty</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You have ₹100,000 in virtual cash ready to invest. Browse the stock market to make your first trade!
                </p>
                <Link
                  to="/market"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Explore Stock Market
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-navy-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Symbol / Company</th>
                      <th className="pb-3 text-right">Shares</th>
                      <th className="pb-3 text-right">Avg Cost</th>
                      <th className="pb-3 text-right">Market Price</th>
                      <th className="pb-3 text-right">Current Value</th>
                      <th className="pb-3 text-right">Unrealized P&L</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-850">
                    {holdings.map((h) => {
                      const isProfit = h.unrealizedPnl >= 0;
                      return (
                        <tr key={h.symbol} className="hover:bg-navy-850/50 transition-colors">
                          <td className="py-3.5">
                            <Link
                              to={`/market/${h.symbol}`}
                              className="font-bold text-white hover:text-indigo-400 block"
                            >
                              {h.symbol}
                            </Link>
                            <span className="text-[11px] text-slate-400 truncate max-w-[130px] block">
                              {h.companyName}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono font-medium text-slate-200">
                            {h.quantity}
                          </td>
                          <td className="py-3.5 text-right font-mono text-slate-300">
                            {formatCurrency(h.averageBuyPrice)}
                          </td>
                          <td className="py-3.5 text-right font-mono font-semibold text-white">
                            {formatCurrency(h.currentPrice)}
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-white">
                            {formatCurrency(h.currentValue)}
                          </td>
                          <td className="py-3.5 text-right font-mono">
                            <span
                              className={`font-semibold block ${
                                isProfit ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isProfit ? '+' : ''}
                              {formatCurrency(h.unrealizedPnl)}
                            </span>
                            <span
                              className={`text-[11px] ${
                                isProfit ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {formatPercent(h.unrealizedPnlPercent)}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openTrade(h, 'BUY')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20"
                                title="Buy more shares"
                              >
                                Buy
                              </button>
                              <button
                                onClick={() => openTrade(h, 'SELL')}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/20"
                                title="Sell shares"
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
      </div>

      {/* Order Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stock={tradeStock}
        holding={tradeHolding}
        initialTab={tradeTab}
        onOrderSuccess={() => fetchPortfolio()}
      />
    </div>
  );
};

export default Portfolio;
