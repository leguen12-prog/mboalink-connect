import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, TrendingUp, MapPin, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function DemandPrediction({ onPredictionComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const runDemandPrediction = async () => {
    setAnalyzing(true);
    
    try {
      const customers = await base44.entities.Customer.list();
      const zones = await base44.entities.ServiceabilityZone.list();
      const tickets = await base44.entities.Ticket.list();

      // Aggregate data by location
      const locationData = {};
      
      customers.forEach(customer => {
        if (customer.address?.gps_coordinates) {
          const { lat, lng } = customer.address.gps_coordinates;
          const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
          
          if (!locationData[key]) {
            locationData[key] = {
              lat,
              lng,
              customer_count: 0,
              total_arpu: 0,
              churn_count: 0,
              ticket_count: 0
            };
          }
          
          locationData[key].customer_count++;
          locationData[key].total_arpu += customer.account_balance || 0;
          
          if (customer.status === 'terminated') {
            locationData[key].churn_count++;
          }
        }
      });

      // Add ticket data
      tickets.forEach(ticket => {
        const customer = customers.find(c => c.id === ticket.customer_id);
        if (customer?.address?.gps_coordinates) {
          const { lat, lng } = customer.address.gps_coordinates;
          const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
          
          if (locationData[key]) {
            locationData[key].ticket_count++;
          }
        }
      });

      // Prepare data for AI analysis
      const dataPoints = Object.entries(locationData).map(([key, data]) => ({
        location: key,
        ...data,
        avg_arpu: data.customer_count > 0 ? data.total_arpu / data.customer_count : 0,
        churn_rate: data.customer_count > 0 ? (data.churn_count / data.customer_count) * 100 : 0
      }));

      const aiPrompt = `You are an expert network planning AI analyzing telecom demand patterns.

Analyze the following location-based customer data to predict network expansion opportunities:

${dataPoints.slice(0, 100).map(dp => `
Location: ${dp.location}
Customers: ${dp.customer_count}
Avg ARPU: ${dp.avg_arpu.toFixed(2)}
Churn Rate: ${dp.churn_rate.toFixed(1)}%
Tickets: ${dp.ticket_count}
`).join('\n')}

Identify:
1. High-demand zones (high customer density + high ARPU + low churn)
2. At-risk zones (high churn + high tickets)
3. Untapped opportunity zones (low coverage but high potential)
4. Expansion priorities

Provide demand scores (0-100) for top zones and strategic recommendations.`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            high_demand_zones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  demand_score: { type: "number" },
                  opportunity_type: { type: "string" },
                  estimated_revenue_potential: { type: "number" },
                  expansion_cost_estimate: { type: "number" },
                  priority: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            at_risk_zones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  risk_level: { type: "string" },
                  issues: { type: "array", items: { type: "string" } }
                }
              }
            },
            strategic_recommendations: {
              type: "array",
              items: { type: "string" }
            },
            total_expansion_capex: { type: "number" },
            expected_roi_months: { type: "number" }
          }
        }
      });

      // Parse locations and add coordinates
      const enrichedZones = aiResponse.high_demand_zones.map(zone => {
        const [lat, lng] = zone.location.split(',').map(Number);
        return { ...zone, lat, lng };
      });

      setPrediction({
        ...aiResponse,
        high_demand_zones: enrichedZones,
        analyzed_at: new Date().toISOString()
      });

      onPredictionComplete && onPredictionComplete(enrichedZones);
      toast.success(`Analyzed ${dataPoints.length} locations`);
      
    } catch (error) {
      console.error('Demand prediction failed:', error);
      toast.error('Failed to run demand prediction');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runDemandPrediction}
        disabled={analyzing}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
      >
        {analyzing ? (
          <>
            <Brain className="w-4 h-4 mr-2 animate-pulse" />
            Analyzing Demand...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4 mr-2" />
            Run AI Demand Prediction
          </>
        )}
      </Button>

      {prediction && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Demand Analysis Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Total CAPEX</p>
                <p className="text-xl font-bold text-white">
                  ${(prediction.total_expansion_capex / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Expected ROI</p>
                <p className="text-xl font-bold text-white">
                  {prediction.expected_roi_months} months
                </p>
              </div>
            </div>
          </Card>

          {/* High Demand Zones */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              High Demand Zones ({prediction.high_demand_zones.length})
            </h3>
            <div className="space-y-2">
              {prediction.high_demand_zones.slice(0, 5).map((zone, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white font-medium">{zone.opportunity_type}</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      Score: {zone.demand_score}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Revenue Potential</p>
                      <p className="text-white">${(zone.estimated_revenue_potential / 1000).toFixed(1)}K/mo</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Est. Cost</p>
                      <p className="text-white">${(zone.expansion_cost_estimate / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{zone.reasoning}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Strategic Recommendations</h3>
            <ul className="space-y-2">
              {prediction.strategic_recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}