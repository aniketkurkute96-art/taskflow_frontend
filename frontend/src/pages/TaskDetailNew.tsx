import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  amount?: number;
  creator: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  user: { id: string; name: string };
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  user?: { id: string; name: string };
  createdAt: string;
}

interface Attachment {
  id: string;
  filename: string;
  filepath: string;
  fileSize?: number;
  user: { id: string; name: string };
  createdAt: string;
}

const TaskDetailNew = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetchTask();
    fetchComments();
    fetchActivityLogs();
    fetchAttachments();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      alert('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const response = await api.get(`/tasks/${id}/activity`);
      setActivityLogs(response.data);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await api.get(`/tasks/${id}/attachments`);
      setAttachments(response.data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await api.post(`/tasks/${id}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
      fetchActivityLogs(); // Refresh activity log
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      fetchTask();
      fetchActivityLogs();
      alert('Status updated successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
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

  if (!task) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Task not found</p>
        </div>
      </Layout>
    );
  }

  const isAssignee = user?.id === task.assignee?.id;
  const isCreator = user?.id === task.creator?.id;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
              </div>

              {/* Description */}
              {task.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{task.description}</p>
                </div>
              )}
            </div>

            {/* Task Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="text-sm font-medium text-gray-900">{task.creator.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.assignee?.name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.department?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.amount ? `$${task.amount.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                {task.startDate && (
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(task.startDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(task.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {attachment.user.name} on {format(new Date(attachment.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm">Download</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isAssignee && ['open', 'in_progress'].includes(task.status) && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="flex space-x-3">
                  {task.status === 'open' && (
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Start Task
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('pending_approval')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Submit for Approval
                      </button>
                      <button
                        onClick={() => handleStatusChange('rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE - Activity Log & Comments */}
          <div className="lg:col-span-1 space-y-6">
            {/* Activity Log */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">No activity yet</p>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-indigo-500 pl-4">
                      <p className="text-sm font-medium text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {log.user?.name || 'System'} • {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
              
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-3 last:border-0">
                      <p className="text-sm text-gray-900">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.user.name} • {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskDetailNew;

