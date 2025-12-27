import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

export default function PageHeader({ 
  title, 
  subtitle, 
  action, 
  actionLabel, 
  actionIcon: ActionIcon,
  children 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action && (
          <Button 
            onClick={action}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-medium"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}