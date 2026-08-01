import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';
import Footer from './Footer';
import MapComponent from './MapComponent';
import { getArea } from '../utils/geo';

const initialBikes = [
  { id: 'b1', vehicleNo: 'BIKE-LON-101', name: 'Thunder Bolt', chassisNo: 'CH-1001', coords: [-0.125, 51.508], area: 'london', hour: 9, battery: 85, date: '2026-07-25' },
  { id: 'b2', vehicleNo: 'BIKE-LON-102', name: 'City Cruiser', chassisNo: 'CH-1002', coords: [-0.115, 51.502], area: 'london', hour: 11, battery: 42, date: '2026-07-24' },
  { id: 'b3', vehicleNo: 'BIKE-LON-103', name: 'EcoRider', chassisNo: 'CH-1003', coords: [-0.135, 51.515], area: 'london', hour: 14, battery: 92, date: '2026-07-26' },
  { id: 'b4', vehicleNo: 'BIKE-LON-104', name: 'Volt Sprint', chassisNo: 'CH-1004', coords: [-0.105, 51.495], area: 'london', hour: 17, battery: 15, date: '2026-07-23' },
  { id: 'b5', vehicleNo: 'BIKE-LON-105', name: 'Urban Glide', chassisNo: 'CH-1005', coords: [-0.145, 51.505], area: 'london', hour: 20, battery: 60, date: '2026-07-27' },
  { id: 'b6', vehicleNo: 'BIKE-PAR-201', name: 'Aero Petite', chassisNo: 'CH-2001', coords: [2.294, 48.858], area: 'paris', hour: 8, battery: 77, date: '2026-07-28' },
  { id: 'b7', vehicleNo: 'BIKE-PAR-202', name: 'Tour de Luxe', chassisNo: 'CH-2002', coords: [2.312, 48.852], area: 'paris', hour: 10, battery: 34, date: '2026-07-25' },
  { id: 'b8', vehicleNo: 'BIKE-PAR-203', name: 'Seine Rider', chassisNo: 'CH-2003', coords: [2.285, 48.864], area: 'paris', hour: 13, battery: 89, date: '2026-07-26' },
  { id: 'b9', vehicleNo: 'BIKE-PAR-204', name: 'Velib Pro', chassisNo: 'CH-2004', coords: [2.305, 48.845], area: 'paris', hour: 16, battery: 55, date: '2026-07-29' },
  { id: 'b10', vehicleNo: 'BIKE-PAR-205', name: 'Metro Line', chassisNo: 'CH-2005', coords: [2.321, 48.861], area: 'paris', hour: 19, battery: 21, date: '2026-07-22' },
  { id: 'b11', vehicleNo: 'BIKE-TYO-301', name: 'Sakura Drive', chassisNo: 'CH-3001', coords: [139.752, 35.685], area: 'tokyo', hour: 9, battery: 90, date: '2026-07-27' },
  { id: 'b12', vehicleNo: 'BIKE-TYO-302', name: 'Neo Toky', chassisNo: 'CH-3002', coords: [139.742, 35.672], area: 'tokyo', hour: 12, battery: 49, date: '2026-07-26' },
  { id: 'b13', vehicleNo: 'BIKE-TYO-303', name: 'Kabuki Racer', chassisNo: 'CH-3003', coords: [139.761, 35.694], area: 'tokyo', hour: 15, battery: 83, date: '2026-07-25' },
  { id: 'b14', vehicleNo: 'BIKE-TYO-304', name: 'Zen Volt', chassisNo: 'CH-3004', coords: [139.735, 35.661], area: 'tokyo', hour: 18, battery: 68, date: '2026-07-24' },
  { id: 'b15', vehicleNo: 'BIKE-TYO-305', name: 'Shinkansen', chassisNo: 'CH-3005', coords: [139.77, 35.68], area: 'tokyo', hour: 21, battery: 12, date: '2026-07-30' },
];

