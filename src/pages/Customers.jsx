import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Download, Upload, 
  User, Phone, Mail, MapPin, MoreVertical,
  Edit, Trash2, Eye, X, Wifi, CreditCard
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

export default function Customers() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    customer_type: 'residential',
    address: { street: '', city: '', region: '' },
    billing_type: 'prepaid'
  });

  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create({
      ...data,
      customer_id: `MBL-${Date.now().toString().slice(-6)}`,
      status: 'pending_activation'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setShowDetailDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
    }
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      customer_type: 'residential',
      address: { street: '', city: '', region: '' },
      billing_type: 'prepaid'
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Customer',
      accessor: 'customer_id',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-white">{row.first_name} {row.last_name}</p>
            <p className="text-sm text-slate-500">{row.customer_id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>{row.phone}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{row.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => (
        <span className="text-sm capitalize">{row.customer_type}</span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Balance',
      render: (row) => (
        <span className={`font-medium ${row.account_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {(row.account_balance || 0).toLocaleString()} XAF
        </span>
      )
    },
    {
      header: 'Joined',
      render: (row) => (
        <span className="text-sm text-slate-400">
          {row.activation_date ? format(new Date(row.activation_date), 'MMM d, yyyy') : '-'}
        </span>
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
            <DropdownMenuItem onClick={() => { setSelectedCustomer(row); setShowDetailDialog(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedCustomer(row); setFormData(row); setShowAddDialog(true); }}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate(row.id)}
              className="text-red-400 focus:text-red-400"
            >
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
        title="Customers" 
        subtitle={`${customers.length} total customers`}
        action={() => setShowAddDialog(true)}
        actionLabel="Add Customer"
        actionIcon={Plus}
      >
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search customers..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
            <SelectItem value="pending_activation">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredCustomers} 
        isLoading={isLoading}
        emptyMessage="No customers found"
        onRowClick={(row) => { setSelectedCustomer(row); setShowDetailDialog(true); }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-400">First Name *</Label>
              <Input 
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Last Name *</Label>
              <Input 
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Phone *</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Email</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Customer Type</Label>
              <Select 
                value={formData.customer_type}
                onValueChange={(val) => setFormData({...formData, customer_type: val})}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Billing Type</Label>
              <Select 
                value={formData.billing_type}
                onValueChange={(val) => setFormData({...formData, billing_type: val})}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="postpaid">Postpaid</SelectItem>
                  <SelectItem value="payg">Pay As You Go</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Street Address</Label>
              <Input 
                value={formData.address?.street || ''}
                onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">City</Label>
              <Input 
                value={formData.address?.city || ''}
                onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Region</Label>
              <Input 
                value={formData.address?.region || ''}
                onChange={(e) => setFormData({...formData, address: {...formData.address, region: e.target.value}})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); setSelectedCustomer(null); }} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedCustomer) {
                  updateMutation.mutate({ id: selectedCustomer.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
              disabled={!formData.first_name || !formData.last_name || !formData.phone}
            >
              {selectedCustomer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                <User className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span>{selectedCustomer?.first_name} {selectedCustomer?.last_name}</span>
                <p className="text-sm text-slate-500 font-normal">{selectedCustomer?.customer_id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <StatusBadge status={selectedCustomer.status} />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Customer Type</p>
                    <p className="text-white capitalize">{selectedCustomer.customer_type}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Phone</p>
                    <p className="text-white">{selectedCustomer.phone}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Email</p>
                    <p className="text-white">{selectedCustomer.email || '-'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30 col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Address</p>
                    <p className="text-white">
                      {selectedCustomer.address?.street}, {selectedCustomer.address?.city}, {selectedCustomer.address?.region}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  <Wifi className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No active services</p>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Account Balance</p>
                    <p className={`text-2xl font-bold ${(selectedCustomer.account_balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(selectedCustomer.account_balance || 0).toLocaleString()} XAF
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-white">
                      {(selectedCustomer.total_spent || 0).toLocaleString()} XAF
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="text-center py-8 text-slate-500">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No transaction history</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}