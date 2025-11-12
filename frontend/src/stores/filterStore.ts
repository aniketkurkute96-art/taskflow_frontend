import { create } from 'zustand';
import type { TaskFlag } from '../types/task';

interface FilterStore {
  searchQuery: string;
  selectedStatuses: string[];
  selectedAssignees: string[];
  selectedFlags: TaskFlag[];
  selectedProject: string | null;
  startDateFrom: string | null;
  startDateTo: string | null;
  dueDateFrom: string | null;
  dueDateTo: string | null;

  setSearchQuery: (query: string) => void;
  toggleStatus: (status: string) => void;
  toggleAssignee: (assigneeId: string) => void;
  toggleFlag: (flag: TaskFlag) => void;
  setProject: (projectId: string | null) => void;
  setStartDateRange: (from: string | null, to: string | null) => void;
  setDueDateRange: (from: string | null, to: string | null) => void;
  clearAllFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  searchQuery: '',
  selectedStatuses: [],
  selectedAssignees: [],
  selectedFlags: [],
  selectedProject: null,
  startDateFrom: null,
  startDateTo: null,
  dueDateFrom: null,
  dueDateTo: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleStatus: (status) =>
    set((state) => ({
      selectedStatuses: state.selectedStatuses.includes(status)
        ? state.selectedStatuses.filter((s) => s !== status)
        : [...state.selectedStatuses, status],
    })),

  toggleAssignee: (assigneeId) =>
    set((state) => ({
      selectedAssignees: state.selectedAssignees.includes(assigneeId)
        ? state.selectedAssignees.filter((a) => a !== assigneeId)
        : [...state.selectedAssignees, assigneeId],
    })),

  toggleFlag: (flag) =>
    set((state) => ({
      selectedFlags: state.selectedFlags.includes(flag)
        ? state.selectedFlags.filter((f) => f !== flag)
        : [...state.selectedFlags, flag],
    })),

  setProject: (projectId) => set({ selectedProject: projectId }),

  setStartDateRange: (from, to) =>
    set({ startDateFrom: from, startDateTo: to }),

  setDueDateRange: (from, to) => set({ dueDateFrom: from, dueDateTo: to }),

  clearAllFilters: () =>
    set({
      searchQuery: '',
      selectedStatuses: [],
      selectedAssignees: [],
      selectedFlags: [],
      startDateFrom: null,
      startDateTo: null,
      dueDateFrom: null,
      dueDateTo: null,
    }),
}));