function computeAreaInfo(coords) {
  try {
    const areaM2 = getArea(coords);
    return {
      areaValue: areaM2 > 1000000 ? Number((areaM2 / 1000000).toFixed(4)) : Number(areaM2.toFixed(1)),
      areaUnit: areaM2 > 1000000 ? 'km²' : 'm²',
      display: areaM2 > 1000000 ? `${(areaM2 / 1000000).toFixed(2)} km²` : `${areaM2.toFixed(1)} m²`,
    };
  } catch (err) {
    return { areaValue: null, areaUnit: '', display: 'N/A' };
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [crosshairVisible, setCrosshairVisible] = useState(true);
  const [leftPanelEnabled, setLeftPanelEnabled] = useState(false);
  const [rightPanelPage, setRightPanelPage] = useState('analytics');
  const [filteredBikes, setFilteredBikes] = useState(initialBikes);
  const [selectedFilterArea, setSelectedFilterArea] = useState('none');
  const [layers, setLayers] = useState({
    osm: false,
    darkMatter: true,
    markers: true,
    graticule: false,
  });
  const [activeTool, setActiveTool] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [markersList, setMarkersList] = useState([
    { id: 'pin-london', coords: [-0.1195, 51.5033], label: 'London Eye Landmark' },
    { id: 'pin-eiffel', coords: [2.2945, 48.8584], label: 'Eiffel Tower Paris' },
    { id: 'pin-tokyo', coords: [139.7528, 35.6852], label: 'Imperial Palace Tokyo' },
  ]);
  const [mapStats, setMapStats] = useState({
    zoom: 3,
    center: [15, 30],
    extent: [0, 0, 0, 0],
  });
  const [measurementInfo, setMeasurementInfo] = useState(null);
  const [mouseCoords, setMouseCoords] = useState(null);
  const [triggerReset, setTriggerReset] = useState(0);
  const [triggerLocate, setTriggerLocate] = useState(0);
  const [clearDrawingsTrigger, setClearDrawingsTrigger] = useState(0);
  const [zoomTarget, setZoomTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerZoomIn, setTriggerZoomIn] = useState(0);
  const [triggerZoomOut, setTriggerZoomOut] = useState(0);
  const [triggerZoomParticular, setTriggerZoomParticular] = useState(0);
  const [areaCoords, setAreaCoords] = useState(null);
  const [savedAreas, setSavedAreas] = useState([]);
  const [areaResetTrigger, setAreaResetTrigger] = useState(0);
  const [fitAreaCoords, setFitAreaCoords] = useState(null);
  const [fitAreaTrigger, setFitAreaTrigger] = useState(0);
  const [areaName, setAreaName] = useState('');
  const [tracksList, setTracksList] = useState([]);
  const [mapPickTarget, setMapPickTarget] = useState(null);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [trackPrefill, setTrackPrefill] = useState(null);
  const [routesList, setRoutesList] = useState([]);
  const [routesVisible, setRoutesVisible] = useState(true);
  const [routePrefill, setRoutePrefill] = useState(null);
  const [fitRouteCoords, setFitRouteCoords] = useState(null);
  const [fitRouteTrigger, setFitRouteTrigger] = useState(0);
  const [routePreview, setRoutePreview] = useState(null);
  const [areaStyle, setAreaStyle] = useState({
    fillColor: '#16a34a',
    fillOpacity: 0.2,
    strokeColor: '#16a34a',
    strokeWidth: 2.5,
    dashStyle: 'dashed',
  });

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    navigate('/', { replace: true });
  };

  const handleClearDrawings = () => {
    setClearDrawingsTrigger((prev) => prev + 1);
    setSelectedFilterArea('none');
    setFilteredBikes(initialBikes);
  };

  const handleResetView = () => setTriggerReset((prev) => prev + 1);
  const handleLocateMe = () => setTriggerLocate((prev) => prev + 1);

  const handleSearch = (query) => setSearchQuery(query);

  const handleDeleteMarker = (id) => setMarkersList((prev) => prev.filter((m) => m.id !== id));

  const handleZoomToMarker = (coords) => {
    setZoomTarget(coords);
    setClickedCoords(coords);
    setAddress('Selected saved landmark. Zooming camera view.');
  };

  const API_BASE = 'http://localhost:8080/api/areas';

  const handleToggleAreaDraw = () => {
    setActiveTool((prev) => (prev === 'Polygon' ? null : 'Polygon'));
  };

  const handleAreaDrawn = (coords) => setAreaCoords(coords);

  const handleAreaReset = () => {
    setAreaResetTrigger((prev) => prev + 1);
    setAreaCoords(null);
    setMeasurementInfo(null);
    setAreaName('');
  };

  const handleSaveAreaToDB = async (name) => {
    if (!name || !name.trim()) return 'Area name is required.';
    const currentName = name.trim();
    if (!areaCoords || areaCoords.length < 3) return 'No polygon drawn yet. Draw an area first.';

    const areaInfo = computeAreaInfo(areaCoords);
    const payload = {
      name: currentName,
      coordinates: JSON.stringify(areaCoords),
      coordinateLabels: currentName,
      areaValue: areaInfo.areaValue,
      areaUnit: areaInfo.areaUnit,
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const saved = await res.json();
      setSavedAreas((prev) => [...prev, saved]);
      return `Area "${currentName}" saved to database.`;
    } catch (err) {
      console.error(err);
      return `Save failed: ${err.message}`;
    }
  };

  const handleSaveAreaLocal = async (name) => {
    if (!name || !name.trim()) return 'Area name is required.';
    const currentName = name.trim();
    if (!areaCoords || areaCoords.length < 3) return 'No polygon drawn yet. Draw an area first.';

    const areaInfo = computeAreaInfo(areaCoords);
    const data = {
      type: 'geo-nexus-area',
      name: currentName,
      coordinates: areaCoords,
      areaValue: areaInfo.areaValue,
      areaUnit: areaInfo.areaUnit,
      savedAt: new Date().toISOString(),
    };
    const content = JSON.stringify(data, null, 2);
    const suggestedFile = `${currentName.replace(/\s+/g, '-').toLowerCase()}.json`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: suggestedFile,
          types: [
            { description: 'GeoNexus Area File', accept: { 'application/json': ['.json'] } },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return `Area "${currentName}" saved to "${handle.name}".`;
      } catch (err) {
        if (err.name === 'AbortError') return 'Save cancelled.';
        console.error(err);
        return `Save failed: ${err.message}`;
      }
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFile;
    a.click();
    URL.revokeObjectURL(url);
    return `Area "${currentName}" downloaded as "${suggestedFile}".`;
  };

  const parseAreaFile = (text, fileName) => {
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { error: 'Invalid JSON file.' };
    }
    const coords = Array.isArray(data.coordinates) ? data.coordinates : null;
    if (!coords || coords.length < 3) {
      return { error: 'File does not contain a valid polygon.' };
    }
    return { data, coords };
  };

  const applyLoadedArea = (result, fileName) => {
    const name = result.data.name && result.data.name.trim()
      ? result.data.name.trim()
      : `Imported ${fileName}`;
    setAreaName(name);
    setAreaCoords(result.coords);
    setMeasurementInfo({ type: 'polygon', value: computeAreaInfo(result.coords).display });
    setFitAreaCoords(result.coords);
    setFitAreaTrigger((prev) => prev + 1);
  };

  const handleLoadAreaFromLocal = async () => {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [
            { description: 'GeoNexus Area File', accept: { 'application/json': ['.json'] } },
          ],
          multiple: false,
        });
        const file = await handle.getFile();
        const text = await file.text();
        const result = parseAreaFile(text, file.name);
        if (result.error) return `Load failed: ${result.error}`;
        applyLoadedArea(result, file.name);
        return `Loaded area "${result.data.name || file.name}" from local file.`;
      } catch (err) {
        if (err.name === 'AbortError') return 'Load cancelled.';
        console.error(err);
        return `Load failed: ${err.message}`;
      }
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) {
          resolve('Load cancelled.');
          return;
        }
        const text = await file.text();
        const result = parseAreaFile(text, file.name);
        if (result.error) {
          resolve(`Load failed: ${result.error}`);
          return;
        }
        applyLoadedArea(result, file.name);
        resolve(`Loaded area "${result.data.name || file.name}" from local file.`);
      };
      input.oncancel = () => resolve('Load cancelled.');
      input.click();
    });
  };

  const handleLoadAreasFromDB = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const areas = await res.json();
      setSavedAreas(areas);
      return areas.length > 0 ? `Loaded ${areas.length} area(s) from database.` : 'No saved areas found in database.';
    } catch (err) {
      console.error(err);
      return `Load failed: ${err.message}`;
    }
  };

  const handleDeleteAreaFromDB = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.status === 404) return 'Area not found on server.';
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setSavedAreas((prev) => prev.filter((a) => a.id !== id));
      return 'Area deleted from database.';
    } catch (err) {
      console.error(err);
      return `Delete failed: ${err.message}`;
    }
  };

  const handleZoomToSavedArea = (area) => {
    let coords;
    try {
      coords = typeof area.coordinates === 'string' ? JSON.parse(area.coordinates) : area.coordinates;
    } catch (err) {
      return;
    }
    if (!coords || coords.length < 3) return;
    setFitAreaCoords(coords);
    setFitAreaTrigger((prev) => prev + 1);
  };

  const handleSelectSavedArea = (area) => {
    let coords;
    try {
      coords = typeof area.coordinates === 'string' ? JSON.parse(area.coordinates) : area.coordinates;
    } catch (err) {
      return;
    }
    if (!coords || coords.length < 3) return;
    setAreaCoords(coords);
    setMeasurementInfo({ type: 'polygon', value: computeAreaInfo(coords).display });
    setFitAreaCoords(coords);
    setFitAreaTrigger((prev) => prev + 1);
  };

  const handlePolygonDblClick = (coords, savedAreaId) => {
    if (!coords || coords.length < 3) return;
    setAreaCoords(coords);
    const area = savedAreas.find((a) => String(a.id) === String(savedAreaId));
    setAreaName(area && area.name ? area.name : '');
    setMeasurementInfo({ type: 'polygon', value: computeAreaInfo(coords).display });
    setFitAreaCoords(coords);
    setFitAreaTrigger((prev) => prev + 1);
    setRightPanelPage('area');
    setRightPanelOpen(true);
  };

  const TRACKS_API = 'http://localhost:8080/api/tracks';

  const handleLoadTracksFromDB = async () => {
    try {
      const res = await fetch(TRACKS_API);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const tracks = await res.json();
      setTracksList(tracks);
      return tracks.length > 0 ? `Loaded ${tracks.length} track(s) from database.` : 'No tracks found in database.';
    } catch (err) {
      console.error(err);
      return `Load failed: ${err.message}`;
    }
  };

  const handleSaveTrackToDB = async (payload) => {
    try {
      const res = await fetch(TRACKS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const saved = await res.json();
      setTracksList((prev) => [...prev, saved]);
      return `Track "${saved.name}" saved to database.`;
    } catch (err) {
      console.error(err);
      return `Save failed: ${err.message}`;
    }
  };

  const handleDeleteTrackFromDB = async (id) => {
    try {
      const res = await fetch(`${TRACKS_API}/${id}`, { method: 'DELETE' });
      if (res.status === 404) return 'Track not found on server.';
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setTracksList((prev) => prev.filter((t) => t.id !== id));
      return 'Track deleted from database and map.';
    } catch (err) {
      console.error(err);
      return `Delete failed: ${err.message}`;
    }
  };

  useEffect(() => {
    handleLoadTracksFromDB();
    handleLoadRoutesFromDB();
  }, []);

  const handleMapPickCoords = (coords, target) => {
    setPickedCoords({ id: Date.now(), target, coords });
    setMapPickTarget(null);
  };

  const handleTrackDblClick = (trackId) => {
    const track = tracksList.find((t) => String(t.id) === String(trackId));
    if (!track) return;
    setTrackPrefill({ at: Date.now(), track });
    setRightPanelPage('manualtrack');
    setRightPanelOpen(true);
  };

  const ROUTES_API = 'http://localhost:8080/api/routes';

  const handleLoadRoutesFromDB = async () => {
    try {
      const res = await fetch(ROUTES_API);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const routes = await res.json();
      setRoutesList(routes);
      return routes.length > 0 ? `Loaded ${routes.length} route(s) from database.` : 'No routes found in database.';
    } catch (err) {
      console.error(err);
      return `Load failed: ${err.message}`;
    }
  };

  const handleSaveRouteToDB = async (payload) => {
    try {
      const res = await fetch(ROUTES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const saved = await res.json();
      setRoutesList((prev) => [...prev, saved]);
      return `Route "${saved.name}" saved to database.`;
    } catch (err) {
      console.error(err);
      return `Save failed: ${err.message}`;
    }
  };

  const handleDeleteRouteFromDB = async (id) => {
    try {
      const res = await fetch(`${ROUTES_API}/${id}`, { method: 'DELETE' });
      if (res.status === 404) return 'Route not found on server.';
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setRoutesList((prev) => prev.filter((r) => r.id !== id));
      return 'Route deleted from database and map.';
    } catch (err) {
      console.error(err);
      return `Delete failed: ${err.message}`;
    }
  };

  const handleSaveRouteLocal = async (routeData) => {
    const content = JSON.stringify(
      { type: 'geo-nexus-route', ...routeData, savedAt: new Date().toISOString() },
      null,
      2
    );
    const suggestedFile = `${(routeData.name || 'route').replace(/\s+/g, '-').toLowerCase()}.json`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: suggestedFile,
          types: [{ description: 'GeoNexus Route File', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return `Route "${routeData.name}" saved to "${handle.name}".`;
      } catch (err) {
        if (err.name === 'AbortError') return 'Save cancelled.';
        console.error(err);
        return `Save failed: ${err.message}`;
      }
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFile;
    a.click();
    URL.revokeObjectURL(url);
    return `Route "${routeData.name}" downloaded as "${suggestedFile}".`;
  };

  const parseRouteFile = (text, fileName) => {
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { error: 'Invalid JSON file.' };
    }
    const startLat = parseFloat(data.startLatitude);
    const startLon = parseFloat(data.startLongitude);
    const endLat = parseFloat(data.endLatitude);
    const endLon = parseFloat(data.endLongitude);
    if (
      Number.isNaN(startLat) ||
      Number.isNaN(startLon) ||
      Number.isNaN(endLat) ||
      Number.isNaN(endLon)
    ) {
      return { error: 'File does not contain valid route start/end coordinates.' };
    }
    return {
      route: {
        name: data.name || fileName,
        startLatitude: startLat,
        startLongitude: startLon,
        endLatitude: endLat,
        endLongitude: endLon,
        validity: data.validity || '',
      },
    };
  };

  const handleLoadRouteFromLocal = async () => {
    const applyLoadedRoute = (route) => setRoutePrefill({ at: Date.now(), route });

    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'GeoNexus Route File', accept: { 'application/json': ['.json'] } }],
          multiple: false,
        });
        const file = await handle.getFile();
        const text = await file.text();
        const result = parseRouteFile(text, file.name);
        if (result.error) return `Load failed: ${result.error}`;
        applyLoadedRoute(result.route);
        return `Loaded route "${result.route.name}" from local file.`;
      } catch (err) {
        if (err.name === 'AbortError') return 'Load cancelled.';
        console.error(err);
        return `Load failed: ${err.message}`;
      }
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) {
          resolve('Load cancelled.');
          return;
        }
        const text = await file.text();
        const result = parseRouteFile(text, file.name);
        if (result.error) {
          resolve(`Load failed: ${result.error}`);
          return;
        }
        applyLoadedRoute(result.route);
        resolve(`Loaded route "${result.route.name}" from local file.`);
      };
      input.oncancel = () => resolve('Load cancelled.');
      input.click();
    });
  };

  const handleSelectSavedRoute = (route) => {
    setFitRouteCoords([
      [route.startLongitude, route.startLatitude],
      [route.endLongitude, route.endLatitude],
    ]);
    setFitRouteTrigger((prev) => prev + 1);
  };

  const handleRoutePreviewChange = useCallback((preview) => setRoutePreview(preview), []);

  return (
    <div className="app-container">
      <Header
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        onSearch={handleSearch}
        leftPanelEnabled={leftPanelEnabled}
        setLeftPanelEnabled={setLeftPanelEnabled}
        rightPanelPage={rightPanelPage}
        setRightPanelPage={setRightPanelPage}
        onLogout={handleLogout}
      />

      <div className="dashboard-main">
        <SidebarLeft
          layers={layers}
          setLayers={setLayers}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onClearDrawings={handleClearDrawings}
          onResetView={handleResetView}
          onLocateMe={handleLocateMe}
          collapsed={!leftPanelOpen}
          disabled={!leftPanelEnabled}
        />

        <main className="map-panel">
          <MapComponent
            layers={layers}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            markersList={markersList}
            setMarkersList={setMarkersList}
            setClickedCoords={setClickedCoords}
            setAddress={setAddress}
            setMapStats={setMapStats}
            setMeasurementInfo={setMeasurementInfo}
            setMouseCoords={setMouseCoords}
            triggerReset={triggerReset}
            triggerLocate={triggerLocate}
            zoomTarget={zoomTarget}
            searchQuery={searchQuery}
            clearDrawingsTrigger={clearDrawingsTrigger}
            triggerZoomIn={triggerZoomIn}
            triggerZoomOut={triggerZoomOut}
            triggerZoomParticular={triggerZoomParticular}
            filteredBikes={filteredBikes}
            selectedFilterArea={selectedFilterArea}
            onAreaDrawn={handleAreaDrawn}
            areaResetTrigger={areaResetTrigger}
            savedAreas={savedAreas}
            fitAreaCoords={fitAreaCoords}
            fitAreaTrigger={fitAreaTrigger}
            onPolygonDblClick={handlePolygonDblClick}
            tracks={tracksList}
            mapPickTarget={mapPickTarget}
            onMapPickCoords={handleMapPickCoords}
            onTrackDblClick={handleTrackDblClick}
            routes={routesList}
            routesVisible={routesVisible}
            fitRouteCoords={fitRouteCoords}
            fitRouteTrigger={fitRouteTrigger}
            routePreview={routePreview}
            areaName={areaName}
            areaStyle={areaStyle}
          />

          <div className={`map-crosshair ${crosshairVisible ? '' : 'hidden'}`} />
        </main>

        <SidebarRight
          clickedCoords={clickedCoords}
          address={address}
          markersList={markersList}
          mapStats={mapStats}
          measurementInfo={measurementInfo}
          onDeleteMarker={handleDeleteMarker}
          onZoomToMarker={handleZoomToMarker}
          collapsed={!rightPanelOpen}
          activePage={rightPanelPage}
          bikesList={initialBikes}
          filteredBikes={filteredBikes}
          setFilteredBikes={setFilteredBikes}
          selectedFilterArea={selectedFilterArea}
          setSelectedFilterArea={setSelectedFilterArea}
          activeTool={activeTool}
          areaCoords={areaCoords}
          savedAreas={savedAreas}
          onToggleAreaDraw={handleToggleAreaDraw}
          onAreaReset={handleAreaReset}
          onSaveAreaToDB={handleSaveAreaToDB}
          onSaveAreaLocal={handleSaveAreaLocal}
          onLoadAreasFromDB={handleLoadAreasFromDB}
          onDeleteAreaFromDB={handleDeleteAreaFromDB}
          onZoomToSavedArea={handleZoomToSavedArea}
          areaName={areaName}
          setAreaName={setAreaName}
          onSelectSavedArea={handleSelectSavedArea}
          onLoadAreaFromLocal={handleLoadAreaFromLocal}
          tracksList={tracksList}
          onSaveTrackToDB={handleSaveTrackToDB}
          onDeleteTrackFromDB={handleDeleteTrackFromDB}
          onLoadTracksFromDB={handleLoadTracksFromDB}
          mapPickTarget={mapPickTarget}
          setMapPickTarget={setMapPickTarget}
          pickedCoords={pickedCoords}
          trackPrefill={trackPrefill}
          routesList={routesList}
          onSaveRouteToDB={handleSaveRouteToDB}
          onDeleteRouteFromDB={handleDeleteRouteFromDB}
          onLoadRoutesFromDB={handleLoadRoutesFromDB}
          onSaveRouteLocal={handleSaveRouteLocal}
          onLoadRouteFromLocal={handleLoadRouteFromLocal}
          onSelectSavedRoute={handleSelectSavedRoute}
          routePrefill={routePrefill}
          routesVisible={routesVisible}
          setRoutesVisible={setRoutesVisible}
          onRoutePreviewChange={handleRoutePreviewChange}
          areaStyle={areaStyle}
          setAreaStyle={setAreaStyle}
        />
      </div>

      <Footer
        mouseCoords={mouseCoords}
        activeProjection="EPSG:3857 (Web Mercator)"
        crosshairVisible={crosshairVisible}
        setCrosshairVisible={setCrosshairVisible}
        onZoomIn={() => setTriggerZoomIn((prev) => prev + 1)}
        onZoomOut={() => setTriggerZoomOut((prev) => prev + 1)}
        onFitMap={handleResetView}
        onZoomParticular={() => setTriggerZoomParticular((prev) => prev + 1)}
      />
    </div>
  );
}
