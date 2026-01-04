import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, CheckCircle2, Clock, WifiOff, Wifi, MessageSquare } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import JobMap from '../components/technician/JobMap';
import JobCard from '../components/technician/JobCard';
import JobDetailsDialog from '../components/technician/JobDetailsDialog';
import NOCChat from '../components/technician/NOCChat';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function TechnicianApp() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const queryClient = useQueryClient();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing data...');
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline - changes will be saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline queue from localStorage
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch technician data
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch technician profile
  const { data: technicianData } = useQuery({
    queryKey: ['technician', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const techs = await base44.entities.Technician.filter({ user_email: user.email });
      return techs[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch work orders assigned to this technician
  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['technicianWorkOrders', technicianData?.technician_id],
    queryFn: async () => {
      if (!technicianData?.technician_id) return [];
      const orders = await base44.entities.WorkOrder.filter({
        assigned_technician: technicianData.technician_id
      });
      
      // Cache for offline use
      localStorage.setItem('cachedWorkOrders', JSON.stringify(orders));
      
      return orders;
    },
    enabled: !!technicianData?.technician_id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get cached work orders when offline
  const displayOrders = !isOnline && workOrders.length === 0
    ? JSON.parse(localStorage.getItem('cachedWorkOrders') || '[]')
    : workOrders;

  // Update work order status
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, data }) => {
      if (!isOnline) {
        // Queue for later sync
        const queueItem = { type: 'update', orderId, data, timestamp: Date.now() };
        const newQueue = [...offlineQueue, queueItem];
        setOfflineQueue(newQueue);
        localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
        toast.info('Update queued for sync');
        return data;
      }
      return await base44.entities.WorkOrder.update(orderId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['technicianWorkOrders']);
      if (isOnline) {
        toast.success('Job updated successfully');
      }
    }
  });

  // Sync offline data when back online
  const syncOfflineData = async () => {
    if (offlineQueue.length === 0) return;

    try {
      for (const item of offlineQueue) {
        if (item.type === 'update') {
          await base44.entities.WorkOrder.update(item.orderId, item.data);
        }
      }
      
      setOfflineQueue([]);
      localStorage.removeItem('offlineQueue');
      queryClient.invalidateQueries(['technicianWorkOrders']);
      toast.success(`Synced ${offlineQueue.length} offline updates`);
    } catch (error) {
      toast.error('Failed to sync some updates');
    }
  };

  const handleStartJob = async (job) => {
    await updateOrderMutation.mutateAsync({
      orderId: job.id,
      data: {
        status: 'in_progress',
        actual_start_time: new Date().toISOString()
      }
    });
  };

  const handleCompleteJob = async (job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  // Filter jobs by status
  const todayJobs = displayOrders.filter(wo => {
    const scheduledDate = new Date(wo.scheduled_date);
    const today = new Date();
    return scheduledDate.toDateString() === today.toDateString();
  });

  const scheduledJobs = displayOrders.filter(wo => 
    wo.status === 'scheduled' || wo.status === 'assigned'
  );

  const inProgressJobs = displayOrders.filter(wo => 
    wo.status === 'in_progress' || wo.status === 'in_transit'
  );

  const completedJobs = displayOrders.filter(wo => wo.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <PageHeader 
        title="Field Operations"
        subtitle={`${technicianData?.first_name || 'Technician'} - ${todayJobs.length} jobs today`}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={isOnline ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {offlineQueue.length > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              {offlineQueue.length} queued
            </Badge>
          )}
          <Button
            onClick={() => setChatOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact NOC
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Today's Jobs</p>
              <p className="text-2xl font-bold text-white mt-1">{todayJobs.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-white mt-1">{inProgressJobs.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white mt-1">{completedJobs.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Scheduled</p>
              <p className="text-2xl font-bold text-white mt-1">{scheduledJobs.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 lg:px-6">
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="today">Today ({todayJobs.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledJobs.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <JobMap 
              jobs={displayOrders} 
              onJobClick={handleViewDetails}
              technicianLocation={technicianData?.current_location}
            />
          </TabsContent>

          <TabsContent value="today" className="mt-4">
            <div className="grid gap-4">
              {todayJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No jobs scheduled for today
                </div>
              ) : (
                todayJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStart={() => handleStartJob(job)}
                    onComplete={() => handleCompleteJob(job)}
                    onViewDetails={() => handleViewDetails(job)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-4">
            <div className="grid gap-4">
              {scheduledJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No scheduled jobs
                </div>
              ) : (
                scheduledJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStart={() => handleStartJob(job)}
                    onViewDetails={() => handleViewDetails(job)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <div className="grid gap-4">
              {completedJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No completed jobs yet
                </div>
              ) : (
                completedJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onViewDetails={() => handleViewDetails(job)}
                    isCompleted
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Details Dialog */}
      {selectedJob && (
        <JobDetailsDialog
          job={selectedJob}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          isOnline={isOnline}
          onUpdate={(data) => updateOrderMutation.mutate({ orderId: selectedJob.id, data })}
        />
      )}

      {/* NOC Chat */}
      <NOCChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        technicianId={technicianData?.technician_id}
        isOnline={isOnline}
      />
    </div>
  );
}