import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useAuth } from '../../contexts/AuthContext';
import NewProjectModal from './NewProjectModal';

const ProjectsSidebar = () => {
  const { projects, selectedProjectId, selectProject } = useProjectStore();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div
        className={`flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Projects
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="h-4 w-4 text-slate-600 dark:text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isCollapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects..."
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
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto px-2">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedProjectId === project.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  />
                  <span className="flex-1 truncate font-medium">
                    {project.name}
                  </span>
                </button>
              ))}

              {filteredProjects.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No projects found
                </div>
              )}
            </div>

            {/* Add Project Button - Admin Only */}
            {isAdmin && (
              <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex w-full items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Project
                </button>
              </div>
            )}
          </>
        )}

        {isCollapsed && (
          <div className="flex flex-1 flex-col items-center gap-2 py-4">
            {projects.slice(0, 5).map((project) => (
              <button
                key={project.id}
                onClick={() => selectProject(project.id)}
                className={`h-10 w-10 rounded-md transition-all ${
                  selectedProjectId === project.id
                    ? 'bg-indigo-100 ring-2 ring-indigo-500 dark:bg-indigo-900/50'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={project.name}
              >
                <div
                  className="mx-auto h-4 w-4 rounded-full"
                  style={{ backgroundColor: project.color || '#6366f1' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ProjectsSidebar;

