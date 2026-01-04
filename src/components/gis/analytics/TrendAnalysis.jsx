import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function TrendAnalysis({ onSaturationDetected }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [trends, setTrends] = useState(null);

  const analyzeTrends = async () => {
    setAnalyzing(true);
    
    try {
      const [customers, onts, olts, zones, routes] = await Promise.all([
        base44.entities.Customer.list(),
        base44.entities.ONT.list(),
        base44.entities.OLT.list(),
        base44.entities.ServiceabilityZone.list(),
        base44.entities.FibreRoute.list()
      ]);

      // Aggregate network utilization data
      const zoneUtilization = zones.map(zone => ({
        zone_id: zone.id,
        name: zone.name,
        total_premises: zone.premises_count,
        active_customers: zone.active_customers,
        penetration: zone.premises_count > 0 ? (zone.active_customers / zone.premises_count) * 100 : 0,
        capacity_remaining: zone.capacity_remaining,
        lat: zone.geometry?.coordinates?.[0]?.[0]?.[1],
        lng: zone.geometry?.coordinates?.[0]?.[0]?.[0]
      }));

      const oltUtilization = olts.map(olt => ({
        olt_id: olt.olt_id,
        name: olt.name,
        capacity_percent: olt.total_ont_capacity > 0 
          ? (olt.active_onts / olt.total_ont_capacity) * 100 
          : 0,
        active_onts: olt.active_onts,
        total_capacity: olt.total_ont_capacity
      }));

      const routeUtilization = routes.map(route => ({
        route_id: route.route_id,
        name: route.name,
        utilization: route.capacity_utilization || 0,
        type: route.route_type
      }));

      const aiPrompt = `You are a network analytics expert analyzing geospatial trends and saturation points.

Zone Utilization Data:
${zoneUtilization.slice(0, 20).map(z => `
${z.name}: ${z.penetration.toFixed(1)}% penetration, ${z.active_customers}/${z.total_premises} customers, ${z.capacity_remaining} capacity remaining
`).join('\n')}

OLT Utilization:
${oltUtilization.map(o => `${o.name}: ${o.capacity_percent.toFixed(1)}% utilized (${o.active_onts}/${o.total_capacity})`).join('\n')}

Route Utilization:
${routeUtilization.slice(0, 15).map(r => `${r.name} (${r.type}): ${r.utilization}%`).join('\n')}

Identify:
1. Network saturation points (zones/OLTs >80% capacity)
2. Growth trends and velocity
3. Infrastructure bottlenecks
4. Expansion priorities based on saturation risk
5. Temporal patterns and seasonal trends`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            saturation_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  type: { type: "string" },
                  current_utilization: { type: "number" },
                  estimated_saturation_date: { type: "string" },
                  severity: { type: "string" },
                  recommended_action: { type: "string" }
                }
              }
            },
            growth_trends: {
              type: "object",
              properties: {
                monthly_growth_rate: { type: "number" },
                velocity: { type: "string" },
                hotspots: { type: "array", items: { type: "string" } }
              }
            },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  asset: { type: "string" },
                  issue: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            expansion_priorities: {
              type: "array",
              items: { type: "string" }
            },
            insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setTrends(aiResponse);
      onSaturationDetected && onSaturationDetected(aiResponse.saturation_points);
      toast.success('Trend analysis complete');

    } catch (error) {
      console.error('Trend analysis failed:', error);
      toast.error('Failed to analyze trends');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={analyzeTrends}
        disabled={analyzing}
        className="w-full bg-gradient-to-r from-indigo-500 to-blue-600"
      >
        {analyzing ? (
          <>
            <TrendingUp className="w-4 h-4 mr-2 animate-pulse" />
            Analyzing Trends...
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4 mr-2" />
            Run Trend Analysis
          </>
        )}
      </Button>

      {trends && (
        <div className="space-y-4">
          {/* Saturation Points */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Saturation Points ({trends.saturation_points.length})
            </h3>
            <div className="space-y-2">
              {trends.saturation_points.map((point, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">{point.location}</p>
                      <p className="text-xs text-slate-400">{point.type}</p>
                    </div>
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                      {point.current_utilization}% utilized
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{point.recommended_action}</p>
                  <p className="text-xs text-slate-500">Est. saturation: {point.estimated_saturation_date}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Growth Trends */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Growth Trends</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Monthly Growth</p>
                <p className="text-2xl font-bold text-white">
                  {trends.growth_trends.monthly_growth_rate}%
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Velocity</p>
                <p className="text-lg font-bold text-white">{trends.growth_trends.velocity}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Hotspots</p>
              <div className="flex flex-wrap gap-2">
                {trends.growth_trends.hotspots.map((hotspot, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {hotspot}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Bottlenecks */}
          {trends.bottlenecks.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Infrastructure Bottlenecks
              </h3>
              <div className="space-y-2">
                {trends.bottlenecks.map((bottleneck, idx) => (
                  <div key={idx} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                    <p className="font-medium text-white text-sm">{bottleneck.asset}</p>
                    <p className="text-xs text-slate-400 mt-1">{bottleneck.issue}</p>
                    <p className="text-xs text-amber-400 mt-1">Impact: {bottleneck.impact}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Insights */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
            <ul className="space-y-2">
              {trends.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}