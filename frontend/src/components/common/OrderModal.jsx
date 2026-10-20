import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { tradesApi } from '../../services/api';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const OrderModal = ({
  isOpen,
  onClose,
  stock,
  holding = null, // existing holding if any
  initialTab = 'BUY',
  onOrderSuccess
}) => {
  const { user, updateBalanceLocally } = useAuth();
  const { showSuccess, showError } = useToast();

  const [tab, setTab] = useState(initialTab); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setQuantity(1);
  }, [initialTab, stock]);

  if (!isOpen || !stock) return null;

  const currentPrice = stock.currentPrice || 0;
  const cashBalance = user?.virtualBalance || 0;
  const ownedQuantity = holding ? holding.quantity : 0;

  // Max calculations
  const maxBuyAffordable = currentPrice > 0 ? Math.floor(cashBalance / currentPrice) : 0;
  const maxSellShares = ownedQuantity;

  const parsedQty = parseInt(quantity, 10) || 0;
  const totalAmount = Number((currentPrice * parsedQty).toFixed(2));

  // Validation
  let validationError = '';
  if (parsedQty <= 0) {
    validationError = 'Quantity must be at least 1 share.';
  } else if (tab === 'BUY') {
    if (totalAmount > cashBalance) {
      validationError = `Insufficient funds. Needed: ${formatCurrency(totalAmount)}, Available: ${formatCurrency(cashBalance)}`;
    }
  } else if (tab === 'SELL') {
    if (ownedQuantity <= 0) {
      validationError = `You do not currently own any shares of ${stock.symbol}.`;
    } else if (parsedQty > ownedQuantity) {
      validationError = `Cannot oversell. You only own ${ownedQuantity} share(s).`;
    }
  }

  // Quick percentage shortcuts
  const handleQuickPercent = (pct) => {
    if (tab === 'BUY') {
      const targetQty = Math.floor((maxBuyAffordable * pct) / 100);
      setQuantity(Math.max(1, targetQty));
    } else {
      const targetQty = Math.floor((maxSellShares * pct) / 100);
      setQuantity(Math.max(1, targetQty));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validationError || submitting || parsedQty <= 0) return;

    setSubmitting(true);
    try {
      if (tab === 'BUY') {
        const res = await tradesApi.buy({
          symbol: stock.symbol,
          quantity: parsedQty
        });

        if (res.data?.success) {
          updateBalanceLocally(res.data.updatedBalance);
          showSuccess(
            `Bought ${parsedQty} share(s) of ${stock.symbol} for ${formatCurrency(totalAmount)}!`,
            'Order Executed'
          );
          if (onOrderSuccess) onOrderSuccess(res.data);
          onClose();
        }
      } else {
        const res = await tradesApi.sell({
          symbol: stock.symbol,
          quantity: parsedQty
        });

        if (res.data?.success) {
          updateBalanceLocally(res.data.updatedBalance);
          const pnlText = res.data.realizedProfitLoss >= 0 ? `+${formatCurrency(res.data.realizedProfitLoss)} profit` : `${formatCurrency(res.data.realizedProfitLoss)} loss`;
          showSuccess(
            `Sold ${parsedQty} share(s) of ${stock.symbol} for ${formatCurrency(totalAmount)} (${pnlText})!`,
            'Order Executed'
          );
          if (onOrderSuccess) onOrderSuccess(res.data);
          onClose();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Trade execution failed';
      showError(msg, 'Order Rejected');
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedBalanceAfter =
    tab === 'BUY'
      ? Math.max(0, cashBalance - totalAmount)
      : cashBalance + totalAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-navy-800 bg-navy-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center font-bold text-white font-mono">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{stock.symbol}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                  {stock.exchange || 'NSE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">{stock.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 m-4 bg-navy-950 rounded-xl border border-navy-800">
          <button
            type="button"
            onClick={() => setTab('BUY')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'BUY'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            BUY SHARES
          </button>
          <button
            type="button"
            onClick={() => setTab('SELL')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'SELL'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            SELL SHARES
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          {/* Price Quote Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-navy-850/80 border border-navy-800 text-xs">
            <span className="text-slate-400">Current Market Price:</span>
            <div className="text-right">
              <span className="font-mono text-base font-bold text-white">{formatCurrency(currentPrice)}</span>
              <span className={`block text-[11px] font-mono ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPercent(stock.changePercent)}
              </span>
            </div>
          </div>

          {/* Account Context Info */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span>
              {tab === 'BUY' ? 'Virtual Cash Available:' : 'Held in Portfolio:'}
            </span>
            <span className="font-mono font-semibold text-slate-200">
              {tab === 'BUY' ? formatCurrency(cashBalance) : `${ownedQuantity} shares`}
            </span>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="order-quantity" className="text-xs font-medium text-slate-300">Quantity (Shares)</label>
              <span className="text-[11px] text-slate-500">
                Max: {tab === 'BUY' ? `${maxBuyAffordable} shares` : `${maxSellShares} shares`}
              </span>
            </div>
            <div className="relative">
              <input
                id="order-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || ''))}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-750 text-white font-mono text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="1"
              />
            </div>

            {/* Quick Percentage Chips */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="py-1 px-2 rounded-lg bg-navy-850 border border-navy-750 hover:bg-navy-800 text-[11px] font-mono text-slate-300 transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary Breakdown */}
          <div className="p-3.5 rounded-xl bg-navy-950/70 border border-navy-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Order Value:</span>
              <span className="font-mono text-slate-200 font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Trading Fee / Brokerage:</span>
              <span className="font-mono text-emerald-400 font-medium">₹0.00 (Zero Fee)</span>
            </div>
            <div className="pt-2 border-t border-navy-850 flex justify-between font-medium">
              <span className="text-slate-300">Est. Cash Balance After Trade:</span>
              <span className="font-mono text-white font-bold">{formatCurrency(estimatedBalanceAfter)}</span>
            </div>
          </div>

          {/* Validation Warning Alert */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-navy-700 bg-navy-850 hover:bg-navy-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!validationError || submitting || parsedQty <= 0}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                tab === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/50 shadow-rose-500/20'
              } disabled:cursor-not-allowed`}
            >
              {submitting ? (
                'Processing Order...'
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirm {tab} Order
                </>
              )}
            </button>
          </div>

          {/* Disclaimer footer */}
          <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
            <span>🔒 Paper Trading Simulator • Virtual funds only</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
