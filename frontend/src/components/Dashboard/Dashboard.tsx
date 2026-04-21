import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../services/api';
import { Stats } from '../../types';
import StatsCard from './StatsCard';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    admin.getStats()
      .then(r => setStats(r.data))
      .catch(() => setError('Failed to load stats'));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Jobs" value={stats.total_jobs} icon="💼" />
          <StatsCard title="Applications" value={stats.total_applications} icon="📝" />
          <StatsCard title="Unread Alerts" value={stats.unread_alerts} icon="🔔" />
          <StatsCard title="Active Users" value={stats.total_users} icon="👥" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/jobs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-blue-600 transition">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="font-medium">Search Jobs</div>
                <div className="text-xs text-gray-500">Browse all available positions</div>
              </div>
            </Link>
            <Link to="/applications" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 text-green-600 transition">
              <span className="text-2xl">📋</span>
              <div>
                <div className="font-medium">Track Applications</div>
                <div className="text-xs text-gray-500">Manage your job applications</div>
              </div>
            </Link>
            <Link to="/research" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 text-purple-600 transition">
              <span className="text-2xl">🎓</span>
              <div>
                <div className="font-medium">Research Opportunities</div>
                <div className="text-xs text-gray-500">PhD, postdoc, and academic roles</div>
              </div>
            </Link>
            <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-50 text-yellow-600 transition">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium">Analytics</div>
                <div className="text-xs text-gray-500">Job market insights and trends</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Set up your <Link to="/profile" className="text-blue-600 hover:underline">profile</Link> with your skills and experience</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span><Link to="/jobs" className="text-blue-600 hover:underline">Search jobs</Link> using keywords, role type, or location</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Click "Analyze Match" on any job to get an AI-powered match score</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Save jobs and track your <Link to="/applications" className="text-blue-600 hover:underline">applications</Link></span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
