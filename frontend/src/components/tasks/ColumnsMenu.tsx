import { useColumnStore } from '../../stores/columnStore';

interface ColumnsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ColumnsMenu = ({ isOpen, onClose }: ColumnsMenuProps) => {
  const { columns, setColumnVisibility, resetColumns } = useColumnStore();

  if (!isOpen) return null;

  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <div className="fixed right-6 top-32 z-50 w-72 rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Manage Columns
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg
              className="h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex items-center justify-between rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={column.visible}
                  onChange={(e) => setColumnVisibility(column.key, e.target.checked)}
                  disabled={column.key === 'title'} // Title always visible
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {column.label}
                </span>
              </div>
              {column.key === 'title' && (
                <span className="text-xs text-slate-400">Required</span>
              )}
            </label>
          ))}
        </div>

        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>{visibleCount} of {columns.length} visible</span>
          </div>
          <button
            onClick={resetColumns}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </>
  );
};

export default ColumnsMenu;

