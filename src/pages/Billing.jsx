import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Search, CreditCard, Receipt, TrendingUp,
  Download, Filter, MoreVertical, Eye, Send,
  DollarSign, Clock, CheckCircle, AlertCircle
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
import { format, formatDistanceToNow } from 'date-fns';

export default function Billing() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'mtn_momo',
    payer_phone: ''
  });

  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create({
      ...data,
      payment_id: `PAY-${Date.now().toString().slice(-8)}`,
      status: 'completed',
      processed_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['invoices']);
      setShowPaymentDialog(false);
    }
  });

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(inv.customer_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter(pay => 
    pay.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pay.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const invoiceColumns = [
    {
      header: 'Invoice',
      render: (row) => (
        <div>
          <p className="font-medium text-white font-mono">{row.invoice_number}</p>
          <p className="text-sm text-slate-500">{row.invoice_type?.replace(/_/g, ' ')}</p>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => <span>{getCustomerName(row.customer_id)}</span>
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="font-semibold text-white">
          {(row.total_amount || 0).toLocaleString()} {row.currency || 'XAF'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Due Date',
      render: (row) => (
        <span className="text-sm text-slate-400">
          {row.due_date ? format(new Date(row.due_date), 'MMM d, yyyy') : '-'}
        </span>
      )
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
            <DropdownMenuItem onClick={() => { setSelectedItem(row); setShowDetailDialog(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { 
              setSelectedItem(row); 
              setPaymentData({ ...paymentData, amount: row.total_amount - (row.amount_paid || 0), customer_id: row.customer_id, invoice_id: row.id });
              setShowPaymentDialog(true); 
            }}>
              <CreditCard className="w-4 h-4 mr-2" /> Record Payment
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="w-4 h-4 mr-2" /> Send Reminder
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const paymentColumns = [
    {
      header: 'Payment ID',
      render: (row) => (
        <span className="font-mono text-white">{row.payment_id}</span>
      )
    },
    {
      header: 'Customer',
      render: (row) => <span>{getCustomerName(row.customer_id)}</span>
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="font-semibold text-emerald-400">
          +{(row.amount || 0).toLocaleString()} {row.currency || 'XAF'}
        </span>
      )
    },
    {
      header: 'Method',
      render: (row) => (
        <span className="capitalize">{row.payment_method?.replace(/_/g, ' ')}</span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Date',
      render: (row) => (
        <span className="text-sm text-slate-400">
          {row.processed_date ? format(new Date(row.processed_date), 'MMM d, yyyy h:mm a') : '-'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Billing & Payments" 
        subtitle="Manage invoices, payments, and revenue"
      >
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900">
          <Plus className="w-4 h-4 mr-2" /> Create Invoice
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {totalRevenue.toLocaleString()} XAF
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {pendingAmount.toLocaleString()} XAF
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Overdue</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {overdueAmount.toLocaleString()} XAF
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{invoices.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Receipt className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search invoices..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable 
            columns={invoiceColumns} 
            data={filteredInvoices} 
            isLoading={invoicesLoading}
            emptyMessage="No invoices found"
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800 text-white"
            />
          </div>
          <DataTable 
            columns={paymentColumns} 
            data={filteredPayments} 
            isLoading={paymentsLoading}
            emptyMessage="No payments found"
          />
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <Receipt className="w-5 h-5 text-amber-400" />
              Invoice {selectedItem?.invoice_number}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
                <div>
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-3xl font-bold text-white">
                    {(selectedItem.total_amount || 0).toLocaleString()} {selectedItem.currency || 'XAF'}
                  </p>
                </div>
                <StatusBadge status={selectedItem.status} className="text-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Customer</p>
                  <p className="text-white">{getCustomerName(selectedItem.customer_id)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Invoice Type</p>
                  <p className="text-white capitalize">{selectedItem.invoice_type?.replace(/_/g, ' ')}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Due Date</p>
                  <p className="text-white">
                    {selectedItem.due_date ? format(new Date(selectedItem.due_date), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Amount Paid</p>
                  <p className="text-emerald-400">{(selectedItem.amount_paid || 0).toLocaleString()} XAF</p>
                </div>
              </div>

              {selectedItem.line_items && selectedItem.line_items.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-3">Line Items</p>
                  <div className="space-y-2">
                    {selectedItem.line_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                        <span className="text-white">{item.description}</span>
                        <span className="text-slate-400">
                          {item.quantity} × {item.unit_price?.toLocaleString()} = {item.total?.toLocaleString()} XAF
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Amount *</Label>
              <Input 
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Payment Method *</Label>
              <Select value={paymentData.payment_method} onValueChange={(val) => setPaymentData({...paymentData, payment_method: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Payer Phone</Label>
              <Input 
                value={paymentData.payer_phone}
                onChange={(e) => setPaymentData({...paymentData, payer_phone: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="+237 6XX XXX XXX"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={() => createPaymentMutation.mutate(paymentData)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}