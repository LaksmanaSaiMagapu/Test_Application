// REQ-DASH-001: after login the dashboard renders its shell (header, tabs, panels)
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

vi.mock('../src/components/MapComponent', () => ({
  default: () => <div data-testid="map-stub" />,
}))

describe('Dashboard visibility after login', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('test_dashboard_unauthenticated_redirectsToLogin', () => {
    window.history.pushState({}, '', '/dashboard')
    render(<App />)
    expect(document.querySelector('.login-card')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument()
  })

  it('test_dashboard_afterLogin_showsHeaderBrandAndLogout', () => {
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userName', 'Admin User')
    window.history.pushState({}, '', '/dashboard')
    render(<App />)
    expect(screen.getByText('GeoNexus')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('test_dashboard_afterLogin_showsToolTabs', () => {
    localStorage.setItem('isAuthenticated', 'true')
    window.history.pushState({}, '', '/dashboard')
    render(<App />)
    expect(screen.getByRole('button', { name: 'Area' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manual Track' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Route' })).toBeInTheDocument()
  })

  it('test_dashboard_afterLogin_showsMapAndPanels', () => {
    localStorage.setItem('isAuthenticated', 'true')
    window.history.pushState({}, '', '/dashboard')
    render(<App />)
    expect(screen.getByTestId('map-stub')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /layers/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument()
  })
})
