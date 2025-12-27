import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, MessageSquare } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

export default function RecentTicketsCard({ tickets = [] }) {
  const recentTickets = tickets.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-slate-900/50 border border-slate-800/50 p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white">Recent Tickets</h3>
        <Link 
          to={createPageUrl('Tickets')}
          className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {recentTickets.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No recent tickets</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0
                ${ticket.priority === 'critical' ? 'bg-red-400' :
                  ticket.priority === 'high' ? 'bg-orange-400' :
                  ticket.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-400'}`} 
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={ticket.status} className="text-xs" />
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(ticket.created_date), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}