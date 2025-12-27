import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data = [] }) {
  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : [
    { month: 'Jan', revenue: 2400000, customers: 120 },
    { month: 'Feb', revenue: 2800000, customers: 145 },
    { month: 'Mar', revenue: 3200000, customers: 168 },
    { month: 'Apr', revenue: 3600000, customers: 195 },
    { month: 'May', revenue: 4100000, customers: 220 },
    { month: 'Jun', revenue: 4500000, customers: 248 },
  ];

  const formatRevenue = (value) => {
    return `${(value / 1000000).toFixed(1)}M XAF`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-amber-400 font-semibold">
            {formatRevenue(payload[0].value)}
          </p>
          {payload[0].payload.customers && (
            <p className="text-slate-500 text-sm mt-1">
              {payload[0].payload.customers} customers
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
          <p className="text-sm text-slate-400">Monthly recurring revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600" />
          <span className="text-sm text-slate-400">Revenue</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4a574" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#d4a574" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatRevenue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#d4a574" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}