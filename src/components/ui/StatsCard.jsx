import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  trendLabel,
  className = '',
  iconColor = 'text-amber-400',
  bgColor = 'from-amber-500/10 to-amber-600/5'
}) {
  const isPositive = trend === 'up';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6 ${className}`}
    >
      {/* Background Gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgColor} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-slate-800/50 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        {trendValue && (
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-1 text-sm font-medium
              ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {trendValue}
            </div>
            {trendLabel && (
              <span className="text-sm text-slate-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}