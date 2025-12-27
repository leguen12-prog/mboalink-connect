import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function NetworkHealthCard({ olts = [], onts = [], alerts = [] }) {
  const totalOlts = olts.length;
  const onlineOlts = olts.filter(o => o.status === 'online').length;
  const totalOnts = onts.length;
  const onlineOnts = onts.filter(o => o.status === 'online').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  
  const oltHealth = totalOlts > 0 ? (onlineOlts / totalOlts) * 100 : 100;
  const ontHealth = totalOnts > 0 ? (onlineOnts / totalOnts) * 100 : 100;
  const overallHealth = ((oltHealth + ontHealth) / 2).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Network Health</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
          ${overallHealth >= 95 ? 'bg-emerald-500/10 text-emerald-400' :
            overallHealth >= 80 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
          <Activity className="w-4 h-4" />
          {overallHealth}%
        </div>
      </div>

      <div className="space-y-5">
        {/* OLT Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">OLT Uptime</span>
            <span className="text-sm font-medium text-white">{onlineOlts}/{totalOlts} Online</span>
          </div>
          <Progress value={oltHealth} className="h-2 bg-slate-800" />
        </div>

        {/* ONT Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">ONT Connectivity</span>
            <span className="text-sm font-medium text-white">{onlineOnts}/{totalOnts} Online</span>
          </div>
          <Progress value={ontHealth} className="h-2 bg-slate-800" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">{onlineOnts}</p>
            <p className="text-xs text-slate-500">Active ONTs</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <WifiOff className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-lg font-bold text-white">{totalOnts - onlineOnts}</p>
            <p className="text-xs text-slate-500">Offline ONTs</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-white">{criticalAlerts}</p>
            <p className="text-xs text-slate-500">Critical Alerts</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}