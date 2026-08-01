import React, { useState } from 'react';

export default function Header({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  onSearch,
  leftPanelEnabled,
  setLeftPanelEnabled,
  rightPanelPage,
  setRightPanelPage,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-brand">
        <button
          className="panel-toggle-btn"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          title={leftPanelOpen ? "Collapse Left Panel" : "Expand Left Panel"}
          aria-label="Toggle Left Panel"
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
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
        
        <div className="brand-logo">
          <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <span className="brand-name">GeoNexus</span>
      </div>

      {/* Center navigation tab buttons */}
      <div className="header-tabs">
        {[
          { key: 'area', label: 'Area' },
          { key: 'manualtrack', label: 'Manual Track' },
          { key: 'route', label: 'Route' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`header-tab-btn ${rightPanelPage === tab.key ? 'active' : ''}`}
            onClick={() => {
              const targetPage = rightPanelPage === tab.key ? 'analytics' : tab.key;
              setRightPanelPage(targetPage);
              setRightPanelOpen(true);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="header-search" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg
          className="search-icon"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </form>

      <div className="header-actions">
        {/* Layers toggle button to lock/unlock Left Panel */}
        <button
          className={`layers-toggle-btn ${leftPanelEnabled ? 'active' : ''}`}
          onClick={() => {
            setLeftPanelEnabled(!leftPanelEnabled);
            if (!leftPanelEnabled) {
              setLeftPanelOpen(true);
            }
          }}
          title="Enable/Disable layers menu configuration"
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
              d="M6.429 9.75L2.25 12l4.179 2.25m-4.179 0L2.25 12l4.179-2.25m0 0l4.179 2.25m-4.179 0l4.179-2.25m0 0l4.179 2.25m-4.179 0L10.607 12l-4.179-2.25m0 0v4.5m0-4.5L10.607 12m0 0l4.179 2.25m-4.179 0l4.179-2.25m0 0l4.179 2.25m-4.179 0L14.786 12l-4.179-2.25m0 0v4.5m0-4.5L14.786 12m0 0l4.179 2.25m-4.179 0L21.75 12l-4.179-2.25m0 0V9.75M21.75 12l-4.179 2.25"
            />
          </svg>
          Layers: {leftPanelEnabled ? 'ACTIVE' : 'LOCKED'}
        </button>

        {/* Filter button to open the Filter panel in the right panel */}
        <button
          className={`layers-toggle-btn ${rightPanelPage === 'filter' ? 'active' : ''}`}
          onClick={() => {
            const targetPage = rightPanelPage === 'filter' ? 'analytics' : 'filter';
            setRightPanelPage(targetPage);
            setRightPanelOpen(true);
          }}
          title="Open bike filtering criteria panel"
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
        </button>

          <button
          className="panel-toggle-btn"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          title={rightPanelOpen ? "Collapse Right Panel" : "Expand Right Panel"}
          aria-label="Toggle Right Panel"
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            ></path>
          </svg>
        </button>

        <button
          className="layers-toggle-btn"
          onClick={onLogout}
          title="Logout"
          style={{ color: 'var(--color-danger)' }}
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
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}
