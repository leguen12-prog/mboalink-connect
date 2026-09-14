import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Router, Cable, Shield, AlertTriangle, 
  MapPin, Mountain, Satellite, Activity, Layers, 
  ChevronLeft, ChevronRight, Eye, EyeOff
} from 'lucide-react';

const LAYER_GROUPS = [
  {
    id: 'population',
    label: 'Population Density',
    icon: Users,
    color: '#06b6d4',
    description: 'Demographic & terrain overlays',
    layers: [
      { id: 'population', label: 'Population Density', icon: Users },
      { id: 'terrain', label: 'Terrain', icon: Mountain },
      { id: 'satellite', label: 'Satellite View', icon: Satellite },
    ]
  },
  {
    id: 'infrastructure',
    label: 'Network Infrastructure',
    icon: Router,
    color: '#3b82f6',
    description: 'Physical network assets & routes',
    layers: [
      { id: 'olts', label: 'OLTs', icon: Router },
      { id: 'onts', label: 'ONTs', icon: Router },
      { id: 'poles', label: 'Poles', icon: MapPin },
      { id: 'splitters', label: 'Splitters', icon: Activity },
      { id: 'routes', label: 'Fibre Routes', icon: Cable },
      { id: 'geofences', label: 'Geofences', icon: Shield },
    ]
  },
  {
    id: 'heatmaps',
    label: 'Usage Heatmaps',
    icon: Layers,
    color: '#f59e0b',
    description: 'Service coverage & event zones',
    layers: [
      { id: 'zones', label: 'Serviceability Zones', icon: MapPin },
      { id: 'events', label: 'Active Events', icon: AlertTriangle },
    ]
  },
];

export default function LayerControlPanel({ layers, onToggle, onToggleAll }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    population: true,
    infrastructure: true,
    heatmaps: true,
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const activeCount = Object.values(layers).filter(Boolean).length;

  if (collapsed) {
    return (
      <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-800 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="text-slate-300 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-800 w-72 max-h-[calc(100%-2rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-xl z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Layer Control</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
            {activeCount} active
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toggle All */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <span className="text-xs text-slate-400">Toggle All Layers</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-slate-300 hover:text-white"
          onClick={onToggleAll}
        >
          {activeCount > 0 ? (
            <><EyeOff className="w-3 h-3 mr-1" /> Hide All</>
          ) : (
            <><Eye className="w-3 h-3 mr-1" /> Show All</>
          )}
        </Button>
      </div>

      {/* Layer Groups */}
      <div className="p-2 space-y-1">
        {LAYER_GROUPS.map(group => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups[group.id];
          const groupLayerIds = group.layers.map(l => l.id);
          const groupActiveCount = groupLayerIds.filter(id => layers[id]).length;

          return (
            <div key={group.id} className="rounded-lg bg-slate-800/30 overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GroupIcon className="w-4 h-4" style={{ color: group.color }} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{group.label}</p>
                    <p className="text-xs text-slate-500">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{groupActiveCount}/{group.layers.length}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Group Layers */}
              {isExpanded && (
                <div className="px-2 pb-2 space-y-0.5">
                  {group.layers.map(layer => {
                    const LayerIcon = layer.icon;
                    const isActive = layers[layer.id];
                    return (
                      <div
                        key={layer.id}
                        className={`flex items-center justify-between px-2 py-2 rounded-md transition-colors cursor-pointer
                          ${isActive ? 'bg-slate-700/50' : 'hover:bg-slate-800/50'}`}
                        onClick={() => onToggle(layer.id)}
                      >
                        <div className="flex items-center gap-2">
                          <LayerIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                          <span className={`text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                            {layer.label}
                          </span>
                        </div>
                        <Switch checked={!!isActive} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}