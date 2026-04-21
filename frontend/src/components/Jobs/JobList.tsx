import { useEffect, useState } from 'react';
import { jobs } from '../../services/api';
import { Job } from '../../types';
import JobCard from './JobCard';
import JobFilters from './JobFilters';

const PAGE_SIZE = 20;

export default function JobList() {
  const [jobList, setJobList] = useState<Job[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [filters, page]);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await jobs.search({ ...filters, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setJobList(response.data.jobs);
      setTotal(response.data.total);
    } catch (err: any) {
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Job Search</h1>
        <button onClick={loadJobs} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
      </div>

      <JobFilters onFilterChange={setFilters} />

      <div className="mt-4 mb-2 text-sm text-gray-500">
        {!loading && `Showing ${jobList.length} of ${total} jobs`}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4 mt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-lg shadow animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {jobList.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg">No jobs found. Try different filters or keywords.</p>
              </div>
            ) : (
              jobList.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded border disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                const p = totalPages <= 7 ? i : page < 4 ? i : page + i - 3;
                if (p >= totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 rounded border ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
                  >
                    {p + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded border disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
