import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Activity, Wifi, WifiOff, Server, AlertTriangle,
  TrendingUp, Clock, RefreshCw, Zap, ThermometerSun,
  Brain, ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';

export default function NetworkMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: olts = [], refetch: refetchOlts } = useQuery({
    queryKey: ['olts'],
    queryFn: () => base44.entities.OLT.list(),
    refetchInterval: autoRefresh ? 30000 : false
  });

  const { data: onts = [], refetch: refetchOnts } = useQuery({
    queryKey: ['onts'],
    queryFn: () => base44.entities.ONT.list(),
    refetchInterval: autoRefresh ? 30000 : false
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.NetworkAlert.filter({ status: 'active' }),
    refetchInterval: autoRefresh ? 10000 : false
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.PredictiveMaintenance.filter({ status: 'active' }),
    refetchInterval: autoRefresh ? 30000 : false
  });

  const handleRefresh = () => {
    refetchOlts();
    refetchOnts();
  };

  // Stats
  const onlineOnts = onts.filter(o => o.status === 'online').length;
  const offlineOnts = onts.filter(o => o.status === 'offline').length;
  const losOnts = onts.filter(o => o.status === 'los').length;
  const onlineOlts = olts.filter(o => o.status === 'online').length;

  const ontStatusData = [
    { name: 'Online', value: onlineOnts, color: '#10b981' },
    { name: 'Offline', value: offlineOnts, color: '#64748b' },
    { name: 'LOS', value: losOnts, color: '#ef4444' },
    { name: 'Other', value: onts.length - onlineOnts - offlineOnts - losOnts, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Signal quality distribution
  const signalData = [
    { name: 'Excellent', value: onts.filter(o => o.signal_quality === 'excellent').length, color: '#10b981' },
    { name: 'Good', value: onts.filter(o => o.signal_quality === 'good').length, color: '#22c55e' },
    { name: 'Fair', value: onts.filter(o => o.signal_quality === 'fair').length, color: '#f59e0b' },
    { name: 'Poor', value: onts.filter(o => o.signal_quality === 'poor').length, color: '#f97316' },
    { name: 'Critical', value: onts.filter(o => o.signal_quality === 'critical').length, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Mock bandwidth data for chart
  const bandwidthData = [
    { time: '00:00', download: 45, upload: 12 },
    { time: '04:00', download: 25, upload: 8 },
    { time: '08:00', download: 68, upload: 22 },
    { time: '12:00', download: 82, upload: 35 },
    { time: '16:00', download: 75, upload: 28 },
    { time: '20:00', download: 95, upload: 42 },
    { time: '23:00', download: 55, upload: 18 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Network Monitoring" 
        subtitle="Real-time network status and performance"
      >
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "border-slate-700"}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="border-slate-700 text-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Online ONTs</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{onlineOnts}</p>
              <p className="text-sm text-slate-500 mt-1">
                {onts.length > 0 ? ((onlineOnts / onts.length) * 100).toFixed(1) : 0}% uptime
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Wifi className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Offline / LOS</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{offlineOnts + losOnts}</p>
              <p className="text-sm text-slate-500 mt-1">
                {losOnts} with signal loss
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <WifiOff className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active OLTs</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{onlineOlts}</p>
              <p className="text-sm text-slate-500 mt-1">
                of {olts.length} total
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Alerts</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{alerts.length}</p>
              <p className="text-sm text-slate-500 mt-1">
                {alerts.filter(a => a.severity === 'critical').length} critical
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandwidth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Network Traffic</h3>
              <p className="text-sm text-slate-400">Aggregate bandwidth usage</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Download</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-slate-400">Upload</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bandwidthData}>
                <defs>
                  <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit=" Gbps" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="download" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDownload)" />
                <Area type="monotone" dataKey="upload" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUpload)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ONT Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">ONT Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ontStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ontStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {ontStatusData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* OLT Status Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">OLT Health Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {olts.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-500">
              <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No OLT devices configured</p>
            </div>
          ) : (
            olts.map((olt) => (
              <div 
                key={olt.id} 
                className={`p-4 rounded-xl border transition-all
                  ${olt.status === 'online' 
                    ? 'bg-slate-800/30 border-slate-700/50' 
                    : 'bg-red-500/5 border-red-500/20'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${olt.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                    <span className="font-medium text-white">{olt.name}</span>
                  </div>
                  <StatusBadge status={olt.status} className="text-xs" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">CPU</p>
                    <div className="flex items-center gap-2">
                      <Progress value={olt.cpu_usage_percent || 0} className="h-1.5 flex-1 bg-slate-700" />
                      <span className="text-white text-xs">{olt.cpu_usage_percent || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500">Memory</p>
                    <div className="flex items-center gap-2">
                      <Progress value={olt.memory_usage_percent || 0} className="h-1.5 flex-1 bg-slate-700" />
                      <span className="text-white text-xs">{olt.memory_usage_percent || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500">Temp</p>
                    <div className="flex items-center gap-1">
                      <ThermometerSun className={`w-4 h-4 
                        ${(olt.temperature_celsius || 0) > 60 ? 'text-red-400' : 
                          (olt.temperature_celsius || 0) > 45 ? 'text-amber-400' : 'text-emerald-400'}`} 
                      />
                      <span className="text-white">{olt.temperature_celsius || 0}°C</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    {olt.active_onts || 0} ONTs connected
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {olt.ip_address}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Signal Quality Distribution */}
      {signalData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Signal Quality Distribution</h3>
          <div className="flex items-center gap-4">
            {signalData.map((item, i) => (
              <div key={i} className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{item.name}</span>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${onts.length > 0 ? (item.value / onts.length) * 100 : 0}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Predictive Insights */}
      {predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Predictive Alerts</h3>
                <p className="text-sm text-slate-400">{predictions.length} devices require attention</p>
              </div>
            </div>
            <Link to={createPageUrl('PredictiveMaintenance')}>
              <Button 
                variant="outline" 
                size="sm"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.slice(0, 3).map((pred) => (
              <div 
                key={pred.id}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-white text-sm">
                      {pred.device_type === 'olt' 
                        ? olts.find(o => o.id === pred.device_id)?.name 
                        : onts.find(o => o.id === pred.device_id)?.serial_number}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{pred.prediction_type.replace(/_/g, ' ')}</p>
                  </div>
                  <StatusBadge status={pred.risk_level} className="text-xs" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">In {pred.days_until_failure} days</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}