import React, { useEffect, useRef } from 'react';
import { Map as MaplibreMap, LngLatBounds, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { getArea, getLength, formatArea, formatLength } from '../utils/geo';

setWorkerUrl(maplibreWorkerUrl);

// SVG Data URI for Custom Neon Maps Pin
const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path fill="%2300f2fe" stroke="%230a0b10" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

const PIN_URL = 'data:image/svg+xml;utf8,' + markerSvg;

const emptyFC = { type: 'FeatureCollection', features: [] };

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const escapeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Ensure a polygon ring is explicitly closed for GeoJSON
const closeRing = (ring) => {
  const pts = ring.map((c) => [c[0], c[1]]);
  if (pts.length === 0) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) pts.push([first[0], first[1]]);
  return pts;
};

const buildPointFeature = (id, coords, props = {}) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [coords[0], coords[1]] },
  properties: { id, ...props },
});

const buildMarkersFeatures = (markersList) =>
  markersList.map((m) => buildPointFeature(m.id, m.coords, { label: m.label || '' }));

const buildBikesFeatures = (bikes) =>
  bikes.map((b) =>
    buildPointFeature(`bike-${b.id}`, b.coords, {
      vehicleNo: b.vehicleNo || '',
      name: b.name || '',
      chassisNo: b.chassisNo || '',
      area: b.area || '',
      battery: b.battery != null ? b.battery : '',
      hour: b.hour != null ? b.hour : '',
      date: b.date || '',
      lat: b.coords ? b.coords[1] : '',
      lon: b.coords ? b.coords[0] : '',
    })
  );

const buildAreaFeature = (coords, name) => [
  {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [closeRing(coords)] },
    properties: { name: name || '' },
  },
];

const buildSavedAreasFeatures = (savedAreas) =>
  savedAreas
    .map((area) => {
      let coords;
      try {
        coords = typeof area.coordinates === 'string' ? JSON.parse(area.coordinates) : area.coordinates;
      } catch {
        coords = null;
      }
      if (!coords || coords.length < 3) return null;
      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [closeRing(coords)] },
        properties: {
          id: `saved-area-${area.id}`,
          name: area.name || area.coordinateLabels || '',
        },
      };
    })
    .filter(Boolean);

const buildTracksFeatures = (tracks) =>
  tracks
    .filter((t) => t.longitude != null && t.latitude != null)
    .map((t) => buildPointFeature(`track-${t.id}`, [t.longitude, t.latitude], { name: t.name || '' }));

const buildRoutesFeatures = (routes) => {
  const features = [];
  routes.forEach((route) => {
    if (
      route.startLongitude == null ||
      route.startLatitude == null ||
      route.endLongitude == null ||
      route.endLatitude == null
    ) {
      return;
    }
    const start = [route.startLongitude, route.startLatitude];
    const end = [route.endLongitude, route.endLatitude];
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [start, end] },
      properties: { id: `route-line-${route.id}`, kind: 'route', name: route.name || '' },
    });
    features.push(buildPointFeature(`route-start-${route.id}`, start, { kind: 'route-start' }));
    features.push(buildPointFeature(`route-end-${route.id}`, end, { kind: 'route-end' }));
  });
  return features;
};

const buildGraticuleFeatures = () => {
  const features = [];
  for (let lon = -180; lon <= 180; lon += 10) {
    const line = [];
    for (let lat = -80; lat <= 80; lat += 10) line.push([lon, lat]);
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: line }, properties: {} });
  }
  for (let lat = -80; lat <= 80; lat += 10) {
    const line = [];
    for (let lon = -180; lon <= 180; lon += 10) line.push([lon, lat]);
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: line }, properties: {} });
  }
  return features;
};

const updateSource = (map, id, features) => {
  if (!map || !map.isStyleLoaded()) return;
  const source = map.getSource(id);
  if (!source || typeof source.setData !== 'function') return;
  source.setData({ type: 'FeatureCollection', features });
};

