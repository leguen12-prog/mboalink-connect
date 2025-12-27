import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PredictiveAnalysisRunner({ deviceType, deviceId, deviceName, onComplete }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const queryClient = useQueryClient();

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(10);
    setCurrentStep('Collecting historical data...');

    try {
      // Step 1: Fetch historical metrics
      const metrics = await base44.entities.PerformanceMetric.filter({
        device_type: deviceType,
        device_id: deviceId
      }, '-timestamp', 100);

      setProgress(30);
      setCurrentStep('Analyzing performance trends...');

      // Step 2: Prepare data for AI analysis
      const deviceInfo = deviceType === 'olt' 
        ? await base44.entities.OLT.filter({ id: deviceId })
        : await base44.entities.ONT.filter({ id: deviceId });

      const device = deviceInfo[0];
      
      if (!device) {
        throw new Error('Device not found');
      }

      setProgress(50);
      setCurrentStep('Running AI predictive model...');

      // Step 3: Call AI for predictive analysis
      const aiPrompt = `You are an expert network engineer AI analyzing FTTH network equipment for predictive maintenance.

Device Type: ${deviceType.toUpperCase()}
Device Name: ${deviceName}
Current Status: ${device.status}

Historical Performance Data (last ${metrics.length} readings):
${metrics.slice(0, 20).map(m => `
- Timestamp: ${m.timestamp}
- CPU: ${m.cpu_usage}%, Memory: ${m.memory_usage}%, Temp: ${m.temperature}°C
- ${deviceType === 'ont' ? `RX Power: ${m.rx_power}dBm, TX Power: ${m.tx_power}dBm, Signal: ${device.signal_quality}` : ''}
- Errors: ${m.error_count}, Status: ${m.status}
`).join('')}

Current Device Metrics:
${deviceType === 'olt' ? `
- Total ONTs: ${device.total_ont_capacity}, Active: ${device.active_onts}
- CPU: ${device.cpu_usage_percent}%, Memory: ${device.memory_usage_percent}%
- Temperature: ${device.temperature_celsius}°C
- Uptime: ${device.uptime_hours} hours
` : `
- Signal Quality: ${device.signal_quality}
- RX Power: ${device.rx_power_dbm}dBm, TX Power: ${device.tx_power_dbm}dBm
- Battery: ${device.battery_percent}%
- Uptime: ${device.uptime_hours} hours
`}

Analyze this data and predict potential failures or performance degradation. Consider:
1. Trending patterns in CPU, memory, temperature
2. Signal quality degradation (for ONTs)
3. Error rate increases
4. Hardware stress indicators
5. Age and uptime factors

Provide a predictive maintenance assessment.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            risk_level: { 
              type: "string",
              enum: ["critical", "high", "medium", "low"]
            },
            confidence_score: { type: "number" },
            prediction_type: { 
              type: "string",
              enum: ["hardware_failure", "signal_degradation", "overheating", "performance_degradation", "power_supply_failure"]
            },
            days_until_failure: { type: "number" },
            analysis_summary: { type: "string" },
            contributing_factors: { 
              type: "array",
              items: { type: "string" }
            },
            recommended_actions: { 
              type: "array",
              items: { type: "string" }
            },
            should_create_alert: { type: "boolean" },
            should_create_work_order: { type: "boolean" }
          }
        }
      });

      setProgress(80);
      setCurrentStep('Creating predictive maintenance record...');

      // Step 4: Create prediction record
      const prediction = await base44.entities.PredictiveMaintenance.create({
        prediction_id: `PRED-${Date.now().toString().slice(-8)}`,
        device_type: deviceType,
        device_id: deviceId,
        prediction_type: aiResponse.prediction_type,
        risk_level: aiResponse.risk_level,
        confidence_score: aiResponse.confidence_score,
        predicted_failure_date: new Date(Date.now() + (aiResponse.days_until_failure * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        days_until_failure: aiResponse.days_until_failure,
        analysis_summary: aiResponse.analysis_summary,
        contributing_factors: aiResponse.contributing_factors,
        recommended_actions: aiResponse.recommended_actions,
        status: 'active',
        historical_data_analyzed: metrics.length,
        model_version: 'v1.0-llm'
      });

      // Step 5: Auto-create alert if needed
      if (aiResponse.should_create_alert && (aiResponse.risk_level === 'critical' || aiResponse.risk_level === 'high')) {
        await base44.entities.NetworkAlert.create({
          alert_id: `ALT-PRED-${Date.now().toString().slice(-6)}`,
          source_type: deviceType,
          source_id: deviceId,
          severity: aiResponse.risk_level === 'critical' ? 'critical' : 'major',
          category: 'performance',
          title: `Predictive: ${aiResponse.prediction_type.replace(/_/g, ' ')} - ${deviceName}`,
          description: aiResponse.analysis_summary,
          status: 'active',
          ai_root_cause: aiResponse.contributing_factors.join('; '),
          ai_suggested_action: aiResponse.recommended_actions[0]
        });
      }

      // Step 6: Auto-create work order if critical
      if (aiResponse.should_create_work_order && aiResponse.risk_level === 'critical') {
        // Get affected customers
        let affectedCustomers = [];
        if (deviceType === 'ont') {
          const onts = await base44.entities.ONT.filter({ id: deviceId });
          if (onts[0]?.customer_id) {
            affectedCustomers = [onts[0].customer_id];
          }
        } else if (deviceType === 'olt') {
          const onts = await base44.entities.ONT.filter({ olt_id: deviceId });
          affectedCustomers = onts.filter(o => o.customer_id).map(o => o.customer_id);
        }

        if (affectedCustomers.length > 0) {
          await base44.entities.WorkOrder.create({
            work_order_id: `WO-PRED-${Date.now().toString().slice(-8)}`,
            customer_id: affectedCustomers[0],
            type: 'maintenance',
            priority: 'urgent',
            status: 'scheduled',
            scheduled_date: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            scheduled_time_slot: 'morning',
            location: device.location || {},
            equipment_needed: ['Diagnostic tools', 'Replacement parts'],
            technician_notes: `PREDICTIVE MAINTENANCE: ${aiResponse.analysis_summary}\n\nRecommended Actions:\n${aiResponse.recommended_actions.join('\n')}`
          });

          await base44.entities.PredictiveMaintenance.update(prediction.id, {
            auto_work_order_created: true
          });
        }
      }

      setProgress(100);
      setCurrentStep('Analysis complete!');

      toast.success(`Predictive analysis completed for ${deviceName}`);
      
      queryClient.invalidateQueries(['predictions']);
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['workOrders']);

      setTimeout(() => {
        setIsAnalyzing(false);
        setProgress(0);
        setCurrentStep('');
        if (onComplete) onComplete(aiResponse);
      }, 1500);

    } catch (error) {
      console.error('Predictive analysis failed:', error);
      toast.error('Failed to run predictive analysis');
      setIsAnalyzing(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  return (
    <div>
      <Button
        onClick={runPredictiveAnalysis}
        disabled={isAnalyzing}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
      >
        {isAnalyzing ? (
          <>
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Analyzing...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4 mr-2" />
            Run AI Analysis
          </>
        )}
      </Button>

      {isAnalyzing && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm font-medium text-purple-400">{currentStep}</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
          <p className="text-xs text-slate-500 mt-2">{progress}% complete</p>
        </div>
      )}
    </div>
  );
}