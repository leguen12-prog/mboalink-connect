import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Wrench, MapPin, Clock, User,
  MoreVertical, Calendar, Navigation, Camera,
  CheckCircle, XCircle, Play
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';

export default function WorkOrders() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    customer_id: '',
    type: 'installation',
    priority: 'normal',
    scheduled_date: '',
    scheduled_time_slot: 'morning',
    assigned_technician: '',
    location: { address: '', city: '' },
    equipment_needed: []
  });

  const queryClient = useQueryClient();

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.create({
      ...data,
      work_order_id: `WO-${Date.now().toString().slice(-8)}`,
      status: 'scheduled'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workOrders']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkOrder.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['workOrders'])
  });

  const resetForm = () => {
    setFormData({
      customer_id: '',
      type: 'installation',
      priority: 'normal',
      scheduled_date: '',
      scheduled_time_slot: 'morning',
      assigned_technician: '',
      location: { address: '', city: '' },
      equipment_needed: []
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
  };

  const getTechnicianName = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    return tech ? `${tech.first_name} ${tech.last_name}` : 'Unassigned';
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = 
      wo.work_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(wo.customer_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case 'installation': return '🔧';
      case 'repair': return '🛠️';
      case 'upgrade': return '⬆️';
      case 'relocation': return '📦';
      case 'disconnect': return '🔌';
      case 'maintenance': return '🔩';
      case 'survey': return '📋';
      default: return '📝';
    }
  };

  const stats = {
    scheduled: workOrders.filter(w => w.status === 'scheduled').length,
    inProgress: workOrders.filter(w => w.status === 'in_progress').length,
    completed: workOrders.filter(w => w.status === 'completed').length,
    today: workOrders.filter(w => {
      if (!w.scheduled_date) return false;
      const today = new Date().toISOString().split('T')[0];
      return w.scheduled_date === today;
    }).length
  };

  const columns = [
    {
      header: 'Work Order',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getTypeIcon(row.type)}</span>
          <div>
            <p className="font-medium text-white">{row.work_order_id}</p>
            <p className="text-sm text-slate-500 capitalize">{row.type}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => <span>{getCustomerName(row.customer_id)}</span>
    },
    {
      header: 'Scheduled',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <div>
            <p className="text-white">{row.scheduled_date ? format(new Date(row.scheduled_date), 'MMM d, yyyy') : '-'}</p>
            <p className="text-sm text-slate-500 capitalize">{row.scheduled_time_slot}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Technician',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-slate-700 text-xs">
              {getTechnicianName(row.assigned_technician).split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{getTechnicianName(row.assigned_technician)}</span>
        </div>
      )
    },
    {
      header: 'Priority',
      render: (row) => <StatusBadge status={row.priority} />
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: '',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
            <DropdownMenuItem onClick={() => { setSelectedWorkOrder(row); setShowDetailDialog(true); }}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: row.id, data: { status: 'in_progress', actual_start_time: new Date().toISOString() }})}>
              <Play className="w-4 h-4 mr-2" /> Start Job
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: row.id, data: { status: 'completed', actual_end_time: new Date().toISOString() }})}>
              <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Work Orders" 
        subtitle="Manage field operations and technician assignments"
        action={() => setShowAddDialog(true)}
        actionLabel="Create Work Order"
        actionIcon={Plus}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Today's Jobs</p>
          <p className="text-2xl font-bold text-amber-400">{stats.today}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Scheduled</p>
          <p className="text-2xl font-bold text-blue-400">{stats.scheduled}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">In Progress</p>
          <p className="text-2xl font-bold text-purple-400">{stats.inProgress}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search work orders..."
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredWorkOrders} 
        isLoading={isLoading}
        emptyMessage="No work orders found"
        onRowClick={(row) => { setSelectedWorkOrder(row); setShowDetailDialog(true); }}
      />

      {/* Create Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create Work Order</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Customer *</Label>
              <Select value={formData.customer_id} onValueChange={(val) => setFormData({...formData, customer_id: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Type *</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="disconnect">Disconnect</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Scheduled Date</Label>
              <Input 
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Time Slot</Label>
              <Select value={formData.scheduled_time_slot} onValueChange={(val) => setFormData({...formData, scheduled_time_slot: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                  <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Assign Technician</Label>
              <Select value={formData.assigned_technician} onValueChange={(val) => setFormData({...formData, assigned_technician: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {technicians.filter(t => t.status === 'available').map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Location Address</Label>
              <Input 
                value={formData.location?.address || ''}
                onChange={(e) => setFormData({...formData, location: {...formData.location, address: e.target.value}})}
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
              disabled={!formData.customer_id}
            >
              Create Work Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <span className="text-2xl">{selectedWorkOrder && getTypeIcon(selectedWorkOrder.type)}</span>
              <div>
                <span>{selectedWorkOrder?.work_order_id}</span>
                <p className="text-sm text-slate-500 font-normal capitalize">{selectedWorkOrder?.type}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedWorkOrder && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                <StatusBadge status={selectedWorkOrder.status} />
                <StatusBadge status={selectedWorkOrder.priority} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Customer</p>
                  <p className="text-white">{getCustomerName(selectedWorkOrder.customer_id)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Technician</p>
                  <p className="text-white">{getTechnicianName(selectedWorkOrder.assigned_technician)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Scheduled</p>
                  <p className="text-white">
                    {selectedWorkOrder.scheduled_date ? format(new Date(selectedWorkOrder.scheduled_date), 'MMM d, yyyy') : '-'}
                  </p>
                  <p className="text-sm text-slate-400 capitalize">{selectedWorkOrder.scheduled_time_slot}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Location</p>
                  <p className="text-white">{selectedWorkOrder.location?.address || '-'}</p>
                </div>
              </div>

              {selectedWorkOrder.technician_notes && (
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-2">Technician Notes</p>
                  <p className="text-slate-300">{selectedWorkOrder.technician_notes}</p>
                </div>
              )}

              {selectedWorkOrder.photos && selectedWorkOrder.photos.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-3">Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedWorkOrder.photos.map((photo, i) => (
                      <div key={i} className="w-20 h-20 rounded-lg bg-slate-700 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedWorkOrder.customer_rating && (
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-2">Customer Rating</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < selectedWorkOrder.customer_rating ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
                    ))}
                  </div>
                  {selectedWorkOrder.customer_feedback && (
                    <p className="text-slate-400 mt-2">{selectedWorkOrder.customer_feedback}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}