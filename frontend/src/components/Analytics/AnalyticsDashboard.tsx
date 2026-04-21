import { useEffect, useState } from 'react';
import { jobs } from '../../services/api';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    jobs.analytics()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400 animate-pulse">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return null;

  const maxRoleCount = Math.max(...(data.roles || []).map((r: any) => Number(r.count)), 1);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Score Summary */}
      {data.score_summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-blue-600">{data.score_summary.total_scored || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Jobs Analyzed</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-purple-600">{data.score_summary.avg_score || 0}%</div>
            <div className="text-sm text-gray-500 mt-1">Avg Match Score</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow text-center">
            <div className="text-3xl font-bold text-green-600">{data.score_summary.high_matches || 0}</div>
            <div className="text-sm text-gray-500 mt-1">High Matches (75%+)</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs by Role */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Jobs by Role</h2>
          <div className="space-y-2">
            {(data.roles || []).map((r: any) => (
              <div key={r.role_type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{r.role_type || 'Unknown'}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(Number(r.count) / maxRoleCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Mode Distribution */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Work Mode Distribution</h2>
          <div className="space-y-3">
            {(data.work_modes || []).map((w: any) => {
              const total = data.work_modes.reduce((s: number, x: any) => s + Number(x.count), 0);
              const pct = total ? Math.round((Number(w.count) / total) * 100) : 0;
              const colors: any = { remote: 'bg-green-500', hybrid: 'bg-yellow-500', onsite: 'bg-blue-500' };
              return (
                <div key={w.work_mode}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{w.work_mode || 'Unknown'}</span>
                    <span className="font-medium">{w.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${colors[w.work_mode] || 'bg-gray-400'} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Salary by Role */}
        {data.salary_by_role?.length > 0 && (
          <div className="bg-white p-5 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Avg Salary by Role</h2>
            <div className="space-y-2">
              {data.salary_by_role.map((s: any) => (
                <div key={s.role_type} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                  <span className="text-gray-700">{s.role_type}</span>
                  <span className="font-medium text-green-700">
                    ${Math.round(s.avg_salary_min / 1000)}k – ${Math.round(s.avg_salary_max / 1000)}k
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Skills */}
        {data.top_skills?.length > 0 && (
          <div className="bg-white p-5 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Top In-Demand Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.top_skills.map((s: any) => (
                <span key={s.skill_name} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {s.skill_name} <span className="text-blue-400">({s.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Application Status */}
      {data.application_status?.length > 0 && (
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">My Application Pipeline</h2>
          <div className="flex gap-4 flex-wrap">
            {data.application_status.map((a: any) => {
              const colors: any = {
                applied: 'bg-blue-50 text-blue-700',
                screening: 'bg-yellow-50 text-yellow-700',
                interview: 'bg-purple-50 text-purple-700',
                offer: 'bg-green-50 text-green-700',
                rejected: 'bg-red-50 text-red-700',
              };
              return (
                <div key={a.status} className={`px-4 py-3 rounded-lg text-center ${colors[a.status] || 'bg-gray-50 text-gray-700'}`}>
                  <div className="text-2xl font-bold">{a.count}</div>
                  <div className="text-sm capitalize">{a.status}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Jobs over time */}
      {data.jobs_over_time?.length > 0 && (
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Jobs Added (Last 30 Days)</h2>
          <div className="flex items-end gap-1 h-24">
            {data.jobs_over_time.map((d: any) => {
              const max = Math.max(...data.jobs_over_time.map((x: any) => Number(x.count)), 1);
              const h = Math.max(4, (Number(d.count) / max) * 96);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count} jobs`}>
                  <div className="bg-blue-400 rounded-t w-full" style={{ height: `${h}px` }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{data.jobs_over_time[0]?.date}</span>
            <span>{data.jobs_over_time[data.jobs_over_time.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}
