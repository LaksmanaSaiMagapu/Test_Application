// REQ-AUTH-001: login page renders, rejects bad credentials, accepts admin/admin123
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App'

// MapLibre needs WebGL, which jsdom does not provide — stub the map for DOM tests
vi.mock('../src/components/MapComponent', () => ({
  default: () => <div data-testid="map-stub" />,
}))

const fillAndSubmit = (username, password) => {
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: username } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('test_loginPage_initialRender_showsCardFieldsAndButton', () => {
    render(<App />)
    expect(document.querySelector('.login-card')).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('test_login_wrongPassword_showsErrorAndStaysOnLogin', () => {
    render(<App />)
    fillAndSubmit('admin', 'wrongpass')
    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
    expect(localStorage.getItem('isAuthenticated')).toBeNull()
    expect(document.querySelector('.login-card')).toBeInTheDocument()
  })

  it('test_login_emptyFields_showsError', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
    expect(localStorage.getItem('isAuthenticated')).toBeNull()
  })

  it('test_login_validCredentials_setsAuthAndNavigatesToDashboard', () => {
    render(<App />)
    fillAndSubmit('admin', 'admin123')
    expect(localStorage.getItem('isAuthenticated')).toBe('true')
    expect(localStorage.getItem('userName')).toBe('Admin User')
    // dashboard chrome is up once navigation happened
    expect(screen.getByText('GeoNexus')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('test_login_guestCredentials_alsoAccepted', () => {
    render(<App />)
    fillAndSubmit('user', 'user123')
    expect(localStorage.getItem('isAuthenticated')).toBe('true')
    expect(localStorage.getItem('userName')).toBe('Guest User')
  })

  // INTENTIONAL FAILURE for pipeline/ThoroTest demo — expects a "Forgot password"
  // link the login page does not have
  it('test_loginPage_forgotPasswordLink_isPresent', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })
})
