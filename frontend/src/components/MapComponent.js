"use client";

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker, FeatureGroup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const DAY_COLORS = [
  '#FF3366',
  '#1CFEBA',
  '#FFE81A',
  '#9B51E0',
  '#FF8A00',
  '#00B4D8',
  '#E63946',
  '#2A9D8F',
];

function createNumberedIcon(color, number) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      position: relative;
      width: 32px; height: 32px; 
      background: ${color}; 
      border-radius: 50% 50% 50% 0; 
      transform: rotate(-45deg);
      box-shadow: -2px 2px 10px rgba(0,0,0,0.5), 0 0 15px ${color}80;
      display: flex; align-items: center; justify-content: center;
      margin-top: -32px;
      margin-left: -16px;
    ">
      <div style="
        transform: rotate(45deg);
        color: #1A1A1E; font-weight: 900; font-size: 14px; font-family: sans-serif;
      ">${number}</div>
      <div style="
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: inherit;
        box-shadow: 0 0 20px ${color};
        animation: pulse-glow 2s infinite;
        z-index: -1;
      "></div>
    </div>
    <style>
      @keyframes pulse-glow {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
      }
    </style>`,
    iconSize: [32, 32],
    iconAnchor: [0, 0],
    popupAnchor: [0, -32],
  });
}

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

function UpdateCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, map.getZoom());
    }
  }, [map, center]);
  return null;
}

function RouteArrows({ routeCoords, color }) {
  if (!routeCoords || routeCoords.length < 2) return null;
  const arrows = [];
  const numArrows = Math.max(1, Math.min(4, Math.floor(routeCoords.length / 10)));
  const step = Math.floor(routeCoords.length / (numArrows + 1));
  
  for (let i = 1; i <= numArrows; i++) {
    const idx = i * step;
    if (idx >= routeCoords.length - 1) continue;
    const p1 = routeCoords[idx];
    const p2 = routeCoords[idx + 1];
    
    const dy = p2[0] - p1[0];
    const dx = p2[1] - p1[1];
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const cssRotation = 90 - angle;
    
    const icon = L.divIcon({
      className: 'route-arrow',
      html: `<div style="transform: rotate(${cssRotation}deg); width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; opacity: 0.9;">
        <svg viewBox="0 0 24 24" fill="${color}" width="14" height="14" stroke="#1A1A1E" stroke-width="2">
          <path d="M12 2L22 22L12 17L2 22L12 2Z" />
        </svg>
      </div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    
    arrows.push(<Marker key={idx} position={p1} icon={icon} interactive={false} />);
  }
  return <FeatureGroup>{arrows}</FeatureGroup>;
}

function DayRoute({ waypoints, color, onClick }) {
  const [routeCoords, setRouteCoords] = useState(null);

  useEffect(() => {
    if (!waypoints || waypoints.length < 2) {
      setRouteCoords(null);
      return;
    }

    async function fetchRoute() {
      try {
        const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteCoords(coords);
        } else {
          setRouteCoords(waypoints);
        }
      } catch (err) {
        setRouteCoords(waypoints);
      }
    }

    fetchRoute();
  }, [waypoints]);

  if (!routeCoords || routeCoords.length < 2) return null;
  return (
    <FeatureGroup>
      <Polyline positions={routeCoords} color={color} weight={8} opacity={0.2} eventHandlers={{ click: onClick }} />
      <Polyline positions={routeCoords} color={color} weight={4} opacity={0.9} eventHandlers={{ click: onClick }} />
      <RouteArrows routeCoords={routeCoords} color={color} />
    </FeatureGroup>
  );
}

export default function MapComponent({ dayGroups = [], places = [], defaultCenter = [51.505, -0.09], onDaySelect, selectedDayIndex }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-[#202123] animate-pulse rounded-2xl"></div>;

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
        dayRoutes.push({ waypoints: dayWaypoints, color, uniqueKey: `route-day-${displayDayNum}`, originalIdx: dayIdx });
      }
    });
  } else if (places && places.length > 0) {
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
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite (Default)">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topographic">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Dark Mode">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <UpdateCenter center={defaultCenter} />
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
          <DayRoute 
            key={route.uniqueKey || idx} 
            waypoints={route.waypoints} 
            color={route.color} 
            onClick={() => {
              if (onDaySelect) onDaySelect(route.originalIdx);
            }} 
          />
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
