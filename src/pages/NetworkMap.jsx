import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { 
  Server, Wifi, AlertTriangle, Layers, Filter,
  ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; 
      height: 24px; 
      background: ${color}; 
      border-radius: 50%; 
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

export default function NetworkMap() {
  const [showOlts, setShowOlts] = useState(true);
  const [showOnts, setShowOnts] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapCenter, setMapCenter] = useState([4.0511, 9.7679]); // Douala, Cameroon

  const { data: olts = [] } = useQuery({
    queryKey: ['olts'],
    queryFn: () => base44.entities.OLT.list(),
  });

  const { data: onts = [] } = useQuery({
    queryKey: ['onts'],
    queryFn: () => base44.entities.ONT.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.NetworkAlert.filter({ status: 'active' }),
  });

  const getOltIcon = (status) => {
    return createCustomIcon(status === 'online' ? '#10b981' : '#ef4444');
  };

  const getOntIcon = (status) => {
    return createCustomIcon(
      status === 'online' ? '#22c55e' : 
      status === 'los' ? '#f97316' : '#64748b'
    );
  };

  const stats = {
    onlineOlts: olts.filter(o => o.status === 'online').length,
    totalOlts: olts.length,
    onlineOnts: onts.filter(o => o.status === 'online').length,
    totalOnts: onts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical').length
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Network Map" 
        subtitle="Geographic view of network infrastructure"
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Server className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.onlineOlts}/{stats.totalOlts}</p>
            <p className="text-xs text-slate-500">OLTs Online</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Wifi className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.onlineOnts}/{stats.totalOnts}</p>
            <p className="text-xs text-slate-500">ONTs Online</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.criticalAlerts}</p>
            <p className="text-xs text-slate-500">Critical Alerts</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Switch checked={showOlts} onCheckedChange={setShowOlts} />
              <Label className="text-slate-400">OLTs</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showOnts} onCheckedChange={setShowOnts} />
              <Label className="text-slate-400">ONTs</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-slate-800/50"
        style={{ height: '600px' }}
      >
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapController center={mapCenter} />

          {/* OLT Markers */}
          {showOlts && olts.map((olt) => {
            if (!olt.location?.gps_lat || !olt.location?.gps_lng) return null;
            return (
              <Marker
                key={olt.id}
                position={[olt.location.gps_lat, olt.location.gps_lng]}
                icon={getOltIcon(olt.status)}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">{olt.name}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <StatusBadge status={olt.status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">IP:</span>
                        <span className="font-mono">{olt.ip_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ONTs:</span>
                        <span>{olt.active_onts || 0} connected</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* ONT Markers */}
          {showOnts && onts.map((ont) => {
            if (!ont.location?.gps_lat || !ont.location?.gps_lng) return null;
            return (
              <Marker
                key={ont.id}
                position={[ont.location.gps_lat, ont.location.gps_lng]}
                icon={getOntIcon(ont.status)}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold font-mono">{ont.serial_number}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <StatusBadge status={ont.status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Signal:</span>
                        <span>{ont.rx_power_dbm || '-'} dBm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Quality:</span>
                        <span className="capitalize">{ont.signal_quality || '-'}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </motion.div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
        <span className="text-sm text-slate-400">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow" />
          <span className="text-sm text-slate-300">OLT Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
          <span className="text-sm text-slate-300">OLT Offline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
          <span className="text-sm text-slate-300">ONT Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500 border-2 border-white shadow" />
          <span className="text-sm text-slate-300">ONT Offline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow" />
          <span className="text-sm text-slate-300">ONT LOS</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm text-amber-300">
          <strong>Tip:</strong> To display devices on the map, ensure OLTs and ONTs have GPS coordinates configured in their location settings. Click on markers to view device details.
        </p>
      </div>
    </div>
  );
}