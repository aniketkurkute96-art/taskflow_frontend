import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import Timeline from '../components/Timeline';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TaskUser {
  id: string;
  name: string;
  email: string;
}

interface TaskDepartment {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  approvalStatus?: string;
  approvalType: string;
  priorityFlag?: string;
  priorityNotes?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  recurrenceType?: string | null;
  recurrenceRule?: string | null;
  amount?: number | null;
  createdAt: string;
  updatedAt: string;
  creator: TaskUser;
  assignee?: TaskUser | null;
  department?: TaskDepartment | null;
}

interface TimelineItem {
  id: string;
  type: 'activity' | 'comment';
  action: string;
  description: string;
  user?: TaskUser | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

interface Attachment {
  id: string;
  filename: string;
  filepath: string;
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt: string;
  user: TaskUser;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

const SectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <header className="border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </header>
    <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
  </section>
);

const priorityLabel = (flag?: string | null) => {
  if (!flag || flag === 'NONE') return 'None';
  return flag.replace(/_/g, ' ').toLowerCase();
};

const approvalBadgeStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  partial: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  none: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
};

const statusBadgeStyles: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  pending_approval: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return '—';
  try {
    return format(new Date(value), withTime ? 'MMM dd, yyyy • HH:mm' : 'MMM dd, yyyy');
  } catch (error) {
    return value;
  }
};

const parseRecurrenceSummary = (type?: string | null, rule?: string | null) => {
  if (!type || type === 'none') return 'Does not repeat';

  const base = type.charAt(0).toUpperCase() + type.slice(1);
  if (!rule) return `${base} recurrence`;

  try {
    const parsed = JSON.parse(rule);
    const interval = parsed.interval || 1;
    if (type === 'daily') {
      return `Every ${interval} day${interval > 1 ? 's' : ''}`;
    }
    if (type === 'weekly') {
      const days = (parsed.weekdays || [])
        .map((day: string) => day.slice(0, 2))
        .join(', ');
      return `Every ${interval} week${interval > 1 ? 's' : ''}` + (days ? ` on ${days}` : '');
    }
    if (type === 'monthly') {
      const day = parsed.monthlyDay || 1;
      return `Every ${interval} month${interval > 1 ? 's' : ''} on day ${day}`;
    }
    return `${base} recurrence`;
  } catch (error) {
    return `${base} recurrence`;
  }
};

const resolveAttachmentUrl = (filepath: string) => {
  if (!filepath) return '#';
  if (filepath.startsWith('http')) return filepath;
  const base = (import.meta.env.VITE_API_URL || api.defaults.baseURL || '').replace(/\/$/, '');
  const baseWithoutApi = base.replace(/\/api$/, '');
  const normalizedPath = filepath.startsWith('/') ? filepath : `/${filepath}`;
  return `${baseWithoutApi}${normalizedPath}`;
};

const TaskDetailNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [forwardUserId, setForwardUserId] = useState('');
  const [forwardBusy, setForwardBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchTask(), fetchTimeline(), fetchAttachments(), fetchUsers()]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [id]);

  const fetchTask = async () => {
    if (!id) return;
    const response = await api.get(`/tasks/${id}`);
    setTask(response.data);
  };

  const fetchTimeline = async () => {
    if (!id) return;
    const response = await api.get(`/tasks/${id}/timeline`);
    setTimeline(response.data);
  };

  const fetchAttachments = async () => {
    if (!id) return;
    const response = await api.get(`/tasks/${id}/attachments`);
    setAttachments(response.data);
  };

  const fetchUsers = async () => {
    const response = await api.get('/users');
    setUsers(response.data);
  };

  const isAssignee = task && user?.id === task.assignee?.id;
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || isAssignee;

  const availableActions = () => {
    if (!task || !isAssignee) return [];
    if (task.status === 'open') {
      return [
        {
          label: 'Start Task',
          onClick: () => updateStatus('in_progress'),
        },
      ];
    }
    if (task.status === 'in_progress') {
      return [
        {
          label: 'Submit for Approval',
          onClick: () => submitForApproval(),
        },
        {
          label: 'Forward Task',
          onClick: () => setShowForward(true),
        },
        {
          label: 'Mark Back to Open',
          onClick: () => updateStatus('open'),
        },
      ];
    }
    return [];
  };

  const submitForApproval = async () => {
    if (!id) return;
    try {
      await api.post(`/tasks/${id}/complete`);
      await Promise.all([fetchTask(), fetchTimeline()]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit for approval');
    }
  };

  const updateStatus = async (status: string) => {
    if (!id) return;
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      await Promise.all([fetchTask(), fetchTimeline()]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || !id) return;
    try {
      setCommentBusy(true);
      await api.post(`/tasks/${id}/comments`, { content: comment.trim() });
      setComment('');
      await fetchTimeline();
    } catch (error) {
      alert('Failed to add comment');
    } finally {
      setCommentBusy(false);
    }
  };

  const handleForwardTask = async () => {
    if (!id || !forwardUserId) {
      alert('Please select a user to forward to');
      return;
    }
    try {
      setForwardBusy(true);
      await api.post(`/tasks/${id}/forward`, { toUserId: forwardUserId });
      setShowForward(false);
      setForwardUserId('');
      await Promise.all([fetchTask(), fetchTimeline()]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to forward task');
    } finally {
      setForwardBusy(false);
    }
  };

  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || !id) return;
    try {
      setUploadBusy(true);
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.append('file', file);
        await api.post(`/tasks/${id}/attachments`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await Promise.all([fetchAttachments(), fetchTimeline()]);
    } catch (error) {
      alert('Failed to upload attachment');
    } finally {
      setUploadBusy(false);
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    if (!id) return;
    if (!confirm('Remove this attachment?')) return;
    try {
      await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
      await Promise.all([fetchAttachments(), fetchTimeline()]);
    } catch (error) {
      alert('Failed to remove attachment');
    }
  };

  if (isLoading || !task) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading task…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-xs uppercase tracking-wide text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {task.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                statusBadgeStyles[task.status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
              }`}
            >
              {task.status.replace(/_/g, ' ')}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                approvalBadgeStyles[task.approvalStatus ?? 'none'] || approvalBadgeStyles.none
              }`}
            >
              {`Approval: ${(task.approvalStatus ?? 'none').replace(/_/g, ' ')}`}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6 pb-24 lg:pb-0">
          <SectionCard title="Overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Owner</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {task.creator.name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Assignee</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {task.assignee?.name || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Department</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {task.department?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Budget</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formatCurrency(task.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Start Date</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formatDate(task.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Due Date</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formatDate(task.dueDate)}
                </p>
              </div>
            </div>
            {task.description && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {task.description}
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Activity"
            subtitle="Comments and timeline updates. (Mobile refinement planned.)"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
              <form onSubmit={handleAddComment} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Add a comment</p>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  placeholder="Share progress, ask questions, or mention teammates…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentBusy || !comment.trim()}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {commentBusy ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </form>

              <div className="max-h-[620px] overflow-y-auto pr-1">
                <Timeline items={timeline} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Priority & Recurrence">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Priority</p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
                  {priorityLabel(task.priorityFlag)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Repeats</p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {parseRecurrenceSummary(task.recurrenceType, task.recurrenceRule)}
                </p>
              </div>
            </div>
            {task.priorityNotes && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                {task.priorityNotes}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Attachments" subtitle="Share invoices, briefs, or other context.">
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-400/70">
                <span className="font-medium text-indigo-600 dark:text-indigo-300">
                  {uploadBusy ? 'Uploading…' : 'Drag & drop or click to upload'}
                </span>
                <span className="mt-1 text-xs">PDF, DOCX, XLSX, PNG up to 25MB</span>
                <input
                  type="file"
                  multiple
                  onChange={(event) => handleAttachmentUpload(event.target.files)}
                  className="hidden"
                  disabled={uploadBusy}
                />
              </label>

              {attachments.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No attachments yet
                </p>
              )}

              <ul className="space-y-3">
                {attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-slate-400">
                        Uploaded by {attachment.user.name} on {formatDate(attachment.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={resolveAttachmentUrl(attachment.filepath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
                      >
                        Download
                      </a>
                      {(isAdmin || user?.id === attachment.user.id) && (
                        <button
                          type="button"
                          onClick={() => handleAttachmentDelete(attachment.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-400 dark:hover:text-rose-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </SectionCard>
        </div>

        <aside className="flex w-full flex-shrink-0 flex-col gap-6 lg:w-80">
          <SectionCard title="Fast Actions">
            {availableActions().length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No actions available.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {availableActions().map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Metadata">
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex justify-between">
                <span>Created</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(task.createdAt, true)}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Updated</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(task.updatedAt, true)}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Approval Type</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {task.approvalType.replace(/_/g, ' ')}
                </span>
              </li>
            </ul>
          </SectionCard>

          {showForward && (
            <SectionCard title="Forward Task" subtitle="Send this task to another teammate.">
              <div className="space-y-3">
                <select
                  value={forwardUserId}
                  onChange={(event) => setForwardUserId(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select teammate…</option>
                  {users
                    .filter((option) => option.id !== user?.id)
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.email})
                      </option>
                    ))}
                </select>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForward(false);
                      setForwardUserId('');
                    }}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleForwardTask}
                    disabled={forwardBusy || !forwardUserId}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forwardBusy ? 'Forwarding…' : 'Forward'}
                  </button>
                </div>
              </div>
            </SectionCard>
          )}
        </aside>
      </main>
    </div>
  );
};

export default TaskDetailNew;


