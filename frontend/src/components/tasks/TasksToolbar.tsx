import { useState } from 'react';
import { useFilterStore } from '../../stores/filterStore';
import { useColumnStore } from '../../stores/columnStore';
import { TASK_FLAGS } from '../../types/task';
import type { TaskFlag } from '../../types/task';

interface TasksToolbarProps {
  users: Array<{ id: string; name: string; email: string }>;
  showColumnsButton?: boolean;
}

const TASK_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'bg-purple-100 text-purple-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
];

const FLAG_LABELS: Record<TaskFlag, { label: string; icon: string }> = {
  NONE: { label: 'None', icon: '○' },
  HIGH: { label: 'High Priority', icon: '⚑' },
  BLOCKED: { label: 'Blocked', icon: '⛔' },
  CLIENT_WAIT: { label: 'Client Wait', icon: '⏳' },
  INTERNAL_WAIT: { label: 'Internal Wait', icon: '🕒' },
};

const TasksToolbar = ({ users, showColumnsButton = true }: TasksToolbarProps) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    toggleStatus,
    selectedAssignees,
    toggleAssignee,
    selectedFlags,
    toggleFlag,
    startDateFrom,
    startDateTo,
    setStartDateRange,
    dueDateFrom,
    dueDateTo,
    setDueDateRange,
    clearAllFilters,
  } = useFilterStore();

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showFlagMenu, setShowFlagMenu] = useState(false);

  const activeFilterCount =
    selectedStatuses.length +
    selectedAssignees.length +
    selectedFlags.length +
    (startDateFrom || startDateTo ? 1 : 0) +
    (dueDateFrom || dueDateTo ? 1 : 0);

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pl-9 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              selectedStatuses.length > 0
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <span>Status</span>
            {selectedStatuses.length > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                {selectedStatuses.length}
              </span>
            )}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="p-2">
                  {TASK_STATUSES.map((status) => (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => toggleStatus(status.value)}
                        className="rounded border-slate-300"
                      />
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Assignee Filter */}
        <div className="relative">
          <button
            onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              selectedAssignees.length > 0
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <span>Assignee</span>
            {selectedAssignees.length > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                {selectedAssignees.length}
              </span>
            )}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAssigneeMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAssigneeMenu(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 max-h-64 overflow-y-auto">
                <div className="p-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(user.id)}
                        onChange={() => toggleAssignee(user.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {user.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Flag Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFlagMenu(!showFlagMenu)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              selectedFlags.length > 0
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <span>Flag</span>
            {selectedFlags.length > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                {selectedFlags.length}
              </span>
            )}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFlagMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFlagMenu(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="p-2">
                  {TASK_FLAGS.map((flag) => (
                    <label
                      key={flag}
                      className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFlags.includes(flag)}
                        onChange={() => toggleFlag(flag)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-lg">{FLAG_LABELS[flag].icon}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {FLAG_LABELS[flag].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800">
          <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={startDateFrom || ''}
            onChange={(e) => setStartDateRange(e.target.value || null, startDateTo)}
            className="w-[130px] border-0 bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-0 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
          />
          <span className="text-slate-400 text-sm">→</span>
          <input
            type="date"
            value={dueDateTo || ''}
            onChange={(e) => setDueDateRange(dueDateFrom, e.target.value || null)}
            className="w-[130px] border-0 bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-0 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default TasksToolbar;

