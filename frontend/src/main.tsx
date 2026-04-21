import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Auto-login: seed token so API calls work without login page
const initAuth = async () => {
  if (!localStorage.getItem('token')) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'password123' }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Auto-login failed:', e);
    }
  }
};

function Root() {
  const [ready, setReady] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!ready) {
      initAuth().then(() => setReady(true));
    }
  }, []);

  if (!ready) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
