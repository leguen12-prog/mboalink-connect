import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CreateAssetDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    asset_id: '',
    name: '',
    asset_type: 'olt',
    lifecycle_stage: 'procurement',
    status: 'planned',
    geometry: { type: 'Point', coordinates: [9.7679, 4.0511] },
    vendor: '',
    model: '',
    procurement_cost: '',
    expected_lifespan_years: 10,
    criticality: 'medium'
  });

  const queryClient = useQueryClient();

  const createAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.GISAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['gis-assets']);
      toast.success('Asset created');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to create asset');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      procurement_cost: parseFloat(formData.procurement_cost) || 0,
      expected_lifespan_years: parseInt(formData.expected_lifespan_years) || 10
    };
    createAssetMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400">Asset ID</Label>
              <Input
                value={formData.asset_id}
                onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
                required
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="e.g., OLT-001"
              />
            </div>
            <div>
              <Label className="text-slate-400">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="e.g., Main OLT"
              />
            </div>
            <div>
              <Label className="text-slate-400">Asset Type</Label>
              <Select value={formData.asset_type} onValueChange={(v) => setFormData({...formData, asset_type: v})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="olt">OLT</SelectItem>
                  <SelectItem value="ont">ONT</SelectItem>
                  <SelectItem value="splitter">Splitter</SelectItem>
                  <SelectItem value="pole">Pole</SelectItem>
                  <SelectItem value="cabinet">Cabinet</SelectItem>
                  <SelectItem value="chamber">Chamber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Lifecycle Stage</Label>
              <Select value={formData.lifecycle_stage} onValueChange={(v) => setFormData({...formData, lifecycle_stage: v})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Vendor</Label>
              <Input
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="e.g., VSOL"
              />
            </div>
            <div>
              <Label className="text-slate-400">Model</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="e.g., V2824GB"
              />
            </div>
            <div>
              <Label className="text-slate-400">Procurement Cost ($)</Label>
              <Input
                type="number"
                value={formData.procurement_cost}
                onChange={(e) => setFormData({...formData, procurement_cost: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-slate-400">Expected Lifespan (years)</Label>
              <Input
                type="number"
                value={formData.expected_lifespan_years}
                onChange={(e) => setFormData({...formData, expected_lifespan_years: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400">Criticality</Label>
              <Select value={formData.criticality} onValueChange={(v) => setFormData({...formData, criticality: v})}>
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}