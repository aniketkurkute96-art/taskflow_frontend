import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnSizingState,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useColumnStore } from '../../stores/columnStore';
import { useFilterStore } from '../../stores/filterStore';
import { useAuth } from '../../contexts/AuthContext';
import TasksToolbar from './TasksToolbar';
import api from '../../services/api';
import type { TaskFlag } from '../../types/task';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type TaskRow = {
  id: string;
  title: string;
  description?: string;
  status: string;
  approvalStatus?: string;
  approvalType?: string;
  flag?: TaskFlag | null;
  startDate?: string | null;
  dueDate?: string | null;
  updatedAt: string;
  canEdit?: boolean;
  assignee?: { id: string; name: string; email: string } | null;
  project?: { id: string; name: string } | null;
};

type UserOption = { id: string; name: string; email: string };

const columnHelper = createColumnHelper<TaskRow>();

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  open: 'bg-slate-700/70 text-slate-200',
  in_progress: 'bg-amber-300 text-slate-900',
  pending_approval: 'bg-violet-300 text-slate-900',
  approved: 'bg-emerald-300 text-emerald-900',
  rejected: 'bg-rose-400 text-white',
};

const FLAG_LABELS: Record<TaskFlag, string> = {
  NONE: 'None',
  HIGH: 'High Priority',
  BLOCKED: 'Blocked',
  CLIENT_WAIT: 'Client Wait',
  INTERNAL_WAIT: 'Internal Wait',
};

const SpinnerMini = ({ className = '' }: { className?: string }) => (
  <span
    className={cn(
      'inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/80 border-t-transparent',
      className
    )}
  />
);

const CheckMini = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4 text-emerald-400', className)}
  >
    <path d="M16.2 5.6 8.8 13l-3-3" />
  </svg>
);

const ChevronDownMini = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4', className)}
  >
    <path d="M5 7.5 10 12 15 7.5" />
  </svg>
);

const CalendarIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4', className)}
  >
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M16 2v4.5M8 2v4.5M3 10.5h18" />
  </svg>
);

const EditIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4', className)}
  >
    <path d="M12 20h9" />
    <path d="m16.5 3.5 4 4L7 21H3v-4z" />
  </svg>
);

const ViewIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4', className)}
  >
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DeleteIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4', className)}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const calc = () => setIsMobile(window.innerWidth <= 900);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return isMobile;
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

type TitleCellProps = {
  task: TaskRow;
  canEdit: boolean;
  busy: boolean;
  justSaved: boolean;
  onSave: (value: string) => void;
};

const TitleCell = ({ task, canEdit, busy, justSaved, onSave }: TitleCellProps) => {
  const [value, setValue] = useState(task.title);

  useEffect(() => {
    setValue(task.title);
  }, [task.title]);

  const handleCommit = () => {
    if (!canEdit) return;
    const trimmed = value.trim();
    if (trimmed && trimmed !== task.title) {
      onSave(trimmed);
    } else {
      setValue(task.title);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={handleCommit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              setValue(task.title);
              event.currentTarget.blur();
            }
          }}
          disabled={!canEdit || busy}
          className={cn(
            'w-full truncate rounded-md border border-transparent bg-transparent text-sm font-medium text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400',
            (!canEdit || busy) && 'cursor-not-allowed opacity-70'
          )}
          placeholder="Task title"
        />
        {busy && <SpinnerMini />}
        {!busy && justSaved && <CheckMini />}
      </div>
      {task.project?.name && (
        <span className="text-xs text-slate-400">{task.project.name}</span>
      )}
    </div>
  );
};

type StatusCellProps = {
  task: TaskRow;
  canEdit: boolean;
  busy: boolean;
  justSaved: boolean;
  onChange: (value: string) => void;
};

