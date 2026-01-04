import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { AlertCircle, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TaskPrioritizer({ jobs, technicianLocation }) {
  const [prioritizedJobs, setPrioritizedJobs] = useState([]);

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      prioritizeTasks();
    }
  }, [jobs, technicianLocation]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c / 1000; // Distance in km
  };

  const prioritizeTasks = async () => {
    const scored = jobs.map(job => {
      let score = 0;

      // Priority scoring
      const priorityScores = { urgent: 100, high: 70, normal: 40, low: 20 };
      score += priorityScores[job.priority] || 40;

      // Type scoring (installations are lower priority than repairs)
      const typeScores = { 
        repair: 30, 
        installation: 10, 
        maintenance: 20,
        upgrade: 15
      };
      score += typeScores[job.type] || 15;

      // Distance scoring (closer = higher priority)
      if (job.location?.gps_lat && job.location?.gps_lng && technicianLocation) {
        const distance = calculateDistance(
          technicianLocation.lat,
          technicianLocation.lng,
          job.location.gps_lat,
          job.location.gps_lng
        );
        score += Math.max(0, 50 - distance * 2); // Closer jobs get more points
      }

      // Time-based urgency (scheduled for today gets boost)
      if (job.scheduled_date === new Date().toISOString().split('T')[0]) {
        score += 30;
      }

      // Customer waiting time (older tickets get priority)
      const daysWaiting = job.created_date 
        ? Math.floor((Date.now() - new Date(job.created_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      score += Math.min(daysWaiting * 5, 25);

      return { ...job, priority_score: Math.round(score) };
    });

    // Sort by score descending
    scored.sort((a, b) => b.priority_score - a.priority_score);
    setPrioritizedJobs(scored);
  };

  const getPriorityColor = (score) => {
    if (score >= 150) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (score >= 100) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (score >= 70) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-blue-400" />
        AI Task Priority
      </h3>
      <div className="space-y-2">
        {prioritizedJobs.slice(0, 5).map((job, idx) => (
          <div key={job.id} className="bg-slate-800/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-white">{job.work_order_id}</span>
              </div>
              <Badge className={getPriorityColor(job.priority_score)}>
                Score: {job.priority_score}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {job.type}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location?.city || 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}