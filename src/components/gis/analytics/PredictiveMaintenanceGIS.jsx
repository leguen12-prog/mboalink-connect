import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wrench, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function PredictiveMaintenanceGIS({ onPredictionsReady }) {
  const [predicting, setPredicting] = useState(false);
  const [predictions, setPredictions] = useState(null);

  const runPredictiveMaintenance = async () => {
    setPredicting(true);
    
    try {
      const [assets, metrics, alerts] = await Promise.all([
        base44.entities.GISAsset.list(),
        base44.entities.PerformanceMetric.list(),
        base44.entities.NetworkAlert.list()
      ]);

      // Group metrics by asset
      const assetMetrics = {};
      metrics.forEach(metric => {
        if (!assetMetrics[metric.device_id]) {
          assetMetrics[metric.device_id] = [];
        }
        assetMetrics[metric.device_id].push(metric);
      });

      // Identify critical infrastructure
      const criticalAssets = assets.filter(a => 
        ['olt', 'splitter', 'cabinet'].includes(a.asset_type) && 
        a.status === 'active'
      );

      const assetData = criticalAssets.slice(0, 30).map(asset => {
        const recentMetrics = assetMetrics[asset.asset_id]?.slice(-10) || [];
        const recentAlerts = alerts.filter(a => a.source_id === asset.asset_id).length;
        
        return {
          asset_id: asset.asset_id,
          type: asset.asset_type,
          age_days: asset.installation_date 
            ? Math.floor((Date.now() - new Date(asset.installation_date).getTime()) / (1000 * 60 * 60 * 24))
            : 365,
          capacity_used: asset.capacity?.used || 0,
          capacity_total: asset.capacity?.total || 100,
          alert_count: recentAlerts,
          has_recent_metrics: recentMetrics.length > 0,
          location: asset.geometry?.coordinates
        };
      });

      const aiPrompt = `You are a predictive maintenance AI analyzing critical network infrastructure.

Analyze these assets for failure risk and maintenance needs:

${assetData.map(a => `
Asset: ${a.asset_id} (${a.type})
Age: ${a.age_days} days
Capacity: ${a.capacity_used}/${a.capacity_total}
Recent Alerts: ${a.alert_count}
Location: ${a.location ? `${a.location[1]}, ${a.location[0]}` : 'N/A'}
`).join('\n')}

Predict:
1. Assets at risk of failure (next 30, 60, 90 days)
2. Recommended maintenance schedule
3. Critical intervention points
4. Cost-benefit of preventive vs reactive maintenance`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            at_risk_assets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  asset_id: { type: "string" },
                  risk_level: { type: "string" },
                  failure_probability: { type: "number" },
                  estimated_failure_window: { type: "string" },
                  failure_indicators: { type: "array", items: { type: "string" } },
                  recommended_action: { type: "string" },
                  cost_of_failure: { type: "number" },
                  preventive_cost: { type: "number" }
                }
              }
            },
            maintenance_schedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  asset_id: { type: "string" },
                  recommended_date: { type: "string" },
                  maintenance_type: { type: "string" },
                  estimated_downtime_hours: { type: "number" }
                }
              }
            },
            summary: {
              type: "object",
              properties: {
                total_at_risk: { type: "number" },
                estimated_preventive_cost: { type: "number" },
                estimated_reactive_cost: { type: "number" },
                cost_savings: { type: "number" }
              }
            }
          }
        }
      });

      setPredictions(aiResponse);
      onPredictionsReady && onPredictionsReady(aiResponse.at_risk_assets);
      toast.success(`Analyzed ${assetData.length} critical assets`);

    } catch (error) {
      console.error('Predictive maintenance failed:', error);
      toast.error('Failed to run predictive maintenance');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runPredictiveMaintenance}
        disabled={predicting}
        className="w-full bg-gradient-to-r from-orange-500 to-red-600"
      >
        {predicting ? (
          <>
            <Wrench className="w-4 h-4 mr-2 animate-pulse" />
            Analyzing Assets...
          </>
        ) : (
          <>
            <Wrench className="w-4 h-4 mr-2" />
            Run Predictive Maintenance
          </>
        )}
      </Button>

      {predictions && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Cost Analysis</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Preventive Cost</p>
                <p className="text-lg font-bold text-green-400">
                  ${(predictions.summary.estimated_preventive_cost / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Reactive Cost</p>
                <p className="text-lg font-bold text-red-400">
                  ${(predictions.summary.estimated_reactive_cost / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-slate-400">Potential Savings</p>
                <p className="text-2xl font-bold text-white">
                  ${(predictions.summary.cost_savings / 1000).toFixed(1)}K
                </p>
              </div>
            </div>
          </Card>

          {/* At-Risk Assets */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              At-Risk Assets ({predictions.at_risk_assets.length})
            </h3>
            <div className="space-y-2">
              {predictions.at_risk_assets.map((asset, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border-l-4 border-orange-500">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <p className="font-medium text-white">{asset.asset_id}</p>
                    </div>
                    <Badge 
                      className={
                        asset.risk_level === 'critical' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }
                    >
                      {asset.failure_probability}% risk
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{asset.recommended_action}</p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Failure window: {asset.estimated_failure_window}</p>
                    <p>Preventive cost: ${asset.preventive_cost} vs Failure cost: ${asset.cost_of_failure}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Maintenance Schedule */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recommended Schedule
            </h3>
            <div className="space-y-2">
              {predictions.maintenance_schedule.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.asset_id}</p>
                    <p className="text-xs text-slate-400">{item.maintenance_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{item.recommended_date}</p>
                    <p className="text-xs text-slate-500">{item.estimated_downtime_hours}h downtime</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}