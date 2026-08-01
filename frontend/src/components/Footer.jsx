import React from 'react';

export default function Footer({
  mouseCoords,
  activeProjection,
  crosshairVisible,
  setCrosshairVisible,
  onZoomIn,
  onZoomOut,
  onFitMap,
  onZoomParticular,
}) {
  return (
    <footer className="dashboard-footer">
      <div className="footer-left">
        <span className="footer-coordinates">
          {mouseCoords ? (
            <>
              Cursor: <strong style={{ color: 'var(--text-bright)' }}>{mouseCoords[1].toFixed(5)}° N, {mouseCoords[0].toFixed(5)}° E</strong>
            </>
          ) : (
            'Cursor outside map bounds'
          )}
        </span>
      </div>

      <div className="footer-center">
        {/* Map Control Buttons */}
        <div className="footer-map-controls">
          <button className="footer-map-btn" onClick={onZoomIn} title="Zoom In Map Camera">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Zoom In
          </button>
          
          <button className="footer-map-btn" onClick={onZoomOut} title="Zoom Out Map Camera">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
            Zoom Out
          </button>
          
          <button className="footer-map-btn" onClick={onFitMap} title="Fit Map to Global View">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
            Fit Map
          </button>
          
          <button className="footer-map-btn" onClick={onZoomParticular} title="Zoom to Mt. Everest coordinates">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
            </svg>
            Zoom Particular
          </button>
        </div>

        <span style={{ color: 'var(--border-subtle)', margin: '0 10px' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setCrosshairVisible(!crosshairVisible)}
            style={{
              background: 'none',
              border: 'none',
              color: crosshairVisible ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Toggle Map Center Crosshair"
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '12px', height: '12px' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4m12 0a4 4 0 11-8 0 4 4 0 018 0z"
              ></path>
            </svg>
            Crosshair: {crosshairVisible ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="footer-right">
        <span>CRS: <strong style={{ color: 'var(--text-muted)' }}>{activeProjection}</strong></span>
        <span>|</span>
        <span className="footer-copyright">
          © {new Date().getFullYear()} <a href="https://openlayers.org" target="_blank" rel="noopener noreferrer">OpenLayers</a>
        </span>
      </div>
    </footer>
  );
}
