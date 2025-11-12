import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width: number;
  order: number;
}

interface ColumnStore {
  columns: ColumnConfig[];
  setColumnVisibility: (key: string, visible: boolean) => void;
  setColumnWidth: (key: string, width: number) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resetColumns: () => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'title', label: 'Task', visible: true, width: 300, order: 0 },
  { key: 'status', label: 'Status', visible: true, width: 140, order: 1 },
  { key: 'approvalStatus', label: 'Approval Status', visible: true, width: 160, order: 2 },
  { key: 'assignee', label: 'Assignee', visible: true, width: 150, order: 3 },
  { key: 'flag', label: 'Flag', visible: true, width: 120, order: 4 },
  { key: 'startDate', label: 'Start Date', visible: true, width: 120, order: 5 },
  { key: 'dueDate', label: 'End Date', visible: true, width: 120, order: 6 },
  { key: 'project', label: 'Project', visible: false, width: 140, order: 7 },
  { key: 'updatedAt', label: 'Updated', visible: true, width: 160, order: 8 },
  { key: 'actions', label: 'Actions', visible: true, width: 140, order: 9 },
];

export const useColumnStore = create<ColumnStore>()(
  persist(
    (set) => ({
      columns: DEFAULT_COLUMNS,

      setColumnVisibility: (key, visible) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.key === key ? { ...col, visible } : col
          ),
        })),

      setColumnWidth: (key, width) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.key === key ? { ...col, width } : col
          ),
        })),

      reorderColumns: (fromIndex, toIndex) =>
        set((state) => {
          const newColumns = [...state.columns];
          const [moved] = newColumns.splice(fromIndex, 1);
          newColumns.splice(toIndex, 0, moved);
          return {
            columns: newColumns.map((col, index) => ({ ...col, order: index })),
          };
        }),

      resetColumns: () => set({ columns: DEFAULT_COLUMNS }),
    }),
    {
      name: 'nagrik-columns-store',
    }
  )
);

