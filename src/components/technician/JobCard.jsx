import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Phone, Play, CheckCircle2, Eye, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBadge from '../ui/StatusBadge';

const priorityColors = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

export default function JobCard({ job, onStart, onComplete, onViewDetails, isCompleted }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{job.work_order_id}</h3>
              <p className="text-sm text-slate-400 capitalize mt-1">{job.type}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={job.status} />
              {job.priority && (
                <Badge variant="outline" className={priorityColors[job.priority]}>
                  {job.priority === 'urgent' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {job.priority}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Customer Info */}
          {job.customer_id && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <User className="w-4 h-4 text-slate-500" />
              <span>Customer: {job.customer_id}</span>
            </div>
          )}

          {/* Schedule */}
          {job.scheduled_date && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>
                {new Date(job.scheduled_date).toLocaleDateString()} 
                {job.scheduled_time_slot && ` - ${job.scheduled_time_slot}`}
              </span>
            </div>
          )}

          {/* Location */}
          {job.location?.address && (
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
              <span className="flex-1">{job.location.address}, {job.location.city}</span>
            </div>
          )}

          {/* Equipment Needed */}
          {job.equipment_needed && job.equipment_needed.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {job.equipment_needed.slice(0, 3).map((equipment, idx) => (
                <Badge key={idx} variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-700">
                  {equipment}
                </Badge>
              ))}
              {job.equipment_needed.length > 3 && (
                <Badge variant="outline" className="bg-slate-800/50 text-slate-400 border-slate-700">
                  +{job.equipment_needed.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Duration */}
          {job.estimated_duration_minutes && (
            <div className="text-xs text-slate-500">
              Est. Duration: {job.estimated_duration_minutes} minutes
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isCompleted && job.status === 'scheduled' && onStart && (
              <Button
                onClick={onStart}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Job
              </Button>
            )}

            {!isCompleted && job.status === 'in_progress' && onComplete && (
              <Button
                onClick={onComplete}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Job
              </Button>
            )}

            <Button
              onClick={onViewDetails}
              variant="outline"
              className={`${!isCompleted && (job.status === 'scheduled' || job.status === 'in_progress') ? '' : 'flex-1'} border-slate-700 hover:bg-slate-800`}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}