const StatusCell = ({ task, canEdit, busy, justSaved, onChange }: StatusCellProps) => (
  <div className="flex items-center gap-2">
    <select
      value={task.status}
      onChange={(event) => onChange(event.target.value)}
      disabled={!canEdit || busy}
      className={cn(
        'rounded-lg border border-transparent bg-slate-800/60 px-3 py-1.5 text-sm font-medium text-slate-100 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400',
        (!canEdit || busy) && 'cursor-not-allowed opacity-60'
      )}
    >
      {Object.entries(STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
    {busy && <SpinnerMini />}
    {!busy && justSaved && <CheckMini />}
  </div>
);

type AssigneeCellProps = {
  task: TaskRow;
  canEdit: boolean;
  busy: boolean;
  justSaved: boolean;
  users: UserOption[];
  onChange: (value: string | null) => void;
};

const AssigneeCell = ({
  task,
  canEdit,
  busy,
  justSaved,
  users,
  onChange,
}: AssigneeCellProps) => (
  <div className="flex items-center gap-2">
    <select
      value={task.assignee?.id ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
      disabled={!canEdit || busy}
      className={cn(
        'w-full rounded-lg border border-transparent bg-slate-800/60 px-3 py-1.5 text-sm text-slate-100 transition hover:bg-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400',
        (!canEdit || busy) && 'cursor-not-allowed opacity-60'
      )}
    >
      <option value="">Unassigned</option>
      {users.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
    {busy && <SpinnerMini />}
    {!busy && justSaved && <CheckMini />}
  </div>
);

type FlagCellProps = {
  task: TaskRow;
  canEdit: boolean;
  busy: boolean;
  justSaved: boolean;
  onChange: (value: TaskFlag) => void;
};

const FlagCell = ({ task, canEdit, busy, justSaved, onChange }: FlagCellProps) => {
  const value = (task.flag ?? 'NONE') as TaskFlag;
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TaskFlag)}
        disabled={!canEdit || busy}
        className={cn(
          'rounded-lg border border-transparent bg-slate-800/60 px-3 py-1.5 text-sm text-slate-100 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400',
          (!canEdit || busy) && 'cursor-not-allowed opacity-60'
        )}
      >
        {Object.entries(FLAG_LABELS).map(([flagKey, label]) => (
          <option key={flagKey} value={flagKey}>
            {label}
          </option>
        ))}
      </select>
      {busy && <SpinnerMini />}
      {!busy && justSaved && <CheckMini />}
    </div>
  );
};

type DueDateCellProps = {
  task: TaskRow;
  canEdit: boolean;
  busy: boolean;
  justSaved: boolean;
  onChange: (value: string | null) => void;
};

const DueDateCell = ({ task, canEdit, busy, justSaved, onChange }: DueDateCellProps) => {
  const value = task.dueDate ? task.dueDate.slice(0, 10) : '';
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={value}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw ? new Date(`${raw}T00:00:00`).toISOString() : null);
        }}
        disabled={!canEdit || busy}
        className={cn(
          'rounded-lg border border-transparent bg-slate-800/60 px-3 py-1.5 text-sm text-slate-100 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400',
          (!canEdit || busy) && 'cursor-not-allowed opacity-60'
        )}
      />
      {busy && <SpinnerMini />}
      {!busy && justSaved && <CheckMini />}
    </div>
  );
};

