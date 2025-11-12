import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useColumnStore } from '../../stores/columnStore';
import { useFilterStore } from '../../stores/filterStore';
import TasksToolbar from './TasksToolbar';
import EditableTaskRow from './EditableTaskRow';
import api from '../../services/api';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  approvalStatus?: string;
  approvalType?: string;
  flag?: string;
  startDate?: string | null;
  dueDate?: string | null;
  updatedAt: string;
  assignee?: { id: string; name: string; email: string } | null;
  project?: { id: string; name: string } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const MIN_COL_WIDTH = 90;

const TasksTableView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartWidth, setDragStartWidth] = useState<number>(0);

  const { columns, setColumnWidth } = useColumnStore();
  const filters = useFilterStore();

  // Data load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksRes, usersRes] = await Promise.all([api.get('/tasks'), api.get('/users')]);
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Failed to load tasks/users', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignee?.name.toLowerCase().includes(q)
      );
    }
    if (filters.selectedStatuses.length > 0) {
      result = result.filter((t) => filters.selectedStatuses.includes(t.status));
    }
    if (filters.selectedAssignees.length > 0) {
      result = result.filter((t) => (t.assignee ? filters.selectedAssignees.includes(t.assignee.id) : false));
    }
    if (filters.selectedFlags.length > 0) {
      result = result.filter((t) => (t.flag ? filters.selectedFlags.includes(t.flag as any) : false));
    }
    if (filters.startDateFrom) {
      result = result.filter((t) => t.startDate && t.startDate >= filters.startDateFrom!);
    }
    if (filters.startDateTo) {
      result = result.filter((t) => t.startDate && t.startDate <= filters.startDateTo!);
    }
    if (filters.dueDateFrom) {
      result = result.filter((t) => t.dueDate && t.dueDate >= filters.dueDateFrom!);
    }
    if (filters.dueDateTo) {
      result = result.filter((t) => t.dueDate && t.dueDate <= filters.dueDateTo!);
    }
    return result;
  }, [tasks, filters]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

  // Column resize handlers
  const handleMouseDown = (e: React.MouseEvent, key: string, width: number) => {
    setDragKey(key);
    setDragStartX(e.clientX);
    setDragStartWidth(width);
    window.addEventListener('mousemove', handleMouseMove as any);
    window.addEventListener('mouseup', handleMouseUp as any, { once: true });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragKey) return;
    const delta = e.clientX - dragStartX;
    const next = Math.max(MIN_COL_WIDTH, Math.round(dragStartWidth + delta));
    setColumnWidth(dragKey, next);
  };

  const handleMouseUp = () => {
    setDragKey(null);
    window.removeEventListener('mousemove', handleMouseMove as any);
  };

  const applyLocalUpdate = (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch, assignee: patch.assigneeId ? users.find(u => u.id === (patch as any).assigneeId) as any ?? t.assignee : t.assignee } : t))
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      <TasksToolbar users={users} />

      {/* Resizable Header */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-stretch px-4 py-2 select-none">
          {visibleColumns.map((column) => (
            <div
              key={column.key}
              style={{ width: column.width }}
              className="relative px-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400"
            >
              {column.label}
              {/* Resize handle */}
              <div
                onMouseDown={(e) => handleMouseDown(e, column.key, column.width)}
                className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-indigo-300/40"
                title="Drag to resize"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div ref={parentRef} className="flex-1 overflow-auto" style={{ height: '100%' }}>
        {filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">No tasks found</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {filters.searchQuery || filters.selectedStatuses.length > 0 ? 'Try adjusting your filters' : 'Get started by creating a new task'}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const task = filteredTasks[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <EditableTaskRow
                    task={task}
                    users={users}
                    columns={visibleColumns}
                    onLocalUpdate={(patch) => applyLocalUpdate(task.id, patch)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">Showing {filteredTasks.length} of {tasks.length} tasks</p>
      </div>
    </div>
  );
};

export default TasksTableView;


