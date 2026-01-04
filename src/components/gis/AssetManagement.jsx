import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Plus, Search, Filter, TrendingUp, DollarSign,
  Calendar, AlertTriangle, CheckCircle2, Clock, Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import AssetDetailsDialog from './AssetDetailsDialog';
import CreateAssetDialog from './CreateAssetDialog';
import DataTable from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';

export default function AssetManagement() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['gis-assets'],
    queryFn: () => base44.entities.GISAsset.list('-created_date')
  });

  const { data: maintenanceHistory = [] } = useQuery({
    queryKey: ['maintenance-history'],
    queryFn: () => base44.entities.AssetMaintenanceHistory.list('-created_date', 200)
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictive-maintenance'],
    queryFn: () => base44.entities.PredictiveMaintenance.filter({ status: 'active' })
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GISAsset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gis-assets']);
      toast.success('Asset updated');
    }
  });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = filterStage === 'all' || asset.lifecycle_stage === filterStage;
    
    return matchesSearch && matchesStage;
  });

  // Calculate statistics
  const stats = {
    total: assets.length,
    operational: assets.filter(a => a.lifecycle_stage === 'operational').length,
    maintenance: assets.filter(a => a.lifecycle_stage === 'maintenance').length,
    planned: assets.filter(a => a.lifecycle_stage === 'procurement' || a.lifecycle_stage === 'installation').length,
    atRisk: predictions.length,
    totalValue: assets.reduce((sum, a) => sum + (a.procurement_cost || 0), 0),
    totalMaintenanceCost: assets.reduce((sum, a) => sum + (a.total_maintenance_cost || 0), 0),
    avgHealthScore: assets.filter(a => a.health_score).reduce((sum, a) => sum + a.health_score, 0) / 
                     (assets.filter(a => a.health_score).length || 1)
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setShowDetails(true);
  };

  const handleLifecycleChange = async (asset, newStage) => {
    await updateAssetMutation.mutateAsync({
      id: asset.id,
      data: { lifecycle_stage: newStage }
    });
  };

  const columns = [
    {
      header: 'Asset ID',
      accessor: 'asset_id',
      render: (asset) => (
        <span className="font-mono text-sm text-blue-400">{asset.asset_id}</span>
      )
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (asset) => (
        <div>
          <p className="text-white font-medium">{asset.name}</p>
          <p className="text-xs text-slate-500 capitalize">{asset.asset_type}</p>
        </div>
      )
    },
    {
      header: 'Lifecycle',
      render: (asset) => (
        <Badge variant="outline" className={
          asset.lifecycle_stage === 'operational' ? 'border-green-500/30 text-green-400' :
          asset.lifecycle_stage === 'maintenance' ? 'border-amber-500/30 text-amber-400' :
          asset.lifecycle_stage === 'decommissioning' ? 'border-red-500/30 text-red-400' :
          'border-blue-500/30 text-blue-400'
        }>
          {asset.lifecycle_stage}
        </Badge>
      )
    },
    {
      header: 'Status',
      render: (asset) => <StatusBadge status={asset.status} />
    },
    {
      header: 'Health',
      render: (asset) => (
        asset.health_score ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  asset.health_score > 70 ? 'bg-green-500' :
                  asset.health_score > 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${asset.health_score}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{asset.health_score}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">N/A</span>
        )
      )
    },
    {
      header: 'Last Maintenance',
      render: (asset) => (
        asset.last_maintenance_date ? (
          <span className="text-xs text-slate-400">
            {new Date(asset.last_maintenance_date).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-xs text-slate-500">Never</span>
        )
      )
    },
    {
      header: 'Cost',
      render: (asset) => (
        <div className="text-right">
          <p className="text-sm text-white font-medium">
            ${((asset.procurement_cost || 0) / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-slate-500">
            +${((asset.total_maintenance_cost || 0) / 1000).toFixed(1)}K maint
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Asset Management</h2>
          <p className="text-slate-400 text-sm">Complete lifecycle tracking and maintenance management</p>
        </div>
        <Button 
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-blue-400" />
            <Badge variant="outline" className="text-xs">{stats.operational}/{stats.total}</Badge>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400">Total Assets</p>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">${(stats.totalValue / 1000000).toFixed(2)}M</p>
          <p className="text-xs text-slate-400">Asset Value</p>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">${(stats.totalMaintenanceCost / 1000).toFixed(1)}K</p>
          <p className="text-xs text-slate-400">Maintenance Costs</p>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.atRisk}</p>
          <p className="text-xs text-slate-400">At Risk (Predictive)</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assets..."
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'procurement', 'installation', 'operational', 'maintenance', 'decommissioning'].map(stage => (
              <Button
                key={stage}
                onClick={() => setFilterStage(stage)}
                variant={filterStage === stage ? 'default' : 'outline'}
                size="sm"
                className={filterStage === stage ? 'bg-blue-600' : 'border-slate-700'}
              >
                {stage === 'all' ? 'All' : stage}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Assets Table */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <DataTable
          columns={columns}
          data={filteredAssets}
          isLoading={isLoading}
          emptyMessage="No assets found"
          onRowClick={handleAssetClick}
        />
      </Card>

      {/* Dialogs */}
      {showDetails && selectedAsset && (
        <AssetDetailsDialog
          asset={selectedAsset}
          open={showDetails}
          onOpenChange={setShowDetails}
          maintenanceHistory={maintenanceHistory.filter(m => m.asset_id === selectedAsset.asset_id)}
          predictions={predictions.filter(p => p.device_id === selectedAsset.asset_id)}
        />
      )}

      {showCreate && (
        <CreateAssetDialog
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}
    </div>
  );
}