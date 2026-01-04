import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';

const statusColors = {
  scheduled: '#3b82f6',
  assigned: '#8b5cf6',
  in_transit: '#f59e0b',
  in_progress: '#eab308',
  completed: '#10b981',
  on_hold: '#ef4444'
};

export default function JobMap({ jobs, onJobClick, technicianLocation }) {
  const mapRef = useRef(null);

  // Default center (Cameroon, Douala)
  const defaultCenter = [4.0511, 9.7679];
  const center = technicianLocation 
    ? [technicianLocation.lat, technicianLocation.lng]
    : defaultCenter;

  useEffect(() => {
    // Fix for default marker icon in react-leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const getJobsWithLocations = () => {
    return jobs.filter(job => job.location?.gps_lat && job.location?.gps_lng);
  };

  const jobsWithLocations = getJobsWithLocations();

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden h-[600px] relative">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Technician current location */}
        {technicianLocation && (
          <>
            <Marker position={[technicianLocation.lat, technicianLocation.lng]}>
              <Popup>
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">Your Location</span>
                  </div>
                  <p className="text-xs text-slate-600">Current position</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[technicianLocation.lat, technicianLocation.lng]}
              radius={100}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
            />
          </>
        )}

        {/* Job markers */}
        {jobsWithLocations.map(job => (
          <Marker
            key={job.id}
            position={[job.location.gps_lat, job.location.gps_lng]}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{job.work_order_id}</h3>
                    <p className="text-xs text-slate-600 capitalize">{job.type}</p>
                  </div>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: statusColors[job.status],
                      color: statusColors[job.status]
                    }}
                  >
                    {job.status}
                  </Badge>
                </div>

                {job.scheduled_date && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                    <Clock className="w-3 h-3" />
                    {new Date(job.scheduled_date).toLocaleDateString()} - {job.scheduled_time_slot}
                  </div>
                )}

                {job.location?.address && (
                  <div className="flex items-start gap-1 text-xs text-slate-600 mb-3">
                    <MapPin className="w-3 h-3 mt-0.5" />
                    <span>{job.location.address}</span>
                  </div>
                )}

                {job.priority === 'urgent' && (
                  <div className="flex items-center gap-1 text-xs text-red-500 mb-2">
                    <AlertCircle className="w-3 h-3" />
                    Urgent Priority
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => onJobClick(job)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                >
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-lg p-3 z-[1000]">
        <h4 className="text-xs font-semibold text-white mb-2">Job Status</h4>
        <div className="space-y-1">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-300 capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}