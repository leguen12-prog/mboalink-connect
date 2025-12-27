import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, AlertCircle, Info, CheckCircle,
  Bell, BellOff, Filter, Search, MoreVertical,
  Eye, Check, Trash2, Bot, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatDistanceToNow, format } from 'date-fns';

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  major: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  minor: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  warning: { icon: Info, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
};

export default function Alerts() {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.NetworkAlert.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NetworkAlert.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['alerts'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NetworkAlert.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['alerts'])
  });

  const handleAcknowledge = async (alertId) => {
    await updateMutation.mutateAsync({
      id: alertId,
      data: { 
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: 'Current User'
      }
    });
  };

  const handleResolve = async (alertId) => {
    await updateMutation.mutateAsync({
      id: alertId,
      data: { 
        status: 'resolved',
        resolved_at: new Date().toISOString()
      }
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    major: alerts.filter(a => a.severity === 'major' && a.status === 'active').length,
    minor: alerts.filter(a => a.severity === 'minor' && a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  };

  const AlertCard = ({ alert, index }) => {
    const config = severityConfig[alert.severity] || severityConfig.info;
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`rounded-xl ${config.bg} ${config.border} border p-4 hover:bg-opacity-20 transition-all cursor-pointer`}
        onClick={() => { setSelectedAlert(alert); setShowDetailDialog(true); }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-white">{alert.title}</h4>
                <StatusBadge status={alert.severity} className="text-xs" />
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{alert.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>{alert.source_type?.toUpperCase()}: {alert.source_id}</span>
                <span>{formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); setShowDetailDialog(true); }}>
                <Eye className="w-4 h-4 mr-2" /> View Details
              </DropdownMenuItem>
              {alert.status === 'active' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}>
                  <Check className="w-4 h-4 mr-2" /> Acknowledge
                </DropdownMenuItem>
              )}
              {alert.status !== 'resolved' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(alert.id); }}
                className="text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {alert.status !== 'active' && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <StatusBadge status={alert.status} className="text-xs" />
            {alert.acknowledged_by && (
              <span className="text-xs text-slate-500 ml-2">
                by {alert.acknowledged_by}
              </span>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Network Alerts" 
        subtitle={`${alerts.filter(a => a.status === 'active').length} active alerts`}
      >
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-slate-400">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{stats.critical}</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-slate-400">Major</span>
          </div>
          <p className="text-2xl font-bold text-orange-400 mt-2">{stats.major}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-slate-400">Minor</span>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{stats.minor}</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">Acknowledged</span>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{stats.acknowledged}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-slate-400">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="suppressed">Suppressed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800" />
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-slate-800 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No Alerts</h3>
            <p className="text-slate-400">All systems are operating normally</p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <AlertCard key={alert.id} alert={alert} index={index} />
          ))
        )}
      </div>

      {/* Alert Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              {selectedAlert && (
                <>
                  <div className={`p-2 rounded-lg ${severityConfig[selectedAlert.severity]?.bg}`}>
                    {React.createElement(severityConfig[selectedAlert.severity]?.icon || Info, {
                      className: `w-5 h-5 ${severityConfig[selectedAlert.severity]?.color}`
                    })}
                  </div>
                  <div>
                    <span>{selectedAlert.title}</span>
                    <p className="text-sm text-slate-500 font-normal">{selectedAlert.alert_id}</p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-slate-800/30">
                <p className="text-slate-300">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Severity</p>
                  <StatusBadge status={selectedAlert.severity} />
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <StatusBadge status={selectedAlert.status} />
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Source</p>
                  <p className="text-white">{selectedAlert.source_type?.toUpperCase()}: {selectedAlert.source_id}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Category</p>
                  <p className="text-white capitalize">{selectedAlert.category}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Created</p>
                  <p className="text-white">{format(new Date(selectedAlert.created_date), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Affected Customers</p>
                  <p className="text-white">{selectedAlert.affected_customers_count || 0}</p>
                </div>
              </div>

              {selectedAlert.ai_root_cause && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-purple-400">AI Analysis</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2"><strong>Root Cause:</strong> {selectedAlert.ai_root_cause}</p>
                  {selectedAlert.ai_suggested_action && (
                    <p className="text-sm text-slate-300"><strong>Suggested Action:</strong> {selectedAlert.ai_suggested_action}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                {selectedAlert.status === 'active' && (
                  <Button 
                    variant="outline" 
                    className="border-blue-500/50 text-blue-400"
                    onClick={() => { handleAcknowledge(selectedAlert.id); setShowDetailDialog(false); }}
                  >
                    <Check className="w-4 h-4 mr-2" /> Acknowledge
                  </Button>
                )}
                {selectedAlert.status !== 'resolved' && (
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => { handleResolve(selectedAlert.id); setShowDetailDialog(false); }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}