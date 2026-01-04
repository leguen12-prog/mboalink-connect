import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Info, History, DollarSign, AlertTriangle, Calendar,
  Plus, CheckCircle2, TrendingUp, Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '../ui/StatusBadge';

export default function AssetDetailsDialog({ asset, open, onOpenChange, maintenanceHistory, predictions }) {
  const [editMode, setEditMode] = useState(false);
  const [editedAsset, setEditedAsset] = useState(asset);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const queryClient = useQueryClient();

  const updateAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.GISAsset.update(asset.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gis-assets']);
      toast.success('Asset updated');
      setEditMode(false);
    }
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: (data) => base44.entities.AssetMaintenanceHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenance-history']);
      toast.success('Maintenance record created');
      setShowAddMaintenance(false);
    }
  });

  const handleSave = () => {
    updateAssetMutation.mutate(editedAsset);
  };

  const totalCost = (asset.procurement_cost || 0) + 
                    (asset.installation_cost || 0) + 
                    (asset.total_maintenance_cost || 0);

  const activePrediction = predictions.find(p => p.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{asset.name || asset.asset_id}</DialogTitle>
              <p className="text-slate-400 capitalize mt-1">{asset.asset_type}</p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={asset.status} />
              <Badge variant="outline" className={
                asset.lifecycle_stage === 'operational' ? 'border-green-500/30 text-green-400' :
                'border-blue-500/30 text-blue-400'
              }>
                {asset.lifecycle_stage}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {activePrediction && (
          <Card className="bg-red-500/10 border-red-500/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold">Predictive Maintenance Alert</p>
                <p className="text-sm text-slate-300 mt-1">{activePrediction.analysis_summary}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Risk: {activePrediction.risk_level}
                  </Badge>
                  <Badge variant="outline">
                    {activePrediction.days_until_failure} days until failure
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="details">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="details">
              <Info className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="w-4 h-4 mr-2" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="costs">
              <DollarSign className="w-4 h-4 mr-2" />
              Costs
            </TabsTrigger>
            <TabsTrigger value="lifecycle">
              <TrendingUp className="w-4 h-4 mr-2" />
              Lifecycle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Asset ID</Label>
                <Input
                  value={editMode ? editedAsset.asset_id : asset.asset_id}
                  onChange={(e) => setEditedAsset({...editedAsset, asset_id: e.target.value})}
                  disabled={!editMode}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Name</Label>
                <Input
                  value={editMode ? editedAsset.name : asset.name}
                  onChange={(e) => setEditedAsset({...editedAsset, name: e.target.value})}
                  disabled={!editMode}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Vendor</Label>
                <Input
                  value={editMode ? editedAsset.vendor : asset.vendor}
                  onChange={(e) => setEditedAsset({...editedAsset, vendor: e.target.value})}
                  disabled={!editMode}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Model</Label>
                <Input
                  value={editMode ? editedAsset.model : asset.model}
                  onChange={(e) => setEditedAsset({...editedAsset, model: e.target.value})}
                  disabled={!editMode}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Serial Number</Label>
                <Input
                  value={editMode ? editedAsset.serial_number : asset.serial_number}
                  onChange={(e) => setEditedAsset({...editedAsset, serial_number: e.target.value})}
                  disabled={!editMode}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Criticality</Label>
                <Select
                  value={editMode ? editedAsset.criticality : asset.criticality}
                  onValueChange={(v) => setEditedAsset({...editedAsset, criticality: v})}
                  disabled={!editMode}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {asset.health_score && (
              <Card className="bg-slate-800/30 p-4">
                <Label className="text-slate-400 mb-2 block">Health Score</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        asset.health_score > 70 ? 'bg-green-500' :
                        asset.health_score > 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${asset.health_score}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-white">{asset.health_score}</span>
                </div>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              {editMode ? (
                <>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)} variant="outline">
                  Edit Details
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Maintenance History</h3>
              <Button onClick={() => setShowAddMaintenance(!showAddMaintenance)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Maintenance
              </Button>
            </div>

            {showAddMaintenance && (
              <Card className="bg-slate-800/30 p-4">
                <h4 className="font-medium text-white mb-3">New Maintenance Record</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Select>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Maintenance Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="predictive">Predictive</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" className="bg-slate-800/50 border-slate-700 text-white" />
                </div>
                <Textarea 
                  placeholder="Description..." 
                  className="mt-3 bg-slate-800/50 border-slate-700 text-white"
                />
                <Button className="mt-3 w-full">Create Maintenance Record</Button>
              </Card>
            )}

            <div className="space-y-2">
              {maintenanceHistory.length > 0 ? (
                maintenanceHistory.map((record, idx) => (
                  <Card key={idx} className="bg-slate-800/30 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white capitalize">{record.maintenance_type}</p>
                        <p className="text-xs text-slate-400">
                          {record.completed_date ? 
                            new Date(record.completed_date).toLocaleDateString() :
                            `Scheduled: ${new Date(record.scheduled_date).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <StatusBadge status={record.status} />
                    </div>
                    <p className="text-sm text-slate-300">{record.description}</p>
                    {record.total_cost && (
                      <p className="text-sm text-green-400 mt-2">Cost: ${record.total_cost}</p>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8">No maintenance history</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/20 p-4">
                <p className="text-sm text-blue-400">Procurement</p>
                <p className="text-2xl font-bold text-white">${(asset.procurement_cost || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {asset.procurement_date && new Date(asset.procurement_date).toLocaleDateString()}
                </p>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20 p-4">
                <p className="text-sm text-purple-400">Installation</p>
                <p className="text-2xl font-bold text-white">${(asset.installation_cost || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {asset.installation_date && new Date(asset.installation_date).toLocaleDateString()}
                </p>
              </Card>
              <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/20 p-4">
                <p className="text-sm text-amber-400">Maintenance</p>
                <p className="text-2xl font-bold text-white">${(asset.total_maintenance_cost || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">{maintenanceHistory.length} records</p>
              </Card>
              <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-500/20 p-4">
                <p className="text-sm text-green-400">Total Cost</p>
                <p className="text-2xl font-bold text-white">${totalCost.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">All time</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-4 mt-4">
            <div className="relative">
              {/* Timeline */}
              <div className="space-y-6">
                {[
                  { stage: 'procurement', label: 'Procurement', date: asset.procurement_date, icon: DollarSign },
                  { stage: 'installation', label: 'Installation', date: asset.installation_date, icon: Wrench },
                  { stage: 'operational', label: 'Operational', icon: CheckCircle2 },
                  { stage: 'maintenance', label: 'Maintenance', date: asset.last_maintenance_date, icon: Calendar },
                  { stage: 'decommissioning', label: 'Decommissioning', date: asset.decommission_date, icon: AlertTriangle }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = asset.lifecycle_stage === item.stage;
                  const isPast = ['procurement', 'installation'].includes(item.stage) && 
                                 asset.lifecycle_stage === 'operational';
                  
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isActive ? 'bg-blue-500/20 border-blue-500' :
                        isPast ? 'bg-green-500/20 border-green-500' :
                        'bg-slate-800 border-slate-700'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isActive ? 'text-blue-400' :
                          isPast ? 'text-green-400' :
                          'text-slate-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                          {item.label}
                        </p>
                        {item.date && (
                          <p className="text-xs text-slate-500">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        )}
                        {isActive && (
                          <Badge className="mt-2 bg-blue-500/10 text-blue-400 border-blue-500/20">
                            Current Stage
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {asset.expected_lifespan_years && (
              <Card className="bg-slate-800/30 p-4 mt-6">
                <p className="text-sm text-slate-400 mb-2">Expected Lifespan</p>
                <p className="text-lg font-bold text-white">{asset.expected_lifespan_years} years</p>
                {asset.installation_date && (
                  <p className="text-xs text-slate-500 mt-1">
                    End of life: {new Date(new Date(asset.installation_date).setFullYear(
                      new Date(asset.installation_date).getFullYear() + asset.expected_lifespan_years
                    )).toLocaleDateString()}
                  </p>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}