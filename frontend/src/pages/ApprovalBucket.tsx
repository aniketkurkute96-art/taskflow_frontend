import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { TaskApprover } from '../types';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const ApprovalBucket = () => {
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
      // Fetch all approvals for the current user (pending, approved, rejected)
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
      setFilteredApprovals(allApprovals.filter(approval => approval.status === activeFilter));
    }
  };

  const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await api.post(`/tasks/${taskId}/approve`);
        alert('Task approved successfully');
      } else {
        await api.post(`/tasks/${taskId}/reject`);
        alert('Task rejected successfully');
      }
      fetchApprovals();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getTaskStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-800' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      pending_approval: { bg: 'bg-purple-100', text: 'text-purple-800' },
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${badge.bg} ${badge.text}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getFilterCount = (filter: FilterStatus) => {
    if (filter === 'all') return allApprovals.length;
    return allApprovals.filter(a => a.status === filter).length;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approval Bucket</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and approve tasks assigned to you
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'pending' as FilterStatus, label: 'Pending Approval' },
                { key: 'approved' as FilterStatus, label: 'Approved' },
                { key: 'rejected' as FilterStatus, label: 'Rejected' },
                { key: 'all' as FilterStatus, label: 'All' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeFilter === filter.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {filter.label}
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeFilter === filter.key
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {getFilterCount(filter.key)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {filteredApprovals.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredApprovals.map((approval) => (
                <li key={approval.id} className="hover:bg-gray-50 transition">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Task Title and Status */}
                        <div className="flex items-center space-x-3 mb-2">
                          <Link
                            to={`/tasks/${approval.task?.id}`}
                            className="text-lg font-semibold text-indigo-600 hover:text-indigo-900 truncate"
                          >
                            {approval.task?.title}
                          </Link>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Approval Status */}
                          {getStatusBadge(approval.status)}
                          
                          {/* Task Status */}
                          {approval.task?.status && getTaskStatusBadge(approval.task.status)}
                          
                          {/* Approval Level */}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Approval Level {approval.levelOrder}
                          </span>
                        </div>

                        {/* Task Details */}
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Created by: <strong className="ml-1">{approval.task?.creator?.name}</strong>
                            {approval.task?.createdAt && (
                              <span className="ml-2">
                                • {format(new Date(approval.task.createdAt), 'MMM d, yyyy HH:mm')}
                              </span>
                            )}
                          </div>

                          {approval.task?.department && (
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                              </svg>
                              Department: <strong className="ml-1">{approval.task.department.name}</strong>
                            </div>
                          )}

                          {approval.task?.amount && (
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Amount: <strong className="ml-1">${approval.task.amount.toLocaleString()}</strong>
                            </div>
                          )}

                          {approval.task?.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {approval.task.description}
                            </p>
                          )}

                          {/* Action timestamp if approved/rejected */}
                          {approval.actionAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Action taken: {format(new Date(approval.actionAt), 'MMM d, yyyy HH:mm')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - Only show for pending */}
                      {approval.status === 'pending' && (
                        <div className="ml-4 flex-shrink-0 flex flex-col space-y-2">
                          <button
                            onClick={() => handleAction(approval.task!.id, 'approve')}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(approval.task!.id, 'reject')}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                          <Link
                            to={`/tasks/${approval.task?.id}`}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-center"
                          >
                            View Details
                          </Link>
                        </div>
                      )}
                      
                      {/* View button for approved/rejected */}
                      {approval.status !== 'pending' && (
                        <div className="ml-4 flex-shrink-0">
                          <Link
                            to={`/tasks/${approval.task?.id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeFilter} approvals</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeFilter === 'pending' 
                ? "You don't have any pending approvals at the moment." 
                : `No ${activeFilter} approvals found.`}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ApprovalBucket;



