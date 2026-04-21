import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jobs, applications } from '../../services/api';
import { Job } from '../../types';

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const response = await jobs.getById(Number(id));
      setJob(response.data);
    } catch (error) {
      console.error('Failed to load job:', error);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await jobs.analyze(Number(id));
      await loadJob();
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    try {
      await applications.save(Number(id));
      alert('Job saved!');
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  if (!job) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
        <p className="text-xl text-gray-600 mb-4">{job.company}</p>
        
        <div className="flex gap-6 mb-6 text-sm text-gray-600">
          <span>📍 {job.location}</span>
          <span>💼 {job.work_mode}</span>
          <span>🏷️ {job.role_type}</span>
        </div>

        {job.match_score !== undefined && (
          <div className="bg-blue-50 p-4 rounded mb-6">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-blue-600">
                {job.match_score}%
              </div>
              <div>
                <p className="font-semibold">Match Score</p>
                <p className="text-sm text-gray-600">{job.summary}</p>
              </div>
            </div>
            {job.reasoning && (
              <p className="mt-3 text-sm text-gray-700">{job.reasoning}</p>
            )}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>

        {job.requirements && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Requirements</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Match'}
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Save Job
          </button>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              View Original
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
