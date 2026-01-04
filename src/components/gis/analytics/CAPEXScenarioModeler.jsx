import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Plus, Trash2, TrendingUp, DollarSign, AlertTriangle, CheckCircle2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function CAPEXScenarioModeler() {
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Scenario 1',
      budget: '',
      targetZones: [],
      timeline: '',
      priority: 'balanced',
      notes: ''
    }
  ]);
  const [analyzing, setAnalyzing] = useState(false);
  const [comparativeResults, setComparativeResults] = useState(null);

  const { data: zones = [] } = useQuery({
    queryKey: ['serviceability-zones'],
    queryFn: () => base44.entities.ServiceabilityZone.list()
  });

  const { data: olts = [] } = useQuery({
    queryKey: ['olts'],
    queryFn: () => base44.entities.OLT.list()
  });

  const addScenario = () => {
    setScenarios([
      ...scenarios,
      {
        id: Date.now(),
        name: `Scenario ${scenarios.length + 1}`,
        budget: '',
        targetZones: [],
        timeline: '',
        priority: 'balanced',
        notes: ''
      }
    ]);
  };

  const removeScenario = (id) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter(s => s.id !== id));
    }
  };

  const updateScenario = (id, field, value) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const runComparativeAnalysis = async () => {
    const incompleteScenarios = scenarios.filter(s => !s.budget || !s.timeline || s.targetZones.length === 0);
    if (incompleteScenarios.length > 0) {
      toast.error('Please complete all scenario details');
      return;
    }

    setAnalyzing(true);

    try {
      const [customers, tickets] = await Promise.all([
        base44.entities.Customer.list(),
        base44.entities.Ticket.list('-created_date', 100)
      ]);

      const aiPrompt = `You are an expert financial analyst and network planning consultant. Perform comprehensive CAPEX optimization analysis for multiple network deployment scenarios.

CURRENT NETWORK STATE:
- Total Customers: ${customers.length}
- Active Customers: ${customers.filter(c => c.status === 'active').length}
- Average Revenue per Customer: $${(customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length).toFixed(2)}/month
- Active OLTs: ${olts.filter(o => o.status === 'online').length}
- Total OLTs: ${olts.length}
- Recent Tickets: ${tickets.length} (last 100)
- Available Zones: ${zones.length}

SCENARIOS TO ANALYZE:
${scenarios.map((s, idx) => `
Scenario ${idx + 1}: ${s.name}
- Budget: $${s.budget}
- Target Zones: ${s.targetZones.join(', ')}
- Timeline: ${s.timeline} months
- Priority: ${s.priority}
- Notes: ${s.notes || 'None'}
`).join('\n')}

For each scenario, calculate and compare:
1. NPV (Net Present Value) - 5 year projection
2. ROI (Return on Investment) - 3 and 5 year
3. IRR (Internal Rate of Return)
4. Payback period
5. Risk score (0-100, 100 = highest risk)
6. Projected customer acquisition
7. Revenue growth trajectory
8. Market share impact
9. Competitive advantage score
10. Implementation complexity (1-10)

Provide:
- Detailed financial metrics for EACH scenario
- Side-by-side comparison table
- Risk-adjusted returns
- Sensitivity analysis for each scenario
- Clear recommendation of the OPTIMAL scenario with justification
- Alternative recommendations for different risk appetites

Be specific with numbers and provide realistic projections based on the data.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            scenario_analyses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenario_name: { type: "string" },
                  npv_5year: { type: "number" },
                  roi_3year: { type: "number" },
                  roi_5year: { type: "number" },
                  irr: { type: "number" },
                  payback_months: { type: "number" },
                  risk_score: { type: "number" },
                  projected_customers: { type: "number" },
                  revenue_year1: { type: "number" },
                  revenue_year3: { type: "number" },
                  revenue_year5: { type: "number" },
                  market_share_increase: { type: "number" },
                  competitive_advantage_score: { type: "number" },
                  implementation_complexity: { type: "number" },
                  key_benefits: { type: "array", items: { type: "string" } },
                  key_risks: { type: "array", items: { type: "string" } }
                }
              }
            },
            comparison_matrix: {
              type: "object",
              properties: {
                best_npv: { type: "string" },
                best_roi: { type: "string" },
                lowest_risk: { type: "string" },
                fastest_payback: { type: "string" },
                highest_customer_growth: { type: "string" }
              }
            },
            optimal_recommendation: {
              type: "object",
              properties: {
                recommended_scenario: { type: "string" },
                justification: { type: "string" },
                confidence_level: { type: "number" },
                expected_outcome: { type: "string" },
                critical_success_factors: { type: "array", items: { type: "string" } },
                implementation_phases: { type: "array", items: { type: "string" } }
              }
            },
            alternative_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk_profile: { type: "string" },
                  scenario: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            sensitivity_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenario: { type: "string" },
                  variable: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            executive_summary: { type: "string" }
          }
        }
      });

      setComparativeResults(aiResponse);
      toast.success('Comparative analysis complete');

    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">CAPEX Scenario Modeling</h3>
            <p className="text-sm text-slate-400">
              Create multiple deployment scenarios and get AI-driven comparative analysis with ROI, NPV, and risk assessments
            </p>
          </div>
          <Button onClick={addScenario} size="sm" variant="outline" className="border-indigo-500/30 text-indigo-400">
            <Plus className="w-4 h-4 mr-2" />
            Add Scenario
          </Button>
        </div>

        <div className="grid gap-4 mt-6">
          {scenarios.map((scenario, idx) => (
            <Card key={scenario.id} className="bg-slate-900/50 border-slate-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <Input
                  value={scenario.name}
                  onChange={(e) => updateScenario(scenario.id, 'name', e.target.value)}
                  className="max-w-xs bg-slate-800/50 border-slate-700 text-white font-semibold"
                  placeholder="Scenario name"
                />
                {scenarios.length > 1 && (
                  <Button
                    onClick={() => removeScenario(scenario.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 text-xs">Budget (USD)</Label>
                  <Input
                    type="number"
                    value={scenario.budget}
                    onChange={(e) => updateScenario(scenario.id, 'budget', e.target.value)}
                    placeholder="e.g., 500000"
                    className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400 text-xs">Timeline (months)</Label>
                  <Input
                    type="number"
                    value={scenario.timeline}
                    onChange={(e) => updateScenario(scenario.id, 'timeline', e.target.value)}
                    placeholder="e.g., 12"
                    className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400 text-xs">Priority</Label>
                  <Select
                    value={scenario.priority}
                    onValueChange={(v) => updateScenario(scenario.id, 'priority', v)}
                  >
                    <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="aggressive_growth">Aggressive Growth</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="risk_minimization">Risk Minimization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-400 text-xs">Target Zones</Label>
                  <Input
                    value={scenario.targetZones.join(', ')}
                    onChange={(e) => updateScenario(scenario.id, 'targetZones', e.target.value.split(',').map(z => z.trim()))}
                    placeholder="Zone-A, Zone-B"
                    className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400 text-xs">Notes</Label>
                  <Textarea
                    value={scenario.notes}
                    onChange={(e) => updateScenario(scenario.id, 'notes', e.target.value)}
                    placeholder="Strategic considerations, constraints, assumptions..."
                    className="mt-1 bg-slate-800/50 border-slate-700 text-white h-20"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          onClick={runComparativeAnalysis}
          disabled={analyzing}
          className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          {analyzing ? (
            <>
              <TrendingUp className="w-4 h-4 mr-2 animate-pulse" />
              Analyzing {scenarios.length} Scenarios...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Comparative Analysis
            </>
          )}
        </Button>
      </Card>

      {comparativeResults && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Executive Summary
            </h3>
            <p className="text-slate-300 leading-relaxed">{comparativeResults.executive_summary}</p>
          </Card>

          {/* Optimal Recommendation */}
          <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/20 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Recommended: {comparativeResults.optimal_recommendation.recommended_scenario}</h3>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 mb-3">
                  Confidence: {comparativeResults.optimal_recommendation.confidence_level}%
                </Badge>
                <p className="text-slate-300 mb-4">{comparativeResults.optimal_recommendation.justification}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Expected Outcome</p>
                    <p className="text-sm text-white">{comparativeResults.optimal_recommendation.expected_outcome}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-400 mb-2">Critical Success Factors:</p>
                    <ul className="space-y-1">
                      {comparativeResults.optimal_recommendation.critical_success_factors.map((factor, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-400 mb-2">Implementation Phases:</p>
                    <ol className="space-y-1">
                      {comparativeResults.optimal_recommendation.implementation_phases.map((phase, idx) => (
                        <li key={idx} className="text-sm text-slate-300">
                          {idx + 1}. {phase}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Comparison Matrix */}
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Comparison</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Best NPV</p>
                <p className="text-white font-semibold">{comparativeResults.comparison_matrix.best_npv}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Best ROI</p>
                <p className="text-white font-semibold">{comparativeResults.comparison_matrix.best_roi}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Lowest Risk</p>
                <p className="text-white font-semibold">{comparativeResults.comparison_matrix.lowest_risk}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Fastest Payback</p>
                <p className="text-white font-semibold">{comparativeResults.comparison_matrix.fastest_payback}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 md:col-span-2">
                <p className="text-xs text-slate-400">Highest Customer Growth</p>
                <p className="text-white font-semibold">{comparativeResults.comparison_matrix.highest_customer_growth}</p>
              </div>
            </div>
          </Card>

          {/* Detailed Scenario Analyses */}
          <div className="grid md:grid-cols-2 gap-4">
            {comparativeResults.scenario_analyses.map((analysis, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-white">{analysis.scenario_name}</h4>
                  <Badge variant="outline" className={
                    analysis.risk_score < 40 ? 'border-green-500/30 text-green-400' :
                    analysis.risk_score < 70 ? 'border-amber-500/30 text-amber-400' :
                    'border-red-500/30 text-red-400'
                  }>
                    Risk: {analysis.risk_score}/100
                  </Badge>
                </div>

                <div className="space-y-4">
                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-xs text-blue-400">NPV (5yr)</p>
                      <p className="text-lg font-bold text-white">${(analysis.npv_5year / 1000000).toFixed(2)}M</p>
                    </div>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <p className="text-xs text-green-400">ROI (5yr)</p>
                      <p className="text-lg font-bold text-white">{analysis.roi_5year}%</p>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-xs text-purple-400">IRR</p>
                      <p className="text-lg font-bold text-white">{analysis.irr}%</p>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs text-amber-400">Payback</p>
                      <p className="text-lg font-bold text-white">{analysis.payback_months} mo</p>
                    </div>
                  </div>

                  {/* Revenue Trajectory */}
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-2">Revenue Growth</p>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Year 1</p>
                        <p className="text-sm font-semibold text-white">${(analysis.revenue_year1 / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Year 3</p>
                        <p className="text-sm font-semibold text-white">${(analysis.revenue_year3 / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Year 5</p>
                        <p className="text-sm font-semibold text-green-400">${(analysis.revenue_year5 / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                  </div>

                  {/* Other Metrics */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Projected Customers</span>
                      <span className="text-white font-medium">{analysis.projected_customers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Market Share Increase</span>
                      <span className="text-green-400 font-medium">+{analysis.market_share_increase}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Competitive Advantage</span>
                      <span className="text-white font-medium">{analysis.competitive_advantage_score}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Implementation Complexity</span>
                      <span className="text-white font-medium">{analysis.implementation_complexity}/10</span>
                    </div>
                  </div>

                  {/* Benefits & Risks */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-green-400 font-semibold mb-1">Key Benefits</p>
                      <ul className="space-y-1">
                        {analysis.key_benefits.slice(0, 3).map((benefit, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                            <span className="text-green-400">•</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-red-400 font-semibold mb-1">Key Risks</p>
                      <ul className="space-y-1">
                        {analysis.key_risks.slice(0, 3).map((risk, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                            <span className="text-red-400">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Alternative Recommendations */}
          {comparativeResults.alternative_recommendations.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Alternative Recommendations by Risk Profile</h3>
              <div className="space-y-3">
                {comparativeResults.alternative_recommendations.map((alt, idx) => (
                  <div key={idx} className="bg-slate-800/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">{alt.risk_profile}</Badge>
                      <p className="font-semibold text-white">{alt.scenario}</p>
                    </div>
                    <p className="text-sm text-slate-400">{alt.reasoning}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sensitivity Analysis */}
          {comparativeResults.sensitivity_analysis.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Sensitivity Analysis
              </h3>
              <div className="space-y-2">
                {comparativeResults.sensitivity_analysis.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/30 rounded-lg p-3 flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{item.scenario}</Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{item.variable}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}