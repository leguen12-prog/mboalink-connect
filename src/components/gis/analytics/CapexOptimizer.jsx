import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calculator, DollarSign, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function CapexOptimizer({ onOptimizationComplete }) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [scenarios, setScenarios] = useState([
    { id: 1, budget: '2000000', zones: '5', timeline: '6' },
    { id: 2, budget: '3000000', zones: '8', timeline: '9' },
    { id: 3, budget: '5000000', zones: '12', timeline: '12' }
  ]);

  const runOptimization = async () => {
    setOptimizing(true);

    try {
      const [zones, assets, customers] = await Promise.all([
        base44.entities.ServiceabilityZone.list(),
        base44.entities.GISAsset.list(),
        base44.entities.Customer.list()
      ]);

      const aiPrompt = `You are a CAPEX optimization expert. Analyze multiple what-if scenarios for network expansion.

Current Network:
- Zones: ${zones.length}
- Assets: ${assets.length}
- Customers: ${customers.length}

Scenarios to compare:
${scenarios.map((s, idx) => `
Scenario ${idx + 1}:
Budget: $${parseInt(s.budget).toLocaleString()}
Target Zones: ${s.zones}
Timeline: ${s.timeline} months
`).join('\n')}

For each scenario, calculate:
1. Optimal infrastructure mix (OLTs, fiber, splitters, poles)
2. Phased deployment plan
3. Expected customer acquisition
4. Revenue projections
5. ROI and NPV
6. Risk-adjusted returns
7. Recommend the optimal scenario

Optimize for maximum ROI while minimizing risk.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenario_id: { type: "number" },
                  infrastructure_mix: {
                    type: "object",
                    properties: {
                      olts: { type: "number" },
                      fiber_km: { type: "number" },
                      splitters: { type: "number" },
                      poles: { type: "number" }
                    }
                  },
                  deployment_phases: { type: "number" },
                  expected_customers: { type: "number" },
                  monthly_revenue: { type: "number" },
                  total_capex: { type: "number" },
                  payback_months: { type: "number" },
                  roi_3year: { type: "number" },
                  npv: { type: "number" },
                  risk_score: { type: "number" },
                  risk_adjusted_return: { type: "number" }
                }
              }
            },
            recommended_scenario: { type: "number" },
            recommendation_reasoning: { type: "string" },
            optimization_insights: { type: "array", items: { type: "string" } },
            cost_saving_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  opportunity: { type: "string" },
                  potential_savings: { type: "number" }
                }
              }
            }
          }
        }
      });

      setOptimization(aiResponse);
      onOptimizationComplete && onOptimizationComplete(aiResponse);
      toast.success('CAPEX optimization complete');

    } catch (error) {
      console.error('Optimization failed:', error);
      toast.error('Failed to optimize CAPEX');
    } finally {
      setOptimizing(false);
    }
  };

  const updateScenario = (id, field, value) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  return (
    <div className="space-y-4">
      {/* Scenario Inputs */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">What-If Scenarios</h3>
        <div className="space-y-4">
          {scenarios.map((scenario, idx) => (
            <div key={scenario.id} className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Scenario {idx + 1}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Budget ($)</label>
                  <Input
                    type="number"
                    value={scenario.budget}
                    onChange={(e) => updateScenario(scenario.id, 'budget', e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Zones</label>
                  <Input
                    type="number"
                    value={scenario.zones}
                    onChange={(e) => updateScenario(scenario.id, 'zones', e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Timeline (mo)</label>
                  <Input
                    type="number"
                    value={scenario.timeline}
                    onChange={(e) => updateScenario(scenario.id, 'timeline', e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button
        onClick={runOptimization}
        disabled={optimizing}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
      >
        {optimizing ? (
          <>
            <Calculator className="w-4 h-4 mr-2 animate-pulse" />
            Optimizing...
          </>
        ) : (
          <>
            <Calculator className="w-4 h-4 mr-2" />
            Optimize CAPEX
          </>
        )}
      </Button>

      {optimization && (
        <div className="space-y-4">
          {/* Recommended Scenario */}
          <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Recommended Scenario</h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-emerald-500/20 text-emerald-400 text-lg px-4 py-1">
                Scenario {optimization.recommended_scenario}
              </Badge>
            </div>
            <p className="text-sm text-slate-300">{optimization.recommendation_reasoning}</p>
          </Card>

          {/* Scenario Comparison */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Scenario Comparison</h3>
            <div className="space-y-3">
              {optimization.scenario_analysis.map((analysis, idx) => {
                const isRecommended = analysis.scenario_id === optimization.recommended_scenario;
                return (
                  <div 
                    key={idx} 
                    className={`rounded-lg p-4 ${
                      isRecommended 
                        ? 'bg-emerald-500/10 border-2 border-emerald-500/30' 
                        : 'bg-slate-800/30 border border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-white">Scenario {analysis.scenario_id}</h4>
                      {isRecommended && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Best Option
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-400">CAPEX</p>
                        <p className="text-sm font-bold text-white">
                          ${(analysis.total_capex / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Customers</p>
                        <p className="text-sm font-bold text-white">{analysis.expected_customers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Payback</p>
                        <p className="text-sm font-bold text-white">{analysis.payback_months} mo</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">3Y ROI</p>
                        <p className="text-sm font-bold text-green-400">{analysis.roi_3year}%</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded p-3 mb-3">
                      <p className="text-xs text-slate-400 mb-2">Infrastructure Mix</p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">OLTs</p>
                          <p className="text-white font-medium">{analysis.infrastructure_mix.olts}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Fiber</p>
                          <p className="text-white font-medium">{analysis.infrastructure_mix.fiber_km} km</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Splitters</p>
                          <p className="text-white font-medium">{analysis.infrastructure_mix.splitters}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Poles</p>
                          <p className="text-white font-medium">{analysis.infrastructure_mix.poles}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Risk Score: </span>
                        <span className="text-white font-medium">{analysis.risk_score}/10</span>
                      </div>
                      <div>
                        <span className="text-slate-400">NPV: </span>
                        <span className="text-white font-medium">
                          ${(analysis.npv / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Cost Saving Opportunities */}
          {optimization.cost_saving_opportunities.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-400" />
                Cost Saving Opportunities
              </h3>
              <div className="space-y-2">
                {optimization.cost_saving_opportunities.map((opp, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                    <p className="text-sm text-slate-300">{opp.opportunity}</p>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      Save ${(opp.potential_savings / 1000).toFixed(0)}K
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Insights */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Optimization Insights</h3>
            <ul className="space-y-2">
              {optimization.optimization_insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <DollarSign className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
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