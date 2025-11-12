import { useNavigate } from 'react-router-dom';
import type { ColumnConfig } from '../../stores/columnStore';
import type { TaskFlag } from '../../types/task';

interface Task {
  id: string;
  title: string;
  status: string;
  approvalStatus?: string;
  approvalType?: string;
  flag?: string;
  startDate?: string;
  dueDate?: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

interface TaskRowProps {
  task: Task;
  columns: ColumnConfig[];
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_approval: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const FLAG_ICONS: Record<TaskFlag, string> = {
  NONE: '○',
  HIGH: '⚑',
  BLOCKED: '⛔',
  CLIENT_WAIT: '⏳',
  INTERNAL_WAIT: '🕒',
};

const FLAG_COLORS: Record<TaskFlag, string> = {
  NONE: 'text-slate-400',
  HIGH: 'text-red-600',
  BLOCKED: 'text-red-700',
  CLIENT_WAIT: 'text-orange-600',
  INTERNAL_WAIT: 'text-yellow-600',
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

const TaskRow = ({ task, columns }: TaskRowProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tasks/${task.id}`);
  };

  const renderCell = (columnKey: string) => {
    switch (columnKey) {
      case 'title':
        return (
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-900 dark:text-slate-100">
              {task.title}
            </span>
          </div>
        );

      case 'status':
        return (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              STATUS_STYLES[task.status] || 'bg-slate-100 text-slate-800'
            }`}
          >
            {task.status.replace(/_/g, ' ')}
          </span>
        );

      case 'approvalStatus':
        if (!task.approvalStatus || task.approvalStatus === 'none') {
          return <span className="text-slate-400 text-sm">—</span>;
        }
        
        const approvalColors: Record<string, string> = {
          pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
          approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
          partial: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
        };

        return (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              approvalColors[task.approvalStatus] || 'bg-slate-100 text-slate-800'
            }`}
          >
            {task.approvalStatus.charAt(0).toUpperCase() + task.approvalStatus.slice(1)}
          </span>
        );

      case 'assignee':
        return (
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-sm text-slate-700 dark:text-slate-300">
                  {task.assignee.name}
                </span>
              </>
            ) : (
              <span className="text-slate-400">Unassigned</span>
            )}
          </div>
        );

      case 'flag':
        const flag = (task.flag as TaskFlag) || 'NONE';
        return (
          <div className="flex items-center gap-1">
            <span className={`text-lg ${FLAG_COLORS[flag]}`}>
              {FLAG_ICONS[flag]}
            </span>
            {flag !== 'NONE' && (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {flag.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        );

      case 'startDate':
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(task.startDate)}
          </span>
        );

      case 'dueDate':
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(task.dueDate)}
          </span>
        );

      case 'project':
        return task.project ? (
          <span className="truncate text-sm text-slate-600 dark:text-slate-400">
            {task.project.name}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        );

      case 'updatedAt':
        return (
          <span className="text-sm text-slate-500 dark:text-slate-500">
            {formatRelativeTime(task.updatedAt)}
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center border-b border-slate-200 bg-white px-4 py-2.5 transition-colors hover:bg-slate-50 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
    >
      {columns.map((column) => (
        <div
          key={column.key}
          style={{ width: column.width }}
          className="px-2 overflow-hidden"
        >
          {renderCell(column.key)}
        </div>
      ))}
    </div>
  );
};

export default TaskRow;

