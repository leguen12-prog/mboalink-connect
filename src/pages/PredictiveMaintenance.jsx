import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Brain, Sparkles, Filter, Search, TrendingUp,
  AlertTriangle, Clock, Activity, CheckCircle,
  Settings, MoreVertical, Eye, Trash2, FileText,
  Zap, ThermometerSun, Server, Wifi
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import PredictionCard from '@/components/ai/PredictionCard';
import PredictiveAnalysisRunner from '@/components/ai/PredictiveAnalysisRunner';
import StatusBadge from '@/components/ui/StatusBadge';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

export default function PredictiveMaintenance() {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all');
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.PredictiveMaintenance.list('-created_date'),
  });

  const { data: olts = [] } = useQuery({
    queryKey: ['olts'],
    queryFn: () => base44.entities.OLT.list(),
  });

  const { data: onts = [] } = useQuery({
    queryKey: ['onts'],
    queryFn: () => base44.entities.ONT.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PredictiveMaintenance.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['predictions'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PredictiveMaintenance.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['predictions'])
  });

  const handleAcknowledge = async (predictionId) => {
    await updateMutation.mutateAsync({
      id: predictionId,
      data: {
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: 'Current User'
      }
    });
  };

  const handleResolve = async (predictionId) => {
    await updateMutation.mutateAsync({
      id: predictionId,
      data: { status: 'resolved' }
    });
  };

  const getDeviceName = (deviceType, deviceId) => {
    if (deviceType === 'olt') {
      const olt = olts.find(o => o.id === deviceId);
      return olt?.name || deviceId;
    } else {
      const ont = onts.find(o => o.id === deviceId);
      return ont?.serial_number || deviceId;
    }
  };

  const filteredPredictions = predictions.filter(pred => {
    const deviceName = getDeviceName(pred.device_type, pred.device_id);
    const matchesSearch = 
      pred.prediction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pred.analysis_summary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || pred.risk_level === riskFilter;
    const matchesType = deviceTypeFilter === 'all' || pred.device_type === deviceTypeFilter;
    return matchesSearch && matchesRisk && matchesType;
  });

  const stats = {
    critical: predictions.filter(p => p.risk_level === 'critical' && p.status === 'active').length,
    high: predictions.filter(p => p.risk_level === 'high' && p.status === 'active').length,
    acknowledged: predictions.filter(p => p.status === 'acknowledged').length,
    avgConfidence: predictions.length > 0 
      ? (predictions.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / predictions.length).toFixed(1)
      : 0
  };

  // Devices at risk
  const devicesAtRisk = [...new Set(
    predictions
      .filter(p => p.status === 'active' && (p.risk_level === 'critical' || p.risk_level === 'high'))
      .map(p => ({ type: p.device_type, id: p.device_id }))
  )];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Predictive Maintenance" 
        subtitle="Proactive failure prediction and prevention"
        action={() => setShowAnalysisDialog(true)}
        actionLabel="Run Analysis"
        actionIcon={Sparkles}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Critical Risk</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{stats.critical}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">High Risk</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{stats.high}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Avg Confidence</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">{stats.avgConfidence}%</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Devices at Risk</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{devicesAtRisk.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Info Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Predictive Analysis</h3>
            <p className="text-sm text-slate-400 mb-3">
              Our AI analyzes historical performance data including CPU usage, memory, temperature, signal levels, and error rates 
              to predict potential hardware failures before they occur. Get proactive alerts and automated work order creation.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Trend Analysis
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Failure Prediction
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Auto Work Orders
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search predictions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Device Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="olt">OLTs</SelectItem>
            <SelectItem value="ont">ONTs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Predictions Grid */}
      <Tabs defaultValue="active">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="active">Active Predictions</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800" />
                    <div className="flex-1">
                      <div className="h-4 w-2/3 bg-slate-800 rounded mb-2" />
                      <div className="h-3 w-1/2 bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-800 rounded" />
                    <div className="h-3 w-3/4 bg-slate-800 rounded" />
                  </div>
                </div>
              ))
            ) : filteredPredictions.filter(p => p.status === 'active').length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">No Active Predictions</h3>
                <p className="text-slate-400 mb-6">Run AI analysis on your devices to generate predictions</p>
                <Button 
                  onClick={() => setShowAnalysisDialog(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              </div>
            ) : (
              filteredPredictions
                .filter(p => p.status === 'active')
                .map((prediction, index) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    deviceName={getDeviceName(prediction.device_type, prediction.device_id)}
                    onClick={() => { setSelectedPrediction(prediction); setShowDetailDialog(true); }}
                  />
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="acknowledged" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPredictions.filter(p => p.status === 'acknowledged').map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                deviceName={getDeviceName(prediction.device_type, prediction.device_id)}
                onClick={() => { setSelectedPrediction(prediction); setShowDetailDialog(true); }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPredictions.filter(p => p.status === 'resolved').map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                deviceName={getDeviceName(prediction.device_type, prediction.device_id)}
                onClick={() => { setSelectedPrediction(prediction); setShowDetailDialog(true); }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Prediction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              {selectedPrediction && (
                <>
                  <Brain className="w-6 h-6 text-purple-400" />
                  <div>
                    <span>AI Prediction: {selectedPrediction.prediction_id}</span>
                    <p className="text-sm text-slate-500 font-normal">
                      {getDeviceName(selectedPrediction.device_type, selectedPrediction.device_id)}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPrediction && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <p className="text-slate-300">{selectedPrediction.analysis_summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Risk Level</p>
                  <StatusBadge status={selectedPrediction.risk_level} />
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Prediction Type</p>
                  <p className="text-white capitalize">{selectedPrediction.prediction_type?.replace(/_/g, ' ')}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">AI Confidence</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-purple-400">{selectedPrediction.confidence_score}%</p>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-1">Days Until Failure</p>
                  <p className="text-2xl font-bold text-white">{selectedPrediction.days_until_failure}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Predicted Date</p>
                  <p className="text-white">
                    {selectedPrediction.predicted_failure_date 
                      ? format(new Date(selectedPrediction.predicted_failure_date), 'MMMM d, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>

              {selectedPrediction.contributing_factors && selectedPrediction.contributing_factors.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/30">
                  <p className="text-sm text-slate-500 mb-3">Contributing Factors</p>
                  <ul className="space-y-2">
                    {selectedPrediction.contributing_factors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPrediction.recommended_actions && selectedPrediction.recommended_actions.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400 font-medium mb-3">Recommended Actions</p>
                  <ul className="space-y-2">
                    {selectedPrediction.recommended_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 text-sm">
                <span className="text-slate-500">Data Points Analyzed:</span>
                <span className="font-medium text-white">{selectedPrediction.historical_data_analyzed}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                {selectedPrediction.status === 'active' && (
                  <Button 
                    variant="outline" 
                    className="border-blue-500/50 text-blue-400"
                    onClick={() => { handleAcknowledge(selectedPrediction.id); setShowDetailDialog(false); }}
                  >
                    Acknowledge
                  </Button>
                )}
                {selectedPrediction.status !== 'resolved' && (
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => { handleResolve(selectedPrediction.id); setShowDetailDialog(false); }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Run Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Run Predictive Analysis
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-400">
              Select a device to run AI-powered predictive analysis. The system will analyze historical performance data 
              and predict potential failures.
            </p>

            <Tabs defaultValue="olt">
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="olt">
                  <Server className="w-4 h-4 mr-2" />
                  OLTs
                </TabsTrigger>
                <TabsTrigger value="ont">
                  <Wifi className="w-4 h-4 mr-2" />
                  ONTs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="olt" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {olts.map((olt) => (
                    <div 
                      key={olt.id}
                      className="p-4 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{olt.name}</p>
                          <p className="text-sm text-slate-500">{olt.olt_id} • {olt.ip_address}</p>
                        </div>
                        <PredictiveAnalysisRunner
                          deviceType="olt"
                          deviceId={olt.id}
                          deviceName={olt.name}
                          onComplete={() => setShowAnalysisDialog(false)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ont" className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {onts.slice(0, 20).map((ont) => (
                    <div 
                      key={ont.id}
                      className="p-4 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white font-mono">{ont.serial_number}</p>
                          <p className="text-sm text-slate-500">{ont.ont_id}</p>
                        </div>
                        <PredictiveAnalysisRunner
                          deviceType="ont"
                          deviceId={ont.id}
                          deviceName={ont.serial_number}
                          onComplete={() => setShowAnalysisDialog(false)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}