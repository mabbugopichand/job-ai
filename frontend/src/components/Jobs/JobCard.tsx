import { Link } from 'react-router-dom';
import { Job } from '../../types';

export default function JobCard({ job }: { job: Job }) {
  const salary = job.salary_min && job.salary_max
    ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`
    : job.salary_min
    ? `From $${(job.salary_min / 1000).toFixed(0)}k`
    : null;

  const scoreColor = job.match_score !== undefined
    ? job.match_score >= 75 ? 'text-green-600 bg-green-50'
    : job.match_score >= 50 ? 'text-yellow-600 bg-yellow-50'
    : 'text-gray-500 bg-gray-50'
    : '';

  return (
    <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition border border-transparent hover:border-blue-100">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <Link to={`/jobs/${job.id}`} className="text-lg font-semibold text-blue-600 hover:underline line-clamp-1">
            {job.title}
          </Link>
          <p className="text-gray-700 font-medium mt-0.5">{job.company}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {job.location && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">📍 {job.location}</span>
            )}
            {job.work_mode && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded capitalize">💼 {job.work_mode}</span>
            )}
            {job.role_type && (
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">🏷️ {job.role_type}</span>
            )}
            {salary && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">💰 {salary}</span>
            )}
            {job.posted_date && (
              <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded">
                📅 {new Date(job.posted_date).toLocaleDateString()}
              </span>
            )}
          </div>
          {job.summary && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{job.summary}</p>
          )}
        </div>
        {job.match_score !== undefined && (
          <div className={`flex-shrink-0 text-center px-3 py-2 rounded-lg ${scoreColor}`}>
            <div className="text-2xl font-bold">{job.match_score}%</div>
            <div className="text-xs">Match</div>
          </div>
        )}
      </div>
    </div>
  );
}
