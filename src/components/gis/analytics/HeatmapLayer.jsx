import React, { useMemo } from 'react';
import { Circle } from 'react-leaflet';

export default function HeatmapLayer({ data, type, intensity = 1 }) {
  const getColorByType = (value, type) => {
    const normalized = Math.min(value / 100, 1);
    
    const colorSchemes = {
      faults: [
        { threshold: 0.8, color: '#ef4444' },
        { threshold: 0.5, color: '#f97316' },
        { threshold: 0.3, color: '#f59e0b' },
        { threshold: 0, color: '#10b981' }
      ],
      churn: [
        { threshold: 0.7, color: '#dc2626' },
        { threshold: 0.4, color: '#ea580c' },
        { threshold: 0.2, color: '#facc15' },
        { threshold: 0, color: '#22c55e' }
      ],
      arpu: [
        { threshold: 0.8, color: '#16a34a' },
        { threshold: 0.5, color: '#84cc16' },
        { threshold: 0.3, color: '#fbbf24' },
        { threshold: 0, color: '#f87171' }
      ],
      usage: [
        { threshold: 0.9, color: '#7c3aed' },
        { threshold: 0.6, color: '#a855f7' },
        { threshold: 0.3, color: '#c084fc' },
        { threshold: 0, color: '#e9d5ff' }
      ],
      demand: [
        { threshold: 0.8, color: '#0ea5e9' },
        { threshold: 0.5, color: '#38bdf8' },
        { threshold: 0.3, color: '#7dd3fc' },
        { threshold: 0, color: '#bae6fd' }
      ]
    };

    const scheme = colorSchemes[type] || colorSchemes.faults;
    
    for (const { threshold, color } of scheme) {
      if (normalized >= threshold) return color;
    }
    
    return scheme[scheme.length - 1].color;
  };

  const getRadiusByIntensity = (value) => {
    return 50 + (value * intensity * 2);
  };

  return (
    <>
      {data.map((point, idx) => (
        <Circle
          key={idx}
          center={[point.lat, point.lng]}
          radius={getRadiusByIntensity(point.value)}
          fillColor={getColorByType(point.value, type)}
          fillOpacity={0.4}
          color={getColorByType(point.value, type)}
          weight={1}
          opacity={0.6}
        />
      ))}
    </>
  );
}