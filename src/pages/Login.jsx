import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const usernameRef = useRef();

  React.useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  const handlePasswordKey = (e) => {
    setCapsLock(e.getModifierState && e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid server response: ' + text);
      }
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid credentials');
      }
      login(data);
      navigate('/dashboard-layout');
    } catch (err) {
      setError('Login failed: ' + err.message);
    }
  };

  return (
    <div className="lux-login-container">
      <form className="lux-login-form" onSubmit={handleSubmit}>
        <h2 className="lux-title">Login</h2>
        {error && <div className="lux-error">{error}</div>}
        <div className="lux-input-group">
          <span className="lux-input-icon">
            <i className="bi bi-person"></i>
          </span>
          <input
            ref={usernameRef}
            className="lux-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="lux-input-group lux-password-group">
          <span className="lux-input-icon">
            <i className="bi bi-lock"></i>
          </span>
          <input
            className="lux-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={handlePasswordKey}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="lux-eye"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
          </button>
          {capsLock && <span className="lux-caps-warning">Caps Lock is ON</span>}
        </div>
        <button className="lux-btn" type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
