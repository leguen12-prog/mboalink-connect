import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, MessageSquare, Clock,
  User, MoreVertical, Send, Paperclip, X, Bot
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';

export default function Tickets() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    category: 'technical',
    priority: 'medium',
    subject: '',
    description: '',
    source: 'phone'
  });

  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Ticket.create({
      ...data,
      ticket_id: `TKT-${Date.now().toString().slice(-6)}`,
      status: 'open',
      comments: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets']);
      setShowAddDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ticket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets']);
    }
  });

  const resetForm = () => {
    setFormData({
      customer_id: '',
      category: 'technical',
      priority: 'medium',
      subject: '',
      description: '',
      source: 'phone'
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    
    const updatedComments = [
      ...(selectedTicket.comments || []),
      {
        author: 'Current User',
        content: newComment,
        timestamp: new Date().toISOString(),
        is_internal: false
      }
    ];
    
    await updateMutation.mutateAsync({ 
      id: selectedTicket.id, 
      data: { comments: updatedComments }
    });
    
    setSelectedTicket({ ...selectedTicket, comments: updatedComments });
    setNewComment('');
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    await updateMutation.mutateAsync({
      id: ticketId,
      data: { 
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolved_date: new Date().toISOString() } : {})
      }
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const columns = [
    {
      header: 'Ticket',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-1 h-12 rounded-full ${getPriorityColor(row.priority)}`} />
          <div>
            <p className="font-medium text-white">{row.subject}</p>
            <p className="text-sm text-slate-500">{row.ticket_id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-slate-700 text-xs">
              {getCustomerName(row.customer_id).split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{getCustomerName(row.customer_id)}</span>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="text-sm capitalize">{row.category?.replace(/_/g, ' ')}</span>
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
      header: 'Created',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {formatDistanceToNow(new Date(row.created_date), { addSuffix: true })}
        </div>
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
            <DropdownMenuItem onClick={() => { setSelectedTicket(row); setShowDetailDialog(true); }}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'in_progress')}>
              Mark In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'resolved')}>
              Mark Resolved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const ticketStats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    critical: tickets.filter(t => t.priority === 'critical' && !['resolved', 'closed'].includes(t.status)).length
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Support Tickets" 
        subtitle={`${tickets.length} total tickets`}
        action={() => setShowAddDialog(true)}
        actionLabel="Create Ticket"
        actionIcon={Plus}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Open</p>
          <p className="text-2xl font-bold text-blue-400">{ticketStats.open}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">In Progress</p>
          <p className="text-2xl font-bold text-amber-400">{ticketStats.inProgress}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400">{ticketStats.resolved}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <p className="text-sm text-slate-400">Critical</p>
          <p className="text-2xl font-bold text-red-400">{ticketStats.critical}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search tickets..."
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_customer">Pending Customer</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={filteredTickets} 
        isLoading={isLoading}
        emptyMessage="No tickets found"
        onRowClick={(row) => { setSelectedTicket(row); setShowDetailDialog(true); }}
      />

      {/* Create Ticket Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
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
              <Label className="text-slate-400">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="service_change">Service Change</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                  <SelectItem value="outage">Outage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Priority *</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Subject *</Label>
              <Input 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white"
                placeholder="Brief description of the issue"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-slate-400">Description *</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white min-h-[120px]"
                placeholder="Detailed description of the issue..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Source</Label>
              <Select value={formData.source} onValueChange={(val) => setFormData({...formData, source: val})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="app">Mobile App</SelectItem>
                  <SelectItem value="web">Web Portal</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
              disabled={!formData.customer_id || !formData.subject || !formData.description}
            >
              Create Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>{selectedTicket?.ticket_id}</span>
                <StatusBadge status={selectedTicket?.status} />
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue="details" className="flex-1 flex flex-col">
                <TabsList className="bg-slate-800/50">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="conversation">Conversation</TabsTrigger>
                  <TabsTrigger value="ai">AI Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 flex-1 overflow-auto">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-800/30">
                      <h4 className="font-medium text-white mb-2">{selectedTicket.subject}</h4>
                      <p className="text-slate-400">{selectedTicket.description}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/30">
                        <p className="text-sm text-slate-500 mb-1">Customer</p>
                        <p className="text-white">{getCustomerName(selectedTicket.customer_id)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/30">
                        <p className="text-sm text-slate-500 mb-1">Category</p>
                        <p className="text-white capitalize">{selectedTicket.category?.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/30">
                        <p className="text-sm text-slate-500 mb-1">Priority</p>
                        <StatusBadge status={selectedTicket.priority} />
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/30">
                        <p className="text-sm text-slate-500 mb-1">Source</p>
                        <p className="text-white capitalize">{selectedTicket.source}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/30">
                        <p className="text-sm text-slate-500 mb-1">Created</p>
                        <p className="text-white">{format(new Date(selectedTicket.created_date), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/30">
                        <p className="text-sm text-slate-500 mb-1">Assigned To</p>
                        <p className="text-white">{selectedTicket.assigned_to || 'Unassigned'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="conversation" className="mt-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto space-y-4 mb-4">
                    {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                      <div className="text-center py-8 text-slate-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No comments yet</p>
                      </div>
                    ) : (
                      selectedTicket.comments.map((comment, index) => (
                        <div key={index} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-slate-700 text-xs">
                              {comment.author?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">{comment.author}</span>
                              <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-800">
                    <Input 
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                    <Button onClick={handleAddComment} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="mt-4">
                  <div className="space-y-4">
                    {selectedTicket.ai_suggested_resolution ? (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="w-5 h-5 text-purple-400" />
                          <span className="text-sm font-medium text-purple-400">AI Suggested Resolution</span>
                        </div>
                        <p className="text-slate-300">{selectedTicket.ai_suggested_resolution}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No AI insights available</p>
                        <Button variant="outline" className="mt-4 border-slate-700">
                          Generate AI Analysis
                        </Button>
                      </div>
                    )}
                    {selectedTicket.sentiment_score !== undefined && (
                      <div className="p-4 rounded-xl bg-slate-800/30">
                        <p className="text-sm text-slate-500 mb-2">Customer Sentiment</p>
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl font-bold 
                            ${selectedTicket.sentiment_score > 0 ? 'text-emerald-400' : 
                              selectedTicket.sentiment_score < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                            {selectedTicket.sentiment_score > 0 ? 'Positive' : 
                             selectedTicket.sentiment_score < 0 ? 'Negative' : 'Neutral'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}