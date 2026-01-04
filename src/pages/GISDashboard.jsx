import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Map, Layers, Search, Navigation, MapPin, Activity, TrendingUp, Database, Brain, BarChart3 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import GISMapCore from '../components/gis/GISMapCore';
import { GISService } from '../components/gis/GISService';
import DemandPrediction from '../components/gis/analytics/DemandPrediction';
import ExpansionPlanner from '../components/gis/analytics/ExpansionPlanner';
import AnalyticsHeatmap from '../components/gis/analytics/AnalyticsHeatmap';
import TrendAnalysis from '../components/gis/analytics/TrendAnalysis';
import PredictiveMaintenanceGIS from '../components/gis/analytics/PredictiveMaintenanceGIS';
import NetworkSimulator from '../components/gis/analytics/NetworkSimulator';
import CAPEXScenarioModeler from '../components/gis/analytics/CAPEXScenarioModeler';
import CapexOptimizer from '../components/gis/analytics/CapexOptimizer';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function GISDashboard() {
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');
  const [serviceabilityResult, setServiceabilityResult] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [demandZones, setDemandZones] = useState([]);
  const [expansionPlan, setExpansionPlan] = useState(null);

  // Fetch GIS statistics
  const { data: assets = [] } = useQuery({
    queryKey: ['gis-assets'],
    queryFn: () => base44.entities.GISAsset.list()
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['fibre-routes'],
    queryFn: () => base44.entities.FibreRoute.list()
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['serviceability-zones'],
    queryFn: () => base44.entities.ServiceabilityZone.list()
  });

  const handleServiceabilityCheck = async () => {
    if (!searchLat || !searchLng) {
      toast.error('Please enter coordinates');
      return;
    }

    try {
      const result = await GISService.checkServiceability(
        parseFloat(searchLat),
        parseFloat(searchLng)
      );
      setServiceabilityResult(result);
      
      if (result.serviceable) {
        toast.success('Address is serviceable!');
      } else {
        toast.warning('Address is not serviceable');
      }
    } catch (error) {
      toast.error('Serviceability check failed');
    }
  };

  const handleSyncInventory = async () => {
    try {
      toast.info('Syncing inventory to GIS...');
      const result = await GISService.syncInventoryToGIS();
      toast.success(result.message);
    } catch (error) {
      toast.error('Inventory sync failed');
    }
  };

  // Calculate stats
  const stats = {
    totalAssets: assets.length,
    activeAssets: assets.filter(a => a.status === 'active').length,
    totalRoutes: routes.length,
    totalRouteLength: routes.reduce((sum, r) => sum + (r.length_meters || 0), 0) / 1000,
    serviceableZones: zones.filter(z => z.serviceability_status === 'fully_serviceable').length,
    totalZones: zones.length
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GIS Command Center"
        subtitle="Geospatial network management and analytics"
      >
        <div className="flex gap-2">
          <Button
            onClick={handleSyncInventory}
            variant="outline"
            className="border-slate-700"
          >
            <Database className="w-4 h-4 mr-2" />
            Sync Inventory
          </Button>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Assets</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalAssets}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Assets</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.activeAssets}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Fibre Routes</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalRoutes}</p>
            </div>
            <Navigation className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Length</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalRouteLength.toFixed(1)} km</p>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="map">
            <Map className="w-4 h-4 mr-2" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="demand">
            <Brain className="w-4 h-4 mr-2" />
            AI Demand
          </TabsTrigger>
          <TabsTrigger value="serviceability">
            <Search className="w-4 h-4 mr-2" />
            Serviceability
          </TabsTrigger>
          <TabsTrigger value="simulation">
            <Activity className="w-4 h-4 mr-2" />
            Simulation
          </TabsTrigger>
          <TabsTrigger value="layers">
            <Layers className="w-4 h-4 mr-2" />
            Layers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <GISMapCore
              onAssetClick={setSelectedAsset}
              height="700px"
            />
          </Card>

          {selectedAsset && (
            <Card className="bg-slate-900/50 border-slate-800 p-4 mt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Asset Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Asset ID</p>
                  <p className="text-white">{selectedAsset.asset_id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Type</p>
                  <Badge>{selectedAsset.asset_type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge>{selectedAsset.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Capacity</p>
                  <p className="text-white">
                    {selectedAsset.capacity?.used}/{selectedAsset.capacity?.total}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsHeatmap center={[4.0511, 9.7679]} />
        </TabsContent>

        <TabsContent value="demand" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <DemandPrediction 
                onPredictionComplete={(zones) => setDemandZones(zones)}
              />
              <TrendAnalysis />
            </div>
            <div className="space-y-4">
              <ExpansionPlanner 
                demandZones={demandZones}
                onPlanGenerated={(plan) => setExpansionPlan(plan)}
              />
              <PredictiveMaintenanceGIS />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="simulation" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <NetworkSimulator />
            <CapexOptimizer />
          </div>
        </TabsContent>

        <TabsContent value="serviceability" className="mt-4 space-y-4">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Check Serviceability</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Latitude</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={searchLat}
                  onChange={(e) => setSearchLat(e.target.value)}
                  placeholder="4.0511"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Longitude</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={searchLng}
                  onChange={(e) => setSearchLng(e.target.value)}
                  placeholder="9.7679"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>

            <Button onClick={handleServiceabilityCheck} className="w-full">
              <Search className="w-4 h-4 mr-2" />
              Check Serviceability
            </Button>

            {serviceabilityResult && (
              <div className="mt-6 p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                <h4 className="font-semibold text-white mb-3">Result</h4>
                {serviceabilityResult.serviceable ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium">Serviceable</span>
                    </div>
                    <p className="text-sm text-slate-300">Technology: {serviceabilityResult.technology}</p>
                    <p className="text-sm text-slate-300">Max Speed: {serviceabilityResult.max_speed} Mbps</p>
                    <p className="text-sm text-slate-300">Serving OLT: {serviceabilityResult.serving_olt}</p>
                    <p className="text-sm text-slate-300">Zone: {serviceabilityResult.zone?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-400 font-medium">Not Serviceable</span>
                    </div>
                    <p className="text-sm text-slate-300">{serviceabilityResult.message}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="layers" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">GIS Layers</h3>
            <div className="space-y-3">
              {['Infrastructure', 'Customer', 'Operational', 'Engineering', 'Base Map'].map(layer => (
                <div key={layer} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-white">{layer}</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}