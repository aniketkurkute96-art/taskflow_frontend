import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: string;
  creator: { name: string };
  assignee?: { name: string };
  department?: { name: string };
  createdAt: string;
}

interface WaitingOnItem {
  id: string;
  forwardedAt: string;
  task: Task;
  toUser: { id: string; name: string; email: string };
}

const WaitingOn = () => {
  const [waitingOnTasks, setWaitingOnTasks] = useState<WaitingOnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWaitingOnTasks();
  }, []);

  const fetchWaitingOnTasks = async () => {
    try {
      const response = await api.get('/tasks/waiting-on');
      setWaitingOnTasks(response.data);
    } catch (error) {
      console.error('Error fetching waiting on tasks:', error);
      alert('Failed to load waiting on tasks');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Waiting On</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tasks you've forwarded to others - track their progress here
          </p>
        </div>

        {waitingOnTasks.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No forwarded tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't forwarded any tasks yet.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {waitingOnTasks.map((item) => (
                <li key={item.id}>
                  <div
                    onClick={() => navigate(`/tasks/${item.task.id}`)}
                    className="block hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {item.task.title}
                          </p>
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                item.task.status
                              )} mb-2 sm:mb-0`}
                            >
                              {item.task.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Waiting on: <strong className="ml-1">{item.toUser.name}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 flex-shrink-0 text-right">
                          <p className="text-sm text-gray-500">
                            Forwarded {format(new Date(item.forwardedAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(item.forwardedAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      {item.task.department && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {item.task.department.name}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WaitingOn;

