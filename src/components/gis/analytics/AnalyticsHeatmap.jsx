import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, Users, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import HeatmapLayer from './HeatmapLayer';
import 'leaflet/dist/leaflet.css';

export default function AnalyticsHeatmap({ center = [4.0511, 9.7679] }) {
  const [heatmapType, setHeatmapType] = useState('faults');
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list()
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.NetworkAlert.list()
  });

  useEffect(() => {
    generateHeatmapData();
  }, [heatmapType, customers, tickets, alerts]);

  const generateHeatmapData = async () => {
    setLoading(true);

    try {
      let data = [];

      switch (heatmapType) {
        case 'faults':
          // Aggregate faults by location
          const faultsByLocation = {};
          tickets.filter(t => t.category === 'technical').forEach(ticket => {
            const customer = customers.find(c => c.id === ticket.customer_id);
            if (customer?.address?.gps_coordinates) {
              const key = `${customer.address.gps_coordinates.lat.toFixed(3)},${customer.address.gps_coordinates.lng.toFixed(3)}`;
              faultsByLocation[key] = (faultsByLocation[key] || 0) + 1;
            }
          });
          
          data = Object.entries(faultsByLocation).map(([key, count]) => {
            const [lat, lng] = key.split(',').map(Number);
            return { lat, lng, value: Math.min(count * 10, 100) };
          });
          break;

        case 'churn':
          // Churn heatmap
          const churnByLocation = {};
          customers.filter(c => c.status === 'terminated').forEach(customer => {
            if (customer.address?.gps_coordinates) {
              const key = `${customer.address.gps_coordinates.lat.toFixed(3)},${customer.address.gps_coordinates.lng.toFixed(3)}`;
              churnByLocation[key] = (churnByLocation[key] || 0) + 1;
            }
          });
          
          data = Object.entries(churnByLocation).map(([key, count]) => {
            const [lat, lng] = key.split(',').map(Number);
            return { lat, lng, value: Math.min(count * 15, 100) };
          });
          break;

        case 'arpu':
          // ARPU heatmap
          const arpuByLocation = {};
          customers.filter(c => c.status === 'active').forEach(customer => {
            if (customer.address?.gps_coordinates) {
              const key = `${customer.address.gps_coordinates.lat.toFixed(3)},${customer.address.gps_coordinates.lng.toFixed(3)}`;
              if (!arpuByLocation[key]) {
                arpuByLocation[key] = { total: 0, count: 0 };
              }
              arpuByLocation[key].total += customer.account_balance || 0;
              arpuByLocation[key].count++;
            }
          });
          
          data = Object.entries(arpuByLocation).map(([key, { total, count }]) => {
            const [lat, lng] = key.split(',').map(Number);
            const avgArpu = total / count;
            return { lat, lng, value: Math.min((avgArpu / 100) * 100, 100) };
          });
          break;

        case 'usage':
          // Customer density as usage proxy
          const usageByLocation = {};
          customers.filter(c => c.status === 'active').forEach(customer => {
            if (customer.address?.gps_coordinates) {
              const key = `${customer.address.gps_coordinates.lat.toFixed(3)},${customer.address.gps_coordinates.lng.toFixed(3)}`;
              usageByLocation[key] = (usageByLocation[key] || 0) + 1;
            }
          });
          
          data = Object.entries(usageByLocation).map(([key, count]) => {
            const [lat, lng] = key.split(',').map(Number);
            return { lat, lng, value: Math.min(count * 8, 100) };
          });
          break;

        case 'demand':
          // Demand based on pending activations
          const demandByLocation = {};
          customers.filter(c => c.status === 'pending_activation').forEach(customer => {
            if (customer.address?.gps_coordinates) {
              const key = `${customer.address.gps_coordinates.lat.toFixed(3)},${customer.address.gps_coordinates.lng.toFixed(3)}`;
              demandByLocation[key] = (demandByLocation[key] || 0) + 1;
            }
          });
          
          data = Object.entries(demandByLocation).map(([key, count]) => {
            const [lat, lng] = key.split(',').map(Number);
            return { lat, lng, value: Math.min(count * 20, 100) };
          });
          break;
      }

      setHeatmapData(data);
    } catch (error) {
      console.error('Heatmap generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const heatmapTypes = [
    { value: 'faults', label: 'Faults', icon: AlertTriangle, color: 'text-red-400' },
    { value: 'churn', label: 'Customer Churn', icon: Users, color: 'text-orange-400' },
    { value: 'arpu', label: 'ARPU', icon: DollarSign, color: 'text-green-400' },
    { value: 'usage', label: 'Network Usage', icon: Activity, color: 'text-purple-400' },
    { value: 'demand', label: 'Demand', icon: Flame, color: 'text-blue-400' }
  ];

  const currentType = heatmapTypes.find(t => t.value === heatmapType);
  const Icon = currentType?.icon || Flame;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${currentType?.color}`} />
            <h3 className="text-lg font-semibold text-white">Interactive Heatmaps</h3>
          </div>
          <Select value={heatmapType} onValueChange={setHeatmapType}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {heatmapTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className={`w-4 h-4 ${type.color}`} />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg overflow-hidden border border-slate-800">
          <MapContainer
            center={center}
            zoom={12}
            className="w-full"
            style={{ height: '500px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            {heatmapData.length > 0 && (
              <HeatmapLayer data={heatmapData} type={heatmapType} intensity={1} />
            )}
          </MapContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-800/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">Data Points</p>
            <p className="text-xl font-bold text-white">{heatmapData.length}</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">Analysis Type</p>
            <p className="text-sm font-medium text-white">{currentType?.label}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}