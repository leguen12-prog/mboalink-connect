import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import GISMapCore from '../components/gis/GISMapCore';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Map, Brain, Sparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function NetworkMap() {
  const [selectedAsset, setSelectedAsset] = useState(null);

  const { data: gisAssets = [] } = useQuery({
    queryKey: ['gis-assets'],
    queryFn: () => base44.entities.GISAsset.list()
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['serviceability-zones'],
    queryFn: () => base44.entities.ServiceabilityZone.list()
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['fibre-routes'],
    queryFn: () => base44.entities.FibreRoute.list()
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Network Map" 
        subtitle="Geospatial visualization of network infrastructure and coverage"
      >
        <Link to={createPageUrl('GISDashboard')}>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Brain className="w-4 h-4 mr-2" />
            Advanced GIS Dashboard
          </Button>
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">GIS Assets</p>
              <p className="text-2xl font-bold text-white">{gisAssets.length}</p>
            </div>
            <Map className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Fibre Routes</p>
              <p className="text-2xl font-bold text-white">{routes.length}</p>
            </div>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Coverage Zones</p>
              <p className="text-2xl font-bold text-white">{zones.length}</p>
            </div>
            <Map className="w-8 h-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* GIS Map */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <GISMapCore
          onAssetClick={setSelectedAsset}
          height="700px"
          showControls={true}
        />
      </Card>

      {selectedAsset && (
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Selected Asset</h3>
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
            {selectedAsset.capacity && (
              <div>
                <p className="text-sm text-slate-400">Capacity</p>
                <p className="text-white">
                  {selectedAsset.capacity.used}/{selectedAsset.capacity.total}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <h3 className="text-white font-semibold mb-2">🚀 GIS Integration Active</h3>
        <p className="text-sm text-slate-300">
          Full GIS subsystem deployed with infrastructure layers, fibre routes, serviceability zones, and real-time event tracking. Visit the GIS Dashboard for advanced analytics, demand prediction, and network simulation tools.
        </p>
      </div>
    </div>
  );
}