const applyAreaStyle = (map, style) => {
  if (!map || !map.isStyleLoaded()) return;
  const dash = style.dashStyle === 'dashed' ? [6, 6] : [1, 0];
  const setP = (layer, prop, value) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop, value);
  };
  setP('draw-fill', 'fill-color', style.fillColor);
  setP('draw-fill', 'fill-opacity', style.fillOpacity);
  setP('savedareas-fill', 'fill-color', style.fillColor);
  setP('savedareas-fill', 'fill-opacity', style.fillOpacity);
  setP('draw-line', 'line-color', style.strokeColor);
  setP('draw-line', 'line-width', style.strokeWidth);
  setP('savedareas-line', 'line-color', style.strokeColor);
  setP('savedareas-line', 'line-width', style.strokeWidth);
  setP('draw-line', 'line-dasharray', dash);
  setP('savedareas-line', 'line-dasharray', dash);
};

const buildStyle = (initialLayers) => {
  const vis = (v) => (v ? 'visible' : 'none');
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors',
      },
      dark: {
        type: 'raster',
        tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'],
        tileSize: 256,
        maxzoom: 20,
        attribution: '© CartoDB, © OpenStreetMap contributors',
      },
      graticule: { type: 'geojson', data: emptyFC },
      area: { type: 'geojson', data: emptyFC },
      savedareas: { type: 'geojson', data: emptyFC },
      draw: { type: 'geojson', data: emptyFC },
      markers: { type: 'geojson', data: emptyFC },
      bikes: { type: 'geojson', data: emptyFC },
      tracks: { type: 'geojson', data: emptyFC },
      routes: { type: 'geojson', data: emptyFC },
      routepreview: { type: 'geojson', data: emptyFC },
    },
    layers: [
      {
        id: 'osm-raster',
        type: 'raster',
        source: 'osm',
        layout: { visibility: vis(initialLayers.osm) },
      },
      {
        id: 'dark-raster',
        type: 'raster',
        source: 'dark',
        layout: { visibility: vis(initialLayers.darkMatter) },
      },
      {
        id: 'graticule-line',
        type: 'line',
        source: 'graticule',
        layout: { visibility: vis(initialLayers.graticule) },
        paint: { 'line-color': 'rgba(15, 23, 42, 0.15)', 'line-width': 1, 'line-dasharray': [4, 4] },
      },
      {
        id: 'area-fill',
        type: 'fill',
        source: 'area',
        paint: { 'fill-color': '#000000', 'fill-opacity': 0.08 },
      },
      {
        id: 'area-line',
        type: 'line',
        source: 'area',
        paint: { 'line-color': '#000000', 'line-width': 2.5, 'line-dasharray': [6, 6] },
      },
      {
        id: 'area-label',
        type: 'symbol',
        source: 'area',
        filter: ['has', 'name'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 14,
          'text-offset': [0, -1.4],
          'text-anchor': 'center',
          'text-font': ['Open Sans Bold'],
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': 'rgba(255, 255, 255, 0.95)',
          'text-halo-width': 3,
        },
      },
      {
        id: 'savedareas-fill',
        type: 'fill',
        source: 'savedareas',
        paint: { 'fill-color': '#16a34a', 'fill-opacity': 0.2 },
      },
      {
        id: 'savedareas-line',
        type: 'line',
        source: 'savedareas',
        paint: { 'line-color': '#16a34a', 'line-width': 2.5, 'line-dasharray': [6, 6] },
      },
      {
        id: 'savedareas-label',
        type: 'symbol',
        source: 'savedareas',
        filter: ['has', 'name'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 13,
          'text-offset': [0, -1.2],
          'text-anchor': 'center',
          'text-font': ['Open Sans Bold'],
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 3,
        },
      },
      {
        id: 'draw-fill',
        type: 'fill',
        source: 'draw',
        paint: { 'fill-color': '#16a34a', 'fill-opacity': 0.2 },
      },
      {
        id: 'draw-line',
        type: 'line',
        source: 'draw',
        paint: { 'line-color': '#16a34a', 'line-width': 2.5, 'line-dasharray': [6, 6] },
      },
      {
        id: 'draw-label',
        type: 'symbol',
        source: 'draw',
        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['has', 'name']],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 13,
          'text-offset': [0, -1.2],
          'text-anchor': 'center',
          'text-font': ['Open Sans Bold'],
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 3,
        },
      },
      {
        id: 'tracks-points',
        type: 'circle',
        source: 'tracks',
        paint: {
          'circle-color': '#ff8c42',
          'circle-radius': 7,
          'circle-stroke-color': '#0a0b10',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'bikes-points',
        type: 'circle',
        source: 'bikes',
        paint: {
          'circle-color': '#ef4444',
          'circle-radius': 6,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      },
      {
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        paint: { 'line-color': '#ef4444', 'line-width': 3 },
      },
      {
        id: 'routes-start',
        type: 'circle',
        source: 'routes',
        filter: ['==', ['get', 'kind'], 'route-start'],
        paint: {
          'circle-color': '#00ff87',
          'circle-radius': 7,
          'circle-stroke-color': '#0a0b10',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'routes-end',
        type: 'circle',
        source: 'routes',
        filter: ['==', ['get', 'kind'], 'route-end'],
        paint: {
          'circle-color': '#ff4d6d',
          'circle-radius': 7,
          'circle-stroke-color': '#0a0b10',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'routes-label',
        type: 'symbol',
        source: 'routes',
        filter: ['all', ['==', ['get', 'kind'], 'route'], ['has', 'name']],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 13,
          'text-offset': [0, -1.4],
          'text-anchor': 'center',
          'text-font': ['Open Sans Bold'],
        },
        paint: {
          'text-color': '#ef4444',
          'text-halo-color': 'rgba(255, 255, 255, 0.95)',
          'text-halo-width': 3,
        },
      },
      {
        id: 'routepreview-line',
        type: 'line',
        source: 'routepreview',
        paint: { 'line-color': '#ef4444', 'line-width': 3 },
      },
      {
        id: 'routepreview-start',
        type: 'circle',
        source: 'routepreview',
        filter: ['==', ['get', 'kind'], 'route-preview-start'],
        paint: {
          'circle-color': '#00ff87',
          'circle-radius': 7,
          'circle-stroke-color': '#0a0b10',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'routepreview-end',
        type: 'circle',
        source: 'routepreview',
        filter: ['==', ['get', 'kind'], 'route-preview-end'],
        paint: {
          'circle-color': '#ff4d6d',
          'circle-radius': 7,
          'circle-stroke-color': '#0a0b10',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'routepreview-label',
        type: 'symbol',
        source: 'routepreview',
        filter: ['has', 'name'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 13,
          'text-offset': [0, -1.4],
          'text-anchor': 'center',
          'text-font': ['Open Sans Bold'],
        },
        paint: {
          'text-color': '#ef4444',
          'text-halo-color': 'rgba(255, 255, 255, 0.95)',
          'text-halo-width': 3,
        },
      },
    ],
  };
};

// Area Geofence Coordinates
const areaPolygons = {
  london: [
    [-0.16, 51.52],
    [-0.08, 51.52],
    [-0.08, 51.48],
    [-0.16, 51.48],
    [-0.16, 51.52],
  ],
  paris: [
    [2.27, 48.87],
    [2.34, 48.87],
    [2.34, 48.83],
    [2.27, 48.83],
    [2.27, 48.87],
  ],
  tokyo: [
    [139.72, 35.7],
    [139.79, 35.7],
    [139.79, 35.66],
    [139.72, 35.66],
    [139.72, 35.7],
  ],
  delhi: [
    [77.1, 28.7],
    [77.25, 28.7],
    [77.25, 28.55],
    [77.1, 28.55],
    [77.1, 28.7],
  ],
  mumbai: [
    [72.8, 19.15],
    [72.95, 19.15],
    [72.95, 18.9],
    [72.8, 18.9],
    [72.8, 19.15],
  ],
  bengaluru: [
    [77.5, 13.05],
    [77.68, 13.05],
    [77.68, 12.85],
    [77.5, 12.85],
    [77.5, 13.05],
  ],
  hyderabad: [
    [78.35, 17.55],
    [78.55, 17.55],
    [78.55, 17.3],
    [78.35, 17.3],
    [78.35, 17.55],
  ],
  chennai: [
    [80.18, 13.15],
    [80.35, 13.15],
    [80.35, 12.9],
    [80.18, 12.9],
    [80.18, 13.15],
  ],
  kolkata: [
    [88.25, 22.7],
    [88.45, 22.7],
    [88.45, 22.45],
    [88.25, 22.45],
    [88.25, 22.7],
  ],
};

// Display names used for the area label on the map and toasts
const AREA_NAMES = {
  london: 'London Central',
  paris: 'Paris Tourist Zone',
  tokyo: 'Tokyo Center',
  delhi: 'Delhi Central',
  mumbai: 'Mumbai Marine Drive',
  bengaluru: 'Bengaluru Tech Park',
  hyderabad: 'Hyderabad City Center',
  chennai: 'Chennai Marina Zone',
  kolkata: 'Kolkata City Core',
};

export default function MapComponent({
  layers = { osm: false, darkMatter: true, markers: true, graticule: false },
  activeTool,
  setActiveTool,
  markersList,
  setMarkersList,
  setClickedCoords,
  setAddress,
  setMapStats,
  setMeasurementInfo,
  setMouseCoords,
  triggerReset,
  triggerLocate,
  zoomTarget,
  searchQuery,
  clearDrawingsTrigger,
  triggerZoomIn,
  triggerZoomOut,
  triggerZoomParticular,
  filteredBikes = [],
  selectedFilterArea = 'none',
  onAreaDrawn,
  areaResetTrigger,
  savedAreas = [],
  fitAreaCoords,
  fitAreaTrigger,
  onPolygonDblClick,
  tracks = [],
  mapPickTarget,
  onMapPickCoords,
  onTrackDblClick,
  routes = [],
  routesVisible = true,
  fitRouteCoords,
  fitRouteTrigger,
  routePreview,
  areaName = '',
  areaStyle = {
    fillColor: '#16a34a',
    fillOpacity: 0.2,
    strokeColor: '#16a34a',
    strokeWidth: 2.5,
    dashStyle: 'dashed',
  },
}) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);

  const activeToolRef = useRef(activeTool);
  const markersListRef = useRef(markersList);
  const areaNameRef = useRef(areaName);
  const areaStyleRef = useRef(areaStyle);
  const onPolygonDblClickRef = useRef(onPolygonDblClick);
  const onMapPickCoordsRef = useRef(onMapPickCoords);
  const onTrackDblClickRef = useRef(onTrackDblClick);
  const onAreaDrawnRef = useRef(onAreaDrawn);
  const mapPickTargetRef = useRef(mapPickTarget);

  const drawFeaturesRef = useRef([]);
  const drawVerticesRef = useRef([]);
  const drawingTypeRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const draggingRef = useRef(false);
  const bikePopupRef = useRef(null);

  useEffect(() => {
    markersListRef.current = markersList;
  }, [markersList]);

  useEffect(() => {
    areaNameRef.current = areaName;
    drawFeaturesRef.current = drawFeaturesRef.current.map((f) =>
      f.geometry.type === 'Polygon'
        ? { ...f, properties: { ...f.properties, name: areaName || '' } }
        : f
    );
    if (mapRef.current) syncDrawSource(mapRef.current);
  }, [areaName]);

  useEffect(() => {
    areaStyleRef.current = areaStyle;
    applyAreaStyle(mapRef.current, areaStyle);
  }, [areaStyle]);

  useEffect(() => {
    onPolygonDblClickRef.current = onPolygonDblClick;
  }, [onPolygonDblClick]);
  useEffect(() => {
    onMapPickCoordsRef.current = onMapPickCoords;
  }, [onMapPickCoords]);
  useEffect(() => {
    onTrackDblClickRef.current = onTrackDblClick;
  }, [onTrackDblClick]);
  useEffect(() => {
    onAreaDrawnRef.current = onAreaDrawn;
  }, [onAreaDrawn]);
  useEffect(() => {
    mapPickTargetRef.current = mapPickTarget;
  }, [mapPickTarget]);

  // Active tool change: reset any in-progress line/polygon drawing
  useEffect(() => {
    activeToolRef.current = activeTool;
    if (activeTool !== 'LineString' && activeTool !== 'Polygon') {
      drawVerticesRef.current = [];
      drawingTypeRef.current = null;
    }
    if (!activeTool) setMeasurementInfo(null);
  }, [activeTool, setMeasurementInfo]);

  const syncDrawSource = (map) => {
    if (!map) return;
    const features = drawFeaturesRef.current.slice();
    const vertices = drawVerticesRef.current;
    if (drawingTypeRef.current === 'LineString' && vertices.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: vertices.map((c) => [c[0], c[1]]) },
        properties: {},
      });
    } else if (drawingTypeRef.current === 'Polygon' && vertices.length >= 3) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: vertices.map((c) => [c[0], c[1]]) },
        properties: {},
      });
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [closeRing(vertices)] },
        properties: { name: areaNameRef.current || '' },
      });
    }
    updateSource(map, 'draw', features);
  };

  const updateDrawing = () => {
    const map = mapRef.current;
    if (!map) return;
    syncDrawSource(map);
    const type = drawingTypeRef.current;
    const vertices = drawVerticesRef.current;
    if (type === 'LineString' && vertices.length >= 2) {
      setMeasurementInfo({ type: 'linestring', value: formatLength(getLength(vertices)) });
    } else if (type === 'Polygon' && vertices.length >= 3) {
      setMeasurementInfo({ type: 'polygon', value: formatArea(getArea(closeRing(vertices))) });
    }
  };

  const finalizeDrawing = () => {
    const type = drawingTypeRef.current;
    const vertices = drawVerticesRef.current;
    if (!type || vertices.length === 0) return;

    if (type === 'LineString' && vertices.length >= 2) {
      drawFeaturesRef.current.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: vertices.map((c) => [c[0], c[1]]) },
        properties: {},
      });
      setMeasurementInfo({ type: 'linestring', value: formatLength(getLength(vertices)) });
    } else if (type === 'Polygon' && vertices.length >= 3) {
      const ring = closeRing(vertices);
      drawFeaturesRef.current.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: { name: areaNameRef.current || '' },
      });
      setMeasurementInfo({ type: 'polygon', value: formatArea(getArea(ring)) });
      if (onAreaDrawnRef.current) onAreaDrawnRef.current(ring);
    }

    drawVerticesRef.current = [];
    drawingTypeRef.current = null;
    syncDrawSource(mapRef.current);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapElement.current) return;

    const map = new MaplibreMap({
      container: mapElement.current,
      style: buildStyle(layers),
      center: [15, 30],
      zoom: 3,
      doubleClickZoom: false,
    });
    mapRef.current = map;

    const computeMapStats = () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      return {
        zoom: map.getZoom(),
        center: [center.lng, center.lat],
        extent: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      };
    };

    const addPin = (lonLat) => {
      const timestamp = Date.now();
      const newMarker = {
        id: `pin-${timestamp}`,
        coords: lonLat,
        label: `Marker #${markersListRef.current.length + 1}`,
      };
      setMarkersList((prev) => [...prev, newMarker]);
      setClickedCoords(lonLat);
      setAddress('New pin added. Retrieving details...');
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lonLat[1]}&lon=${lonLat[0]}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) setAddress(data.display_name);
        })
        .catch(() => setAddress('Pin placed. Reverse geocoding failed.'));
      setActiveTool(null);
    };

    const addVertex = (lonLat) => {
      const type = activeToolRef.current;
      const vertices = drawVerticesRef.current;
      if (vertices.length === 0 && type === 'Polygon') {
        drawFeaturesRef.current = [];
      }
      vertices.push([lonLat[0], lonLat[1]]);
      drawingTypeRef.current = type;
      setMeasurementInfo({
        type: type === 'Polygon' ? 'polygon' : 'linestring',
        value: 'Calculating...',
      });
      updateDrawing();
    };

    const showBikePopup = (feature) => {
      const p = feature.properties || {};
      const coords = feature.geometry.coordinates;
      const areaName = AREA_NAMES[p.area] || p.area || '—';
      const html = `
        <div style="font-family:'Outfit',sans-serif;min-width:200px;">
          <div style="font-weight:700;font-size:14px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;">
            ${escapeHtml(p.vehicleNo)}
          </div>
          <div style="font-size:12px;color:#0f172a;line-height:1.7;">
            <div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">Bike Name</span><b>${escapeHtml(p.name || '—')}</b></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">Chassis No</span><b>${escapeHtml(p.chassisNo || '—')}</b></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">Registered Area</span><b>${escapeHtml(areaName)}</b></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">Battery</span><b>${escapeHtml(p.battery)}%</b></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">Active Date</span><b>${escapeHtml(p.date || '—')}</b></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">Active Hour</span><b>${escapeHtml(p.hour)}:00</b></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#64748b;">Position</span><b>${Number(p.lat).toFixed(4)}° N, ${Number(p.lon).toFixed(4)}° E</b></div>
          </div>
        </div>`;
      if (bikePopupRef.current) bikePopupRef.current.remove();
      bikePopupRef.current = new Popup({ closeButton: true, offset: 25 })
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map);
    };

    const handleMapClick = (e) => {
      if (draggingRef.current) {
        draggingRef.current = false;
        return;
      }
      const now = Date.now();
      if (now - lastClickTimeRef.current < 350) return;
      lastClickTimeRef.current = now;

      const lonLat = [e.lngLat.lng, e.lngLat.lat];

      if (mapPickTargetRef.current) {
        if (onMapPickCoordsRef.current) {
          onMapPickCoordsRef.current(lonLat, mapPickTargetRef.current);
        }
        return;
      }

      const tool = activeToolRef.current;
      if (tool === 'Point') {
        addPin(lonLat);
        return;
      }
      if (tool === 'LineString' || tool === 'Polygon') {
        addVertex(lonLat);
        return;
      }

      setClickedCoords(lonLat);
      setAddress('Fetching reverse geocoding data...');
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lonLat[1]}&lon=${lonLat[0]}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress('Address details not found.');
          }
        })
        .catch((err) => {
          console.error(err);
          setAddress('Unable to resolve address. Network or CORS limit.');
        });
    };

    const handleMapDblClick = (e) => {
      const tool = activeToolRef.current;
      if (tool === 'LineString' || tool === 'Polygon') {
        finalizeDrawing();
        return;
      }

      const bikeFeatures = map.queryRenderedFeatures(e.point, { layers: ['bikes-points'] });
      const bikeFeature = bikeFeatures.find(
        (f) => f.properties && typeof f.properties.vehicleNo === 'string'
      );
      if (bikeFeature) {
        showBikePopup(bikeFeature);
        return;
      }

      const trackFeatures = map.queryRenderedFeatures(e.point, { layers: ['tracks-points'] });
      const trackFeature = trackFeatures.find(
        (f) => f.properties && typeof f.properties.id === 'string' && f.properties.id.indexOf('track-') === 0
      );
      if (trackFeature) {
        const trackId = trackFeature.properties.id.replace('track-', '');
        if (onTrackDblClickRef.current) onTrackDblClickRef.current(trackId);
        return;
      }

      const polyFeatures = map.queryRenderedFeatures(e.point, { layers: ['draw-fill', 'savedareas-fill'] });
      if (polyFeatures.length > 0) {
        const feature = polyFeatures[0];
        const props = feature.properties || {};
        let coords = null;
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          coords = feature.geometry.coordinates[0].map((c) => [c[0], c[1]]);
        }
        const savedAreaId =
          typeof props.id === 'string' && props.id.indexOf('saved-area-') === 0
            ? props.id.replace('saved-area-', '')
            : null;
        if (coords && onPolygonDblClickRef.current) {
          onPolygonDblClickRef.current(coords, savedAreaId);
        }
        return;
      }

      map.easeTo({ zoom: Math.min(map.getZoom() + 1, 22), duration: 300 });
    };

    map.on('moveend', () => setMapStats(computeMapStats()));
    map.on('dragstart', () => {
      draggingRef.current = true;
    });
    map.on('dragend', () => {
      draggingRef.current = false;
    });
    map.on('pointermove', (e) => {
      if (e.originalEvent && e.originalEvent.buttons) return;
      setMouseCoords([e.lngLat.lng, e.lngLat.lat]);
    });
    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDblClick);

    map.on('load', () => {
      if (mapRef.current !== map) return;

      loadImage(PIN_URL)
        .then((pinImg) => {
          if (mapRef.current !== map) return;
          map.addImage('marker-icon', pinImg);
          map.addLayer({
            id: 'markers-symbol',
            type: 'symbol',
            source: 'markers',
            layout: { 'icon-image': 'marker-icon', 'icon-anchor': 'bottom', 'icon-size': 1 },
          });
          map.setLayoutProperty('markers-symbol', 'visibility', layers.markers ? 'visible' : 'none');
        })
        .catch((err) => console.error('Failed to load map icons', err))
        .finally(() => {
          if (mapRef.current !== map) return;
          applyAreaStyle(map, areaStyleRef.current);
          updateSource(map, 'graticule', buildGraticuleFeatures());
          updateSource(map, 'markers', buildMarkersFeatures(markersList));
          updateSource(map, 'bikes', buildBikesFeatures(filteredBikes));
          updateSource(map, 'savedareas', buildSavedAreasFeatures(savedAreas));
          updateSource(map, 'tracks', buildTracksFeatures(tracks));
          updateSource(map, 'routes', buildRoutesFeatures(routes));
          if (selectedFilterArea !== 'none' && areaPolygons[selectedFilterArea]) {
            updateSource(
              map,
              'area',
              buildAreaFeature(areaPolygons[selectedFilterArea], AREA_NAMES[selectedFilterArea] || selectedFilterArea)
            );
          }
          syncDrawSource(map);
          setMapStats(computeMapStats());
        });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Layers Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const setVis = (layer, visible) => {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', visible ? 'visible' : 'none');
    };
    setVis('osm-raster', layers.osm);
    setVis('dark-raster', layers.darkMatter);
    setVis('graticule-line', layers.graticule);
    setVis('markers-symbol', layers.markers);
  }, [layers]);

  // Synchronize markers on map
  useEffect(() => {
    updateSource(mapRef.current, 'markers', buildMarkersFeatures(markersList));
  }, [markersList]);

  // Synchronize filtered bikes on map
  useEffect(() => {
    updateSource(mapRef.current, 'bikes', buildBikesFeatures(filteredBikes));
  }, [filteredBikes]);

  // Draw route preview line (start -> end) from the route form
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routePreview && routePreview.start && routePreview.end) {
      updateSource(map, 'routepreview', [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [routePreview.start, routePreview.end] },
          properties: { kind: 'route-preview', name: routePreview.name || '' },
        },
        buildPointFeature('route-preview-start', routePreview.start, { kind: 'route-preview-start' }),
        buildPointFeature('route-preview-end', routePreview.end, { kind: 'route-preview-end' }),
      ]);
    } else {
      updateSource(map, 'routepreview', []);
    }
  }, [routePreview]);

  // Draw selected filter area geofence polygon and pan to it
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedFilterArea === 'none' || !areaPolygons[selectedFilterArea]) {
      updateSource(map, 'area', []);
      return;
    }
    const coords = areaPolygons[selectedFilterArea];
    updateSource(map, 'area', buildAreaFeature(coords, AREA_NAMES[selectedFilterArea] || selectedFilterArea));
    const bounds = new LngLatBounds(coords[0], coords[0]);
    coords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 80, duration: 1500 });
  }, [selectedFilterArea]);

  // Reset the currently drawn area polygon
  useEffect(() => {
    if (areaResetTrigger === 0) return;
    drawFeaturesRef.current = [];
    drawVerticesRef.current = [];
    drawingTypeRef.current = null;
    updateSource(mapRef.current, 'draw', []);
    setMeasurementInfo(null);
  }, [areaResetTrigger, setMeasurementInfo]);

  // Render saved areas loaded from the database on the map
  useEffect(() => {
    updateSource(mapRef.current, 'savedareas', buildSavedAreasFeatures(savedAreas));
  }, [savedAreas]);

  // Zoom/fit the view to a selected saved area polygon
  useEffect(() => {
    if (fitAreaTrigger === 0 || !fitAreaCoords || !mapRef.current) return;
    const map = mapRef.current;
    const bounds = new LngLatBounds(fitAreaCoords[0], fitAreaCoords[0]);
    fitAreaCoords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 80, duration: 1500 });
  }, [fitAreaTrigger, fitAreaCoords]);

  // Render manual tracks on the map
  useEffect(() => {
    updateSource(mapRef.current, 'tracks', buildTracksFeatures(tracks));
  }, [tracks]);

  // Render routes (line + start/end points) on the map
  useEffect(() => {
    updateSource(mapRef.current, 'routes', buildRoutesFeatures(routes));
  }, [routes]);

  // Toggle route layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const setVis = (layer, visible) => {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', visible ? 'visible' : 'none');
    };
    setVis('routes-line', routesVisible);
    setVis('routes-start', routesVisible);
    setVis('routes-end', routesVisible);
  }, [routesVisible]);

  // Zoom/fit the view to a selected route (start -> end)
  useEffect(() => {
    if (fitRouteTrigger === 0 || !fitRouteCoords || fitRouteCoords.length < 2 || !mapRef.current) return;
    const map = mapRef.current;
    const bounds = new LngLatBounds(fitRouteCoords[0], fitRouteCoords[0]);
    fitRouteCoords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 80, duration: 1500 });
  }, [fitRouteTrigger, fitRouteCoords]);

  // Handle zoom targets
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !zoomTarget) return;
    map.easeTo({ center: zoomTarget, zoom: 14, duration: 1500 });
  }, [zoomTarget]);

  // Handle search queries via OSM Nominatim API
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !searchQuery) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const result = data[0];
          const lon = parseFloat(result.lon);
          const lat = parseFloat(result.lat);
          map.easeTo({ center: [lon, lat], zoom: 12, duration: 1500 });

          const searchMarker = {
            id: `search-${Date.now()}`,
            coords: [lon, lat],
            label: result.name || searchQuery,
          };
          setMarkersList((prev) => [...prev, searchMarker]);
          setClickedCoords([lon, lat]);
          setAddress(result.display_name);
        } else {
          alert(`Location "${searchQuery}" not found.`);
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Geocoding error. Check network or search queries.');
      });
  }, [searchQuery, setMarkersList, setClickedCoords, setAddress]);

  // Handle global view reset
  useEffect(() => {
    const map = mapRef.current;
    if (triggerReset === 0 || !map) return;
    map.easeTo({ center: [15, 30], zoom: 3, duration: 1500 });
  }, [triggerReset]);

  // Handle geolocation locate-me
  useEffect(() => {
    const map = mapRef.current;
    if (triggerLocate === 0 || !map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.longitude, position.coords.latitude];
          map.easeTo({ center: coords, zoom: 14, duration: 1800 });

          const geoMarker = {
            id: `geo-${Date.now()}`,
            coords: coords,
            label: 'My Position',
          };
          setMarkersList((prev) => [...prev, geoMarker]);
          setClickedCoords(coords);
          setAddress('Located your machine position.');
        },
        (error) => {
          console.error(error);
          alert('Could not determine current location. Defaulting to Paris.');
          const Paris = [2.3522, 48.8566];
          map.easeTo({ center: Paris, zoom: 12, duration: 1500 });
        }
      );
    } else {
      alert('Your browser does not support geolocation.');
    }
  }, [triggerLocate, setMarkersList, setClickedCoords, setAddress]);

  // Handle cleared map vectors
  useEffect(() => {
    if (clearDrawingsTrigger === 0) return;
    drawFeaturesRef.current = [];
    drawVerticesRef.current = [];
    drawingTypeRef.current = null;
    updateSource(mapRef.current, 'draw', []);
    updateSource(mapRef.current, 'markers', []);
    updateSource(mapRef.current, 'area', []);
    setMarkersList([]);
    setClickedCoords(null);
    setAddress('');
    setMeasurementInfo(null);
  }, [clearDrawingsTrigger, setMarkersList, setClickedCoords, setAddress, setMeasurementInfo]);

  // Handle zoom in
  useEffect(() => {
    const map = mapRef.current;
    if (triggerZoomIn === 0 || !map) return;
    map.easeTo({ zoom: Math.min(map.getZoom() + 1, 22), duration: 300 });
  }, [triggerZoomIn]);

  // Handle zoom out
  useEffect(() => {
    const map = mapRef.current;
    if (triggerZoomOut === 0 || !map) return;
    map.easeTo({ zoom: Math.max(map.getZoom() - 1, 0), duration: 300 });
  }, [triggerZoomOut]);

  // Handle zoom particular (Mt. Everest)
  useEffect(() => {
    const map = mapRef.current;
    if (triggerZoomParticular === 0 || !map) return;
    const Everest = [86.925, 27.9881];
    map.easeTo({ center: Everest, zoom: 14, duration: 1500 });

    const targetMarker = {
      id: `everest-${Date.now()}`,
      coords: Everest,
      label: 'Mount Everest Target',
    };
    setMarkersList((prev) => {
      if (prev.some((m) => m.id.startsWith('everest'))) return prev;
      return [...prev, targetMarker];
    });
    setClickedCoords(Everest);
    setAddress('Mount Everest peak, Himalayas, Nepal/Tibet');
  }, [triggerZoomParticular, setMarkersList, setClickedCoords, setAddress]);

  return <div ref={mapElement} className="map-container" />;
}
