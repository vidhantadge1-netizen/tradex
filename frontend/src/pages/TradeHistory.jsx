import React, { useState, useEffect } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Search,
  ArrowUpDown,
  Calendar,
  Sparkles
} from 'lucide-react';
import { tradesApi } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import Badge from '../components/common/Badge';

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(''); // '', 'BUY', 'SELL'
  const [symbolSearch, setSymbolSearch] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchHistory = async () => {
    try {
      const res = await tradesApi.getHistory({
        type: typeFilter || undefined,
        symbol: symbolSearch || undefined,
        sortBy,
        sortOrder,
        limit: 100
      });
      if (res.data?.success) {
        setTrades(res.data.trades);
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [typeFilter, symbolSearch, sortBy, sortOrder]);

  // Export to CSV Function
  const exportToCSV = () => {
    if (trades.length === 0) return;

    const headers = [
      'Transaction ID',
      'Date & Time',
      'Type',
      'Symbol',
      'Company Name',
      'Quantity',
      'Execution Price (INR)',
      'Total Amount (INR)',
      'Realized PnL (INR)'
    ];

    const rows = trades.map((t) => [
      `"${t._id}"`,
      `"${new Date(t.timestamp).toISOString()}"`,
      `"${t.type}"`,
      `"${t.symbol}"`,
      `"${t.companyName.replace(/"/g, '""')}"`,
      t.quantity,
      t.executionPrice,
      t.totalAmount,
      t.realizedProfitLoss || 0
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TradeX_Transactions_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Transaction History
            </h1>
            <Badge variant="indigo" size="xs">
              Audit Trail
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit log of all executed simulated buy and sell orders
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={trades.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-850 border border-navy-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          Export to CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Symbol Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by stock symbol (e.g. RELIANCE, TCS)..."
            value={symbolSearch}
            onChange={(e) => setSymbolSearch(e.target.value.toUpperCase())}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Order Type Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-navy-900 border border-navy-800 rounded-xl text-xs">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              typeFilter === '' ? 'bg-navy-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setTypeFilter('BUY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              typeFilter === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Buy Only
          </button>
          <button
            onClick={() => setTypeFilter('SELL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              typeFilter === 'SELL' ? 'bg-rose-500/20 text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sell Only
          </button>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading transaction audit records...
          </div>
        ) : trades.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-200">No transactions recorded yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When you buy or sell stocks in TradeX, an audit log will be permanently stored here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 border-b border-navy-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-5 pr-2">Type</th>
                  <th className="py-3.5 px-3">Date & Time</th>
                  <th className="py-3.5 px-3">Symbol & Company</th>
                  <th className="py-3.5 px-3 text-right">Shares</th>
                  <th className="py-3.5 px-3 text-right">Execution Price</th>
                  <th className="py-3.5 px-3 text-right">Total Trade Value</th>
                  <th className="py-3.5 pr-5 text-right">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-850 font-mono">
                {trades.map((trade) => {
                  const isBuy = trade.type === 'BUY';
                  const isProfit = (trade.realizedProfitLoss || 0) >= 0;

                  return (
                    <tr key={trade._id} className="hover:bg-navy-850/50 transition-colors">
                      {/* Type Badge */}
                      <td className="py-3.5 pl-5 pr-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-400 text-[11px] font-sans">
                        {formatDateTime(trade.timestamp)}
                      </td>

                      {/* Stock Symbol & Company */}
                      <td className="py-3.5 px-3 font-sans">
                        <span className="font-bold text-white block font-mono">{trade.symbol}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px] block">
                          {trade.companyName}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-200">
                        {trade.quantity}
                      </td>

                      {/* Execution Price */}
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        {formatCurrency(trade.executionPrice)}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3 text-right font-bold text-white">
                        {formatCurrency(trade.totalAmount)}
                      </td>

                      {/* Realized P&L */}
                      <td className="py-3.5 pr-5 text-right font-semibold">
                        {isBuy ? (
                          <span className="text-slate-600 text-[11px] font-sans">—</span>
                        ) : (
                          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfit ? '+' : ''}
                            {formatCurrency(trade.realizedProfitLoss)}
                          </span>
                        )}
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
  );
};

export default TradeHistory;
