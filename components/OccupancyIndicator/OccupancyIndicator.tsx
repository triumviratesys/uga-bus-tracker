'use client';

import type { VehiclePosition } from '@/lib/gtfs/types';

interface OccupancyIndicatorProps {
  status?: VehiclePosition['occupancy_status'];
  className?: string;
  showLabel?: boolean;
}

export default function OccupancyIndicator({
  status,
  className = '',
  showLabel = false
}: OccupancyIndicatorProps) {
  const config: Record<string, { color: string; label: string; icon: string }> = {
    'EMPTY': { color: 'bg-green-500', label: 'Empty', icon: '▫️' },
    'MANY_SEATS_AVAILABLE': { color: 'bg-green-400', label: 'Many seats', icon: '▫️▫️' },
    'FEW_SEATS_AVAILABLE': { color: 'bg-yellow-400', label: 'Few seats', icon: '▫️▫️▫️' },
    'STANDING_ROOM_ONLY': { color: 'bg-orange-400', label: 'Standing room', icon: '▪️▫️▫️' },
    'CRUSHED_STANDING_ROOM_ONLY': { color: 'bg-red-400', label: 'Crowded', icon: '▪️▪️▫️' },
    'FULL': { color: 'bg-red-600', label: 'Full', icon: '▪️▪️▪️' },
    'NOT_ACCEPTING_PASSENGERS': { color: 'bg-gray-600', label: 'Not boarding', icon: '⛔' }
  };

  const info = status ? config[status] : null;

  if (!info) {
    return showLabel ? (
      <span className={`text-gray-500 text-sm ${className}`}>Unknown</span>
    ) : (
      <div className={`w-3 h-3 rounded-full bg-gray-300 ${className}`} title="Unknown occupancy" />
    );
  }

  if (showLabel) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-3 h-3 rounded-full ${info.color}`} />
        <span className="text-sm font-medium">{info.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`w-3 h-3 rounded-full ${info.color} ${className}`}
      title={info.label}
    />
  );
}
