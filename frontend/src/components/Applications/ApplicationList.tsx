import { useEffect, useState } from 'react';
import { applications } from '../../services/api';
import { Application } from '../../types';

export default function ApplicationList() {
  const [appList, setAppList] = useState<Application[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await applications.getAll();
      setAppList(response.data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await applications.update(id, { status });
      loadApplications();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>
      
      <div className="space-y-4">
        {appList.length === 0 ? (
          <p className="text-center text-gray-500">No applications yet</p>
        ) : (
          appList.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{app.title}</h3>
                  <p className="text-gray-600">{app.company}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Applied: {app.applied_date || 'N/A'}
                  </p>
                </div>
                <select
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
              {app.notes && (
                <p className="mt-3 text-sm text-gray-700">{app.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
