import React from 'react';
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  // Customer statuses
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  terminated: 'bg-red-500/10 text-red-400 border-red-500/20',
  pending_activation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  
  // Network statuses
  online: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  offline: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  maintenance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  los: 'bg-red-500/10 text-red-400 border-red-500/20',
  dying_gasp: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  unprovisioned: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  inventory: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  
  // Ticket statuses
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending_customer: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  pending_vendor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  escalated: 'bg-red-500/10 text-red-400 border-red-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  
  // Invoice statuses
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  partial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  refunded: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  
  // Work order statuses
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  assigned: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  in_transit: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  
  // Alert severities
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  major: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  minor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  
  // Signal quality
  excellent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  good: 'bg-green-500/10 text-green-400 border-green-500/20',
  fair: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  poor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  
  // Priority
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  
  // Payment
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  
  // Default
  default: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function StatusBadge({ status, className = '' }) {
  const style = statusStyles[status] || statusStyles.default;
  const displayText = status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <Badge 
      variant="outline" 
      className={`${style} border font-medium ${className}`}
    >
      {displayText}
    </Badge>
  );
}