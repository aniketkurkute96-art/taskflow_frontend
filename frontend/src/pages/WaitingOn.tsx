import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [waitingOnTasks, setWaitingOnTasks] = useState<WaitingOnItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      pending_approval: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      completed: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badges[status] || badges.completed}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading forwarded tasks…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Delegated Work
            </p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Waiting On
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tasks you've forwarded to others — track their progress here
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {waitingOnTasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              No forwarded tasks
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You haven't forwarded any tasks yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {waitingOnTasks.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/tasks/${item.task.id}`)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Task Title */}
                      <h3 className="text-lg font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                        {item.task.title}
                      </h3>

                      {/* Status Badge */}
                      <div className="mt-2">
                        {getStatusBadge(item.task.status)}
                      </div>

                      {/* Task Details */}
                      <div className="mt-3 space-y-1.5 text-sm">
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          <svg
                            className="mr-2 h-4 w-4 flex-shrink-0 text-slate-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Waiting on <strong className="ml-1">{item.toUser.name}</strong>
                          <span className="mx-2 text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {item.toUser.email}
                          </span>
                        </div>

                        {item.task.department && (
                          <div className="flex items-center text-slate-600 dark:text-slate-300">
                            <svg
                              className="mr-2 h-4 w-4 flex-shrink-0 text-slate-400"
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

                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          <svg
                            className="mr-2 h-4 w-4 flex-shrink-0 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Forwarded on{' '}
                          <strong className="ml-1">
                            {format(new Date(item.forwardedAt), 'MMM dd, yyyy')}
                          </strong>
                          <span className="ml-2 text-slate-400">
                            at {format(new Date(item.forwardedAt), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => navigate(`/tasks/${item.task.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WaitingOn;

