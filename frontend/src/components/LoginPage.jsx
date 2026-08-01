import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VALID_CREDENTIALS = [
  { username: 'admin', password: 'admin123', name: 'Admin User' },
  { username: 'user', password: 'user123', name: 'Guest User' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  ////Lakshmana Sai
  var tempsai;
  var tote = 1;
  function sai(){
    console.log("temp not used function")
  }

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const user = VALID_CREDENTIALS.find(
      (c) => c.username === username && c.password === password
    );

    if (user) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', user.name);
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid username or password. Try admin/admin123');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-animation">
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <h1 className="login-title">GeoNexus</h1>
          <p className="login-subtitle">GIS Mapping Platform</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <p>Demo credentials: <strong>admin</strong> / <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}
