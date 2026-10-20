import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateFormatted = data.timestamp ? new Date(data.timestamp).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : label;

    return (
      <div className="bg-navy-900 border border-navy-700 p-3 rounded-xl shadow-2xl text-xs">
        <p className="text-slate-400 mb-1">{dateFormatted}</p>
        <p className="text-base font-bold text-white font-mono">{formatCurrency(data.price)}</p>
        {data.volume > 0 && (
          <p className="text-slate-400 mt-1 text-[11px]">
            Volume: <span className="text-slate-200 font-mono">{formatNumber(data.volume)}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const StockChart = ({
  data = [],
  timeframe = '1M',
  onTimeframeChange,
  height = 320,
  showTimeframeSelector = true,
  colorScheme = 'auto' // 'auto', 'green', 'red'
}) => {
  const [hoveredData, setHoveredData] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center rounded-2xl bg-navy-900/50 border border-navy-800 text-slate-500 text-sm"
      >
        No historical chart data available.
      </div>
    );
  }

  // Determine trend color
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const isPositive = colorScheme === 'green' || (colorScheme === 'auto' && lastPrice >= firstPrice);

  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const gradientId = `chartGradient-${isPositive ? 'green' : 'red'}`;

  // Find min and max for YAxis buffer
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1 || minPrice * 0.05;

  const timeframes = ['1D', '1W', '1M', '1Y', 'ALL'];

  return (
    <div className="w-full">
      {showTimeframeSelector && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: strokeColor }} />
            <span className="text-xs font-mono text-slate-400">
              {hoveredData ? formatCurrency(hoveredData.price) : formatCurrency(lastPrice)}
            </span>
          </div>

          <div className="flex items-center bg-navy-950 p-1 rounded-xl border border-navy-800 text-xs">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange && onTimeframeChange(tf)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-navy-800 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onMouseMove={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                setHoveredData(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredData(null)}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#17233c" vertical={false} />
            <XAxis
              dataKey="timestamp"
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                const date = new Date(val);
                return timeframe === '1D'
                  ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis
              domain={[Math.floor(minPrice - padding), Math.ceil(maxPrice + padding)]}
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
