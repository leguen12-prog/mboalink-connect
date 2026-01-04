import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Sparkles, Navigation, Clock, MapPin, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function RouteOptimizer({ jobs, technicianLocation, onRouteOptimized }) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  const calculateOptimalRoute = async () => {
    if (!jobs || jobs.length === 0) {
      toast.error('No jobs available to optimize');
      return;
    }

    setOptimizing(true);

    try {
      // Prepare job data for AI
      const jobsWithLocations = jobs.filter(j => j.location?.gps_lat && j.location?.gps_lng);
      
      if (jobsWithLocations.length === 0) {
        toast.error('No jobs have valid locations');
        setOptimizing(false);
        return;
      }

      const jobsData = jobsWithLocations.map(job => ({
        id: job.work_order_id,
        location: {
          lat: job.location.gps_lat,
          lng: job.location.gps_lng,
          address: job.location.address
        },
        priority: job.priority,
        type: job.type,
        status: job.status,
        estimated_duration: job.estimated_duration_minutes || 120,
        scheduled_time_slot: job.scheduled_time_slot,
        scheduled_date: job.scheduled_date
      }));

      const startLocation = technicianLocation || { lat: 4.0511, lng: 9.7679 };

      // Call AI for route optimization
      const aiPrompt = `You are an expert route optimization AI for field service technicians.

Technician Starting Location: ${startLocation.lat}, ${startLocation.lng}

Jobs to Optimize (${jobsData.length} total):
${jobsData.map((job, idx) => `
${idx + 1}. ${job.id} - ${job.type}
   Location: ${job.location.address} (${job.location.lat}, ${job.location.lng})
   Priority: ${job.priority}
   Status: ${job.status}
   Duration: ${job.estimated_duration} minutes
   Scheduled: ${job.scheduled_date} ${job.scheduled_time_slot || ''}
`).join('\n')}

Calculate the MOST EFFICIENT route considering:
1. PRIORITY (urgent/high jobs should come earlier)
2. GEOGRAPHIC PROXIMITY (minimize travel distance)
3. TIME WINDOWS (respect scheduled time slots)
4. ESTIMATED DURATIONS (fit more jobs in the day)

Provide:
- Optimal job sequence
- Estimated travel time between each job
- Total estimated route duration
- Efficiency score (0-100)
- Route optimization reasoning`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            optimized_sequence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  job_id: { type: "string" },
                  order: { type: "number" },
                  estimated_travel_time_minutes: { type: "number" },
                  estimated_arrival_time: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            total_distance_km: { type: "number" },
            total_travel_time_minutes: { type: "number" },
            total_work_time_minutes: { type: "number" },
            total_duration_hours: { type: "number" },
            efficiency_score: { type: "number" },
            optimization_reasoning: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      // Match optimized sequence with actual jobs
      const orderedJobs = aiResponse.optimized_sequence.map(seq => {
        const job = jobs.find(j => j.work_order_id === seq.job_id);
        return {
          ...job,
          optimized_order: seq.order,
          estimated_travel_time: seq.estimated_travel_time_minutes,
          estimated_arrival: seq.estimated_arrival_time,
          route_notes: seq.notes
        };
      }).filter(Boolean);

      const routeData = {
        jobs: orderedJobs,
        metrics: {
          totalDistance: aiResponse.total_distance_km,
          totalTravelTime: aiResponse.total_travel_time_minutes,
          totalWorkTime: aiResponse.total_work_time_minutes,
          totalDuration: aiResponse.total_duration_hours,
          efficiencyScore: aiResponse.efficiency_score
        },
        reasoning: aiResponse.optimization_reasoning,
        recommendations: aiResponse.recommendations
      };

      setOptimizedRoute(routeData);
      onRouteOptimized(routeData);
      
      toast.success(`Route optimized! Efficiency: ${aiResponse.efficiency_score}%`);
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast.error('Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={calculateOptimalRoute}
        disabled={optimizing || !jobs || jobs.length === 0}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
      >
        {optimizing ? (
          <>
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Optimizing Route...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4 mr-2" />
            AI Optimize Route
          </>
        )}
      </Button>

      {optimizedRoute && (
        <Card className="bg-slate-900/50 border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-400" />
              Optimized Route
            </h3>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
              {optimizedRoute.metrics.efficiencyScore}% Efficient
            </Badge>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Total Distance</p>
              <p className="text-lg font-bold text-white">{optimizedRoute.metrics.totalDistance} km</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Travel Time</p>
              <p className="text-lg font-bold text-white">{optimizedRoute.metrics.totalTravelTime} min</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Work Time</p>
              <p className="text-lg font-bold text-white">{optimizedRoute.metrics.totalWorkTime} min</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Total Duration</p>
              <p className="text-lg font-bold text-white">{optimizedRoute.metrics.totalDuration.toFixed(1)} hrs</p>
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-slate-800/20 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              AI Optimization Strategy
            </p>
            <p className="text-sm text-slate-300">{optimizedRoute.reasoning}</p>
          </div>

          {/* Recommendations */}
          {optimizedRoute.recommendations && optimizedRoute.recommendations.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400 mb-2 font-medium">Recommendations</p>
              <ul className="space-y-1">
                {optimizedRoute.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Job Sequence */}
          <div>
            <p className="text-sm text-slate-400 mb-3 font-medium">Optimized Sequence ({optimizedRoute.jobs.length} jobs)</p>
            <div className="space-y-2">
              {optimizedRoute.jobs.map((job, idx) => (
                <div key={job.id} className="flex items-center gap-3 bg-slate-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{job.work_order_id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {job.priority}
                      </Badge>
                      {job.estimated_travel_time > 0 && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {job.estimated_travel_time} min travel
                        </span>
                      )}
                    </div>
                  </div>
                  {job.estimated_arrival && (
                    <div className="text-xs text-slate-400">
                      ETA: {job.estimated_arrival}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}