import { useEffect, useState } from 'react';
import { jobs } from '../../services/api';
import { Job } from '../../types';
import JobCard from '../Jobs/JobCard';

export default function ResearchOpportunities() {
  const [researchJobs, setResearchJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadResearchJobs();
  }, []);

  const loadResearchJobs = async () => {
    try {
      const response = await jobs.search({
        role_type: 'PhD Position,Postdoctoral Researcher,Research Associate,Fellowship',
      });
      setResearchJobs(response.data.jobs);
    } catch (error) {
      console.error('Failed to load research jobs:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Research Opportunities</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-700">
          🎓 PhD positions, postdoctoral research, fellowships, and academic roles
        </p>
      </div>

      <div className="space-y-4">
        {researchJobs.length === 0 ? (
          <p className="text-center text-gray-500">No research opportunities found</p>
        ) : (
          researchJobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
