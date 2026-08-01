import React from 'react';

export default function SidebarLeft({
  layers,
  setLayers,
  activeTool,
  setActiveTool,
  onClearDrawings,
  onResetView,
  onLocateMe,
  collapsed,
  disabled,
}) {
  const toggleLayer = (layerKey) => {
    setLayers({
      ...layers,
      [layerKey]: !layers[layerKey],
    });
  };

  const handleToolClick = (tool) => {
    if (activeTool === tool) {
      setActiveTool(null); // toggle off
    } else {
      setActiveTool(tool);
    }
  };

  return (
    <aside className={`side-panel left-panel ${collapsed ? 'panel-collapsed-left' : ''} ${disabled ? 'disabled' : ''}`}>
      {disabled && (
        <div className="panel-disabled-overlay">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            ></path>
          </svg>
          <h4>Left Panel Locked</h4>
          <p>Click "Layers" in the header to unlock controls & drawing tools.</p>
        </div>
      )}
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            ></path>
          </svg>
          <h3>Control Center</h3>
        </div>
      </div>

      <div className="panel-content">
        {/* Layer Section */}
        <div className="panel-section">
          <span className="section-title">Map Layers</span>
          <div className="layer-list">
            <div
              className={`layer-item ${layers.osm ? 'active' : ''}`}
              onClick={() => toggleLayer('osm')}
            >
              <div className="layer-info">
                <input
                  type="checkbox"
                  className="layer-checkbox"
                  checked={layers.osm}
                  onChange={() => {}}
                />
                <span className="layer-name">Standard OSM</span>
              </div>
              <svg
                className="layer-visibility"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                ></path>
              </svg>
            </div>

            <div
              className={`layer-item ${layers.darkMatter ? 'active' : ''}`}
              onClick={() => toggleLayer('darkMatter')}
            >
              <div className="layer-info">
                <input
                  type="checkbox"
                  className="layer-checkbox"
                  checked={layers.darkMatter}
                  onChange={() => {}}
                />
                <span className="layer-name">Light CartoDB</span>
              </div>
              <svg
                className="layer-visibility"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                ></path>
              </svg>
            </div>

            <div
              className={`layer-item ${layers.markers ? 'active' : ''}`}
              onClick={() => toggleLayer('markers')}
            >
              <div className="layer-info">
                <input
                  type="checkbox"
                  className="layer-checkbox"
                  checked={layers.markers}
                  onChange={() => {}}
                />
                <span className="layer-name">Marker Pin Overlay</span>
              </div>
              <svg
                className="layer-visibility"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
            </div>

            <div
              className={`layer-item ${layers.graticule ? 'active' : ''}`}
              onClick={() => toggleLayer('graticule')}
            >
              <div className="layer-info">
                <input
                  type="checkbox"
                  className="layer-checkbox"
                  checked={layers.graticule}
                  onChange={() => {}}
                />
                <span className="layer-name">Grid lines (Graticule)</span>
              </div>
              <svg
                className="layer-visibility"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 4v16M15 4v16M4 9h16M4 15h16"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        {/* GIS Toolset */}
        <div className="panel-section">
          <span className="section-title">Measurement & Drawing Tools</span>
          <div className="tools-grid">
            <button
              className={`tool-btn ${activeTool === 'Point' ? 'active' : ''}`}
              onClick={() => handleToolClick('Point')}
              title="Click on the map to add keypoints"
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              <span>Add Pin</span>
            </button>

            <button
              className={`tool-btn ${activeTool === 'LineString' ? 'active' : ''}`}
              onClick={() => handleToolClick('LineString')}
              title="Click points to draw a path and measure distance"
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                ></path>
              </svg>
              <span>Measure Path</span>
            </button>

            <button
              className={`tool-btn ${activeTool === 'Polygon' ? 'active' : ''}`}
              onClick={() => handleToolClick('Polygon')}
              title="Click points to draw an area and measure size"
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                ></path>
              </svg>
              <span>Measure Area</span>
            </button>

            <button
              className="tool-btn"
              onClick={onClearDrawings}
              title="Delete all drawings and markers"
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
              <span>Clear Map</span>
            </button>
          </div>
        </div>

        {/* Quick Nav Actions */}
        <div className="panel-section">
          <span className="section-title">Navigation Tools</span>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="action-btn" onClick={onLocateMe}>
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              Fly to My Location
            </button>
            <button className="action-btn-secondary" onClick={onResetView}>
              Reset Global View
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
