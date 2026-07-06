"use client";

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Day colors for markers and routes
const DAY_COLORS = [
  '#FF3366', // Pink
  '#1CFEBA', // Green
  '#FFE81A', // Yellow
  '#9B51E0', // Purple
  '#FF8A00', // Orange
  '#00B4D8', // Cyan
  '#E63946', // Red
  '#2A9D8F', // Teal
];

// Create colored marker icons
function createIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 28px; height: 28px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

// Numbered marker for order within a day
function createNumberedIcon(color, number) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 30px; height: 30px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 13px; font-family: sans-serif;
    ">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

// Component to fit map bounds to all markers
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds);
      map.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, bounds]);
  return null;
}

// Component to fetch and display a road route for one day
function DayRoute({ waypoints, color }) {
  const [routeCoords, setRouteCoords] = useState(null);

  useEffect(() => {
    if (!waypoints || waypoints.length < 2) {
      setRouteCoords(null);
      return;
    }

    async function fetchRoute() {
      try {
        // OSRM expects lon,lat (not lat,lon)
        const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          // GeoJSON coords are [lon, lat], flip to [lat, lon] for Leaflet
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteCoords(coords);
        } else {
          // Fallback to straight lines
          setRouteCoords(waypoints);
        }
      } catch (err) {
        // Fallback to straight lines on error
        setRouteCoords(waypoints);
      }
    }

    fetchRoute();
  }, [waypoints]);

  if (!routeCoords || routeCoords.length < 2) return null;
  return <Polyline positions={routeCoords} color={color} weight={4} opacity={0.8} />;
}

export default function MapComponent({ dayGroups = [], places = [], defaultCenter = [51.505, -0.09] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-[#202123] animate-pulse rounded-2xl"></div>;

  // Build markers and routes from dayGroups
  const allMarkers = [];
  const dayRoutes = [];
  const allCoords = [];

  if (dayGroups && dayGroups.length > 0) {
    dayGroups.forEach((day, dayIdx) => {
      const displayDayNum = day.computedDayNum || day.day_number || day.dayNumber || dayIdx + 1;
      const color = DAY_COLORS[(displayDayNum - 1) % DAY_COLORS.length];
      const dayWaypoints = [];

      (day.activities || []).forEach((act, actIdx) => {
        let coords = null;
        if (act.coordinates && typeof act.coordinates === 'string') {
          const parts = act.coordinates.split(',');
          if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
              coords = [lat, lng];
            }
          }
        }
        if (!coords) {
          // Fallback: place in a circle around default center
          const angle = actIdx * (Math.PI * 2 / Math.max((day.activities || []).length, 1));
          const radius = 0.02;
          coords = [defaultCenter[0] + Math.cos(angle) * radius, defaultCenter[1] + Math.sin(angle) * radius];
        }

        allCoords.push(coords);
        dayWaypoints.push(coords);
        allMarkers.push({
            coords,
            name: act.name,
            type: act.type,
            time: act.time,
            dayNumber: displayDayNum,
            actOrder: actIdx + 1,
            color,
            uniqueKey: `day-${displayDayNum}-act-${actIdx}-${act.name}`
          });
      });

      if (dayWaypoints.length >= 2) {
        dayRoutes.push({ waypoints: dayWaypoints, color, uniqueKey: `route-day-${displayDayNum}` });
      }
    });
  } else if (places && places.length > 0) {
    // Fallback: flat places array (legacy)
    places.forEach((place, idx) => {
      let coords = place.coordinates;
      if (!coords || !Array.isArray(coords)) {
        const angle = idx * (Math.PI * 2 / Math.max(places.length, 1));
        const radius = 0.02;
        coords = [defaultCenter[0] + Math.cos(angle) * radius, defaultCenter[1] + Math.sin(angle) * radius];
      }
      allCoords.push(coords);
      allMarkers.push({
        coords,
        name: place.name,
        type: place.type,
        dayNumber: 0,
        actOrder: idx + 1,
        color: DAY_COLORS[0],
      });
    });
  }

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-gray-700 shadow-sm z-0">
      <MapContainer 
        key={defaultCenter.join(',')}
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {allCoords.length > 0 && <FitBounds bounds={allCoords} />}
        
        {allMarkers.map((marker, idx) => (
          <Marker 
            key={marker.uniqueKey || idx} 
            position={marker.coords} 
            icon={createNumberedIcon(marker.color, marker.actOrder)}
          >
            <Popup>
              <div className="p-1 min-w-[140px]">
                <div style={{ 
                  display: 'inline-block', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  background: marker.color, 
                  color: 'white', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  marginBottom: '4px' 
                }}>
                  Day {marker.dayNumber}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', margin: '4px 0 2px' }}>{marker.name}</h3>
                {marker.time && <p style={{ fontSize: '12px', color: '#666' }}>{marker.time}</p>}
                {marker.type && <p style={{ fontSize: '12px', color: '#999' }}>{marker.type}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {dayRoutes.map((route, idx) => (
          <DayRoute key={route.uniqueKey || idx} waypoints={route.waypoints} color={route.color} />
        ))}
      </MapContainer>

      {/* Day Legend */}
      {dayGroups && dayGroups.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px', zIndex: 1000,
          background: 'rgba(32,33,35,0.92)', borderRadius: '12px', padding: '8px 12px',
          border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          display: 'flex', flexWrap: 'wrap', gap: '6px',
        }}>
          {dayGroups.map((day, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: DAY_COLORS[idx % DAY_COLORS.length],
              }} />
              <span style={{ color: '#ccc', fontSize: '11px', fontWeight: 600 }}>
                Day {day.computedDayNum || day.day_number || day.dayNumber || idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
