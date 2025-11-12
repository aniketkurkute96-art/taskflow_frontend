import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Task, User } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { isEagleEyeUIEnabled } from '../lib/featureFlags';
import OverviewCard from '../components/OverviewCard';
import ActionButtons from '../components/ActionButtons';
import CommentsPanel from '../components/CommentsPanel';
import TimelinePanel from '../components/TimelinePanel';
import Badge from '../components/Badge';
import ModalConfirm from '../components/ModalConfirm';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [forwardUserId, setForwardUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [confirm, setConfirm] = useState<{ open: boolean; title?: string; action?: () => Promise<void> | void }>({ open: false });
  const eagleEye = isEagleEyeUIEnabled();

  useEffect(() => {
    if (id) {
      fetchTask();
      fetchUsers();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTimeline = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/tasks/${id}/timeline`);
      setTimeline(res.data);
    } catch (e) {
      // non-fatal
    }
  };

  const handleForward = async () => {
    if (!forwardUserId) {
      alert('Please select a user to forward to');
      return;
    }
    try {
      await api.post(`/tasks/${id}/forward`, { toUserId: forwardUserId });
      alert('Task forwarded successfully');
      fetchTask();
      setForwardUserId('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to forward task');
    }
  };

  const handleComplete = async () => {
    try {
      await api.post(`/tasks/${id}/complete`);
      alert('Task completed and sent for approval');
      await Promise.all([fetchTask(), fetchTimeline()]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to complete task');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      alert(`Task marked as ${status.replace('_', ' ')}`);
      await Promise.all([fetchTask(), fetchTimeline()]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update task status');
    }
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    
    switch (action) {
      case 'in_progress':
        handleStatusChange('in_progress');
        break;
      case 'complete':
        handleComplete();
        break;
      case 'reject':
        handleStatusChange('rejected');
        break;
      case 'forward':
        setShowForwardDialog(true);
        break;
      default:
        break;
    }
    
    // Reset dropdown
    setTimeout(() => setSelectedAction(''), 100);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/tasks/${id}/comments`, { content: comment });
      setComment('');
      fetchTask();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add comment');
    }
  };

  useEffect(() => {
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading task…</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-300">Task not found</p>
      </div>
    );
  }

  const isAssignee = task.assigneeId === currentUser?.id;

  const approvalBadgeVariant = (task.approvalStatus ?? 'none').toString();

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Left: 8/12 */}
        <section className="col-span-12 md:col-span-8 space-y-6">
          <OverviewCard
            title={task.title}
            subtitle={`Created ${format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}`}
            rightContent={
              <div className="flex items-center gap-3">
                <Badge variant={approvalBadgeVariant} />
                <button
                  onClick={() => navigate(`/tasks/${task.id}/edit`)}
                  className="px-3 py-1 rounded-md border border-violet-600 text-violet-200 hover:bg-violet-600/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600"
                  aria-label="Edit task"
                >
                  Edit
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Description</p>
                <p className="mt-1 text-sm text-slate-200 dark:text-slate-200">{task.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Approval Type</p>
                <p className="mt-1 text-sm text-slate-200 dark:text-slate-200">{task.approvalType}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Creator</p>
                <p className="mt-1 text-sm text-slate-200 dark:text-slate-200">{task.creator?.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Assignee</p>
                <p className="mt-1 text-sm text-slate-200 dark:text-slate-200">{task.assignee?.name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Department</p>
                <p className="mt-1 text-sm text-slate-200 dark:text-slate-200">{task.department?.name || 'N/A'}</p>
              </div>
              {task.amount && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
                  <p className="mt-1 text-sm text-slate-200 dark:text-slate-200">${task.amount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </OverviewCard>

          <ActionButtons
            task={task}
            canApprove={Boolean(currentUser)}
            onApprove={() =>
              setConfirm({
                open: true,
                title: 'Approve this task?',
                action: async () => {
                  await api.post(`/tasks/${id}/approve`);
                  await Promise.all([fetchTask(), fetchTimeline()]);
                },
              })
            }
            onReject={() =>
              setConfirm({
                open: true,
                title: 'Reject this task?',
                action: async () => {
                  await api.post(`/tasks/${id}/reject`);
                  await Promise.all([fetchTask(), fetchTimeline()]);
                },
              })
            }
            onForward={() => setShowForwardDialog(true)}
            onComplete={() =>
              setConfirm({
                open: true,
                title: 'Submit for approval?',
                action: async () => handleComplete(),
              })
            }
            onStart={() => handleStatusChange('in_progress')}
            onBackToOpen={() => handleStatusChange('open')}
          />

          {/* Forward Path */}
          {task.nodes && task.nodes.length > 0 && (
            <div className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Forward Path</h3>
              <ul className="divide-y divide-slate-700">
                {task.nodes.map((node) => (
                  <li key={node.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-200">
                        <span className="font-medium">{node.fromUser?.name}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="font-medium">{node.toUser?.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(new Date(node.forwardedAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Approval Queue */}
          {task.approvers && task.approvers.length > 0 && (
            <div className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Approval Queue</h3>
              <ul className="divide-y divide-slate-700">
                {task.approvers.map((approver) => (
                  <li key={approver.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-200">
                        <span className="font-medium">Level {approver.levelOrder}:</span>
                        <span className="ml-2">{approver.approver?.name}</span>
                      </div>
                      <Badge variant={approver.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Right: 4/12 */}
        <aside className="col-span-12 md:col-span-4 space-y-4">
          <div className="sticky top-20">
            <CommentsPanel
              taskId={task.id}
              comments={task.comments || []}
              commentValue={comment}
              onChangeComment={setComment}
              onSubmit={async (value) => {
                if (!value.trim()) return;
                await api.post(`/tasks/${id}/comments`, { content: value });
                setComment('');
                await fetchTask();
              }}
              headerExtras={<Badge variant={approvalBadgeVariant} />}
            />
          </div>
          <div className="sticky top-[calc(20px+380px)]">
            <TimelinePanel items={timeline} />
          </div>
        </aside>
      </div>

      {/* Forward Dialog */}
      {showForwardDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Forward Task</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select user to forward to:
              </label>
              <select
                className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={forwardUserId}
                onChange={(e) => setForwardUserId(e.target.value)}
              >
                <option value="">Select user</option>
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForwardDialog(false);
                  setForwardUserId('');
                }}
                className="px-4 py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleForward();
                  setShowForwardDialog(false);
                }}
                disabled={!forwardUserId}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      <ModalConfirm
        isOpen={confirm.open}
        title={confirm.title || 'Are you sure?'}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={async () => {
          if (confirm.action) await confirm.action();
          setConfirm({ open: false });
        }}
      />
    </div>
  );
};

export default TaskDetail;


