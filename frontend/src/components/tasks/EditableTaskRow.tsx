import { useEffect, useMemo, useState } from 'react';
import type { ColumnConfig } from '../../stores/columnStore';
import api from '../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  approvalStatus?: string;
  approvalType?: string;
  flag?: string;
  startDate?: string | null;
  dueDate?: string | null;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

interface EditableTaskRowProps {
  task: Task;
  users: User[];
  columns: ColumnConfig[];
  onLocalUpdate: (updated: Partial<Task>) => void;
}

const TASK_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const EditableTaskRow = ({ task, users, columns, onLocalUpdate }: EditableTaskRowProps) => {
  const [busyField, setBusyField] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState(task.title);
  const [localAssigneeId, setLocalAssigneeId] = useState(task.assignee?.id || '');
  const [localStatus, setLocalStatus] = useState(task.status);
  const [localDueDate, setLocalDueDate] = useState(formatDate(task.dueDate));

  useEffect(() => {
    setLocalTitle(task.title);
    setLocalAssigneeId(task.assignee?.id || '');
    setLocalStatus(task.status);
    setLocalDueDate(formatDate(task.dueDate));
  }, [task]);

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    users.forEach((u) => (map[u.id] = u));
    return map;
  }, [users]);

  const savePatch = async (patch: any) => {
    setBusyField(Object.keys(patch)[0] || 'patch');
    try {
      await api.patch(`/tasks/${task.id}`, patch);
      onLocalUpdate(patch);
    } finally {
      setBusyField(null);
    }
  };

  const saveStatus = async (status: string) => {
    setBusyField('status');
    try {
      await api.patch(`/tasks/${task.id}/status`, { status });
      onLocalUpdate({ status });
    } finally {
      setBusyField(null);
    }
  };

  const renderCell = (columnKey: string) => {
    switch (columnKey) {
      case 'title':
        return (
          <input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={() => {
              if (localTitle.trim() && localTitle !== task.title) {
                savePatch({ title: localTitle.trim() });
              }
            }}
            className="w-full truncate rounded border border-transparent bg-transparent px-1 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none dark:text-slate-100"
          />
        );
      case 'assignee':
        return (
          <select
            value={localAssigneeId}
            onChange={(e) => {
              const next = e.target.value;
              setLocalAssigneeId(next);
              savePatch({ assigneeId: next || null });
            }}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        );
      case 'status':
        return (
          <select
            value={localStatus}
            onChange={(e) => {
              const next = e.target.value;
              setLocalStatus(next);
              saveStatus(next);
            }}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        );
      case 'dueDate':
        return (
          <input
            type="date"
            value={localDueDate}
            onChange={(e) => {
              const next = e.target.value;
              setLocalDueDate(next);
              const iso = next ? new Date(next + 'T00:00:00').toISOString() : null;
              savePatch({ dueDate: iso });
            }}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        );
      default:
        // Fallback to non-editable text via task fields
        // Consumers can mix editable and non-editable columns freely
        return (
          <span className="truncate text-sm text-slate-700 dark:text-slate-300">
            {(task as any)[columnKey] ?? '—'}
          </span>
        );
    }
  };

  return (
    <div className="flex items-center border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
      {columns.map((column) => (
        <div
          key={column.key}
          style={{ width: column.width }}
          className="px-2 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            {renderCell(column.key)}
            {busyField && (
              <svg
                className="h-3.5 w-3.5 animate-spin text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeWidth="2" d="M12 3v3M12 18v3M3 12H6M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12" />
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditableTaskRow;


