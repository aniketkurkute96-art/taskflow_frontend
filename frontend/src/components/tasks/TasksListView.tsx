import { useState, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useColumnStore } from '../../stores/columnStore';
import { useFilterStore } from '../../stores/filterStore';
import TasksToolbar from './TasksToolbar';
import ColumnsMenu from './ColumnsMenu';
import TaskRow from './TaskRow';
import api from '../../services/api';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
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

interface User {
  id: string;
  name: string;
  email: string;
}

const TasksListView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  const { columns } = useColumnStore();
  const filters = useFilterStore();

  // Fetch tasks and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksRes, usersRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/users'),
        ]);
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.assignee?.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.selectedStatuses.length > 0) {
      result = result.filter((task) =>
        filters.selectedStatuses.includes(task.status)
      );
    }

    // Assignee filter
    if (filters.selectedAssignees.length > 0) {
      result = result.filter((task) =>
        task.assignee ? filters.selectedAssignees.includes(task.assignee.id) : false
      );
    }

    // Flag filter
    if (filters.selectedFlags.length > 0) {
      result = result.filter((task) =>
        task.flag ? filters.selectedFlags.includes(task.flag as any) : false
      );
    }

    // Date filters
    if (filters.startDateFrom) {
      result = result.filter(
        (task) => task.startDate && task.startDate >= filters.startDateFrom!
      );
    }
    if (filters.startDateTo) {
      result = result.filter(
        (task) => task.startDate && task.startDate <= filters.startDateTo!
      );
    }
    if (filters.dueDateFrom) {
      result = result.filter(
        (task) => task.dueDate && task.dueDate >= filters.dueDateFrom!
      );
    }
    if (filters.dueDateTo) {
      result = result.filter(
        (task) => task.dueDate && task.dueDate <= filters.dueDateTo!
      );
    }

    return result;
  }, [tasks, filters]);

  // Virtual scrolling setup
  const parentRef = useState<HTMLDivElement | null>(null)[0];
  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 48, // Row height
    overscan: 10,
  });

  const visibleColumns = columns.filter((c) => c.visible).sort((a, b) => a.order - b.order);

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
      <TasksToolbar
        users={users}
        onColumnsClick={() => setShowColumnsMenu(true)}
      />

      <ColumnsMenu
        isOpen={showColumnsMenu}
        onClose={() => setShowColumnsMenu(false)}
      />

      {/* Table Header */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center px-6 py-3">
          {visibleColumns.map((column) => (
            <div
              key={column.key}
              style={{ width: column.width }}
              className="px-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-400"
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Table Body - Virtualized */}
      <div
        ref={(node) => {
          if (node) {
            (parentRef as any) = node;
          }
        }}
        className="flex-1 overflow-auto"
        style={{ height: '100%' }}
      >
        {filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
                No tasks found
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {filters.searchQuery || filters.selectedStatuses.length > 0
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new task'}
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
                  <TaskRow task={task} columns={visibleColumns} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="border-t border-slate-200 bg-white px-6 py-2 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
      </div>
    </div>
  );
};

export default TasksListView;

