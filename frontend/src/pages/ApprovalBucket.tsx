import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { TaskApprover } from '../types';
import { format } from 'date-fns';

const ApprovalBucket = () => {
  const [approvals, setApprovals] = useState<TaskApprover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await api.get('/tasks/approval/bucket');
      setApprovals(response.data);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Approval Bucket</h1>

        {approvals.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {approvals.map((approval) => (
                <li key={approval.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link
                          to={`/tasks/${approval.task?.id}`}
                          className="text-lg font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {approval.task?.title}
                        </Link>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>
                            Created by: {approval.task?.creator?.name} •{' '}
                            {approval.task?.createdAt &&
                              format(new Date(approval.task.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {approval.task?.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {approval.task.description}
                          </p>
                        )}
                        {approval.task?.amount && (
                          <p className="mt-1 text-sm text-gray-600">
                            Amount: ${approval.task.amount.toLocaleString()}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Level {approval.levelOrder}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleAction(approval.task!.id, 'approve')}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(approval.task!.id, 'reject')}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No pending approvals</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ApprovalBucket;



