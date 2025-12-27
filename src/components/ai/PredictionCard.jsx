import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Clock, CheckCircle, TrendingDown,
  Brain, Zap, ThermometerSun, Activity, XCircle
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';

const riskConfig = {
  critical: { 
    icon: XCircle, 
    color: 'text-red-400', 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/20',
    gradient: 'from-red-500/20 to-red-600/10'
  },
  high: { 
    icon: AlertTriangle, 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/10', 
    border: 'border-orange-500/20',
    gradient: 'from-orange-500/20 to-orange-600/10'
  },
  medium: { 
    icon: TrendingDown, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20',
    gradient: 'from-amber-500/20 to-amber-600/10'
  },
  low: { 
    icon: Activity, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/20',
    gradient: 'from-blue-500/20 to-blue-600/10'
  }
};

const predictionTypeIcons = {
  hardware_failure: ThermometerSun,
  signal_degradation: Zap,
  overheating: ThermometerSun,
  performance_degradation: TrendingDown,
  power_supply_failure: Activity
};

export default function PredictionCard({ prediction, deviceName, onClick }) {
  const config = riskConfig[prediction.risk_level] || riskConfig.medium;
  const Icon = config.icon;
  const TypeIcon = predictionTypeIcons[prediction.prediction_type] || Activity;

  const urgencyLevel = prediction.days_until_failure <= 7 ? 'urgent' : 
                       prediction.days_until_failure <= 30 ? 'soon' : 'later';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-gradient-to-br ${config.gradient} border ${config.border} p-5 hover:shadow-lg transition-all cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2.5 rounded-xl ${config.bg}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white truncate">{deviceName}</h4>
              <StatusBadge status={prediction.risk_level} className="text-xs" />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <TypeIcon className="w-4 h-4" />
              <span className="capitalize">{prediction.prediction_type.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg}`}>
          <Brain className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {prediction.confidence_score}%
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4 line-clamp-2">{prediction.analysis_summary}</p>

      <div className="space-y-3">
        {/* Time to Failure */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${
              urgencyLevel === 'urgent' ? 'text-red-400' :
              urgencyLevel === 'soon' ? 'text-amber-400' : 'text-slate-400'
            }`} />
            <span className="text-sm text-slate-400">Predicted in</span>
          </div>
          <span className={`text-sm font-bold ${
            urgencyLevel === 'urgent' ? 'text-red-400' :
            urgencyLevel === 'soon' ? 'text-amber-400' : 'text-slate-300'
          }`}>
            {prediction.days_until_failure} days
          </span>
        </div>

        {/* AI Confidence Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">AI Confidence</span>
            <span className="text-xs font-medium text-slate-400">{prediction.confidence_score}%</span>
          </div>
          <Progress 
            value={prediction.confidence_score} 
            className="h-1.5 bg-slate-800"
          />
        </div>

        {/* Contributing Factors */}
        {prediction.contributing_factors && prediction.contributing_factors.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Key Indicators:</p>
            <div className="flex flex-wrap gap-1.5">
              {prediction.contributing_factors.slice(0, 3).map((factor, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="bg-slate-800/50 text-slate-400 border-slate-700 text-xs"
                >
                  {factor}
                </Badge>
              ))}
              {prediction.contributing_factors.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="bg-slate-800/50 text-slate-400 border-slate-700 text-xs"
                >
                  +{prediction.contributing_factors.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50 text-xs">
          {prediction.auto_work_order_created && (
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              WO Created
            </Badge>
          )}
          {prediction.related_alert_id && (
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              Alert Raised
            </Badge>
          )}
          <span className="ml-auto text-slate-500">
            {formatDistanceToNow(new Date(prediction.created_date), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}