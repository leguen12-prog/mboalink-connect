import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, LayersControl, FeatureGroup } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different asset types
const createAssetIcon = (type, status) => {
  const colors = {
    olt: '#3b82f6',
    ont: '#10b981',
    pole: '#8b5cf6',
    splitter: '#f59e0b',
    cabinet: '#06b6d4',
    manhole: '#64748b'
  };
  
  const statusColors = {
    active: '#10b981',
    inactive: '#64748b',
    faulty: '#ef4444',
    maintenance: '#f59e0b'
  };
  
  const color = statusColors[status] || colors[type] || '#64748b';
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    className: 'custom-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

export default function GISMapCore({ 
  center = [4.0511, 9.7679], 
  zoom = 13,
  layers = [],
  onAssetClick,
  showControls = true,
  height = '600px'
}) {
  const mapRef = useRef(null);
  const [visibleLayers, setVisibleLayers] = useState({});

  // Fetch GIS assets
  const { data: assets = [] } = useQuery({
    queryKey: ['gis-assets'],
    queryFn: () => base44.entities.GISAsset.list()
  });

  // Fetch fibre routes
  const { data: routes = [] } = useQuery({
    queryKey: ['fibre-routes'],
    queryFn: () => base44.entities.FibreRoute.list()
  });

  // Fetch serviceability zones
  const { data: zones = [] } = useQuery({
    queryKey: ['serviceability-zones'],
    queryFn: () => base44.entities.ServiceabilityZone.list()
  });

  // Fetch GIS events (outages, etc.)
  const { data: events = [] } = useQuery({
    queryKey: ['gis-events'],
    queryFn: () => base44.entities.GISEvent.list()
  });

  // Group assets by type
  const assetsByType = assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) acc[asset.asset_type] = [];
    acc[asset.asset_type].push(asset);
    return acc;
  }, {});

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full"
      style={{ height }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {showControls && (
        <LayersControl position="topright">
          
          {/* Infrastructure Layers */}
          <LayersControl.Overlay checked name="OLTs">
            <FeatureGroup>
              {assetsByType.olt?.map(asset => (
                <Marker
                  key={asset.id}
                  position={[asset.geometry.coordinates[1], asset.geometry.coordinates[0]]}
                  icon={createAssetIcon('olt', asset.status)}
                  eventHandlers={{
                    click: () => onAssetClick && onAssetClick(asset)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-bold">{asset.name}</h3>
                      <p>Type: OLT</p>
                      <p>Status: {asset.status}</p>
                      <p>Capacity: {asset.capacity?.used}/{asset.capacity?.total}</p>
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
                  eventHandlers={{
                    click: () => onAssetClick && onAssetClick(asset)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-bold">{asset.name}</h3>
                      <p>Type: ONT</p>
                      <p>Status: {asset.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Poles">
            <FeatureGroup>
              {assetsByType.pole?.map(asset => (
                <Marker
                  key={asset.id}
                  position={[asset.geometry.coordinates[1], asset.geometry.coordinates[0]]}
                  icon={createAssetIcon('pole', asset.status)}
                  eventHandlers={{
                    click: () => onAssetClick && onAssetClick(asset)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-bold">{asset.name}</h3>
                      <p>Type: Pole</p>
                      <p>Status: {asset.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Splitters">
            <FeatureGroup>
              {assetsByType.splitter?.map(asset => (
                <Marker
                  key={asset.id}
                  position={[asset.geometry.coordinates[1], asset.geometry.coordinates[0]]}
                  icon={createAssetIcon('splitter', asset.status)}
                  eventHandlers={{
                    click: () => onAssetClick && onAssetClick(asset)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <h3 className="font-bold">{asset.name}</h3>
                      <p>Type: Splitter</p>
                      <p>Ratio: {asset.properties?.split_ratio || 'N/A'}</p>
                      <p>Capacity: {asset.capacity?.used}/{asset.capacity?.total}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Fibre Routes */}
          <LayersControl.Overlay checked name="Fibre Routes">
            <FeatureGroup>
              {routes.map(route => {
                const routeColors = {
                  feeder: '#3b82f6',
                  distribution: '#10b981',
                  drop: '#f59e0b'
                };
                return (
                  <Polyline
                    key={route.id}
                    positions={route.geometry.coordinates.map(coord => [coord[1], coord[0]])}
                    color={routeColors[route.route_type] || '#64748b'}
                    weight={3}
                    opacity={0.7}
                  >
                    <Popup>
                      <div className="text-sm">
                        <h3 className="font-bold">{route.name}</h3>
                        <p>Type: {route.route_type}</p>
                        <p>Length: {route.length_meters}m</p>
                        <p>Fibres: {route.fibre_count}</p>
                        <p>Utilization: {route.capacity_utilization}%</p>
                      </div>
                    </Popup>
                  </Polyline>
                );
              })}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Serviceability Zones */}
          <LayersControl.Overlay name="Serviceability Zones">
            <FeatureGroup>
              {zones.map(zone => {
                const statusColors = {
                  fully_serviceable: '#10b981',
                  limited_capacity: '#f59e0b',
                  planned: '#3b82f6',
                  not_serviceable: '#ef4444'
                };
                return (
                  <Polygon
                    key={zone.id}
                    positions={zone.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
                    fillColor={statusColors[zone.serviceability_status]}
                    fillOpacity={0.2}
                    color={statusColors[zone.serviceability_status]}
                    weight={2}
                  >
                    <Popup>
                      <div className="text-sm">
                        <h3 className="font-bold">{zone.name}</h3>
                        <p>Status: {zone.serviceability_status}</p>
                        <p>Technology: {zone.technology}</p>
                        <p>Max Speed: {zone.max_speed_mbps} Mbps</p>
                        <p>Active Customers: {zone.active_customers}/{zone.premises_count}</p>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Events/Outages */}
          <LayersControl.Overlay name="Active Events">
            <FeatureGroup>
              {events.filter(e => e.status === 'active').map(event => {
                if (event.affected_area_polygon) {
                  return (
                    <Polygon
                      key={event.id}
                      positions={event.affected_area_polygon.coordinates[0].map(coord => [coord[1], coord[0]])}
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
                          <p>Severity: {event.severity}</p>
                          <p>Affected Customers: {event.affected_customers?.length || 0}</p>
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
      )}
    </MapContainer>
  );
}