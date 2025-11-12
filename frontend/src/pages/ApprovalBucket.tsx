import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { TaskApprover } from '../types';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const ApprovalBucket = () => {
  const navigate = useNavigate();
  const [allApprovals, setAllApprovals] = useState<TaskApprover[]>([]);
  const [filteredApprovals, setFilteredApprovals] = useState<TaskApprover[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('pending');

  useEffect(() => {
    fetchApprovals();
  }, []);

  useEffect(() => {
    filterApprovals();
  }, [activeFilter, allApprovals]);

  const fetchApprovals = async () => {
    try {
      const response = await api.get('/tasks/approval/bucket?all=true');
      setAllApprovals(response.data);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApprovals = () => {
    if (activeFilter === 'all') {
      setFilteredApprovals(allApprovals);
    } else {
      setFilteredApprovals(allApprovals.filter((approval) => approval.status === activeFilter));
    }
  };

  const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await api.post(`/tasks/${taskId}/approve`);
        alert('Task approved successfully');
      } else {
        const reason = prompt('Reason for rejection (optional):');
        if (reason === null) return; // User cancelled
        await api.post(`/tasks/${taskId}/reject`, { reason });
        alert('Task rejected successfully');
      }
      fetchApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badges[status] || badges.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTaskStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      pending_approval: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${badges[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const getFilterCount = (filter: FilterStatus) => {
    if (filter === 'all') return allApprovals.length;
    return allApprovals.filter((a) => a.status === filter).length;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading approvals…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Approvals
            </p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Approval Bucket
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review and approve tasks assigned to you
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
              {[
                { key: 'pending' as FilterStatus, label: 'Pending' },
                { key: 'approved' as FilterStatus, label: 'Approved' },
                { key: 'rejected' as FilterStatus, label: 'Rejected' },
                { key: 'all' as FilterStatus, label: 'All' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                    activeFilter === filter.key
                      ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {filter.label}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      activeFilter === filter.key
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {getFilterCount(filter.key)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {filteredApprovals.length > 0 ? (
          <div className="space-y-4">
            {filteredApprovals.map((approval) => (
              <div
                key={approval.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Task Title */}
                      <button
                        onClick={() => navigate(`/tasks/${approval.task?.id}`)}
                        className="text-left text-lg font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {approval.task?.title}
                      </button>

                      {/* Status Badges */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {getStatusBadge(approval.status)}
                        {approval.task?.status && getTaskStatusBadge(approval.task.status)}
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                          Level {approval.levelOrder}
                        </span>
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
                          Created by <strong className="ml-1">{approval.task?.creator?.name}</strong>
                          {approval.task?.createdAt && (
                            <span className="ml-2 text-slate-400">
                              • {format(new Date(approval.task.createdAt), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>

                        {approval.task?.department && (
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
                            {approval.task.department.name}
                          </div>
                        )}

                        {approval.task?.amount && (
                          <div className="flex items-center text-slate-600 dark:text-slate-300">
                            <svg
                              className="mr-2 h-4 w-4 flex-shrink-0 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            ${approval.task.amount.toLocaleString()}
                          </div>
                        )}

                        {approval.task?.description && (
                          <p className="mt-2 line-clamp-2 text-slate-600 dark:text-slate-400">
                            {approval.task.description}
                          </p>
                        )}

                        {approval.actionAt && (
                          <div className="mt-1 text-xs text-slate-400">
                            Action taken: {format(new Date(approval.actionAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row gap-2 sm:flex-col sm:flex-shrink-0">
                      {approval.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(approval.task!.id, 'approve')}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:flex-initial"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(approval.task!.id, 'reject')}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 sm:flex-initial"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/tasks/${approval.task?.id}`)}
                        className="flex flex-1 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 sm:flex-initial"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              No {activeFilter !== 'all' ? activeFilter : ''} approvals
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeFilter === 'pending'
                ? "You don't have any pending approvals at the moment."
                : `No ${activeFilter !== 'all' ? activeFilter : ''} approvals found.`}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ApprovalBucket;



