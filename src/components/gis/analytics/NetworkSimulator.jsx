import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, GitBranch, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function NetworkSimulator({ onSimulationComplete }) {
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState(null);
  const [scenario, setScenario] = useState({
    type: 'upgrade',
    target: '',
    newCapacity: '',
    estimatedCustomers: ''
  });

  const runSimulation = async () => {
    if (!scenario.type || !scenario.target) {
      toast.error('Please fill in scenario details');
      return;
    }

    setSimulating(true);

    try {
      const [customers, olts, onts, zones] = await Promise.all([
        base44.entities.Customer.list(),
        base44.entities.OLT.list(),
        base44.entities.ONT.list(),
        base44.entities.ServiceabilityZone.list()
      ]);

      const aiPrompt = `You are a network simulation expert. Simulate the impact of a planned network change.

Scenario Type: ${scenario.type}
Target: ${scenario.target}
${scenario.newCapacity ? `New Capacity: ${scenario.newCapacity}` : ''}
${scenario.estimatedCustomers ? `Expected New Customers: ${scenario.estimatedCustomers}` : ''}

Current Network State:
- Total Customers: ${customers.length}
- Active OLTs: ${olts.filter(o => o.status === 'online').length}
- Total ONTs: ${onts.length}
- Serviceability Zones: ${zones.length}

Simulate and predict:
1. Network capacity impact
2. Performance changes
3. Customer experience improvements
4. Potential bottlenecks
5. ROI and payback period
6. Risk assessment
7. Recommended deployment strategy`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            capacity_impact: {
              type: "object",
              properties: {
                before_capacity: { type: "number" },
                after_capacity: { type: "number" },
                increase_percent: { type: "number" },
                additional_customers_supported: { type: "number" }
              }
            },
            performance_impact: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  metric: { type: "string" },
                  before: { type: "string" },
                  after: { type: "string" },
                  improvement: { type: "string" }
                }
              }
            },
            customer_experience: {
              type: "object",
              properties: {
                expected_satisfaction_increase: { type: "number" },
                reduced_complaints_percent: { type: "number" },
                improved_speeds: { type: "string" }
              }
            },
            potential_bottlenecks: {
              type: "array",
              items: { type: "string" }
            },
            financial_projection: {
              type: "object",
              properties: {
                capex: { type: "number" },
                monthly_revenue_increase: { type: "number" },
                payback_months: { type: "number" },
                roi_3year: { type: "number" }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            deployment_strategy: { type: "array", items: { type: "string" } }
          }
        }
      });

      setResults(aiResponse);
      onSimulationComplete && onSimulationComplete(aiResponse);
      toast.success('Simulation complete');

    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('Failed to run simulation');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Scenario Parameters</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Scenario Type</label>
            <Select value={scenario.type} onValueChange={(v) => setScenario({...scenario, type: v})}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="upgrade">Upgrade Existing</SelectItem>
                <SelectItem value="new_deployment">New Deployment</SelectItem>
                <SelectItem value="expansion">Service Expansion</SelectItem>
                <SelectItem value="optimization">Optimization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Target (OLT/Zone ID)</label>
            <Input
              value={scenario.target}
              onChange={(e) => setScenario({...scenario, target: e.target.value})}
              placeholder="e.g., OLT-001 or Zone-ABC"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">New Capacity (optional)</label>
            <Input
              type="number"
              value={scenario.newCapacity}
              onChange={(e) => setScenario({...scenario, newCapacity: e.target.value})}
              placeholder="e.g., 512"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Expected New Customers (optional)</label>
            <Input
              type="number"
              value={scenario.estimatedCustomers}
              onChange={(e) => setScenario({...scenario, estimatedCustomers: e.target.value})}
              placeholder="e.g., 200"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <Button
            onClick={runSimulation}
            disabled={simulating}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600"
          >
            {simulating ? (
              <>
                <GitBranch className="w-4 h-4 mr-2 animate-pulse" />
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </Card>

      {results && (
        <div className="space-y-4">
          {/* Capacity Impact */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Capacity Impact
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Before</p>
                <p className="text-xl font-bold text-white">{results.capacity_impact.before_capacity}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">After</p>
                <p className="text-xl font-bold text-green-400">{results.capacity_impact.after_capacity}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 col-span-2">
                <p className="text-xs text-green-400">Increase</p>
                <p className="text-2xl font-bold text-white">
                  +{results.capacity_impact.increase_percent}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports {results.capacity_impact.additional_customers_supported} more customers
                </p>
              </div>
            </div>
          </Card>

          {/* Performance Impact */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Performance Impact</h3>
            <div className="space-y-2">
              {results.performance_impact.map((metric, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white">{metric.metric}</p>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      {metric.improvement}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{metric.before}</span>
                    <span>→</span>
                    <span className="text-green-400">{metric.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Customer Experience */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Customer Experience
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Satisfaction Increase</span>
                <span className="text-white font-medium">
                  +{results.customer_experience.expected_satisfaction_increase}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reduced Complaints</span>
                <span className="text-green-400 font-medium">
                  -{results.customer_experience.reduced_complaints_percent}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Speed Improvements</span>
                <span className="text-white font-medium">
                  {results.customer_experience.improved_speeds}
                </span>
              </div>
            </div>
          </Card>

          {/* Financial Projection */}
          <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Financial Projection</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">CAPEX</p>
                <p className="text-lg font-bold text-white">
                  ${(results.financial_projection.capex / 1000).toFixed(1)}K
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Revenue/Month</p>
                <p className="text-lg font-bold text-green-400">
                  +${(results.financial_projection.monthly_revenue_increase / 1000).toFixed(1)}K
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Payback</p>
                <p className="text-lg font-bold text-white">
                  {results.financial_projection.payback_months} mo
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">3-Year ROI</p>
                <p className="text-lg font-bold text-blue-400">
                  {results.financial_projection.roi_3year}%
                </p>
              </div>
            </div>
          </Card>

          {/* Risks */}
          {results.risks.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Risk Assessment</h3>
              <div className="space-y-2">
                {results.risks.map((risk, idx) => (
                  <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-white">{risk.risk}</p>
                      <Badge variant="outline" className="text-xs">
                        {risk.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{risk.mitigation}</p>
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