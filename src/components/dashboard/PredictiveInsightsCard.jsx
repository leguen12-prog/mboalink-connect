import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatusBadge from '@/components/ui/StatusBadge';

export default function PredictiveInsightsCard({ predictions = [] }) {
  const activePredictions = predictions.filter(p => p.status === 'active');
  const criticalPredictions = activePredictions.filter(p => p.risk_level === 'critical');
  const urgentPredictions = activePredictions.filter(p => p.days_until_failure <= 7);

  if (activePredictions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Predictive Insights</h3>
            <p className="text-sm text-slate-400">All systems healthy</p>
          </div>
        </div>
        <div className="text-center py-6">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 text-emerald-400 opacity-50" />
          <p className="text-sm text-slate-400">No predicted failures detected</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Predictive Insights</h3>
            <p className="text-sm text-slate-400">{activePredictions.length} predictions active</p>
          </div>
        </div>
        <Link to={createPageUrl('PredictiveMaintenance')}>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-slate-900/50">
          <p className="text-xs text-slate-500 mb-1">Critical Risk</p>
          <p className="text-2xl font-bold text-red-400">{criticalPredictions.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/50">
          <p className="text-xs text-slate-500 mb-1">Urgent (≤7d)</p>
          <p className="text-2xl font-bold text-amber-400">{urgentPredictions.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/50">
          <p className="text-xs text-slate-500 mb-1">Total Active</p>
          <p className="text-2xl font-bold text-purple-400">{activePredictions.length}</p>
        </div>
      </div>

      {/* Top Predictions */}
      <div className="space-y-3">
        {activePredictions.slice(0, 3).map((pred, index) => (
          <motion.div
            key={pred.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {pred.device_type === 'olt' ? 'OLT' : 'ONT'}: {pred.device_id}
                </p>
                <p className="text-xs text-slate-500 capitalize">{pred.prediction_type.replace(/_/g, ' ')}</p>
              </div>
              <StatusBadge status={pred.risk_level} className="text-xs" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>In {pred.days_until_failure} days</span>
              </div>
              <div className="flex items-center gap-1 text-purple-400">
                <Brain className="w-3 h-3" />
                <span>{pred.confidence_score}% confidence</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}