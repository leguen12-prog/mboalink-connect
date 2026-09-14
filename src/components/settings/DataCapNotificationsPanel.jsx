import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DataCapNotificationService } from '@/components/notifications/DataCapNotificationService';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, CheckCircle2, Bell, RefreshCw, Mail, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function DataCapNotificationsPanel() {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [autoRun, setAutoRun] = useState(true);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['data-cap-summary'],
    queryFn: () => DataCapNotificationService.getUsageSummary(),
  });

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['data-cap-history'],
    queryFn: () => DataCapNotificationService.getNotificationHistory(20),
  });

  // Auto-run check on mount if enabled
  useEffect(() => {
    if (autoRun) {
      handleRunCheck(true);
    }
  }, []);

  const handleRunCheck = async (silent = false) => {
    setRunning(true);
    try {
      const result = await DataCapNotificationService.runDataCapCheck();
      setLastResult(result);
      refetchSummary();
      refetchHistory();
      if (!silent) {
        if (result.notificationsSent80 + result.notificationsSent95 > 0) {
          toast.success(`Sent ${result.notificationsSent80 + result.notificationsSent95} data cap notifications`);
        } else {
          toast.info('Check complete — no new notifications needed');
        }
      }
    } catch (error) {
      if (!silent) toast.error('Data cap check failed');
    }
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Data Cap Notifications
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Automatically alert customers at 80% and 95% of their monthly data cap
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Auto-run</span>
              <Switch checked={autoRun} onCheckedChange={setAutoRun} />
            </div>
            <Button
              onClick={() => handleRunCheck(false)}
              disabled={running}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Checking...' : 'Run Check Now'}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/30">
            <p className="text-sm text-slate-400">Tracked Customers</p>
            <p className="text-2xl font-bold text-white mt-1">{summary?.totalTracked || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-400">At 80% Threshold</p>
            <p className="text-2xl font-bold text-white mt-1">{summary?.at80 || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">At 95% Threshold</p>
            <p className="text-2xl font-bold text-white mt-1">{summary?.at95 || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-400">80% Sent</p>
            <p className="text-2xl font-bold text-white mt-1">{summary?.notificationsSent80 || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-400">95% Sent</p>
            <p className="text-2xl font-bold text-white mt-1">{summary?.notificationsSent95 || 0}</p>
          </div>
        </div>

        {summary?.billingPeriod && (
          <p className="text-xs text-slate-500 mt-3">
            Billing period: {summary.billingPeriod} · Unlimited plans excluded
          </p>
        )}
      </Card>

      {/* Last Run Result */}
      {lastResult && (
        <Card className="bg-slate-900/50 border-slate-800 p-6">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Last Check Result
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Customers Checked</p>
              <p className="text-white font-medium">{lastResult.activeCustomersChecked}</p>
            </div>
            <div>
              <p className="text-slate-400">80% Notifications Sent</p>
              <p className="text-amber-400 font-medium">{lastResult.notificationsSent80}</p>
            </div>
            <div>
              <p className="text-slate-400">95% Notifications Sent</p>
              <p className="text-red-400 font-medium">{lastResult.notificationsSent95}</p>
            </div>
            <div>
              <p className="text-slate-400">No Usage Data</p>
              <p className="text-slate-300 font-medium">{lastResult.skippedNoUsage}</p>
            </div>
          </div>

          {lastResult.details.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-400">Notifications sent this run:</p>
              {lastResult.details.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-white">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">{d.pct}% used</span>
                    <Badge variant={d.threshold === 95 ? 'destructive' : 'secondary'}>
                      {d.threshold}% threshold
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Recent Notification History */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-400" />
          Recent Data Cap Notifications
        </h4>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-slate-400 text-sm">No data cap notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((log) => {
              const meta = log.metadata || {};
              return (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.template_key === 'data_cap_95' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm text-white">
                        {log.template_key === 'data_cap_95' ? '95% Critical Alert' : '80% Warning'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {meta.percentage ? `${meta.percentage}% used · ` : ''}
                        {meta.data_used_gb ? `${meta.data_used_gb}/${meta.data_cap_gb} GB` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{log.recipient}</p>
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}