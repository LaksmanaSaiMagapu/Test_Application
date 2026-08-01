import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function formatDDM(lon, lat) {
  const ddm = (value, isLat) => {
    const hemi = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    const abs = Math.abs(value);
    const deg = Math.floor(abs);
    const min = (abs - deg) * 60;
    return `${deg}° ${min.toFixed(3)}' ${hemi}`;
  };
  return `${ddm(lat, true)}, ${ddm(lon, false)}`;
}

function vertexCount(coordinates) {
  try {
    const parsed = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.length - 1 : 0;
  } catch (err) {
    return 0;
  }
}

function hexToRgba(hex, opacity) {
  const value = String(hex || '#000000').replace('#', '');
  const r = parseInt(value.substring(0, 2), 16) || 0;
  const g = parseInt(value.substring(2, 4), 16) || 0;
  const b = parseInt(value.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function SidebarRight({
  clickedCoords,
  address,
  markersList,
  mapStats,
  measurementInfo,
  onDeleteMarker,
  onZoomToMarker,
  collapsed,
  activePage = 'analytics',
  bikesList = [],
  filteredBikes = [],
  setFilteredBikes,
  selectedFilterArea = 'none',
  setSelectedFilterArea,
  activeTool,
  areaCoords,
  savedAreas = [],
  onToggleAreaDraw,
  onAreaReset,
  onSaveAreaToDB,
  onSaveAreaLocal,
  onLoadAreasFromDB,
  onDeleteAreaFromDB,
  onZoomToSavedArea,
  areaName,
  setAreaName,
  onSelectSavedArea,
  onLoadAreaFromLocal,
  tracksList = [],
  onSaveTrackToDB,
  onDeleteTrackFromDB,
  onLoadTracksFromDB,
  mapPickTarget,
  setMapPickTarget,
  pickedCoords,
  trackPrefill,
  routesList = [],
  onSaveRouteToDB,
  onDeleteRouteFromDB,
  onLoadRoutesFromDB,
  onSaveRouteLocal,
  onLoadRouteFromLocal,
  onSelectSavedRoute,
  routePrefill,
  routesVisible,
  setRoutesVisible,
  onRoutePreviewChange,
  areaStyle,
  setAreaStyle,
}) {
  // Tabs: 'sai' (Sai Criteria) or 'rajesh' (Rajesh Criteria)
  const [criteriaTab, setCriteriaTab] = useState('sai');
  
  // Sub-tabs under Sai Criteria: 'vehicle', 'area', 'time'
  const [saiSubTab, setSaiSubTab] = useState('vehicle');

  // Sai Criteria Form States
  const [vehicleNo, setVehicleNo] = useState('');
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(24);

  // Rajesh Criteria Form States
  const [minBattery, setMinBattery] = useState(0);
  const [bikeStatus, setBikeStatus] = useState('all');

  // Advanced Filter Form States (Header "Filter" button)
  const [filterBikeNo, setFilterBikeNo] = useState('');
  const [filterBikeName, setFilterBikeName] = useState('');
  const [filterChassisNo, setFilterChassisNo] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Area tab states
  const [areaStatus, setAreaStatus] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  // Manual track form states
  const [trackName, setTrackName] = useState('');
  const [trackNumber, setTrackNumber] = useState('');
  const [trackLat, setTrackLat] = useState('');
  const [trackLon, setTrackLon] = useState('');
  const [trackSpeed, setTrackSpeed] = useState('');
  const [trackCourse, setTrackCourse] = useState('');
  const [trackStatus, setTrackStatus] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState(null);

  // Route form states
  const [routeName, setRouteName] = useState('');
  const [routeStartLat, setRouteStartLat] = useState('');
  const [routeStartLon, setRouteStartLon] = useState('');
  const [routeEndLat, setRouteEndLat] = useState('');
  const [routeEndLon, setRouteEndLon] = useState('');
  const [routeValidity, setRouteValidity] = useState('');
  const [routeStatus, setRouteStatus] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = 'auto') => {
    let finalType = type;
    if (type === 'auto') {
      if (/cancelled|no areas|no tracks|no routes|no saved/i.test(message)) {
        finalType = 'info';
      } else if (/failed|required|must|not found|invalid|error|no polygon|no area|cannot|could not|select/i.test(message)) {
        finalType = 'error';
      } else {
        finalType = 'success';
      }
    }
    setToast({ message, type: finalType, id: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Show a toast whenever an action status message is produced
  useEffect(() => {
    if (areaStatus) showToast(areaStatus);
  }, [areaStatus]);
  useEffect(() => {
    if (trackStatus) showToast(trackStatus);
  }, [trackStatus]);
  useEffect(() => {
    if (routeStatus) showToast(routeStatus);
  }, [routeStatus]);
  useEffect(() => {
    if (filterStatus) showToast(filterStatus);
  }, [filterStatus]);

  // Area styling dialog state
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  const DEFAULT_AREA_STYLE = {
    fillColor: '#16a34a',
    fillOpacity: 0.2,
    strokeColor: '#16a34a',
    strokeWidth: 2.5,
    dashStyle: 'dashed',
  };

  // Clear track selection if the track no longer exists
  useEffect(() => {
    if (selectedTrackId && !tracksList.some((t) => String(t.id) === String(selectedTrackId))) {
      setSelectedTrackId(null);
    }
  }, [tracksList, selectedTrackId]);

  // Clear route selection if the route no longer exists
  useEffect(() => {
    if (selectedRouteId && !routesList.some((r) => String(r.id) === String(selectedRouteId))) {
      setSelectedRouteId(null);
    }
  }, [routesList, selectedRouteId]);

  // Fill track form from map pick
  useEffect(() => {
    if (!pickedCoords) return;
    const { target, coords } = pickedCoords;
    const lat = coords[1];
    const lon = coords[0];
    if (target === 'track') {
      setTrackLat(String(lat));
      setTrackLon(String(lon));
      setTrackStatus(`Position picked: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } else if (target === 'routeStart') {
      setRouteStartLat(String(lat));
      setRouteStartLon(String(lon));
      setRouteStatus(`Start position picked: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } else if (target === 'routeEnd') {
      setRouteEndLat(String(lat));
      setRouteEndLon(String(lon));
      setRouteStatus(`End position picked: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  }, [pickedCoords]);

  // Prefill track form (from map double-click)
  useEffect(() => {
    if (!trackPrefill) return;
    const t = trackPrefill.track;
    setTrackName(t.name || '');
    setTrackNumber(t.number || '');
    setTrackLat(t.latitude != null ? String(t.latitude) : '');
    setTrackLon(t.longitude != null ? String(t.longitude) : '');
    setTrackSpeed(t.speed != null ? String(t.speed) : '');
    setTrackCourse(t.course != null ? String(t.course) : '');
    setSelectedTrackId(t.id);
    setTrackStatus(`Loaded track "${t.name}".`);
  }, [trackPrefill]);

  // Prefill route form (from local file load)
  useEffect(() => {
    if (!routePrefill) return;
    const r = routePrefill.route;
    setRouteName(r.name || '');
    setRouteStartLat(r.startLatitude != null ? String(r.startLatitude) : '');
    setRouteStartLon(r.startLongitude != null ? String(r.startLongitude) : '');
    setRouteEndLat(r.endLatitude != null ? String(r.endLatitude) : '');
    setRouteEndLon(r.endLongitude != null ? String(r.endLongitude) : '');
    setRouteValidity(r.validity || '');
    setRouteStatus(`Loaded route "${r.name}".`);
  }, [routePrefill]);

  // Draw a preview line on the map whenever start & end positions are set in the form
  useEffect(() => {
    const sLat = parseFloat(routeStartLat);
    const sLon = parseFloat(routeStartLon);
    const eLat = parseFloat(routeEndLat);
    const eLon = parseFloat(routeEndLon);
    if ([sLat, sLon, eLat, eLon].every((n) => !Number.isNaN(n))) {
      onRoutePreviewChange({ start: [sLon, sLat], end: [eLon, eLat], name: routeName.trim() });
    } else {
      onRoutePreviewChange(null);
    }
  }, [routeStartLat, routeStartLon, routeEndLat, routeEndLon, routeName, onRoutePreviewChange]);

  // Area tab handlers
  const handleToggleAreaDraw = () => {
    const wasDrawing = activeTool === 'Polygon';
    onToggleAreaDraw();
    if (wasDrawing) {
      setAreaStatus('Polygon drawing finished.');
    } else {
      setAreaStatus('Area drawing mode enabled. Click the map to place vertices.');
    }
  };

  const handleSaveDb = async () => {
    if (!areaName || !areaName.trim()) {
      setAreaStatus('Please enter an area name before saving.');
      return;
    }
    setAreaStatus(await onSaveAreaToDB(areaName.trim()));
  };
  const handleSaveLocal = async () => {
    if (!areaName || !areaName.trim()) {
      setAreaStatus('Please enter an area name before saving.');
      return;
    }
    setAreaStatus(await onSaveAreaLocal(areaName.trim()));
  };
  const handleLoadLocal = async () => setAreaStatus(await onLoadAreaFromLocal());
  const handleLoadDb = async () => setAreaStatus(await onLoadAreasFromDB());
  const handleDeleteDb = async () => {
    if (!selectedAreaId) {
      setAreaStatus('Select a saved area to delete.');
      return;
    }
    const msg = await onDeleteAreaFromDB(selectedAreaId);
    setSelectedAreaId(null);
    setAreaStatus(msg);
  };
  const handleAreaReset = () => {
    setAreaStatus('Area drawing reset.');
    setSelectedAreaId(null);
    onAreaReset();
  };
  const handleAreaSelect = (e) => {
    const value = e.target.value;
    if (!value) {
      setSelectedAreaId(null);
      return;
    }
    const area = savedAreas.find((a) => String(a.id) === value);
    if (!area) return;
    setSelectedAreaId(area.id);
    setAreaName(area.name);
    onSelectSavedArea(area);
    setAreaStatus(`Area "${area.name}" selected and zoomed on the map.`);
  };

  // Manual track handlers
  const handleResetTrack = () => {
    setTrackName('');
    setTrackNumber('');
    setTrackLat('');
    setTrackLon('');
    setTrackSpeed('');
    setTrackCourse('');
    setTrackStatus('Track form reset.');
    setSelectedTrackId(null);
  };

  const handleSaveTrack = async () => {
    if (!trackName.trim()) {
      setTrackStatus('Track name is required.');
      return;
    }
    if (trackLat.trim() === '' || trackLon.trim() === '') {
      setTrackStatus('Latitude and Longitude are required.');
      return;
    }
    const latitude = parseFloat(trackLat);
    const longitude = parseFloat(trackLon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setTrackStatus('Latitude and Longitude must be valid numbers.');
      return;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setTrackStatus('Latitude must be between -90 and 90; Longitude between -180 and 180.');
      return;
    }

    const speed = trackSpeed.trim() === '' ? null : parseFloat(trackSpeed);
    const course = trackCourse.trim() === '' ? null : parseFloat(trackCourse);
    if (trackSpeed.trim() !== '' && Number.isNaN(speed)) {
      setTrackStatus('Speed must be a valid number.');
      return;
    }
    if (trackCourse.trim() !== '' && Number.isNaN(course)) {
      setTrackStatus('Course must be a valid number.');
      return;
    }

    const payload = {
      name: trackName.trim(),
      number: trackNumber.trim(),
      latitude,
      longitude,
      speed,
      course,
    };
    setTrackStatus(await onSaveTrackToDB(payload));
  };

  const handleDeleteTrack = async () => {
    if (!selectedTrackId) {
      setTrackStatus('Select a saved track to delete.');
      return;
    }
    const msg = await onDeleteTrackFromDB(selectedTrackId);
    setSelectedTrackId(null);
    setTrackStatus(msg);
  };

  const handleLoadTracks = async () => setTrackStatus(await onLoadTracksFromDB());

  const handleToggleTrackPick = () => {
    const willEnable = mapPickTarget !== 'track';
    setMapPickTarget(willEnable ? 'track' : null);
    setTrackStatus(willEnable ? 'Track position pick mode enabled. Click on the map.' : 'Track position pick cancelled.');
  };

  const handleToggleRouteStartPick = () => {
    const willEnable = mapPickTarget !== 'routeStart';
    setMapPickTarget(willEnable ? 'routeStart' : null);
    setRouteStatus(willEnable ? 'Start position pick mode enabled. Click on the map.' : 'Start position pick cancelled.');
  };

  const handleToggleRouteEndPick = () => {
    const willEnable = mapPickTarget !== 'routeEnd';
    setMapPickTarget(willEnable ? 'routeEnd' : null);
    setRouteStatus(willEnable ? 'End position pick mode enabled. Click on the map.' : 'End position pick cancelled.');
  };

  const handleToggleRoutesVisible = () => {
    setRoutesVisible(!routesVisible);
    setRouteStatus(routesVisible ? 'Routes hidden on the map.' : 'Routes shown on the map.');
  };

  // Route handlers
  const handleResetRoute = () => {
    setRouteName('');
    setRouteStartLat('');
    setRouteStartLon('');
    setRouteEndLat('');
    setRouteEndLon('');
    setRouteValidity('');
    setRouteStatus('Route form reset.');
    setSelectedRouteId(null);
  };

  const validateRoutePositions = () => {
    if (!routeName.trim()) {
      setRouteStatus('Route name is required.');
      return null;
    }
    const startLat = parseFloat(routeStartLat);
    const startLon = parseFloat(routeStartLon);
    const endLat = parseFloat(routeEndLat);
    const endLon = parseFloat(routeEndLon);
    if ([startLat, startLon, endLat, endLon].some(Number.isNaN)) {
      setRouteStatus('Start and End positions must be valid numbers.');
      return null;
    }
    if (
      startLat < -90 || startLat > 90 ||
      endLat < -90 || endLat > 90 ||
      startLon < -180 || startLon > 180 ||
      endLon < -180 || endLon > 180
    ) {
      setRouteStatus('Latitude must be between -90 and 90; Longitude between -180 and 180.');
      return null;
    }
    return { startLat, startLon, endLat, endLon };
  };

  const handleSaveRoute = async () => {
    const positions = validateRoutePositions();
    if (!positions) return;
    const payload = {
      name: routeName.trim(),
      startLatitude: positions.startLat,
      startLongitude: positions.startLon,
      endLatitude: positions.endLat,
      endLongitude: positions.endLon,
      validity: routeValidity.trim(),
    };
    setRouteStatus(await onSaveRouteToDB(payload));
  };

  const handleSaveRouteFile = async () => {
    const positions = validateRoutePositions();
    if (!positions) return;
    const payload = {
      name: routeName.trim(),
      startLatitude: positions.startLat,
      startLongitude: positions.startLon,
      endLatitude: positions.endLat,
      endLongitude: positions.endLon,
      validity: routeValidity.trim(),
    };
    setRouteStatus(await onSaveRouteLocal(payload));
  };

  const handleLoadRouteFile = async () => setRouteStatus(await onLoadRouteFromLocal());
  const handleLoadRoutes = async () => setRouteStatus(await onLoadRoutesFromDB());

  const handleDeleteRoute = async () => {
    if (!selectedRouteId) {
      setRouteStatus('Select a saved route to delete.');
      return;
    }
    const msg = await onDeleteRouteFromDB(selectedRouteId);
    setSelectedRouteId(null);
    setRouteStatus(msg);
  };

  const handleRouteSelect = (e) => {
    const value = e.target.value;
    if (!value) {
      setSelectedRouteId(null);
      return;
    }
    const route = routesList.find((r) => String(r.id) === value);
    if (!route) return;
    setSelectedRouteId(route.id);
    setRouteName(route.name);
    setRouteStartLat(String(route.startLatitude));
    setRouteStartLon(String(route.startLongitude));
    setRouteEndLat(String(route.endLatitude));
    setRouteEndLon(String(route.endLongitude));
    setRouteValidity(route.validity || '');
    onSelectSavedRoute(route);
    setRouteStatus(`Route "${route.name}" selected and fitted on the map.`);
  };

  // Handlers for Sai Criteria Form
  const handleSaiFilter = () => {
    let result = bikesList;
    
    // 1. Vehicle Number filter
    if (vehicleNo.trim() !== '') {
      result = result.filter((b) =>
        b.vehicleNo.toLowerCase().includes(vehicleNo.toLowerCase())
      );
    }
    
    // 2. Area filter
    if (selectedFilterArea !== 'none') {
      result = result.filter((b) => b.area === selectedFilterArea);
    }
    
    // 3. Time range filter
    result = result.filter((b) => b.hour >= startHour && b.hour <= endHour);
    
    setFilteredBikes(result);
  };

  const handleSaiReset = () => {
    setVehicleNo('');
    setSelectedFilterArea('none');
    setStartHour(0);
    setEndHour(24);
    setFilteredBikes(bikesList);
  };

  // Handlers for Rajesh Criteria Form
  const handleRajeshFilter = () => {
    let result = bikesList;
    
    // 1. Battery Filter
    result = result.filter((b) => b.battery >= minBattery);
    
    // 2. Status Filter (Available vs Low Battery)
    if (bikeStatus === 'available') {
      result = result.filter((b) => b.battery >= 30);
    } else if (bikeStatus === 'low') {
      result = result.filter((b) => b.battery < 30);
    }
    
    setFilteredBikes(result);
  };

  const handleRajeshReset = () => {
    setMinBattery(0);
    setBikeStatus('all');
    setFilteredBikes(bikesList);
  };

  // Handlers for Advanced Filter Form (Header "Filter" button)
  const AREA_LABELS = {
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

  const handleFilterAreaSearch = (e) => {
    const value = e.target.value;
    setSelectedFilterArea(value);
    setFilterStatus(
      value === 'none'
        ? 'Area selection cleared from the map.'
        : `Area "${AREA_LABELS[value]}" drawn on the map.`
    );
  };

  const handleAdvancedFilter = () => {
    let result = bikesList;

    // 1. Bike number filter
    if (filterBikeNo.trim() !== '') {
      result = result.filter((b) =>
        b.vehicleNo.toLowerCase().includes(filterBikeNo.trim().toLowerCase())
      );
    }

    // 2. Bike name filter
    if (filterBikeName.trim() !== '') {
      result = result.filter((b) =>
        (b.name || '').toLowerCase().includes(filterBikeName.trim().toLowerCase())
      );
    }

    // 3. Bike chassis number filter
    if (filterChassisNo.trim() !== '') {
      result = result.filter((b) =>
        (b.chassisNo || '').toLowerCase().includes(filterChassisNo.trim().toLowerCase())
      );
    }

    // 4. From date filter
    if (filterFromDate) {
      result = result.filter((b) => (b.date || '') >= filterFromDate);
    }

    // 6. To date filter
    if (filterToDate) {
      result = result.filter((b) => (b.date || '') <= filterToDate);
    }

    setFilteredBikes(result);
    setFilterStatus(
      result.length > 0
        ? `Filter applied: ${result.length} bike(s) match the criteria.`
        : 'Filter applied: no bikes match the criteria.'
    );
  };

  const handleAdvancedReset = () => {
    setFilterBikeNo('');
    setFilterBikeName('');
    setFilterChassisNo('');
    setFilterFromDate('');
    setFilterToDate('');
    setSelectedFilterArea('none');
    setFilteredBikes(bikesList);
    setFilterStatus('Filters reset. Showing all bikes.');
  };

  return (
    <aside className={`side-panel right-panel ${collapsed ? 'panel-collapsed-right' : ''}`}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            className="panel-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
          <h3>
            {activePage === 'analytics' && 'GIS Analytics'}
            {activePage === 'area' && 'Area Specs'}
            {activePage === 'manualtrack' && 'Manual Track'}
            {activePage === 'route' && 'Route Specs'}
            {activePage === 'filter' && 'Bike Filter'}
          </h3>
        </div>
      </div>

      <div className="panel-content">
        {/* Page 1: Sai Portal (Filter Bikes main frame) */}
        {activePage === 'sai' && (
          <div className="page-container">
            {/* Top Tabs: Sai Criteria vs Rajesh Criteria */}
            <div className="criteria-tabs-wrapper">
              <button
                className={`criteria-tab-btn ${criteriaTab === 'sai' ? 'active' : ''}`}
                onClick={() => setCriteriaTab('sai')}
              >
                Sai Criteria
              </button>
              <button
                className={`criteria-tab-btn ${criteriaTab === 'rajesh' ? 'active' : ''}`}
                onClick={() => setCriteriaTab('rajesh')}
              >
                Rajesh Criteria
              </button>
            </div>

            {/* Content: Sai Criteria Tab */}
            {criteriaTab === 'sai' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="page-title-badge" style={{ marginBottom: '12px' }}>
                  Filter: Sai Criteria
                </span>

                {/* Nested Sub-Tabs Navigation */}
                <div className="sub-tabs-nav">
                  <button
                    className={`sub-tab-btn ${saiSubTab === 'vehicle' ? 'active' : ''}`}
                    onClick={() => setSaiSubTab('vehicle')}
                  >
                    Vehicle No
                  </button>
                  <button
                    className={`sub-tab-btn ${saiSubTab === 'area' ? 'active' : ''}`}
                    onClick={() => setSaiSubTab('area')}
                  >
                    Area Filter
                  </button>
                  <button
                    className={`sub-tab-btn ${saiSubTab === 'time' ? 'active' : ''}`}
                    onClick={() => setSaiSubTab('time')}
                  >
                    Time Range
                  </button>
                </div>

                {/* Sub-tab 1: Vehicle No Text Field */}
                {saiSubTab === 'vehicle' && (
                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <div className="filter-form-group">
                      <label className="filter-label">Vehicle Registration Number</label>
                      <input
                        type="text"
                        className="filter-text-input"
                        placeholder="e.g. BIKE-LON-101"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Supports partial matches</span>
                      <span>Format: BIKE-[A-Z]-[0-9]</span>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Area Selection List (draws polygon on map) */}
                {saiSubTab === 'area' && (
                  <div className="card" style={{ padding: '12px', marginBottom: '16px' }}>
                    <label className="filter-label" style={{ display: 'block', marginBottom: '8px' }}>
                      Select Geofenced Area
                    </label>
                    <div className="area-picker-list">
                      <div
                        className={`area-picker-item ${selectedFilterArea === 'none' ? 'selected' : ''}`}
                        onClick={() => setSelectedFilterArea('none')}
                      >
                        <span>No Area Filter</span>
                        <span style={{ fontSize: '10px', opacity: 0.6 }}>Globe</span>
                      </div>
                      <div
                        className={`area-picker-item ${selectedFilterArea === 'london' ? 'selected' : ''}`}
                        onClick={() => setSelectedFilterArea('london')}
                      >
                        <span>London Central</span>
                        <span className="count-badge">5 Bikes</span>
                      </div>
                      <div
                        className={`area-picker-item ${selectedFilterArea === 'paris' ? 'selected' : ''}`}
                        onClick={() => setSelectedFilterArea('paris')}
                      >
                        <span>Paris Tourist Zone</span>
                        <span className="count-badge">5 Bikes</span>
                      </div>
                      <div
                        className={`area-picker-item ${selectedFilterArea === 'tokyo' ? 'selected' : ''}`}
                        onClick={() => setSelectedFilterArea('tokyo')}
                      >
                        <span>Tokyo Center</span>
                        <span className="count-badge">5 Bikes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Time Range Slider */}
                {saiSubTab === 'time' && (
                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <div className="filter-form-group">
                      <label className="filter-label">Active Hour Range</label>
                      <div className="range-slider-container">
                        <input
                          type="range"
                          className="filter-slider"
                          min="0"
                          max="24"
                          value={endHour}
                          onChange={(e) => setEndHour(parseInt(e.target.value))}
                        />
                        <div className="range-slider-labels">
                          <span>00:00</span>
                          <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                            Active before {endHour}:00
                          </span>
                          <span>24:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results count display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filtered Results:</span>
                  <span className="count-badge" style={{ fontSize: '13px' }}>
                    {filteredBikes.length} Bikes / {bikesList.length} Total
                  </span>
                </div>

                {/* Bottom Actions: Reset vs Filter */}
                <div className="filter-actions">
                  <button className="action-btn-secondary" style={{ flex: 1 }} onClick={handleSaiReset}>
                    Reset Filters
                  </button>
                  <button className="action-btn" style={{ flex: 1.5 }} onClick={handleSaiFilter}>
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: '16px', height: '16px', color: 'currentColor' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3c2.755 0 5.455.477 8 1.4v5.334c0 .947-.614 1.776-1.5 2.1l-6.5 2.4a1 1 0 01-1 0l-6.5-2.4a2.222 2.222 0 01-1.5-2.1V4.4c2.545-.923 5.245-1.4 8-1.4z"
                      />
                    </svg>
                    Apply Filter
                  </button>
                </div>
              </div>
            )}

            {/* Content: Rajesh Criteria Tab */}
            {criteriaTab === 'rajesh' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="page-title-badge" style={{ marginBottom: '12px', background: 'rgba(79, 172, 254, 0.1)', color: 'var(--color-secondary)' }}>
                  Filter: Rajesh Criteria
                </span>

                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                  {/* Slider: Battery Level */}
                  <div className="filter-form-group">
                    <label className="filter-label">Minimum Battery Capacity</label>
                    <div className="range-slider-container">
                      <input
                        type="range"
                        className="filter-slider"
                        min="0"
                        max="100"
                        value={minBattery}
                        onChange={(e) => setMinBattery(parseInt(e.target.value))}
                      />
                      <div className="range-slider-labels">
                        <span>0%</span>
                        <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                          &gt;= {minBattery}% Battery
                        </span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Select Dropdown: Bike Status */}
                  <div className="filter-form-group">
                    <label className="filter-label">Bike Operation Status</label>
                    <select
                      className="filter-select"
                      value={bikeStatus}
                      onChange={(e) => setBikeStatus(e.target.value)}
                    >
                      <option value="all">All Bikes</option>
                      <option value="available">Available (Battery &gt;= 30%)</option>
                      <option value="low">Low Battery (Battery &lt; 30%)</option>
                    </select>
                  </div>
                </div>

                {/* Results count display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filtered Results:</span>
                  <span className="count-badge" style={{ fontSize: '13px', background: 'rgba(79, 172, 254, 0.1)', color: 'var(--color-secondary)' }}>
                    {filteredBikes.length} Bikes / {bikesList.length} Total
                  </span>
                </div>

                {/* Bottom Actions: Reset vs Filter */}
                <div className="filter-actions">
                  <button className="action-btn-secondary" style={{ flex: 1 }} onClick={handleRajeshReset}>
                    Reset Form
                  </button>
                  <button
                    className="action-btn"
                    style={{ flex: 1.5, background: 'linear-gradient(135deg, var(--color-secondary), var(--color-accent))' }}
                    onClick={handleRajeshFilter}
                  >
                    Filter Bikes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page 2: Lakshman Profile */}
        {activePage === 'lakshman' && (
          <div className="page-container">
            <span className="page-title-badge">GIS MODELING PANEL</span>

            <div className="profile-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-accent))' }}>L</div>
                <div>
                  <h4 style={{ color: 'var(--text-bright)', fontSize: '15px' }}>Lakshman Sai</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Senior Mapping Engineer</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Role Access:</span>
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>GIS Designer</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Default Workspace:</span>
                  <span>/home/saiworkspace</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Telemetry Status:</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>ONLINE</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <span className="section-title">Telemetry Diagnostics</span>
              <div className="card info-list">
                <div className="info-item">
                  <span className="info-label">Active Connection</span>
                  <span className="info-value" style={{ color: 'var(--color-success)' }}>ACTIVE</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nominatim Geocoder Ping</span>
                  <span className="info-value">124ms</span>
                </div>
                <div className="info-item">
                  <span className="info-label">CORS Redirect Status</span>
                  <span className="info-value" style={{ color: 'var(--color-primary)' }}>BYPASSED</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Geoid Target Standard</span>
                  <span className="info-value">WGS84 Model</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page 3: Temperature Sensor Simulation */}
        {activePage === 'temp' && (
          <div className="page-container">
            <span className="page-title-badge">Environment Telemetry</span>

            <div className="card">
              <h4 style={{ color: 'var(--text-bright)', fontSize: '14px', marginBottom: '8px' }}>Temperature Sensor</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: clickedCoords ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                  {clickedCoords ? `${((Math.abs(clickedCoords[0]) + Math.abs(clickedCoords[1])) % 25 + 12).toFixed(1)}°C` : 'N/A'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {clickedCoords ? `Lat: ${clickedCoords[1].toFixed(2)}°` : 'Click map to measure temp'}
                </span>
              </div>
              <div className="temp-gauge">
                <div
                  className="temp-gauge-fill"
                  style={{ width: clickedCoords ? `${(((Math.abs(clickedCoords[0]) + Math.abs(clickedCoords[1])) % 25 + 12) / 45) * 100}%` : '0%' }}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                *Temperature is dynamically simulated based on longitude and latitude variables of the clicked point.
              </p>
            </div>

            <div className="panel-section">
              <span className="section-title">Atmospheric Conditions</span>
              <div className="card info-list">
                <div className="info-item">
                  <span className="info-label">Relative Humidity</span>
                  <span className="info-value">{clickedCoords ? `${(Math.abs(clickedCoords[0]) % 40 + 40).toFixed(0)}%` : '--'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Wind Velocity</span>
                  <span className="info-value">{clickedCoords ? `${(Math.abs(clickedCoords[1]) % 28 + 2).toFixed(1)} km/h` : '--'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Atmosphere</span>
                  <span className="info-value">{clickedCoords ? `${(Math.abs(clickedCoords[0] + clickedCoords[1]) % 20 + 1002).toFixed(0)} hPa` : '--'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page 4: Area Measurement Info */}
        {activePage === 'area' && (
          <div className="page-container">
            <span className="page-title-badge">Area Specs</span>

            {/* Draw Polygon Action */}
            <div className="panel-section">
              <span className="section-title">Draw Area</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="action-btn"
                  onClick={handleToggleAreaDraw}
                  style={
                    activeTool === 'Polygon'
                      ? { background: 'var(--color-danger)', color: '#fff' }
                      : undefined
                  }
                >
                  {activeTool === 'Polygon' ? 'Finish Drawing (double-click map)' : 'Draw Polygon'}
                </button>
                <button
                  className="action-btn-secondary"
                  onClick={() => setStyleDialogOpen(true)}
                >
                  Area Styling
                </button>
                {!areaCoords && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Click "Draw Polygon", then click the map to place vertices. Double-click the last
                    vertex to close the area.
                  </p>
                )}
              </div>
            </div>

            {/* Select Saved Area Combobox */}
            <div className="panel-section">
              <span className="section-title">Select Saved Area</span>
              <div className="card" style={{ padding: '14px' }}>
                <select
                  className="filter-select"
                  value={selectedAreaId == null ? '' : String(selectedAreaId)}
                  onChange={handleAreaSelect}
                  disabled={savedAreas.length === 0}
                >
                  <option value="">-- Select a saved area --</option>
                  {savedAreas.map((area) => (
                    <option key={area.id} value={String(area.id)}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Area Name Input */}
            <div className="panel-section">
              <span className="section-title">Area Name</span>
              <div className="card" style={{ padding: '14px' }}>
                <input
                  type="text"
                  className="filter-text-input"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Central Park Zone (required to save)"
                />
              </div>
            </div>

            {/* Current Polygon Vertices in DD MMM Format */}
            {areaCoords && areaCoords.length >= 3 && (
              <div className="panel-section">
                <span className="section-title">Polygon Vertices (DD MMM)</span>
                {measurementInfo && measurementInfo.type === 'polygon' && measurementInfo.value && (
                  <div className="info-item" style={{ borderBottom: 'none', marginBottom: '8px' }}>
                    <span className="info-label">Measured Area</span>
                    <span className="info-value" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                      {measurementInfo.value}
                    </span>
                  </div>
                )}
                <div className="card" style={{ padding: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                  <div className="coord-readout">
                    {areaCoords.map((coord, idx) => (
                      <div className="coord-row" key={idx}>
                        <span className="coord-label">V{idx + 1}</span>
                        <span className="coord-value">{formatDDM(coord[0], coord[1])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Persistence Action Buttons */}
            <div className="panel-section">
              <span className="section-title">Persistence Actions</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="area-action-grid">
                  <button className="action-btn" onClick={handleSaveDb}>
                    Save Database
                  </button>
                  <button className="action-btn-secondary" onClick={handleSaveLocal}>
                    Save Local
                  </button>
                  <button className="action-btn-secondary" onClick={handleLoadLocal}>
                    Load from Local
                  </button>
                  <button className="action-btn-secondary" onClick={handleLoadDb}>
                    Load from DB
                  </button>
                  <button className="action-btn-secondary" onClick={handleDeleteDb}>
                    Delete
                  </button>
                  <button className="action-btn-secondary" onClick={handleAreaReset}>
                    Reset
                  </button>
                </div>
                {areaStatus && (
                  <p style={{ fontSize: '11px', color: 'var(--color-primary)', lineHeight: '1.4', margin: 0 }}>
                    {areaStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Saved Areas List */}
            <div className="panel-section">
              <span className="section-title">Saved Areas ({savedAreas.length})</span>
              <div className="card" style={{ padding: '8px', maxHeight: '170px', overflowY: 'auto' }}>
                {savedAreas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No areas saved yet. Use "Save Database" to persist.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {savedAreas.map((area) => (
                      <div
                        key={area.id}
                        className={`area-saved-item ${selectedAreaId === area.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAreaId(area.id);
                          onZoomToSavedArea(area);
                        }}
                      >
                        <div style={{ flex: 1, cursor: 'pointer' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)' }}>
                            {area.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {area.areaValue ? `${area.areaValue} ${area.areaUnit}` : `${vertexCount(area.coordinates)} vertices`} · ID {area.id}
                          </div>
                        </div>
                        <button
                          className="area-delete-btn"
                          title="Delete area"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAreaFromDB(area.id).then((msg) => {
                              if (selectedAreaId === area.id) setSelectedAreaId(null);
                              setAreaStatus(msg);
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Track Form */}
        {activePage === 'manualtrack' && (
          <div className="page-container">
            <span className="page-title-badge">Manual Track</span>

            {/* Track Details Form */}
            <div className="panel-section">
              <span className="section-title">Track Details</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="filter-form-group">
                  <label className="filter-label">Track Name</label>
                  <input
                    type="text"
                    className="filter-text-input"
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    placeholder="e.g. Highway A-1"
                  />
                </div>
                <div className="filter-form-group">
                  <label className="filter-label">Track Number</label>
                  <input
                    type="text"
                    className="filter-text-input"
                    value={trackNumber}
                    onChange={(e) => setTrackNumber(e.target.value)}
                    placeholder="e.g. TRK-101"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="filter-form-group">
                    <label className="filter-label">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={trackLat}
                      onChange={(e) => setTrackLat(e.target.value)}
                      placeholder="e.g. 51.5072"
                    />
                  </div>
                  <div className="filter-form-group">
                    <label className="filter-label">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={trackLon}
                      onChange={(e) => setTrackLon(e.target.value)}
                      placeholder="e.g. -0.1276"
                    />
                  </div>
                </div>
                <button
                  className="action-btn-secondary"
                  onClick={handleToggleTrackPick}
                  style={mapPickTarget === 'track' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : undefined}
                >
                  {mapPickTarget === 'track' ? 'Click on the map to pick position...' : 'Pick Lat/Lon from Map'}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="filter-form-group">
                    <label className="filter-label">Speed (km/h)</label>
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={trackSpeed}
                      onChange={(e) => setTrackSpeed(e.target.value)}
                      placeholder="e.g. 72.5"
                    />
                  </div>
                  <div className="filter-form-group">
                    <label className="filter-label">Course (degrees)</label>
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={trackCourse}
                      onChange={(e) => setTrackCourse(e.target.value)}
                      placeholder="e.g. 135"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Track Persistence Actions */}
            <div className="panel-section">
              <span className="section-title">Persistence Actions</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="area-action-grid">
                  <button className="action-btn" onClick={handleSaveTrack}>
                    Save DB
                  </button>
                  <button className="action-btn-secondary" onClick={handleResetTrack}>
                    Reset
                  </button>
                  <button className="action-btn-secondary" onClick={handleDeleteTrack}>
                    Delete
                  </button>
                  <button className="action-btn-secondary" onClick={handleLoadTracks}>
                    Load from DB
                  </button>
                </div>
                {trackStatus && (
                  <p style={{ fontSize: '11px', color: 'var(--color-primary)', lineHeight: '1.4', margin: 0 }}>
                    {trackStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Saved Tracks List */}
            <div className="panel-section">
              <span className="section-title">Saved Tracks ({tracksList.length})</span>
              <div className="card" style={{ padding: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {tracksList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No tracks saved yet. Fill the form and click "Save DB".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {tracksList.map((track) => (
                      <div
                        key={track.id}
                        className={`area-saved-item ${selectedTrackId === track.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTrackId(track.id)}
                      >
                        <div style={{ flex: 1, cursor: 'pointer' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)' }}>
                            {track.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {track.number ? `${track.number} · ` : ''}
                            {track.latitude.toFixed(4)}° N, {track.longitude.toFixed(4)}° E
                            {track.speed != null ? ` · ${track.speed} km/h` : ''}
                            {track.course != null ? ` · ${track.course}°` : ''}
                          </div>
                        </div>
                        <button
                          className="area-delete-btn"
                          title="Delete track"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrackFromDB(track.id).then((msg) => {
                              if (selectedTrackId === track.id) setSelectedTrackId(null);
                              setTrackStatus(msg);
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Route Form */}
        {activePage === 'route' && (
          <div className="page-container">
            <span className="page-title-badge">Route Specs</span>

            {/* Route Details Form */}
            <div className="panel-section">
              <span className="section-title">Route Details</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="filter-form-group">
                  <label className="filter-label">Route Name</label>
                  <input
                    type="text"
                    className="filter-text-input"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g. City Loop"
                  />
                </div>

                <div className="filter-form-group">
                  <label className="filter-label">Start Position</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={routeStartLat}
                      onChange={(e) => setRouteStartLat(e.target.value)}
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={routeStartLon}
                      onChange={(e) => setRouteStartLon(e.target.value)}
                      placeholder="Longitude"
                    />
                  </div>
                  <button
                    className="action-btn-secondary"
                    style={{ marginTop: '8px', width: '100%', ...(mapPickTarget === 'routeStart' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}) }}
                    onClick={handleToggleRouteStartPick}
                  >
                    {mapPickTarget === 'routeStart' ? 'Click on the map to pick start...' : 'Pick Start from Map'}
                  </button>
                </div>

                <div className="filter-form-group">
                  <label className="filter-label">End Position</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={routeEndLat}
                      onChange={(e) => setRouteEndLat(e.target.value)}
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="any"
                      className="filter-text-input"
                      value={routeEndLon}
                      onChange={(e) => setRouteEndLon(e.target.value)}
                      placeholder="Longitude"
                    />
                  </div>
                  <button
                    className="action-btn-secondary"
                    style={{ marginTop: '8px', width: '100%', ...(mapPickTarget === 'routeEnd' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}) }}
                    onClick={handleToggleRouteEndPick}
                  >
                    {mapPickTarget === 'routeEnd' ? 'Click on the map to pick end...' : 'Pick End from Map'}
                  </button>
                </div>

                <div className="filter-form-group">
                  <label className="filter-label">Validity</label>
                  <input
                    type="text"
                    className="filter-text-input"
                    value={routeValidity}
                    onChange={(e) => setRouteValidity(e.target.value)}
                    placeholder="e.g. Active / Valid until 2026-12-31"
                  />
                </div>
              </div>
            </div>

            {/* Select Saved Route Combobox */}
            <div className="panel-section">
              <span className="section-title">Select Saved Route</span>
              <div className="card" style={{ padding: '14px' }}>
                <select
                  className="filter-select"
                  value={selectedRouteId == null ? '' : String(selectedRouteId)}
                  onChange={handleRouteSelect}
                  disabled={routesList.length === 0}
                >
                  <option value="">-- Select a saved route --</option>
                  {routesList.map((route) => (
                    <option key={route.id} value={String(route.id)}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Route Persistence Actions */}
            <div className="panel-section">
              <span className="section-title">Persistence Actions</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="area-action-grid">
                  <button className="action-btn" onClick={handleSaveRoute}>
                    Save DB
                  </button>
                  <button className="action-btn-secondary" onClick={handleSaveRouteFile}>
                    Save Local
                  </button>
                  <button className="action-btn-secondary" onClick={handleLoadRouteFile}>
                    Load from Local
                  </button>
                  <button className="action-btn-secondary" onClick={handleLoadRoutes}>
                    Load from DB
                  </button>
                  <button className="action-btn-secondary" onClick={handleDeleteRoute}>
                    Delete
                  </button>
                  <button className="action-btn-secondary" onClick={handleResetRoute}>
                    Reset
                  </button>
                </div>
                <button
                  className="action-btn-secondary"
                  style={routesVisible ? undefined : { borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                  onClick={handleToggleRoutesVisible}
                >
                  {routesVisible ? 'Hide Routes on Map' : 'Show Routes on Map'}
                </button>
                {routeStatus && (
                  <p style={{ fontSize: '11px', color: 'var(--color-primary)', lineHeight: '1.4', margin: 0 }}>
                    {routeStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Saved Routes List */}
            <div className="panel-section">
              <span className="section-title">Saved Routes ({routesList.length})</span>
              <div className="card" style={{ padding: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {routesList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No routes saved yet. Fill the form and click "Save DB".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {routesList.map((route) => (
                      <div
                        key={route.id}
                        className={`area-saved-item ${selectedRouteId === route.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedRouteId(route.id);
                          onSelectSavedRoute(route);
                        }}
                      >
                        <div style={{ flex: 1, cursor: 'pointer' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)' }}>
                            {route.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {route.startLatitude.toFixed(4)}° N, {route.startLongitude.toFixed(4)}° E
                            {' → '}
                            {route.endLatitude.toFixed(4)}° N, {route.endLongitude.toFixed(4)}° E
                            {route.validity ? ` · ${route.validity}` : ''}
                          </div>
                        </div>
                        <button
                          className="area-delete-btn"
                          title="Delete route"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRouteFromDB(route.id).then((msg) => {
                              if (selectedRouteId === route.id) setSelectedRouteId(null);
                              setRouteStatus(msg);
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bike Filter Page (Header "Filter" button) */}
        {activePage === 'filter' && (
          <div className="page-container">
            <span className="page-title-badge">Filter Bikes</span>

            {/* Bike Identification Filters */}
            <div className="panel-section">
              <span className="section-title">Bike Identification</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="filter-form-group">
                  <label className="filter-label">Bike Number</label>
                  <input
                    type="text"
                    className="filter-text-input"
                    value={filterBikeNo}
                    onChange={(e) => setFilterBikeNo(e.target.value)}
                    placeholder="e.g. BIKE-LON-101"
                  />
                </div>
                <div className="filter-form-group">
                  <label className="filter-label">Bike Name</label>
                  <input
                    type="text"
                    className="filter-text-input"
                    value={filterBikeName}
                    onChange={(e) => setFilterBikeName(e.target.value)}
                    placeholder="e.g. Thunder Bolt"
                  />
                </div>
                <div className="filter-form-group">
                  <label className="filter-label">Chassis Number</label>
                  <input
                    type="text"
                    className="filter-text-input"
                    value={filterChassisNo}
                    onChange={(e) => setFilterChassisNo(e.target.value)}
                    placeholder="e.g. CH-1001"
                  />
                </div>
              </div>
            </div>

            {/* Particular Area Search Combobox (draws area on the map) */}
            <div className="panel-section">
              <span className="section-title">Particular Area Search</span>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select
                  className="filter-select"
                  value={selectedFilterArea}
                  onChange={handleFilterAreaSearch}
                >
                  <option value="none">-- Select an area to draw on the map --</option>
                  <option value="delhi">Delhi Central</option>
                  <option value="mumbai">Mumbai Marine Drive</option>
                  <option value="bengaluru">Bengaluru Tech Park</option>
                  <option value="hyderabad">Hyderabad City Center</option>
                  <option value="chennai">Chennai Marina Zone</option>
                  <option value="kolkata">Kolkata City Core</option>
                  <option value="london">London Central</option>
                  <option value="paris">Paris Tourist Zone</option>
                  <option value="tokyo">Tokyo Center</option>
                </select>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Selecting an area draws its geofence boundary on the map and zooms to it.
                </p>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="panel-section">
              <span className="section-title">Time Range</span>
              <div className="card" style={{ padding: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="filter-form-group">
                    <label className="filter-label">From Date</label>
                    <input
                      type="date"
                      className="filter-text-input"
                      value={filterFromDate}
                      onChange={(e) => setFilterFromDate(e.target.value)}
                    />
                  </div>
                  <div className="filter-form-group">
                    <label className="filter-label">To Date</label>
                    <input
                      type="date"
                      className="filter-text-input"
                      value={filterToDate}
                      onChange={(e) => setFilterToDate(e.target.value)}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '10px 0 0' }}>
                  Bikes are filtered by their recorded active date within this range.
                </p>
              </div>
            </div>

            {/* Results count display */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filtered Results:</span>
              <span className="count-badge" style={{ fontSize: '13px' }}>
                {filteredBikes.length} Bikes / {bikesList.length} Total
              </span>
            </div>

            {/* Bottom Actions: Reset vs Filter */}
            <div className="filter-actions">
              <button className="action-btn-secondary" style={{ flex: 1 }} onClick={handleAdvancedReset}>
                Reset
              </button>
              <button className="action-btn" style={{ flex: 1.5 }} onClick={handleAdvancedFilter}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '16px', height: '16px', color: 'currentColor' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c2.755 0 5.455.477 8 1.4v5.334c0 .947-.614 1.776-1.5 2.1l-6.5 2.4a1 1 0 01-1 0l-6.5-2.4a2.222 2.222 0 01-1.5-2.1V4.4c2.545-.923 5.245-1.4 8-1.4z"
                  />
                </svg>
                Apply Filter
              </button>
            </div>
            {filterStatus && (
              <p style={{ fontSize: '11px', color: 'var(--color-primary)', lineHeight: '1.4', margin: '12px 0 0' }}>
                {filterStatus}
              </p>
            )}
          </div>
        )}

        {/* Default Page: Analytics & Saved Points */}
        {activePage === 'analytics' && (
          <>
            {/* Click Inspector */}
            <div className="panel-section">
              <span className="section-title">Inspector Tool</span>
              <div className="card">
                {clickedCoords ? (
                  <div className="coord-readout">
                    <div className="coord-row">
                      <span className="coord-label">Latitude:</span>
                      <span className="coord-value">{clickedCoords[1].toFixed(6)}° N</span>
                    </div>
                    <div className="coord-row">
                      <span className="coord-label">Longitude:</span>
                      <span className="coord-value">{clickedCoords[0].toFixed(6)}° E</span>
                    </div>
                    {address && (
                      <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                        <span className="coord-label" style={{ fontSize: '11px' }}>Reverse Geocode:</span>
                        <p className="location-address">{address}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <p>Click anywhere on the map to inspect coordinates & resolve address details.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Measurement Outputs */}
            {measurementInfo && measurementInfo.value && (
              <div className="panel-section">
                <span className="section-title">Active Measurement</span>
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)', background: 'rgba(2, 132, 199, 0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-bright)' }}>
                        {measurementInfo.type === 'polygon' ? 'Enclosed Area' : 'Path Length'}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Real-time calculation
                      </p>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)' }}>
                      {measurementInfo.value}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Map View Statistics */}
            <div className="panel-section">
              <span className="section-title">Camera Settings</span>
              <div className="card info-list">
                <div className="info-item">
                  <span className="info-label">Zoom Level</span>
                  <span className="info-value">{mapStats.zoom.toFixed(1)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Center Latitude</span>
                  <span className="info-value">{mapStats.center[1].toFixed(4)}° N</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Center Longitude</span>
                  <span className="info-value">{mapStats.center[0].toFixed(4)}° E</span>
                </div>
                <div className="info-item" style={{ flexDirection: 'column', gap: '4px', borderBottom: 'none' }}>
                  <span className="info-label">Viewport Bounds (Extent)</span>
                  <span className="info-value" style={{ fontSize: '10px', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--color-secondary)', marginTop: '2px' }}>
                    [{mapStats.extent[0].toFixed(2)}, {mapStats.extent[1].toFixed(2)}] to [{mapStats.extent[2].toFixed(2)}, {mapStats.extent[3].toFixed(2)}]
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Saved Points */}
            <div className="panel-section">
              <span className="section-title">Saved Locations ({markersList.length})</span>
              <div className="card" style={{ padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {markersList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No custom pins placed yet. Use the "Add Pin" tool on the left.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {markersList.map((marker) => (
                      <div
                        key={marker.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px',
                          background: 'rgba(15, 23, 42, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                        }}
                      >
                        <div
                          onClick={() => onZoomToMarker(marker.coords)}
                          style={{ cursor: 'pointer', flex: 1 }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)' }}>
                            {marker.label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {marker.coords[1].toFixed(4)}° N, {marker.coords[0].toFixed(4)}° E
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteMarker(marker.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Delete Marker"
                        >
                          <svg
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ width: '14px', height: '14px' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Area Styling Dialog */}
      {createPortal(
        styleDialogOpen && (
          <div className="modal-overlay" onClick={() => setStyleDialogOpen(false)}>
            <div className="style-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="style-dialog-header">
                <h3>Area Styling</h3>
                <button className="style-dialog-close" onClick={() => setStyleDialogOpen(false)}>
                  ×
                </button>
              </div>
              <div className="style-dialog-body">
                <div className="style-form-row">
                  <label>Fill Color</label>
                  <input
                    type="color"
                    value={areaStyle.fillColor}
                    onChange={(e) => setAreaStyle({ ...areaStyle, fillColor: e.target.value })}
                  />
                </div>
                <div className="style-form-row">
                  <label>Fill Opacity</label>
                  <div className="style-range-wrap">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={areaStyle.fillOpacity}
                      onChange={(e) => setAreaStyle({ ...areaStyle, fillOpacity: parseFloat(e.target.value) })}
                    />
                    <span>{Math.round(areaStyle.fillOpacity * 100)}%</span>
                  </div>
                </div>
                <div className="style-form-row">
                  <label>Border (Stroke) Color</label>
                  <input
                    type="color"
                    value={areaStyle.strokeColor}
                    onChange={(e) => setAreaStyle({ ...areaStyle, strokeColor: e.target.value })}
                  />
                </div>
                <div className="style-form-row">
                  <label>Border Width</label>
                  <div className="style-range-wrap">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={areaStyle.strokeWidth}
                      onChange={(e) => setAreaStyle({ ...areaStyle, strokeWidth: parseFloat(e.target.value) })}
                    />
                    <span>{areaStyle.strokeWidth}</span>
                  </div>
                </div>
                <div className="style-form-row">
                  <label>Border Style</label>
                  <div className="style-dash-options">
                    <button
                      className={`style-dash-btn ${areaStyle.dashStyle === 'dashed' ? 'active' : ''}`}
                      onClick={() => setAreaStyle({ ...areaStyle, dashStyle: 'dashed' })}
                    >
                      Dashed
                    </button>
                    <button
                      className={`style-dash-btn ${areaStyle.dashStyle === 'solid' ? 'active' : ''}`}
                      onClick={() => setAreaStyle({ ...areaStyle, dashStyle: 'solid' })}
                    >
                      Solid
                    </button>
                  </div>
                </div>
                <div
                  className="style-preview"
                  style={{
                    background: hexToRgba(areaStyle.fillColor, areaStyle.fillOpacity),
                    border: `${areaStyle.strokeWidth}px ${areaStyle.dashStyle === 'dashed' ? 'dashed' : 'solid'} ${areaStyle.strokeColor}`,
                  }}
                >
                  <span>Preview</span>
                </div>
              </div>
              <div className="style-dialog-footer">
                <button
                  className="action-btn-secondary"
                  onClick={() => setAreaStyle({ ...DEFAULT_AREA_STYLE })}
                >
                  Reset Default
                </button>
                <button
                  className="action-btn"
                  onClick={() => {
                    setStyleDialogOpen(false);
                    showToast('Area styling applied.');
                  }}
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Toast Notification */}
      {createPortal(
        toast && (
          <div className={`toast toast-${toast.type}`} key={toast.id}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'i'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)}>
              ×
            </button>
          </div>
        ),
        document.body
      )}
    </aside>
  );
}
