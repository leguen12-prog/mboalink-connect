import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DataTable from '../ui/DataTable';

export default function GeofenceManagement() {
  const queryClient = useQueryClient();

  const { data: geofences = [], isLoading } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => base44.entities.Geofence.list('-created_date')
  });

  const updateGeofenceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Geofence.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      toast.success('Geofence updated');
    }
  });

  const deleteGeofenceMutation = useMutation({
    mutationFn: (id) => base44.entities.Geofence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      toast.success('Geofence deleted');
    }
  });

  const handleToggleActive = async (geofence) => {
    await updateGeofenceMutation.mutateAsync({
      id: geofence.id,
      data: { is_active: !geofence.is_active }
    });
  };

  const handleDelete = async (geofence) => {
    if (confirm(`Delete geofence "${geofence.name}"?`)) {
      await deleteGeofenceMutation.mutateAsync(geofence.id);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (fence) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-white font-medium">{fence.name}</span>
        </div>
      )
    },
    {
      header: 'Type',
      render: (fence) => (
        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
          {fence.fence_type}
        </Badge>
      )
    },
    {
      header: 'Trigger',
      render: (fence) => (
        <Badge variant="outline" className="capitalize">
          {fence.trigger_on}
        </Badge>
      )
    },
    {
      header: 'Geometry',
      render: (fence) => (
        <span className="text-sm text-slate-400 capitalize">{fence.geometry.type}</span>
      )
    },
    {
      header: 'Status',
      render: (fence) => (
        <div className="flex items-center gap-2">
          {fence.is_active ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-slate-500" />
          )}
          <span className={fence.is_active ? 'text-green-400' : 'text-slate-500'}>
            {fence.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      render: (fence) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(fence);
            }}
            className="border-slate-700"
          >
            {fence.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(fence);
            }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Geofence Management
          </h3>
          <p className="text-sm text-slate-400">Monitor and control asset movement in defined areas</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-500/20 text-green-400">
            {geofences.filter(f => f.is_active).length} Active
          </Badge>
          <Badge className="bg-slate-500/20 text-slate-400">
            {geofences.filter(f => !f.is_active).length} Inactive
          </Badge>
        </div>
      </div>

      <Card className="bg-amber-500/10 border-amber-500/20 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-400 font-semibold">Drawing Mode Required</p>
            <p className="text-sm text-slate-300 mt-1">
              Use the drawing tools on the map to create new geofences. Draw polygons, circles, or rectangles to define monitored areas.
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <DataTable
          columns={columns}
          data={geofences}
          isLoading={isLoading}
          emptyMessage="No geofences created. Use the map drawing tools to create one."
        />
      </Card>
    </div>
  );
}