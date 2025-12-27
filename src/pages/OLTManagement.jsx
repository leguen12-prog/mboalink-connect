import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Server, Activity, Thermometer,
  Cpu, HardDrive, MapPin, MoreVertical, Edit,
  Trash2, Eye, RefreshCw, Settings, Power
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import PredictiveAnalysisRunner from '@/components/ai/PredictiveAnalysisRunner';
import MetricsCollector from '@/components/ai/MetricsCollector';
import { format } from 'date-fns';

export default function OLTManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOlt, setSelectedOlt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    vendor: 'VSOL',
    model: '',
    serial_number: '',
    ip_address: '',
    location: { site_name: '', address: '', city: '' },
    total_pon_ports: 8,
    total_ont_capacity: 128
  });

  const queryClient = useQueryClient();

  const { data: olts = [], isLoading } = useQuery({
    queryKey: ['olts'],
    queryFn: () => base44.entities.OLT.list('-created_date'),
  });

  const { data: onts = [] } = useQuery({
    queryKey: ['onts'],
    queryFn: () => base44.entities.ONT.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OLT.create({
      ...data,
      olt_id: `OLT-${Date.now().toString().slice(-6)}`,
      status: 'online',
      installation_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['olts']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OLT.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['olts'])
  });

  const resetForm = () => {
    setFormData({
      name: '',
      vendor: 'VSOL',
      model: '',
      serial_number: '',
      ip_address: '',
      location: { site_name: '', address: '', city: '' },
      total_pon_ports: 8,
      total_ont_capacity: 128
    });
  };

  const filteredOlts = olts.filter(olt =>
    olt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    olt.olt_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    olt.ip_address?.includes(searchTerm)
  );

  const getOltOnts = (oltId) => onts.filter(ont => ont.olt_id === oltId);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="OLT Management" 
        subtitle={`${olts.length} OLT devices`}
        action={() => setShowAddDialog(true)}
        actionLabel="Add OLT"
        actionIcon={Plus}
      >
        <MetricsCollector devices={olts} deviceType="olt" />
      </PageHeader>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search OLTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white"
          />
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* OLT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6 animate-pulse">
              <div className="h-6 bg-slate-800 rounded w-1/2 mb-4" />
              <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
            </div>
          ))
        ) : filteredOlts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No OLT devices found</p>
          </div>
        ) : (
          filteredOlts.map((olt, index) => {
            const oltOnts = getOltOnts(olt.id);
            const onlineOnts = oltOnts.filter(o => o.status === 'online').length;
            const utilizationPercent = olt.total_ont_capacity > 0 
              ? (oltOnts.length / olt.total_ont_capacity) * 100 
              : 0;

            return (
              <motion.div
                key={olt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6 hover:border-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${olt.status === 'online' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Server className={`w-6 h-6 ${olt.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{olt.name}</h3>
                      <p className="text-sm text-slate-500">{olt.olt_id}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                      <DropdownMenuItem onClick={() => { setSelectedOlt(olt); setShowDetailDialog(true); }}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" /> Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400" onClick={() => deleteMutation.mutate(olt.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Status</span>
                    <StatusBadge status={olt.status} />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Vendor</span>
                    <span className="text-white">{olt.vendor} {olt.model}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">IP Address</span>
                    <span className="text-white font-mono">{olt.ip_address}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">ONT Utilization</span>
                      <span className="text-white">{oltOnts.length}/{olt.total_ont_capacity}</span>
                    </div>
                    <Progress value={utilizationPercent} className="h-2 bg-slate-800" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/50">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">{onlineOnts}</p>
                      <p className="text-xs text-slate-500">Online</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-400">{oltOnts.length - onlineOnts}</p>
                      <p className="text-xs text-slate-500">Offline</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{olt.total_pon_ports}</p>
                      <p className="text-xs text-slate-500">PON Ports</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add OLT Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add New OLT</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Name *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="e.g., OLT-Douala-01"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Vendor *</Label>
              <Select value={formData.vendor} onValueChange={(val) => setFormData({...formData, vendor: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="VSOL">VSOL</SelectItem>
                  <SelectItem value="C-Data">C-Data</SelectItem>
                  <SelectItem value="Huawei">Huawei</SelectItem>
                  <SelectItem value="ZTE">ZTE</SelectItem>
                  <SelectItem value="Nokia">Nokia</SelectItem>
                  <SelectItem value="Fiberhome">Fiberhome</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Model</Label>
              <Input 
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Serial Number</Label>
              <Input 
                value={formData.serial_number}
                onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">IP Address *</Label>
              <Input 
                value={formData.ip_address}
                onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white font-mono"
                placeholder="192.168.1.1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">PON Ports</Label>
              <Input 
                type="number"
                value={formData.total_pon_ports}
                onChange={(e) => setFormData({...formData, total_pon_ports: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Site Name</Label>
              <Input 
                value={formData.location?.site_name || ''}
                onChange={(e) => setFormData({...formData, location: {...formData.location, site_name: e.target.value}})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">City</Label>
              <Input 
                value={formData.location?.city || ''}
                onChange={(e) => setFormData({...formData, location: {...formData.location, city: e.target.value}})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">ONT Capacity</Label>
              <Input 
                type="number"
                value={formData.total_ont_capacity}
                onChange={(e) => setFormData({...formData, total_ont_capacity: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
              disabled={!formData.name || !formData.ip_address}
            >
              Add OLT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className={`p-3 rounded-xl ${selectedOlt?.status === 'online' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <Server className={`w-6 h-6 ${selectedOlt?.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
              <div>
                <span>{selectedOlt?.name}</span>
                <p className="text-sm text-slate-500 font-normal">{selectedOlt?.olt_id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedOlt && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="onts">Connected ONTs</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <StatusBadge status={selectedOlt.status} />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">IP Address</p>
                    <p className="text-white font-mono">{selectedOlt.ip_address}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Vendor</p>
                    <p className="text-white">{selectedOlt.vendor}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Model</p>
                    <p className="text-white">{selectedOlt.model || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">PON Ports</p>
                    <p className="text-white">{selectedOlt.total_pon_ports}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">ONT Capacity</p>
                    <p className="text-white">{selectedOlt.total_ont_capacity}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="onts" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  {getOltOnts(selectedOlt.id).length === 0 ? (
                    <>
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No ONTs connected to this OLT</p>
                    </>
                  ) : (
                    <div className="text-left">
                      {getOltOnts(selectedOlt.id).map(ont => (
                        <div key={ont.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 mb-2">
                          <div>
                            <p className="text-white">{ont.serial_number}</p>
                            <p className="text-sm text-slate-500">PON {ont.pon_port}</p>
                          </div>
                          <StatusBadge status={ont.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-400">CPU Usage</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedOlt.cpu_usage_percent || 0}%</p>
                    <Progress value={selectedOlt.cpu_usage_percent || 0} className="h-1 mt-2 bg-slate-700" />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-slate-400">Memory</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedOlt.memory_usage_percent || 0}%</p>
                    <Progress value={selectedOlt.memory_usage_percent || 0} className="h-1 mt-2 bg-slate-700" />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-slate-400">Temperature</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedOlt.temperature_celsius || 0}°C</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <p className="text-sm text-purple-400 font-medium mb-3">AI Predictive Analysis</p>
                  <PredictiveAnalysisRunner
                    deviceType="olt"
                    deviceId={selectedOlt.id}
                    deviceName={selectedOlt.name}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}