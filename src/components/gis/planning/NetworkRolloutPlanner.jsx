import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Map, MapPin, TrendingUp, DollarSign, Route, 
  Building2, Loader2, FileText, Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function NetworkRolloutPlanner() {
  const [targetArea, setTargetArea] = useState({
    name: '',
    center_lat: '',
    center_lng: '',
    radius_km: ''
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { data: zones = [] } = useQuery({
    queryKey: ['serviceability-zones'],
    queryFn: () => base44.entities.ServiceabilityZone.list()
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['gis-assets'],
    queryFn: () => base44.entities.GISAsset.list()
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list()
  });

  const handleAnalyze = async () => {
    if (!targetArea.center_lat || !targetArea.center_lng || !targetArea.radius_km) {
      toast.error('Please fill all area details');
      return;
    }

    setAnalyzing(true);
    try {
      const nearbyAssets = assets.filter(a => a.geometry?.coordinates);
      const nearbyCustomers = customers.filter(c => c.address?.gps_coordinates);

      const prompt = `You are a network planning expert. Analyze this area for fiber network rollout:

TARGET AREA:
- Location: ${targetArea.name}
- Center: ${targetArea.center_lat}, ${targetArea.center_lng}
- Radius: ${targetArea.radius_km} km

EXISTING INFRASTRUCTURE:
- Nearby OLTs: ${nearbyAssets.filter(a => a.asset_type === 'olt').length}
- Existing routes: ${nearbyAssets.filter(a => a.asset_type === 'fibre_route').length}
- Serviceability zones: ${zones.length}

MARKET DATA:
- Potential customers in area: ${nearbyCustomers.length}
- Existing customers: ${customers.filter(c => c.status === 'active').length}

Provide a comprehensive network rollout plan with:
1. Feasibility Assessment (terrain, existing infrastructure, market potential)
2. Route Design (optimal fiber routes, splitter locations, cabinet sites)
3. Capacity Planning (recommended OLT/PON capacity, homes passed)
4. Site Selection (best locations for cabinets/OLTs with GPS coordinates)
5. Cost Estimation (duct, fiber, equipment, labor costs with breakdown)
6. Construction Phases (phased rollout plan with timelines)
7. ROI Analysis (expected revenue, payback period)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            feasibility: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                terrain_analysis: { type: 'string' },
                infrastructure_readiness: { type: 'string' },
                market_potential: { type: 'string' },
                challenges: { type: 'array', items: { type: 'string' } }
              }
            },
            route_design: {
              type: 'object',
              properties: {
                total_route_km: { type: 'number' },
                recommended_routes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      from_location: { type: 'string' },
                      to_location: { type: 'string' },
                      length_km: { type: 'number' },
                      route_type: { type: 'string' }
                    }
                  }
                },
                splitter_locations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      lat: { type: 'number' },
                      lng: { type: 'number' },
                      split_ratio: { type: 'string' }
                    }
                  }
                }
              }
            },
            capacity_planning: {
              type: 'object',
              properties: {
                homes_passed: { type: 'number' },
                required_olts: { type: 'number' },
                pon_ports_needed: { type: 'number' },
                expected_take_rate: { type: 'number' }
              }
            },
            site_selection: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  site_type: { type: 'string' },
                  location: { type: 'string' },
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  rationale: { type: 'string' }
                }
              }
            },
            cost_estimation: {
              type: 'object',
              properties: {
                duct_cost: { type: 'number' },
                fiber_cost: { type: 'number' },
                equipment_cost: { type: 'number' },
                labor_cost: { type: 'number' },
                total_capex: { type: 'number' },
                cost_per_home: { type: 'number' }
              }
            },
            construction_phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration_weeks: { type: 'number' },
                  description: { type: 'string' },
                  cost: { type: 'number' },
                  homes_passed: { type: 'number' }
                }
              }
            },
            roi_analysis: {
              type: 'object',
              properties: {
                monthly_revenue: { type: 'number' },
                annual_revenue: { type: 'number' },
                payback_months: { type: 'number' },
                five_year_roi: { type: 'number' }
              }
            }
          }
        }
      });

      setAnalysis(response);
      toast.success('Network rollout plan generated');
    } catch (error) {
      toast.error('Analysis failed');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const exportPlan = () => {
    const planText = JSON.stringify(analysis, null, 2);
    const blob = new Blob([planText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rollout-plan-${targetArea.name.replace(/\s/g, '-')}.json`;
    a.click();
    toast.success('Plan exported');
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-400" />
          Network Rollout Planner
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <Label className="text-slate-400">Area Name</Label>
            <Input
              value={targetArea.name}
              onChange={(e) => setTargetArea({...targetArea, name: e.target.value})}
              placeholder="e.g., Downtown District"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-400">Center Latitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={targetArea.center_lat}
              onChange={(e) => setTargetArea({...targetArea, center_lat: e.target.value})}
              placeholder="4.0511"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-400">Center Longitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={targetArea.center_lng}
              onChange={(e) => setTargetArea({...targetArea, center_lng: e.target.value})}
              placeholder="9.7679"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-400">Coverage Radius (km)</Label>
            <Input
              type="number"
              step="0.1"
              value={targetArea.radius_km}
              onChange={(e) => setTargetArea({...targetArea, radius_km: e.target.value})}
              placeholder="5"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        </div>

        <Button 
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Network Rollout...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Rollout Plan
            </>
          )}
        </Button>
      </Card>

      {analysis && (
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Rollout Plan: {targetArea.name}</h3>
            <Button onClick={exportPlan} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Plan
            </Button>
          </div>

          <Tabs defaultValue="feasibility">
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="feasibility">Feasibility</TabsTrigger>
              <TabsTrigger value="routes">Route Design</TabsTrigger>
              <TabsTrigger value="capacity">Capacity</TabsTrigger>
              <TabsTrigger value="sites">Sites</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="roi">ROI</TabsTrigger>
            </TabsList>

            <TabsContent value="feasibility" className="space-y-4">
              <Card className="bg-slate-800/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">Feasibility Score</h4>
                  <Badge className={`${
                    analysis.feasibility.score > 80 ? 'bg-green-500/20 text-green-400' :
                    analysis.feasibility.score > 60 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {analysis.feasibility.score}/100
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Terrain Analysis</p>
                    <p className="text-white">{analysis.feasibility.terrain_analysis}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Infrastructure Readiness</p>
                    <p className="text-white">{analysis.feasibility.infrastructure_readiness}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Market Potential</p>
                    <p className="text-white">{analysis.feasibility.market_potential}</p>
                  </div>
                  {analysis.feasibility.challenges?.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Key Challenges</p>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.feasibility.challenges.map((c, i) => (
                          <li key={i} className="text-slate-300 text-sm">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="routes" className="space-y-4">
              <Card className="bg-slate-800/30 p-4">
                <p className="text-2xl font-bold text-white mb-4">
                  {analysis.route_design.total_route_km} km total route
                </p>
                <div className="space-y-3">
                  {analysis.route_design.recommended_routes?.map((route, i) => (
                    <div key={i} className="border-l-2 border-blue-500 pl-3">
                      <p className="font-medium text-white">{route.name}</p>
                      <p className="text-sm text-slate-400">
                        {route.from_location} → {route.to_location}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{route.length_km} km</Badge>
                        <Badge variant="outline">{route.route_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {analysis.route_design.splitter_locations?.length > 0 && (
                <Card className="bg-slate-800/30 p-4">
                  <h4 className="font-semibold text-white mb-3">Splitter Locations</h4>
                  <div className="space-y-2">
                    {analysis.route_design.splitter_locations.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                        <div>
                          <p className="text-white text-sm">{loc.name}</p>
                          <p className="text-xs text-slate-400">{loc.lat}, {loc.lng}</p>
                        </div>
                        <Badge>{loc.split_ratio}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="capacity" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/20 p-4">
                  <p className="text-sm text-blue-400">Homes Passed</p>
                  <p className="text-3xl font-bold text-white">{analysis.capacity_planning.homes_passed}</p>
                </Card>
                <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20 p-4">
                  <p className="text-sm text-purple-400">Required OLTs</p>
                  <p className="text-3xl font-bold text-white">{analysis.capacity_planning.required_olts}</p>
                </Card>
                <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-500/20 p-4">
                  <p className="text-sm text-green-400">PON Ports</p>
                  <p className="text-3xl font-bold text-white">{analysis.capacity_planning.pon_ports_needed}</p>
                </Card>
                <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/20 p-4">
                  <p className="text-sm text-amber-400">Expected Take Rate</p>
                  <p className="text-3xl font-bold text-white">{analysis.capacity_planning.expected_take_rate}%</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sites" className="space-y-3">
              {analysis.site_selection?.map((site, i) => (
                <Card key={i} className="bg-slate-800/30 p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-blue-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{site.location}</h4>
                        <Badge variant="outline">{site.site_type}</Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {site.lat}, {site.lng}
                      </p>
                      <p className="text-sm text-slate-300">{site.rationale}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-500/20 p-6">
                <p className="text-sm text-green-400 mb-2">Total CAPEX</p>
                <p className="text-4xl font-bold text-white">
                  ${(analysis.cost_estimation.total_capex / 1000000).toFixed(2)}M
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  ${analysis.cost_estimation.cost_per_home.toLocaleString()} per home
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Duct Installation', value: analysis.cost_estimation.duct_cost },
                  { label: 'Fiber Cable', value: analysis.cost_estimation.fiber_cost },
                  { label: 'Equipment', value: analysis.cost_estimation.equipment_cost },
                  { label: 'Labor', value: analysis.cost_estimation.labor_cost }
                ].map((item, i) => (
                  <Card key={i} className="bg-slate-800/30 p-4">
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="text-xl font-bold text-white">${(item.value / 1000).toFixed(0)}K</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="phases" className="space-y-3">
              {analysis.construction_phases?.map((phase, i) => (
                <Card key={i} className="bg-slate-800/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{phase.phase}</h4>
                    <Badge>{phase.duration_weeks} weeks</Badge>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{phase.description}</p>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Cost</p>
                      <p className="text-white font-medium">${(phase.cost / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Homes Passed</p>
                      <p className="text-white font-medium">{phase.homes_passed}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="roi" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/20 p-4">
                  <p className="text-sm text-blue-400">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">${(analysis.roi_analysis.monthly_revenue / 1000).toFixed(1)}K</p>
                </Card>
                <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20 p-4">
                  <p className="text-sm text-purple-400">Annual Revenue</p>
                  <p className="text-2xl font-bold text-white">${(analysis.roi_analysis.annual_revenue / 1000000).toFixed(2)}M</p>
                </Card>
                <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-500/20 p-4">
                  <p className="text-sm text-green-400">Payback Period</p>
                  <p className="text-2xl font-bold text-white">{analysis.roi_analysis.payback_months} months</p>
                </Card>
                <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/20 p-4">
                  <p className="text-sm text-amber-400">5-Year ROI</p>
                  <p className="text-2xl font-bold text-white">{analysis.roi_analysis.five_year_roi}%</p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}