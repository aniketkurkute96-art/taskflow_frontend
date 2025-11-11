import ProjectsSidebar from '../components/sidebar/ProjectsSidebar';
import { useProjectStore } from '../stores/projectStore';

const EagleEyeHome = () => {
  const { selectedProjectId, getProjectById } = useProjectStore();
  const selectedProject = selectedProjectId
    ? getProjectById(selectedProjectId)
    : null;

  return (
    <div className="flex h-full">
      {/* Projects Sidebar */}
      <ProjectsSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Project Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedProject && (
                <div
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: selectedProject.color || '#6366f1' }}
                />
              )}
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {selectedProject?.name || 'No Project Selected'}
              </h1>
            </div>
            <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              + New Task
            </button>
          </div>
        </div>

        {/* Task List Placeholder */}
        <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900/40">
          <div className="max-w-md text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center dark:bg-indigo-900/30">
              <svg
                className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
              Task List View
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              The enhanced task list with filters, inline editing, and saved views will appear here in PR 3.
            </p>
            <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
              PR2 — Projects sidebar complete ✓
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EagleEyeHome;


