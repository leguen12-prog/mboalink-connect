import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Map, Calculator, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function ExpansionPlanner({ demandZones, onPlanGenerated }) {
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState(null);
  const [budget, setBudget] = useState('5000000');
  const [timeframe, setTimeframe] = useState('12');

  const generateExpansionPlan = async () => {
    if (!demandZones || demandZones.length === 0) {
      toast.error('Run demand prediction first');
      return;
    }

    setPlanning(true);

    try {
      const zones = await base44.entities.ServiceabilityZone.list();
      const assets = await base44.entities.GISAsset.list();
      const olts = assets.filter(a => a.asset_type === 'olt' && a.status === 'active');

      const aiPrompt = `You are a network expansion planning expert. Create an optimal rollout plan.

Available Budget: $${parseInt(budget).toLocaleString()}
Timeframe: ${timeframe} months
Number of OLTs: ${olts.length}

High-demand zones identified:
${demandZones.slice(0, 10).map((zone, idx) => `
${idx + 1}. Demand Score: ${zone.demand_score}
   Revenue Potential: $${zone.estimated_revenue_potential}/mo
   Est. Cost: $${zone.expansion_cost_estimate}
   Location: ${zone.lat}, ${zone.lng}
`).join('\n')}

Current serviceability zones: ${zones.length}

Create an expansion plan that:
1. Maximizes ROI within budget
2. Phases rollout over the timeframe
3. Prioritizes high-revenue zones
4. Optimizes resource allocation
5. Identifies CAPEX requirements by phase

Provide a detailed phased rollout plan with cost breakdown, expected revenue, and timeline.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase_number: { type: "number" },
                  duration_months: { type: "number" },
                  zones_to_deploy: { type: "array", items: { type: "string" } },
                  capex: { type: "number" },
                  opex: { type: "number" },
                  expected_revenue: { type: "number" },
                  new_customers: { type: "number" },
                  infrastructure_required: {
                    type: "object",
                    properties: {
                      olts: { type: "number" },
                      fibre_km: { type: "number" },
                      splitters: { type: "number" },
                      poles: { type: "number" }
                    }
                  },
                  key_milestones: { type: "array", items: { type: "string" } }
                }
              }
            },
            total_capex: { type: "number" },
            total_expected_revenue_year1: { type: "number" },
            payback_period_months: { type: "number" },
            roi_percentage: { type: "number" },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setPlan(aiResponse);
      onPlanGenerated && onPlanGenerated(aiResponse);
      toast.success('Expansion plan generated');

    } catch (error) {
      console.error('Expansion planning failed:', error);
      toast.error('Failed to generate expansion plan');
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Plan Parameters</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Budget (USD)</label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Timeframe (months)</label>
            <Input
              type="number"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        </div>

        <Button
          onClick={generateExpansionPlan}
          disabled={planning}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
        >
          {planning ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Generating Plan...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              Generate Expansion Plan
            </>
          )}
        </Button>
      </Card>

      {plan && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Financial Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-slate-400">Total CAPEX</p>
                <p className="text-lg font-bold text-white">
                  ${(plan.total_capex / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Year 1 Revenue</p>
                <p className="text-lg font-bold text-green-400">
                  ${(plan.total_expected_revenue_year1 / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Payback Period</p>
                <p className="text-lg font-bold text-white">
                  {plan.payback_period_months} mo
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">ROI</p>
                <p className="text-lg font-bold text-blue-400">
                  {plan.roi_percentage}%
                </p>
              </div>
            </div>
          </Card>

          {/* Phases */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Rollout Phases</h3>
            <div className="space-y-4">
              {plan.phases.map((phase, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-4 border-l-4 border-purple-500">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">Phase {phase.phase_number}</h4>
                      <p className="text-sm text-slate-400">{phase.duration_months} months</p>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-400">
                      {phase.new_customers} customers
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-500">CAPEX</p>
                      <p className="text-sm text-white font-medium">
                        ${(phase.capex / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Revenue</p>
                      <p className="text-sm text-green-400 font-medium">
                        ${(phase.expected_revenue / 1000).toFixed(0)}K/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Zones</p>
                      <p className="text-sm text-white font-medium">
                        {phase.zones_to_deploy.length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded p-3 mb-3">
                    <p className="text-xs text-slate-400 mb-2">Infrastructure Required</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">OLTs</p>
                        <p className="text-white font-medium">{phase.infrastructure_required.olts}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Fibre</p>
                        <p className="text-white font-medium">{phase.infrastructure_required.fibre_km} km</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Splitters</p>
                        <p className="text-white font-medium">{phase.infrastructure_required.splitters}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Poles</p>
                        <p className="text-white font-medium">{phase.infrastructure_required.poles}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 mb-1">Key Milestones</p>
                    <ul className="space-y-1">
                      {phase.key_milestones.map((milestone, midx) => (
                        <li key={midx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          {plan.recommendations && (
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {plan.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}