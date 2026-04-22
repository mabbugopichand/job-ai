import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import JobList from './components/Jobs/JobList';
import JobDetails from './components/Jobs/JobDetails';
import ApplicationList from './components/Applications/ApplicationList';
import ResearchOpportunities from './components/Research/ResearchOpportunities';
import ProfileSettings from './components/Profile/ProfileSettings';
import AlertsPage from './components/Alerts/AlertsPage';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import Login from './components/Auth/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex space-x-8">
                <Link to="/" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
                <Link to="/jobs" className="text-gray-700 hover:text-blue-600">Jobs</Link>
                <Link to="/research" className="text-gray-700 hover:text-blue-600">Research</Link>
                <Link to="/applications" className="text-gray-700 hover:text-blue-600">Applications</Link>
                <Link to="/alerts" className="text-gray-700 hover:text-blue-600">Alerts</Link>
                <Link to="/analytics" className="text-gray-700 hover:text-blue-600">Analytics</Link>
                <Link to="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
              </div>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/research" element={<ResearchOpportunities />} />
          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
