import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Calendar, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AIScheduler({ technicianId, jobs, onScheduleUpdate }) {
  const [scheduling, setScheduling] = useState(false);
  const [schedule, setSchedule] = useState(null);

  const optimizeSchedule = async () => {
    if (!jobs || jobs.length === 0) {
      toast.error('No jobs to schedule');
      return;
    }

    setScheduling(true);

    try {
      const technician = await base44.entities.Technician.filter({ technician_id: technicianId });
      const techData = technician[0];

      const jobsData = jobs.map(job => ({
        id: job.work_order_id,
        type: job.type,
        priority: job.priority,
        location: job.location,
        estimated_duration: job.estimated_duration_minutes || 120,
        customer_id: job.customer_id,
        skills_required: job.equipment_needed || [],
        scheduled_time_slot: job.scheduled_time_slot
      }));

      const aiPrompt = `You are an AI scheduling assistant for field technicians.

Technician Profile:
- ID: ${technicianId}
- Skills: ${techData?.skills?.join(', ') || 'general'}
- Current Location: ${techData?.current_location?.lat || 'N/A'}, ${techData?.current_location?.lng || 'N/A'}
- Shift: 8:00 AM - 5:00 PM

Jobs to Schedule (${jobsData.length}):
${jobsData.map((j, idx) => `
${idx + 1}. ${j.id} - ${j.type} (${j.priority})
   Location: ${j.location?.address || 'N/A'}
   Duration: ${j.estimated_duration} min
   Preferred: ${j.scheduled_time_slot || 'flexible'}
`).join('\n')}

Create an optimal daily schedule that:
1. Prioritizes urgent/high-priority jobs
2. Minimizes travel time between locations
3. Respects time windows and customer preferences
4. Fits within technician's shift
5. Allows buffer time for delays
6. Balances workload throughout the day

Provide a sequenced schedule with time slots and reasoning.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            scheduled_jobs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  job_id: { type: "string" },
                  sequence: { type: "number" },
                  start_time: { type: "string" },
                  end_time: { type: "string" },
                  travel_time_minutes: { type: "number" },
                  buffer_time_minutes: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            },
            schedule_efficiency: { type: "number" },
            total_travel_time: { type: "number" },
            total_work_time: { type: "number" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSchedule(aiResponse);
      onScheduleUpdate && onScheduleUpdate(aiResponse);
      toast.success(`Optimized schedule for ${aiResponse.scheduled_jobs.length} jobs`);

    } catch (error) {
      console.error('Scheduling failed:', error);
      toast.error('Failed to optimize schedule');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={optimizeSchedule}
        disabled={scheduling}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
      >
        {scheduling ? (
          <>
            <Brain className="w-4 h-4 mr-2 animate-pulse" />
            Optimizing Schedule...
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4 mr-2" />
            AI Optimize Schedule
          </>
        )}
      </Button>

      {schedule && (
        <Card className="bg-slate-900/50 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Optimized Schedule</h3>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
              {schedule.schedule_efficiency}% Efficient
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-800/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Travel Time</p>
              <p className="text-lg font-bold text-white">{schedule.total_travel_time} min</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Work Time</p>
              <p className="text-lg font-bold text-white">{schedule.total_work_time} min</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {schedule.scheduled_jobs.map((job, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                      {job.sequence}
                    </span>
                    <span className="text-sm font-medium text-white">{job.job_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{job.start_time} - {job.end_time}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-1">{job.reasoning}</p>
                {job.travel_time_minutes > 0 && (
                  <p className="text-xs text-slate-500">Travel: {job.travel_time_minutes} min</p>
                )}
              </div>
            ))}
          </div>

          {schedule.recommendations && schedule.recommendations.length > 0 && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400 font-medium mb-2">Recommendations</p>
              <ul className="space-y-1">
                {schedule.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}