import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/components/i18n/LanguageContext';
import { motion } from 'framer-motion';
import { 
  Users, Wifi, CreditCard, AlertTriangle, 
  TrendingUp, Activity, Clock, ArrowUpRight
} from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import NetworkHealthCard from '@/components/dashboard/NetworkHealthCard';
import RecentTicketsCard from '@/components/dashboard/RecentTicketsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import PredictiveInsightsCard from '@/components/dashboard/PredictiveInsightsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { t } = useTranslation();
  
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date', 100),
  });

  const { data: olts = [] } = useQuery({
    queryKey: ['olts'],
    queryFn: () => base44.entities.OLT.list(),
  });

  const { data: onts = [] } = useQuery({
    queryKey: ['onts'],
    queryFn: () => base44.entities.ONT.list(),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date', 20),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.NetworkAlert.filter({ status: 'active' }),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.filter({ status: 'completed' }),
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.PredictiveMaintenance.filter({ status: 'active' }),
  });

  // Calculate stats
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const onlineOnts = onts.filter(o => o.status === 'online').length;
  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  
  const monthlyRevenue = payments
    .filter(p => {
      const paymentDate = new Date(p.created_date);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-white">{t('dashboard.title')}</h1>
        <p className="text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title={t('dashboard.active_customers')}
          value={activeCustomers.toLocaleString()}
          icon={Users}
          trendValue="+12%"
          trendLabel={t('dashboard.vs_last_month')}
          trend="up"
          iconColor="text-blue-400"
          bgColor="from-blue-500/10 to-blue-600/5"
        />
        <StatsCard
          title={t('dashboard.online_onts')}
          value={onlineOnts.toLocaleString()}
          icon={Wifi}
          trendValue={`${onts.length > 0 ? ((onlineOnts/onts.length)*100).toFixed(1) : 0}%`}
          trendLabel={t('dashboard.uptime')}
          trend="up"
          iconColor="text-emerald-400"
          bgColor="from-emerald-500/10 to-emerald-600/5"
        />
        <StatsCard
          title={t('dashboard.monthly_revenue')}
          value={`${(monthlyRevenue / 1000).toFixed(0)}K XAF`}
          icon={CreditCard}
          trendValue="+8.5%"
          trendLabel={t('dashboard.vs_last_month')}
          trend="up"
          iconColor="text-amber-400"
          bgColor="from-amber-500/10 to-amber-600/5"
        />
        <StatsCard
          title={t('dashboard.open_tickets')}
          value={openTickets.toString()}
          icon={AlertTriangle}
          trendValue={criticalAlerts > 0 ? `${criticalAlerts} ${t('dashboard.critical')}` : t('dashboard.all_normal')}
          trend={criticalAlerts > 0 ? 'down' : 'up'}
          iconColor="text-red-400"
          bgColor="from-red-500/10 to-red-600/5"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <NetworkHealthCard olts={olts} onts={onts} alerts={alerts} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTicketsCard tickets={tickets} />
        <PredictiveInsightsCard predictions={predictions} />
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Active Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.active_alerts')}</h3>
            <span className="text-sm text-slate-500">{alerts.length} {t('network.total')}</span>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t('alerts.no_alerts')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30"
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg
                    ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'major' ? 'bg-orange-500/20 text-orange-400' :
                      alert.severity === 'minor' ? 'bg-amber-500/20 text-amber-400' : 
                      'bg-blue-500/20 text-blue-400'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={alert.severity} className="text-xs" />
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">{t('dashboard.quick_actions')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { labelKey: 'dashboard.add_customer', icon: Users, color: 'text-blue-400' },
            { labelKey: 'dashboard.provision_ont', icon: Wifi, color: 'text-emerald-400' },
            { labelKey: 'dashboard.create_ticket', icon: AlertTriangle, color: 'text-amber-400' },
            { labelKey: 'dashboard.view_reports', icon: TrendingUp, color: 'text-purple-400' },
          ].map((action) => (
            <button
              key={action.labelKey}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all group"
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                {t(action.labelKey)}
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}