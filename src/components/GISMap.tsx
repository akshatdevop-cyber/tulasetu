import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location } from '../types';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GISMapProps {
  center?: [number, number];
  zoom?: number;
  selectable?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
  }>;
  selectedLocation?: [number, number] | null;
  className?: string;
  route?: Array<[number, number]>;
}

const LocationMarker: React.FC<{
  position: [number, number] | null;
  onSelect?: (lat: number, lng: number) => void;
}> = ({ position, onSelect }) => {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
};

export const GISMap: React.FC<GISMapProps> = ({
  center = [20.5937, 78.9629], // Default to center of India
  zoom = 5,
  selectable = false,
  onLocationSelect,
  markers = [],
  selectedLocation = null,
  className = "h-64 w-full rounded-lg shadow-sm border border-slate-200 z-0",
  route,
}) => {
  return (
    <div className={className}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {route && route.length > 1 && (
          <Polyline positions={route} color="blue" weight={4} dashArray="5, 10" />
        )}
        
        {selectable && (
          <LocationMarker 
            position={selectedLocation} 
            onSelect={onLocationSelect} 
          />
        )}

        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <strong>{marker.title}</strong>
              {marker.description && (
                <>
                  <br />
                  <span className="text-sm text-slate-600">{marker.description}</span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
