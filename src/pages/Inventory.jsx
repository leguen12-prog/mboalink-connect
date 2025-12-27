import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Package, MoreVertical, 
  AlertTriangle, QrCode, Warehouse, Edit, Trash2
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

const categoryIcons = {
  ont: '📡',
  olt: '🖥️',
  router: '📶',
  ups: '🔋',
  cable: '🔌',
  splitter: '🔀',
  connector: '🔗',
  sfp: '💡',
  patch_panel: '⬛',
  enclosure: '📦',
  tool: '🔧',
  other: '📋'
};

export default function Inventory() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'ont',
    sku: '',
    vendor: '',
    model: '',
    serial_number: '',
    status: 'in_stock',
    warehouse_location: '',
    bin_location: '',
    quantity_in_stock: 1,
    minimum_stock_level: 5,
    unit_cost: 0
  });

  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create({
      ...data,
      item_id: `INV-${Date.now().toString().slice(-8)}`,
      qr_code: `QR-${Date.now().toString().slice(-8)}`
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['inventory'])
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'ont',
      sku: '',
      vendor: '',
      model: '',
      serial_number: '',
      status: 'in_stock',
      warehouse_location: '',
      bin_location: '',
      quantity_in_stock: 1,
      minimum_stock_level: 5,
      unit_cost: 0
    });
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockItems = inventory.filter(item => 
    item.quantity_in_stock <= (item.minimum_stock_level || 0) && item.status === 'in_stock'
  );

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => i.status === 'in_stock').reduce((sum, i) => sum + (i.quantity_in_stock || 0), 0),
    deployed: inventory.filter(i => i.status === 'deployed').length,
    lowStock: lowStockItems.length
  };

  const columns = [
    {
      header: 'Item',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryIcons[row.category] || '📋'}</span>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-sm text-slate-500">{row.item_id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'SKU / Serial',
      render: (row) => (
        <div>
          <p className="text-white font-mono">{row.sku || '-'}</p>
          <p className="text-sm text-slate-500">{row.serial_number || '-'}</p>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="capitalize">{row.category?.replace(/_/g, ' ')}</span>
      )
    },
    {
      header: 'Vendor',
      render: (row) => <span>{row.vendor || '-'}</span>
    },
    {
      header: 'Location',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-slate-500" />
          <span className="text-sm">{row.warehouse_location || '-'}</span>
        </div>
      )
    },
    {
      header: 'Qty',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={`font-bold ${
            row.quantity_in_stock <= (row.minimum_stock_level || 0) ? 'text-red-400' : 'text-white'
          }`}>
            {row.quantity_in_stock || 0}
          </span>
          {row.quantity_in_stock <= (row.minimum_stock_level || 0) && row.status === 'in_stock' && (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </div>
      )
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
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <QrCode className="w-4 h-4 mr-2" /> Print QR
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate(row.id)}
              className="text-red-400"
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
        title="Inventory" 
        subtitle="Manage equipment and stock levels"
        action={() => setShowAddDialog(true)}
        actionLabel="Add Item"
        actionIcon={Plus}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Total Items</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">In Stock</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.inStock}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Deployed</p>
          <p className="text-2xl font-bold text-blue-400">{stats.deployed}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-amber-400">{stats.lowStock}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-amber-400">Low Stock Alert</span>
          </div>
          <p className="text-sm text-slate-300">
            {lowStockItems.length} item(s) are below minimum stock level: {' '}
            {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}
            {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search by name, SKU, or serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ont">ONT</SelectItem>
            <SelectItem value="olt">OLT</SelectItem>
            <SelectItem value="router">Router</SelectItem>
            <SelectItem value="ups">UPS</SelectItem>
            <SelectItem value="cable">Cable</SelectItem>
            <SelectItem value="splitter">Splitter</SelectItem>
            <SelectItem value="connector">Connector</SelectItem>
            <SelectItem value="sfp">SFP</SelectItem>
            <SelectItem value="tool">Tool</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="deployed">Deployed</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="defective">Defective</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredInventory} 
        isLoading={isLoading}
        emptyMessage="No inventory items found"
      />

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Inventory Item</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Item Name *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="ont">ONT</SelectItem>
                  <SelectItem value="olt">OLT</SelectItem>
                  <SelectItem value="router">Router</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="cable">Cable</SelectItem>
                  <SelectItem value="splitter">Splitter</SelectItem>
                  <SelectItem value="connector">Connector</SelectItem>
                  <SelectItem value="sfp">SFP Module</SelectItem>
                  <SelectItem value="patch_panel">Patch Panel</SelectItem>
                  <SelectItem value="enclosure">Enclosure</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">SKU</Label>
              <Input 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Vendor</Label>
              <Input 
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
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
                className="bg-slate-800/50 border-slate-700 text-white font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Warehouse Location</Label>
              <Input 
                value={formData.warehouse_location}
                onChange={(e) => setFormData({...formData, warehouse_location: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Quantity *</Label>
              <Input 
                type="number"
                min="0"
                value={formData.quantity_in_stock}
                onChange={(e) => setFormData({...formData, quantity_in_stock: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Min Stock Level</Label>
              <Input 
                type="number"
                min="0"
                value={formData.minimum_stock_level}
                onChange={(e) => setFormData({...formData, minimum_stock_level: parseInt(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Unit Cost (XAF)</Label>
              <Input 
                type="number"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData({...formData, unit_cost: parseInt(e.target.value)})}
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
              disabled={!formData.name}
            >
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}