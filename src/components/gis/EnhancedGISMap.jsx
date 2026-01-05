import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, LayersControl, FeatureGroup, useMap } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createAssetIcon = (type, status) => {
  const colors = {
    olt: '#3b82f6', ont: '#10b981', pole: '#8b5cf6',
    splitter: '#f59e0b', cabinet: '#06b6d4', manhole: '#64748b'
  };
  const statusColors = {
    active: '#10b981', inactive: '#64748b', faulty: '#ef4444', maintenance: '#f59e0b'
  };
  const color = statusColors[status] || colors[type] || '#64748b';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: 'custom-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

function DrawingTools({ onDrawCreated }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      onDrawCreated(e);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off(L.Draw.Event.CREATED);
    };
  }, [map, onDrawCreated]);

  return null;
}

export default function EnhancedGISMap({ 
  center = [4.0511, 9.7679], 
  zoom = 13,
  onAssetClick,
  height = '600px'
}) {
  const [drawingMode, setDrawingMode] = useState(false);
  const [overlayLayers, setOverlayLayers] = useState({
    population: false,
    terrain: false,
    satellite: false
  });
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({
    queryKey: ['gis-assets'],
    queryFn: () => base44.entities.GISAsset.list()
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['fibre-routes'],
    queryFn: () => base44.entities.FibreRoute.list()
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['serviceability-zones'],
    queryFn: () => base44.entities.ServiceabilityZone.list()
  });

  const { data: geofences = [] } = useQuery({
    queryKey: ['geofences'],
    queryFn: () => base44.entities.Geofence.list()
  });

  const { data: events = [] } = useQuery({
    queryKey: ['gis-events'],
    queryFn: () => base44.entities.GISEvent.list()
  });

  const createGeofenceMutation = useMutation({
    mutationFn: (data) => base44.entities.Geofence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
      toast.success('Geofence created');
    }
  });

  const handleDrawCreated = (e) => {
    const { layer, layerType } = e;
    
    if (layerType === 'polygon' || layerType === 'rectangle') {
      const coords = layer.getLatLngs()[0].map(latlng => [latlng.lng, latlng.lat]);
      coords.push(coords[0]); // Close the polygon
      createGeofenceMutation.mutate({
        name: `Zone ${new Date().toLocaleTimeString()}`,
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        },
        fence_type: 'custom',
        trigger_on: 'both',
        is_active: true,
        description: 'Custom drawn zone'
      });
    } else if (layerType === 'circle') {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      createGeofenceMutation.mutate({
        name: `Circle ${new Date().toLocaleTimeString()}`,
        geometry: {
          type: 'Circle',
          coordinates: [center.lng, center.lat],
          radius
        },
        fence_type: 'custom',
        trigger_on: 'both',
        is_active: true,
        description: 'Circular monitoring zone'
      });
    } else if (layerType === 'polyline') {
      toast.info('Route drawing captured. Please use Asset Management to create routes with proper endpoints.');
    }
  };

  const assetsByType = assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) acc[asset.asset_type] = [];
    acc[asset.asset_type].push(asset);
    return acc;
  }, {});

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <Card className="bg-slate-900/90 border-slate-800 p-2">
          <div className="space-y-2">
            <Button
              size="sm"
              variant={drawingMode ? "default" : "outline"}
              onClick={() => setDrawingMode(!drawingMode)}
              className="w-full"
            >
              {drawingMode ? 'Drawing Active' : 'Enable Drawing'}
            </Button>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overlayLayers.population}
                  onChange={(e) => setOverlayLayers({...overlayLayers, population: e.target.checked})}
                  className="w-3 h-3"
                />
                Population Density
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overlayLayers.terrain}
                  onChange={(e) => setOverlayLayers({...overlayLayers, terrain: e.target.checked})}
                  className="w-3 h-3"
                />
                Terrain
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overlayLayers.satellite}
                  onChange={(e) => setOverlayLayers({...overlayLayers, satellite: e.target.checked})}
                  className="w-3 h-3"
                />
                Satellite View
              </label>
            </div>
          </div>
        </Card>
      </div>

      <MapContainer center={center} zoom={zoom} style={{ height }} className="w-full">
        {/* Base Layers */}
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {overlayLayers.satellite && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri'
          />
        )}

        {overlayLayers.terrain && (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenTopoMap'
            opacity={0.6}
          />
        )}

        {overlayLayers.population && (
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png"
            attribution='&copy; Stadia Maps'
            opacity={0.4}
          />
        )}

        {drawingMode && <DrawingTools onDrawCreated={handleDrawCreated} />}

        <LayersControl position="topright">
          {/* Infrastructure */}
          <LayersControl.Overlay checked name="OLTs">
            <FeatureGroup>
              {assetsByType.olt?.map(asset => (
                <Marker
                  key={asset.id}
                  position={[asset.geometry.coordinates[1], asset.geometry.coordinates[0]]}
                  icon={createAssetIcon('olt', asset.status)}
                  eventHandlers={{ click: () => onAssetClick && onAssetClick(asset) }}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-bold">{asset.name}</h3>
                      <p>Type: OLT</p>
                      <p>Status: {asset.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="ONTs">
            <FeatureGroup>
              {assetsByType.ont?.map(asset => (
                <Marker
                  key={asset.id}
                  position={[asset.geometry.coordinates[1], asset.geometry.coordinates[0]]}
                  icon={createAssetIcon('ont', asset.status)}
                  eventHandlers={{ click: () => onAssetClick && onAssetClick(asset) }}
                >
                  <Popup><div className="text-sm"><h3 className="font-bold">{asset.name}</h3></div></Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Routes */}
          <LayersControl.Overlay checked name="Fibre Routes">
            <FeatureGroup>
              {routes.map(route => {
                const colors = { feeder: '#3b82f6', distribution: '#10b981', drop: '#f59e0b' };
                return (
                  <Polyline
                    key={route.id}
                    positions={route.geometry.coordinates.map(c => [c[1], c[0]])}
                    color={colors[route.route_type] || '#64748b'}
                    weight={3}
                    opacity={0.7}
                  >
                    <Popup>
                      <div className="text-sm">
                        <h3 className="font-bold">{route.name}</h3>
                        <p>Length: {route.length_meters}m</p>
                      </div>
                    </Popup>
                  </Polyline>
                );
              })}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Zones */}
          <LayersControl.Overlay name="Serviceability Zones">
            <FeatureGroup>
              {zones.map(zone => {
                const colors = { fully_serviceable: '#10b981', limited_capacity: '#f59e0b', planned: '#3b82f6', not_serviceable: '#ef4444' };
                return (
                  <Polygon
                    key={zone.id}
                    positions={zone.geometry.coordinates[0].map(c => [c[1], c[0]])}
                    fillColor={colors[zone.serviceability_status]}
                    fillOpacity={0.2}
                    color={colors[zone.serviceability_status]}
                    weight={2}
                  >
                    <Popup>
                      <div className="text-sm">
                        <h3 className="font-bold">{zone.name}</h3>
                        <p>Status: {zone.serviceability_status}</p>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Geofences */}
          <LayersControl.Overlay checked name="Geofences">
            <FeatureGroup>
              {geofences.filter(f => f.is_active).map(fence => (
                <Polygon
                  key={fence.id}
                  positions={fence.geometry.coordinates[0].map(c => [c[1], c[0]])}
                  fillColor="#a855f7"
                  fillOpacity={0.1}
                  color="#a855f7"
                  weight={2}
                  dashArray="5, 10"
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-bold text-purple-400">{fence.name}</h3>
                      <Badge className="bg-purple-500/20 text-purple-400">{fence.fence_type}</Badge>
                      <p className="mt-1">Trigger: {fence.trigger_on}</p>
                    </div>
                  </Popup>
                </Polygon>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Events */}
          <LayersControl.Overlay name="Active Events">
            <FeatureGroup>
              {events.filter(e => e.status === 'active').map(event => {
                if (event.affected_area_polygon) {
                  return (
                    <Polygon
                      key={event.id}
                      positions={event.affected_area_polygon.coordinates[0].map(c => [c[1], c[0]])}
                      fillColor="#ef4444"
                      fillOpacity={0.3}
                      color="#ef4444"
                      weight={2}
                      dashArray="5, 5"
                    >
                      <Popup>
                        <div className="text-sm">
                          <h3 className="font-bold text-red-600">{event.event_type}</h3>
                          <p>{event.description}</p>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                }
                return null;
              })}
            </FeatureGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}