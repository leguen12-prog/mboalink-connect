import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Wifi, Signal, Battery, 
  MoreVertical, Edit, Trash2, Eye, RefreshCw,
  Power, Settings, Zap, User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';

export default function ONTManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOnt, setSelectedOnt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    serial_number: '',
    vendor: 'VSOL',
    model: '',
    mac_address: '',
    olt_id: '',
    pon_port: 1,
    wifi_ssid: ''
  });

  const queryClient = useQueryClient();

  const { data: onts = [], isLoading } = useQuery({
    queryKey: ['onts'],
    queryFn: () => base44.entities.ONT.list('-created_date'),
  });

  const { data: olts = [] } = useQuery({
    queryKey: ['olts'],
    queryFn: () => base44.entities.OLT.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ONT.create({
      ...data,
      ont_id: `ONT-${Date.now().toString().slice(-8)}`,
      status: 'inventory'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['onts']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ONT.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['onts'])
  });

  const resetForm = () => {
    setFormData({
      serial_number: '',
      vendor: 'VSOL',
      model: '',
      mac_address: '',
      olt_id: '',
      pon_port: 1,
      wifi_ssid: ''
    });
  };

  const filteredOnts = onts.filter(ont => {
    const matchesSearch = 
      ont.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ont.ont_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ont.mac_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ont.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getOltName = (oltId) => olts.find(o => o.id === oltId)?.name || '-';
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : '-';
  };

  const getSignalQualityColor = (quality) => {
    switch(quality) {
      case 'excellent': return 'text-emerald-400';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-amber-400';
      case 'poor': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const columns = [
    {
      header: 'ONT',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${row.status === 'online' ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
            <Wifi className={`w-5 h-5 ${row.status === 'online' ? 'text-emerald-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="font-medium text-white font-mono">{row.serial_number}</p>
            <p className="text-sm text-slate-500">{row.ont_id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'OLT / Port',
      render: (row) => (
        <div>
          <p className="text-white">{getOltName(row.olt_id)}</p>
          <p className="text-sm text-slate-500">PON {row.pon_port}</p>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span>{getCustomerName(row.customer_id)}</span>
        </div>
      )
    },
    {
      header: 'Signal',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Signal className={`w-4 h-4 ${getSignalQualityColor(row.signal_quality)}`} />
          <div>
            <p className={`text-sm font-medium ${getSignalQualityColor(row.signal_quality)}`}>
              {row.rx_power_dbm ? `${row.rx_power_dbm} dBm` : '-'}
            </p>
            {row.signal_quality && (
              <p className="text-xs text-slate-500 capitalize">{row.signal_quality}</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Battery',
      render: (row) => (
        row.has_battery_backup ? (
          <div className="flex items-center gap-2">
            <Battery className={`w-4 h-4 
              ${row.battery_percent > 50 ? 'text-emerald-400' : 
                row.battery_percent > 20 ? 'text-amber-400' : 'text-red-400'}`} 
            />
            <span className="text-sm">{row.battery_percent || 0}%</span>
          </div>
        ) : (
          <span className="text-sm text-slate-500">-</span>
        )
      )
    },
    {
      header: '',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
            <DropdownMenuItem onClick={() => { setSelectedOnt(row); setShowDetailDialog(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" /> Configure
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Power className="w-4 h-4 mr-2" /> Reboot
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-400" onClick={() => deleteMutation.mutate(row.id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="ONT Management" 
        subtitle={`${onts.length} ONT devices`}
        action={() => setShowAddDialog(true)}
        actionLabel="Add ONT"
        actionIcon={Plus}
      >
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Sync All
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Online', count: onts.filter(o => o.status === 'online').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Offline', count: onts.filter(o => o.status === 'offline').length, color: 'text-slate-400', bg: 'bg-slate-500/10' },
          { label: 'LOS', count: onts.filter(o => o.status === 'los').length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Inventory', count: onts.filter(o => o.status === 'inventory').length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Wifi className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search by serial, ID, or MAC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="los">LOS</SelectItem>
            <SelectItem value="dying_gasp">Dying Gasp</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredOnts} 
        isLoading={isLoading}
        emptyMessage="No ONT devices found"
        onRowClick={(row) => { setSelectedOnt(row); setShowDetailDialog(true); }}
      />

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add New ONT</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Serial Number *</Label>
              <Input 
                value={formData.serial_number}
                onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">MAC Address</Label>
              <Input 
                value={formData.mac_address}
                onChange={(e) => setFormData({...formData, mac_address: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white font-mono"
                placeholder="AA:BB:CC:DD:EE:FF"
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
                  <SelectItem value="TP-Link">TP-Link</SelectItem>
                  <SelectItem value="Nokia">Nokia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Model *</Label>
              <Input 
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Assign to OLT</Label>
              <Select value={formData.olt_id} onValueChange={(val) => setFormData({...formData, olt_id: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select OLT" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {olts.map(olt => (
                    <SelectItem key={olt.id} value={olt.id}>{olt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">PON Port</Label>
              <Input 
                type="number"
                min="1"
                value={formData.pon_port}
                onChange={(e) => setFormData({...formData, pon_port: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">WiFi SSID</Label>
              <Input 
                value={formData.wifi_ssid}
                onChange={(e) => setFormData({...formData, wifi_ssid: e.target.value})}
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
              disabled={!formData.serial_number || !formData.model}
            >
              Add ONT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className={`p-3 rounded-xl ${selectedOnt?.status === 'online' ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                <Wifi className={`w-6 h-6 ${selectedOnt?.status === 'online' ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <div>
                <span className="font-mono">{selectedOnt?.serial_number}</span>
                <p className="text-sm text-slate-500 font-normal">{selectedOnt?.ont_id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedOnt && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="signal">Signal</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <StatusBadge status={selectedOnt.status} />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Vendor / Model</p>
                    <p className="text-white">{selectedOnt.vendor} {selectedOnt.model}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">MAC Address</p>
                    <p className="text-white font-mono">{selectedOnt.mac_address || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">IP Address</p>
                    <p className="text-white font-mono">{selectedOnt.ip_address || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">OLT / PON Port</p>
                    <p className="text-white">{getOltName(selectedOnt.olt_id)} / Port {selectedOnt.pon_port}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Customer</p>
                    <p className="text-white">{getCustomerName(selectedOnt.customer_id)}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signal" className="mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-slate-400">RX Power</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedOnt.rx_power_dbm || '-'} dBm</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-400">TX Power</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedOnt.tx_power_dbm || '-'} dBm</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Signal className={`w-4 h-4 ${getSignalQualityColor(selectedOnt.signal_quality)}`} />
                      <span className="text-sm text-slate-400">Quality</span>
                    </div>
                    <p className={`text-2xl font-bold capitalize ${getSignalQualityColor(selectedOnt.signal_quality)}`}>
                      {selectedOnt.signal_quality || '-'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">VLAN ID</p>
                    <p className="text-white">{selectedOnt.vlan_id || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Service Profile</p>
                    <p className="text-white">{selectedOnt.service_profile || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Speed Profile</p>
                    <p className="text-white">{selectedOnt.speed_profile || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Firmware</p>
                    <p className="text-white">{selectedOnt.firmware_version || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">WiFi SSID</p>
                    <p className="text-white">{selectedOnt.wifi_ssid || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">WiFi Enabled</p>
                    <p className="text-white">{selectedOnt.wifi_enabled ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}