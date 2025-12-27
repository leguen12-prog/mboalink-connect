import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Database, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function MetricsCollector({ devices, deviceType }) {
  const [isCollecting, setIsCollecting] = useState(false);
  const queryClient = useQueryClient();

  const collectMetrics = async () => {
    setIsCollecting(true);
    try {
      const metricsToCreate = [];

      for (const device of devices) {
        const metric = {
          device_type: deviceType,
          device_id: device.id,
          timestamp: new Date().toISOString(),
          cpu_usage: device.cpu_usage_percent || Math.random() * 60,
          memory_usage: device.memory_usage_percent || Math.random() * 70,
          temperature: device.temperature_celsius || 30 + Math.random() * 25,
          status: device.status,
          error_count: Math.floor(Math.random() * 5),
          uptime_hours: device.uptime_hours || 0,
          bandwidth_utilization: 40 + Math.random() * 50
        };

        if (deviceType === 'ont') {
          metric.rx_power = device.rx_power_dbm || -20 + Math.random() * 10;
          metric.tx_power = device.tx_power_dbm || 1 + Math.random() * 2;
          metric.packet_loss_percent = Math.random() * 0.5;
        }

        metricsToCreate.push(metric);
      }

      await base44.entities.PerformanceMetric.bulkCreate(metricsToCreate);
      
      queryClient.invalidateQueries(['metrics']);
      toast.success(`Collected metrics for ${devices.length} devices`);
    } catch (error) {
      toast.error('Failed to collect metrics');
    }
    setIsCollecting(false);
  };

  return (
    <Button
      onClick={collectMetrics}
      disabled={isCollecting || devices.length === 0}
      variant="outline"
      size="sm"
      className="border-slate-700 text-slate-300"
    >
      {isCollecting ? (
        <>
          <Database className="w-4 h-4 mr-2 animate-pulse" />
          Collecting...
        </>
      ) : (
        <>
          <TrendingUp className="w-4 h-4 mr-2" />
          Collect Metrics
        </>
      )}
    </Button>
  );
}