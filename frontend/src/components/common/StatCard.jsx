import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Badge from './Badge';

const StatCard = ({
  title,
  value,
  change,
  changePercent,
  subtitle,
  icon: Icon,
  trend = 'neutral', // 'up', 'down', 'neutral'
  className = ''
}) => {
  const isPositive = trend === 'up' || (change !== undefined && change > 0);
  const isNegative = trend === 'down' || (change !== undefined && change < 0);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-navy-900 border border-navy-800 p-5 shadow-card hover:border-navy-700 transition-all duration-200 group ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight font-mono">{value}</h3>
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-navy-850 border border-navy-750 text-indigo-400 group-hover:scale-105 group-hover:text-indigo-300 transition-all">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-navy-800/80 text-xs">
        {changePercent !== undefined || change !== undefined ? (
          <Badge
            variant={isPositive ? 'green' : isNegative ? 'red' : 'gray'}
            size="xs"
            className="font-mono"
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : null}
            {changePercent !== undefined ? `${isPositive ? '+' : ''}${changePercent}%` : ''}
            {change !== undefined ? ` (${change})` : ''}
          </Badge>
        ) : (
          <span className="text-slate-500 text-xs">No change</span>
        )}

        {subtitle && <span className="text-slate-400 text-xs truncate max-w-[60%]">{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatCard;
