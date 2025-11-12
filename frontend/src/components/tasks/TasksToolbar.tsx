import { useEffect, useMemo, useRef, useState } from 'react';
import { useFilterStore } from '../../stores/filterStore';
import { TASK_FLAGS } from '../../types/task';
import type { TaskFlag } from '../../types/task';
import ModernDatePicker from './ModernDatePicker';

interface TasksToolbarProps {
  users: Array<{ id: string; name: string; email: string }>;
  showColumnsButton?: boolean;
}

const STATUS_META = {
  open: { label: 'Open', chipClass: 'bg-slate-700/70 text-slate-200' },
  in_progress: { label: 'In Progress', chipClass: 'bg-amber-400/80 text-slate-900' },
  pending_approval: { label: 'Pending Approval', chipClass: 'bg-violet-400/80 text-slate-900' },
  approved: { label: 'Approved', chipClass: 'bg-emerald-300/80 text-emerald-900' },
  rejected: { label: 'Rejected', chipClass: 'bg-rose-400/80 text-white' },
} as const;

const FLAG_META: Record<TaskFlag, { label: string; icon: string }> = {
  NONE: { label: 'None', icon: '•' },
  HIGH: { label: 'High Priority', icon: '⚑' },
  BLOCKED: { label: 'Blocked', icon: '⛔' },
  CLIENT_WAIT: { label: 'Client Wait', icon: '⏳' },
  INTERNAL_WAIT: { label: 'Internal Wait', icon: '🕒' },
};

const DropdownCaret = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
  >
    <path d="M5 7.5 10 12l5-4.5" />
  </svg>
);

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <button
    type="button"
    onClick={onRemove}
    className="inline-flex items-center gap-2 rounded-full border border-slate-600/60 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm shadow-slate-900/40 transition hover:border-cyan-400 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
  >
    {label}
    <span className="text-slate-400">✕</span>
  </button>
);

const FilterButton = ({
  label,
  count,
  active,
  open,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  open: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
      active
        ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
        : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800/80'
    }`}
  >
    <span>{label}</span>
    {count > 0 && (
      <span className="rounded-full bg-cyan-500/30 px-2 py-0.5 text-xs text-cyan-100">{count}</span>
    )}
    <DropdownCaret open={open} />
  </button>
);

const TasksToolbar = ({ users, showColumnsButton = false }: TasksToolbarProps) => {
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

  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; remove: () => void }> = [];

    selectedStatuses.forEach((status) => {
      const meta = STATUS_META[status as keyof typeof STATUS_META];
      chips.push({
        key: `status-${status}`,
        label: `Status: ${meta?.label ?? status}`,
        remove: () => toggleStatus(status),
      });
    });

    selectedAssignees.forEach((assigneeId) => {
      const user = users.find((candidate) => candidate.id === assigneeId);
      chips.push({
        key: `assignee-${assigneeId}`,
        label: `Assignee: ${user?.name ?? assigneeId}`,
        remove: () => toggleAssignee(assigneeId),
      });
    });

    selectedFlags.forEach((flag) => {
      chips.push({
        key: `flag-${flag}`,
        label: `Flag: ${FLAG_META[flag].label}`,
        remove: () => toggleFlag(flag),
      });
    });

    if (startDateFrom || startDateTo) {
      chips.push({
        key: 'start-range',
        label: `Start: ${startDateFrom ?? '…'} → ${startDateTo ?? '…'}`,
        remove: () => setStartDateRange(null, null),
      });
    }

    if (dueDateFrom || dueDateTo) {
      chips.push({
        key: 'due-range',
        label: `Due: ${dueDateFrom ?? '…'} → ${dueDateTo ?? '…'}`,
        remove: () => setDueDateRange(null, null),
      });
    }

    return chips;
  }, [
    selectedStatuses,
    selectedAssignees,
    selectedFlags,
    startDateFrom,
    startDateTo,
    dueDateFrom,
    dueDateTo,
    users,
    toggleStatus,
    toggleAssignee,
    toggleFlag,
    setStartDateRange,
    setDueDateRange,
  ]);

  const hasFilters = filterChips.length > 0;

  return (
    <div className="space-y-3 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-800/70">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks, assignees, keywords…"
              className="w-full bg-transparent px-10 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.65" y2="16.65" />
            </svg>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              ⌘F
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <FilterButton
                label="Status"
                count={selectedStatuses.length}
                active={selectedStatuses.length > 0}
                open={statusOpen}
                onClick={() => {
                  setStatusOpen((open) => !open);
                  setAssigneeOpen(false);
                  setFlagOpen(false);
                }}
              />
              {statusOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setStatusOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl shadow-cyan-900/40 backdrop-blur">
                    <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-slate-500">
                      Filter by status
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(STATUS_META).map(([value, meta]) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/80"
                        >
                          <span>{meta.label}</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400"
                            checked={selectedStatuses.includes(value)}
                            onChange={() => toggleStatus(value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <FilterButton
                label="Assignee"
                count={selectedAssignees.length}
                active={selectedAssignees.length > 0}
                open={assigneeOpen}
                onClick={() => {
                  setAssigneeOpen((open) => !open);
                  setStatusOpen(false);
                  setFlagOpen(false);
                }}
              />
              {assigneeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setAssigneeOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-30 mt-2 w-72 max-h-72 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl shadow-cyan-900/40 backdrop-blur">
                    <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-slate-500">
                      Filter by assignee
                    </p>
                    <div className="space-y-1.5">
                      {users.map((option) => (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/80"
                        >
                          <span>{option.name}</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400"
                            checked={selectedAssignees.includes(option.id)}
                            onChange={() => toggleAssignee(option.id)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <FilterButton
                label="Flag"
                count={selectedFlags.length}
                active={selectedFlags.length > 0}
                open={flagOpen}
                onClick={() => {
                  setFlagOpen((open) => !open);
                  setStatusOpen(false);
                  setAssigneeOpen(false);
                }}
              />
              {flagOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setFlagOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl shadow-cyan-900/40 backdrop-blur">
                    <p className="mb-2 px-1 text-[11px] uppercase tracking-wide text-slate-500">
                      Filter by flag
                    </p>
                    <div className="space-y-1.5">
                      {TASK_FLAGS.map((flag) => (
                        <label
                          key={flag}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/80"
                        >
                          <span className="flex items-center gap-2">
                            <span>{FLAG_META[flag].icon}</span>
                            {FLAG_META[flag].label}
                          </span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400"
                            checked={selectedFlags.includes(flag)}
                            onChange={() => toggleFlag(flag)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
              <svg
                className="h-4 w-4 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <ModernDatePicker
                value={startDateFrom}
                onChange={(value) => setStartDateRange(value, startDateTo)}
                placeholder="Start"
              />
              <span className="text-slate-500">→</span>
              <ModernDatePicker
                value={dueDateTo}
                onChange={(value) => setDueDateRange(dueDateFrom, value)}
                placeholder="Due"
              />
            </div>
          </div>
        </div>

        {showColumnsButton && (
          <button
            type="button"
            className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Columns
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filterChips.map((chip) => (
          <FilterChip key={chip.key} label={chip.label} onRemove={chip.remove} />
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              clearAllFilters();
              setStatusOpen(false);
              setAssigneeOpen(false);
              setFlagOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            Clear all
          </button>
        )}
        {!hasFilters && (
          <span className="text-xs text-slate-500">
            Tip: use filters or ⌘F to pinpoint tasks quickly.
          </span>
        )}
      </div>
    </div>
  );
};

export default TasksToolbar;
