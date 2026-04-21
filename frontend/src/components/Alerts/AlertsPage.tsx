import { useEffect, useState } from 'react';
import { alerts } from '../../services/api';
import { Alert } from '../../types';

export default function AlertsPage() {
  const [alertList, setAlertList] = useState<Alert[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alerts.getAll();
      setAlertList(response.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await alerts.markRead(id);
      loadAlerts();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Alerts</h1>
      
      <div className="space-y-4">
        {alertList.length === 0 ? (
          <p className="text-center text-gray-500">No alerts</p>
        ) : (
          alertList.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white p-6 rounded-lg shadow ${
                !alert.is_read ? 'border-l-4 border-blue-600' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{alert.title}</h3>
                  <p className="text-gray-600">{alert.company}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(alert.sent_at).toLocaleString()}
                  </p>
                  <p className="mt-2 text-gray-700">{alert.summary}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {alert.match_score}%
                  </div>
                  {!alert.is_read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