const TasksTableView = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState<Record<string, string | null>>({});
  const [lastSavedField, setLastSavedField] = useState<Record<string, string | null>>({});

  const {
    columns: storedColumns,
    setColumnWidth,
    reorderColumns,
  } = useColumnStore();

  const filterStore = useFilterStore();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [tasksRes, usersRes] = await Promise.all([api.get('/tasks'), api.get('/users')]);
        const rows: TaskRow[] = tasksRes.data.map((task: TaskRow) => ({
          ...task,
          canEdit:
            user?.role === 'admin' ||
            (task.assignee && task.assignee.id === user?.id),
        }));
        setTasks(rows);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Failed to load tasks/users', error);
        enqueueSnackbar('Unable to load tasks. Please try again.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [enqueueSnackbar, user]);

  const visibleColumnOrder = useMemo(() => {
    return storedColumns
      .filter((col) => col.visible)
      .sort((a, b) => a.order - b.order)
      .map((col) => col.key);
  }, [storedColumns]);

  const columnSizingState = useMemo(() => {
    return storedColumns.reduce<ColumnSizingState>((acc, column) => {
      acc[column.key] = column.width;
      return acc;
    }, {});
  }, [storedColumns]);

  const columnVisibilityState = useMemo(() => {
    return storedColumns.reduce<Record<string, boolean>>((acc, column) => {
      acc[column.key] = column.visible;
      return acc;
    }, {});
  }, [storedColumns]);

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(visibleColumnOrder);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(columnSizingState);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setColumnOrder(visibleColumnOrder);
  }, [visibleColumnOrder]);

  useEffect(() => {
    setColumnSizing(columnSizingState);
  }, [columnSizingState]);

  useEffect(() => {
    Object.entries(columnSizing).forEach(([key, size]) => {
      if (typeof size === 'number') {
        setColumnWidth(key, Math.max(90, Math.round(size)));
      }
    });
  }, [columnSizing, setColumnWidth]);

  const filteredTasks = useMemo(() => {
    const {
      searchQuery,
      selectedStatuses,
      selectedAssignees,
      selectedFlags,
      startDateFrom,
      startDateTo,
      dueDateFrom,
      dueDateTo,
    } = filterStore;

    return tasks.filter((task) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          task.title.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q) ||
          task.assignee?.name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) {
        return false;
      }
      if (selectedAssignees.length > 0) {
        const assigneeId = task.assignee?.id;
        if (!assigneeId || !selectedAssignees.includes(assigneeId)) return false;
      }
      if (selectedFlags.length > 0) {
        const flagKey = (task.flag ?? 'NONE') as TaskFlag;
        if (!selectedFlags.includes(flagKey)) return false;
      }
      if (startDateFrom && task.startDate && task.startDate < startDateFrom) return false;
      if (startDateTo && task.startDate && task.startDate > startDateTo) return false;
      if (dueDateFrom && task.dueDate && task.dueDate < dueDateFrom) return false;
      if (dueDateTo && task.dueDate && task.dueDate > dueDateTo) return false;
      return true;
    });
  }, [tasks, filterStore]);

  const patchTask = async (taskId: string, patch: Partial<TaskRow>, fieldKey: string) => {
    setSavingMap((prev) => ({ ...prev, [taskId]: fieldKey }));
    setLastSavedField((prev) => ({ ...prev, [taskId]: null }));
    try {
      await api.patch(`/tasks/${taskId}`, patch);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
      );
      setLastSavedField((prev) => ({ ...prev, [taskId]: fieldKey }));
      enqueueSnackbar('Task updated', { variant: 'success' });
    } catch (error: any) {
      console.error('Failed to update task', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to update task', { variant: 'error' });
    } finally {
      setSavingMap((prev) => ({ ...prev, [taskId]: null }));
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    setSavingMap((prev) => ({ ...prev, [taskId]: 'status' }));
    setLastSavedField((prev) => ({ ...prev, [taskId]: null }));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task))
      );
      setLastSavedField((prev) => ({ ...prev, [taskId]: 'status' }));
      enqueueSnackbar('Status updated', { variant: 'success' });
    } catch (error: any) {
      console.error('Failed to update status', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to update status', { variant: 'error' });
    } finally {
      setSavingMap((prev) => ({ ...prev, [taskId]: null }));
    }
  };

  const updateAssignee = async (taskId: string, assigneeId: string | null) => {
    setSavingMap((prev) => ({ ...prev, [taskId]: 'assignee' }));
    setLastSavedField((prev) => ({ ...prev, [taskId]: null }));
    try {
      await api.patch(`/tasks/${taskId}`, { assigneeId });
      const nextAssignee = assigneeId ? users.find((user) => user.id === assigneeId) ?? null : null;
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, assignee: nextAssignee } : task))
      );
      setLastSavedField((prev) => ({ ...prev, [taskId]: 'assignee' }));
      enqueueSnackbar('Assignee updated', { variant: 'success' });
    } catch (error: any) {
      console.error('Failed to update assignee', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to update assignee', { variant: 'error' });
    } finally {
      setSavingMap((prev) => ({ ...prev, [taskId]: null }));
    }
  };

  const updateDueDate = async (taskId: string, dueDate: string | null) => {
    setSavingMap((prev) => ({ ...prev, [taskId]: 'dueDate' }));
    setLastSavedField((prev) => ({ ...prev, [taskId]: null }));
    try {
      await api.patch(`/tasks/${taskId}`, { dueDate });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, dueDate } : task))
      );
      setLastSavedField((prev) => ({ ...prev, [taskId]: 'dueDate' }));
      enqueueSnackbar('Due date updated', { variant: 'success' });
    } catch (error: any) {
      console.error('Failed to update due date', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to update due date', { variant: 'error' });
    } finally {
      setSavingMap((prev) => ({ ...prev, [taskId]: null }));
    }
  };

  const updateFlag = async (taskId: string, flag: TaskFlag | null) => {
    setSavingMap((prev) => ({ ...prev, [taskId]: 'flag' }));
    setLastSavedField((prev) => ({ ...prev, [taskId]: null }));
    try {
      await api.patch(`/tasks/${taskId}`, { flag });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, flag: flag ?? null } : task))
      );
      setLastSavedField((prev) => ({ ...prev, [taskId]: 'flag' }));
      enqueueSnackbar('Flag updated', { variant: 'success' });
    } catch (error: any) {
      console.error('Failed to update flag', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to update flag', { variant: 'error' });
    } finally {
      setSavingMap((prev) => ({ ...prev, [taskId]: null }));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      enqueueSnackbar('Task deleted', { variant: 'success' });
    } catch (error: any) {
      console.error('Failed to delete task', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete task', { variant: 'error' });
    }
  };

  const canDelete = user?.role === 'admin';

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.accessor('title', {
        id: 'title',
        header: () => 'Task',
        size: columnSizing.title ?? 360,
        cell: (info) => {
          const task = info.row.original;
          const busy = savingMap[task.id] === 'title';
          const justSaved = lastSavedField[task.id] === 'title';
          return (
            <TitleCell
              task={task}
              canEdit={!!task.canEdit}
              busy={busy}
              justSaved={!!justSaved}
              onSave={(value) => patchTask(task.id, { title: value }, 'title')}
            />
          );
        },
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: () => 'Status',
        size: columnSizing.status ?? 160,
        cell: (info) => {
          const task = info.row.original;
          const busy = savingMap[task.id] === 'status';
          const justSaved = lastSavedField[task.id] === 'status';
          return (
            <StatusCell
              task={task}
              canEdit={!!task.canEdit}
              busy={busy}
              justSaved={!!justSaved}
              onChange={(next) => updateStatus(task.id, next)}
            />
          );
        },
      }),
      columnHelper.accessor('approvalStatus', {
        id: 'approvalStatus',
        header: () => 'Approval Status',
        size: columnSizing.approvalStatus ?? 160,
        cell: (info) => {
          const status = info.getValue<string | undefined>() ?? 'none';
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900',
                STATUS_BADGE_CLASSES[status] ?? 'bg-slate-700/70 text-slate-200'
              )}
            >
              {status.replace(/_/g, ' ')}
            </span>
          );
        },
      }),
      columnHelper.accessor('assignee', {
        id: 'assignee',
        header: () => 'Assignee',
        size: columnSizing.assignee ?? 180,
        cell: (info) => {
          const task = info.row.original;
          const busy = savingMap[task.id] === 'assignee';
          const justSaved = lastSavedField[task.id] === 'assignee';
          return (
            <AssigneeCell
              task={task}
              canEdit={!!task.canEdit}
              busy={busy}
              justSaved={!!justSaved}
              users={users}
              onChange={(assigneeId) => updateAssignee(task.id, assigneeId)}
            />
          );
        },
      }),
      columnHelper.accessor('flag', {
        id: 'flag',
        header: () => 'Flag',
        size: columnSizing.flag ?? 160,
        cell: (info) => {
          const task = info.row.original;
          const busy = savingMap[task.id] === 'flag';
          const justSaved = lastSavedField[task.id] === 'flag';
          return (
            <FlagCell
              task={task}
              canEdit={!!task.canEdit}
              busy={busy}
              justSaved={!!justSaved}
              onChange={(flag) => updateFlag(task.id, flag)}
            />
          );
        },
      }),
      columnHelper.accessor('startDate', {
        id: 'startDate',
        header: () => 'Start',
        size: columnSizing.startDate ?? 150,
        cell: (info) => (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CalendarIcon className="text-slate-500" />
            {formatDate(info.getValue()) || '—'}
          </div>
        ),
      }),
      columnHelper.accessor('dueDate', {
        id: 'dueDate',
        header: () => 'Due',
        size: columnSizing.dueDate ?? 160,
        cell: (info) => {
          const task = info.row.original;
          const busy = savingMap[task.id] === 'dueDate';
          const justSaved = lastSavedField[task.id] === 'dueDate';
          return (
            <DueDateCell
              task={task}
              canEdit={!!task.canEdit}
              busy={busy}
              justSaved={!!justSaved}
              onChange={(value) => updateDueDate(task.id, value)}
            />
          );
        },
      }),
      columnHelper.accessor('updatedAt', {
        id: 'updatedAt',
        header: () => 'Updated',
        size: columnSizing.updatedAt ?? 170,
        cell: (info) => (
          <span className="text-sm text-slate-400">
            {info.getValue() ? new Date(info.getValue()!).toLocaleString() : '—'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => 'Actions',
        size: columnSizing.actions ?? 140,
        cell: (info) => {
          const task = info.row.original;
          const busy = savingMap[task.id];
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="rounded-full border border-slate-600/70 bg-slate-800/40 p-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                title="View details"
              >
                <ViewIcon />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/tasks/${task.id}/edit`)}
                disabled={!task.canEdit}
                className={cn(
                  'rounded-full border border-slate-600/70 bg-slate-800/40 p-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/70',
                  !task.canEdit && 'cursor-not-allowed opacity-50'
                )}
                title={task.canEdit ? 'Edit task' : "You don't have permission to edit this task"}
              >
                <EditIcon />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  disabled={!!busy}
                  className={cn(
                    'rounded-full border border-rose-600/40 bg-rose-500/10 p-2 text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-400/70',
                    busy && 'cursor-wait opacity-70'
                  )}
                  title="Delete task"
                >
                  <DeleteIcon />
                </button>
              )}
            </div>
          );
        },
      }),
    ];

    return baseColumns.filter((column) => columnVisibilityState[column.id as string] !== false);
  }, [
    users,
    patchTask,
    updateStatus,
    updateAssignee,
    updateDueDate,
    updateFlag,
    deleteTask,
    navigate,
    savingMap,
    lastSavedField,
    columnSizing,
    columnVisibilityState,
    canDelete,
  ]);

  const table = useReactTable({
    data: filteredTasks,
    columns,
    state: {
      sorting,
      columnSizing,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 64,
    overscan: 12,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? (rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)) ?? 0
      : 0;

  const [dragColumnId, setDragColumnId] = useState<string | null>(null);

  const handleHeaderDragStart = (columnId: string, event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    setDragColumnId(columnId);
  };

  const handleHeaderDrop = (targetColumnId: string) => {
    if (!dragColumnId || dragColumnId === targetColumnId) return;
    const currentOrder = [...columnOrder];
    const fromIndex = currentOrder.indexOf(dragColumnId);
    const toIndex = currentOrder.indexOf(targetColumnId);
    if (fromIndex === -1 || toIndex === -1) return;

    currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, dragColumnId);
    setColumnOrder(currentOrder);
    table.setColumnOrder(currentOrder);

    const storedKeys = storedColumns.map((col) => col.key);
    const globalFromIndex = storedKeys.indexOf(dragColumnId);
    const globalToIndex = storedKeys.indexOf(targetColumnId);
    if (globalFromIndex !== -1 && globalToIndex !== -1) {
      reorderColumns(globalFromIndex, globalToIndex);
    }

    setDragColumnId(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <SpinnerMini className="h-6 w-6 border-4 border-cyan-500/60" />
          <p className="text-sm text-slate-400">Loading tasks…</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex h-full flex-col bg-slate-900">
        <TasksToolbar users={users} />
        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6 pt-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 shadow-lg shadow-cyan-900/20 transition-all duration-200 hover:border-cyan-500/50 hover:shadow-cyan-900/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{task.title}</h3>
                  <p className="text-xs text-slate-500">{task.project?.name ?? '—'}</p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    STATUS_BADGE_CLASSES[task.status] ?? 'bg-slate-700/70 text-slate-200'
                  )}
                >
                  {STATUS_LABELS[task.status] ?? task.status}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Assignee</dt>
                  <dd>{task.assignee?.name ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Due</dt>
                  <dd>{formatDate(task.dueDate) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Flag</dt>
                  <dd>{FLAG_LABELS[(task.flag ?? 'NONE') as TaskFlag]}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Updated</dt>
                  <dd>{formatDate(task.updatedAt)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="rounded-xl border border-slate-600/70 bg-slate-800/40 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/tasks/${task.id}/edit`)}
                  disabled={!task.canEdit}
                  className={cn(
                    'rounded-xl border border-slate-600/70 bg-slate-800/40 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300',
                    !task.canEdit && 'cursor-not-allowed opacity-60'
                  )}
                >
                  Edit
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="rounded-xl border border-rose-500/60 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No tasks match your filters.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md">
        <TasksToolbar users={users} />
      </div>

      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto overflow-x-auto px-4 pb-6 pt-4 sm:px-6"
        style={{ contain: 'paint' }}
      >
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/40 shadow-xl shadow-cyan-900/20">
          <table className="min-w-[1200px] text-sm text-slate-200">
            <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const columnId = header.column.id;
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: `${header.getSize()}px` }}
                        draggable
                        onDragStart={(event) => handleHeaderDragStart(columnId, event)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleHeaderDrop(columnId)}
                        className={cn(
                          'group relative select-none border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 transition',
                          dragColumnId === columnId && 'bg-slate-800/80'
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className="flex items-center gap-2"
                            onClick={header.column.getToggleSortingHandler()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') header.column.toggleSorting();
                            }}
                          >
                            {header.column.columnDef.header?.(header.getContext())}
                            {{
                              asc: '▲',
                              desc: '▼',
                            }[header.column.getIsSorted() as string] && (
                              <span className="text-[10px] text-cyan-300">
                                {{
                                  asc: '▲',
                                  desc: '▼',
                                }[header.column.getIsSorted() as string]}
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-1 top-1/2 h-6 w-1.5 -translate-y-1/2 cursor-col-resize rounded bg-slate-700/40 opacity-0 transition group-hover:opacity-100"
                          aria-hidden
                        />
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    data-index={virtualRow.index}
                    className="group transition-all duration-200 odd:bg-slate-800/30 even:bg-slate-800/10 hover:bg-slate-700/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {cell.column.columnDef.cell?.(cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>
    </div>
  );
};

export default TasksTableView;

